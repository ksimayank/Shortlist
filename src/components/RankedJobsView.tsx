import React, { useState, useMemo } from 'react';
import { Candidate, Job, MatchScoreResult, ApplicationStatus } from '../lib/types';
import { 
  Sparkles, 
  Search, 
  SlidersHorizontal, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Bookmark, 
  Bot, 
  MapPin, 
  Building2, 
  Briefcase, 
  DollarSign,
  X,
  Check,
  Info
} from 'lucide-react';

import { JobDetailModal } from './JobDetailModal';
import { getJobSearchUrls } from '../lib/urls';

interface RankedMatchItem {
  job: Job;
  match: MatchScoreResult;
}

interface RankedJobsViewProps {
  activeCandidate: Candidate | null;
  matches: RankedMatchItem[];
  applicationStatuses: Record<string, ApplicationStatus>;
  onUpdateApplicationStatus: (jobId: string, status: ApplicationStatus, notes?: string) => Promise<void> | void;
  onOpenAssistantForJob: (job: Job, match: MatchScoreResult) => void;
  onSelectCandidateProfile: () => void;
}

export const RankedJobsView: React.FC<RankedJobsViewProps> = ({
  activeCandidate,
  matches,
  applicationStatuses,
  onUpdateApplicationStatus,
  onOpenAssistantForJob,
  onSelectCandidateProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [selectedArrangement, setSelectedArrangement] = useState<string>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'score' | 'experience' | 'title'>('score');
  const [activeModalItem, setActiveModalItem] = useState<RankedMatchItem | null>(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState<RankedMatchItem | null>(null);

  const filteredMatches = useMemo(() => {
    return matches
      .filter(({ job, match }) => {
        if (minScore > 0 && match.total_score < minScore) return false;
        if (selectedFamily !== 'all' && job.role_family !== selectedFamily) return false;
        if (selectedArrangement !== 'all' && job.work_arrangement !== selectedArrangement) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = job.title.toLowerCase().includes(q);
          const matchCompany = job.company.toLowerCase().includes(q);
          const matchSkills = job.required_skills.some((s) => s.toLowerCase().includes(q));
          if (!matchTitle && !matchCompany && !matchSkills) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.match.total_score - a.match.total_score;
        if (sortBy === 'experience') return a.job.min_years_experience - b.job.min_years_experience;
        return a.job.title.localeCompare(b.job.title);
      });
  }, [matches, searchQuery, selectedFamily, selectedArrangement, minScore, sortBy]);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20';
    if (score >= 65) return 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20';
    if (score >= 45) return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20';
    return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20';
  };

  if (!activeCandidate) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Candidate Profile Selected</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
          Select or upload a candidate profile to view personalized, explainable job matches.
        </p>
        <button
          onClick={onSelectCandidateProfile}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Select Candidate Profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Candidate Context Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-500/30">
                Active Shortlist
              </span>
              <span className="text-xs text-slate-400 capitalize">
                Domain: {activeCandidate.role_family}
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-1 tracking-tight">
              Curated Matches for {activeCandidate.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Targeting: <span className="text-indigo-300 font-medium">{activeCandidate.target_role}</span> • {activeCandidate.experience_years} years verified experience • {activeCandidate.skills.filter(s => s.is_current).length} current skills
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm self-start md:self-auto">
            <div className="text-center px-2">
              <div className="text-xs text-slate-300">Total Jobs</div>
              <div className="text-lg font-bold font-mono-numbers text-white">{matches.length}</div>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center px-2">
              <div className="text-xs text-slate-300">Compatible (&gt;60)</div>
              <div className="text-lg font-bold font-mono-numbers text-emerald-400">
                {matches.filter((m) => m.match.total_score >= 60).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by job title, company, or required skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Role Family Filter */}
          <select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Role Families</option>
            <option value="design">Design & Creative</option>
            <option value="engineering">Software Engineering</option>
            <option value="data">Data & Analytics</option>
            <option value="operations">Operations & Logistics</option>
            <option value="marketing">Marketing & Growth</option>
            <option value="sales">Sales & Business Dev</option>
            <option value="customer_support">Customer Support</option>
          </select>

          {/* Work Arrangement */}
          <select
            value={selectedArrangement}
            onChange={(e) => setSelectedArrangement(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Arrangements</option>
            <option value="remote">Remote Only</option>
            <option value="hybrid">Hybrid</option>
            <option value="on-site">On-site</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="score">Sort: Compatibility Score</option>
            <option value="experience">Sort: Experience Required</option>
            <option value="title">Sort: Job Title (A-Z)</option>
          </select>
        </div>

        {/* Min Score Slider */}
        <div className="flex items-center space-x-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span>Minimum Match Threshold:</span>
          <input
            type="range"
            min="0"
            max="80"
            step="5"
            value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
            className="w-36 accent-indigo-600 cursor-pointer"
          />
          <span className="font-mono-numbers font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
            {minScore}%
          </span>
          <span className="text-slate-400 ml-auto hidden sm:inline">
            Showing {filteredMatches.length} of {matches.length} opportunities
          </span>
        </div>
      </div>

      {/* Ranked Job Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredMatches.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <Info className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-slate-900">No jobs match your current filters</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try reducing the minimum match score or clearing specific role family filters.
            </p>
          </div>
        ) : (
          filteredMatches.map(({ job, match }) => {
            const currentStatus = applicationStatuses[job.id] || 'shortlisted';
            const isSeverePenalty = match.total_score <= 40 && job.role_family !== activeCandidate.role_family;

            return (
              <div
                key={job.id}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col md:flex-row gap-5"
              >
                {/* Score Section */}
                <div className="flex md:flex-col items-center justify-between md:justify-center md:w-32 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                  <div className={`px-4 py-3 rounded-2xl border text-center ring-4 ${getScoreBadgeColor(match.total_score)}`}>
                    <div className="text-2xl font-extrabold font-mono-numbers leading-none">
                      {match.total_score}
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-wider mt-1">
                      Match Score
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 text-center mt-2 hidden md:block">
                    Estimated fit
                  </div>
                </div>

                {/* Job Info Section */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedJobDetail({ job, match })}
                          className="text-left text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors focus:outline-none"
                        >
                          {job.title}
                        </button>
                        {/* Domain Match Tag */}
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          job.role_family === activeCandidate.role_family
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isSeverePenalty
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {job.role_family.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center space-x-1 font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.company}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.location}</span>
                        </span>
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {job.work_arrangement}
                        </span>
                        <span className="flex items-center space-x-1 font-medium text-slate-700">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.salary_range}</span>
                        </span>
                      </div>
                    </div>

                    {/* Quick Status Tag */}
                    <div className="flex items-center space-x-2">
                      <select
                        value={currentStatus}
                        onChange={(e) => onUpdateApplicationStatus(job.id, e.target.value as ApplicationStatus)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="shortlisted">Shortlisted</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {/* Skills Summary Chips */}
                  <div className="space-y-1.5">
                    {/* Matched Skills */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] font-semibold text-emerald-800 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-0.5" />
                        Matched ({match.matched_skills.length}):
                      </span>
                      {match.matched_skills.length > 0 ? (
                        match.matched_skills.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-100">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No direct overlap</span>
                      )}
                    </div>

                    {/* Missing Required Skills */}
                    {match.missing_required_skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-semibold text-rose-800 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600 inline mr-0.5" />
                          Missing Required:
                        </span>
                        {match.missing_required_skills.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-medium border border-rose-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Explainable Rationale Callout */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">Why this score? </span>
                      <span>{match.rationale}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActiveModalItem({ job, match })}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                      >
                        View Full Breakdown
                      </button>

                      <button
                        onClick={() => onOpenAssistantForJob(job, match)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center space-x-1 transition-colors"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>AI Deep Analysis</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <a
                        href={getJobSearchUrls(job).primary}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-indigo-700 flex items-center space-x-1.5 transition-all"
                        title="Open live job listing without login requirement"
                      >
                        <span>Live Job Listing</span>
                        <ExternalLink className="w-3 h-3 text-indigo-500" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setSelectedJobDetail({ job, match })}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 shadow-sm transition-all"
                      >
                        <span>View Details & Apply</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Match Breakdown Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Level 1 Explainable Scoring Breakdown
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {activeModalItem.job.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeModalItem.job.company} • {activeModalItem.job.location}
                </p>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score Cards Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">Role Family (35%)</div>
                <div className="text-lg font-bold font-mono-numbers text-slate-900 mt-0.5">
                  {activeModalItem.match.role_family_score}%
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {activeModalItem.match.role_family_candidate} vs {activeModalItem.match.role_family_job}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">Required Skills (30%)</div>
                <div className="text-lg font-bold font-mono-numbers text-slate-900 mt-0.5">
                  {activeModalItem.match.required_skill_score}%
                </div>
                <div className="text-[10px] text-slate-400">
                  {activeModalItem.match.matched_skills.length} verified
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">Preferred Skills (10%)</div>
                <div className="text-lg font-bold font-mono-numbers text-slate-900 mt-0.5">
                  {activeModalItem.match.preferred_skill_score}%
                </div>
                <div className="text-[10px] text-slate-400">Bonus overlap</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">Experience Sim (15%)</div>
                <div className="text-lg font-bold font-mono-numbers text-slate-900 mt-0.5">
                  {activeModalItem.match.experience_score}%
                </div>
                <div className="text-[10px] text-slate-400">TF-IDF accomplishments</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">Location Fit (10%)</div>
                <div className="text-lg font-bold font-mono-numbers text-slate-900 mt-0.5">
                  {activeModalItem.match.location_score}%
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {activeModalItem.job.work_arrangement}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                <div className="text-[11px] font-semibold text-indigo-700">Final Weighted Fit</div>
                <div className="text-xl font-extrabold font-mono-numbers text-indigo-900 mt-0.5">
                  {activeModalItem.match.total_score}/100
                </div>
                <div className="text-[10px] text-indigo-600">Deterministic score</div>
              </div>
            </div>

            {/* Mandatory Check Results */}
            {activeModalItem.match.failed_mandatory.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Mandatory Qualification Disqualification / Cap</span>
                </div>
                <p>The candidate failed one or more mandatory eligibility requirements:</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {activeModalItem.match.failed_mandatory.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Job Description & Responsibilities */}
            <div className="space-y-2 text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 text-sm">Key Responsibilities</h4>
              <p className="leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {activeModalItem.job.responsibilities}
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const item = activeModalItem;
                  setActiveModalItem(null);
                  onOpenAssistantForJob(item.job, item.match);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              >
                <Bot className="w-4 h-4" />
                <span>Launch AI Career Assistant</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Job Details & Application Portal Modal */}
      {selectedJobDetail && (
        <JobDetailModal
          job={selectedJobDetail.job}
          match={selectedJobDetail.match}
          candidate={activeCandidate}
          currentStatus={applicationStatuses[selectedJobDetail.job.id] || 'shortlisted'}
          onUpdateStatus={async (jobId, status, notes) => {
            await onUpdateApplicationStatus(jobId, status, notes);
          }}
          onClose={() => setSelectedJobDetail(null)}
          onOpenAssistant={(job, match) => onOpenAssistantForJob(job, match || selectedJobDetail.match)}
        />
      )}
    </div>
  );
};
