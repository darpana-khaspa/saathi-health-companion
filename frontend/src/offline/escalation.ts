import { AskResponse, EscalationDetails } from '../types';

export interface DangerRuleClient {
  rule_id: string;
  danger_type: string;
  category: 'Maternal_Emergency' | 'Newborn_Emergency' | 'Antibiotic_Refusal';
  is_emergency: boolean;
  action_required: string;
  user_message: string;
  primary_patterns: RegExp[];
  context_patterns: RegExp[];
}

export const CLIENT_DANGER_RULES: DangerRuleClient[] = [
  // 1. OBSTETRIC EMERGENCY: BLEEDING DURING PREGNANCY / ANTEPARTUM
  {
    rule_id: 'DANGER_PREG_BLEEDING',
    danger_type: 'Obstetric Hemorrhage / Antepartum Bleeding Emergency',
    category: 'Maternal_Emergency',
    is_emergency: true,
    action_required: 'Immediate transfer to First Referral Unit (FRU) or District Hospital via 108/102 ambulance.',
    user_message:
      '🚨 CRITICAL OBSTETRIC EMERGENCY: Any vaginal bleeding or spotting during pregnancy is a medical emergency (risk of placenta previa, abruptio placentae, or miscarriage).\n' +
      '1. Immediately arrange an emergency vehicle (Call 108/102 ambulance).\n' +
      '2. Keep the pregnant woman lying on her left side with feet slightly elevated.\n' +
      '3. Do NOT perform any vaginal examination or give home remedies.\n' +
      '4. Alert the Medical Officer at the receiving facility immediately.',
    primary_patterns: [
      /\b(vaginal\s+bleeding|spotting|fresh\s+red\s+blood|antepartum\s+hemorrhage|bleeding\s+heavily|heavy\s+bleeding|bleeding\s+with\s+clots|blood\s+leakage|bleeding)\b/i
    ],
    context_patterns: [
      /\b(pregnant|pregnancy|trimester|weeks|month|gestation|gravida|expecting|womb)\b/i
    ]
  },

  // 2. POSTPARTUM EMERGENCY: POSTPARTUM HEMORRHAGE (PPH)
  {
    rule_id: 'DANGER_POSTPARTUM_HEMORRHAGE',
    danger_type: 'Severe Postpartum Hemorrhage (PPH) Emergency',
    category: 'Maternal_Emergency',
    is_emergency: true,
    action_required: 'Immediate emergency transfer to FRU/CHC via 108 ambulance. Call MO immediately.',
    user_message:
      '🚨 CRITICAL MATERNAL EMERGENCY: Severe postpartum bleeding (soaking multiple pads in an hour or continuous trickling of blood) is Postpartum Hemorrhage (PPH), a leading cause of maternal mortality.\n' +
      '1. Immediately call 108/102 ambulance for urgent transfer.\n' +
      '2. Perform uterine massage if trained to check if uterus is hard and contracted.\n' +
      '3. Keep mother warm, lay flat, elevate legs to prevent shock.\n' +
      '4. Do not leave the mother unattended.',
    primary_patterns: [
      /\b(soaked\s+[2-9]\s+pads|soaked\s+multiple\s+pads|pads\s+in\s+one\s+hour|postpartum\s+hemorrhage|pph|severe\s+postpartum\s+bleeding|heavy\s+bleeding\s+after\s+delivery)\b/i,
      /\b(bleeding\s+heavily|bright\s+red\s+blood)[\s\S]*(delivered|postnatal|postpartum|after\s+delivery|baby\s+born)\b/i,
      /\b(delivered|postnatal|postpartum)[\s\S]*(soaked\s+\d+\s+pads|bright\s+red\s+blood|bleeding\s+heavily)\b/i
    ],
    context_patterns: []
  },

  // 3. MATERNAL EMERGENCY: PRE-ECLAMPSIA / ECLAMPSIA
  {
    rule_id: 'DANGER_MATERNAL_ECLAMPSIA',
    danger_type: 'Severe Pre-eclampsia / Eclampsia Danger',
    category: 'Maternal_Emergency',
    is_emergency: true,
    action_required: 'Immediate emergency referral to FRU/District Hospital with parenteral magnesium sulphate capability.',
    user_message:
      '🚨 CRITICAL OBSTETRIC EMERGENCY: Severe persistent headache, blurred vision, or high blood pressure (BP ≥ 140/90 or 160/110) are danger signs of Pre-eclampsia/Eclampsia.\n' +
      '1. Immediately transfer to First Referral Unit (FRU) via 108 ambulance.\n' +
      '2. Keep the patient in a quiet, low-stimulus environment.\n' +
      '3. Monitor airway and protect against falls if convulsions occur.\n' +
      '4. Ensure ANM/staff accompanies the patient with emergency delivery kit.',
    primary_patterns: [
      /\b(blurred\s+vision|vision\s+disturbance|bp\s+of\s+160|high\s+bp|hypertension|fits|seizures|convulsions)\b/i,
      /\b(headache[\s\S]*blurred\s+vision|blurred\s+vision[\s\S]*headache)\b/i
    ],
    context_patterns: [
      /\b(pregnant|pregnancy|postnatal|postpartum|mother|maternal|trimester)\b/i
    ]
  },

  // 4. NEWBORN EMERGENCY: FITS / CONVULSIONS / SEIZURES
  {
    rule_id: 'DANGER_NEWBORN_CONVULSIONS',
    danger_type: 'Neonatal Convulsions / Seizures (IMNCI Red Sign)',
    category: 'Newborn_Emergency',
    is_emergency: true,
    action_required: 'Immediate emergency transfer to Special Newborn Care Unit (SNCU) / District Hospital.',
    user_message:
      '🚨 CRITICAL NEONATAL EMERGENCY: Convulsions, fits, twitching, or rhythmic spasms in a newborn indicate serious neurological compromise (birth asphyxia, neonatal meningitis, or severe sepsis).\n' +
      '1. Immediately arrange 108 ambulance transfer to the nearest SNCU/District Hospital.\n' +
      '2. Keep the infant warm (skin-to-skin KMC or warm wrapping during transport).\n' +
      '3. Clear airway of secretions; do NOT feed anything into the mouth during or after fits.\n' +
      '4. Accompany the family and alert the pediatric MO on duty.',
    primary_patterns: [
      /\b(convulsion|convulsions|fits|seizure|seizures|twitching|spasms)\b/i
    ],
    context_patterns: [
      /\b(newborn|infant|baby|neonate|neonatal|days\s+old|born)\b/i
    ]
  },

  // 5. NEWBORN EMERGENCY: INABILITY TO FEED / SEVERE CHEST INDRAWING
  {
    rule_id: 'DANGER_NEWBORN_RESPIRATORY_FEEDING',
    danger_type: 'Neonatal Respiratory Distress / Inability to Feed',
    category: 'Newborn_Emergency',
    is_emergency: true,
    action_required: 'Immediate emergency transfer to SNCU/FRU via 108 ambulance.',
    user_message:
      '🚨 CRITICAL NEONATAL DANGER SIGN: Inability to suckle/feed or severe chest indrawing/grunting/fast breathing (>60 breaths/min) indicates Possible Serious Bacterial Infection (PSBI) or acute pneumonia.\n' +
      '1. Immediately call 108 ambulance for transfer to SNCU/FRU.\n' +
      '2. Keep the baby warm during transport (Kangaroo Mother Care).\n' +
      '3. If baby can still swallow and journey is long, advise mother to express breast milk; otherwise do not force feed.\n' +
      '4. Immediate clinical oxygen and parenteral antibiotic therapy by a physician is required.',
    primary_patterns: [
      /\b(unable\s+to\s+suckle|unable\s+to\s+feed|cannot\s+feed|refusing\s+to\s+feed|refusal\s+to\s+feed|cannot\s+suckle|not\s+feeding|stopped\s+feeding)\b/i,
      /\b(chest\s+indrawing|chest\s+is\s+retracting|deep\s+chest\s+indrawing|grunting|stridor|faster\s+than\s+60|breaths\s+per\s+minute|rapid\s+breathing)\b/i
    ],
    context_patterns: [
      /\b(newborn|infant|baby|neonate|days\s+old|child)\b/i
    ]
  },

  // 6. NEWBORN EMERGENCY: SEVERE HYPOTHERMIA / LETHARGY / CYANOSIS
  {
    rule_id: 'DANGER_NEWBORN_LETHARGY_HYPOTHERMIA',
    danger_type: 'Neonatal Severe Hypothermia / Extreme Lethargy / Cyanosis',
    category: 'Newborn_Emergency',
    is_emergency: true,
    action_required: 'Immediate emergency referral to SNCU/District Hospital.',
    user_message:
      '🚨 CRITICAL NEONATAL EMERGENCY: Severe hypothermia (cold to touch), blue lips (cyanosis), or extreme lethargy (unconscious, not waking up, abnormally limp/floppy) indicate life-threatening illness.\n' +
      '1. Immediately initiate skin-to-skin Kangaroo Mother Care (KMC) with warm cap and socks.\n' +
      '2. Transfer urgently to the nearest SNCU/Hospital via 108 ambulance.\n' +
      '3. Ensure the baby\'s airway is clear and avoid cold drafts.\n' +
      '4. Continuous monitoring by ASHA/ANM during transport.',
    primary_patterns: [
      /\b(cold\s+to\s+touch|hypothermia|blue\s+lips|cyanosis|extreme\s+lethargy|not\s+waking\s+up|unconscious|floppy|limp|yellow\s+palms)\b/i
    ],
    context_patterns: [
      /\b(newborn|infant|baby|neonate|child)\b/i
    ]
  },

  // 7. NEWBORN EMERGENCY: CORD BLEEDING / SEVERE CORD SEPSIS
  {
    rule_id: 'DANGER_NEWBORN_CORD_SEPSIS',
    danger_type: 'Neonatal Umbilical Cord Hemorrhage / Sepsis',
    category: 'Newborn_Emergency',
    is_emergency: true,
    action_required: 'Apply clean pressure to bleeding cord stump and immediately refer to FRU/SNCU.',
    user_message:
      '🚨 CRITICAL NEONATAL DANGER SIGN: Continuous bleeding from the umbilical cord or cord pus with redness spreading to surrounding skin indicates cord hemorrhage or severe omphalitis (sepsis).\n' +
      '1. Press a sterile clean gauze pad firmly on the bleeding cord stump.\n' +
      '2. If ANM is present, re-tie the cord with a sterile umbilical clamp/thread immediately.\n' +
      '3. Call 108 ambulance and transfer urgently to FRU/SNCU.\n' +
      '4. Do not apply cow dung, ash, or unsterile oils to the navel.',
    primary_patterns: [
      /\b(cord\s+is\s+bleeding|umbilical\s+cord[\s\S]*bleeding|cord[\s\S]*bleeding\s+continuously|bleeding\s+from\s+cord|pus[\s\S]*swollen\s+red|navel[\s\S]*swollen\s+red)\b/i
    ],
    context_patterns: [
      /\b(infant|baby|newborn|neonate|cord|umbilical)\b/i
    ]
  },

  // 8. CLINICAL SAFETY REFUSAL: ANTIBIOTIC DOSAGES & PRESCRIPTION
  {
    rule_id: 'REFUSAL_ANTIBIOTIC_PRESCRIPTION',
    danger_type: 'Prohibited Antibiotic Prescription / Dosage Request',
    category: 'Antibiotic_Refusal',
    is_emergency: false,
    action_required: 'Refer patient to Medical Officer (MO) at Primary Health Centre (PHC) for in-person evaluation.',
    user_message:
      '⚠️ CLINICAL MEDICATION SAFETY REFUSAL:\n' +
      'Saathi Health Companion is an offline decision-support protocol reference. ' +
      'In strict compliance with clinical safety protocols, this system NEVER calculates, recommends, or dispenses ' +
      'antibiotic dosages or prescription medications.\n\n' +
      'Prescription antibiotics (such as Amoxicillin, Azithromycin, Ciprofloxacin, Cotrimoxazole, Metronidazole) ' +
      'must ONLY be determined by a certified Medical Officer (MO) or paediatrician following physical examination ' +
      'and accurate weight-based dosing.\n\n' +
      'Recommended Frontline Action: Accompany or direct the patient to the nearest Primary Health Centre (PHC) ' +
      'or Sub-Centre clinic for clinical evaluation by the Medical Officer.',
    primary_patterns: [
      /\b(amoxicillin|azithromycin|ciprofloxacin|cotrimoxazole|metronidazole|cephalexin|augmentin|cefixime|doxycycline|erythromycin|ceftriaxone|ampicillin|gentamicin|antibiotic|antibiotics)\b/i
    ],
    context_patterns: [
      /\b(dose|dosage|mg|ml|syrup|suspension|tablet|tablets|how\s+many|how\s+much|prescribe|administer|give|drops)\b/i
    ]
  }
];

