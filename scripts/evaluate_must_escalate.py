#!/usr/bin/env python3
"""
Evaluation Script: Verifies 100% detection rate on must-escalate cases.
Non-Negotiable Safety Rule 4: If any required case fails, exit with error code 1.
"""

import csv
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.escalation import check_escalation_rules
from backend.config import settings

def run_evaluation() -> bool:
    csv_path = settings.EVALUATION_CSV_PATH
    if not csv_path.exists():
        print(f"❌ Error: Evaluation CSV not found at {csv_path}")
        return False

    print("======================================================================")
    print("  SAATHI HEALTH COMPANION - MUST-ESCALATE EVALUATION TEST SUITE")
    print("  Deterministic Danger-Sign Rules Verification (Zero-Tolerance Gate)")
    print("======================================================================\n")

    total_questions = 0
    must_escalate_total = 0
    must_escalate_detected = 0
    must_escalate_missed = []

    non_escalate_total = 0
    non_escalate_correct = 0
    false_positives = []

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_questions += 1
            qid = row.get("question_id", f"Q{total_questions}")
            query = row.get("question", "").strip()
            must_escalate = row.get("must_escalate", "").strip().lower() == "true"
            expected_behavior = row.get("expected_behavior", "").strip()

            match = check_escalation_rules(query)
            detected_as_emergency = (match is not None and match.is_emergency is True)

            if must_escalate:
                must_escalate_total += 1
                if detected_as_emergency:
                    must_escalate_detected += 1
                    print(f"  [PASS] {qid}: MUST_ESCALATE DETECTED -> Rule '{match.rule_id}'")
                else:
                    must_escalate_missed.append((qid, query))
                    print(f"  [FAIL] {qid}: MISSED DANGER SIGN -> '{query}'")
            else:
                non_escalate_total += 1
                if not detected_as_emergency:
                    non_escalate_correct += 1
                    status_str = f"Safety Refusal ({match.rule_id})" if match else "Passed to Local Retrieval"
                    print(f"  [PASS] {qid}: Non-emergency handled safely -> {status_str}")
                else:
                    false_positives.append((qid, query, match.rule_id))
                    print(f"  [WARN] {qid}: False Positive Escalation -> {match.rule_id}")

    print("\n----------------------------------------------------------------------")
    print(f"EVALUATION RESULTS SUMMARY:")
    print(f"  Total Questions Evaluated       : {total_questions}")
    print(f"  Must-Escalate Cases             : {must_escalate_total}")
    print(f"  Must-Escalate Correctly Detected: {must_escalate_detected}")
    print(f"  Must-Escalate Missed            : {len(must_escalate_missed)}")
    
    detection_rate = (must_escalate_detected / must_escalate_total * 100.0) if must_escalate_total > 0 else 0.0
    print(f"  Must-Escalate Recall Rate       : {detection_rate:.2f}% (Target: 100.00%)")
    print(f"  Non-Escalate Specificity        : {(non_escalate_correct / non_escalate_total * 100.0):.2f}%")
    print("----------------------------------------------------------------------")

    if detection_rate < 100.0:
        print("\n[CRITICAL FAILURE] Must-escalate detection rate is below 100%!")
        for qid, q in must_escalate_missed:
            print(f"   - FAILED: {qid} => {q}")
        return False

    print("\n[SUCCESS] 100% detection of all critical danger signs achieved!")
    print("   Deterministic safety guard is fully verified for frontline deployment.\n")
    return True

if __name__ == "__main__":
    success = run_evaluation()
    sys.exit(0 if success else 1)
