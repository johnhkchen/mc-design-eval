# T-155-01 — Progress (one-artifact-home)

Executing `plan.md`. `npm test` green at every commit boundary. Bytes preserved by `git mv`.

## Step 1 — Three homes + `builds/` redirect (additive)  — IN PROGRESS
- `src/workshop/seed.mjs`: `buildRels` redirected to `builds/<runKey>/` (seed-artifact, ledger.json,
  ledger.md, final-artifact, build.json, build.md). All keys preserved; callers (build.mjs, workshop.mjs)
  derive from `buildRels` — no hardcoded literals remained.
- `src/workshop/seed-artifact.test.mjs`: AS1 repointed to `builds/...`; added "never under measurements/".
- Created `builds/`, `measurements/`, `_archive/` with READMEs (+ `.gitkeep` for the two empties).
- `.gitignore`: added `builds/**/renders/` + `builds/**/*.png`; added `measurements/multi-angle/**/*.png`
  (ahead of the move); documented fixtures-stay-draft.
- Pending: run `npm test`, then commit.

## Step 2 — Allowlist → prefix (transitional) — pending
## Step 3 — Gate verdicts → measurements/multi-angle/ — pending
## Step 4 — Baselines + milestones → measurements/ — pending
## Step 5 — Kit + retired-pins → measurements/ — pending
## Step 6 — Collapse allowlist to two prefixes — pending
