# T-170-02 Plan — ordered, verifiable steps

Epic **E-41** / Story **S-170**. Each step is independently verifiable and small enough to commit
atomically. Testing strategy folded in. Frozen instrument untouched throughout.

## Step 1 — `kindReliability` pure helper + BO13 test

- Add `export function kindReliability(conditions)` to `src/workshop/bakeoff-score.mjs` after
  `pairAgreement` (per `structure.md` §1). No edit to `itemStyleClass`/`styleFidelityScore`.
- Add `test("BO13 kindReliability ...")` to `bakeoff-score.test.mjs` after BO12b: per-condition counts,
  `byTier` aggregation, `replaceContrast`, the three verdict branches, empty-input safety.
- **Verify:** `npm test` → **2242 pass, 0 fail**. BO1–BO12b unchanged-green. This is the only step that
  touches `npm test`; it must be green before any spend.
- **Commit:** `feat(T-170-02): kindReliability helper + BO13 (pure, condition-level tag distribution)`.

## Step 2 — harness: capture `kind`, route output, report reliability

- `corpus-referee.mjs`: `itemsOf` adds `kind: it.kind ?? null`; env-gate `OUT_DIR`/`RESULTS` with
  T-169-01 defaults; import + call `kindReliability` in `runCrater`; add the `KIND:` console line and the
  write to `join(ROOT, RESULTS)`.
- **Verify (no spend):**
  `REFEREE_OUT_DIR=docs/active/work/T-170-02 REFEREE_RESULTS=experiments/eval-alignment/results/corpus-referee-kind.json GUARD_ONLY=1 node experiments/eval-alignment/corpus-referee.mjs`
  → `[guard] 21 assets present ... GUARD_ONLY — no spend; exiting clean.` Confirms routing + asset guard,
  zero model cost.
- **Verify (default unchanged):** `GUARD_ONLY=1 npm run corpus-referee` still guards against the T-169-01
  paths (back-compat).
- **Commit:** `feat(T-170-02): corpus-referee captures kind + env-routed output + reliability section`.

## Step 3 — live metered run (the proof)

- Run the full referee, env-routed to T-170-02:
  ```
  REFEREE_OUT_DIR=docs/active/work/T-170-02 \
  REFEREE_RESULTS=experiments/eval-alignment/results/corpus-referee-kind.json \
  node experiments/eval-alignment/corpus-referee.mjs
  ```
  ~48 image diagnose calls (VOTES=2). Writes `corpus-referee-kind.json` + the three `crater-*.png` under
  `docs/active/work/T-170-02/`.
- **Verify:** result doc has per-item `kind` populated (not all null), a `kindReliability` block, and the
  crater/agreement/bakeoff sections. If `kind` is all-null → the prompt isn't tagging → STOP and report
  (the tag is unreliable; that is itself a finding, not a thing to patch by re-spending — see
  spend-limit/same-prompt seam lessons; do not burn the budget re-asking).
- **If the live run is infeasible** (auth/timeout in this environment): do NOT fabricate numbers. Record
  in `FINDINGS.md` that the run could not be executed here, leave Steps 1–2 (the plumbing + reliability
  metric) as the landed deliverable, and flag the live rerun as the open item for a metered session. The
  anti-hedge directive forbids a faked crater.
- **Commit:** `chore(T-170-02): live corpus-referee-kind evidence (crater + kind distribution)`.

## Step 4 — FINDINGS.md (honest write-up)

Write `docs/active/work/T-170-02/FINDINGS.md` covering all four ACs:

- **AC #1** — post-`kind` crater scores (A/B/B2/C) beside the E-40 baseline **2/0/2/0**; the three
  beside-concept renders. State whether the over-cap moved.
- **AC #2** — `kind` reliability **separately from the score**: per-condition add/replace/remove/untagged,
  the MATCHED-vs-WRONG `replaceContrast`, and the explicit caveat that the corpus has **no per-item kind
  ground truth** so reliability is condition-level and confounded by the build's real material errors.
- **AC #3** — recorded honestly: is the over-cap gone? does the crater separate? Name the **E-42
  hand-off** explicitly (the matched gatehouse is itself material-wrong, so its cap is *correct* and a
  faithful matched build does not yet exist). Re-assess promote / re-calibrate / do-not-promote.
- **AC #4** — confirm `npm test` green (2242) and frozen instrument untouched.

- **Commit:** `docs(T-170-02): FINDINGS — post-kind crater, reliability, E-42 hand-off`.

## Step 5 — review.md

Self-assessment per RDSPI: files changed, test coverage + gaps, open concerns, AC checklist, anti-hedge
note. **Commit:** `docs(T-170-02): review.md`.

## Testing strategy summary

| Surface | Test | When |
|---|---|---|
| `kindReliability` logic | BO13 (pure, deterministic) | Step 1, in `npm test` |
| scoring math (kind read) | BO8/BO11 (pre-existing) | unchanged-green |
| harness routing + guard | `GUARD_ONLY=1` manual | Step 2, no spend |
| live judge tagging | the metered run + persisted `kind` audit trail | Step 3 |
| frozen instrument | untouched; TG/DPT green | every `npm test` |

## Risks & mitigations

- **Judge emits no `kind`** (untagged): caught by Step 3's all-null check + the `kindReliability`
  "UNRELIABLE" verdict; reported, not patched by re-spend.
- **Matched still caps:** expected (the build is material-wrong). The report distinguishes *correct* caps
  (true `replace` material errors → E-42) from *false* caps (items that should be `add`), using the
  per-item `kind` evidence. Not treated as a term failure (ticket Notes).
- **Overwriting the E-40 baseline:** prevented by the `-kind.json` routing; the committed
  `corpus-referee.json` is left byte-unchanged.
- **Test-count drift in other fixtures:** none expected — `kindReliability` is a new export; no prompt
  golden, no SAP behaviour, no schema touched.
