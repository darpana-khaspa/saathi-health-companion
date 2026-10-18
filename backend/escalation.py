"""
Deterministic Hard-Coded Escalation & Safety Engine for Saathi Health Companion.

NON-NEGOTIABLE SAFETY RULES IMPLEMENTATION:
1. Deterministic, hard-coded rules run BEFORE any retrieval or model generation.
2. 100% detection of critical danger signs (bleeding during pregnancy, serious newborn danger signs).
3. Zero hallucinated dosages: Antibiotic dosage inquiries are immediately refused and redirected to Medical Officers.
4. Transparent rule IDs and clear, structured emergency directives.
"""

import re
from typing import Optional, NamedTuple, List, Dict

class DangerRule(NamedTuple):
    rule_id: str
    danger_type: str
    category: str  # "Maternal_Emergency", "Newborn_Emergency", "Antibiotic_Refusal"
    is_emergency: bool
    action_required: str
    user_message: str
    primary_patterns: List[str]
    context_patterns: List[str] = []

# Configurable hard-coded emergency and safety rules
DANGER_RULES: List[DangerRule] = [
    # -------------------------------------------------------------
    # 1. OBSTETRIC EMERGENCY: BLEEDING DURING PREGNANCY / ANTEPARTUM
    # -------------------------------------------------------------
    DangerRule(
        rule_id="DANGER_PREG_BLEEDING",
        danger_type="Obstetric Hemorrhage / Antepartum Bleeding Emergency",
        category="Maternal_Emergency",
        is_emergency=True,
        action_required="Immediate transfer to First Referral Unit (FRU) or District Hospital via 108/102 ambulance.",
        user_message=(
            "🚨 CRITICAL OBSTETRIC EMERGENCY: Any vaginal bleeding or spotting during pregnancy "
            "is a medical emergency (risk of placenta previa, abruptio placentae, or miscarriage). "
            "1. Immediately arrange an emergency vehicle (Call 108/102 ambulance).\n"
            "2. Keep the pregnant woman lying on her left side with feet slightly elevated.\n"
            "3. Do NOT perform any vaginal examination or give home remedies.\n"
            "4. Alert the Medical Officer at the receiving facility immediately."
        ),
        primary_patterns=[
            r"\b(vaginal\s+bleeding|spotting|fresh\s+red\s+blood|antepartum\s+hemorrhage|bleeding\s+heavily|heavy\s+bleeding|bleeding\s+with\s+clots|blood\s+leakage|bleeding)\b"
        ],
        context_patterns=[
            r"\b(pregnant|pregnancy|trimester|weeks|month|gestation|gravida|expecting|womb)\b"
        ]
    ),

    # -------------------------------------------------------------
    # 2. POSTPARTUM EMERGENCY: POSTPARTUM HEMORRHAGE (PPH)
    # -------------------------------------------------------------
    DangerRule(
        rule_id="DANGER_POSTPARTUM_HEMORRHAGE",
        danger_type="Severe Postpartum Hemorrhage (PPH) Emergency",
        category="Maternal_Emergency",
        is_emergency=True,
        action_required="Immediate emergency transfer to FRU/CHC via 108 ambulance. Call MO immediately.",
        user_message=(
            "🚨 CRITICAL MATERNAL EMERGENCY: Severe postpartum bleeding (soaking multiple pads in an hour "
            "or continuous trickling of blood) is Postpartum Hemorrhage (PPH), a leading cause of maternal mortality.\n"
            "1. Immediately call 108/102 ambulance for urgent transfer.\n"
            "2. Perform uterine massage if trained to check if uterus is hard and contracted.\n"
            "3. Keep mother warm, lay flat, elevate legs to prevent shock.\n"
            "4. Do not leave the mother unattended."
        ),
        primary_patterns=[
            r"\b(soaked\s+[2-9]\s+pads|soaked\s+multiple\s+pads|pads\s+in\s+one\s+hour|postpartum\s+hemorrhage|pph|severe\s+postpartum\s+bleeding|heavy\s+bleeding\s+after\s+delivery)\b",
            r"\b(bleeding\s+heavily|bright\s+red\s+blood).*(delivered|postnatal|postpartum|after\s+delivery|baby\s+born)\b",
            r"\b(delivered|postnatal|postpartum).*(soaked\s+\d+\s+pads|bright\s+red\s+blood|bleeding\s+heavily)\b"
        ],
        context_patterns=[]
    ),

    # -------------------------------------------------------------
    # 3. MATERNAL EMERGENCY: PRE-ECLAMPSIA / ECLAMPSIA
    # -------------------------------------------------------------
    DangerRule(
        rule_id="DANGER_MATERNAL_ECLAMPSIA",
        danger_type="Severe Pre-eclampsia / Eclampsia Danger",
        category="Maternal_Emergency",
        is_emergency=True,
        action_required="Immediate emergency referral to FRU/District Hospital with parenteral magnesium sulphate capability.",
        user_message=(
            "🚨 CRITICAL OBSTETRIC EMERGENCY: Severe persistent headache, blurred vision, or high blood pressure "
            "(BP ≥ 140/90 or 160/110) are danger signs of Pre-eclampsia/Eclampsia.\n"
            "1. Immediately transfer to First Referral Unit (FRU) via 108 ambulance.\n"
            "2. Keep the patient in a quiet, low-stimulus environment.\n"
            "3. Monitor airway and protect against falls if convulsions occur.\n"
            "4. Ensure ANM/staff accompanies the patient with emergency delivery kit."
        ),
        primary_patterns=[
            r"\b(blurred\s+vision|vision\s+disturbance|bp\s+of\s+160|high\s+bp|hypertension|fits|seizures|convulsions)\b",
            r"\b(headache\b.*blurred\s+vision|blurred\s+vision\b.*headache)\b"
        ],
        context_patterns=[
            r"\b(pregnant|pregnancy|postnatal|postpartum|mother|maternal|trimester)\b"
        ]
    ),

    # -------------------------------------------------------------
    # 4. NEWBORN EMERGENCY: FITS / CONVULSIONS / SEIZURES
    # -------------------------------------------------------------
    DangerRule(
        rule_id="DANGER_NEWBORN_CONVULSIONS",
        danger_type="Neonatal Convulsions / Seizures (IMNCI Red Sign)",
        category="Newborn_Emergency",
        is_emergency=True,
        action_required="Immediate emergency transfer to Special Newborn Care Unit (SNCU) / District Hospital.",
        user_message=(
            "🚨 CRITICAL NEONATAL EMERGENCY: Convulsions, fits, twitching, or rhythmic spasms in a newborn "
            "indicate serious neurological compromise (birth asphyxia, neonatal meningitis, or severe sepsis).\n"
            "1. Immediately arrange 108 ambulance transfer to the nearest SNCU/District Hospital.\n"
            "2. Keep the infant warm (skin-to-skin KMC or warm wrapping during transport).\n"
            "3. Clear airway of secretions; do NOT feed anything into the mouth during or after fits.\n"
            "4. Accompany the family and alert the pediatric MO on duty."
        ),
        primary_patterns=[
            r"\b(convulsion|convulsions|fits|seizure|seizures|twitching|spasms)\b"
        ],
        context_patterns=[
            r"\b(newborn|infant|baby|neonate|neonatal|days\s+old|born)\b"
        ]
    ),

    # -------------------------------------------------------------
    # 5. NEWBORN EMERGENCY: INABILITY TO FEED / SEVERE CHEST INDRAWING / FAST BREATHING
    # -------------------------------------------------------------
    DangerRule(
        rule_id="DANGER_NEWBORN_RESPIRATORY_FEEDING",
        danger_type="Neonatal Respiratory Distress / Inability to Feed",
        category="Newborn_Emergency",
        is_emergency=True,
        action_required="Immediate emergency transfer to SNCU/FRU via 108 ambulance.",
        user_message=(
            "🚨 CRITICAL NEONATAL DANGER SIGN: Inability to suckle/feed or severe chest indrawing/grunting/fast breathing "
            "(>60 breaths/min) indicates Possible Serious Bacterial Infection (PSBI) or acute pneumonia.\n"
            "1. Immediately call 108 ambulance for transfer to SNCU/FRU.\n"
            "2. Keep the baby warm during transport (Kangaroo Mother Care).\n"
            "3. If baby can still swallow and journey is long, advise mother to express breast milk; otherwise do not force feed.\n"
            "4. Immediate clinical oxygen and parenteral antibiotic therapy by a physician is required."
        ),
        primary_patterns=[
            r"\b(unable\s+to\s+suckle|unable\s+to\s+feed|cannot\s+feed|refusing\s+to\s+feed|refusal\s+to\s+feed|cannot\s+suckle|not\s+feeding|stopped\s+feeding)\b",
            r"\b(chest\s+indrawing|chest\s+is\s+retracting|deep\s+chest\s+indrawing|grunting|stridor|faster\s+than\s+60|breaths\s+per\s+minute|rapid\s+breathing)\b"
        ],
        context_patterns=[
            r"\b(newborn|infant|baby|neonate|days\s+old|child)\b"
        ]
    ),

    # -------------------------------------------------------------
    # 6. NEWBORN EMERGENCY: SEVERE HYPOTHERMIA / LETHARGY / CYANOSIS
    # -------------------------------------------------------------
    DangerRule(
        rule_id="DANGER_NEWBORN_LETHARGY_HYPOTHERMIA",
        danger_type="Neonatal Severe Hypothermia / Extreme Lethargy / Cyanosis",
        category="Newborn_Emergency",
        is_emergency=True,
        action_required="Immediate emergency referral to SNCU/District Hospital.",
        user_message=(
            "🚨 CRITICAL NEONATAL EMERGENCY: Severe hypothermia (cold to touch), blue lips (cyanosis), "
            "or extreme lethargy (unconscious, not waking up, abnormally limp/floppy) indicate life-threatening illness.\n"
            "1. Immediately initiate skin-to-skin Kangaroo Mother Care (KMC) with warm cap and socks.\n"
            "2. Transfer urgently to the nearest SNCU/Hospital via 108 ambulance.\n"
            "3. Ensure the baby's airway is clear and avoid cold drafts.\n"
            "4. Continuous monitoring by ASHA/ANM during transport."
        ),
        primary_patterns=[
            r"\b(cold\s+to\s+touch|hypothermia|blue\s+lips|cyanosis|extreme\s+lethargy|not\s+waking\s+up|unconscious|floppy|limp|yellow\s+palms)\b"
        ],
        context_patterns=[
            r"\b(newborn|infant|baby|neonate|child)\b"
        ]
    ),

    # -------------------------------------------------------------
    # 7. NEWBORN EMERGENCY: CORD BLEEDING / SEVERE CORD SEPSIS
    # -------------------------------------------------------------
    DangerRule(
        rule_id="DANGER_NEWBORN_CORD_SEPSIS",
        danger_type="Neonatal Umbilical Cord Hemorrhage / Sepsis",
        category="Newborn_Emergency",
        is_emergency=True,
        action_required="Apply clean pressure to bleeding cord stump and immediately refer to FRU/SNCU.",
        user_message=(
            "🚨 CRITICAL NEONATAL DANGER SIGN: Continuous bleeding from the umbilical cord or cord pus with "
            "redness spreading to surrounding skin indicates cord hemorrhage or severe omphalitis (sepsis).\n"
            "1. Press a sterile clean gauze pad firmly on the bleeding cord stump.\n"
            "2. If ANM is present, re-tie the cord with a sterile umbilical clamp/thread immediately.\n"
            "3. Call 108 ambulance and transfer urgently to FRU/SNCU.\n"
            "4. Do not apply cow dung, ash, or unsterile oils to the navel."
        ),
        primary_patterns=[
            r"\b(cord\s+is\s+bleeding|umbilical\s+cord.*bleeding|cord.*bleeding\s+continuously|bleeding\s+from\s+cord|pus.*swollen\s+red|navel.*swollen\s+red)\b"
        ],
        context_patterns=[
            r"\b(infant|baby|newborn|neonate|cord|umbilical)\b"
        ]
    ),

    # -------------------------------------------------------------
    # 8. CLINICAL SAFETY REFUSAL: ANTIBIOTIC DOSAGES & PRESCRIPTION
    # -------------------------------------------------------------
    DangerRule(
        rule_id="REFUSAL_ANTIBIOTIC_PRESCRIPTION",
        danger_type="Prohibited Antibiotic Prescription / Dosage Request",
        category="Antibiotic_Refusal",
        is_emergency=False,
        action_required="Refer patient to Medical Officer (MO) at Primary Health Centre (PHC) for in-person evaluation.",
        user_message=(
            "⚠️ CLINICAL MEDICATION SAFETY REFUSAL:\n"
            "Saathi Health Companion is an offline decision-support protocol reference. "
            "In strict compliance with clinical safety protocols, this system NEVER calculates, recommends, or dispenses "
            "antibiotic dosages or prescription medications.\n\n"
            "Prescription antibiotics (such as Amoxicillin, Azithromycin, Ciprofloxacin, Cotrimoxazole, Metronidazole) "
            "must ONLY be determined by a certified Medical Officer (MO) or paediatrician following physical examination "
            "and accurate weight-based dosing.\n\n"
            "Recommended Frontline Action: Accompany or direct the patient to the nearest Primary Health Centre (PHC) "
            "or Sub-Centre clinic for clinical evaluation by the Medical Officer."
        ),
        primary_patterns=[
            r"\b(amoxicillin|azithromycin|ciprofloxacin|cotrimoxazole|metronidazole|cephalexin|augmentin|cefixime|doxycycline|erythromycin|ceftriaxone|ampicillin|gentamicin|antibiotic|antibiotics)\b"
        ],
        context_patterns=[
            r"\b(dose|dosage|mg|ml|syrup|suspension|tablet|tablets|how\s+many|how\s+much|prescribe|administer|give|drops)\b"
        ]
    )
]

