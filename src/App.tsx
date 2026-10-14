import React, { useState, useEffect } from 'react';
import { Candidate, Job, MatchScoreResult, Application, ApplicationStatus } from './lib/types';
import { Navbar, ActiveTab } from './components/Navbar';
import { RankedJobsView } from './components/RankedJobsView';
import { CandidateProfileView } from './components/CandidateProfileView';
import { JobCatalogView } from './components/JobCatalogView';
import { ApplicationTrackerView } from './components/ApplicationTrackerView';
import { CareerAssistantView } from './components/CareerAssistantView';
import { EvaluationBenchmarkView } from './components/EvaluationBenchmarkView';
import { PrivacySettingsView } from './components/PrivacySettingsView';

interface RankedMatchItem {
  job: Job;
  match: MatchScoreResult;
}

export default function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matches, setMatches] = useState<RankedMatchItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('ranked_feed');
  const [isLoading, setIsLoading] = useState(true);
  const [assistantSelectedJob, setAssistantSelectedJob] = useState<string | undefined>(undefined);

  // Load initial candidates and jobs
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [candsRes, jobsRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/jobs'),
      ]);
      const candsData: Candidate[] = await candsRes.json();
      const jobsData: Job[] = await jobsRes.json();

      setCandidates(candsData);
      setJobs(jobsData);

      if (candsData.length > 0) {
        const defaultCand = candsData[0];
        setActiveCandidate(defaultCand);
        await fetchMatchesAndApps(defaultCand.id);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatchesAndApps = async (candidateId: string) => {
    try {
      const [matchesRes, appsRes] = await Promise.all([
        fetch(`/api/match/${encodeURIComponent(candidateId)}`),
        fetch(`/api/applications?candidate_id=${encodeURIComponent(candidateId)}`),
      ]);

      if (matchesRes.ok) {
        const matchesData: RankedMatchItem[] = await matchesRes.json();
        setMatches(matchesData);
      }
      if (appsRes.ok) {
        const appsData: Application[] = await appsRes.json();
        setApplications(appsData);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSelectCandidate = async (candidate: Candidate) => {
    setActiveCandidate(candidate);
    await fetchMatchesAndApps(candidate.id);
  };

  const handleSaveCandidate = async (updated: Candidate) => {
    const res = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    const saved: Candidate = await res.json();
    setCandidates((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
    setActiveCandidate(saved);
    await fetchMatchesAndApps(saved.id);
  };

  const handleUploadSuccess = async (newCandidate: Candidate) => {
    setCandidates((prev) => [newCandidate, ...prev]);
    setActiveCandidate(newCandidate);
    await fetchMatchesAndApps(newCandidate.id);
    setActiveTab('profile');
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      const res = await fetch(`/api/candidates/${encodeURIComponent(candidateId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete candidate profile');
      }

      const remaining = candidates.filter((c) => c.id !== candidateId);
      setCandidates(remaining);

      if (activeCandidate?.id === candidateId) {
        if (remaining.length > 0) {
          const nextCandidate = remaining[0];
          setActiveCandidate(nextCandidate);
          await fetchMatchesAndApps(nextCandidate.id);
        } else {
          setActiveCandidate(null);
          setMatches([]);
          setApplications([]);
        }
      }
    } catch (err) {
      console.error('Error deleting candidate profile:', err);
      throw err;
    }
  };

  const handleAddJob = async (newJob: Job) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob),
    });
    const saved: Job = await res.json();
    setJobs((prev) => [saved, ...prev]);
    if (activeCandidate) {
      await fetchMatchesAndApps(activeCandidate.id);
    }
  };

  const handleBulkImportCsv = async (csvText: string): Promise<number> => {
    const res = await fetch('/api/jobs/bulk-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Refresh jobs
    const jobsRes = await fetch('/api/jobs');
    const updatedJobs = await jobsRes.json();
    setJobs(updatedJobs);
    if (activeCandidate) {
      await fetchMatchesAndApps(activeCandidate.id);
    }
    return data.count;
  };

  const handleUpdateApplicationStatus = async (
    jobId: string,
    status: ApplicationStatus,
    notes?: string
  ) => {
    if (!activeCandidate) return;
    const existing = applications.find((a) => a.job_id === jobId);
    const payload: Application = {
      id: existing?.id || `app-${Date.now()}`,
      candidate_id: activeCandidate.id,
      job_id: jobId,
      status,
      notes: notes ?? existing?.notes,
      applied_at: status === 'applied' ? new Date().toISOString() : existing?.applied_at,
    };

    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const saved: Application = await res.json();
    setApplications((prev) => {
      const idx = prev.findIndex((a) => a.job_id === jobId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  };

  const handleDeleteApplication = async (appId: string | number) => {
    await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
    setApplications((prev) => prev.filter((a) => a.id !== appId));
  };

  const handleOpenAssistantForJob = (job: Job) => {
    setAssistantSelectedJob(job.id);
    setActiveTab('assistant');
  };

  const handleResetSeedData = async () => {
    await fetch('/api/seed/reset', { method: 'POST' });
    await fetchInitialData();
  };

  // Convert applications list to lookup map by jobId
  const applicationStatuses: Record<string, ApplicationStatus> = {};
  applications.forEach((a) => {
    applicationStatuses[a.job_id] = a.status;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-700">Loading Shortlist Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        candidates={candidates}
        activeCandidate={activeCandidate}
        onSelectCandidate={handleSelectCandidate}
        onDeleteCandidate={handleDeleteCandidate}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenUpload={() => setActiveTab('profile')}
        onResetSeedData={handleResetSeedData}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {activeTab === 'ranked_feed' && (
          <RankedJobsView
            activeCandidate={activeCandidate}
            matches={matches}
            applicationStatuses={applicationStatuses}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onOpenAssistantForJob={handleOpenAssistantForJob}
            onSelectCandidateProfile={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'profile' && (
          <CandidateProfileView
            candidate={activeCandidate}
            onSaveCandidate={handleSaveCandidate}
            onUploadSuccess={handleUploadSuccess}
            onDeleteCandidate={handleDeleteCandidate}
            onRestoreDefaultCandidates={handleResetSeedData}
          />
        )}

        {activeTab === 'jobs' && (
          <JobCatalogView
            jobs={jobs}
            candidate={activeCandidate}
            applicationStatuses={applicationStatuses}
            onAddJob={handleAddJob}
            onBulkImportCsv={handleBulkImportCsv}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onOpenAssistant={(job) => {
              setAssistantSelectedJob(job.id);
              setActiveTab('assistant');
            }}
          />
        )}

        {activeTab === 'tracker' && (
          <ApplicationTrackerView
            candidate={activeCandidate}
            applications={applications}
            jobs={jobs}
            onUpdateStatus={handleUpdateApplicationStatus}
            onDeleteApplication={handleDeleteApplication}
          />
        )}

        {activeTab === 'assistant' && (
          <CareerAssistantView
            candidate={activeCandidate}
            jobs={jobs}
            initialJobId={assistantSelectedJob}
          />
        )}

        {activeTab === 'evaluation' && (
          <EvaluationBenchmarkView />
        )}

        {activeTab === 'privacy' && (
          <PrivacySettingsView
            candidates={candidates}
            activeCandidate={activeCandidate}
            onDeleteCandidate={handleDeleteCandidate}
            onResetSeedData={handleResetSeedData}
          />
        )}
      </main>

      {/* Global Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Shortlist AI Job-Matching Platform • Explainable Ontology Engine</span>
          <span>Level 1 Baseline + Level 2 Gemini Assistant • Hand-Labelled NDCG@5 Evaluated</span>
        </div>
      </footer>
    </div>
  );
}
