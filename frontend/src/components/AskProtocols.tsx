import React, { useState } from 'react';
import { AskResponse, SupportedLanguage } from '../types';
import { translations } from '../translations';
import { apiService } from '../services/api';

interface AskProtocolsProps {
  language: SupportedLanguage;
}

const SAMPLE_QUESTIONS = [
  {
    label: '🚨 Pregnancy Bleeding',
    text: 'A pregnant woman in her 7th month has sudden vaginal bleeding and sharp lower abdominal pain. What should I do?',
    type: 'emergency',
  },
  {
    label: '🚨 Newborn Convulsions',
    text: 'Newborn infant born 4 days ago has started having fits, twitching and convulsions.',
    type: 'emergency',
  },
  {
    label: '🚨 Newborn Chest Indrawing',
    text: 'A 6-day-old baby is completely unable to suckle or breastfeed and has deep chest indrawing.',
    type: 'emergency',
  },
  {
    label: '⚠️ Antibiotic Dose Check',
    text: 'What is the dose of Amoxicillin 250mg syrup to give to an 8-month-old infant with cold and cough?',
    type: 'refusal',
  },
  {
    label: '📋 ANC Visit Schedule',
    text: 'How many antenatal care (ANC) visits are mandatory during pregnancy and when should they occur?',
    type: 'grounded',
  },
  {
    label: '💧 ORS Preparation',
    text: 'How should an ASHA guide a mother to correctly prepare a standard packet of WHO Oral Rehydration Salts (ORS)?',
    type: 'grounded',
  },
  {
    label: '🚫 Out-of-Scope Surgery',
    text: 'How do I perform an open surgical appendectomy in a sub-centre clinic?',
    type: 'out-of-scope',
  },
];

