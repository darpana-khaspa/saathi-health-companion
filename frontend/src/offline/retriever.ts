import { AskResponse, Citation, WhyThisAnswer } from '../types';
import { ProtocolItem, SEED_PROTOCOLS } from './seedData';

const ENGLISH_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
  'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
  'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
  'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
  'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
  'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
  'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
  'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours',
  'yourself', 'yourselves'
]);

const CLINICAL_KEYWORDS = [
  'ors', 'rehydration', 'diarrhea', 'dehydration', 'zinc',
  'anc', 'antenatal', 'trimester', 'gestation', 'pregnancy', 'gravida',
  'kmc', 'kangaroo', 'hypothermia', 'lbw', 'preterm',
  'hbnc', 'newborn', 'neonate', 'cord', 'stump',
  'sam', 'mam', 'muac', 'malnutrition', 'wasting', 'edema',
  'immunization', 'vaccine', 'vaccination', 'bcg', 'opv', 'pentavalent', 'rotavirus', 'fipv', 'pcv',
  'anemia', 'ifa', 'hemoglobin', 'iron', 'folic',
  'pnc', 'postpartum', 'lochia', 'breastfeeding', 'colostrum', 'lactation'
];

interface IndexedDoc {
  protocol: ProtocolItem;
  tfIdfVector: Map<string, number>;
  norm: number;
  corpusText: string;
}

export class ClientProtocolRetriever {
  private protocols: ProtocolItem[] = [];
  private indexedDocs: IndexedDoc[] = [];
  private idfMap: Map<string, number> = new Map();
  private isIndexed: boolean = false;
  private lastIndexed: string = '';

  constructor(protocols?: ProtocolItem[]) {
    this.protocols = protocols && protocols.length > 0 ? protocols : SEED_PROTOCOLS;
    this.buildIndex();
  }

  public updateProtocols(protocols: ProtocolItem[]) {
    if (protocols && protocols.length > 0) {
      this.protocols = protocols;
      this.buildIndex();
    }
  }

  private tokenize(text: string): string[] {
    const matches = text.toLowerCase().match(/\b[a-z0-9]{2,}\b/g);
    if (!matches) return [];
    return matches.filter(tok => !ENGLISH_STOP_WORDS.has(tok));
  }

  private buildIndex() {
    const N = this.protocols.length;
    if (N === 0) {
      this.isIndexed = false;
      return;
    }

    const docTermFreqs: Map<string, number>[] = [];
    const docFrequency: Map<string, number> = new Map();

    // 1. Process terms & doc frequency
    for (const proto of this.protocols) {
      const combined = `${proto.title} ${proto.title} ${proto.category} ${proto.key_actions} ${proto.protocol_text}`;
      const tokens = this.tokenize(combined);
      const tfMap: Map<string, number> = new Map();

      for (const tok of tokens) {
        tfMap.set(tok, (tfMap.get(tok) || 0) + 1);
      }
      docTermFreqs.push(tfMap);

      for (const term of tfMap.keys()) {
        docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
      }
    }

    // 2. Compute smooth IDF: ln((1 + N) / (1 + df)) + 1
    this.idfMap.clear();
    for (const [term, df] of docFrequency.entries()) {
      const idf = Math.log((1 + N) / (1 + df)) + 1;
      this.idfMap.set(term, idf);
    }

    // 3. Compute sublinear TF-IDF vectors and L2 norms
    this.indexedDocs = [];
    for (let i = 0; i < N; i++) {
      const proto = this.protocols[i];
      const tfMap = docTermFreqs[i];
      const vector: Map<string, number> = new Map();
      let sumSq = 0;

      for (const [term, tf] of tfMap.entries()) {
        const idf = this.idfMap.get(term) || 1;
        // Sublinear tf: 1 + ln(tf)
        const sublinearTf = 1 + Math.log(tf);
        const weight = sublinearTf * idf;
        vector.set(term, weight);
        sumSq += weight * weight;
      }

      const norm = Math.sqrt(sumSq) || 1;
      const combined = `${proto.title} ${proto.title} ${proto.category} ${proto.key_actions} ${proto.protocol_text}`.toLowerCase();

      this.indexedDocs.push({
        protocol: proto,
        tfIdfVector: vector,
        norm,
        corpusText: combined
      });
    }

    this.isIndexed = true;
    this.lastIndexed = new Date().toISOString();
  }

  public search(query: string, topK: number = 2): AskResponse {
    if (!this.isIndexed || this.indexedDocs.length === 0) {
      return {
        status: 'refuse_out_of_scope',
        is_emergency: false,
        escalation_details: null,
        answer:
          '⚠️ PROTOCOL PACK NOT LOADED: The client-side protocol knowledge base is currently empty or indexing. ' +
          'Please verify offline readiness.',
        citations: [],
        confidence: 'None',
        confidence_score: 0.0,
        why_this_answer: null,
        disclaimer: 'This is a decision-support prototype for frontline health workers.'
      };
    }

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) {
      return {
        status: 'refuse_out_of_scope',
        is_emergency: false,
        escalation_details: null,
        answer: '⚠️ Query was too short or contained only common stop words. Please enter specific clinical signs or protocol questions.',
        citations: [],
        confidence: 'None',
        confidence_score: 0.0,
        why_this_answer: null,
        disclaimer: 'This is a decision-support prototype for frontline health workers.'
      };
    }

    // Compute query TF
    const queryTf: Map<string, number> = new Map();
    for (const tok of queryTokens) {
      queryTf.set(tok, (queryTf.get(tok) || 0) + 1);
    }

