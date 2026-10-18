export interface Citation {
  document: string;
  section: string;
  protocol_id: string;
  title: string;
}

export interface EscalationDetails {
  rule_id: string;
  danger_type: string;
  action_required: string;
  emergency_contact: string;
}

export interface WhyThisAnswer {
  matched_excerpt: string;
  matched_terms: string[];
  retrieval_method: string;
  similarity_score: number;
}

export interface AskResponse {
  status: 'escalate_emergency' | 'refuse_clinical_prescription' | 'refuse_out_of_scope' | 'answered';
  is_emergency: boolean;
  escalation_details?: EscalationDetails | null;
  answer: string;
  citations: Citation[];
  confidence: 'High' | 'Medium' | 'Low' | 'None';
  confidence_score: number;
  why_this_answer?: WhyThisAnswer | null;
  disclaimer: string;
}

export interface HouseholdVisit {
  household_id: string;
  beneficiary_name: string;
  beneficiary_age: number;
  category: string;
  village: string;
  assigned_worker: string;
  next_visit_due: string;
  visit_status: 'pending' | 'completed';
  risk_flag: 'High' | 'Medium' | 'Normal';
  concise_visit_note?: string;
  last_visit_date?: string;
  completed_at?: string;
  days_due_diff: number;
  urgency_label: string;
}

export interface HouseholdStats {
  total_registered: number;
  overdue_count: number;
  due_today_count: number;
  due_soon_count: number;
  completed_count: number;
  high_risk_count: number;
}

export interface ProtocolStatus {
  pack_status: 'ready' | 'indexing' | 'empty';
  indexed_documents_count: number;
  total_chunks: number;
  source_documents: string[];
  offline_ready: boolean;
  last_indexed: string;
  retrieval_engine: string;
}

export type SupportedLanguage = 'en' | 'te';
