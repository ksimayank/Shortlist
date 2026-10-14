import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppStorage } from './src/lib/storage.ts';
import { ShortlistRankingEngine } from './src/lib/rankingEngine.ts';
import { extractTextFromBuffer, parseRawResumeTextToProfile } from './src/lib/resumeParser.ts';
import { explainMatchWithAI, generateInterviewPrep, optimizeResumeBullet } from './src/lib/gemini.ts';
import { Candidate, Job } from './src/lib/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB limit
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx', '.txt', '.json'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload PDF, DOCX, TXT, or JSON.'));
    }
  },
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const storage = AppStorage.getInstance();
  const rankingEngine = new ShortlistRankingEngine();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', product: 'Shortlist AI Job Matching Platform' });
  });

  // Candidate APIs
  app.get('/api/candidates', (_req, res) => {
    res.json(storage.getCandidates());
  });

  app.get('/api/candidates/:id', (req, res) => {
    const cand = storage.getCandidateById(req.params.id);
    if (!cand) return res.status(404).json({ error: 'Candidate not found' });
    res.json(cand);
  });

  app.post('/api/candidates', (req, res) => {
    try {
      const candidateData: Candidate = req.body;
      if (!candidateData.id) {
        candidateData.id = `cand-${Date.now()}`;
      }
      const saved = storage.saveCandidate(candidateData);
      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/candidates/:id', (req, res) => {
    const success = storage.deleteCandidate(req.params.id);
    res.json({ success });
  });

  // Resume Upload Route
  app.post('/api/candidates/upload', upload.single('resume'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please attach a PDF, DOCX, TXT, or JSON file.' });
      }

      const originalName = req.file.originalname;
      const ext = path.extname(originalName).toLowerCase();

      let candidateProfile: Candidate;

      if (ext === '.json') {
        const text = req.file.buffer.toString('utf-8');
        candidateProfile = JSON.parse(text);
        if (!candidateProfile.id) candidateProfile.id = `cand-${Date.now()}`;
      } else {
        const rawText = await extractTextFromBuffer(req.file.buffer, originalName);
        if (!rawText || rawText.trim().length < 20) {
          return res.status(400).json({ error: 'Uploaded document appears empty or unreadable.' });
        }
        candidateProfile = parseRawResumeTextToProfile(rawText, originalName);
      }

      storage.saveCandidate(candidateProfile);
      res.json({ success: true, candidate: candidateProfile });
    } catch (err: any) {
      console.error('Error handling resume upload:', err);
      res.status(500).json({ error: `Resume extraction failed: ${err.message}` });
    }
  });

  // Job APIs
  app.get('/api/jobs', (_req, res) => {
    res.json(storage.getJobs());
  });

  app.post('/api/jobs', (req, res) => {
    try {
      const jobData: Job = req.body;
      if (!jobData.id) {
        jobData.id = `job-${Date.now()}`;
      }
      const saved = storage.saveJob(jobData);
      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/jobs/bulk-csv', (req, res) => {
    try {
      const { csvText } = req.body;
      if (!csvText || typeof csvText !== 'string') {
        return res.status(400).json({ error: 'csvText is required in request body.' });
      }

      const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
      let importedCount = 0;

      for (let i = 1; i < lines.length; i++) {
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

        if (matches.length >= 4) {
          const job: Job = {
            id: matches[0] || `job-${Date.now()}-${i}`,
            title: matches[1] || 'Untitled Role',
            role_family: (matches[2] || 'operations') as any,
            company: matches[3] || 'Company',
            location: matches[4] || 'Remote',
            work_arrangement: (matches[5] || 'remote') as any,
            employment_type: (matches[6] || 'full-time') as any,
            experience_level: matches[7] || 'Mid',
            min_years_experience: parseInt(matches[8], 10) || 0,
            salary_range: matches[9] || 'Competitive',
            description: matches[10] || '',
            responsibilities: matches[11] || '',
            required_skills: (matches[12] || '').split(',').map((s) => s.trim()).filter(Boolean),
            preferred_skills: (matches[13] || '').split(',').map((s) => s.trim()).filter(Boolean),
            mandatory_qualifications: (matches[14] || '').split(';').map((s) => s.trim()).filter(Boolean),
            application_url: matches[15] || 'https://example.com',
            source: 'job_board',
            created_at: new Date().toISOString(),
          };
          storage.saveJob(job);
          importedCount++;
        }
      }

      res.json({ success: true, count: importedCount });
    } catch (err: any) {
      res.status(500).json({ error: `CSV import failed: ${err.message}` });
    }
  });

  // Matching Engine API
  app.get('/api/match/:candidateId', (req, res) => {
    const candidate = storage.getCandidateById(req.params.candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const jobs = storage.getJobs();
    const matches = jobs.map((job) => {
      const matchResult = rankingEngine.evaluateMatch(candidate, job);
      return {
        job,
        match: matchResult,
      };
    });

    matches.sort((a, b) => b.match.total_score - a.match.total_score);
    res.json(matches);
  });

  // Application Tracking APIs
  app.get('/api/applications', (req, res) => {
    const candidateId = req.query.candidate_id as string | undefined;
    res.json(storage.getApplications(candidateId));
  });

  app.post('/api/applications', (req, res) => {
    const appData = req.body;
    const saved = storage.saveApplication(appData);
    res.json(saved);
  });

  app.delete('/api/applications/:id', (req, res) => {
    const success = storage.deleteApplication(req.params.id);
    res.json({ success });
  });

  app.get('/api/applications/export-csv', (req, res) => {
    const candidateId = req.query.candidate_id as string | undefined;
    const apps = storage.getApplications(candidateId);
    const jobs = storage.getJobs();
    const jobMap = new Map(jobs.map((j) => [j.id, j]));

    const header = 'Application ID,Candidate ID,Job ID,Job Title,Company,Location,Status,Notes,Applied Date\n';
    const rows = apps.map((a) => {
      const j = jobMap.get(a.job_id);
      return [
        a.id,
        a.candidate_id,
        a.job_id,
        `"${(j?.title || '').replace(/"/g, '""')}"`,
        `"${(j?.company || '').replace(/"/g, '""')}"`,
        `"${(j?.location || '').replace(/"/g, '""')}"`,
        a.status,
        `"${(a.notes || '').replace(/"/g, '""')}"`,
        a.applied_at || '',
      ].join(',');
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="shortlist_applications.csv"');
    res.send(header + rows.join('\n'));
  });

  // AI Career Assistant APIs
  app.post('/api/assistant/explain', async (req, res) => {
    try {
      const { candidate_id, job_id } = req.body;
      const candidate = storage.getCandidateById(candidate_id);
      const job = storage.getJobById(job_id);
      if (!candidate || !job) {
        return res.status(404).json({ error: 'Candidate or Job not found.' });
      }

      const match = rankingEngine.evaluateMatch(candidate, job);
      const explanation = await explainMatchWithAI(candidate, job, match);
      res.json(explanation);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/assistant/interview-prep', async (req, res) => {
    try {
      const { candidate_id, job_id } = req.body;
      const candidate = storage.getCandidateById(candidate_id);
      const job = storage.getJobById(job_id);
      if (!candidate || !job) {
        return res.status(404).json({ error: 'Candidate or Job not found.' });
      }

      const questions = await generateInterviewPrep(candidate, job);
      res.json(questions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/assistant/resume-optimize', async (req, res) => {
    try {
      const { bullet, job_id } = req.body;
      if (!bullet) return res.status(400).json({ error: 'bullet is required' });
      const job = job_id ? storage.getJobById(job_id) : undefined;
      const result = await optimizeResumeBullet(bullet, job);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Benchmark Evaluation API
  app.get('/api/evaluation/run', (_req, res) => {
    const report = storage.runEvaluation();
    res.json(report);
  });

  // Reset to Pristine Seed Data
  app.post('/api/seed/reset', (_req, res) => {
    const seeded = storage.initializeWithSeed();
    res.json({ success: true, candidatesCount: seeded.candidates.length, jobsCount: seeded.jobs.length });
  });

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shortlist platform listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
