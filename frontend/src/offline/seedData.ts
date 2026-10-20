import { HouseholdVisit } from '../types';

export interface ProtocolItem {
  protocol_id: string;
  title: string;
  category: string;
  source_document: string;
  section_page: string;
  protocol_text: string;
  key_actions: string;
  disclaimer: string;
}

export const SEED_PROTOCOLS: ProtocolItem[] = [
  {
    protocol_id: "PROTO-ANC-001",
    title: "Antenatal Care (ANC) Schedule & Essential Interventions",
    category: "Maternal Health",
    source_document: "NHM_ASHA_Handbook_Module_6_Maternal_Health.pdf",
    section_page: "Section 3.2 Page 14",
    protocol_text: "Every pregnant woman must receive a minimum of four antenatal care (ANC) checkups: 1st visit within 12 weeks of pregnancy (registration and first checkup), 2nd visit between 14-26 weeks, 3rd visit between 28-34 weeks, and 4th visit between 36 weeks and delivery. Each visit must include recording maternal weight, blood pressure measurement, abdominal examination, hemoglobin testing for anemia, urine testing for protein/sugar, two doses of Tetanus Toxoid (TT/Td) vaccination, and daily Iron-Folic Acid (IFA) supplementation for 180 days starting from the second trimester. Calcium tablets (500mg twice daily) should be taken starting from 14 weeks.",
    key_actions: "1. Ensure early registration in first trimester. 2. Verify BP, weight, Hb, and urine test at PHC/Sub-centre. 3. Dispense IFA and Calcium tablets (never take together). 4. Help family prepare birth preparedness and complication readiness plan (transport, funds, donor).",
    disclaimer: "Synthetic demonstration protocol excerpt based on standard NHM guidelines. Not a substitute for formal clinical training."
  },
  {
    protocol_id: "PROTO-ANC-002",
    title: "Management of Mild Anemia in Pregnancy",
    category: "Maternal Health",
    source_document: "NHM_ASHA_Handbook_Module_6_Maternal_Health.pdf",
    section_page: "Section 4.1 Page 22",
    protocol_text: "Hemoglobin levels between 10.0 and 10.9 g/dL are classified as mild anemia; 7.0 to 9.9 g/dL is moderate anemia; less than 7.0 g/dL is severe anemia. For mild to moderate anemia, the pregnant woman must take two IFA tablets daily (one in morning, one in evening, after meals) along with vitamin C-rich foods (amla, lemon, guava) to enhance iron absorption. Advise avoiding tea or coffee within two hours of iron intake. Severe anemia (Hb < 7.0 g/dL) requires immediate referral to the Medical Officer at Primary Health Centre (PHC) for parenteral iron therapy or blood transfusion.",
    key_actions: "1. Check Hb using digital hemoglobinometer or Sub-centre records. 2. For mild/moderate anemia, provide 2 IFA tablets daily. 3. Educate on iron-rich foods (green leafy vegetables, jaggery, lentils). 4. If Hb < 7 g/dL, make immediate referral to PHC/FRU.",
    disclaimer: "Synthetic demonstration protocol excerpt based on standard NHM guidelines. Not a substitute for formal clinical training."
  },
  {
    protocol_id: "PROTO-ANC-003",
    title: "Non-Emergency Discomforts in Pregnancy",
    category: "Maternal Health",
    source_document: "NHM_ASHA_Handbook_Module_6_Maternal_Health.pdf",
    section_page: "Section 3.5 Page 18",
    protocol_text: "Common minor discomforts during pregnancy include morning sickness, backache, mild pedal edema (swelling of feet disappearing after resting/elevating feet), frequent urination, and heartburn. Morning sickness can be managed by eating small frequent meals and dry toast or crackers before getting out of bed. For swollen feet, advise resting with feet elevated for 30 minutes twice daily and avoid prolonged standing. Note: If facial swelling or hand swelling occurs alongside persistent headache and high BP (>140/90 mmHg), this is NOT a normal discomfort but pre-eclampsia requiring urgent hospital referral.",
    key_actions: "1. Reassure the mother about normal anatomical adaptations. 2. Recommend dietary adjustments (small frequent meals). 3. Advise 30-minute leg elevation for mild dependent foot edema. 4. Differentiate normal pedal swelling from pre-eclampsia (facial edema + headache).",
    disclaimer: "Synthetic demonstration protocol excerpt based on standard NHM guidelines. Not a substitute for formal clinical training."
  },
  {
    protocol_id: "PROTO-HBNC-001",
    title: "Home-Based Newborn Care (HBNC) Visit Schedule",
    category: "Newborn Care",
    source_document: "Operational_Guidelines_Home_Based_Newborn_Care.pdf",
    section_page: "Module 7 Section 2 Page 19",
    protocol_text: "For institutional deliveries, ASHA must conduct 6 home visits on days 3, 7, 14, 21, 28, and 42. For home deliveries, ASHA must conduct 7 home visits on days 1 (within 24 hours), 3, 7, 14, 21, 28, and 42. For low birth weight (LBW < 2500g) babies, additional visits on days 2, 5, 10, 18, 24, 35 must be made. During each visit: weigh the infant, measure arm circumference, check axillary temperature, assess breastfeeding adequacy, inspect umbilical cord for sepsis, examine skin for rashes or jaundice, and assess for respiratory danger signs.",
    key_actions: "1. Complete all 6 visits for institutional or 7 for home births. 2. Weigh baby using digital baby scale and record in MCP card. 3. Check for warmth and proper cord care (keep dry, nothing applied). 4. Support and verify exclusive breastfeeding.",
    disclaimer: "Synthetic demonstration protocol excerpt based on standard NHM guidelines. Not a substitute for formal clinical training."
  },
  {
    protocol_id: "PROTO-HBNC-002",
    title: "Thermal Care & Kangaroo Mother Care (KMC) for Low Birth Weight Infants",
    category: "Newborn Care",
    source_document: "Operational_Guidelines_Home_Based_Newborn_Care.pdf",
    section_page: "Module 7 Section 3 Page 24",
    protocol_text: "Normal newborn axillary temperature is 36.5°C to 37.5°C. Hypothermia occurs when temperature drops below 36.5°C. For infants weighing less than 2000g or preterm infants, Kangaroo Mother Care (KMC) is essential. KMC consists of continuous skin-to-skin contact between mother's chest and baby's bare skin inside clothing, combined with frequent exclusive breastfeeding. KMC should be provided for at least 1-2 hours per session and as many hours per day as possible (ideally >18 hours). Delay bathing the newborn for at least 7 days in normal babies and until weight exceeds 2500g in LBW babies.",
    key_actions: "1. Advise skin-to-skin contact (KMC) in upright position. 2. Keep room warm, dry, and free of cold drafts. 3. Dress baby with cap, socks, and warm wrap. 4. Postpone bathing; keep baby clean with warm damp sponge if needed.",
    disclaimer: "Synthetic demonstration protocol excerpt based on standard NHM guidelines. Not a substitute for formal clinical training."
  },
  {
    protocol_id: "PROTO-INF-001",
    title: "Exclusive Breastfeeding and Complementary Feeding Guidelines",
    category: "Child Health",
    source_document: "MoHFW_Infant_Young_Child_Nutrition_Guidelines.pdf",
    section_page: "Section 2.1 Page 8",
    protocol_text: "Initiate breastfeeding within one hour of birth (golden hour). Colostrum (the thick yellowish first milk) contains rich antibodies and must NOT be discarded; it provides the newborn's first immunization. Exclusive breastfeeding is mandatory for the first 6 months (180 days) of life: no water, ghutti, honey, animal milk, or infant formula should be given. Breastfeed on demand, at least 8 to 12 times in 24 hours, day and night. At completion of 6 months, introduce soft mashed complementary foods (khichdi, mashed dal, banana, porridge with a spoonful of ghee) while continuing breastfeeding up to 2 years or beyond.",
    key_actions: "1. Promote early initiation within 1 hour of birth. 2. Reinforce zero prelacteal feeds (no honey, no water). 3. Ensure proper latching (wide open mouth, chin touching breast). 4. Guide timely initiation of complementary feeding at 6 completed months.",
    disclaimer: "Synthetic demonstration protocol excerpt based on standard NHM guidelines. Not a substitute for formal clinical training."
  },
  {
    protocol_id: "PROTO-IMM-001",
    title: "National Routine Immunization Schedule (Birth to 12 Months)",
    category: "Immunization",
    source_document: "National_Immunization_Schedule_India_2023.pdf",
    section_page: "Annexure A Page 4",
    protocol_text: "At Birth: BCG, Hepatitis B birth dose (within 24 hours), and Oral Polio Vaccine (OPV-0). At 6 Weeks: Pentavalent-1 (DPT+HepB+Hib), OPV-1, Rotavirus-1, Fractional Inactivated Polio Vaccine (fIPV-1), and Pneumococcal Conjugate Vaccine (PCV-1). At 10 Weeks: Pentavalent-2, OPV-2, and Rotavirus-2. At 14 Weeks: Pentavalent-3, OPV-3, Rotavirus-3, fIPV-2, and PCV-2. At 9-12 Months: Measles-Rubella-1 (MR-1), PCV Booster, Japanese Encephalitis-1 (JE-1 in endemic districts), and Vitamin A 1st dose (100,000 IU). Maintain cold chain between +2°C and +8°C for all vaccines.",
    key_actions: "1. Track infant due dates using Mother and Child Protection (MCP) card. 2. Mobilize mothers to village Village Health Sanitation and Nutrition Day (VHSND). 3. Advise mother about mild post-vaccine fever and paracetamol drops as advised by ANM. 4. Never discard open vaccine vials outside standard open vial policy.",
    disclaimer: "Synthetic demonstration protocol excerpt based on standard NHM guidelines. Not a substitute for formal clinical training."
  },
  {
    protocol_id: "PROTO-NUT-001",
    title: "Screening and Management of Acute Diarrhea in Children",
    category: "Child Health",
    source_document: "MoHFW_IMNCI_Guidelines_2022.pdf",
    section_page: "Section 5.1 Page 28",
    protocol_text: "Diarrhea is passage of 3 or more loose or watery stools per day. Assessment: Check for signs of dehydration (sunken eyes, skin pinch goes back slowly or very slowly, restlessness or lethargy, inability to drink). Plan A (No dehydration): Give extra home available fluids (dal water, buttermilk, rice kanji) and ORS after each loose stool (50-100 ml for child <2 years; 100-200 ml for child >2 years). Preparation of standard WHO-ORS packet: Dissolve the ENTIRE packet in exactly 1 litre of clean drinking water; use within 24 hours. Zinc supplementation: 20mg elemental zinc daily (10mg for infants under 6 months) for 14 continuous days to prevent recurrence. Continue normal breastfeeding and food.",
    key_actions: "1. Assess degree of dehydration (skin pinch, thirst, alertness). 2. Instruct caregiver to prepare 1 full packet WHO-ORS in exactly 1 L clean water. 3. Administer Zinc tablet for 14 full days even after diarrhea stops. 4. Watch for danger signs: blood in stool, severe vomiting, lethargy.",
    disclaimer: "Synthetic demonstration protocol excerpt based on standard NHM guidelines. Not a substitute for formal clinical training."
  },
  {
    protocol_id: "PROTO-NUT-002",
    title: "Identification and Screening of Severe Acute Malnutrition (SAM)",
    category: "Nutrition",
    source_document: "Operational_Guidelines_Facility_Based_SAM_Management.pdf",
    section_page: "Section 1.4 Page 11",
    protocol_text: "Severe Acute Malnutrition (SAM) in children 6-59 months is defined by: 1) Mid-Upper Arm Circumference (MUAC) less than 115 mm (red zone on Shakir tape), OR 2) Weight-for-Height Z-score less than -3 SD on WHO growth charts, OR 3) Presence of bilateral pitting edema of feet. A child with SAM with medical complications (anorexia, hypoglycemia, hypothermia, high fever, severe dehydration) must be referred immediately to the Nutrition Rehabilitation Centre (NRC) at District Hospital/CHC. For SAM without medical complications, initiate Community-Based Management of Acute Malnutrition (CMAM) under ANM/Medical Officer supervision.",
    key_actions: "1. Measure MUAC of all children 6-59 months at VHSND using color-coded tape. 2. Screen for bilateral pitting edema by pressing tops of both feet for 3 seconds. 3. If MUAC < 115mm or edema present, alert ANM and facilitate NRC referral. 4. Counsel family on energy-dense nutrient foods and hygiene.",
    disclaimer: "Synthetic demonstration protocol excerpt based on standard NHM guidelines. Not a substitute for formal clinical training."
  },
  {
    protocol_id: "PROTO-PNC-001",
    title: "Postpartum Care and Maternal Danger Signs",
    category: "Maternal Health",
    source_document: "NHM_ASHA_Handbook_Module_6_Maternal_Health.pdf",
    section_page: "Section 6.3 Page 38",
    protocol_text: "Postpartum visits for the mother occur concurrently with HBNC visits. Routine care: Ensure maternal rest, nutritious diet, IFA continuation for 180 days postpartum, perineal hygiene, and family planning counseling (PPIUCD, Chhaya, Antara). Danger signs requiring immediate emergency transfer: 1) Heavy bleeding soaking more than 2 pads in 1 hour or continuous trickling, 2) Foul-smelling lochia / vaginal discharge with fever >38°C (puerperal sepsis), 3) Severe persistent headache, vision disturbance, or epigastric pain (postpartum eclampsia), 4) Calf pain, tenderness, or unilateral leg swelling (deep vein thrombosis), 5) Severe sadness, crying spells, or thoughts of self-harm (postpartum depression/psychosis).",
    key_actions: "1. Monitor maternal temperature, lochia color and odor, and healing of episiotomy. 2. Verify mother is taking daily IFA and calcium. 3. Immediately refer mother to FRU/CHC if heavy bleeding, foul discharge, or severe headache occurs. 4. Guide initiation of postpartum contraception before discharge or at 6 weeks.",
    disclaimer: "Synthetic demonstration protocol excerpt based on standard NHM guidelines. Not a substitute for formal clinical training."
  }
];

