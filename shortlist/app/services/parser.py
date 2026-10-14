import os
import re
from typing import Dict, List, Any
from shortlist.app.ranking.ontology import normalize_skill, detect_role_family

COMMON_SKILLS_LEXICON = [
    "figma", "photoshop", "illustrator", "indesign", "typography", "branding", "brand identity",
    "design systems", "ui design", "ux design", "prototyping", "wireframing", "motion graphics",
    "sql", "python", "r", "tableau", "power bi", "excel", "postgresql", "mysql", "snowflake",
    "a/b testing", "statistics", "data modeling", "machine learning", "pandas", "numpy",
    "react", "typescript", "javascript", "node", "express", "html", "css", "docker", "kubernetes",
    "aws", "gcp", "azure", "git", "ci/cd", "rest api", "graphql", "tailwind",
    "logistics", "supply chain", "inventory control", "procurement", "operations management",
    "vendor management", "process improvement", "erp systems", "sap",
    "seo", "sem", "digital marketing", "content strategy", "copywriting", "campaign management",
    "sales", "lead generation", "account management", "crm", "salesforce", "cold calling",
    "customer support", "troubleshooting", "zendesk", "customer success", "client relations"
]

def extract_text_safely(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    if ext == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
    elif ext == ".pdf":
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text() + "\n"
        except ImportError:
            # Fallback text extractor if fitz is not installed
            with open(file_path, "rb") as f:
                content = f.read()
                # Extract ascii/printable strings safely
                text = "".join(chr(b) if 32 <= b <= 126 or b in [10, 13] else " " for b in content)
    elif ext == ".docx":
        try:
            import docx
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        except ImportError:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
    return text.strip()

def parse_resume_to_profile(text: str, filename: str = "") -> Dict[str, Any]:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    name = lines[0] if lines else "Candidate"
    # Basic email extraction
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else "candidate@example.com"

    # Identify skills mentioned
    detected_skills = []
    text_lower = text.lower()
    for s in COMMON_SKILLS_LEXICON:
        if re.search(r'\b' + re.escape(s) + r'\b', text_lower):
            detected_skills.append({
                "name": s.title(),
                "category": "Detected",
                "proficiency": "Proficient",
                "is_current": True,
                "is_learning_interest": False
            })

    # Detect role family and target role
    role_family = detect_role_family(text[:500], text)
    target_role = "Senior Specialist"
    if role_family == "design":
        target_role = "Senior Visual & Brand Designer"
    elif role_family == "data":
        target_role = "Data Analyst"
    elif role_family == "engineering":
        target_role = "Software Engineer"
    elif role_family == "operations":
        target_role = "Operations Manager"

    # Estimate experience years from date patterns
    years = re.findall(r'(19\d\d|20\d\d)', text)
    exp_years = 4
    if len(years) >= 2:
        num_years = [int(y) for y in years if 1990 <= int(y) <= 2026]
        if num_years:
            exp_years = max(1, min(20, max(num_years) - min(num_years)))

    return {
        "name": name[:50],
        "email": email,
        "target_role": target_role,
        "role_family": role_family,
        "experience_years": exp_years,
        "preferred_locations": ["Remote", "Hybrid"],
        "preferred_arrangements": ["remote", "hybrid"],
        "bio": text[:400] + ("..." if len(text) > 400 else ""),
        "skills": detected_skills,
        "work_experiences": [
            {
                "company": "Professional Experience",
                "title": target_role,
                "role_family": role_family,
                "start_date": "2020",
                "end_date": "Present",
                "is_current": True,
                "description": "Extracted from uploaded resume content.",
                "accomplishments": "Demonstrated expertise across core responsibilities and technical workflows."
            }
        ],
        "projects": [],
        "education": [
            {
                "degree": "Bachelor Degree",
                "institution": "University",
                "field_of_study": role_family.title(),
                "graduation_year": 2019
            }
        ]
    }
