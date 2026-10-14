import React, { useState, useRef } from 'react';
import { Candidate, CandidateSkill, WorkExperience, Education, CandidateProject, RoleFamily } from '../lib/types';
import { 
  Upload, 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Settings2,
  RefreshCw,
  AlertTriangle,
  X,
  UserCheck
} from 'lucide-react';

const createEmptyCandidate = (): Candidate => ({
  id: `cand-${Date.now()}`,
  name: 'New Candidate',
  email: '',
  target_role: 'Software Engineer',
  role_family: 'engineering',
  experience_years: 1,
  preferred_locations: ['Remote'],
  preferred_arrangements: ['remote'],
  bio: '',
  skills: [
    {
      name: 'Communication',
      category: 'Core',
      proficiency: 'Advanced',
      is_current: true,
      is_learning_interest: false,
    },
  ],
  work_experiences: [],
  projects: [],
  education: [],
});

interface CandidateProfileViewProps {
  candidate: Candidate | null;
  onSaveCandidate: (updated: Candidate) => Promise<void>;
  onUploadSuccess: (newCandidate: Candidate) => void;
  onDeleteCandidate: (candidateId: string) => Promise<void>;
  onRestoreDefaultCandidates?: () => Promise<void>;
}

export const CandidateProfileView: React.FC<CandidateProfileViewProps> = ({
  candidate,
  onSaveCandidate,
  onUploadSuccess,
  onDeleteCandidate,
  onRestoreDefaultCandidates,
}) => {
  const [profile, setProfile] = useState<Candidate | null>(candidate);
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'experience' | 'education' | 'projects' | 'preferences'>('skills');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if candidate prop changes
  React.useEffect(() => {
    setProfile(candidate);
  }, [candidate]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/candidates/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse resume document.');
      }

      onUploadSuccess(data.candidate);
      setProfile(data.candidate);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await onSaveCandidate(profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    const targetId = profile?.id || candidate?.id;
    if (!targetId) return;
    setIsDeleting(true);
    try {
      await onDeleteCandidate(targetId);
      setIsDeleteModalOpen(false);
      setProfile(null);
    } catch (err) {
      console.error('Failed to delete profile:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Skill Management
  const addSkill = () => {
    if (!profile) return;
    const newSkill: CandidateSkill = {
      name: 'New Skill',
      category: 'Technical',
      proficiency: 'Intermediate',
      is_current: true,
      is_learning_interest: false,
    };
    setProfile({ ...profile, skills: [...profile.skills, newSkill] });
  };

  const removeSkill = (index: number) => {
    if (!profile) return;
    const updated = profile.skills.filter((_, i) => i !== index);
    setProfile({ ...profile, skills: updated });
  };

  const toggleSkillLearningInterest = (index: number) => {
    if (!profile) return;
    const updated = [...profile.skills];
    const item = updated[index];
    if (item.is_learning_interest) {
      item.is_learning_interest = false;
      item.is_current = true;
    } else {
      item.is_learning_interest = true;
      item.is_current = false;
    }
    setProfile({ ...profile, skills: updated });
  };

  // Work Experience Management
  const addExperience = () => {
    if (!profile) return;
    const newExp: WorkExperience = {
      company: 'Company Name',
      title: profile.target_role,
      role_family: profile.role_family,
      start_date: '2022-01',
      end_date: 'Present',
      is_current: true,
      description: 'Key responsibilities and technical accomplishments.',
      accomplishments: 'Quantifiable achievements.',
    };
    setProfile({ ...profile, work_experiences: [...profile.work_experiences, newExp] });
  };

  const removeExperience = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      work_experiences: profile.work_experiences.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Upload Zone */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              <span>Resume Parser & Extraction Safe Intake</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accepts PDF, DOCX, TXT, and JSON. Extracted data is sanitized and reviewable below.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx,.txt,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Parsing Resume...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Choose File to Upload</span>
                </>
              )}
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Profile Review & Edit Workspace */}
      {!profile ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <UserCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">No Candidate Profile Active</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You currently have no active profile. Upload a resume file above (PDF, DOCX, TXT, JSON), create a new profile manually, or restore the default sample profiles.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Resume</span>
            </button>
            <button
              type="button"
              onClick={() => setProfile(createEmptyCandidate())}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Profile Manually</span>
            </button>
            {onRestoreDefaultCandidates && (
              <button
                type="button"
                onClick={onRestoreDefaultCandidates}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Restore Sample Candidates</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Profile Header Summary */}
            <div className="p-6 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="text-xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none px-1 py-0.5"
                    placeholder="Candidate Full Name"
                  />
                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold uppercase tracking-wider">
                    {profile.role_family}
                  </span>
                </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 px-1">
              <span>Email: <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="bg-transparent border-b border-slate-200 focus:border-indigo-600 focus:outline-none px-1 text-slate-800"
              /></span>
              <span>• Target: <input
                type="text"
                value={profile.target_role}
                onChange={(e) => setProfile({ ...profile, target_role: e.target.value })}
                className="bg-transparent border-b border-slate-200 focus:border-indigo-600 focus:outline-none px-1 font-semibold text-slate-800"
              /></span>
              <span>• Experience: <input
                type="number"
                min="0"
                max="30"
                value={profile.experience_years}
                onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value, 10) || 0 })}
                className="w-12 bg-transparent border-b border-slate-200 focus:border-indigo-600 focus:outline-none px-1 text-slate-800 font-mono-numbers"
              /> yrs</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>Profile Saved & Matches Updated!</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3.5 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              title="Delete this candidate profile"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete Profile</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save & Recalculate Matches'}</span>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-200 px-6 space-x-6 text-xs font-semibold text-slate-500 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('skills')}
            className={`py-3.5 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'skills'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Skills & Taxonomy ({profile.skills.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('experience')}
            className={`py-3.5 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'experience'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Work Experience ({profile.work_experiences.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('projects')}
            className={`py-3.5 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'projects'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Projects ({profile.projects.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('education')}
            className={`py-3.5 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'education'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Education ({profile.education.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('preferences')}
            className={`py-3.5 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'preferences'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Preferences & Work Arrangements</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {/* SKILLS TAB */}
          {activeSubTab === 'skills' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Extracted & Verified Skills</h3>
                  <p className="text-xs text-slate-500">
                    Distinguish between <span className="font-semibold text-emerald-700">Current Skills</span> (weight 1.0) and <span className="font-semibold text-amber-700">Learning Interests</span> (weight 0.2, cannot satisfy mandatory criteria).
                  </p>
                </div>
                <button
                  onClick={addSkill}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {profile.skills.map((skill, idx) => (
                  <div key={idx} className="p-3 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => {
                          const updated = [...profile.skills];
                          updated[idx].name = e.target.value;
                          setProfile({ ...profile, skills: updated });
                        }}
                        className="font-semibold text-xs text-slate-900 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />

                      <select
                        value={skill.proficiency || 'Intermediate'}
                        onChange={(e) => {
                          const updated = [...profile.skills];
                          updated[idx].proficiency = e.target.value as any;
                          setProfile({ ...profile, skills: updated });
                        }}
                        className="text-xs text-slate-600 border border-slate-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Skill Type Switcher */}
                      <button
                        type="button"
                        onClick={() => toggleSkillLearningInterest(idx)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                          skill.is_learning_interest
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {skill.is_learning_interest ? 'Learning Interest (0.2x)' : 'Current Skill (1.0x)'}
                      </button>

                      <button
                        onClick={() => removeSkill(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WORK EXPERIENCE TAB */}
          {activeSubTab === 'experience' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Professional Work History</h3>
                  <p className="text-xs text-slate-500">
                    Actual professional experience has substantial weight in semantic role-family and responsibility matching.
                  </p>
                </div>
                <button
                  onClick={addExperience}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience</span>
                </button>
              </div>

              <div className="space-y-4">
                {profile.work_experiences.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 uppercase">Job Title</label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => {
                              const updated = [...profile.work_experiences];
                              updated[idx].title = e.target.value;
                              setProfile({ ...profile, work_experiences: updated });
                            }}
                            className="w-full text-xs font-bold text-slate-900 border border-slate-200 rounded px-2 py-1 mt-0.5 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 uppercase">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const updated = [...profile.work_experiences];
                              updated[idx].company = e.target.value;
                              setProfile({ ...profile, work_experiences: updated });
                            }}
                            className="w-full text-xs font-bold text-slate-900 border border-slate-200 rounded px-2 py-1 mt-0.5 bg-white"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeExperience(idx)}
                        className="ml-3 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">Accomplishments & Metrics</label>
                      <textarea
                        rows={2}
                        value={exp.accomplishments}
                        onChange={(e) => {
                          const updated = [...profile.work_experiences];
                          updated[idx].accomplishments = e.target.value;
                          setProfile({ ...profile, work_experiences: updated });
                        }}
                        className="w-full text-xs text-slate-800 border border-slate-200 rounded p-2 mt-0.5 bg-white"
                        placeholder="Key metrics, initiatives, and deliverables..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeSubTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Projects & Initiatives</h3>
                  <p className="text-xs text-slate-500">
                    The platform distinguishes between commercial/professional projects and personal/learning projects.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newProj: CandidateProject = {
                      title: 'New Project',
                      role: 'Lead',
                      description: 'Project details and technologies utilized.',
                      is_professional: true,
                    };
                    setProfile({ ...profile, projects: [...profile.projects, newProj] });
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              <div className="space-y-3">
                {profile.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const updated = [...profile.projects];
                            updated[idx].title = e.target.value;
                            setProfile({ ...profile, projects: updated });
                          }}
                          className="font-bold text-xs text-slate-900 border border-slate-200 rounded px-2 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...profile.projects];
                            updated[idx].is_professional = !updated[idx].is_professional;
                            setProfile({ ...profile, projects: updated });
                          }}
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            proj.is_professional
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {proj.is_professional ? 'Professional Project' : 'Personal / Hobby Project'}
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setProfile({ ...profile, projects: profile.projects.filter((_, i) => i !== idx) });
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[idx].description = e.target.value;
                        setProfile({ ...profile, projects: updated });
                      }}
                      className="w-full text-xs text-slate-700 border border-slate-200 rounded p-2"
                      placeholder="Project architecture and outcomes..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EDUCATION TAB */}
          {activeSubTab === 'education' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Degrees & Education</h3>
                  <p className="text-xs text-slate-500">
                    Used to satisfy mandatory degree qualifications or academic background requirements.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newEdu: Education = {
                      degree: 'B.S.',
                      institution: 'University',
                      field_of_study: 'Major',
                      graduation_year: 2020,
                    };
                    setProfile({ ...profile, education: [...profile.education, newEdu] });
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Education</span>
                </button>
              </div>

              <div className="space-y-3">
                {profile.education.map((edu, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...profile.education];
                          updated[idx].degree = e.target.value;
                          setProfile({ ...profile, education: updated });
                        }}
                        className="text-xs font-bold text-slate-900 border border-slate-200 rounded px-2 py-1"
                        placeholder="Degree (e.g. BFA, B.S.)"
                      />
                      <input
                        type="text"
                        value={edu.field_of_study}
                        onChange={(e) => {
                          const updated = [...profile.education];
                          updated[idx].field_of_study = e.target.value;
                          setProfile({ ...profile, education: updated });
                        }}
                        className="text-xs text-slate-700 border border-slate-200 rounded px-2 py-1"
                        placeholder="Field of Study"
                      />
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const updated = [...profile.education];
                          updated[idx].institution = e.target.value;
                          setProfile({ ...profile, education: updated });
                        }}
                        className="text-xs text-slate-700 border border-slate-200 rounded px-2 py-1"
                        placeholder="Institution"
                      />
                      <input
                        type="number"
                        value={edu.graduation_year}
                        onChange={(e) => {
                          const updated = [...profile.education];
                          updated[idx].graduation_year = parseInt(e.target.value, 10) || 2020;
                          setProfile({ ...profile, education: updated });
                        }}
                        className="text-xs text-slate-700 border border-slate-200 rounded px-2 py-1"
                        placeholder="Year"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setProfile({ ...profile, education: profile.education.filter((_, i) => i !== idx) });
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeSubTab === 'preferences' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Career & Location Preferences</h3>
                <p className="text-xs text-slate-500">
                  Explicit criteria for work arrangements and locations.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Preferred Work Arrangements</label>
                  <div className="flex items-center space-x-3 mt-1.5">
                    {(['remote', 'hybrid', 'on-site'] as const).map((arr) => {
                      const active = profile.preferred_arrangements.includes(arr);
                      return (
                        <button
                          key={arr}
                          type="button"
                          onClick={() => {
                            let updated = [...profile.preferred_arrangements];
                            if (active) {
                              updated = updated.filter((a) => a !== arr);
                            } else {
                              updated.push(arr);
                            }
                            setProfile({ ...profile, preferred_arrangements: updated });
                          }}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize transition-all ${
                            active
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          {arr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Preferred Locations (comma separated)</label>
                  <input
                    type="text"
                    value={profile.preferred_locations.join(', ')}
                    onChange={(e) => {
                      const locs = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      setProfile({ ...profile, preferred_locations: locs });
                    }}
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded p-2 mt-1"
                    placeholder="San Francisco CA, New York NY, Remote"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

      {/* Danger Zone: Profile Deletion & Right to Be Forgotten */}
      {profile && (
        <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-rose-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-sm text-slate-900">Danger Zone: Data Erasure & Profile Deletion</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            In compliance with privacy policies and data protection standards (GDPR/CCPA), candidates can delete their profile and permanently purge all stored information from the database at any time.
          </p>
          <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-700 space-y-0.5">
              <div className="font-semibold text-rose-900">Permanently delete {profile.name}'s profile</div>
              <div className="text-[11px] text-slate-500">
                Candidate ID: <span className="font-mono text-slate-700">{profile.id}</span> • Deletes all extracted skills ({profile.skills.length}), work experiences ({profile.work_experiences.length}), and application tracking records.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto shadow-sm transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete This Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {isDeleteModalOpen && profile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Delete Profile for {profile.name}?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will permanently erase <strong>{profile.name}</strong> ({profile.target_role}) and all corresponding data from the database, including:
              </p>
              <ul className="list-disc pl-5 text-xs text-slate-500 space-y-1">
                <li>Uploaded resume text & candidate metadata</li>
                <li>All {profile.skills.length} extracted verified skills & learning interests</li>
                <li>Professional accomplishments and work history</li>
                <li>Saved jobs and tracked application stages</li>
              </ul>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-medium text-rose-800">
                Warning: This action is irreversible.
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProfile}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Profile...</span>
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
