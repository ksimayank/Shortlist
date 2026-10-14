# Shortlist Ranking Engine — Formal Evaluation Report

- **Pairwise Ranking Accuracy:** 1.0000 (100.0%)
- **Mean NDCG@5:** 0.9981
- **Mean Precision@5:** 0.4667
- **Total Benchmark Pairs Tested:** 16
- **Total Pairwise Orderings Evaluated:** 29

## 1. Key Test Case: Graphic Designer vs Operations Manager
In standard recruitment systems, Elena Rostova (Graphic Designer) often gets matched to Operations Manager due to generic terms ('team', 'management', 'coordinator').

- Top Match: **Senior Brand & Visual Designer** (Score: 87.8)
- Operations Manager: **Operations Manager** (Score: 2.7)
- Result: Graphic Design score is **85.1 points higher** than Operations, with Operations placed in the lowest tier due to strict role-family penalties.

## 2. Methodology & Guardrails
- **Role-Family Hierarchy:** Candidates and jobs are mapped into functional families with a compatibility matrix.
- **Skill Classification:** Current skills receive full weight (1.0), while learning interests receive partial exploratory weight (0.2) and cannot satisfy mandatory criteria.
- **Mandatory Requirements:** Failures strictly cap the maximum possible match score at 45.0.
