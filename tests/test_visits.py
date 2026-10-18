"""
Unit tests for household register visits, priority ordering, and completion tracking.
"""

from backend.database import get_db_connection, seed_from_csv
from backend.visits_service import get_visits, complete_visit, get_visit_stats

def setup_module():
    conn = get_db_connection()
    conn.execute("DELETE FROM household_register;")
    conn.commit()
    seed_from_csv(conn)
    conn.close()

def test_overdue_visits_sorted_first():
    visits = get_visits(due_status="all")
    assert len(visits) > 0
    
    pending_visits = [v for v in visits if v.visit_status == "pending"]
    assert len(pending_visits) > 0

    # Overdue visits should appear before future scheduled visits
    first_pending = pending_visits[0]
    assert first_pending.days_due_diff >= 0  # Overdue or due today

def test_filtering_by_village():
    rampur_visits = get_visits(village="Rampur", due_status="all")
    assert len(rampur_visits) > 0
    for v in rampur_visits:
        assert v.village == "Rampur"

def test_complete_visit_persists_in_sqlite():
    # Fetch a pending visit
    pending = [v for v in get_visits(due_status="pending") if v.visit_status == "pending"]
    assert len(pending) > 0
    target_id = pending[0].household_id

    # Mark complete
    updated = complete_visit(target_id)
    assert updated is not None
    assert updated.household_id == target_id
    assert updated.visit_status == "completed"
    assert updated.completed_at is not None

    # Re-query
    all_visits = get_visits(due_status="all")
    rechecked = [v for v in all_visits if v.household_id == target_id][0]
    assert rechecked.visit_status == "completed"

def test_dashboard_stats():
    stats = get_visit_stats()
    assert stats.total_registered >= 10
    assert stats.overdue_count >= 0
    assert stats.completed_count >= 1
