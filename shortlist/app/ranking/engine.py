import math
import re
from typing import Dict, List, Any, Optional, Tuple
from shortlist.app.ranking.ontology import ROLE_FAMILIES, normalize_skill, detect_role_family

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can",
    "cannot", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further",
    "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
    "i", "if", "in", "into", "is", "it", "its", "itself", "let's", "me", "more", "most", "my", "myself", "no",
    "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs",
    "them", "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
    "with", "would", "you", "your", "yours", "yourself", "yourselves", "work", "worked", "working", "experience",
    "responsible", "team", "responsibilities", "skills", "ability", "strong", "years", "management", "management"
}

def tokenize(text: str) -> List[str]:
    tokens = re.findall(r'[a-zA-Z0-9_\+#\.]+', text.lower())
    return [t for t in tokens if len(t) > 1 and t not in STOPWORDS]

def compute_term_frequencies(tokens: List[str]) -> Dict[str, float]:
    counts = {}
    for t in tokens:
        counts[t] = counts.get(t, 0) + 1
    total = len(tokens) or 1
    return {k: v / total for k, v in counts.items()}

def cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    intersection = set(vec1.keys()) & set(vec2.keys())
    dot = sum(vec1[t] * vec2[t] for t in intersection)
    norm1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
    norm2 = math.sqrt(sum(v ** 2 for v in vec2.values()))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)

class MatchScoreResult:
    def __init__(
        self,
        job_id: str,
        total_score: float,
        role_family_score: float,
        required_skill_score: float,
        preferred_skill_score: float,
        experience_score: float,
        location_score: float,
        matched_skills: List[str],
        missing_required_skills: List[str],
        missing_preferred_skills: List[str],
        failed_mandatory: List[str],
        role_family_candidate: str,
        role_family_job: str,
        rationale: str
    ):
        self.job_id = job_id
        self.total_score = round(total_score, 1)
        self.role_family_score = round(role_family_score, 1)
        self.required_skill_score = round(required_skill_score, 1)
        self.preferred_skill_score = round(preferred_skill_score, 1)
        self.experience_score = round(experience_score, 1)
        self.location_score = round(location_score, 1)
        self.matched_skills = matched_skills
        self.missing_required_skills = missing_required_skills
        self.missing_preferred_skills = missing_preferred_skills
        self.failed_mandatory = failed_mandatory
        self.role_family_candidate = role_family_candidate
        self.role_family_job = role_family_job
        self.rationale = rationale

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "total_score": self.total_score,
            "role_family_score": self.role_family_score,
            "required_skill_score": self.required_skill_score,
            "preferred_skill_score": self.preferred_skill_score,
            "experience_score": self.experience_score,
            "location_score": self.location_score,
            "matched_skills": self.matched_skills,
            "missing_required_skills": self.missing_required_skills,
            "missing_preferred_skills": self.missing_preferred_skills,
            "failed_mandatory": self.failed_mandatory,
            "role_family_candidate": self.role_family_candidate,
            "role_family_job": self.role_family_job,
            "rationale": self.rationale
        }

