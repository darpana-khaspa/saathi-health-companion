"""
Unit tests for deterministic hard-coded danger-sign escalation rules.
Non-Negotiable Safety Rule 3 & 4.
"""

import pytest
from backend.escalation import check_escalation_rules

def test_pregnancy_bleeding_detection():
    cases = [
        "A pregnant woman in her 7th month has sudden vaginal bleeding and sharp lower abdominal pain.",
        "Woman at 28 weeks of pregnancy is having continuous spotting and fresh red blood leakage.",
        "Antepartum hemorrhage reported in 3rd trimester mother with severe dizziness.",
        "Pregnant mother is bleeding heavily with clots and feels faint.",
        "Patient in 2nd trimester complains of vaginal bleeding and pelvic cramping."
    ]
    for case in cases:
        match = check_escalation_rules(case)
        assert match is not None, f"Failed to detect pregnancy bleeding in: {case}"
        assert match.is_emergency is True
        assert match.rule_id == "DANGER_PREG_BLEEDING"
        assert "108" in match.user_message

def test_newborn_convulsions_detection():
    cases = [
        "Newborn infant born 4 days ago has started having fits, twitching and convulsions.",
        "3-day-old baby is having seizures and eye rolling.",
        "Neonate with repeated spasms and twitching."
    ]
    for case in cases:
        match = check_escalation_rules(case)
        assert match is not None, f"Failed to detect newborn convulsions in: {case}"
        assert match.is_emergency is True
        assert match.rule_id == "DANGER_NEWBORN_CONVULSIONS"

def test_newborn_respiratory_and_feeding_danger():
    cases = [
        "A 6-day-old baby is completely unable to suckle or breastfeed and has deep chest indrawing.",
        "Newborn baby is grunting, breathing faster than 60 breaths per minute, and chest is retracting deeply.",
        "Infant has stopped feeding and shows severe chest indrawing."
    ]
    for case in cases:
        match = check_escalation_rules(case)
        assert match is not None, f"Failed to detect respiratory/feeding danger in: {case}"
        assert match.is_emergency is True
        assert match.rule_id == "DANGER_NEWBORN_RESPIRATORY_FEEDING"

def test_newborn_hypothermia_and_lethargy():
    cases = [
        "Newborn baby feels unusually cold to touch, with blue lips and extreme lethargy (not waking up).",
        "Neonate is limp, unconscious, and floppy.",
        "Infant with cyanosis and severe hypothermia."
    ]
    for case in cases:
        match = check_escalation_rules(case)
        assert match is not None, f"Failed to detect hypothermia/lethargy in: {case}"
        assert match.is_emergency is True
        assert match.rule_id == "DANGER_NEWBORN_LETHARGY_HYPOTHERMIA"

def test_postpartum_hemorrhage_and_severe_preeclampsia():
    pph = "Mother who delivered 3 days ago has soaked 3 sanitary pads in one hour with bright red blood."
    match_pph = check_escalation_rules(pph)
    assert match_pph is not None
    assert match_pph.is_emergency is True
    assert match_pph.rule_id == "DANGER_POSTPARTUM_HEMORRHAGE"

    eclampsia = "Postnatal mother has severe persistent headache, blurred vision, and systolic BP of 160."
    match_ecl = check_escalation_rules(eclampsia)
    assert match_ecl is not None
    assert match_ecl.is_emergency is True
    assert match_ecl.rule_id == "DANGER_MATERNAL_ECLAMPSIA"

def test_non_emergency_routine_queries_do_not_escalate():
    safe_queries = [
        "When should the first ANC checkup be scheduled?",
        "What is the recommended immunization schedule for an infant?",
        "How do I prepare ORS for child diarrhea?",
        "How to promote Kangaroo Mother Care for low birth weight infant?"
    ]
    for q in safe_queries:
        match = check_escalation_rules(q)
        assert match is None or not match.is_emergency
