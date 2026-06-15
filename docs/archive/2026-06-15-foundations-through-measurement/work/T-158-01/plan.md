# T-158-01 — Plan: canonical-flow-proof (E-37 terminal)

Ordered, independently-verifiable steps. Two commits: (1) the proof run + beside sheets, (2) the
narrative + cross-links + handoff. Verification at each step is concrete. No source changes.

## Step 0 — Pre-flight (verify, don't change)

- Confirm claim held this session (`npm run lisa:claim -- --ticket T-158-01 --check`).
- Confirm `git status` shows no foreign in-flight edits to `build.mjs` / `design-learnings.md` /
  `STRUCTURE.md` / `pipeline-philosophy.md` from a sibling thread.
- **Verify:** claim shows this session; no conflicting edits.

## Step 1 — Run cottage live (the lower-risk smoke)

- `npm run build:cottage` (live). Watches: Stage 3 verify → Stage 4 generate-seed spawn → Stage 5
  workshop loop (≤ `BUILD_BUDGET` rounds, model) → final beside concept render.
- **Verify:** exit 0; `benchmarks/sculpture/builds/cottage/build.json` exists with no
  `status:"pipeline-failed"`; `pr/assets/frames/beside-concept-cottage-build.png` exists; the
  console prints the workshop outcome + "grep clean".
- **On failure:** read `build.json` — if `pipeline-failed`, capture stage+error verbatim. Re-run
  once for a transient model hiccup. If it fails structurally, record honestly and proceed to barn
  (the failure record is itself a valid honest artifact; note it in progress + review).

## Step 2 — Run barn live (the known-weak subject)

- `npm run build:barn` (live). Barn's trim/roughness is the expected weak read — a "drifted" glance
  is honest, not a regression.
- **Verify:** exit 0; `builds/barn/build.json` exists; `beside-concept-barn-build.png` exists.
- Same failure handling as Step 1.

## Step 3 — Read back the receipts (so the prose cites truth)

- Read `builds/cottage/build.json` and `builds/barn/build.json`: extract `stages.workshop.outcome`,
  `rounds.used/budget`, the final sha, the beside path, `generalization.clean`.
- Eyeball the two beside PNGs (Read the images) to name what reads right/wrong honestly.
- **Verify:** I can state, per subject, the real outcome string + rounds + one honest visual note.

## Step 4 — Commit 1: the proof run

- `git add benchmarks/sculpture/builds/ pr/assets/frames/beside-concept-cottage-build.png
  pr/assets/frames/beside-concept-barn-build.png` (+ any refreshed `generated/<key>/` outputs the
  run touched).
- Re-check the claim. Commit:
  `feat(T-158-01): barn + cottage through the ONE chain — beside-concept proof (E-37/S-158)`.
- **Verify:** `git show --stat` lists the build dirs + two beside sheets; working tree clean of run
  outputs.

## Step 5 — Write the E-37 capstone in `design-learnings.md`

- APPEND the `## Canonical-flow proof (E-37) …` tail section: headline + the seven-beat flow (each
  beat = failed middle-era alternative → what the representation allows, keyed to existing receipts)
  + the two proof builds (honest, drafts) + the cross-link line.
- **Verify:** section appended at the tail; no prior section edited (`git diff` shows only additions
  at EOF); the seven beats match the philosophy's Stage 0–6 1:1.

## Step 6 — Cross-link from `STRUCTURE.md` and `pipeline-philosophy.md`

- STRUCTURE.md: add a one-line pointer to the capstone under the spine / "Why this shape". **No
  table row or invariant change.**
- pipeline-philosophy.md: extend the realization clause to name E-37 (provenance pointer only;
  **stage assignments untouched**).
- **Verify:** `git diff STRUCTURE.md` shows only a prose pointer (no `| … |` row delta); `git diff
  pipeline-philosophy.md` shows only the realization-clause edit (Stage 0–6/F headings unchanged).

## Step 7 — Write the E-12 handoff `pr/assets/E-37-handoff.md`

- Delivered (paths) + consumption contract (per subject) + honest over/under-reach.
- **Verify:** file exists; names both subjects + both beside sheets; no per-building constants.

## Step 8 — `npm test` green

- `npm test` (artifact self-test + `node --test src/**/*.test.mjs`).
- **Verify:** exit 0, ~2161 passing (same as post-T-157-01 baseline; we added no source).
- **If red:** a doc-only change cannot break a unit test *except* `topology.conformance.test.mjs`
  (it reads STRUCTURE.md) — if that trips, I edited the spine table by mistake; revert the offending
  STRUCTURE edit to a pure prose pointer.

## Step 9 — Commit 2: the narrative

- `git add docs/knowledge/design-learnings.md STRUCTURE.md docs/knowledge/pipeline-philosophy.md
  pr/assets/E-37-handoff.md`.
- Re-check the claim. Commit:
  `docs(T-158-01): canonical-flow narrative + E-12 handoff (E-37/S-158)`.
- **Verify:** `git show --stat` lists exactly those four files.

## Step 10 — Review (Phase 6 artifact)

- Write `docs/active/work/T-158-01/review.md`: the **S-158 epic-level** review — chain unified
  (T-154), home established (T-155), archive moved (T-156), guardrails red-on-violation (T-157),
  frozen records re-derive unchanged; plus this ticket's proof outcome (honest), test coverage,
  open concerns.
- **Verify:** review.md covers all five sibling tickets + this proof + honest open concerns.

## Testing strategy

- **No unit tests added** — the deliverable is a run + docs, not a module. The "test" is the live
  chain succeeding (or failing honestly) and `npm test` staying green.
- **Integration verification** = the two `build.json` receipts (no `pipeline-failed`) + the two
  beside PNGs on disk + `generalization.clean`.
- **Regression guard** = `npm test` unchanged count; `topology.conformance` green proves the spine
  map still matches the tree.

## Risks

- **Live model failure** → honest-failure record + re-run-once policy (Steps 1–2). Recorded, not hidden.
- **Accidental spine edit** → caught by `topology.conformance.test.mjs` in Step 8; revert to prose.
- **Sibling double-dispatch** → claim re-checked before each commit (Steps 4, 9).
- **Run touches tracked `generated/<key>/`** → expected; it is generate-first output, not a
  `measurements/` pin; pin-guard does not gate it.
