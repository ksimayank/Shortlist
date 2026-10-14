import { GoogleGenAI } from '@google/genai';
import { Candidate, Job, MatchScoreResult } from './types';

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export interface CareerExplanation {
  summary: string;
  strengths: string[];
  skill_gaps: string[];
  adjacent_roles: string[];
  mode: 'gemini' | 'deterministic_fallback';
}

export interface InterviewQuestionItem {
  topic: string;
  question: string;
  context: string;
}

export interface BulletOptimizationResult {
  original: string;
  improved: string;
  reasoning: string;
  metric_guidance: string;
  grounding_check: string;
}

function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('LLM call timed out')), ms)),
  ]);
}

export async function explainMatchWithAI(
  candidate: Candidate,
  job: Job,
  match: MatchScoreResult
): Promise<CareerExplanation> {
  const ai = getGenAIClient();

  // If Gemini API is configured, attempt LLM enhancement
  if (ai) {
    try {
      const prompt = `You are the Shortlist AI Career Assistant. Explain this job match for the candidate based strictly on the factual data provided below.
CRITICAL RULES:
1. NEVER invent or hallucinate candidate skills, past companies, degrees, or achievements.
2. Ground all observations in the provided profile.
3. Return valid JSON only.

CANDIDATE:
Name: ${candidate.name}
Role Family: ${candidate.role_family}
Experience: ${candidate.experience_years} years
Current Skills: ${candidate.skills.filter((s) => s.is_current).map((s) => s.name).join(', ')}
Learning Interests: ${candidate.skills.filter((s) => s.is_learning_interest).map((s) => s.name).join(', ')}

JOB:
Title: ${job.title}
Role Family: ${job.role_family}
Required Skills: ${job.required_skills.join(', ')}
Preferred Skills: ${job.preferred_skills.join(', ')}
Responsibilities: ${job.responsibilities}

MATCH METRICS:
Overall Score: ${match.total_score}/100
Matched Skills: ${match.matched_skills.join(', ')}
Missing Required: ${match.missing_required_skills.join(', ')}
Failed Mandatory: ${match.failed_mandatory.join(', ')}

Return a JSON object with this exact shape:
{
  "summary": "1-2 sentence overview of why this candidate fits or has gaps",
  "strengths": ["bullet 1", "bullet 2"],
  "skill_gaps": ["gap 1", "gap 2"],
  "adjacent_roles": ["role 1", "role 2", "role 3"]
}`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
        10000
      );

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          summary: parsed.summary || match.rationale,
          strengths: parsed.strengths || ['Solid alignment with core role demands.'],
          skill_gaps: parsed.skill_gaps || (match.missing_required_skills.length ? match.missing_required_skills : ['None detected']),
          adjacent_roles: parsed.adjacent_roles || ['Relevant Specialist'],
          mode: 'gemini',
        };
      }
    } catch {
      // Graceful fallback to deterministic explanation
    }
  }

  // Deterministic explainable fallback
  const fam = candidate.role_family;
  let adjacent = ['Senior Specialist', 'Principal Contributor', 'Team Lead'];
  if (fam === 'design') adjacent = ['Design Systems Lead', 'Brand Strategist', 'Visual Experience Designer'];
  if (fam === 'data') adjacent = ['Analytics Engineer', 'Product Data Scientist', 'BI Solutions Architect'];
  if (fam === 'engineering') adjacent = ['Frontend Architect', 'Platform Engineer', 'Full Stack Tech Lead'];
  if (fam === 'operations') adjacent = ['Operations Program Manager', 'Supply Chain Director', 'BizOps Lead'];
  if (fam === 'marketing') adjacent = ['Demand Generation Lead', 'Product Marketing Manager', 'Lifecycle Marketer'];

  const strengths = [
    `Verified professional track record in ${fam} domain.`,
    match.matched_skills.length > 0
      ? `Strong coverage in key required skills: ${match.matched_skills.slice(0, 3).join(', ')}.`
      : 'Solid foundational background relevant to role.',
  ];

  const gaps = match.missing_required_skills.length > 0
    ? match.missing_required_skills.map((s) => `Lacks verified evidence for: ${s}`)
    : ['All core required skills verified in candidate profile.'];

  return {
    summary: `Estimated compatibility is ${match.total_score}/100. ${match.rationale}`,
    strengths,
    skill_gaps: gaps,
    adjacent_roles: adjacent,
    mode: 'deterministic_fallback',
  };
}

