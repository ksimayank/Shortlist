#!/usr/bin/env python3
import os
import sys
import json
import csv

# Add root directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
sys.path.insert(0, os.path.abspath(os.path.join(root_dir, "..")))

from shortlist.app.models.db import init_db, get_db_connection

def seed_database():
    db_path = os.path.join(root_dir, "data", "shortlist.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    init_db(db_path)

    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    # Seed candidates
    cands_file = os.path.join(root_dir, "data", "sample_candidates.json")
    with open(cands_file, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    for c in candidates:
        cursor.execute("""
            INSERT INTO candidates (id, name, email, target_role, role_family, experience_years, preferred_locations, preferred_arrangements, bio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            c["id"], c["name"], c.get("email"), c.get("target_role"), c.get("role_family"),
            c.get("experience_years", 0), json.dumps(c.get("preferred_locations", [])),
            json.dumps(c.get("preferred_arrangements", [])), c.get("bio")
        ))

        for s in c.get("skills", []):
            cursor.execute("""
                INSERT INTO candidate_skills (candidate_id, skill_name, category, proficiency, is_current, is_learning_interest)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (c["id"], s["name"], s.get("category"), s.get("proficiency"), 1 if s.get("is_current", True) else 0, 1 if s.get("is_learning_interest", False) else 0))

        for exp in c.get("work_experiences", []):
            cursor.execute("""
                INSERT INTO work_experiences (candidate_id, company, title, role_family, start_date, end_date, is_current, description, accomplishments)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (c["id"], exp["company"], exp["title"], exp.get("role_family"), exp.get("start_date"), exp.get("end_date"), 1 if exp.get("is_current") else 0, exp.get("description"), exp.get("accomplishments")))

        for edu in c.get("education", []):
            cursor.execute("""
                INSERT INTO education (candidate_id, degree, institution, field_of_study, graduation_year)
                VALUES (?, ?, ?, ?, ?)
            """, (c["id"], edu["degree"], edu["institution"], edu.get("field_of_study"), edu.get("graduation_year")))

    # Seed jobs
    jobs_file = os.path.join(root_dir, "data", "sample_jobs.csv")
    with open(jobs_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cursor.execute("""
                INSERT INTO jobs (id, title, role_family, company, location, work_arrangement, employment_type, experience_level, min_years_experience, salary_range, description, responsibilities, required_skills, preferred_skills, mandatory_qualifications, application_url, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                row["id"], row["title"], row["role_family"], row["company"], row["location"],
                row["work_arrangement"], row["employment_type"], row["experience_level"],
                int(row.get("min_years_experience", 0) or 0), row["salary_range"],
                row["description"], row["responsibilities"], row["required_skills"],
                row["preferred_skills"], row["mandatory_qualifications"], row["application_url"],
                row.get("source", "direct")
            ))

    conn.commit()
    conn.close()
    print(f"Successfully initialized and seeded database at {db_path} with {len(candidates)} candidates and jobs.")

if __name__ == "__main__":
    seed_database()
