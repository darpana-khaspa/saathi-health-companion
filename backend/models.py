"""
Data models and schemas for Saathi Health Companion.
"""
from typing import Optional, List
from pydantic import BaseModel, Field

class AskRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000, description="Health worker query text")
    language: str = Field("en", description="UI language code: 'en' for English, 'te' for Telugu")

class Citation(BaseModel):
    document: str
    section: str
    protocol_id: str
    title: str

class EscalationDetails(BaseModel):
    rule_id: str
    danger_type: str
    action_required: str
    emergency_contact: str = "108 / 102 Emergency Medical Service"

class WhyThisAnswer(BaseModel):
    matched_excerpt: str
    matched_terms: List[str] = []
    retrieval_method: str = "Deterministic Rule Check + Local TF-IDF Protocol Engine"
    similarity_score: float

class AskResponse(BaseModel):
    status: str  # "escalate_emergency" | "refuse_clinical_prescription" | "refuse_out_of_scope" | "answered"
    is_emergency: bool = False
    escalation_details: Optional[EscalationDetails] = None
    answer: str
    citations: List[Citation] = []
    confidence: str = "None"  # "High" | "Medium" | "Low" | "None"
    confidence_score: float = 0.0
    why_this_answer: Optional[WhyThisAnswer] = None
    disclaimer: str = (
        "Decision-support demo for trained ASHA/ANM frontline workers only. "
        "Not a substitute for formal clinical training or physician assessment."
    )

class HouseholdVisit(BaseModel):
    household_id: str
    beneficiary_name: str
    beneficiary_age: int
    category: str
    village: str
    assigned_worker: str
    next_visit_due: str
    visit_status: str  # "pending" | "completed"
    risk_flag: str  # "High" | "Medium" | "Normal"
    concise_visit_note: Optional[str] = None
    last_visit_date: Optional[str] = None
    completed_at: Optional[str] = None
    days_due_diff: int = 0
    urgency_label: str = "Scheduled"

class HouseholdStats(BaseModel):
    total_registered: int
    overdue_count: int
    due_today_count: int
    due_soon_count: int
    completed_count: int
    high_risk_count: int

class ProtocolStatusResponse(BaseModel):
    pack_status: str  # "ready" | "indexing" | "empty"
    indexed_documents_count: int
    total_chunks: int
    source_documents: List[str]
    offline_ready: bool
    last_indexed: str
    retrieval_engine: str = "Local Offline Scikit-Learn TF-IDF Indexer"

class HealthResponse(BaseModel):
    status: str = "ok"
    app: str = "Saathi Health Companion"
    version: str = "1.0.0"
    offline_ready: bool = True
    database_connected: bool = True
    server_time: str