export const AskProtocols: React.FC<AskProtocolsProps> = ({ language }) => {
  const t = translations[language];
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showWhyDetails, setShowWhyDetails] = useState(false);

  const handleAsk = async (queryText?: string) => {
    const textToSearch = (queryText !== undefined ? queryText : question).trim();
    if (!textToSearch) {
      setErrorMessage(t.emptyQueryNotice);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResponse(null);
    setShowWhyDetails(false);

    try {
      const res = await apiService.askQuestion(textToSearch, language);
      setResponse(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reach local protocol service';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (sampleText: string) => {
    setQuestion(sampleText);
    handleAsk(sampleText);
  };

  const handleClear = () => {
    setQuestion('');
    setResponse(null);
    setErrorMessage(null);
    setShowWhyDetails(false);
  };

  return (
    <div className="space-y-4">
      {/* Prominent Question Input Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
        <label htmlFor="protocol-question" className="block text-sm font-semibold text-slate-800 mb-2">
          {language === 'en' ? 'Ask Clinical Protocol / Assess Symptoms' : 'లక్షణాలు / ప్రోటోకాల్ ప్రశ్న అడగండి'}
        </label>

        <div className="relative">
          <textarea
            id="protocol-question"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition resize-none"
            aria-label="Health protocol search question input"
          />

          {question && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 text-xs"
              title={t.btnClear}
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Deterministic danger sign check runs before retrieval
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {question && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition active:scale-95"
              >
                {t.btnClear}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleAsk()}
              disabled={isLoading || !question.trim()}
              className="flex-1 sm:flex-initial min-w-[140px] px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white text-sm font-semibold shadow-sm transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t.btnSearching}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>{t.btnAsk}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Example Chips */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            {t.exampleQuestionsLabel}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_QUESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(item.text)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium text-left transition active:scale-95 ${
                  item.type === 'emergency'
                    ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                    : item.type === 'refusal'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <div className="font-semibold">Notice</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. HIGH-VISIBILITY EMERGENCY ESCALATION STATE (Rule triggered) */}
      {/* ------------------------------------------------------------- */}
      {response && response.status === 'escalate_emergency' && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 border-2 border-red-600 rounded-2xl p-5 shadow-md animate-in fade-in duration-200"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">
                  {t.emergencyTitle}
                </span>
                <span className="text-xs font-semibold text-red-900">
                  Rule ID: {response.escalation_details?.rule_id}
                </span>
              </div>

              <h2 className="text-lg font-bold text-red-950 mt-1.5 leading-snug">
                {response.escalation_details?.danger_type}
              </h2>

              <p className="text-xs font-medium text-red-800 mt-0.5">
                {t.emergencySubtitle}
              </p>

              {/* Action Required Box */}
              <div className="mt-3 p-3 bg-red-100/80 border border-red-300 rounded-xl text-red-950 text-sm font-semibold flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{response.escalation_details?.action_required}</span>
                </div>

                <a
                  href="tel:108"
                  className="shrink-0 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition"
                >
                  Call 108 Now
                </a>
              </div>

              {/* Full guidance text */}
              <div className="mt-3 text-sm text-red-900 whitespace-pre-line leading-relaxed bg-white/60 p-3.5 rounded-xl border border-red-200 font-mono sm:font-sans">
                {response.answer}
              </div>

              <div className="mt-3 text-[11px] text-red-800 font-medium">
                Note: Standard public health protocol triggers immediate hospital transport. No AI or external model was used to evaluate this emergency.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. CLINICAL MEDICATION / ANTIBIOTIC REFUSAL STATE */}
      {/* ------------------------------------------------------------- */}
      {response && response.status === 'refuse_clinical_prescription' && (
        <div className="bg-amber-50 border-2 border-amber-500 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded">
                  {t.prescriptionRefusalTitle}
                </span>
                <span className="text-xs text-amber-900 font-semibold">
                  Rule ID: {response.escalation_details?.rule_id}
                </span>
              </div>

              <h2 className="text-base font-bold text-amber-950 mt-1.5">
                {response.escalation_details?.danger_type}
              </h2>

              <div className="mt-3 text-sm text-amber-950 whitespace-pre-line leading-relaxed bg-white/70 p-3.5 rounded-xl border border-amber-200">
                {response.answer}
              </div>

              <div className="mt-3 p-3 bg-amber-100 rounded-xl text-xs font-semibold text-amber-900">
                Frontline Directive: Refer patient to the Primary Health Centre (PHC) Medical Officer for clinical examination and proper weight-adjusted dosing.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. OUT-OF-SCOPE REFUSAL STATE */}
      {/* ------------------------------------------------------------- */}
      {response && response.status === 'refuse_out_of_scope' && (
        <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-400 text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <div className="flex-1">
              <span className="text-xs uppercase font-bold tracking-wider bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                {t.outOfScopeTitle}
              </span>

              <div className="mt-3 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {response.answer}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. GROUNDED PROTOCOL ANSWER WITH CITATIONS & "WHY THIS ANSWER" */}
      {/* ------------------------------------------------------------- */}
      {response && response.status === 'answered' && (
        <div className="bg-white border border-teal-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                {t.groundedAnswerTitle}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">{t.confidenceLabel}</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                  response.confidence === 'High'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {response.confidence} ({Math.round(response.confidence_score * 100)}%)
              </span>
            </div>
          </div>

          {/* Answer Body */}
          <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">
            {response.answer}
          </div>

          {/* Citations section */}
          {response.citations && response.citations.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-teal-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>{t.citationsLabel}</span>
              </div>

              <div className="space-y-1.5">
                {response.citations.map((c, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-teal-50/70 border border-teal-200/60 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-teal-950">{c.document}</span>
                      <span className="text-teal-700 ml-2">[{c.section}]</span>
                    </div>
                    <span className="text-[11px] font-mono text-teal-800 bg-teal-100/60 px-1.5 py-0.5 rounded">
                      {c.protocol_id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expandable "Why this answer?" */}
          {response.why_this_answer && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWhyDetails(!showWhyDetails)}
                className="w-full flex items-center justify-between text-xs font-semibold text-teal-800 hover:text-teal-900 py-1"
              >
                <span>{t.whyThisAnswer}</span>
                <span className="text-sm">{showWhyDetails ? '▲' : '▼'}</span>
              </button>

              {showWhyDetails && (
                <div className="mt-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 animate-in fade-in duration-150">
                  <div>
                    <span className="font-semibold text-slate-700">{t.retrievalMethod} </span>
                    <span className="text-slate-600">{response.why_this_answer.retrieval_method}</span>
                  </div>

                  {response.why_this_answer.matched_terms.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-700">{t.matchedKeywords} </span>
                      <span className="font-mono text-teal-700">
                        {response.why_this_answer.matched_terms.join(', ')}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="font-semibold text-slate-700">{t.matchedExcerpt} </span>
                    <p className="mt-1 p-2 bg-white rounded border border-slate-200 text-slate-600 italic">
                      "{response.why_this_answer.matched_excerpt}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Safety Disclaimer */}
          <div className="text-[11px] text-slate-400 pt-1">
            {response.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
