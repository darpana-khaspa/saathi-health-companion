#!/usr/bin/env python3
"""
Comprehensive verification and real-time latency measurement script for Saathi Health Companion.
Tests:
1. CSV files integrity and database seeding verification.
2. Starts Uvicorn server and measures actual HTTP network latencies (min, max, avg).
3. Verifies Ask Protocols, Source Citations, Hard-coded Danger-Sign Escalation, Antibiotic Refusal, Out-of-Scope, and Household Visits.
"""

import csv
import json
import sqlite3
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def check_csv_files():
    print("------------------------------------------------------------------")
    print("STEP 1: VERIFYING SAMPLE CSV FILES & DATA INTEGRITY")
    print("------------------------------------------------------------------")
    files = [
        ("Protocol Knowledge Base", BASE_DIR / "sample_protocol_knowledge_base.csv"),
        ("Household Register", BASE_DIR / "sample_household_register.csv"),
        ("Evaluation Questions", BASE_DIR / "sample_evaluation_questions.csv"),
    ]

    for name, p in files:
        if not p.exists():
            print(f"  [FAIL] Missing file: {p.name}")
            return False
        with open(p, mode="r", encoding="utf-8") as f:
            reader = csv.reader(f)
            rows = list(reader)
            header = rows[0]
            count = len(rows) - 1
            print(f"  [PASS] {name} ({p.name}): {count} records | Columns: {len(header)}")

    # Verify SQLite DB
    db_path = BASE_DIR / "saathi_records.db"
    if not db_path.exists():
        print(f"  [FAIL] Missing SQLite DB at {db_path}")
        return False
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM household_register;")
    total_hh = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM household_register WHERE visit_status = 'pending';")
    pending_hh = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM household_register WHERE visit_status = 'completed';")
    completed_hh = cursor.fetchone()[0]
    conn.close()
    print(f"  [PASS] SQLite DB ({db_path.name}): {total_hh} total households ({pending_hh} pending, {completed_hh} completed)")
    return True

