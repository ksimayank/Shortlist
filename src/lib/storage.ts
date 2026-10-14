import fs from 'fs';
import path from 'path';
import { Candidate, Job, Application, BenchmarkPair, EvaluationReport } from './types';
import { ShortlistRankingEngine } from './rankingEngine';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'app_store.json');

export interface AppStoreData {
  candidates: Candidate[];
  jobs: Job[];
  applications: Application[];
  benchmarks: BenchmarkPair[];
}

export class AppStorage {
  private static instance: AppStorage;
  private data: AppStoreData;

  private constructor() {
    this.data = this.loadOrInitialize();
  }

  public static getInstance(): AppStorage {
    if (!AppStorage.instance) {
      AppStorage.instance = new AppStorage();
    }
    return AppStorage.instance;
  }

  private loadOrInitialize(): AppStoreData {
    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse app_store.json, resetting with seed data:', err);
      }
    }
    return this.initializeWithSeed();
  }

  public initializeWithSeed(): AppStoreData {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Load sample candidates from shortlist/data/sample_candidates.json
    let candidates: Candidate[] = [];
    const candPath = path.resolve(process.cwd(), 'shortlist', 'data', 'sample_candidates.json');
    if (fs.existsSync(candPath)) {
      candidates = JSON.parse(fs.readFileSync(candPath, 'utf-8'));
    }

    // Load sample jobs from shortlist/data/sample_jobs.csv
    const jobs: Job[] = [];
    const jobsPath = path.resolve(process.cwd(), 'shortlist', 'data', 'sample_jobs.csv');
    if (fs.existsSync(jobsPath)) {
      const csvText = fs.readFileSync(jobsPath, 'utf-8');
      const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
      const header = lines[0].split(',');
      for (let i = 1; i < lines.length; i++) {
        // Regex to parse CSV with quoted commas
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
        const matches: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = regex.exec(lines[i])) !== null) {
          let val = m[1] || '';
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1).replace(/""/g, '"');
          }
          matches.push(val.trim());
          if (regex.lastIndex === lines[i].length) break;
        }

        if (matches.length >= 10) {
          jobs.push({
            id: matches[0],
            title: matches[1],
            role_family: (matches[2] || 'operations') as any,
            company: matches[3],
            location: matches[4],
            work_arrangement: (matches[5] || 'hybrid') as any,
            employment_type: (matches[6] || 'full-time') as any,
            experience_level: matches[7],
            min_years_experience: parseInt(matches[8], 10) || 0,
            salary_range: matches[9],
            description: matches[10] || '',
            responsibilities: matches[11] || '',
            required_skills: (matches[12] || '').split(',').map((s) => s.trim()).filter(Boolean),
            preferred_skills: (matches[13] || '').split(',').map((s) => s.trim()).filter(Boolean),
            mandatory_qualifications: (matches[14] || '').split(';').map((s) => s.trim()).filter(Boolean),
            application_url: (matches[15] && !matches[15].includes('example.com') && !matches[15].includes('linkedin.com/jobs/search'))
              ? matches[15]
              : `https://www.google.com/search?q=${encodeURIComponent(`${matches[1]} ${matches[3]} jobs`)}&ibp=htl;jobs`,
            source: (matches[16] || 'direct') as any,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // Load benchmarks
    let benchmarks: BenchmarkPair[] = [];
    const benchPath = path.resolve(process.cwd(), 'shortlist', 'data', 'evaluation', 'benchmark.json');
    if (fs.existsSync(benchPath)) {
      benchmarks = JSON.parse(fs.readFileSync(benchPath, 'utf-8'));
    }

    // Initial applications
    const applications: Application[] = [
      {
        id: 'app-01',
        candidate_id: 'cand-01',
        job_id: 'job-101',
        status: 'shortlisted',
        notes: 'Top design match. Visual identity role with strong Figma overlap.',
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'app-02',
        candidate_id: 'cand-01',
        job_id: 'job-103',
        status: 'applied',
        notes: 'Submitted portfolio and resume via direct career page.',
        applied_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const initialData: AppStoreData = { candidates, jobs, applications, benchmarks };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    this.data = initialData;
    return initialData;
  }

  private save() {
    fs.writeFileSync(STORE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // Candidate Operations
  public getCandidates(): Candidate[] {
    return this.data.candidates;
  }

  public getCandidateById(id: string): Candidate | undefined {
    return this.data.candidates.find((c) => c.id === id);
  }

  public saveCandidate(candidate: Candidate): Candidate {
    const idx = this.data.candidates.findIndex((c) => c.id === candidate.id);
    if (idx >= 0) {
      this.data.candidates[idx] = { ...candidate, updated_at: new Date().toISOString() };
    } else {
      this.data.candidates.push({
        ...candidate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    this.save();
    return candidate;
  }

  public deleteCandidate(id: string): boolean {
    const initialLen = this.data.candidates.length;
    this.data.candidates = this.data.candidates.filter((c) => c.id !== id);
    this.data.applications = this.data.applications.filter((a) => a.candidate_id !== id);
    this.save();
    return this.data.candidates.length < initialLen;
  }

  // Job Operations
  public getJobs(): Job[] {
    return this.data.jobs;
  }

  public getJobById(id: string): Job | undefined {
    return this.data.jobs.find((j) => j.id === id);
  }

  public saveJob(job: Job): Job {
    const idx = this.data.jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      this.data.jobs[idx] = job;
    } else {
      this.data.jobs.push(job);
    }
    this.save();
    return job;
  }

  // Applications
  public getApplications(candidateId?: string): Application[] {
    if (candidateId) {
      return this.data.applications.filter((a) => a.candidate_id === candidateId);
    }
    return this.data.applications;
  }

  public saveApplication(app: Application): Application {
    const idx = this.data.applications.findIndex((a) => a.candidate_id === app.candidate_id && a.job_id === app.job_id);
    if (idx >= 0) {
      this.data.applications[idx] = { ...this.data.applications[idx], ...app, updated_at: new Date().toISOString() };
    } else {
      this.data.applications.push({
        ...app,
        id: app.id || `app-${Date.now()}`,
        updated_at: new Date().toISOString(),
      });
    }
    this.save();
    return app;
  }

  public deleteApplication(id: string | number): boolean {
    const initialLen = this.data.applications.length;
    this.data.applications = this.data.applications.filter((a) => a.id !== id);
    this.save();
    return this.data.applications.length < initialLen;
  }

  // Evaluation
  public getBenchmarks(): BenchmarkPair[] {
    return this.data.benchmarks;
  }

  public runEvaluation(): EvaluationReport {
    const engine = new ShortlistRankingEngine();
    const candidates = this.data.candidates;
    const jobs = this.data.jobs;
    const benchmarks = this.data.benchmarks;

    const candidateEvals = [];
    const ndcgList: number[] = [];
    const p5List: number[] = [];
    let concordantPairs = 0;
    let totalComparablePairs = 0;

    for (const cand of candidates) {
      const rankedJobs = jobs.map((job) => {
        const match = engine.evaluateMatch(cand, job);
        const bench = benchmarks.find((b) => b.candidate_id === cand.id && b.job_id === job.id);
        const gt = bench ? bench.ground_truth_relevance : 0;
        return {
          job_id: job.id,
          job_title: job.title,
          role_family: job.role_family,
          predicted_score: match.total_score,
          ground_truth_relevance: gt,
        };
      });

      rankedJobs.sort((a, b) => b.predicted_score - a.predicted_score);

      // NDCG@5
      let dcg = 0;
      for (let i = 0; i < Math.min(5, rankedJobs.length); i++) {
        const rel = rankedJobs[i].ground_truth_relevance;
        const gain = Math.pow(2, rel) - 1;
        const discount = Math.log2(i + 2);
        dcg += gain / discount;
      }

      const idealRels = [...rankedJobs].sort((a, b) => b.ground_truth_relevance - a.ground_truth_relevance);
      let idcg = 0;
      for (let i = 0; i < Math.min(5, idealRels.length); i++) {
        const rel = idealRels[i].ground_truth_relevance;
        const gain = Math.pow(2, rel) - 1;
        const discount = Math.log2(i + 2);
        idcg += gain / discount;
      }
      const ndcgAt5 = idcg > 0 ? dcg / idcg : 1.0;
      ndcgList.push(ndcgAt5);

      // Precision@5
      const top5RelCount = rankedJobs.slice(0, 5).filter((j) => j.ground_truth_relevance >= 2).length;
      const precisionAt5 = top5RelCount / 5;
      p5List.push(precisionAt5);

      // Pairwise concordant calculation
      const candBench = benchmarks.filter((b) => b.candidate_id === cand.id);
      const scoreMap = new Map(rankedJobs.map((j) => [j.job_id, j.predicted_score]));

      for (let i = 0; i < candBench.length; i++) {
        for (let j = i + 1; j < candBench.length; j++) {
          const b1 = candBench[i];
          const b2 = candBench[j];
          if (b1.ground_truth_relevance !== b2.ground_truth_relevance) {
            totalComparablePairs++;
            const s1 = scoreMap.get(b1.job_id) || 0;
            const s2 = scoreMap.get(b2.job_id) || 0;
            if (
              (b1.ground_truth_relevance > b2.ground_truth_relevance && s1 > s2) ||
              (b1.ground_truth_relevance < b2.ground_truth_relevance && s1 < s2)
            ) {
              concordantPairs++;
            }
          }
        }
      }

      candidateEvals.push({
        candidate_id: cand.id,
        candidate_name: cand.name,
        ndcg_at_5: Math.round(ndcgAt5 * 1000) / 1000,
        precision_at_5: Math.round(precisionAt5 * 1000) / 1000,
        top_jobs: rankedJobs.slice(0, 6).map((j, idx) => ({ rank: idx + 1, ...j })),
      });
    }

    const meanNdcg = ndcgList.length ? ndcgList.reduce((a, b) => a + b, 0) / ndcgList.length : 0;
    const meanP5 = p5List.length ? p5List.reduce((a, b) => a + b, 0) / p5List.length : 0;
    const pairwiseAcc = totalComparablePairs > 0 ? concordantPairs / totalComparablePairs : 1.0;

    return {
      mean_ndcg_at_5: Math.round(meanNdcg * 10000) / 10000,
      mean_precision_at_5: Math.round(meanP5 * 10000) / 10000,
      pairwise_ranking_accuracy: Math.round(pairwiseAcc * 10000) / 10000,
      concordant_pairs: concordantPairs,
      total_comparable_pairs: totalComparablePairs,
      benchmark_count: benchmarks.length,
      candidate_evaluations: candidateEvals,
    };
  }
}
