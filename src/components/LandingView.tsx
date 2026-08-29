import React, { useState } from 'react';
import {
  Lock,
  Sparkles,
  Database,
  ShieldCheck,
  BrainCircuit,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  KeyRound,
  Layers,
} from 'lucide-react';

interface LandingViewProps {
  onSignIn: () => Promise<void>;
  onOpenSecurityModal: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSignIn, onOpenSecurityModal }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignInClick = async () => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      await onSignIn();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Multi-Turn Reflection Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
            A Private AI Space to Reflect, Converse, and Clarify Your Thoughts.
          </h1>

          <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            Deep multi-turn journaling with <span className="text-emerald-400 font-semibold">Gemini 3.6 Flash</span>. 
            All reflections, notes, and AI summaries are strictly isolated in your personal Firestore collection.
          </p>

          {/* Authentication Action Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md mx-auto shadow-xl shadow-slate-950/50 backdrop-blur-sm">
            <h2 className="text-base font-semibold text-white mb-2">Sign in to your private vault</h2>
            <p className="text-xs text-slate-400 mb-6">
              Authenticated securely via Google Identity. No passwords stored or handled in application code.
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 text-left flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-400 mt-1 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              id="btn-google-sign-in"
              onClick={handleSignInClick}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                  <span>Connecting securely...</span>
                </>
              ) : (
                <>
                  {/* Google G Logo SVG */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Owner-bound Firestore Security Rules active</span>
            </div>
          </div>
        </div>

        {/* Feature Grid with Technical Security Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-6">
          {/* Card 1 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 text-left hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Gemini 3.6 Flash Partner</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Engage in multi-turn dialogues with custom reflection tones (Empathetic, Analytical, Socratic, or Summarizer) tailored to deep inquiry.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 text-left hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">User-Isolated Firestore</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every journal entry is stored under <code className="text-xs text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">/users/{'{uid}'}/interactions</code> with strict Firebase security rules preventing cross-user access.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 text-left hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Synthesis & Takeaways</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automatically extract actionable micro-habits, cognitive shifts, and comprehensive summaries from long, unstructured thoughts.
            </p>
          </div>
        </div>

        {/* Security Specifications CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={onOpenSecurityModal}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <span>Review Threat Model & OWASP Security Architecture Specs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-400 max-w-7xl mx-auto px-4 w-full">
        <p>ReflectAI &bull; Google Cloud Run &amp; Cloud Firestore &bull; Gemini 3.6 Flash Integration</p>
      </footer>
    </div>
  );
};
