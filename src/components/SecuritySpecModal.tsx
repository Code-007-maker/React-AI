import React from 'react';
import { ShieldCheck, X, Lock, KeyRound, Database, FileCode, CheckCircle2 } from 'lucide-react';

interface SecuritySpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecuritySpecModal: React.FC<SecuritySpecModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Agentic Threat Model &amp; Security Architecture
              </h2>
              <p className="text-xs text-slate-400">
                OWASP Top 10 Web &amp; LLM Compliance &bull; Owner-Bound Firestore Isolation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-relaxed text-slate-300">
          {/* Threat Model Summary Table */}
          <section>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>1. The 5 Threat Zones (Threat Summary Table)</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Threat Zone</th>
                    <th className="p-3">Identified Risk</th>
                    <th className="p-3">Countermeasure &amp; Implementation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  <tr className="bg-slate-900/50">
                    <td className="p-3 font-semibold text-slate-200">1. Input Surfaces</td>
                    <td className="p-3">Malformed payloads, prompt injection via journal notes</td>
                    <td className="p-3 text-emerald-300">
                      Null-safe JSON parsing, defensive destructuring, payload length clamping (10k chars).
                    </td>
                  </tr>
                  <tr className="bg-slate-900/30">
                    <td className="p-3 font-semibold text-slate-200">2. Planning &amp; Reasoning</td>
                    <td className="p-3">Indirect Prompt Injection (OWASP LLM01), System instruction bypass</td>
                    <td className="p-3 text-emerald-300">
                      Explicit system instructions delimiting user reflection data as plain content.
                    </td>
                  </tr>
                  <tr className="bg-slate-900/50">
                    <td className="p-3 font-semibold text-slate-200">3. Tool Execution</td>
                    <td className="p-3">Unauthorized API calls, SSRF, dynamic code execution</td>
                    <td className="p-3 text-emerald-300">
                      Strict server-side proxy routes (/api/chat, /api/summarize) with no dynamic code evaluation.
                    </td>
                  </tr>
                  <tr className="bg-slate-900/30">
                    <td className="p-3 font-semibold text-slate-200">4. Memory &amp; State</td>
                    <td className="p-3">Cross-user data leakage (OWASP A01), unauthenticated database reads</td>
                    <td className="p-3 text-emerald-300">
                      Firestore security rules enforcing owner-bound isolation: <code>request.auth.uid == userId</code>.
                    </td>
                  </tr>
                  <tr className="bg-slate-900/50">
                    <td className="p-3 font-semibold text-slate-200">5. Inter-System Comm</td>
                    <td className="p-3">API Key exposure in browser, credential interception</td>
                    <td className="p-3 text-emerald-300">
                      GEMINI_API_KEY is strictly server-side; federated Google Sign-In with zero stored passwords.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Firestore Security Rules */}
          <section className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>Deployed Firestore Security Rules</span>
            </h3>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto border border-slate-800/80">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
            </pre>
          </section>

          {/* Gemini Fallback Resilience Ladder */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gemini Model Resilience Ladder</span>
            </h3>
            <p className="text-slate-400">
              The backend server wraps content generation in a resilient ladder:
              <strong className="text-slate-200"> gemini-3.6-flash &rarr; gemini-3.1-flash-lite &rarr; gemini-flash-latest &rarr; gemini-3.7-flash</strong>.
              Recoverable status codes (503, 429, 404, 500) automatically attempt the next fallback tier before surfacing errors.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Close Specifications
          </button>
        </div>
      </div>
    </div>
  );
};
