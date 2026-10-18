"""
Unit tests for local offline retrieval, citations, and grounding.
"""

from backend.retriever import protocol_retriever

def test_protocol_status_ready():
    status = protocol_retriever.get_status()
    assert status["pack_status"] == "ready"
    assert status["indexed_documents_count"] > 0
    assert status["total_chunks"] >= 8
    assert status["offline_ready"] is True

def test_grounded_anc_schedule_retrieval():
    q = "How many antenatal care (ANC) visits are mandatory during pregnancy and when should they occur?"
    res = protocol_retriever.search(q)
    assert res["status"] == "answered"
    assert len(res["citations"]) > 0
    top_citation = res["citations"][0]
    assert "NHM_ASHA_Handbook_Module_6_Maternal_Health.pdf" in top_citation.document
    assert "Section 3.2 Page 14" in top_citation.section
    assert "PROTO-ANC-001" in top_citation.protocol_id
    assert "four antenatal care (ANC) checkups" in res["answer"]
    assert res["confidence"] in ["High", "Medium"]
    assert res["why_this_answer"] is not None

def test_grounded_ors_preparation_retrieval():
    q = "How should an ASHA guide a mother to correctly prepare a standard packet of WHO Oral Rehydration Salts (ORS)?"
    res = protocol_retriever.search(q)
    assert res["status"] == "answered"
    assert len(res["citations"]) > 0
    top_citation = res["citations"][0]
    assert "MoHFW_IMNCI_Guidelines_2022.pdf" in top_citation.document
    assert "1 litre of clean drinking water" in res["answer"]

def test_grounded_kmc_retrieval():
    q = "What is Kangaroo Mother Care (KMC) and how many hours should it be provided for low birth weight babies?"
    res = protocol_retriever.search(q)
    assert res["status"] == "answered"
    assert len(res["citations"]) > 0
    assert "Operational_Guidelines_Home_Based_Newborn_Care.pdf" in res["citations"][0].document
    assert "skin-to-skin contact" in res["answer"]