    // Compute query TF-IDF vector & norm
    const queryVector: Map<string, number> = new Map();
    let querySumSq = 0;
    for (const [term, tf] of queryTf.entries()) {
      const idf = this.idfMap.get(term) || Math.log((1 + this.indexedDocs.length) / 1) + 1;
      const weight = (1 + Math.log(tf)) * idf;
      queryVector.set(term, weight);
      querySumSq += weight * weight;
    }
    const queryNorm = Math.sqrt(querySumSq) || 1;

    // Compute cosine similarities
    const rawTokensSet = new Set(query.toLowerCase().match(/\b[a-z0-9]+\b/g) || []);
    const scores: { docIndex: number; baseScore: number; boostedScore: number }[] = [];

    for (let idx = 0; idx < this.indexedDocs.length; idx++) {
      const doc = this.indexedDocs[idx];
      let dotProduct = 0;

      for (const [term, qWeight] of queryVector.entries()) {
        const docWeight = doc.tfIdfVector.get(term);
        if (docWeight) {
          dotProduct += qWeight * docWeight;
        }
      }

      const baseScore = dotProduct / (queryNorm * doc.norm);
      let boostedScore = baseScore;

      // Clinical keywords boost
      if (baseScore > 0.05) {
        const matchedClinical = CLINICAL_KEYWORDS.filter(
          k => rawTokensSet.has(k) && doc.corpusText.includes(k)
        );
        if (matchedClinical.length > 0) {
          const boost = Math.min(matchedClinical.length * 0.06, 0.20);
          boostedScore += boost;
        }
      }

      scores.push({ docIndex: idx, baseScore, boostedScore });
    }

    scores.sort((a, b) => b.boostedScore - a.boostedScore);
    const topResult = scores[0];

    // Strict threshold check: top_score < 0.12 or base_similarity < 0.05
    if (!topResult || topResult.boostedScore < 0.12 || topResult.baseScore < 0.05) {
      return {
        status: 'refuse_out_of_scope',
        is_emergency: false,
        escalation_details: null,
        answer:
          '⚠️ OUT OF PROTOCOL SCOPE: This query does not match approved guidance in the currently loaded frontline protocol knowledge base. ' +
          'Saathi Health Companion adheres to strict clinical safety and does not generate speculative advice for topics outside certified public-health protocols.\n\n' +
          'Recommended Action: Please consult official National Health Mission (NHM) manuals or refer the patient to a certified Medical Officer at the Primary Health Centre (PHC).',
        citations: [],
        confidence: 'None',
        confidence_score: topResult ? Number(topResult.boostedScore.toFixed(3)) : 0.0,
        why_this_answer: null,
        disclaimer: 'This is a decision-support prototype for frontline health workers.'
      };
    }

    const topDoc = this.indexedDocs[topResult.docIndex];
    const topProto = topDoc.protocol;

    // Citations
    const citations: Citation[] = [];
    for (let i = 0; i < Math.min(topK, scores.length); i++) {
      const item = scores[i];
      if (item.boostedScore >= 0.12) {
        const p = this.indexedDocs[item.docIndex].protocol;
        citations.push({
          document: p.source_document,
          section: p.section_page,
          protocol_id: p.protocol_id,
          title: p.title
        });
      }
    }

    // Format grounded answer
    const answerParts = [
      `**${topProto.title}**`,
      `\n**Official Protocol Guidance:**\n${topProto.protocol_text}`
    ];
    if (topProto.key_actions) {
      answerParts.push(`\n**Frontline Action Checklist:**\n${topProto.key_actions}`);
    }
    const finalAnswer = answerParts.join('\n');

    // Confidence
    let confidence: 'High' | 'Medium' | 'Low' = 'Low';
    if (topResult.boostedScore >= 0.35) {
      confidence = 'High';
    } else if (topResult.boostedScore >= 0.20) {
      confidence = 'Medium';
    }

    // Why this answer matched terms & excerpt
    const docTextLower = `${topProto.title} ${topProto.protocol_text}`.toLowerCase();
    const matchedTerms = Array.from(rawTokensSet).filter(
      t => t.length >= 3 && docTextLower.includes(t)
    );

    const sentences = topProto.protocol_text.split(/(?<=[.!?])\s+/);
    const excerpt = sentences.length > 0 ? sentences.slice(0, 2).join(' ') : topProto.protocol_text.slice(0, 250) + '...';

    const why: WhyThisAnswer = {
      matched_excerpt: excerpt,
      matched_terms: matchedTerms,
      retrieval_method: 'Client-Side On-Device TF-IDF Engine (IndexedDB + zero network)',
      similarity_score: Number(topResult.boostedScore.toFixed(3))
    };

    return {
      status: 'answered',
      is_emergency: false,
      escalation_details: null,
      answer: finalAnswer,
      citations,
      confidence,
      confidence_score: Number(topResult.boostedScore.toFixed(3)),
      why_this_answer: why,
      disclaimer: 'This is a decision-support prototype for frontline health workers, not a doctor. Never exceed official protocol scope.'
    };
  }

  public getStatus() {
    return {
      pack_status: (this.protocols.length > 0 ? 'ready' : 'empty') as 'ready' | 'empty',
      indexed_documents_count: Array.from(new Set(this.protocols.map(p => p.source_document))).length,
      total_chunks: this.protocols.length,
      source_documents: Array.from(new Set(this.protocols.map(p => p.source_document))).sort(),
      offline_ready: true,
      last_indexed: this.lastIndexed || new Date().toISOString(),
      retrieval_engine: 'Client-Side Browser TF-IDF Engine (Zero Network Required)'
    };
  }
}

// Global client retriever singleton initialized with seed protocols
export const clientProtocolRetriever = new ClientProtocolRetriever(SEED_PROTOCOLS);
