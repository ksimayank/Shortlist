import { Job } from './types';

export interface JobExternalLinks {
  googleJobs: string;
  indeed: string;
  linkedin: string;
  glassdoor: string;
  directUrl?: string;
  primary: string;
  primaryLabel: string;
  isDirectLink: boolean;
}

export function getJobSearchUrls(job: Job): JobExternalLinks {
  const query = `${job.title} ${job.company}`;
  const encodedQuery = encodeURIComponent(query);
  const encodedTitle = encodeURIComponent(job.title);
  const encodedLocation = encodeURIComponent(job.location || 'Remote');

  // Google Jobs interactive aggregator (ibp=htl;jobs) opens directly without login or authwall
  const googleJobs = `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} jobs`)}&ibp=htl;jobs`;
  
  // Indeed direct search without login requirement
  const indeed = `https://www.indeed.com/jobs?q=${encodedTitle}+${encodeURIComponent(job.company)}&l=${encodedLocation}`;
  
  // LinkedIn search
  const linkedin = `https://www.linkedin.com/jobs/search/?keywords=${encodedQuery}`;

  // Glassdoor search
  const glassdoor = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodedQuery}`;

  // Check if application_url is a real direct company link (not a generic search url)
  const isDirectLink = Boolean(
    job.application_url &&
    !job.application_url.includes('example.com') &&
    !job.application_url.includes('linkedin.com/jobs/search') &&
    job.application_url.startsWith('http')
  );

  let primary = googleJobs;
  let primaryLabel = 'Search on Google Jobs';

  if (isDirectLink && job.application_url) {
    primary = job.application_url;
    primaryLabel = `Apply on ${job.company} Portal`;
  } else {
    // Default to Google Jobs because it NEVER prompts for login or authwall,
    // whereas LinkedIn search redirects unauthenticated visitors to an authwall
    primary = googleJobs;
    primaryLabel = 'View Live Job on Google Jobs';
  }

  return {
    googleJobs,
    indeed,
    linkedin,
    glassdoor,
    directUrl: isDirectLink ? job.application_url : undefined,
    primary,
    primaryLabel,
    isDirectLink,
  };
}
