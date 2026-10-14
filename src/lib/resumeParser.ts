import { Candidate, CandidateSkill, RoleFamily } from './types';
import { detectRoleFamily, normalizeSkill } from './ontology';

const COMMON_SKILLS_LEXICON = [
  'figma', 'photoshop', 'illustrator', 'indesign', 'typography', 'branding', 'brand identity',
  'design systems', 'ui design', 'ux design', 'prototyping', 'wireframing', 'motion graphics',
  'sql', 'python', 'r', 'tableau', 'power bi', 'excel', 'postgresql', 'mysql', 'snowflake',
  'a/b testing', 'statistics', 'data modeling', 'machine learning', 'pandas', 'numpy',
  'react', 'typescript', 'javascript', 'node', 'express', 'html', 'css', 'docker', 'kubernetes',
  'aws', 'gcp', 'azure', 'git', 'ci/cd', 'rest api', 'graphql', 'tailwind',
  'logistics', 'supply chain', 'inventory control', 'procurement', 'operations management',
  'vendor management', 'process improvement', 'erp systems', 'sap',
  'seo', 'sem', 'digital marketing', 'content strategy', 'copywriting', 'campaign management',
  'sales', 'lead generation', 'account management', 'crm', 'salesforce', 'cold calling',
  'customer support', 'troubleshooting', 'zendesk', 'customer success', 'client relations'
];

export async function extractTextFromBuffer(buffer: Buffer, originalFilename: string): Promise<string> {
  const ext = originalFilename.split('.').pop()?.toLowerCase();
  
  if (ext === 'txt') {
    return buffer.toString('utf-8');
  }

  if (ext === 'docx') {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (err) {
      console.warn('DOCX extraction fallback:', err);
      return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r]/g, ' ');
    }
  }

  if (ext === 'pdf') {
    try {
      const pdfParseModule: any = await import('pdf-parse');
      // Support pdf-parse v2+ class API
      if (typeof pdfParseModule.PDFParse === 'function') {
        const parser = new pdfParseModule.PDFParse({ data: buffer });
        const result = await parser.getText();
        if (typeof parser.destroy === 'function') {
          try { await parser.destroy(); } catch (_) {}
        }
        if (result && typeof result.text === 'string' && result.text.trim().length > 0) {
          return result.text;
        }
      }
      // Support pdf-parse v1 function API
      if (typeof pdfParseModule.default === 'function') {
        const data = await pdfParseModule.default(buffer);
        if (data && typeof data.text === 'string' && data.text.trim().length > 0) {
          return data.text;
        }
      } else if (typeof pdfParseModule === 'function') {
        const data = await pdfParseModule(buffer);
        if (data && typeof data.text === 'string' && data.text.trim().length > 0) {
          return data.text;
        }
      }
    } catch (err) {
      console.warn('PDF parser module error, using text stream extractor:', err);
    }

    // High-resilience stream fallback: extract text chunks from PDF streams
    try {
      const raw = buffer.toString('latin1');
      // Extract string literals inside parentheses within text blocks (Tj, TJ)
      const textMatches: string[] = [];
      const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
      let match: RegExpExecArray | null;
      while ((match = tjRegex.exec(raw)) !== null) {
        textMatches.push(match[1]);
      }
      if (textMatches.length > 0) {
        return textMatches.join(' ');
      }
      return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r]/g, ' ');
    } catch (_) {
      return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r]/g, ' ');
    }
  }

  return buffer.toString('utf-8');
}

export function parseRawResumeTextToProfile(text: string, filename: string): Candidate {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const rawName = lines.length > 0 ? lines[0] : 'Uploaded Candidate';
  const name = rawName.replace(/[^a-zA-Z\s]/g, '').trim().slice(0, 45) || 'New Candidate';

  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;

  // Detect skills
  const textLower = text.toLowerCase();
  const detectedSkills: CandidateSkill[] = [];
  const seenSkills = new Set<string>();

  for (const skill of COMMON_SKILLS_LEXICON) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(textLower)) {
      const norm = normalizeSkill(skill);
      if (!seenSkills.has(norm)) {
        seenSkills.add(norm);
        detectedSkills.push({
          name: skill.charAt(0).toUpperCase() + skill.slice(1),
          category: 'Extracted Skill',
          proficiency: 'Advanced',
          is_current: true,
          is_learning_interest: false,
        });
      }
    }
  }

  // Detect role family
  const roleFamily = detectRoleFamily(text.slice(0, 600), text);
  let targetRole = 'Senior Specialist';
  if (roleFamily === 'design') targetRole = 'Senior Brand & Product Designer';
  else if (roleFamily === 'data') targetRole = 'Senior Data Analyst';
  else if (roleFamily === 'engineering') targetRole = 'Full Stack Software Engineer';
  else if (roleFamily === 'operations') targetRole = 'Operations Manager';
  else if (roleFamily === 'marketing') targetRole = 'Growth Marketing Manager';
  else if (roleFamily === 'sales') targetRole = 'Account Executive';
  else if (roleFamily === 'customer_support') targetRole = 'Customer Success Lead';

  // Estimate experience years
  const years = text.match(/\b(19\d\d|20\d\d)\b/g);
  let expYears = 4;
  if (years && years.length >= 2) {
    const numYears = years.map((y) => parseInt(y, 10)).filter((y) => y >= 1995 && y <= 2026);
    if (numYears.length > 0) {
      expYears = Math.max(1, Math.min(25, Math.max(...numYears) - Math.min(...numYears)));
    }
  }

  return {
    id: `cand-${Date.now()}`,
    name,
    email,
    target_role: targetRole,
    role_family: roleFamily,
    experience_years: expYears,
    preferred_locations: ['Remote', 'San Francisco, CA', 'New York, NY'],
    preferred_arrangements: ['remote', 'hybrid'],
    bio: text.slice(0, 350) + (text.length > 350 ? '...' : ''),
    skills: detectedSkills,
    work_experiences: [
      {
        company: 'Recent Organization',
        title: targetRole,
        role_family: roleFamily,
        start_date: '2021-01',
        end_date: 'Present',
        is_current: true,
        description: 'Led core functional operations, projects, and cross-team deliverables.',
        accomplishments: 'Consistently exceeded team milestones and enhanced operational throughput.',
      },
    ],
    projects: [
      {
        title: 'Flagship Domain Initiative',
        role: 'Key Contributor',
        description: 'Successfully architected and shipped key deliverables aligned with organizational objectives.',
        is_professional: true,
      },
    ],
    education: [
      {
        degree: 'Bachelor of Science / Arts',
        institution: 'Accredited University',
        field_of_study: roleFamily.charAt(0).toUpperCase() + roleFamily.slice(1),
        graduation_year: 2019,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
