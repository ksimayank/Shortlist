import sqlite3
import os
import json
from typing import Dict, List, Any, Optional

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    target_role TEXT,
    role_family TEXT,
    experience_years INTEGER DEFAULT 0,
    preferred_locations TEXT,
    preferred_arrangements TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    category TEXT,
    proficiency TEXT,
    is_current BOOLEAN DEFAULT 1,
    is_learning_interest BOOLEAN DEFAULT 0,
    FOREIGN KEY(candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS work_experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id TEXT NOT NULL,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    role_family TEXT,
    start_date TEXT,
    end_date TEXT,
    is_current BOOLEAN DEFAULT 0,
    description TEXT,
    accomplishments TEXT,
    FOREIGN KEY(candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id TEXT NOT NULL,
    degree TEXT NOT NULL,
    institution TEXT NOT NULL,
    field_of_study TEXT,
    graduation_year INTEGER,
    FOREIGN KEY(candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS candidate_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id TEXT NOT NULL,
    title TEXT NOT NULL,
    role TEXT,
    description TEXT,
    is_professional BOOLEAN DEFAULT 0,
    FOREIGN KEY(candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    role_family TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    work_arrangement TEXT,
    employment_type TEXT,
    experience_level TEXT,
    min_years_experience INTEGER DEFAULT 0,
    salary_range TEXT,
    description TEXT,
    responsibilities TEXT,
    required_skills TEXT,
    preferred_skills TEXT,
    mandatory_qualifications TEXT,
    application_url TEXT,
    source TEXT DEFAULT 'direct',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    total_score REAL NOT NULL,
    role_family_score REAL,
    required_skill_score REAL,
    preferred_skill_score REAL,
    experience_score REAL,
    location_score REAL,
    matched_skills TEXT,
    missing_required_skills TEXT,
    missing_preferred_skills TEXT,
    failed_mandatory TEXT,
    rationale TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE(candidate_id, job_id)
);

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    status TEXT DEFAULT 'shortlisted', -- shortlisted, applied, interview, offer, rejected
    notes TEXT,
    applied_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE(candidate_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_role_family ON jobs(role_family);
CREATE INDEX IF NOT EXISTS idx_matches_cand ON job_matches(candidate_id);
CREATE INDEX IF NOT EXISTS idx_apps_cand ON applications(candidate_id);
"""

def get_db_connection(db_path: str):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db(db_path: str):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = get_db_connection(db_path)
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    conn.close()
