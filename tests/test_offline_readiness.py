"""
Automated Offline Readiness & Air-Gap Audit Test Suite for Saathi Health Companion.

Verifies:
1. True offline execution: Zero outbound external network calls.
2. Local SQLite persistence independent of cloud or ephemeral filesystems.
3. Complete local frontend asset bundle and PWA Service Worker caching.
4. Deterministic rules & protocol retrieval without cloud LLMs or external APIs.
"""

import os
import re
import socket
import sqlite3
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.config import settings
from backend.database import get_db_connection, seed_from_csv
from backend.escalation import check_escalation_rules
from backend.retriever import protocol_retriever
from backend.visits_service import get_visits, complete_visit

BASE_DIR = Path(__file__).resolve().parent.parent
client = TestClient(app)

def test_zero_external_network_calls_at_runtime():
    """
    Simulates total internet disconnection by intercepting socket connections.
    Any attempt to connect to an external IP/domain fails immediately.
    """
    orig_connect = socket.socket.connect

    def guarded_connect(self, address):
        host = address[0] if isinstance(address, (tuple, list)) else address
        # Allow loopback addresses only
        if host in ("127.0.0.1", "localhost", "::1", "0.0.0.0"):
            return orig_connect(self, address)
        raise AssertionError(f"BLOCKED: Attempted external network call to '{host}' during offline execution!")

    with patch.object(socket.socket, "connect", guarded_connect):
        # 1. Health check
        h_res = client.get("/api/health")
        assert h_res.status_code == 200
        assert h_res.json()["offline_ready"] is True

        # 2. Protocol status
        p_res = client.get("/api/protocols/status")
        assert p_res.status_code == 200
        assert p_res.json()["pack_status"] == "ready"

        # 3. Critical Danger Sign (Obstetric Bleeding)
        d_res = client.post("/api/ask", json={
            "question": "A pregnant woman in her 7th month has sudden vaginal bleeding and sharp lower abdominal pain."
        })
        assert d_res.status_code == 200
        assert d_res.json()["status"] == "escalate_emergency"
        assert d_res.json()["is_emergency"] is True
        assert d_res.json()["escalation_details"]["rule_id"] == "DANGER_PREG_BLEEDING"

        # 4. Antibiotic Safety Refusal
        a_res = client.post("/api/ask", json={
            "question": "What is the dose of Amoxicillin 250mg syrup to give to an infant?"
        })
        assert a_res.status_code == 200
        assert a_res.json()["status"] == "refuse_clinical_prescription"

        # 5. Grounded Protocol Retrieval
        g_res = client.post("/api/ask", json={
            "question": "How many antenatal care (ANC) visits are mandatory during pregnancy?"
        })
        assert g_res.status_code == 200
        assert g_res.json()["status"] == "answered"
        assert len(g_res.json()["citations"]) > 0

        # 6. Out-of-Scope Refusal
        o_res = client.post("/api/ask", json={
            "question": "How do I perform an open surgical appendectomy?"
        })
        assert o_res.status_code == 200
        assert o_res.json()["status"] == "refuse_out_of_scope"

        # 7. Visits list & completion
        v_res = client.get("/api/visits")
        assert v_res.status_code == 200
        assert len(v_res.json()) > 0

        target_id = v_res.json()[0]["household_id"]
        c_res = client.patch(f"/api/visits/{target_id}/complete")
        assert c_res.status_code == 200
        assert c_res.json()["visit_status"] == "completed"