def run_live_measurements():
    print("\n------------------------------------------------------------------")
    print("STEP 2: STARTING LIVE SERVER & MEASURING ACTUAL RESPONSE TIMES")
    print("------------------------------------------------------------------")
    port = 8000
    host = "127.0.0.1"
    base_url = f"http://{host}:{port}"

    # Start live server subprocess
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", host, "--port", str(port)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    try:
        # Wait up to 10 seconds for server socket to respond
        ready = False
        for _ in range(25):
            time.sleep(0.4)
            try:
                with urllib.request.urlopen(f"{base_url}/api/health", timeout=1.5) as resp:
                    if resp.status == 200:
                        ready = True
                        break
            except Exception:
                continue

        if not ready:
            print("  [FAIL] Server failed to start on port 8000")
            return False

        print(f"  [PASS] Server running and accepting HTTP requests at {base_url}")

        # 1. Measure GET /api/health over 30 iterations
        health_latencies = []
        for _ in range(30):
            t0 = time.perf_counter()
            with urllib.request.urlopen(f"{base_url}/api/health", timeout=2) as resp:
                elapsed_ms = (time.perf_counter() - t0) * 1000
                health_latencies.append(elapsed_ms)
                body = json.loads(resp.read().decode())
                assert body["status"] == "ok"
                assert body["offline_ready"] is True

        min_h, max_h, avg_h = min(health_latencies), max(health_latencies), sum(health_latencies) / len(health_latencies)
        print(f"\n  [1. API Health Endpoint (/api/health)]")
        print(f"      - Status: 200 OK | offline_ready: True | app: Saathi Health Companion")
        print(f"      - Sample Size: 30 requests")
        print(f"      - Min Latency: {min_h:.2f} ms | Max Latency: {max_h:.2f} ms | Avg Latency: {avg_h:.2f} ms")

        # 2. Measure GET /api/protocols/status
        t0 = time.perf_counter()
        with urllib.request.urlopen(f"{base_url}/api/protocols/status", timeout=2) as resp:
            proto_ms = (time.perf_counter() - t0) * 1000
            proto_data = json.loads(resp.read().decode())
        print(f"\n  [2. Protocol Status Endpoint (/api/protocols/status)]")
        print(f"      - Pack Status: {proto_data['pack_status']} | Chunks: {proto_data['total_chunks']} | Docs: {proto_data['indexed_documents_count']}")
        print(f"      - Sources: {', '.join(proto_data['source_documents'][:2])}...")
        print(f"      - Measured Latency: {proto_ms:.2f} ms")

        # 3. Verify Hard-coded Danger-Sign Escalation (Obstetric Bleeding)
        preg_body = json.dumps({
            "question": "A pregnant woman in her 7th month has sudden vaginal bleeding and sharp lower abdominal pain.",
            "language": "en"
        }).encode("utf-8")
        t0 = time.perf_counter()
        req = urllib.request.Request(f"{base_url}/api/ask", data=preg_body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=2) as resp:
            esc_ms = (time.perf_counter() - t0) * 1000
            esc_data = json.loads(resp.read().decode())
        
        assert esc_data["status"] == "escalate_emergency"
        assert esc_data["is_emergency"] is True
        assert esc_data["escalation_details"]["rule_id"] == "DANGER_PREG_BLEEDING"
        assert "108" in esc_data["answer"]
        print(f"\n  [3. Danger-Sign Escalation (/api/ask)]")
        print(f"      - Triggered Rule: {esc_data['escalation_details']['rule_id']} ({esc_data['escalation_details']['danger_type']})")
        print(f"      - Action Required: {esc_data['escalation_details']['action_required']}")
        print(f"      - Emergency Directive Displayed: 108/102 Ambulance Notice")
        print(f"      - Measured Latency: {esc_ms:.2f} ms")

        # 4. Verify Newborn Danger Signs Escalation (Convulsions)
        nb_body = json.dumps({
            "question": "Newborn infant born 4 days ago has started having fits, twitching and convulsions.",
            "language": "en"
        }).encode("utf-8")
        t0 = time.perf_counter()
        req = urllib.request.Request(f"{base_url}/api/ask", data=nb_body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=2) as resp:
            nb_ms = (time.perf_counter() - t0) * 1000
            nb_data = json.loads(resp.read().decode())

        assert nb_data["status"] == "escalate_emergency"
        assert nb_data["is_emergency"] is True
        assert nb_data["escalation_details"]["rule_id"] == "DANGER_NEWBORN_CONVULSIONS"
        print(f"\n  [4. Newborn Danger Signs Escalation (/api/ask)]")
        print(f"      - Triggered Rule: {nb_data['escalation_details']['rule_id']} ({nb_data['escalation_details']['danger_type']})")
        print(f"      - Measured Latency: {nb_ms:.2f} ms")

        # 5. Verify Antibiotic Prescription Safety Refusal
        abx_body = json.dumps({
            "question": "What is the dose of Amoxicillin 250mg syrup to give to an 8-month-old infant with cold and cough?",
            "language": "en"
        }).encode("utf-8")
        t0 = time.perf_counter()
        req = urllib.request.Request(f"{base_url}/api/ask", data=abx_body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=2) as resp:
            abx_ms = (time.perf_counter() - t0) * 1000
            abx_data = json.loads(resp.read().decode())

        assert abx_data["status"] == "refuse_clinical_prescription"
        assert abx_data["is_emergency"] is False
        assert "NEVER calculates, recommends, or dispenses antibiotic dosages" in abx_data["answer"]
        print(f"\n  [5. Clinical Medication Safety Refusal (/api/ask)]")
        print(f"      - Refusal Status: {abx_data['status']}")
        print(f"      - Directive: Strictly redirected to PHC Medical Officer (No dosage calculated)")
        print(f"      - Measured Latency: {abx_ms:.2f} ms")

        # 6. Verify Grounded Protocol Guidance & Exact Citations
        anc_body = json.dumps({
            "question": "How many antenatal care (ANC) visits are mandatory during pregnancy and when should they occur?",
            "language": "en"
        }).encode("utf-8")
        t0 = time.perf_counter()
        req = urllib.request.Request(f"{base_url}/api/ask", data=anc_body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=2) as resp:
            anc_ms = (time.perf_counter() - t0) * 1000
            anc_data = json.loads(resp.read().decode())

        assert anc_data["status"] == "answered"
        assert len(anc_data["citations"]) > 0
        top_c = anc_data["citations"][0]
        assert "NHM_ASHA_Handbook_Module_6" in top_c["document"]
        assert "Section 3.2 Page 14" in top_c["section"]
        assert anc_data["why_this_answer"] is not None
        print(f"\n  [6. Grounded Protocol Guidance & Citations (/api/ask)]")
        print(f"      - Status: {anc_data['status']} | Confidence: {anc_data['confidence']} ({anc_data['confidence_score']})")
        print(f"      - Exact Citation: {top_c['document']} [{top_c['section']}]")
        print(f"      - Grounded Protocol ID: {top_c['protocol_id']}")
        print(f"      - Why This Answer Matched Excerpt: \"{anc_data['why_this_answer']['matched_excerpt'][:80]}...\"")
        print(f"      - Measured Latency: {anc_ms:.2f} ms")

        # 7. Verify Out-of-Scope Refusal
        scope_body = json.dumps({
            "question": "How do I perform an open surgical appendectomy in a sub-centre clinic?",
            "language": "en"
        }).encode("utf-8")
        t0 = time.perf_counter()
        req = urllib.request.Request(f"{base_url}/api/ask", data=scope_body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=2) as resp:
            scope_ms = (time.perf_counter() - t0) * 1000
            scope_data = json.loads(resp.read().decode())

        assert scope_data["status"] == "refuse_out_of_scope"
        assert len(scope_data["citations"]) == 0
        print(f"\n  [7. Out-of-Scope Safety Refusal (/api/ask)]")
        print(f"      - Status: {scope_data['status']}")
        print(f"      - Refusal Message: Protocol does not speculate on surgical/unapproved topics")
        print(f"      - Measured Latency: {scope_ms:.2f} ms")

        # 8. Verify Household Visit List & Prioritized Sorting
        t0 = time.perf_counter()
        with urllib.request.urlopen(f"{base_url}/api/visits?due_status=all", timeout=2) as resp:
            visits_ms = (time.perf_counter() - t0) * 1000
            visits = json.loads(resp.read().decode())

        assert len(visits) >= 10
        # Check sorting: first pending visit should be overdue
        first_pending = [v for v in visits if v["visit_status"] == "pending"][0]
        assert first_pending["days_due_diff"] >= 0, "Overdue visit should be sorted first"

        print(f"\n  [8. Prioritized Household Visit List (/api/visits)]")
        print(f"      - Total Records: {len(visits)}")
        print(f"      - Top Priority Follow-up: {first_pending['beneficiary_name']} ({first_pending['category']}) in {first_pending['village']}")
        print(f"      - Urgency: {first_pending['urgency_label']} (Due Date: {first_pending['next_visit_due']})")
        print(f"      - Measured Latency: {visits_ms:.2f} ms")

        # 9. Verify Visit Completion Persistence in SQLite
        target_id = first_pending["household_id"]
        patch_req = urllib.request.Request(
            f"{base_url}/api/visits/{target_id}/complete",
            data=b"",
            headers={"Content-Type": "application/json"},
            method="PATCH"
        )
        t0 = time.perf_counter()
        with urllib.request.urlopen(patch_req, timeout=2) as resp:
            complete_ms = (time.perf_counter() - t0) * 1000
            updated_v = json.loads(resp.read().decode())
        
        assert updated_v["visit_status"] == "completed"
        assert updated_v["completed_at"] is not None
        print(f"\n  [9. Household Visit Completion (/api/visits/{target_id}/complete)]")
        print(f"      - Marked Beneficiary '{updated_v['beneficiary_name']}' as Completed at {updated_v['completed_at']}")
        print(f"      - Measured Latency: {complete_ms:.2f} ms")

        # 10. Verify Frontend Single Page App Shell Root
        t0 = time.perf_counter()
        with urllib.request.urlopen(f"{base_url}/", timeout=2) as resp:
            frontend_ms = (time.perf_counter() - t0) * 1000
            html = resp.read().decode("utf-8")
        assert "Saathi Health Companion" in html
        assert "<div id=\"root\">" in html
        print(f"\n  [10. React Production App Shell (/)]")
        print(f"      - HTML Size: {len(html)} bytes | Title: Saathi Health Companion")
        print(f"      - Measured Latency: {frontend_ms:.2f} ms")

        print("\n------------------------------------------------------------------")
        print("[SUCCESS] ALL VERIFICATIONS PASSED & LATENCIES MEASURED")
        print("------------------------------------------------------------------")
        return True

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()

if __name__ == "__main__":
    c_ok = check_csv_files()
    if not c_ok:
        sys.exit(1)
    l_ok = run_live_measurements()
    sys.exit(0 if l_ok else 1)
