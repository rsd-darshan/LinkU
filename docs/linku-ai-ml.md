# LinkU-AI: ML readiness and outcomes

## AdmissionsOutcome table

The `AdmissionsOutcome` table stores one row per known result (Accepted / Rejected / Waitlist) per university, with a **profile_vector** JSON field. This is designed for future per-university logistic regression (or other ML) to replace heuristic scoring.

### profile_vector contract

When ingesting outcomes (e.g. via `POST /api/linku-ai/outcomes`), send a normalized profile vector. Recommended shape:

- `gpa` (number)
- `sat` (number or null)
- `gpaPercentileFit` (number 0–100, relative to that university’s stats)
- `satPercentileFit` (number 0–100)
- `ecaScore` (number 0–100)
- `majorMultiplier` (number)
- `essayScore0_100` (number)
- `valueAlignmentScore0_100` (number or null)
- `lorAggregate0_100` (number)

No exact acceptance probability is stored; only the outcome (ACCEPTED, REJECTED, WAITLIST). Future ML can train on (profile_vector, result) per university.

### Ingesting outcomes

- **Admin API**: `POST /api/linku-ai/outcomes` with body `{ universityId, result, profileVector, userId? }`. Requires ADMIN role.
- **Batch**: Build a script that reads from your source (e.g. survey, manual sheet), normalizes each row into `profile_vector`, and calls the API or inserts via Prisma.

### Future ML upgrade

1. Export `AdmissionsOutcome` per university (or all) into a format suitable for training (e.g. CSV or Parquet).
2. Train a logistic regression (or other model) per university: features = profile_vector fields, target = result (binary or multiclass).
3. Replace the heuristic composite in `universityRelativeScoring` with a model prediction that maps to the same band (High Reach / Reach / Competitive / Strong Match) or a separate “model score” field.

The codebase does not implement training or inference yet; it only provides the storage and API for outcome ingestion.
