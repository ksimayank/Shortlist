import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "shortlist-dev-secret-key-32890")
    DATABASE_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "shortlist.db"))
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(os.path.dirname(__file__), "..", "uploads"))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "json"}
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    SCORING_WEIGHTS = {
        "role_family": 0.35,
        "required_skills": 0.30,
        "preferred_skills": 0.10,
        "experience_overlap": 0.15,
        "location_fit": 0.10
    }
