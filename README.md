# Digital Evidence Integrity & Fraud Detection in E-Commerce Reviews

Developed as part of the course on **Forensic Analytics** at Vellore Institute of Technology, Chennai.

by **Priyanka S** (23MIA1032), **Kavya N** (23MIA1125)

**Subject Code:** CSE4074 · **Semester:** Fall 2026-27 · **Professor:** Dr. S. Johanan Joysingh

![Course](https://img.shields.io/badge/Course-Forensic_Analytics-211D18?style=flat-square&labelColor=8A8177)
![Subject](https://img.shields.io/badge/Subject-CSE4074-EFDC7C?style=flat-square&labelColor=8A8177)
![Semester](https://img.shields.io/badge/Semester-Fall_2026--27-AFC6E9?style=flat-square&labelColor=8A8177)
![Notebook](https://img.shields.io/badge/Engine-Python_+_scikit--learn-BFD6A3?style=flat-square&labelColor=8A8177)
![Web](https://img.shields.io/badge/Console-Next.js-F4B8D0?style=flat-square&labelColor=8A8177)
![Dataset](https://img.shields.io/badge/Dataset-Amazon_Reviews_2023-CDB8EC?style=flat-square&labelColor=8A8177)


---


## Overview

A reproducible forensic scoring framework that detects fake-review fraud, coordinated sabotage, and content-authenticity issues in e-commerce reviews. A seeded, interpretable 12-signal engine scores each case on a 0–22 evidence scale and returns an ordered verdict plus a likelihood band. It ships as a Jupyter notebook, a real-time Next.js console, and a population dashboard built on a real 60,000-review run.

---

## Problem Statement

E-commerce reviews decide trust, yet they are manipulated and hard to police at scale.

- **Reviews decide trust** — ratings sway purchases, revenue, and seller survival, so they are a target.
- **Fake-review fraud** — paid or self-posted reviews inflate or bury products deceptively.
- **Competitor sabotage** — coordinated negative campaigns and reused imagery attack rival listings.
- **Authenticity & integrity gaps** — templated wording and recycled images break evidence provenance.
- **Manual review cannot scale** — hundreds of millions of reviews exceed human moderation, and black-box scores cannot be defended as evidence.

---

## Objectives

- **Detect reviewer-fraud patterns** — high-volume, high-negative-ratio, statistically anomalous accounts.
- **Detect coordinated campaigns** — templated text repetition, temporal bursts, and reviewer–product network reach.
- **Detect content-authenticity issues** — perceptual-hash image reuse across unrelated listings.
- **Score & rank every case** — a 0–22 evidence score with an ordered, interpretable verdict cascade and a likelihood band.
- **Ship a usable console** — a real-time customer-facing web app plus a full population dashboard.

---

## Dataset

**McAuley-Lab Amazon Reviews 2023 — Electronics** (public release). Negative reviews only.

| Property | Value |
|---|---|
| Reviews | 60,000 |
| Reviewers | 31,159 |
| Products | 38,607 |
| Months covered | 255 (Dec 1999 – Mar 2023) |
| Verified purchases | 87.41% |
| Contain a complaint indicator | 50.6% |
| Filter | 1–2★ negative reviews only |
| Reproducibility | Fixed random seed 42 |

Scope: single category, negative-only; image forensics runs over user-posted review images. The dataset is unchanged from the notebook's source.

---

## Methodology / Pipeline

A five-stage forensic pipeline — reproducible, interpretable, and exportable.

| # | Stage | What it does |
|---|---|---|
| 1 | **Ingest** | Stream `Electronics.jsonl`, filter 1–2★, cache 60k reviews. |
| 2 | **Features** | Complaint dictionary, Dice text similarity, burst ratio, reviewer–product network degree, reviewer z-anomaly. |
| 3 | **Image forensics** | Download review images, 256-bit perceptual hash, Hamming ≤12 match. |
| 4 | **Scoring** | 12 components → weighted score → domain sums → ordered verdict cascade. |
| 5 | **Export** | `.joblib` models + JSON schema feed the real-time web engine. |

- **Reproducible** — fixed random seed and cached input make every run deterministic.
- **Interpretable** — each firing component maps to a stated forensic relevance, not a latent feature.
- **Exportable** — models and rules are written as `.joblib` and `.json` artifacts consumed by the web engine.

---

## Architecture

From raw reviews to a real-time forensic verdict. Offline analysis (data → forensic features → models/artifacts) feeds the real-time serving path (API → web console → user), with a feedback loop for live review/listing input.

---

## Models & Metrics

| Artifact | Type | Detail |
|---|---|---|
| Text-similarity model | `.joblib` | Near-duplicate detection, Dice threshold 0.75. |
| Reviewer-anomaly model | `.joblib` | Multivariate anomaly scoring, 29.4% component firing rate. |
| Scoring rules + schema | `.json` | 12 components, their weights, and the ordered verdict cascade. |

**Validation**

- **Spearman rank correlation 0.992** — reviewer ranking is stable across seeds.
- **Top-decile Jaccard 0.839** — the flagged set barely shifts between runs.
- **Blended surprise p-value** — chi-square + seeded Monte-Carlo (seed 42, 5000 sims) per case.
- **256-bit perceptual hash, Hamming ≤12** — image-reuse tolerance.

The engine is seed-independent, deterministic, and fully interpretable.

---

## Results

Distribution over all 60,000 cases.

**Verdict mix**

| Verdict | Cases | Share |
|---|---:|---:|
| Routine complaint | 50,087 | 83.48% |
| Reviewer fraud pattern | 8,361 | 13.94% |
| Authentic complaint likely | 1,118 | 1.86% |
| Content authenticity concern | 434 | 0.72% |

**Priority mix**

| Tier | Cases | Share |
|---|---:|---:|
| Routine review | 37,722 | 62.87% |
| Contextual examination | 20,671 | 34.45% |
| High-priority examination | 1,607 | 2.68% |

**Likelihood band**

| Band | Cases | Share |
|---|---:|---:|
| Very strong | 179 | 0.30% |
| Strong | 1,428 | 2.38% |
| Moderate | 0 | 0.00% |
| Weak | 58,393 | 97.32% |

**Key figures**

| Metric | Value |
|---|---|
| Observed score range | 3 – 14 (max possible 22) |
| Reviewers flagged anomalous | 3,116 of 31,159 (10.0%) |
| Temporal burst months | 16 of 255 |
| Cross-product near-duplicate reviews | 386 |
| Image-reuse pairs (cross-product / same) | 9 / 2 |

---

## Results & Discussion

Reading the scores as a forensic analyst — not just listing numbers.

- **Bulk negativity is not fraud.** 83.5% of cases are routine — most 1–2★ reviews are genuine complaints, so volume alone proves nothing.
- **Clustering, not presence, signals manipulation.** Only 0.30% reach very-strong likelihood; a signal matters when several co-occur unusually.
- **Investigate the account, not the review.** The 13.9% fraud band concentrates in high-volume, high-negative-ratio, anomalous reviewers.
- **Rankings are defensible.** Spearman 0.992 and Jaccard 0.839 show flags are seed-independent — evidence, not artifacts.
- **Real complainants are protected.** The authentic band (integrity ≥2 and score ≤5) shields genuine customers from being mislabelled.

**Standing caveat.** A high score is an investigation-prioritization aid, **not proof of guilt**. Alternative explanations (a defective batch, a price swing) can mimic these signals, and verdicts describe observed patterns in one case — never a final judgement. This is stated on every relevant view.

**Scoring, confidence, and likelihood**

- **Score (0–22)** — the weighted sum of fired evidence components; priority tiers are routine 0–5, contextual 6–9, high-priority 10+.
- **Likelihood band** — how unusual the score is under a seeded Monte-Carlo null model built from real population firing rates (very strong p<0.01, strong p<0.05, moderate p<0.10, weak otherwise).
- **Confidence / dominant domain** — which forensic domain contributed most, so an analyst knows where to look first.

---

## How to Run Locally

### 1. Forensic notebook

```bash
# install notebook dependencies
pip install numpy pandas requests matplotlib networkx joblib scikit-learn pillow jupyter

# run the notebook (v5 — current)
jupyter notebook amazon_forensic_analytics_v5.ipynb
# or non-interactive:
jupyter execute amazon_forensic_analytics_v5.ipynb
```

The notebook streams the public dataset, filters 1–2★ Electronics reviews, and writes `.joblib` model artifacts plus a JSON schema.

### 2. Website console (Next.js)

```bash
# enter the project folder (source tree is already included)
cd forensic-analytics-web-v2

# install dependencies
npm install

# (optional) create a local env file — every var is optional
cp .env.example .env.local

# run the dev server
npm run dev
# → open http://localhost:3000
```

Production build & preview:

```bash
npm run build     # compile, type-check, prerender
npm run start     # serve at http://localhost:3000
```

---

## References

1. McAuley-Lab, “Amazon Reviews 2023 dataset,” Hugging Face Datasets, 2024. [huggingface.co/datasets/McAuley-Lab/Amazon-Reviews-2023](https://huggingface.co/datasets/McAuley-Lab/Amazon-Reviews-2023)
2. Y. Hou et al., “Bridging Language and Items for Retrieval and Recommendation,” arXiv:2403.03952, 2024. [arxiv.org/abs/2403.03952](https://arxiv.org/abs/2403.03952)
3. M. Ott, Y. Choi, C. Cardie, J. T. Hancock, “Finding Deceptive Opinion Spam by Any Stretch of the Imagination,” *Proc. ACL-HLT*, pp. 309–319, 2011. [arxiv.org/abs/1107.4557](https://arxiv.org/abs/1107.4557)
4. Z. Deng et al., “Online Spam Review Detection: A Survey of Literature,” Springer, 2022. [link.springer.com/article/10.1007/s44230-022-00001-3](https://link.springer.com/article/10.1007/s44230-022-00001-3)
5. “Fake Reviews Detection: A Survey,” IEEE Xplore, doc. 9416474, *IEEE Access*, 2021. [ieeexplore.ieee.org/document/9416474](https://ieeexplore.ieee.org/document/9416474)
6. “Detecting Fake Reviews using Machine Learning Techniques: A Survey,” IEEE Xplore, doc. 9823633, IEEE, 2022. [ieeexplore.ieee.org/document/9823633](https://ieeexplore.ieee.org/document/9823633)

---

**Acknowledgements.**

- **McAuley Lab**, UCSD, for the public Amazon Reviews 2023 dataset.
- Professor: **Dr. S. Johanan Joysingh**, Forensic Analytics, VIT Chennai
- The open-source projects that make this work possible: Python, scikit-learn, pandas, NetworkX, joblib, Pillow, Next.js, Tailwind CSS, and FastAPI.

---

*Digital Evidence Integrity & Fraud Detection in E-Commerce Reviews — a high score prioritizes a case for review; it does not prove fraud.*