export function evaluateClientDangerSigns(query: string): AskResponse | null {
  if (!query || !query.trim()) {
    return null;
  }

  const cleanQuery = query.toLowerCase();

  for (const rule of CLIENT_DANGER_RULES) {
    let primaryMatched = false;
    for (const pat of rule.primary_patterns) {
      if (pat.test(cleanQuery)) {
        primaryMatched = true;
        break;
      }
    }

    if (!primaryMatched) continue;

    if (rule.context_patterns.length > 0) {
      let contextMatched = false;
      for (const cPat of rule.context_patterns) {
        if (cPat.test(cleanQuery)) {
          contextMatched = true;
          break;
        }
      }
      if (!contextMatched) continue;
    }

    // Rule Triggered Deterministically!
    const escalationDetails: EscalationDetails = {
      rule_id: rule.rule_id,
      danger_type: rule.danger_type,
      action_required: rule.action_required,
      emergency_contact: rule.is_emergency
        ? '108 / 102 Emergency Medical Service'
        : 'Refer to PHC Medical Officer'
    };

    return {
      status: rule.is_emergency ? 'escalate_emergency' : 'refuse_clinical_prescription',
      is_emergency: rule.is_emergency,
      escalation_details: escalationDetails,
      answer: rule.user_message,
      citations: [],
      confidence: 'High',
      confidence_score: 1.0,
      why_this_answer: null,
      disclaimer: 'This is a decision-support prototype for frontline health workers, not a doctor. In emergencies, call 108/102 immediately.'
    };
  }

  return null;
}
