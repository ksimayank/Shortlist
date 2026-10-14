import React, { useState } from 'react';
import { Candidate, Job, Application, ApplicationStatus } from '../lib/types';
import { 
  Kanban, 
  Download, 
  Building2, 
  MapPin, 
  ExternalLink, 
  Trash2, 
  FileText,
  Calendar,
  Sparkles
} from 'lucide-react';

import { JobDetailModal } from './JobDetailModal';

interface ApplicationTrackerViewProps {
  candidate: Candidate | null;
  applications: Application[];
  jobs: Job[];
  onUpdateStatus: (jobId: string, status: ApplicationStatus, notes?: string) => Promise<void>;
  onDeleteApplication: (appId: string | number) => Promise<void>;
}

const COLUMNS: { id: ApplicationStatus; title: string; color: string; badge: string }[] = [
  { id: 'shortlisted', title: 'Shortlisted', color: 'border-slate-300 bg-slate-50/50', badge: 'bg-slate-100 text-slate-700' },
  { id: 'applied', title: 'Applied', color: 'border-blue-300 bg-blue-50/20', badge: 'bg-blue-100 text-blue-700' },
  { id: 'interview', title: 'Interviewing', color: 'border-amber-300 bg-amber-50/20', badge: 'bg-amber-100 text-amber-700' },
  { id: 'offer', title: 'Offer Received', color: 'border-emerald-300 bg-emerald-50/20', badge: 'bg-emerald-100 text-emerald-700' },
  { id: 'rejected', title: 'Archived / Rejected', color: 'border-rose-300 bg-rose-50/20', badge: 'bg-rose-100 text-rose-700' },
];

export const ApplicationTrackerView: React.FC<ApplicationTrackerViewProps> = ({
  candidate,
  applications,
  jobs,
  onUpdateStatus,
  onDeleteApplication,
}) => {
  const [editingNotesId, setEditingNotesId] = useState<string | number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedJobDetail, setSelectedJobDetail] = useState<Job | null>(null);

  const jobMap = new Map<string, Job>(jobs.map((j) => [j.id, j]));

  const handleExportCsv = () => {
    if (!candidate) return;
    window.location.href = `/api/applications/export-csv?candidate_id=${encodeURIComponent(candidate.id)}`;
  };

  if (!candidate) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Kanban className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Candidate Profile Selected</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
          Please select, upload, or create a candidate profile to track job applications and interview stages.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Kanban className="w-5 h-5 text-indigo-600" />
            <span>Application Lifecycle Tracker</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active tracking for <span className="font-semibold text-slate-700">{candidate.name}</span>. Data persists across sessions.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Shortlist to CSV</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-400">Total Tracked</div>
          <div className="text-xl font-bold font-mono-numbers text-slate-900 mt-0.5">{applications.length}</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-400">Applications Sent</div>
          <div className="text-xl font-bold font-mono-numbers text-blue-600 mt-0.5">
            {applications.filter((a) => a.status === 'applied').length}
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-400">In Interview</div>
          <div className="text-xl font-bold font-mono-numbers text-amber-600 mt-0.5">
            {applications.filter((a) => a.status === 'interview').length}
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-400">Offers</div>
          <div className="text-xl font-bold font-mono-numbers text-emerald-600 mt-0.5">
            {applications.filter((a) => a.status === 'offer').length}
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colApps = applications.filter((a) => a.status === col.id);

          return (
            <div
              key={col.id}
              className={`rounded-xl border ${col.color} p-3 space-y-3 min-h-[450px] flex flex-col`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">{col.title}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold font-mono-numbers ${col.badge}`}>
                  {colApps.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {colApps.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                    No jobs in {col.title}
                  </div>
                ) : (
                  colApps.map((app) => {
                    const job = jobMap.get(app.job_id);
                    if (!job) return null;

                    return (
                      <div
                        key={app.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm space-y-2.5 hover:shadow-md transition-all"
                      >
                        <div>
                          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                            {job.role_family}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedJobDetail(job)}
                            className="text-left font-bold text-xs text-slate-900 leading-snug mt-0.5 hover:text-indigo-600 transition-colors block"
                          >
                            {job.title}
                          </button>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{job.company}</span>
                          </div>
                        </div>

                        {/* Move Status Selector */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <label className="text-[10px] font-semibold text-slate-400">Move to:</label>
                          <select
                            value={app.status}
                            onChange={(e) => onUpdateStatus(job.id, e.target.value as ApplicationStatus, app.notes)}
                            className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 font-medium text-slate-700"
                          >
                            <option value="shortlisted">Shortlisted</option>
                            <option value="applied">Applied</option>
                            <option value="interview">Interview</option>
                            <option value="offer">Offer</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>

                        {/* Notes Section */}
                        {editingNotesId === app.id ? (
                          <div className="space-y-1.5 pt-1">
                            <textarea
                              rows={2}
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Private notes (interviewer names, follow-up date)..."
                              className="w-full text-[11px] p-1.5 border border-slate-200 rounded"
                            />
                            <div className="flex justify-end space-x-1 text-[10px]">
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="px-2 py-0.5 text-slate-500"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  onUpdateStatus(job.id, app.status, noteText);
                                  setEditingNotesId(null);
                                }}
                                className="px-2 py-0.5 bg-indigo-600 text-white rounded font-semibold"
                              >
                                Save Note
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                            <button
                              onClick={() => {
                                setEditingNotesId(app.id);
                                setNoteText(app.notes || '');
                              }}
                              className="hover:text-indigo-600 text-left truncate flex-1 flex items-center space-x-1"
                            >
                              <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{app.notes || 'Add notes...'}</span>
                            </button>

                            <button
                              onClick={() => onDeleteApplication(app.id)}
                              className="text-slate-300 hover:text-rose-600 ml-1.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Job Details Modal */}
      {selectedJobDetail && (
        <JobDetailModal
          job={selectedJobDetail}
          candidate={candidate}
          currentStatus={
            applications.find((a) => a.job_id === selectedJobDetail.id)?.status || 'shortlisted'
          }
          onUpdateStatus={onUpdateStatus}
          onClose={() => setSelectedJobDetail(null)}
        />
      )}
    </div>
  );
};