class ShortlistRankingEngine:
    def __init__(self, weights: Optional[Dict[str, float]] = None):
        # Default validated scoring weights (sum = 1.0)
        self.weights = weights or {
            "role_family": 0.35,
            "required_skills": 0.30,
            "preferred_skills": 0.10,
            "experience_overlap": 0.15,
            "location_fit": 0.10
        }
        self._validate_weights()

    def _validate_weights(self):
        total = sum(self.weights.values())
        if not (0.99 <= total <= 1.01):
            raise ValueError(f"Scoring weights must sum to 1.0, got {total}")
        for k, v in self.weights.items():
            if v < 0 or v > 1:
                raise ValueError(f"Weight '{k}' must be between 0 and 1, got {v}")

    def evaluate_match(self, candidate: Dict[str, Any], job: Dict[str, Any]) -> MatchScoreResult:
        cand_role_family = candidate.get("role_family") or detect_role_family(
            candidate.get("target_role", ""),
            " ".join([exp.get("title", "") for exp in candidate.get("work_experiences", [])])
        )
        job_role_family = job.get("role_family") or detect_role_family(
            job.get("title", ""),
            job.get("description", "")
        )

        # 1. Role Family Compatibility & Penalty
        family_config = ROLE_FAMILIES.get(cand_role_family, {})
        compat_map = family_config.get("compatible_with", {})
        compat_multiplier = compat_map.get(job_role_family, 0.1)
        role_family_raw_score = 100.0 * compat_multiplier

        # Severe penalty if candidate is e.g. graphic designer applying for operations
        is_severe_mismatch = compat_multiplier <= 0.15

        # 2. Skill Distinction (Current vs Learning Interest)
        candidate_skills = candidate.get("skills", [])
        current_skills = set()
        learning_skills = set()

        for s in candidate_skills:
            norm = normalize_skill(s.get("name", "") if isinstance(s, dict) else str(s))
            if isinstance(s, dict) and s.get("is_learning_interest", False) and not s.get("is_current", True):
                learning_skills.add(norm)
            else:
                current_skills.add(norm)

        job_req_skills = [normalize_skill(s) for s in job.get("required_skills", [])]
        job_pref_skills = [normalize_skill(s) for s in job.get("preferred_skills", [])]

        matched_skills = []
        missing_req_skills = []
        missing_pref_skills = []

        req_hits = 0.0
        for req in job_req_skills:
            if req in current_skills:
                req_hits += 1.0
                matched_skills.append(req)
            elif req in learning_skills:
                # Learning interest gives only 0.2 partial exploratory credit and is NOT a verified skill
                req_hits += 0.2
                missing_req_skills.append(f"{req} (learning interest only)")
            else:
                missing_req_skills.append(req)

        pref_hits = 0.0
        for pref in job_pref_skills:
            if pref in current_skills:
                pref_hits += 1.0
                if pref not in matched_skills:
                    matched_skills.append(pref)
            elif pref in learning_skills:
                pref_hits += 0.2
                missing_pref_skills.append(f"{pref} (learning interest only)")
            else:
                missing_pref_skills.append(pref)

        req_score = (req_hits / len(job_req_skills) * 100.0) if job_req_skills else 100.0
        pref_score = (pref_hits / len(job_pref_skills) * 100.0) if job_pref_skills else 100.0

        # 3. Experience and Responsibility Text Similarity
        # Distinguish actual professional work experience vs personal projects
        prof_exp_texts = []
        for exp in candidate.get("work_experiences", []):
            prof_exp_texts.append(f"{exp.get('title', '')} {exp.get('description', '')} {exp.get('accomplishments', '')}")

        # Personal projects get lower weight in semantic overlap
        proj_texts = []
        for proj in candidate.get("projects", []):
            factor = 1.0 if proj.get("is_professional", False) else 0.4
            proj_texts.append(f"{proj.get('title', '')} {proj.get('description', '')}")

        combined_cand_text = " ".join(prof_exp_texts) + " " + " ".join(proj_texts)
        job_text = f"{job.get('title', '')} {job.get('responsibilities', '')} {job.get('description', '')}"

        cand_tf = compute_term_frequencies(tokenize(combined_cand_text))
        job_tf = compute_term_frequencies(tokenize(job_text))
        text_sim = cosine_similarity(cand_tf, job_tf)
        experience_score = min(100.0, text_sim * 135.0)  # scale cosine sim to 0-100 curve

        # Experience years check
        cand_exp_years = candidate.get("experience_years", 0)
        job_min_exp = job.get("min_years_experience", 0)
        failed_mandatory = []
        if job_min_exp and cand_exp_years < (job_min_exp - 1):
            failed_mandatory.append(f"Requires {job_min_exp}+ years experience (candidate has {cand_exp_years})")

        # Mandatory qualifications check
        for mq in job.get("mandatory_qualifications", []):
            mq_lower = mq.lower()
            norm_mq = normalize_skill(mq)

            # Check if this is an experience year requirement (e.g. "5+ years", "3+ years")
            exp_match = re.search(r'(\d+)\+?\s*years?', mq_lower)
            degree_mentioned = any(deg in mq_lower for deg in ["degree", "bachelor", "b.s.", "bfa", "master", "phd"])
            has_valid_degree = any(
                any(d in edu.get("degree", "").lower() or d in edu.get("field_of_study", "").lower() for d in ["design", "computer science", "statistics", "engineering", "bachelor", "bfa", "b.s."])
                for edu in candidate.get("education", [])
            )

            is_satisfied = False
            # Check skill or text mention directly
            if norm_mq in current_skills or re.search(r'\b' + re.escape(mq_lower) + r'\b', combined_cand_text.lower()):
                is_satisfied = True
            elif exp_match and degree_mentioned and " or " in mq_lower:
                req_years = int(exp_match.group(1))
                if cand_exp_years >= req_years or has_valid_degree:
                    is_satisfied = True
            elif exp_match and not degree_mentioned:
                req_years = int(exp_match.group(1))
                if cand_exp_years >= req_years:
                    is_satisfied = True
            elif degree_mentioned and not exp_match:
                if has_valid_degree:
                    is_satisfied = True
            elif "portfolio" in mq_lower and (candidate.get("projects") or cand_role_family == "design"):
                is_satisfied = True

            if not is_satisfied:
                failed_mandatory.append(f"Missing mandatory qualification: {mq}")

        # 4. Location & Arrangement Fit
        pref_arrangements = candidate.get("preferred_arrangements", ["remote", "hybrid", "on-site"])
        job_arrangement = (job.get("work_arrangement") or "hybrid").lower()
        pref_locations = [loc.lower() for loc in candidate.get("preferred_locations", [])]
        job_location = (job.get("location") or "").lower()

        arrangement_fit = 1.0 if job_arrangement in pref_arrangements else 0.5
        location_fit = 1.0
        if job_arrangement != "remote" and pref_locations:
            matched_loc = any(ploc in job_location or job_location in ploc for ploc in pref_locations)
            location_fit = 1.0 if matched_loc else 0.3

        loc_score = (arrangement_fit * 0.6 + location_fit * 0.4) * 100.0

        # Weighted Sum
        base_score = (
            self.weights["role_family"] * role_family_raw_score +
            self.weights["required_skills"] * req_score +
            self.weights["preferred_skills"] * pref_score +
            self.weights["experience_overlap"] * experience_score +
            self.weights["location_fit"] * loc_score
        )

        # Strict Penalty if role families are completely mismatched
        # (A graphic designer will NEVER rank high for Operations Manager)
        if is_severe_mismatch:
            base_score = min(base_score * 0.45, 38.0)

        # Cap if mandatory qualification failed
        if failed_mandatory:
            base_score = min(base_score, 45.0)

        total_score = max(0.0, min(100.0, base_score))

        # Generate human-readable rationale
        rationale_parts = []
        if is_severe_mismatch:
            rationale_parts.append(f"Role mismatch: {cand_role_family.title()} profile vs {job_role_family.title()} role.")
        else:
            rationale_parts.append(f"Compatible {cand_role_family.title()} background.")

        if req_score >= 80:
            rationale_parts.append(f"Strong required skills match ({len(matched_skills)} skills verified).")
        elif req_score < 40:
            rationale_parts.append(f"Significant skill gaps ({len(missing_req_skills)} required skills missing).")

        if failed_mandatory:
            rationale_parts.append(f"Does not meet {len(failed_mandatory)} mandatory criteria.")

        rationale = " ".join(rationale_parts)

        return MatchScoreResult(
            job_id=str(job.get("id", "")),
            total_score=total_score,
            role_family_score=role_family_raw_score,
            required_skill_score=req_score,
            preferred_skill_score=pref_score,
            experience_score=experience_score,
            location_score=loc_score,
            matched_skills=matched_skills,
            missing_required_skills=missing_req_skills,
            missing_preferred_skills=missing_pref_skills,
            failed_mandatory=failed_mandatory,
            role_family_candidate=cand_role_family,
            role_family_job=job_role_family,
            rationale=rationale
        )
