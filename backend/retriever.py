"""
Offline Protocol Retrieval and Grounding Engine for Saathi Health Companion.

Uses local Scikit-Learn TF-IDF vectorization with n-gram indexing and keyword overlap.
Zero cloud API calls. Runs 100% locally on CPU in <10ms.
Enforces strict refusal when questions fall outside the protocol corpus.
"""

import csv
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.config import settings
from backend.models import Citation, WhyThisAnswer

class ProtocolRetriever:
    def __init__(self, csv_path: Optional[Path] = None):
        self.csv_path = csv_path or settings.PROTOCOL_CSV_PATH
        self.protocols: List[Dict[str, str]] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self.last_indexed: str = ""
        self.source_documents: List[str] = []
        self.load_and_index()

    def load_and_index(self) -> None:
        """Loads protocol CSV and builds local offline TF-IDF index."""
        if not self.csv_path.exists():
            # Check fallback in data/ or root
            alt_path = settings.DATA_DIR / "sample_protocol_knowledge_base.csv"
            if alt_path.exists():
                self.csv_path = alt_path
            else:
                self.protocols = []
                return

        loaded_protocols = []
        with open(self.csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                loaded_protocols.append({
                    "protocol_id": row.get("protocol_id", "").strip(),
                    "title": row.get("title", "").strip(),
                    "category": row.get("category", "").strip(),
                    "source_document": row.get("source_document", "").strip(),
                    "section_page": row.get("section_page", "").strip(),
                    "protocol_text": row.get("protocol_text", "").strip(),
                    "key_actions": row.get("key_actions", "").strip(),
                    "disclaimer": row.get("disclaimer", "").strip()
                })

        self.protocols = loaded_protocols
        self.source_documents = sorted(list(set(p["source_document"] for p in self.protocols if p.get("source_document"))))
        
        if not self.protocols:
            return

        # Prepare corpus for indexing
        # Combine title, category, key actions, and protocol text with emphasis on key clinical terms
        corpus = []
        for p in self.protocols:
            combined = f"{p['title']} {p['title']} {p['category']} {p['key_actions']} {p['protocol_text']}"
            corpus.append(combined)

        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english",
            token_pattern=r"(?u)\b[a-zA-Z0-9_\-\./]{2,}\b"
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        self.last_indexed = datetime.now().isoformat()

    def search(self, query: str, top_k: int = 2) -> Dict[str, Any]:
        """
        Searches protocols locally for the given query.
        Returns matched results or refusal if outside scope.
        """
        if not self.protocols or self.vectorizer is None or self.tfidf_matrix is None:
            return {
                "status": "refuse_out_of_scope",
                "answer": (
                    "⚠️ PROTOCOL PACK NOT LOADED: The protocol knowledge base is currently empty or indexing. "
                    "Please verify that protocol documents are placed in the configured data directory."
                ),
                "citations": [],
                "confidence": "None",
                "confidence_score": 0.0,
                "why_this_answer": None
            }

        # Transform query into TF-IDF vector
        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        query_tokens = set(re.findall(r"\b[a-z0-9\-]+\b", query.lower()))
        stop_words = {
            "what", "is", "the", "for", "and", "how", "can", "should", "give", "dose", "cycle",
            "stage", "with", "from", "are", "you", "when", "that", "this", "have", "has", "been",
            "patient", "patients", "drug", "drugs", "about", "care", "clinic", "case", "days"
        }
        filtered_tokens = {t for t in query_tokens if len(t) >= 4 and t not in stop_words}
        
        boosted_scores = np.copy(similarities)
        for idx, proto in enumerate(self.protocols):
            # Only apply domain term boost if base TF-IDF similarity has a genuine match
            if similarities[idx] > 0.08:
                combined_text = f"{proto['title']} {proto['key_actions']} {proto['protocol_text']}".lower()
                overlap = [t for t in filtered_tokens if t in combined_text]
                boost = min(len(overlap) * 0.03, 0.15)
                boosted_scores[idx] += boost

        top_indices = np.argsort(boosted_scores)[::-1][:top_k]
        top_idx = top_indices[0]
        top_score = float(boosted_scores[top_idx])

        # Strict out-of-scope refusal check: must exceed threshold and have base TF-IDF similarity
        if top_score < settings.RETRIEVAL_SIMILARITY_THRESHOLD or float(similarities[top_idx]) < 0.05:
            return {
                "status": "refuse_out_of_scope",
                "answer": (
                    "⚠️ OUT OF PROTOCOL SCOPE: This query does not match approved guidance in the currently "
                    "loaded frontline protocol knowledge base. Saathi Health Companion adheres to strict clinical safety "
                    "and does not generate speculative advice for topics outside certified public-health protocols.\n\n"
                    "Recommended Action: Please consult official National Health Mission (NHM) manuals or refer "
                    "the patient to a certified Medical Officer at the Primary Health Centre (PHC)."
                ),
                "citations": [],
                "confidence": "None",
                "confidence_score": round(top_score, 3),
                "why_this_answer": None
            }

        top_protocol = self.protocols[top_idx]
        
        # Build citations
        citations: List[Citation] = []
        for idx in top_indices:
            score = float(boosted_scores[idx])
            if score >= settings.RETRIEVAL_SIMILARITY_THRESHOLD:
                p = self.protocols[idx]
                citations.append(Citation(
                    document=p["source_document"],
                    section=p["section_page"],
                    protocol_id=p["protocol_id"],
                    title=p["title"]
                ))

        # Format extractive / template grounded answer
        answer_parts = [
            f"**{top_protocol['title']}**",
            f"\n**Official Protocol Guidance:**\n{top_protocol['protocol_text']}"
        ]
        
        if top_protocol.get("key_actions"):
            answer_parts.append(f"\n**Frontline Action Checklist:**\n{top_protocol['key_actions']}")
            
        final_answer = "\n".join(answer_parts)

        # Confidence level
        if top_score >= settings.HIGH_CONFIDENCE_THRESHOLD:
            confidence = "High"
        elif top_score >= 0.20:
            confidence = "Medium"
        else:
            confidence = "Low"

        # Determine matched terms for transparency
        top_text_lower = f"{top_protocol['title']} {top_protocol['protocol_text']}".lower()
        matched_terms = [t for t in query_tokens if len(t) >= 3 and t in top_text_lower]

        # Excerpt for "Why this answer?"
        sentences = re.split(r"(?<=[.!?])\s+", top_protocol["protocol_text"])
        excerpt = " ".join(sentences[:2]) if sentences else top_protocol["protocol_text"][:250] + "..."

        why = WhyThisAnswer(
            matched_excerpt=excerpt,
            matched_terms=matched_terms,
            retrieval_method="Local Offline Scikit-Learn TF-IDF Index (Zero Cloud Calls)",
            similarity_score=round(top_score, 3)
        )

        return {
            "status": "answered",
            "answer": final_answer,
            "citations": citations,
            "confidence": confidence,
            "confidence_score": round(top_score, 3),
            "why_this_answer": why
        }

    def get_status(self) -> Dict[str, Any]:
        """Returns protocol status metadata for UI status strip."""
        return {
            "pack_status": "ready" if len(self.protocols) > 0 else "empty",
            "indexed_documents_count": len(self.source_documents),
            "total_chunks": len(self.protocols),
            "source_documents": self.source_documents,
            "offline_ready": True,
            "last_indexed": self.last_indexed or datetime.now().isoformat()
        }

# Global singleton retriever
protocol_retriever = ProtocolRetriever()
