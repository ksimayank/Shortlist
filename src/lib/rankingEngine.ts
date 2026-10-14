import { Candidate, Job, MatchScoreResult, RoleFamily } from './types';
import { ROLE_FAMILIES, detectRoleFamily, normalizeSkill } from './ontology';

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', "aren't",
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
  'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', "let's", 'me', 'more', 'most', 'my', 'myself', 'no',
  'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out',
  'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves', 'work', 'worked', 'working', 'experience',
  'responsible', 'team', 'responsibilities', 'skills', 'ability', 'strong', 'years', 'management'
]);

function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-zA-Z0-9_\+#\.]+/g) || [];
  return matches.filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function computeTermFrequencies(tokens: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of tokens) {
    counts[t] = (counts[t] || 0) + 1;
  }
  const total = tokens.length || 1;
  const tf: Record<string, number> = {};
  for (const [k, v] of Object.entries(counts)) {
    tf[k] = v / total;
  }
  return tf;
}

function cosineSimilarity(vec1: Record<string, number>, vec2: Record<string, number>): number {
  let dot = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (const [k, v] of Object.entries(vec1)) {
    norm1 += v * v;
    if (vec2[k]) {
      dot += v * vec2[k];
    }
  }
  for (const v of Object.values(vec2)) {
    norm2 += v * v;
  }
  if (norm1 === 0 || norm2 === 0) return 0;
  return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

export interface ScoringWeights {
  role_family: number;
  required_skills: number;
  preferred_skills: number;
  experience_overlap: number;
  location_fit: number;
}

export class ShortlistRankingEngine {
  private weights: ScoringWeights;

  constructor(weights?: Partial<ScoringWeights>) {
    this.weights = {
      role_family: 0.35,
      required_skills: 0.30,
      preferred_skills: 0.10,
      experience_overlap: 0.15,
      location_fit: 0.10,
      ...weights,
    };
    this.validateWeights();
  }

  private validateWeights() {
    const total = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (total < 0.99 || total > 1.01) {
      throw new Error(`Scoring weights must sum to 1.0, got ${total}`);
    }
  }

  public evaluateMatch(candidate: Partial<Candidate>, job: Partial<Job>): MatchScoreResult {
    const candExperiences = candidate.work_experiences || [];
    const candTitleText = candExperiences.map((e) => e.title).join(' ');
    const candRoleFamily: RoleFamily = candidate.role_family || detectRoleFamily(candidate.target_role || '', candTitleText);
    const jobRoleFamily: RoleFamily = job.role_family || detectRoleFamily(job.title || '', job.description || '');

    // 1. Role Family Compatibility
    const familyConfig = ROLE_FAMILIES[candRoleFamily] || ROLE_FAMILIES.operations;
    const compatMultiplier = familyConfig.compatibleWith[jobRoleFamily] ?? 0.05;
    const roleFamilyRawScore = 100 * compatMultiplier;
    const isSevereMismatch = compatMultiplier <= 0.15;

    // 2. Skill Distinction (Current vs Learning Interest)
    const skillsList = candidate.skills || [];
    const currentSkills = new Set<string>();
    const learningSkills = new Set<string>();

    for (const s of skillsList) {
      const norm = normalizeSkill(s.name);
      if (s.is_learning_interest && !s.is_current) {
        learningSkills.add(norm);
      } else {
        currentSkills.add(norm);
      }
    }

    const jobReqSkills = (job.required_skills || []).map(normalizeSkill);
    const jobPrefSkills = (job.preferred_skills || []).map(normalizeSkill);

    const matchedSkills: string[] = [];
    const missingReqSkills: string[] = [];
    const missingPrefSkills: string[] = [];

    let reqHits = 0;
    for (const req of jobReqSkills) {
      if (currentSkills.has(req)) {
        reqHits += 1.0;
        matchedSkills.push(req);
      } else if (learningSkills.has(req)) {
        reqHits += 0.2;
        missingReqSkills.push(`${req} (learning interest only)`);
      } else {
        missingReqSkills.push(req);
      }
    }

    let prefHits = 0;
    for (const pref of jobPrefSkills) {
      if (currentSkills.has(pref)) {
        prefHits += 1.0;
        if (!matchedSkills.includes(pref)) matchedSkills.push(pref);
      } else if (learningSkills.has(pref)) {
        prefHits += 0.2;
        missingPrefSkills.push(`${pref} (learning interest only)`);
      } else {
        missingPrefSkills.push(pref);
      }
    }

    const reqScore = jobReqSkills.length ? (reqHits / jobReqSkills.length) * 100 : 100;
    const prefScore = jobPrefSkills.length ? (prefHits / jobPrefSkills.length) * 100 : 100;

    // 3. Experience & Responsibility Semantic Similarity
    const profExpTexts = candExperiences.map((e) => `${e.title} ${e.description} ${e.accomplishments}`);
    const projTexts = (candidate.projects || []).map((p) => `${p.title} ${p.description}`);
    const combinedCandText = `${profExpTexts.join(' ')} ${projTexts.join(' ')}`;
    const jobText = `${job.title || ''} ${job.responsibilities || ''} ${job.description || ''}`;

    const candTf = computeTermFrequencies(tokenize(combinedCandText));
    const jobTf = computeTermFrequencies(tokenize(jobText));
    const textSim = cosineSimilarity(candTf, jobTf);
    const experienceScore = Math.min(100, textSim * 135);

    // Mandatory Qualifications & Experience Check
    const candExpYears = candidate.experience_years || 0;
    const jobMinExp = job.min_years_experience || 0;
    const failedMandatory: string[] = [];

    if (jobMinExp && candExpYears < jobMinExp - 1) {
      failedMandatory.push(`Requires ${jobMinExp}+ years experience (candidate has ${candExpYears})`);
    }

    const educationList = candidate.education || [];
    const hasValidDegree = educationList.some((edu) => {
      const combined = `${edu.degree} ${edu.field_of_study}`.toLowerCase();
      return ['design', 'computer science', 'statistics', 'engineering', 'bachelor', 'bfa', 'b.s.'].some((d) => combined.includes(d));
    });

    for (const mq of job.mandatory_qualifications || []) {
      const mqLower = mq.toLowerCase();
      const normMq = normalizeSkill(mq);
      let isSatisfied = false;

      const expMatch = mqLower.match(/(\d+)\+?\s*years?/);
      const degreeMentioned = ['degree', 'bachelor', 'b.s.', 'bfa', 'master', 'phd'].some((d) => mqLower.includes(d));

      if (currentSkills.has(normMq) || new RegExp(`\\b${mqLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(combinedCandText)) {
        isSatisfied = true;
      } else if (expMatch && degreeMentioned && mqLower.includes(' or ')) {
        const reqYears = parseInt(expMatch[1], 10);
        if (candExpYears >= reqYears || hasValidDegree) isSatisfied = true;
      } else if (expMatch && !degreeMentioned) {
        const reqYears = parseInt(expMatch[1], 10);
        if (candExpYears >= reqYears) isSatisfied = true;
      } else if (degreeMentioned && !expMatch) {
        if (hasValidDegree) isSatisfied = true;
      } else if (mqLower.includes('portfolio') && ((candidate.projects && candidate.projects.length > 0) || candRoleFamily === 'design')) {
        isSatisfied = true;
      }

      if (!isSatisfied) {
        failedMandatory.push(`Missing mandatory qualification: ${mq}`);
      }
    }

    // 4. Location & Work Arrangement Fit
    const prefArrangements = candidate.preferred_arrangements || ['remote', 'hybrid', 'on-site'];
    const jobArrangement = (job.work_arrangement || 'hybrid').toLowerCase() as 'remote' | 'hybrid' | 'on-site';
    const prefLocations = (candidate.preferred_locations || []).map((l) => l.toLowerCase());
    const jobLocation = (job.location || '').toLowerCase();

    const arrangementFit = prefArrangements.includes(jobArrangement) ? 1.0 : 0.5;
    let locationFit = 1.0;
    if (jobArrangement !== 'remote' && prefLocations.length > 0) {
      const matchedLoc = prefLocations.some((ploc) => jobLocation.includes(ploc) || ploc.includes(jobLocation));
      locationFit = matchedLoc ? 1.0 : 0.3;
    }

    const locScore = (arrangementFit * 0.6 + locationFit * 0.4) * 100;

    // Weighted Score
    let baseScore =
      this.weights.role_family * roleFamilyRawScore +
      this.weights.required_skills * reqScore +
      this.weights.preferred_skills * prefScore +
      this.weights.experience_overlap * experienceScore +
      this.weights.location_fit * locScore;

    // Severe mismatch penalty (Anti-superficial keyword overlap defense)
    if (isSevereMismatch) {
      baseScore = Math.min(baseScore * 0.45, 38.0);
    }

    // Mandatory disqualification cap
    if (failedMandatory.length > 0) {
      baseScore = Math.min(baseScore, 45.0);
    }

    const totalScore = Math.max(0, Math.min(100, Math.round(baseScore * 10) / 10));

    // Rationale generation
    const rationaleParts: string[] = [];
    if (isSevereMismatch) {
      rationaleParts.push(`Role family mismatch: candidate background is primarily in ${candRoleFamily} while this job belongs to ${jobRoleFamily}.`);
    } else {
      rationaleParts.push(`Compatible ${candRoleFamily} domain background.`);
    }

    if (reqScore >= 80) {
      rationaleParts.push(`Strong core skill coverage (${matchedSkills.length} required skills verified).`);
    } else if (reqScore < 40) {
      rationaleParts.push(`Noticeable skill gaps (${missingReqSkills.length} required skills unverified).`);
    }

    if (failedMandatory.length > 0) {
      rationaleParts.push(`Does not meet ${failedMandatory.length} mandatory requirement(s).`);
    }

    return {
      job_id: job.id || '',
      total_score: totalScore,
      role_family_score: Math.round(roleFamilyRawScore * 10) / 10,
      required_skill_score: Math.round(reqScore * 10) / 10,
      preferred_skill_score: Math.round(prefScore * 10) / 10,
      experience_score: Math.round(experienceScore * 10) / 10,
      location_score: Math.round(locScore * 10) / 10,
      matched_skills: matchedSkills,
      missing_required_skills: missingReqSkills,
      missing_preferred_skills: missingPrefSkills,
      failed_mandatory: failedMandatory,
      role_family_candidate: candRoleFamily,
      role_family_job: jobRoleFamily,
      rationale: rationaleParts.join(' '),
    };
  }
}
