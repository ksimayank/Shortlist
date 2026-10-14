import React from 'react';
import { Candidate } from '../lib/types';
import { 
  Sparkles, 
  Briefcase, 
  UserCheck, 
  Kanban, 
  Bot, 
  BarChart3, 
  ShieldCheck, 
  ChevronDown, 
  PlusCircle,
  FileText,
  Trash2,
  RotateCcw
} from 'lucide-react';

export type ActiveTab = 'ranked_feed' | 'profile' | 'jobs' | 'tracker' | 'assistant' | 'evaluation' | 'privacy';

interface NavbarProps {
  candidates: Candidate[];
  activeCandidate: Candidate | null;
  onSelectCandidate: (candidate: Candidate) => void;
  onDeleteCandidate?: (candidateId: string) => Promise<void>;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenUpload: () => void;
  onResetSeedData?: () => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  candidates,
  activeCandidate,
  onSelectCandidate,
  onDeleteCandidate,
  activeTab,
  onSelectTab,
  onOpenUpload,
  onResetSeedData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('ranked_feed')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">Shortlist</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  AI Job Matching
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Explainable ontology-backed career discovery</p>
            </div>
          </div>

          {/* Active Candidate Selector & Upload Action */}
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-medium text-xs flex items-center justify-center">
                  {activeCandidate?.name.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {activeCandidate?.name || 'No Profile Selected'}
                  </div>
                  <div className="text-[11px] text-slate-500 capitalize leading-tight">
                    {activeCandidate ? `${activeCandidate.role_family} • ${activeCandidate.experience_years} yrs exp` : 'Create or upload profile'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>

              {/* Candidate Dropdown */}
              <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-2 hidden group-hover:block transition-all z-50">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Candidate Profiles ({candidates.length})
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {candidates.length > 0 ? (
                    candidates.map((cand) => (
                      <div
                        key={cand.id}
                        className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors group/item ${
                          activeCandidate?.id === cand.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectCandidate(cand)}
                          className="flex-1 text-left min-w-0 pr-2"
                        >
                          <div className={`text-xs font-medium truncate ${activeCandidate?.id === cand.id ? 'text-indigo-700' : 'text-slate-800'}`}>
                            {cand.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate capitalize">
                            {cand.target_role}
                          </div>
                        </button>

                        <div className="flex items-center space-x-1 shrink-0">
                          {activeCandidate?.id === cand.id && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 mr-1"></span>
                          )}
                          {onDeleteCandidate && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCandidate(cand.id);
                              }}
                              className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                              title={`Delete profile for ${cand.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No candidate profiles saved.
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 my-1.5"></div>

                <button
                  onClick={onOpenUpload}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-indigo-600 hover:bg-indigo-50 flex items-center space-x-2 font-medium"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Upload New Resume (PDF/DOCX)</span>
                </button>

                {onResetSeedData && (
                  <button
                    onClick={onResetSeedData}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 flex items-center space-x-2 font-medium"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    <span>Restore Sample Candidates</span>
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={onOpenUpload}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Resume</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto scrollbar-none py-1 border-t border-slate-100">
          <button
            onClick={() => onSelectTab('ranked_feed')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'ranked_feed'
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Shortlist (Ranked Feed)</span>
          </button>

          <button
            onClick={() => onSelectTab('profile')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'profile'
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Candidate Profile</span>
          </button>

          <button
            onClick={() => onSelectTab('jobs')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'jobs'
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>Job Catalog & Ingestion</span>
          </button>

          <button
            onClick={() => onSelectTab('tracker')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'tracker'
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Kanban className="w-4 h-4 text-purple-600" />
            <span>Application Tracker</span>
          </button>

          <button
            onClick={() => onSelectTab('assistant')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'assistant'
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bot className="w-4 h-4 text-amber-600" />
            <span>AI Career Assistant</span>
          </button>

          <button
            onClick={() => onSelectTab('evaluation')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'evaluation'
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>Evaluation & Benchmark</span>
          </button>

          <button
            onClick={() => onSelectTab('privacy')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'privacy'
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <span>Privacy & Settings</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
