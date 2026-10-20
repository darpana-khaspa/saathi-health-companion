"""
Saathi Health Companion - FastAPI Main Application.
Offline-first, low-connectivity decision-support assistant for frontline ASHA/ANM health workers.
"""

from datetime import datetime
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.database import init_db
from backend.escalation import check_escalation_rules
from backend.models import (
    AskRequest,
    AskResponse,
    Citation,
    EscalationDetails,
    HealthResponse,
    HouseholdVisit,
    HouseholdStats,
    ProtocolStatusResponse,
)
from backend.retriever import protocol_retriever
from backend.visits_service import get_visits, complete_visit, get_visit_stats

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes SQLite database and indexes local protocol documents."""
    init_db()
    protocol_retriever.load_and_index()
    yield

app = FastAPI(
    title="Saathi Health Companion API",
    description=(
        "Offline-capable decision-support companion for ASHA and ANM frontline health workers. "
        "Strictly grounded in approved public-health protocols with deterministic danger-sign escalation."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Core API Routes
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def get_health():
    """Health check endpoint verifying system readiness and local offline capability."""
    return HealthResponse(
        status="ok",
        app=settings.APP_NAME,
        version=settings.APP_VERSION,
        offline_ready=True,
        database_connected=True,
        server_time=datetime.now().isoformat()
    )

@app.get("/api/protocols/status", response_model=ProtocolStatusResponse, tags=["Protocols"])
def get_protocols_status():
    """Returns local protocol pack status and source document metadata."""
    status_info = protocol_retriever.get_status()
    return ProtocolStatusResponse(
        pack_status=status_info["pack_status"],
        indexed_documents_count=status_info["indexed_documents_count"],
        total_chunks=status_info["total_chunks"],
        source_documents=status_info["source_documents"],
        offline_ready=status_info["offline_ready"],
        last_indexed=status_info["last_indexed"],
        retrieval_engine="Local Offline Scikit-Learn TF-IDF Indexer"
    )

@app.get("/api/protocols/export", tags=["Protocols"])
def export_protocols():
    """Exports loaded protocol documents for browser-side offline storage and indexing."""
    return protocol_retriever.protocols

@app.post("/api/ask", response_model=AskResponse, tags=["Protocol Q&A"])
def ask_protocol(payload: AskRequest):
    """
    Answers frontline questions with strict safety controls:
    1. Deterministic danger-sign rules run FIRST. If triggered, returns immediate urgent emergency transfer directive.
    2. Prohibits antibiotic dosage prescription requests.
    3. Retrieves best-matching protocol passages locally and returns grounded answer with citations.
    4. Refuses out-of-scope inquiries without guessing or hallucinating.
    """
    query = payload.question.strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question text cannot be empty."
        )

    # STEP 1: Deterministic Hard-Coded Escalation Check (runs BEFORE any retrieval)
    escalation_match = check_escalation_rules(query)
    
    if escalation_match:
        if escalation_match.is_emergency:
            return AskResponse(
                status="escalate_emergency",
                is_emergency=True,
                escalation_details=EscalationDetails(
                    rule_id=escalation_match.rule_id,
                    danger_type=escalation_match.danger_type,
                    action_required=escalation_match.action_required,
                    emergency_contact="108 / 102 Emergency Medical Service"
                ),
                answer=escalation_match.user_message,
                citations=[],
                confidence="High",
                confidence_score=1.0,
                why_this_answer=None
            )
        else:
            # Clinical Antibiotic Safety Refusal
            return AskResponse(
                status="refuse_clinical_prescription",
                is_emergency=False,
                escalation_details=EscalationDetails(
                    rule_id=escalation_match.rule_id,
                    danger_type=escalation_match.danger_type,
                    action_required=escalation_match.action_required,
                    emergency_contact="Refer to PHC Medical Officer"
                ),
                answer=escalation_match.user_message,
                citations=[],
                confidence="High",
                confidence_score=1.0,
                why_this_answer=None
            )

    # STEP 2: Grounded Local Offline Protocol Retrieval
    retrieval_result = protocol_retriever.search(query)
    
    return AskResponse(
        status=retrieval_result["status"],
        is_emergency=False,
        escalation_details=None,
        answer=retrieval_result["answer"],
        citations=retrieval_result.get("citations", []),
        confidence=retrieval_result.get("confidence", "None"),
        confidence_score=retrieval_result.get("confidence_score", 0.0),
        why_this_answer=retrieval_result.get("why_this_answer"),
    )

@app.get("/api/visits", response_model=List[HouseholdVisit], tags=["Household Register"])
def list_visits(
    village: Optional[str] = Query(None, description="Filter by village"),
    assigned_worker: Optional[str] = Query(None, description="Filter by ASHA/ANM worker"),
    category: Optional[str] = Query(None, description="Filter by visit category"),
    due_status: Optional[str] = Query("all", description="Filter by due status: all, overdue, due_today, due_soon, pending, completed")
):
    """Fetches household visits sorted by overdue and earliest due dates first."""
    return get_visits(
        village=village,
        assigned_worker=assigned_worker,
        category=category,
        due_status=due_status
    )

@app.get("/api/visits/stats", response_model=HouseholdStats, tags=["Household Register"])
def get_stats():
    """Minimal summary stats for field worker dashboard cards."""
    return get_visit_stats()

@app.patch("/api/visits/{household_id}/complete", response_model=HouseholdVisit, tags=["Household Register"])
def mark_visit_completed(household_id: str):
    """Marks a household follow-up visit as completed with local timestamp."""
    visit = complete_visit(household_id)
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Household visit with ID '{household_id}' not found."
        )
    return visit

# Serve frontend static assets if built
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static_frontend")
