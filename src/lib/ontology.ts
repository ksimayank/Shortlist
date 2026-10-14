import { RoleFamily } from './types';

export interface RoleFamilyConfig {
  title: string;
  keywords: string[];
  compatibleWith: Record<RoleFamily, number>;
}

export const ROLE_FAMILIES: Record<RoleFamily, RoleFamilyConfig> = {
  design: {
    title: 'Design & Creative',
    keywords: ['designer', 'ui', 'ux', 'graphic', 'visual', 'brand', 'product design', 'illustrator', 'art director', 'creative', 'typography', 'figma', 'photoshop', 'illustrator', 'indesign'],
    compatibleWith: {
      design: 1.0,
      marketing: 0.4,
      engineering: 0.2,
      operations: 0.05,
      sales: 0.05,
      data: 0.05,
      customer_support: 0.05,
    },
  },
  engineering: {
    title: 'Software Engineering & Tech',
    keywords: ['engineer', 'developer', 'programmer', 'software', 'frontend', 'backend', 'full stack', 'devops', 'cloud', 'react', 'python', 'typescript', 'node', 'java', 'golang'],
    compatibleWith: {
      engineering: 1.0,
      data: 0.45,
      design: 0.2,
      operations: 0.1,
      sales: 0.05,
      marketing: 0.1,
      customer_support: 0.1,
    },
  },
  data: {
    title: 'Data & Analytics',
    keywords: ['analyst', 'data', 'analytics', 'business intelligence', 'sql', 'tableau', 'power bi', 'data scientist', 'data engineer', 'machine learning', 'statistics'],
    compatibleWith: {
      data: 1.0,
      engineering: 0.45,
      operations: 0.35,
      marketing: 0.3,
      sales: 0.2,
      design: 0.05,
      customer_support: 0.1,
    },
  },
  operations: {
    title: 'Operations & Logistics',
    keywords: ['operations', 'logistics', 'supply chain', 'coordinator', 'office manager', 'procurement', 'inventory', 'facilities', 'business operations', 'bizops', 'process improvement'],
    compatibleWith: {
      operations: 1.0,
      customer_support: 0.4,
      data: 0.3,
      sales: 0.3,
      marketing: 0.25,
      engineering: 0.1,
      design: 0.05,
    },
  },
  marketing: {
    title: 'Marketing & Growth',
    keywords: ['marketing', 'growth', 'seo', 'sem', 'content', 'copywriter', 'social media', 'brand manager', 'campaign', 'digital marketing'],
    compatibleWith: {
      marketing: 1.0,
      design: 0.4,
      sales: 0.4,
      data: 0.3,
      operations: 0.2,
      engineering: 0.1,
      customer_support: 0.2,
    },
  },
  sales: {
    title: 'Sales & Business Development',
    keywords: ['sales', 'account executive', 'sdr', 'bdr', 'business development', 'account manager', 'closing', 'quota', 'lead generation'],
    compatibleWith: {
      sales: 1.0,
      customer_support: 0.45,
      marketing: 0.4,
      operations: 0.3,
      data: 0.2,
      engineering: 0.05,
      design: 0.05,
    },
  },
  customer_support: {
    title: 'Customer Support & Success',
    keywords: ['support', 'customer service', 'client success', 'customer success', 'help desk', 'zendesk', 'technical support', 'troubleshooting'],
    compatibleWith: {
      customer_support: 1.0,
      sales: 0.45,
      operations: 0.4,
      marketing: 0.2,
      data: 0.15,
      engineering: 0.1,
      design: 0.05,
    },
  },
};

export const SKILL_NORMALIZATION: Record<string, string> = {
  'react.js': 'react',
  'reactjs': 'react',
  'node.js': 'node',
  'nodejs': 'node',
  'ts': 'typescript',
  'js': 'javascript',
  'figma design': 'figma',
  'adobe photoshop': 'photoshop',
  'adobe illustrator': 'illustrator',
  'adobe indesign': 'indesign',
  'ui/ux': 'ui design',
  'ui / ux': 'ui design',
  'user experience': 'ux design',
  'user interface': 'ui design',
  'postgres': 'postgresql',
  'py': 'python',
  'powerbi': 'power bi',
  'aws cloud': 'aws',
  'amazon web services': 'aws',
  'gcp': 'google cloud',
  'docker containers': 'docker',
  'k8s': 'kubernetes',
};

export function normalizeSkill(skill: string): string {
  const s = skill.trim().toLowerCase();
  return SKILL_NORMALIZATION[s] || s;
}

export function detectRoleFamily(title: string, text: string = ''): RoleFamily {
  const combined = (title + ' ' + text).toLowerCase();
  const scores: Record<RoleFamily, number> = {
    design: 0,
    engineering: 0,
    data: 0,
    operations: 0,
    marketing: 0,
    sales: 0,
    customer_support: 0,
  };

  (Object.keys(ROLE_FAMILIES) as RoleFamily[]).forEach((fam) => {
    ROLE_FAMILIES[fam].keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(combined)) {
        scores[fam] += title.toLowerCase().includes(kw) ? 3 : 1;
      }
    });
  });

  let bestFamily: RoleFamily = 'operations';
  let bestScore = -1;
  (Object.keys(scores) as RoleFamily[]).forEach((fam) => {
    if (scores[fam] > bestScore) {
      bestScore = scores[fam];
      bestFamily = fam;
    }
  });

  return bestScore > 0 ? bestFamily : 'operations';
}
