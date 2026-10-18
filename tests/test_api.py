"""
FastAPI End-to-End API endpoint test suite.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["offline_ready"] is True
    assert data["app"] == "Saathi Health Companion"

def test_api_protocol_status():
    res = client.get("/api/protocols/status")
    assert res.status_code == 200
    data = res.json()
    assert data["pack_status"] == "ready"
    assert data["total_chunks"] >= 8
    assert len(data["source_documents"]) > 0

def test_api_ask_emergency_escalation():
    payload = {
        "question": "A pregnant woman in her 7th month has sudden vaginal bleeding and sharp lower abdominal pain.",
        "language": "en"
    }
    res = client.post("/api/ask", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "escalate_emergency"
    assert data["is_emergency"] is True
    assert data["escalation_details"]["rule_id"] == "DANGER_PREG_BLEEDING"
    assert "108" in data["answer"]

def test_api_ask_antibiotic_refusal():
    payload = {
        "question": "What is the dose of Amoxicillin 250mg syrup to give to an 8-month-old infant with cold and cough?",
        "language": "en"
    }
    res = client.post("/api/ask", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "refuse_clinical_prescription"
    assert data["is_emergency"] is False
    assert "NEVER calculates, recommends, or dispenses antibiotic dosages" in data["answer"]

def test_api_ask_grounded_answer():
    payload = {
        "question": "How many antenatal care (ANC) visits are mandatory during pregnancy and when should they occur?",
        "language": "en"
    }
    res = client.post("/api/ask", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "answered"
    assert data["is_emergency"] is False
    assert len(data["citations"]) > 0
    assert "Section 3.2 Page 14" in data["citations"][0]["section"]

def test_api_visits_and_completion():
    res = client.get("/api/visits?due_status=all")
    assert res.status_code == 200
    visits = res.json()
    assert len(visits) > 0

    target = visits[0]["household_id"]
    patch_res = client.patch(f"/api/visits/{target}/complete")
    assert patch_res.status_code == 200
    assert patch_res.json()["visit_status"] == "completed"

def test_api_visits_stats():
    res = client.get("/api/visits/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "total_registered" in stats
    assert "overdue_count" in stats

def test_frontend_static_serving():
    res = client.get("/")
    assert res.status_code == 200
    assert "Saathi Health Companion" in res.text
    assert "<div id=\"root\">" in res.text
