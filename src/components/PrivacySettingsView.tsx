import React, { useState } from 'react';
import { Candidate } from '../lib/types';
import { 
  ShieldCheck, 
  Lock, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Trash2, 
  AlertTriangle, 
  X,
  RefreshCw,
  UserCheck
} from 'lucide-react';

interface PrivacySettingsViewProps {
  candidates: Candidate[];
  activeCandidate: Candidate | null;
  onDeleteCandidate: (candidateId: string) => Promise<void>;
  onResetSeedData: () => Promise<void>;
}

export const PrivacySettingsView: React.FC<PrivacySettingsViewProps> = ({
  candidates = [],
  activeCandidate,
  onDeleteCandidate,
  onResetSeedData,
}) => {
  const [retentionDays, setRetentionDays] = useState(30);
  const [anonymizeEnabled, setAnonymizeEnabled] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Deletion state
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    setResetMessage(null);
    try {
      await onResetSeedData();
      setResetMessage('Database successfully restored to clean synthetic seed state!');
      setTimeout(() => setResetMessage(null), 3500);
    } catch (err: any) {
      setResetMessage(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!candidateToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteCandidate(candidateToDelete.id);
      setCandidateToDelete(null);
      setResetMessage(`Profile for ${candidateToDelete.name} was permanently erased.`);
      setTimeout(() => setResetMessage(null), 3500);
    } catch (err: any) {
      setResetMessage(`Error deleting profile: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">Privacy & Data Governance Controls</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Shortlist implements secure ingestion, sandboxed text extraction, and parameterized storage.
          </p>
        </div>

        {/* Security Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Prompt-Injection Immunity</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Resumes are treated strictly as untrusted text. No instructions, role-overrides, or execution payloads embedded within uploaded documents are ever evaluated as system commands.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Clean Relational Storage & Cascading Erasure</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Candidate profiles, extracted skills, and matches are stored with strict foreign keys. When a profile is deleted, all derived records and applications are immediately purged.
            </p>
          </div>
        </div>

        {/* Candidate Profiles Deletion (Right to be Forgotten) */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Candidate Profile Erasure (Right to Be Forgotten)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanently purge candidate resumes, extracted skills, and all tracking history from the database.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {candidates.length} Profiles Stored
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {candidates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No candidate profiles found in the database.
              </div>
            ) : (
              candidates.map((cand) => (
              <div key={cand.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">{cand.name}</span>
                    {activeCandidate?.id === cand.id && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                        Active Profile
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                      {cand.role_family}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {cand.target_role} • {cand.skills.length} skills • ID: <span className="font-mono text-slate-600">{cand.id}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCandidateToDelete(cand)}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Profile</span>
                </button>
              </div>
            )))}
          </div>
        </div>

        {/* Privacy Options */}
        <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Anonymize Profile for External Review</div>
              <div className="text-slate-500">Strips candidate name, email, and company names when sharing match previews.</div>
            </div>
            <input
              type="checkbox"
              checked={anonymizeEnabled}
              onChange={(e) => setAnonymizeEnabled(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Resume Retention Horizon</div>
              <div className="text-slate-500">Automatically delete uploaded binary documents after days:</div>
            </div>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="365">1 Year</option>
            </select>
          </div>
        </div>

        {/* Database Reset Section */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Restore Clean Synthetic Data</h3>
            <p className="text-xs text-slate-500">
              Resets candidate profiles, 12 synthetic jobs, applications, and hand-labelled benchmarks.
            </p>
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Restoring...' : 'Reset to Seed Data'}</span>
          </button>
        </div>

        {resetMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{resetMessage}</span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <button
                onClick={() => setCandidateToDelete(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Permanently Delete {candidateToDelete.name}?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will delete the candidate profile, all {candidateToDelete.skills.length} extracted skills, professional history, and all application tracking records for <strong>{candidateToDelete.name}</strong> from the database.
              </p>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-medium text-rose-800">
                This action is immediate and cannot be undone.
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
