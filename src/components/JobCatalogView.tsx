import React, { useState } from 'react';
import { Job, RoleFamily, Candidate, ApplicationStatus } from '../lib/types';
import { JobDetailModal } from './JobDetailModal';
import { getJobSearchUrls } from '../lib/urls';
import { 
  Briefcase, 
  Plus, 
  Upload, 
  ExternalLink, 
  Search, 
  Building2, 
  MapPin, 
  DollarSign, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface JobCatalogViewProps {
  jobs: Job[];
  candidate: Candidate | null;
  applicationStatuses: Record<string, ApplicationStatus>;
  onAddJob: (job: Job) => Promise<void>;
  onBulkImportCsv: (csvText: string) => Promise<number>;
  onUpdateApplicationStatus: (jobId: string, status: ApplicationStatus, notes?: string) => Promise<void> | void;
  onOpenAssistant?: (job: Job) => void;
}

export const JobCatalogView: React.FC<JobCatalogViewProps> = ({
  jobs,
  candidate,
  applicationStatuses,
  onAddJob,
  onBulkImportCsv,
  onUpdateApplicationStatus,
  onOpenAssistant,
}) => {
  const [search, setSearch] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [csvStatus, setCsvStatus] = useState<string | null>(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState<Job | null>(null);

  // New Job Form State
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '',
    role_family: 'engineering',
    company: '',
    location: 'Remote',
    work_arrangement: 'remote',
    employment_type: 'full-time',
    experience_level: 'Mid-Senior',
    min_years_experience: 3,
    salary_range: '$110,000 - $140,000',
    description: '',
    responsibilities: '',
    required_skills: [],
    preferred_skills: [],
    mandatory_qualifications: [],
    application_url: 'https://example.com/careers',
  });

  const [reqSkillsRaw, setReqSkillsRaw] = useState('React, TypeScript, Node.js');
  const [prefSkillsRaw, setPrefSkillsRaw] = useState('PostgreSQL, Docker');
  const [mandatoryRaw, setMandatoryRaw] = useState('');

  const filteredJobs = jobs.filter((j) => {
    if (selectedFamily !== 'all' && j.role_family !== selectedFamily) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.required_skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const created: Job = {
      id: `job-${Date.now()}`,
      title: newJob.title || 'Untitled Position',
      role_family: (newJob.role_family || 'engineering') as RoleFamily,
      company: newJob.company || 'Tech Company',
      location: newJob.location || 'Remote',
      work_arrangement: newJob.work_arrangement as any || 'remote',
      employment_type: newJob.employment_type as any || 'full-time',
      experience_level: newJob.experience_level || 'Mid',
      min_years_experience: newJob.min_years_experience || 0,
      salary_range: newJob.salary_range || '$100k+',
      description: newJob.description || '',
      responsibilities: newJob.responsibilities || '',
      required_skills: reqSkillsRaw.split(',').map((s) => s.trim()).filter(Boolean),
      preferred_skills: prefSkillsRaw.split(',').map((s) => s.trim()).filter(Boolean),
      mandatory_qualifications: mandatoryRaw.split(';').map((s) => s.trim()).filter(Boolean),
      application_url: newJob.application_url || 'https://example.com',
      source: 'direct',
      created_at: new Date().toISOString(),
    };

    await onAddJob(created);
    setIsAddModalOpen(false);
  };

  const handleCsvImport = async () => {
    if (!csvInput.trim()) return;
    try {
      const count = await onBulkImportCsv(csvInput);
      setCsvStatus(`Successfully ingested ${count} job records!`);
      setTimeout(() => {
        setCsvStatus(null);
        setIsCsvModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setCsvStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <span>Job Catalog & Ingestion Portal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage vetted job postings, define required vs preferred skills, and ingest batches via CSV.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Bulk CSV Ingestion</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalog by title, company, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={selectedFamily}
          onChange={(e) => setSelectedFamily(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Role Families ({jobs.length})</option>
          <option value="design">Design & Creative</option>
          <option value="engineering">Software Engineering</option>
          <option value="data">Data & Analytics</option>
          <option value="operations">Operations & Logistics</option>
          <option value="marketing">Marketing & Growth</option>
          <option value="sales">Sales & Business Dev</option>
          <option value="customer_support">Customer Support</option>
        </select>
      </div>

      {/* Jobs Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {job.role_family}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedJobDetail(job)}
                    className="text-left font-bold text-slate-900 text-sm mt-1 leading-snug hover:text-indigo-600 transition-colors block"
                  >
                    {job.title}
                  </button>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold capitalize whitespace-nowrap">
                  {job.work_arrangement}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-500">
                <div className="flex items-center space-x-1.5 font-medium text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{job.company}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center space-x-1.5 font-medium text-slate-800">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>{job.salary_range}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-1 pt-1">
                <div className="text-[11px] font-semibold text-slate-500">Required Skills:</div>
                <div className="flex flex-wrap gap-1">
                  {job.required_skills.slice(0, 4).map((s, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-medium">
                      {s}
                    </span>
                  ))}
                  {job.required_skills.length > 4 && (
                    <span className="text-[10px] text-slate-400">+{job.required_skills.length - 4} more</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400">Min {job.min_years_experience} yrs exp</span>
              <div className="flex items-center space-x-2">
                <a
                  href={getJobSearchUrls(job).primary}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-slate-600 hover:text-indigo-600 flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-50 transition-colors"
                  title="Open live job listing"
                >
                  <span>Live Link</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedJobDetail(job)}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                >
                  View Details & Apply
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Job Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Job Opportunity</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Job Title</label>
                  <input
                    type="text"
                    required
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="w-full border border-slate-200 rounded p-2 mt-1"
                    placeholder="e.g. Senior Brand Designer"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Role Family</label>
                  <select
                    value={newJob.role_family}
                    onChange={(e) => setNewJob({ ...newJob, role_family: e.target.value as any })}
                    className="w-full border border-slate-200 rounded p-2 mt-1 bg-white"
                  >
                    <option value="design">Design & Creative</option>
                    <option value="engineering">Software Engineering</option>
                    <option value="data">Data & Analytics</option>
                    <option value="operations">Operations & Logistics</option>
                    <option value="marketing">Marketing & Growth</option>
                    <option value="sales">Sales & Business Dev</option>
                    <option value="customer_support">Customer Support</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Company</label>
                  <input
                    type="text"
                    required
                    value={newJob.company}
                    onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    className="w-full border border-slate-200 rounded p-2 mt-1"
                    placeholder="e.g. Acme Studio"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Location</label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    className="w-full border border-slate-200 rounded p-2 mt-1"
                    placeholder="e.g. San Francisco CA or Remote"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Arrangement</label>
                  <select
                    value={newJob.work_arrangement}
                    onChange={(e) => setNewJob({ ...newJob, work_arrangement: e.target.value as any })}
                    className="w-full border border-slate-200 rounded p-2 mt-1 bg-white"
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on-site">On-site</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Min Exp (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={newJob.min_years_experience}
                    onChange={(e) => setNewJob({ ...newJob, min_years_experience: parseInt(e.target.value, 10) || 0 })}
                    className="w-full border border-slate-200 rounded p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Salary Range</label>
                  <input
                    type="text"
                    value={newJob.salary_range}
                    onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                    className="w-full border border-slate-200 rounded p-2 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Key Responsibilities</label>
                <textarea
                  rows={2}
                  required
                  value={newJob.responsibilities}
                  onChange={(e) => setNewJob({ ...newJob, responsibilities: e.target.value })}
                  className="w-full border border-slate-200 rounded p-2 mt-1"
                  placeholder="Outline key day-to-day duties..."
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Required Skills (comma separated, 3x weight)</label>
                <input
                  type="text"
                  required
                  value={reqSkillsRaw}
                  onChange={(e) => setReqSkillsRaw(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 mt-1"
                  placeholder="Figma, Adobe Illustrator, Typography"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Preferred Skills (comma separated, 1x weight)</label>
                <input
                  type="text"
                  value={prefSkillsRaw}
                  onChange={(e) => setPrefSkillsRaw(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 mt-1"
                  placeholder="Design Systems, Motion Graphics"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Mandatory Qualifications (semicolon separated; failure caps match score at &le;45)</label>
                <input
                  type="text"
                  value={mandatoryRaw}
                  onChange={(e) => setMandatoryRaw(e.target.value)}
                  className="w-full border border-slate-200 rounded p-2 mt-1"
                  placeholder="5+ years experience required; Bachelor degree in Design"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Save Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Ingestion Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Bulk Ingest Jobs via CSV</h3>
                <p className="text-xs text-slate-500">Paste standard RFC-4180 CSV text directly.</p>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                CSV Content (Schema: id,title,role_family,company,location,work_arrangement,employment_type,experience_level,min_years_experience,salary_range,description,responsibilities,required_skills,preferred_skills,mandatory_qualifications,application_url,source)
              </label>
              <textarea
                rows={8}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="job-201,Staff Brand Lead,design,Studio Apex,Remote,remote,full-time,Staff,6,$150k+,Lead visual identity,Direct cross-platform campaigns,Figma,Adobe Illustrator,Motion Graphics,Portfolio required,https://example.com/apply,direct"
              />
            </div>

            {csvStatus && (
              <div className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                csvStatus.startsWith('Error') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {csvStatus.startsWith('Error') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{csvStatus}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCsvImport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                Ingest CSV Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details & Application Portal Modal */}
      {selectedJobDetail && (
        <JobDetailModal
          job={selectedJobDetail}
          candidate={candidate}
          currentStatus={applicationStatuses[selectedJobDetail.id] || 'shortlisted'}
          onUpdateStatus={async (jobId, status, notes) => {
            await onUpdateApplicationStatus(jobId, status, notes);
          }}
          onClose={() => setSelectedJobDetail(null)}
          onOpenAssistant={onOpenAssistant}
        />
      )}
    </div>
  );
};
