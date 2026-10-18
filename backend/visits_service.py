"""
Visits and Household Register Service for Saathi Health Companion.

Handles prioritized sorting (overdue and nearest due dates first),
filtering, and visit completion state updates.
"""

from datetime import datetime, date
from typing import List, Optional, Dict, Any

from backend.database import get_db_connection
from backend.models import HouseholdVisit, HouseholdStats

# Reference today for deterministic comparison
CURRENT_APP_DATE = date(2026, 10, 18)

def compute_urgency(due_date_str: str, visit_status: str, ref_date: Optional[date] = None) -> tuple[int, str]:
    """Computes days difference and human-friendly urgency label."""
    if visit_status == "completed":
        return 0, "Completed"

    today = ref_date or date.today()
    try:
        due_d = datetime.strptime(due_date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return 0, "Scheduled"

    diff_days = (today - due_d).days  # Positive if overdue, 0 if today, negative if future

    if diff_days > 0:
        label = f"Overdue by {diff_days} day{'s' if diff_days > 1 else ''}"
    elif diff_days == 0:
        label = "Due Today"
    elif diff_days >= -7:
        label = f"Due Soon (in {-diff_days} day{'s' if -diff_days > 1 else ''})"
    else:
        label = "Upcoming"

    return diff_days, label

def get_visits(
    village: Optional[str] = None,
    assigned_worker: Optional[str] = None,
    category: Optional[str] = None,
    due_status: Optional[str] = "all"
) -> List[HouseholdVisit]:
    """
    Fetches household visits with filters and prioritized ordering.
    Ordering:
    1. Pending visits first, completed visits last.
    2. Overdue and earliest due dates first (next_visit_due ASC).
    3. High-risk beneficiaries prioritized.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM household_register WHERE 1=1"
    params = []

    if village and village != "all":
        query += " AND village = ?"
        params.append(village)

    if assigned_worker and assigned_worker != "all":
        query += " AND assigned_worker = ?"
        params.append(assigned_worker)

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)

    # Ordering: pending first, then by next_visit_due ASC, then by risk flag
    query += """
        ORDER BY 
            CASE WHEN visit_status = 'pending' THEN 0 ELSE 1 END ASC,
            next_visit_due ASC,
            CASE 
                WHEN risk_flag = 'High' THEN 0 
                WHEN risk_flag = 'Medium' THEN 1 
                ELSE 2 
            END ASC
    """

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    today = CURRENT_APP_DATE
    visits: List[HouseholdVisit] = []

    for r in rows:
        diff_days, urgency = compute_urgency(r["next_visit_due"], r["visit_status"], ref_date=today)

        # Apply due_status filter in memory for clean date-math filtering
        if due_status and due_status != "all":
            if due_status == "overdue" and (diff_days <= 0 or r["visit_status"] != "pending"):
                continue
            elif due_status == "due_today" and (diff_days != 0 or r["visit_status"] != "pending"):
                continue
            elif due_status == "due_soon" and (not (-7 <= diff_days <= 0) or r["visit_status"] != "pending"):
                continue
            elif due_status == "pending" and r["visit_status"] != "pending":
                continue
            elif due_status == "completed" and r["visit_status"] != "completed":
                continue

        visits.append(HouseholdVisit(
            household_id=r["household_id"],
            beneficiary_name=r["beneficiary_name"],
            beneficiary_age=r["beneficiary_age"],
            category=r["category"],
            village=r["village"],
            assigned_worker=r["assigned_worker"],
            next_visit_due=r["next_visit_due"],
            visit_status=r["visit_status"],
            risk_flag=r["risk_flag"] or "Normal",
            concise_visit_note=r["concise_visit_note"],
            last_visit_date=r["last_visit_date"],
            completed_at=r["completed_at"],
            days_due_diff=diff_days,
            urgency_label=urgency
        ))

    return visits

def complete_visit(household_id: str) -> Optional[HouseholdVisit]:
    """Marks a household visit as completed in SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()

    completed_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        UPDATE household_register
        SET visit_status = 'completed',
            completed_at = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE household_id = ?
    """, (completed_time, household_id))

    if cursor.rowcount == 0:
        conn.close()
        return None

    conn.commit()

    cursor.execute("SELECT * FROM household_register WHERE household_id = ?", (household_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return HouseholdVisit(
        household_id=row["household_id"],
        beneficiary_name=row["beneficiary_name"],
        beneficiary_age=row["beneficiary_age"],
        category=row["category"],
        village=row["village"],
        assigned_worker=row["assigned_worker"],
        next_visit_due=row["next_visit_due"],
        visit_status=row["visit_status"],
        risk_flag=row["risk_flag"] or "Normal",
        concise_visit_note=row["concise_visit_note"],
        last_visit_date=row["last_visit_date"],
        completed_at=row["completed_at"],
        days_due_diff=0,
        urgency_label="Completed"
    )

def get_visit_stats() -> HouseholdStats:
    """Computes summary statistics for minimal dashboard cards."""
    all_visits = get_visits(due_status="all")
    today = CURRENT_APP_DATE

    overdue = 0
    due_today = 0
    due_soon = 0
    completed = 0
    high_risk = 0

    for v in all_visits:
        if v.visit_status == "completed":
            completed += 1
        else:
            if v.risk_flag == "High":
                high_risk += 1
            if v.days_due_diff > 0:
                overdue += 1
            elif v.days_due_diff == 0:
                due_today += 1
            elif -7 <= v.days_due_diff < 0:
                due_soon += 1

    return HouseholdStats(
        total_registered=len(all_visits),
        overdue_count=overdue,
        due_today_count=due_today,
        due_soon_count=due_soon,
        completed_count=completed,
        high_risk_count=high_risk
    )
