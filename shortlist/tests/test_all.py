import unittest
import os
import sys

# Add root directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
sys.path.insert(0, os.path.abspath(os.path.join(root_dir, "..")))

from shortlist.app.ranking.engine import ShortlistRankingEngine
from shortlist.app.ranking.ontology import normalize_skill, detect_role_family

class TestShortlistRankingEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ShortlistRankingEngine()

        self.graphic_designer = {
            "id": "test-cand-designer",
            "name": "Alex Miller",
            "target_role": "Senior Graphic Designer",
            "role_family": "design",
            "experience_years": 5,
            "skills": [
                {"name": "Figma", "is_current": True, "is_learning_interest": False},
                {"name": "Adobe Photoshop", "is_current": True, "is_learning_interest": False},
                {"name": "Adobe Illustrator", "is_current": True, "is_learning_interest": False},
                {"name": "Typography", "is_current": True, "is_learning_interest": False},
                {"name": "Python", "is_current": False, "is_learning_interest": True}
            ],
            "work_experiences": [
                {
                    "title": "Lead Graphic Designer",
                    "role_family": "design",
                    "description": "Led creative brand assets, marketing campaigns, layout design, visual typography.",
                    "accomplishments": "Managed agency team of 4 designers and delivered 50+ corporate identity packages."
                }
            ],
            "projects": [],
            "preferred_locations": ["San Francisco CA"],
            "preferred_arrangements": ["remote"]
        }

        self.data_analyst = {
            "id": "test-cand-analyst",
            "name": "Sarah Chen",
            "target_role": "Data Analyst",
            "role_family": "data",
            "experience_years": 4,
            "skills": [
                {"name": "SQL", "is_current": True, "is_learning_interest": False},
                {"name": "Tableau", "is_current": True, "is_learning_interest": False},
                {"name": "Python", "is_current": True, "is_learning_interest": False},
                {"name": "Analytics", "is_current": True, "is_learning_interest": False}
            ],
            "work_experiences": [
                {
                    "title": "Data Analyst",
                    "role_family": "data",
                    "description": "Constructed SQL queries, built Tableau executive reporting dashboards, tracked user retention KPIs.",
                    "accomplishments": "Optimized database analytics pipeline."
                }
            ],
            "projects": [],
            "preferred_locations": ["New York NY"],
            "preferred_arrangements": ["remote"]
        }

        self.design_job = {
            "id": "job-design-01",
            "title": "Senior Brand & Visual Designer",
            "role_family": "design",
            "required_skills": ["Figma", "Adobe Photoshop", "Adobe Illustrator", "Typography"],
            "preferred_skills": ["Design Systems"],
            "description": "Lead visual branding and typography for digital products.",
            "responsibilities": "Create brand guidelines, typography systems, vector illustrations.",
            "min_years_experience": 4,
            "mandatory_qualifications": [],
            "work_arrangement": "remote"
        }

        self.operations_job = {
            "id": "job-ops-01",
            "title": "Operations Manager",
            "role_family": "operations",
            "required_skills": ["Logistics", "Supply Chain", "Vendor Management", "Operations Management"],
            "preferred_skills": ["ERP Systems", "Process Improvement"],
            "description": "Oversee warehouse logistics, supply chain routing, vendor management.",
            "responsibilities": "Lead operational team, coordinate warehouse supply chain schedules, manage vendors.",
            "min_years_experience": 4,
            "mandatory_qualifications": ["5+ years logistics and warehouse operations management required"],
            "work_arrangement": "on-site"
        }

        self.data_job = {
            "id": "job-data-01",
            "title": "Senior Data Analyst",
            "role_family": "data",
            "required_skills": ["SQL", "Tableau", "Python", "Analytics"],
            "preferred_skills": ["PostgreSQL"],
            "description": "Drive business intelligence and automated SQL reporting.",
            "responsibilities": "Write SQL queries, build executive Tableau dashboards, perform statistical cohort analysis.",
            "min_years_experience": 3,
            "mandatory_qualifications": [],
            "work_arrangement": "remote"
        }

    def test_graphic_designer_prioritizes_design_over_operations(self):
        """Test that graphic designer ranks design job significantly higher than operations job."""
        match_design = self.engine.evaluate_match(self.graphic_designer, self.design_job)
        match_ops = self.engine.evaluate_match(self.graphic_designer, self.operations_job)

        self.assertGreater(match_design.total_score, 75.0, "Design match score should be high for designer")
        self.assertLess(match_ops.total_score, 40.0, "Operations match score should be penalized for designer")
        self.assertGreater(match_design.total_score - match_ops.total_score, 35.0, "Design should beat Ops by >35 points")

    def test_data_analyst_prioritizes_analyst_over_operations(self):
        """Test that data analyst ranks analyst job higher than operations."""
        match_data = self.engine.evaluate_match(self.data_analyst, self.data_job)
        match_ops = self.engine.evaluate_match(self.data_analyst, self.operations_job)

        self.assertGreater(match_data.total_score, 75.0)
        self.assertLess(match_ops.total_score, 45.0)

    def test_learning_interests_do_not_count_as_current_skills(self):
        """Test that learning interest in Python does not grant full skill match."""
        # Candidate has Python marked as is_learning_interest=True and is_current=False
        cand_with_interest = dict(self.graphic_designer)
        python_job = {
            "id": "job-py-01",
            "title": "Python Automation Specialist",
            "role_family": "engineering",
            "required_skills": ["Python", "FastAPI"],
            "preferred_skills": [],
            "description": "Python backend microservices",
            "responsibilities": "Build Python API endpoints",
            "mandatory_qualifications": ["Must have professional Python experience"],
            "work_arrangement": "remote"
        }
        res = self.engine.evaluate_match(cand_with_interest, python_job)
        self.assertNotIn("python", res.matched_skills)
        self.assertTrue(any("python" in s for s in res.missing_required_skills), "Python should be flagged in missing required skills")
        self.assertLess(res.total_score, 45.0)

    def test_mandatory_qualification_failure_caps_score(self):
        """Test that failing a mandatory qualification caps the match score."""
        job_with_mandatory = {
            "id": "job-mand-01",
            "title": "Brand Designer (Mandatory Medical Device Licensure)",
            "role_family": "design",
            "required_skills": ["Figma", "Typography"],
            "preferred_skills": [],
            "description": "Design UI for clinical devices.",
            "responsibilities": "Create clinical UI mockups.",
            "mandatory_qualifications": ["Active Medical Device Quality Systems Certification"],
            "work_arrangement": "remote"
        }
        res = self.engine.evaluate_match(self.graphic_designer, job_with_mandatory)
        self.assertTrue(len(res.failed_mandatory) > 0)
        self.assertLessEqual(res.total_score, 45.0, "Score must be capped when mandatory criteria fail")

    def test_weight_validation(self):
        """Test that invalid scoring weights raise ValueError."""
        with self.assertRaises(ValueError):
            ShortlistRankingEngine(weights={"role_family": 0.5, "required_skills": 0.9})  # sum != 1.0

        with self.assertRaises(ValueError):
            ShortlistRankingEngine(weights={"role_family": -0.2, "required_skills": 1.2})

    def test_malformed_candidate_does_not_crash(self):
        """Test that empty or malformed input dicts do not raise uncaught exceptions."""
        empty_candidate = {}
        empty_job = {}
        res = self.engine.evaluate_match(empty_candidate, empty_job)
        self.assertIsInstance(res.total_score, float)
        self.assertGreaterEqual(res.total_score, 0.0)
        self.assertLessEqual(res.total_score, 100.0)

    def test_skill_normalization(self):
        """Test skill normalization dictionary."""
        self.assertEqual(normalize_skill("React.js"), "react")
        self.assertEqual(normalize_skill("Postgres"), "postgresql")
        self.assertEqual(normalize_skill("UI/UX"), "ui design")
        self.assertEqual(normalize_skill("AWS Cloud"), "aws")

if __name__ == "__main__":
    unittest.main()
