import React, { useState } from 'react';
import { Candidate, Job, MatchScoreResult } from '../lib/types';
import { 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Lightbulb, 
  HelpCircle, 
  FileEdit,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { CareerExplanation, InterviewQuestionItem, BulletOptimizationResult } from '../lib/gemini';

interface CareerAssistantViewProps {
  candidate: Candidate | null;
  jobs: Job[];
  initialJobId?: string;
}

export const CareerAssistantView: React.FC<CareerAssistantViewProps> = ({
  candidate,
  jobs,
  initialJobId,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || (jobs[0]?.id ?? ''));
  const [activeTool, setActiveTool] = useState<'deep_match' | 'bullet_optimizer' | 'interview_prep'>('deep_match');

  // Deep match states
  const [explanation, setExplanation] = useState<CareerExplanation | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  // Bullet optimizer states
  const [rawBullet, setRawBullet] = useState(
    'Worked on visual branding identity, multi-platform design guidelines, iconography, and marketing campaigns.'
  );
  const [optimizedResult, setOptimizedResult] = useState<BulletOptimizationResult | null>(null);
  const [isOptimizingBullet, setIsOptimizingBullet] = useState(false);

  // Interview prep states
  const [questions, setQuestions] = useState<InterviewQuestionItem[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  if (!candidate) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Candidate Profile Selected</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
          Please select or upload a candidate profile to activate personalized AI match explanations, tailored interview questions, and resume bullet optimization.
        </p>
      </div>
    );
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const handleFetchDeepMatch = async () => {
    if (!selectedJob) return;
    setIsLoadingExplanation(true);
    try {
      const res = await fetch('/api/assistant/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          job_id: selectedJob.id,
        }),
      });
      const data = await res.json();
      setExplanation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const handleOptimizeBullet = async () => {
    if (!rawBullet.trim()) return;
    setIsOptimizingBullet(true);
    try {
      const res = await fetch('/api/assistant/resume-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet: rawBullet,
          job_id: selectedJob?.id,
        }),
      });
      const data = await res.json();
      setOptimizedResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizingBullet(false);
    }
  };

  const handleFetchInterviewQuestions = async () => {
    if (!selectedJob) return;
    setIsLoadingQuestions(true);
    try {
      const res = await fetch('/api/assistant/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          job_id: selectedJob.id,
        }),
      });
      const data = await res.json();
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Target Role Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">AI Career Assistant (Level 2)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grounded intelligence: never hallucinates metrics or invents unverified achievements.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <label className="text-xs font-semibold text-slate-500">Target Role:</label>
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setExplanation(null);
              setQuestions([]);
            }}
            className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.company})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tool Selector Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTool('deep_match')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            activeTool === 'deep_match'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Deep Match Analysis</span>
        </button>

        <button
          onClick={() => setActiveTool('bullet_optimizer')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            activeTool === 'bullet_optimizer'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>Resume Bullet Optimizer</span>
        </button>

        <button
          onClick={() => setActiveTool('interview_prep')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            activeTool === 'interview_prep'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Targeted Interview Prep</span>
        </button>
      </div>

      {/* TOOL 1: DEEP MATCH ANALYSIS */}
      {activeTool === 'deep_match' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Candidate vs Role Synthesis
              </h2>
              <p className="text-xs text-slate-500">
                Evaluating {candidate.name} against {selectedJob.title} at {selectedJob.company}
              </p>
            </div>
            <button
              onClick={handleFetchDeepMatch}
              disabled={isLoadingExplanation}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              {isLoadingExplanation ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Analysis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Deep Analysis</span>
                </>
              )}
            </button>
          </div>

          {explanation ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  <span>Executive Synthesis</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-indigo-700 font-medium border border-indigo-200">
                    Mode: {explanation.mode}
                  </span>
                </div>
                <p className="text-xs text-indigo-950 leading-relaxed font-medium">
                  {explanation.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified Core Strengths</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {explanation.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skill Gaps */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Skill & Qualification Gaps</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {explanation.skill_gaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Adjacent Role Paths */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Lightbulb className="w-4 h-4 text-indigo-600" />
                  <span>Realistic Adjacent Role Paths</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Based on candidate transferable experience in {candidate.role_family}:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {explanation.adjacent_roles.map((role, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
              <Bot className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Ready to synthesize match</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Run Deep Analysis" to compare candidate skills and work accomplishments against {selectedJob.title}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TOOL 2: RESUME BULLET OPTIMIZER */}
      {activeTool === 'bullet_optimizer' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileEdit className="w-4 h-4 text-indigo-600" />
              <span>Evidence-Grounded Resume Bullet Optimizer</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict Anti-Hallucination Guardrail: Strengthens action verbs and framing without inventing imaginary statistics.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700">Original Resume Bullet</label>
            <textarea
              rows={3}
              value={rawBullet}
              onChange={(e) => setRawBullet(e.target.value)}
              className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Paste a bullet point from your work experience or project history..."
            />

            <div className="flex justify-end">
              <button
                onClick={handleOptimizeBullet}
                disabled={isOptimizingBullet}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                {isOptimizingBullet ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Optimizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Optimize Bullet</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {optimizedResult && (
            <div className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Optimized Version
                </span>
                <p className="text-sm font-semibold text-slate-900 bg-white p-3 rounded-lg border border-indigo-100">
                  {optimizedResult.improved}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-900">Why this was changed:</span>
                  <p className="text-slate-600">{optimizedResult.reasoning}</p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="font-semibold text-slate-900">Metric Guidance:</span>
                  <p className="text-slate-600">{optimizedResult.metric_guidance}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{optimizedResult.grounding_check}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: TARGETED INTERVIEW PREP */}
      {activeTool === 'interview_prep' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Targeted Interview Question Generator</span>
              </h2>
              <p className="text-xs text-slate-500">
                Questions generated specifically from {selectedJob.title}'s duties and required tooling.
              </p>
            </div>
            <button
              onClick={handleFetchInterviewQuestions}
              disabled={isLoadingQuestions}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              {isLoadingQuestions ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate 3 Targeted Questions</span>
                </>
              )}
            </button>
          </div>

          {questions.length > 0 ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-indigo-600 font-mono-numbers">
                      Q{idx + 1}.
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      {q.topic}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    "{q.question}"
                  </h4>
                  <div className="p-2.5 rounded bg-white border border-slate-200 text-xs text-slate-600 flex items-start space-x-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">Suggested Strategy: </span>
                      <span>{q.context}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No questions generated yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Generate 3 Targeted Questions" to prepare for the {selectedJob.title} interview.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
