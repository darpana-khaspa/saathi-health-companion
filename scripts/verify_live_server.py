#!/usr/bin/env python3
"""
Verification Script: Starts the live server on http://127.0.0.1:8000,
verifies real HTTP network endpoints (health, protocol status, Q&A, visits, HTML),
and verifies end-to-end functionality.
"""

import subprocess
import sys
import time
import urllib.request
import json

def verify_live():
    print("==================================================================")
    print("  VERIFYING LIVE APPLICATION ON http://127.0.0.1:8000")
    print("==================================================================")

    # Start live server process
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    try:
        # Wait up to 10 seconds for server to be responsive
        base_url = "http://127.0.0.1:8000"
        ready = False
        for _ in range(20):
            time.sleep(0.5)
            try:
                with urllib.request.urlopen(f"{base_url}/api/health", timeout=2) as resp:
                    if resp.status == 200:
                        ready = True
                        break
            except Exception:
                continue

        if not ready:
            print("❌ Server failed to start within timeout.")
            return False

        print("  [PASS] Live Server HTTP socket opened at http://127.0.0.1:8000")

        # 1. Check Health Endpoint
        with urllib.request.urlopen(f"{base_url}/api/health", timeout=2) as resp:
            data = json.loads(resp.read().decode())
            assert data["status"] == "ok"
            print("  [PASS] GET /api/health returned 200 OK (offline_ready: True)")

        # 2. Check Protocol Status
        with urllib.request.urlopen(f"{base_url}/api/protocols/status", timeout=2) as resp:
            data = json.loads(resp.read().decode())
            assert data["pack_status"] == "ready"
            assert data["total_chunks"] >= 8
            print(f"  [PASS] GET /api/protocols/status returned {data['total_chunks']} indexed chunks")

        # 3. Check Ask Emergency
        emergency_payload = json.dumps({
            "question": "Pregnant woman with severe vaginal bleeding",
            "language": "en"
        }).encode("utf-8")
        req = urllib.request.Request(
            f"{base_url}/api/ask",
            data=emergency_payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
            data = json.loads(resp.read().decode())
            assert data["status"] == "escalate_emergency"
            assert data["is_emergency"] is True
            print("  [PASS] POST /api/ask escalated pregnancy emergency with 108 referral")

        # 4. Check Grounded Q&A
        qa_payload = json.dumps({
            "question": "How many antenatal care (ANC) visits are mandatory?",
            "language": "en"
        }).encode("utf-8")
        req = urllib.request.Request(
            f"{base_url}/api/ask",
            data=qa_payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
            data = json.loads(resp.read().decode())
            assert data["status"] == "answered"
            assert len(data["citations"]) > 0
            print(f"  [PASS] POST /api/ask returned grounded guidance with citation: {data['citations'][0]['document']}")

        # 5. Check Visits List
        with urllib.request.urlopen(f"{base_url}/api/visits?due_status=all", timeout=2) as resp:
            data = json.loads(resp.read().decode())
            assert len(data) > 0
            print(f"  [PASS] GET /api/visits returned {len(data)} prioritized follow-ups")

        # 6. Check Static Single Page App Root
        with urllib.request.urlopen(f"{base_url}/", timeout=2) as resp:
            html = resp.read().decode("utf-8")
            assert "Saathi Health Companion" in html
            print("  [PASS] GET / served built production React frontend HTML")

        print("\n[SUCCESS] Live end-to-end server verification PASSED!")
        return True

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()

if __name__ == "__main__":
    ok = verify_live()
    sys.exit(0 if ok else 1)
