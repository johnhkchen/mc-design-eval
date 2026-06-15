# T-142-01 Progress — witness-pin-policy

Status: **complete**. All four runs exit 0; `npm test` 2030/0; isolation clean.

## Commits (in order)
1. `f0b981e` feat — `src/form/witness-repro.mjs` (pure `classifyWitnessRepro` + `retiredEntry`),
   `witness-repro.test.mjs` (WR1–WR6, +RE), `benchmarks/sculpture/retired-pins.json` (registry sidecar).
2. `494a3a2` fix — proportion-witness: thread the pack into both `replayLedger` calls; classify the
   repro on the pinned ledger sha → cottage/barn SKIP (named), exit-code plumbing (`true` for skip).
3. `fd4ad70` fix — visibility-witness: classify the repro on the pinned gate-record sha → the 3
   pattern-book legs SKIP (named); read only git-tracked component-plans (untracked plan excluded).
4. `809249e` chore — rotate measured `{cottage,barn}` records (refresh `before`, pin the seed) and
   the cottage-challenge witness record (plan-less census), under explicit `--rotate-pins`.

## Per-family outcome

### proportion:repro → exit 0
- `cottage: SKIP — pinned source retired by T-138-02 …`, `barn: SKIP — … T-138-01 …`,
  gatehouse/church no-record. The pack is now threaded (geometry-bearing E-33 ledgers replay).
- Records NOT rotated — they stay pinned and SKIP (baselines never re-banked).

### visibility:repro → exit 0
- `barn-patternbook`, `barn-patternbook-saltcrag`, `cottage-patternbook`: SKIP (named, T-138-01/02).
- `gatehouse-current`: SKIP unchanged (the pre-existing artifact-pin precedent).
- `cottage-challenge`: byte-identical — now a **plan-less census** (the untracked plan excluded).
  Excluding it also *resolved the prior census drift*: `exposure basis: rederived`,
  `censusCheck.rederivedMatchesRecord: true` (was `rederived-with-drift` / `false`).
- 13 other legs byte-identical (tracked-plan legs untouched).

### measured:repro / :offline → exit 0
- cottage/barn reproduce byte-identically. **Retired `before` values quoted:**
  cottage `{ridgeToEave 2.25, roofShare 0.5556, aspect 1.0769}` → `{1.55, 0.3548, 1.1852}`;
  barn `{2.4444, 0.5909, 2}` → `{2.4, 0.5833, 1.8462}`. Both now equal `after` (the S-138 chains
  adopted the measured seed). `after`/`target` unchanged.
- `inputs.chainSeed` pin added; `artifact.json` stayed byte-identical (skip-identical).

## Deviations from the plan

- **D1 — T-141-01 landed concurrently (the big one).** A sibling Lisa thread committed `e908d76`
  (rustic `storeyHeight` max→5, `pitchClasses` +class 2) **during** this ticket. That moved the
  measured **program** record too: the storeyHeight-5 `packBand` excursion conflict (present when
  the band was [3,4]) vanished. The Step-0 baseline measured:repro showed 1 problem (ratios); after
  the branch advanced it showed 2 (ratios + program). The measured rotation therefore absorbed a
  **second** sanctioned upstream (T-141's pack) beyond T-138's seed. This is the RDSPI "two tickets
  touch the same effective input = a missing DAG edge" hazard (T-142 `depends_on` [T-139, T-140],
  not T-141). All inputs are committed and the pack is clean at HEAD, so the rotation is consistent;
  flagged for review (see review.md Concern 1). No data lost.
- **D2 — `--all` live rotation aborts on gatehouse/church.** They have no recognition program, so
  `runLive` pipeline-fails and `process.exit(1)` before reaching barn. Rotated **per-subject**
  (`--subject cottage` / `--subject barn`) instead. Not a regression — `--all` repro already skips
  the record-less subjects; only the live *rotation* path hits it. Noted, not "fixed" (out of scope).
- **D3 — cottage-challenge resolved by EXCLUSION, not a SKIP flag.** The plan offered "exclusion
  (green) OR a SKIP flag." Exclusion won: a record-side `tracked:false` stamp would have broken
  clean-worktree reproducibility (the stamp depends on the file being present); reading only tracked
  plans makes the census worktree-independent and green everywhere. Strictly better than SKIP — the
  witness simply no longer depends on the unprovenanced file. `reconstructed-artifact.json` (same
  dir, also untracked) is not a witness input — left as the unrelated stray it is.

## Verification performed
- Unit: `node --test src/form/witness-repro.test.mjs` 10/10; `npm test` 2030/0.
- Integration: the four runs each `echo $?` == 0.
- **Adversarial (the SKIP can't mask a real regression):**
  - proportion: dropping cottage from the registry → `unregistered … investigate` FAIL, exit 1.
  - visibility: dropping barn-patternbook → `REPRO FAIL — … no sanctioned rotation`, exit 1.
  - cottage-challenge clean-worktree sim (untracked plan moved aside) → still byte-identical.
  - All restored → exit 0, registry diff-clean.
- Self-grep: both runners' `generalizationGrep` clean (subject keys live in the JSON sidecar; one
  near-miss caught + fixed — a comment naming `cottage-challenge`/`church-challenge` tripped it).
- Isolation: `git status benchmarks/sculpture/multi-angle/` empty — no witness write into the gate
  namespace. Committed exactly my files (sibling edits to `src/config.mjs`,
  `src/form/multi-angle-gate.mjs`, `T-144-01.md`, `.lisa*` deliberately left for their owners).
