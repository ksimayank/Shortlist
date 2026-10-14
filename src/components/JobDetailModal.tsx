import React, { useState } from 'react';
import { Job, Candidate, MatchScoreResult, ApplicationStatus } from '../lib/types';
import { getJobSearchUrls } from '../lib/urls';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  X, 
  Send, 
  Search, 
  Bot, 
  ShieldCheck,
  Check
} from 'lucide-react';

interface JobDetailModalProps {
  job: Job;
  match?: MatchScoreResult;
  candidate: Candidate | null;
  currentStatus: ApplicationStatus;
  onUpdateStatus: (jobId: string, status: ApplicationStatus, notes?: string) => Promise<void>;
  onClose: () => void;
  onOpenAssistant?: (job: Job, match?: MatchScoreResult) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  match,
  candidate,
  currentStatus,
  onUpdateStatus,
  onClose,
  onOpenAssistant,
}) => {
  const [coverNote, setCoverNote] = useState(
    candidate
      ? `Hi hiring team at ${job.company}, I am excited to apply for the ${job.title} position. With my background in ${candidate.role_family} and experience with ${job.required_skills.slice(0, 3).join(', ')}, I believe I would make an immediate impact.`
      : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(currentStatus === 'applied' || currentStatus === 'interview' || currentStatus === 'offer');

  const links = getJobSearchUrls(job);

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateStatus(job.id, 'applied', coverNote);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {job.role_family.toUpperCase()}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-slate-200 font-medium capitalize">
                {job.work_arrangement}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-slate-200 font-medium capitalize">
                {job.employment_type}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              {job.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
              <span className="flex items-center space-x-1 font-medium text-white">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>{job.company}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{job.location}</span>
              </span>
              <span className="flex items-center space-x-1 font-medium text-emerald-400">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>{job.salary_range}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm text-slate-700">
          {/* Match Score Strip (If candidate present) */}
          {match && (
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-mono font-extrabold text-lg flex items-center justify-center shadow-md shadow-indigo-200">
                  {match.total_score}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Estimated Match Fit for {candidate?.name || 'You'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {match.rationale}
                  </div>
                </div>
              </div>

              {onOpenAssistant && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAssistant(job, match);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto transition-colors"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Prep & Analysis</span>
                </button>
              )}
            </div>
          )}

          {/* Job Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Role Overview</h3>
            <p className="leading-relaxed text-slate-600 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200">
              {job.description}
            </p>
          </div>

          {/* Key Responsibilities */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Key Responsibilities</h3>
            <p className="leading-relaxed text-slate-700 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200">
              {job.responsibilities}
            </p>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Required Skills (3x Weight)</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.required_skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Preferred Skills & Bonus</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.preferred_skills.length > 0 ? (
                  job.preferred_skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">None specified</span>
                )}
              </div>
            </div>
          </div>

          {/* Mandatory Qualifications */}
          {job.mandatory_qualifications.length > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-1.5">
              <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Mandatory Qualifications</span>
              </div>
              <ul className="list-disc pl-5 text-amber-800 space-y-0.5">
                {job.mandatory_qualifications.map((mq, idx) => (
                  <li key={idx}>{mq}</li>
                ))}
              </ul>
            </div>
          )}

          {/* APPLICATION SECTION */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {submitted ? 'Application Tracker Status' : 'Direct In-App Quick Application'}
                </h3>
                <p className="text-xs text-slate-500">
                  {submitted
                    ? 'Your application has been logged and tracked in Shortlist.'
                    : `Submit your profile directly to ${job.company} with tracked status.`}
                </p>
              </div>

              {submitted && (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Applied</span>
                </span>
              )}
            </div>

            {submitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="font-bold flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Application Logged in Your Tracker!</span>
                </div>
                <p className="text-emerald-800">
                  Status is marked as <strong>Applied</strong>. You can monitor follow-ups, recruiter communications, and interview dates on your <strong>Application Tracker</strong> board.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenAssistant) onOpenAssistant(job, match);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 transition-colors"
                  >
                    Prepare Interview Questions
                  </button>
                  <button
                    onClick={() => onUpdateStatus(job.id, 'interview')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold text-xs hover:bg-emerald-100 transition-colors"
                  >
                    Advance to Interview Stage
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center space-x-3 text-xs text-slate-700">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    {candidate?.name.charAt(0) || 'U'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{candidate?.name || 'Candidate'}</span>
                    <span className="text-slate-400"> ({candidate?.email || 'email@example.com'})</span>
                    <div className="text-[11px] text-slate-500">
                      Attaching {candidate?.skills.filter((s) => s.is_current).length || 0} verified skills & {candidate?.experience_years || 0} years experience
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Cover Note to Hiring Manager (Optional)</label>
                  <textarea
                    rows={3}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Briefly state your motivation and relevant qualifications..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitApplication}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting...' : `Submit Application to ${job.company}`}</span>
                  </button>
                </div>
              </div>
            )}

            {/* REAL EXTERNAL JOB SEARCH & APPLICATION LINKS */}
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Live External Job Listings & Portals
                </label>
                <span className="text-[11px] text-emerald-600 font-medium">
                  Direct Live Search (No Login Required)
                </span>
              </div>

              {/* Primary Direct / Google Jobs Action */}
              <a
                href={links.primary}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
              >
                <span>{links.primaryLabel}</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <a
                  href={links.googleJobs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 transition-all flex items-center justify-between group"
                  title="Google Jobs aggregation without authwalls"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-800 group-hover:text-emerald-700">Google Jobs</div>
                    <div className="text-[10px] text-slate-400">Live Postings</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                </a>

                <a
                  href={links.indeed}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 transition-all flex items-center justify-between group"
                  title="Indeed direct job search"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-800 group-hover:text-indigo-700">Indeed</div>
                    <div className="text-[10px] text-slate-400">Open Search</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                </a>

                <a
                  href={links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between group"
                  title="LinkedIn Job Search"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-800 group-hover:text-blue-700">LinkedIn</div>
                    <div className="text-[10px] text-slate-400">Network Portal</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                </a>

                <a
                  href={links.glassdoor}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/40 transition-all flex items-center justify-between group"
                  title="Glassdoor Reviews & Jobs"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-800 group-hover:text-teal-700">Glassdoor</div>
                    <div className="text-[10px] text-slate-400">Jobs & Salaries</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Job ID: {job.id} • Posted by {job.company}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
