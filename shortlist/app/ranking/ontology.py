import os
import json
import csv
import math
import re
from typing import Dict, List, Any, Optional, Tuple

# Role Families and their hierarchy/synonyms
ROLE_FAMILIES = {
    "design": {
        "title": "Design & Creative",
        "keywords": ["designer", "ui", "ux", "graphic", "visual", "brand", "product design", "illustrator", "art director", "creative", "typography", "figma", "photoshop", "illustrator", "indesign"],
        "compatible_with": {"design": 1.0, "marketing": 0.4, "engineering": 0.2, "product": 0.5, "operations": 0.05, "sales": 0.05, "data": 0.05, "customer_support": 0.05}
    },
    "engineering": {
        "title": "Software Engineering & Tech",
        "keywords": ["engineer", "developer", "programmer", "software", "frontend", "backend", "full stack", "devops", "cloud", "react", "python", "typescript", "node", "java", "golang"],
        "compatible_with": {"engineering": 1.0, "data": 0.45, "product": 0.4, "design": 0.2, "operations": 0.1, "sales": 0.05, "marketing": 0.1, "customer_support": 0.1}
    },
    "data": {
        "title": "Data & Analytics",
        "keywords": ["analyst", "data", "analytics", "business intelligence", "sql", "tableau", "power bi", "data scientist", "data engineer", "machine learning", "statistics"],
        "compatible_with": {"data": 1.0, "engineering": 0.45, "operations": 0.35, "product": 0.35, "marketing": 0.3, "sales": 0.2, "design": 0.05, "customer_support": 0.1}
    },
    "operations": {
        "title": "Operations & Logistics",
        "keywords": ["operations", "logistics", "supply chain", "coordinator", "office manager", "procurement", "inventory", "facilities", "business operations", "bizops", "process improvement"],
        "compatible_with": {"operations": 1.0, "customer_support": 0.4, "data": 0.3, "sales": 0.3, "marketing": 0.25, "engineering": 0.1, "design": 0.05}
    },
    "marketing": {
        "title": "Marketing & Growth",
        "keywords": ["marketing", "growth", "seo", "sem", "content", "copywriter", "social media", "brand manager", "campaign", "digital marketing"],
        "compatible_with": {"marketing": 1.0, "design": 0.4, "sales": 0.4, "data": 0.3, "product": 0.3, "operations": 0.2, "engineering": 0.1, "customer_support": 0.2}
    },
    "sales": {
        "title": "Sales & Business Development",
        "keywords": ["sales", "account executive", "sdr", "bdr", "business development", "account manager", "closing", "quota", "lead generation"],
        "compatible_with": {"sales": 1.0, "customer_support": 0.45, "marketing": 0.4, "operations": 0.3, "data": 0.2, "engineering": 0.05, "design": 0.05}
    },
    "customer_support": {
        "title": "Customer Support & Success",
        "keywords": ["support", "customer service", "client success", "customer success", "help desk", "zendesk", "technical support", "troubleshooting"],
        "compatible_with": {"customer_support": 1.0, "sales": 0.45, "operations": 0.4, "marketing": 0.2, "data": 0.15, "engineering": 0.1, "design": 0.05}
    }
}

# Skill Normalization Map
SKILL_NORMALIZATION = {
    "react.js": "react",
    "reactjs": "react",
    "node.js": "node",
    "nodejs": "node",
    "ts": "typescript",
    "js": "javascript",
    "figma design": "figma",
    "adobe photoshop": "photoshop",
    "adobe illustrator": "illustrator",
    "adobe indesign": "indesign",
    "ui/ux": "ui design",
    "ui / ux": "ui design",
    "user experience": "ux design",
    "user interface": "ui design",
    "postgres": "postgresql",
    "py": "python",
    "powerbi": "power bi",
    "aws cloud": "aws",
    "amazon web services": "aws",
    "gcp": "google cloud",
    "docker containers": "docker",
    "k8s": "kubernetes"
}

def normalize_skill(skill: str) -> str:
    s = skill.strip().lower()
    return SKILL_NORMALIZATION.get(s, s)

def detect_role_family(title: str, text: str = "") -> str:
    combined = (title + " " + text).lower()
    scores = {}
    for fam, data in ROLE_FAMILIES.items():
        score = 0
        for kw in data["keywords"]:
            if re.search(r'\b' + re.escape(kw) + r'\b', combined):
                score += (3 if kw in title.lower() else 1)
        scores[fam] = score
    best_family = max(scores, key=scores.get)
    return best_family if scores[best_family] > 0 else "operations"