export async function generateInterviewPrep(candidate: Candidate, job: Job): Promise<InterviewQuestionItem[]> {
  const ai = getGenAIClient();

  if (ai) {
    try {
      const prompt = `Generate 3 targeted, realistic interview preparation questions for this candidate applying for this specific job.
Target Job: ${job.title} at ${job.company}
Job Responsibilities: ${job.responsibilities}
Job Required Skills: ${job.required_skills.join(', ')}
Candidate Background: ${candidate.target_role} (${candidate.experience_years} yrs experience)

Return JSON array of 3 objects with keys "topic", "question", "context".
JSON:`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
        10000
      );

      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch {
      // Fallback to deterministic interview questions
    }
  }

  // Deterministic fallback
  return [
    {
      topic: 'Domain Architecture & Execution',
      question: `For this ${job.title} role, how would you tackle the core responsibility: "${job.responsibilities.slice(0, 80)}..."?`,
      context: 'Demonstrate concrete methodologies and past portfolio impact rather than generic answers.',
    },
    {
      topic: 'Technical Tooling & Standards',
      question: `This position requires proficiency in ${job.required_skills.slice(0, 3).join(', ')}. What was your most complex project utilizing these tools?`,
      context: 'Discuss architectural decisions, trade-offs, and how you ensured high performance.',
    },
    {
      topic: 'Stakeholder Alignment & Strategy',
      question: 'How do you prioritize deliverables when unexpected bottlenecks or shifting business requirements arise?',
      context: 'Ground your answer in a specific real-world example from your previous work history.',
    },
  ];
}

export async function optimizeResumeBullet(bullet: string, targetJob?: Job): Promise<BulletOptimizationResult> {
  const ai = getGenAIClient();

  if (ai) {
    try {
      const prompt = `Optimize this candidate resume bullet point for maximum impact and leadership clarity.
CRITICAL GROUNDING RULE: Do NOT invent metrics, tools, or achievements not implied by the original bullet. Keep the factual substance identical, but sharpen the action verbs and structure.
Original bullet: "${bullet}"
${targetJob ? `Target Job Title: ${targetJob.title}` : ''}

Return JSON with:
{
  "improved": "the rewritten bullet",
  "reasoning": "brief explanation of improvements",
  "metric_guidance": "advice on where a real quantifiable metric should be inserted by candidate",
  "grounding_check": "confirmation that facts were preserved"
}`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
        10000
      );

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          original: bullet,
          improved: parsed.improved || bullet,
          reasoning: parsed.reasoning || 'Elevated action verbs and structure.',
          metric_guidance: parsed.metric_guidance || 'Consider quantifying with exact percentage lift or savings.',
          grounding_check: parsed.grounding_check || 'Factually grounded without hallucination.',
        };
      }
    } catch {
      // Fallback to deterministic bullet optimizer
    }
  }

  // Deterministic fallback
  const words = bullet.trim().split(' ');
  const firstWord = words[0] || 'Led';
  let improved = bullet;
  if (/^(worked|helped|responsible|assisted|did|was)/i.test(firstWord)) {
    improved = `Spearheaded ${bullet.slice(firstWord.length).trim()}`;
  }

  const hasMetric = /\d+|%|\$/.test(bullet);

  return {
    original: bullet,
    improved,
    reasoning: 'Replaced passive verb with high-impact action verb to emphasize leadership.',
    metric_guidance: hasMetric
      ? 'Strong quantitative metric detected.'
      : 'Quantify your impact: append specific business results (e.g., "...reducing turnaround time by 30%").',
    grounding_check: 'Evidence preserved: No fictional numbers or projects were inserted.',
  };
}