class EscalationMatch(NamedTuple):
    rule_id: str
    danger_type: str
    category: str
    is_emergency: bool
    action_required: str
    user_message: str
    matched_term: str

def check_escalation_rules(query: str) -> Optional[EscalationMatch]:
    """
    Evaluates query against deterministic hard-coded rules.
    Runs strictly BEFORE any retrieval or model generation.
    Returns EscalationMatch if triggered, or None if safe to proceed.
    """
    if not query:
        return None
    
    clean_query = query.lower()
    
    for rule in DANGER_RULES:
        # Check primary patterns
        primary_matched = False
        matched_str = ""
        for pattern in rule.primary_patterns:
            m = re.search(pattern, clean_query, re.IGNORECASE)
            if m:
                primary_matched = True
                matched_str = m.group(0)
                break
        
        if not primary_matched:
            continue
        
        # If context patterns are defined, check if at least one matches
        if rule.context_patterns:
            context_matched = False
            for c_pat in rule.context_patterns:
                if re.search(c_pat, clean_query, re.IGNORECASE):
                    context_matched = True
                    break
            if not context_matched:
                continue
        
        # Rule triggered deterministically!
        return EscalationMatch(
            rule_id=rule.rule_id,
            danger_type=rule.danger_type,
            category=rule.category,
            is_emergency=rule.is_emergency,
            action_required=rule.action_required,
            user_message=rule.user_message,
            matched_term=matched_str
        )
        
    return None