def test_local_sqlite_persistence_on_disk():
    """
    Verifies that household register updates are written to physical disk,
    surviving connection teardown and fresh database reconnects.
    """
    test_db = BASE_DIR / "test_offline_persist.db"
    if test_db.exists():
        test_db.unlink()

    try:
        # Create schema and seed directly on disk
        conn = sqlite3.connect(str(test_db))
        conn.row_factory = sqlite3.Row
        conn.execute("""
            CREATE TABLE household_register (
                household_id TEXT PRIMARY KEY,
                beneficiary_name TEXT NOT NULL,
                beneficiary_age INTEGER,
                category TEXT NOT NULL,
                village TEXT NOT NULL,
                assigned_worker TEXT NOT NULL,
                next_visit_due TEXT NOT NULL,
                visit_status TEXT NOT NULL DEFAULT 'pending',
                risk_flag TEXT DEFAULT 'Normal',
                concise_visit_note TEXT,
                last_visit_date TEXT,
                completed_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()

        # Seed from CSV
        seed_from_csv(conn, settings.HOUSEHOLD_CSV_PATH)
        conn.commit()

        # Simulate frontline worker marking a visit completed
        conn.execute("""
            UPDATE household_register
            SET visit_status = 'completed', completed_at = '2026-10-20 14:00:00'
            WHERE household_id = 'HH-001';
        """)
        conn.commit()
        # Hard close connection
        conn.close()

        # Fresh reconnect from disk (simulating server reboot / offline restart)
        conn2 = sqlite3.connect(str(test_db))
        conn2.row_factory = sqlite3.Row
        cursor = conn2.cursor()
        cursor.execute("SELECT visit_status, completed_at FROM household_register WHERE household_id = 'HH-001';")
        row = cursor.fetchone()
        assert row is not None
        assert row["visit_status"] == "completed"
        assert row["completed_at"] == "2026-10-20 14:00:00"
        conn2.close()

    finally:
        if test_db.exists():
            test_db.unlink()

def test_frontend_assets_fully_bundled_locally():
    """
    Verifies that the frontend contains ZERO external CDN scripts or remote fonts,
    and all referenced assets physically exist in frontend/dist.
    """
    dist_dir = BASE_DIR / "frontend" / "dist"
    index_html = dist_dir / "index.html"
    sw_file = dist_dir / "sw.js"
    manifest_file = dist_dir / "manifest.json"
    icon_file = dist_dir / "icon.svg"

    assert index_html.exists(), "frontend/dist/index.html is missing!"
    assert sw_file.exists(), "frontend/dist/sw.js is missing!"
    assert manifest_file.exists(), "frontend/dist/manifest.json is missing!"
    assert icon_file.exists(), "frontend/dist/icon.svg is missing!"

    html_content = index_html.read_text(encoding="utf-8")

    # Verify no external CDNs in HTML
    external_scripts = re.findall(r'<script[^>]+src=["\'](https?://[^"\']+)["\']', html_content)
    assert len(external_scripts) == 0, f"Found external scripts in HTML: {external_scripts}"

    external_links = re.findall(r'<link[^>]+href=["\'](https?://[^"\']+)["\']', html_content)
    assert len(external_links) == 0, f"Found external links in HTML: {external_links}"

    # Verify all internal assets exist on disk
    local_scripts = re.findall(r'<script[^>]+src=["\'](/assets/[^"\']+)["\']', html_content)
    for s in local_scripts:
        asset_path = dist_dir / s.lstrip("/")
        assert asset_path.exists(), f"Script bundle missing from disk: {s}"
        assert asset_path.stat().st_size > 1000, f"Script bundle is suspiciously small: {s}"

    local_css = re.findall(r'<link[^>]+href=["\'](/assets/[^"\']+)["\']', html_content)
    for c in local_css:
        asset_path = dist_dir / c.lstrip("/")
        assert asset_path.exists(), f"CSS bundle missing from disk: {c}"
        assert asset_path.stat().st_size > 500, f"CSS bundle is suspiciously small: {c}"

    # Verify service worker caches all required assets
    sw_content = sw_file.read_text(encoding="utf-8")
    assert "/manifest.json" in sw_content
    assert "/icon.svg" in sw_content
    for s in local_scripts:
        assert s in sw_content, f"Service Worker does not pre-cache script: {s}"
    for c in local_css:
        assert c in sw_content, f"Service Worker does not pre-cache stylesheet: {c}"

def test_offline_protocol_search_without_cloud_llm():
    """
    Verifies that the protocol retriever and danger rules function without
    any LLM, cloud API tokens, or external models.
    """
    import sys
    # Verify no cloud LLM packages are imported or used in backend modules
    for mod in ["openai", "anthropic", "google.generativeai", "langchain"]:
        assert mod not in sys.modules, f"Unexpected cloud SDK found loaded: {mod}"

    # Verify backend codebase contains zero external LLM client instantiations
    backend_dir = BASE_DIR / "backend"
    for py_file in backend_dir.glob("*.py"):
        content = py_file.read_text(encoding="utf-8")
        assert "openai" not in content.lower(), f"Found openai in {py_file.name}"
        assert "anthropic" not in content.lower(), f"Found anthropic in {py_file.name}"
        assert "gemini" not in content.lower() or "gemini" in content.lower() and "appDataDir" in content, f"Found gemini in {py_file.name}"

    # Deterministic rule test (pregnancy bleeding)
    match = check_escalation_rules("Pregnant woman at 32 weeks has sudden fresh red blood loss.")
    assert match is not None
    assert match.is_emergency is True
    assert match.rule_id == "DANGER_PREG_BLEEDING"

    # Local TF-IDF search test (ORS preparation)
    result = protocol_retriever.search("How should an ASHA guide a mother to correctly prepare a standard packet of WHO Oral Rehydration Salts (ORS)?")
    assert result["status"] == "answered"
    assert len(result["citations"]) > 0
    assert "MoHFW_IMNCI_Guidelines_2022.pdf" in result["citations"][0].document
    assert "1 litre of clean drinking water" in result["answer"]
    assert result["why_this_answer"] is not None
