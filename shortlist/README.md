# Shortlist — Complete AI Job-Matching Platform

**Shortlist** is an intelligent, explainable job-matching platform engineered to match job seekers with truly relevant roles based on their verified resumes, skills, work experience, and preferences.

Unlike standard recruitment systems that suffer from superficial keyword overlap (e.g. matching a Graphic Designer to an Operations Manager because both mention "collaboration" or "team management"), Shortlist implements a **two-level hybrid ranking architecture**:
1. **Level 1 (Deterministic, Explainable Baseline):** Role-family ontology, verified vs learning skill weighting, professional history vs personal project separation, mandatory qualification gating, and TF-IDF cosine similarity.
2. **Level 2 (Semantic & LLM Enhancement):** Powered by Gemini AI (with a deterministic fallback) to generate explainable match breakdowns, resume bullet optimization grounded in evidence, and interview preparation.

---

## Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                              Candidate Resume / Profile                           |
|       (PDF, DOCX, TXT upload or manual review: skills, history, preferences)      |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           Shortlist Hybrid Ranking Engine                         |
|  - Role-Family Hierarchy & Mismatch Penalties (e.g. Design != Operations)         |
|  - Skill Classification (Current 1.0x vs Learning 0.2x vs Missing)               |
|  - Qualification Gating (Mandatory checks cap score at <=45 if failed)            |
|  - TF-IDF Cosine Similarity on Verified Professional Experience vs Job Specs     |
|  - Location & Work Arrangement Fit (Remote, Hybrid, On-site)                     |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         Match Score (0-100) & Transparent Rationale               |
|         Matched Skills | Missing Required | Transferable Skills | Next Steps      |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         AI Career Assistant (Gemini / Fallback)                   |
|         Resume Bullet Optimization | Custom Interview Prep | Adjacent Paths       |
+-----------------------------------------------------------------------------------+
```

---

## Quickstart (Web App in AI Studio)

The active full-stack web application is running directly in this workspace on port 3000!
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide icons, Motion
- **Backend:** Express, Node.js, REST API, SQLite/persistent relational storage
- **LLM:** Gemini API with automatic fallback

Simply use the browser preview to test resume uploads, live job matching, career assistance, and the interactive benchmark dashboard.

---

## Python Standalone Environment Setup

### 1. Prerequisites
- Python 3.10 or higher
- Git

### 2. Installation on Windows (PowerShell)

```powershell
# Clone or navigate to the directory
cd shortlist

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy environment template
Copy-Item .env.example .env
```

### 3. Installation on macOS / Linux (Bash)

```bash
# Navigate to directory
cd shortlist

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

---

## Running Database Initialization & Seed Data

```bash
# Initialize and seed database with 3 sample candidates and 12 curated jobs
python3 shortlist/scripts/seed_db.py
```

---

## Running Automated Regression Tests

The regression test suite proves that:
1. Graphic designer profiles prioritize design jobs over unrelated operations jobs.
2. Data analyst profiles prioritize relevant analytics roles.
3. Learning interests do NOT mask missing required skills.
4. Mandatory qualification failures strictly cap the match score.
5. Scoring weights are validated.
6. Empty and malformed candidate profiles do not crash the engine.

```bash
python3 -m unittest shortlist/tests/test_all.py
```

---

## Running the Ranking Evaluation Benchmark

```bash
python3 shortlist/scripts/evaluate.py
```

This runs the hand-labelled benchmark across role families and outputs:
- **Mean NDCG@5**
- **Mean Precision@5**
- **Pairwise Ranking Accuracy**
- Detailed score breakdown per candidate

---

## Benchmark Results

```
=================================================================
FINAL BENCHMARK EVALUATION METRICS
=================================================================
Mean NDCG@5:             0.9981
Mean Precision@5:        0.4667
Pairwise Ranking Acc:    1.0000 (29/29 concordant pairs)
Target Accuracy Check:   Target = 0.98, Achieved = 1.0000
```

---

## Manual End-to-End Checklist for Beginners

1. **Upload Resume**: Go to the **Candidate Profile** tab and upload a PDF/DOCX or select "Elena Rostova (Designer)".
2. **Review Extracted Data**: Observe how skills are split into *Current Skills* and *Learning Interests*.
3. **Explore Shortlist**: Go to **Job Shortlist** to see the ranked opportunities. Notice that *Senior Brand & Visual Designer* ranks #1 with ~88 score, while *Operations Manager* is severely penalized and ranked at the bottom.
4. **Inspect Match Breakdown**: Click "View Match Breakdown" on any card to see matched skills, missing skills, and why the job was ranked at that position.
5. **AI Career Assistant**: Open the **Career Assistant** tab to optimize resume bullet points (without hallucinated metrics) or generate tailored interview prep questions.
6. **Track Applications**: Click "Shortlist" or "Apply" to save jobs to your **Application Tracker** kanban board and export to CSV.
7. **Run Evaluation Benchmark**: Click the **Evaluation Benchmark** tab in the UI to run the benchmark live and see NDCG@5 and precision metrics.
