export type RoleFamily = 'design' | 'engineering' | 'data' | 'operations' | 'marketing' | 'sales' | 'customer_support';

export interface CandidateSkill {
  id?: string | number;
  name: string;
  category?: string;
  proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  is_current: boolean;
  is_learning_interest: boolean;
  years_experience?: number;
}

export interface WorkExperience {
  id?: string | number;
  company: string;
  title: string;
  role_family?: RoleFamily;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  accomplishments: string;
}

export interface Education {
  id?: string | number;
  degree: string;
  institution: string;
  field_of_study: string;
  graduation_year: number;
}

export interface CandidateProject {
  id?: string | number;
  title: string;
  role?: string;
  description: string;
  is_professional: boolean;
  url?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  target_role: string;
  role_family: RoleFamily;
  experience_years: number;
  preferred_locations: string[];
  preferred_arrangements: ('remote' | 'hybrid' | 'on-site')[];
  bio: string;
  skills: CandidateSkill[];
  work_experiences: WorkExperience[];
  education: Education[];
  projects: CandidateProject[];
  created_at?: string;
  updated_at?: string;
}

export interface Job {
  id: string;
  title: string;
  role_family: RoleFamily;
  company: string;
  location: string;
  work_arrangement: 'remote' | 'hybrid' | 'on-site';
  employment_type: 'full-time' | 'part-time' | 'contract';
  experience_level: string;
  min_years_experience: number;
  salary_range: string;
  description: string;
  responsibilities: string;
  required_skills: string[];
  preferred_skills: string[];
  mandatory_qualifications: string[];
  application_url: string;
  source: 'direct' | 'job_board' | 'referral';
  created_at?: string;
}

export interface MatchScoreResult {
  job_id: string;
  total_score: number;
  role_family_score: number;
  required_skill_score: number;
  preferred_skill_score: number;
  experience_score: number;
  location_score: number;
  matched_skills: string[];
  missing_required_skills: string[];
  missing_preferred_skills: string[];
  failed_mandatory: string[];
  role_family_candidate: RoleFamily;
  role_family_job: RoleFamily;
  rationale: string;
}

export type ApplicationStatus = 'shortlisted' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface Application {
  id: string | number;
  candidate_id: string;
  job_id: string;
  status: ApplicationStatus;
  notes?: string;
  applied_at?: string;
  updated_at?: string;
}

export interface BenchmarkPair {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_family: RoleFamily;
  job_id: string;
  job_title: string;
  job_family: RoleFamily;
  ground_truth_relevance: number; // 0=irrelevant, 1=weak, 2=reasonable, 3=strong
  rationale: string;
}

export interface EvaluationReport {
  mean_ndcg_at_5: number;
  mean_precision_at_5: number;
  pairwise_ranking_accuracy: number;
  concordant_pairs: number;
  total_comparable_pairs: number;
  benchmark_count: number;
  candidate_evaluations: {
    candidate_id: string;
    candidate_name: string;
    ndcg_at_5: number;
    precision_at_5: number;
    top_jobs: {
      rank: number;
      job_id: string;
      job_title: string;
      role_family: string;
      predicted_score: number;
      ground_truth_relevance: number;
    }[];
  }[];
}