export const SEED_HOUSEHOLDS: HouseholdVisit[] = [
  {
    household_id: "HH-001",
    beneficiary_name: "Priya Sharma",
    beneficiary_age: 23,
    category: "High-Risk Pregnancy",
    village: "Rampur",
    assigned_worker: "ASHA Sunita",
    next_visit_due: "2026-10-14",
    visit_status: "pending",
    risk_flag: "High",
    concise_visit_note: "ANC 3rd visit overdue; mild anemia detected (Hb 9.8 g/dL) - verify IFA compliance",
    last_visit_date: "2026-09-15",
    days_due_diff: -4,
    urgency_label: "Overdue"
  },
  {
    household_id: "HH-002",
    beneficiary_name: "Sunita Devi",
    beneficiary_age: 26,
    category: "Infant Immunization",
    village: "Kalyanpur",
    assigned_worker: "ASHA Geeta",
    next_visit_due: "2026-10-15",
    visit_status: "pending",
    risk_flag: "Medium",
    concise_visit_note: "Pentavalent-1 and Rota-1 overdue by 3 days; mobilize mother to VHSND",
    last_visit_date: "2026-09-10",
    days_due_diff: -3,
    urgency_label: "Overdue"
  },
  {
    household_id: "HH-003",
    beneficiary_name: "Radha Bai",
    beneficiary_age: 19,
    category: "Postnatal Care (PNC)",
    village: "Rampur",
    assigned_worker: "ASHA Sunita",
    next_visit_due: "2026-10-18",
    visit_status: "pending",
    risk_flag: "High",
    concise_visit_note: "Day 7 postnatal visit due today; monitor newborn cord stump and exclusive breastfeeding",
    last_visit_date: "2026-10-11",
    days_due_diff: 0,
    urgency_label: "Due Today"
  },
  {
    household_id: "HH-004",
    beneficiary_name: "Kavitha Reddy",
    beneficiary_age: 28,
    category: "Antenatal Care (ANC)",
    village: "Shivpur",
    assigned_worker: "ANM Rekha",
    next_visit_due: "2026-10-18",
    visit_status: "pending",
    risk_flag: "Normal",
    concise_visit_note: "ANC 2nd visit due today; record maternal weight and blood pressure at sub-centre",
    last_visit_date: "2026-08-20",
    days_due_diff: 0,
    urgency_label: "Due Today"
  },
  {
    household_id: "HH-005",
    beneficiary_name: "Anitha Bai",
    beneficiary_age: 22,
    category: "Newborn Care",
    village: "Kalyanpur",
    assigned_worker: "ASHA Geeta",
    next_visit_due: "2026-10-20",
    visit_status: "pending",
    risk_flag: "High",
    concise_visit_note: "LBW baby (2100g); Day 14 KMC check and verify weight gain progression",
    last_visit_date: "2026-10-13",
    days_due_diff: 2,
    urgency_label: "Due Soon"
  },
  {
    household_id: "HH-006",
    beneficiary_name: "Meena Kumari",
    beneficiary_age: 25,
    category: "Child Nutrition (SAM/MAM)",
    village: "Ganeshpur",
    assigned_worker: "ASHA Sunita",
    next_visit_due: "2026-10-21",
    visit_status: "pending",
    risk_flag: "High",
    concise_visit_note: "MUAC measured 118mm (yellow zone); follow up home dietary counseling and Zinc",
    last_visit_date: "2026-10-07",
    days_due_diff: 3,
    urgency_label: "Due Soon"
  },
  {
    household_id: "HH-007",
    beneficiary_name: "Lakshmi Devi",
    beneficiary_age: 31,
    category: "Antenatal Care (ANC)",
    village: "Rampur",
    assigned_worker: "ASHA Sunita",
    next_visit_due: "2026-10-24",
    visit_status: "pending",
    risk_flag: "Normal",
    concise_visit_note: "ANC 4th visit scheduled; finalize birth preparedness plan and vehicle booking",
    last_visit_date: "2026-09-28",
    days_due_diff: 6,
    urgency_label: "Upcoming"
  },
  {
    household_id: "HH-008",
    beneficiary_name: "Pooja Patel",
    beneficiary_age: 20,
    category: "Infant Immunization",
    village: "Shivpur",
    assigned_worker: "ANM Rekha",
    next_visit_due: "2026-10-26",
    visit_status: "pending",
    risk_flag: "Normal",
    concise_visit_note: "Infant 14 weeks visit; Pentavalent-3 and fIPV-2 booster due",
    last_visit_date: "2026-09-22",
    days_due_diff: 8,
    urgency_label: "Upcoming"
  },
  {
    household_id: "HH-009",
    beneficiary_name: "Rani Varma",
    beneficiary_age: 24,
    category: "Postnatal Care (PNC)",
    village: "Ganeshpur",
    assigned_worker: "ASHA Geeta",
    next_visit_due: "2026-10-12",
    visit_status: "completed",
    risk_flag: "Normal",
    concise_visit_note: "Day 3 postnatal visit completed; lactation established well",
    last_visit_date: "2026-10-12",
    completed_at: "2026-10-12T11:30:00",
    days_due_diff: -6,
    urgency_label: "Completed"
  },
  {
    household_id: "HH-010",
    beneficiary_name: "Savitri Nayak",
    beneficiary_age: 27,
    category: "Antenatal Care (ANC)",
    village: "Kalyanpur",
    assigned_worker: "ASHA Geeta",
    next_visit_due: "2026-10-16",
    visit_status: "completed",
    risk_flag: "Normal",
    concise_visit_note: "ANC 1st trimester checkup completed; Td-1 and folic acid administered",
    last_visit_date: "2026-10-16",
    completed_at: "2026-10-16T14:15:00",
    days_due_diff: -2,
    urgency_label: "Completed"
  },
  {
    household_id: "HH-011",
    beneficiary_name: "Deepa Mandavi",
    beneficiary_age: 21,
    category: "High-Risk Pregnancy",
    village: "Shivpur",
    assigned_worker: "ANM Rekha",
    next_visit_due: "2026-10-13",
    visit_status: "pending",
    risk_flag: "High",
    concise_visit_note: "Overdue by 5 days; previous history of pre-eclampsia - check BP immediately",
    last_visit_date: "2026-09-12",
    days_due_diff: -5,
    urgency_label: "Overdue"
  },
  {
    household_id: "HH-012",
    beneficiary_name: "Fatima Begum",
    beneficiary_age: 29,
    category: "Child Nutrition (SAM/MAM)",
    village: "Rampur",
    assigned_worker: "ASHA Sunita",
    next_visit_due: "2026-10-28",
    visit_status: "pending",
    risk_flag: "Medium",
    concise_visit_note: "Follow-up after NRC discharge; assess weight trajectory and hygiene",
    last_visit_date: "2026-10-14",
    days_due_diff: 10,
    urgency_label: "Upcoming"
  }
];
