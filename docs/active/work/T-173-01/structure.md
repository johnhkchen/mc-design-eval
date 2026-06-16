# T-173-01 — Structure

File-level blueprint. Additive only; no `measurements/**`, no scoring-math, no frozen-instrument edits.

## Modified

### `experiments/eval-alignment/corpus-referee.mjs`
Two additive env gates; default path byte-for-byte unchanged (E-40/T-170-02 reproducibility preserved).

1. **`CRATER_BUILD` env-override** (line 119):
   ```js
   const CRATER_BUILD = process.env.CRATER_BUILD ?? "builds/gatehouse/new-roof";
   ```
   (was a bare string literal). No other reference to the constant changes — `runCrater` and the asset
   guard already read the constant.

2. **`CRATER_ONLY` env gate** (near the other env reads, ~line 59):
   ```js
   const CRATER_ONLY = process.env.CRATER_ONLY === "1";
   ```
   - In `main()` asset guard: when `CRATER_ONLY`, build `guardPaths` from the crater build + crater
     concepts only; skip the `pairStates`/`singleStates` guard loops.
   - In `main()` run sequence: when `CRATER_ONLY`, run `runCrater()` only; set `agreement`/`bakeoff` to a
     `{ skipped: "CRATER_ONLY" }` sentinel; skip the baseline-load block that reads
     `clean-wrong-style.json` / `bakeoff.json` (or guard it); still write `RESULTS` with the crater +
     skip sentinels; print only the `CRATER:` + `KIND:` verdict lines.
   - The default (`CRATER_ONLY` unset) path is unchanged — all three sections run exactly as before.

   Internal organization: keep the change a thin conditional around the existing
   `runCrater/runAgreement/runBakeoff` calls and the guard loops. Do not refactor the sections.

## Created (drafts — none under `measurements/`, none in `npm test`)

### `builds/gatehouse/faithful/` (staged S-171 build, standard render names)
- `artifact.json` — copy of `benchmarks/sculpture/recognition/gatehouse.artifact.json`.
- `view-{+x+z,+x-z,-x-z,-x+z}.png` — copies of `recognition/view-gatehouse-{az}.png` renamed to the
  standard `view-{az}.png` the harness expects. (`view-+x+z.png` doubles as the beside composite source.)
- `SOURCE.md` — one line noting these are byte-copies of the committed T-171-01 recognition build,
  re-named for the referee, not a new render.

### `experiments/eval-alignment/results/corpus-referee-faithful.json` (PRIMARY evidence)
Live crater result for the **recognition** build (S-171). Same schema as `corpus-referee-kind.json`;
`agreement`/`bakeoff` carry the `{ skipped: "CRATER_ONLY" }` sentinel. Committed as creation-loop
evidence (lives in `experiments/`, not pin-guarded).

### `experiments/eval-alignment/results/corpus-referee-roofcovering.json` (CONTRAST evidence)
Live crater result for the **roof-covering** build (S-172). Same shape. Triangulates the axis.

### `docs/active/work/T-173-01/` artifacts
- `research.md`, `design.md`, `structure.md`, `plan.md`, `progress.md`, `review.md` (this RDSPI set).
- `crater-*.png` — beside-concept composites the harness writes to `REFEREE_OUT_DIR` for each run
  (matched / wrongstyle / wrongstyle-2). Two builds → the second run overwrites the first's PNGs unless
  the harness `OUT_DIR` differs; to keep both, run PRIMARY into `T-173-01` and CONTRAST into
  `T-173-01/contrast` via `REFEREE_OUT_DIR` (the beside PNGs are evidence, not pinned).
- `FINDINGS.md` — the verdict doc: does the crater separate? the spread table vs ±12 / E-40 / T-170-02;
  the axis-triangulation from PRIMARY vs CONTRAST; the promote / re-calibrate / do-not-promote
  recommendation; the standing-wall note (Option 3 deferred — no single fully-faithful build).

## Ordering of changes

1. Edit `corpus-referee.mjs` (both env gates).
2. `GUARD_ONLY=1 CRATER_ONLY=1 CRATER_BUILD=builds/gatehouse/new-roof npm run corpus-referee` —
   validate the default-build crater-only guard path with **no spend** (sanity that CRATER_ONLY guard
   works) — actually guard only, cheap.
3. Stage `builds/gatehouse/faithful/` (copy artifact + rename renders).
4. `GUARD_ONLY=1 CRATER_ONLY=1 CRATER_BUILD=builds/gatehouse/faithful …` — guard the staged faithful
   assets, no spend.
5. `npm test` — green before any spend (proves the harness edit didn't break a test that imports it; it
   is not imported by tests, but run anyway).
6. **PRIMARY run** (spend): `CRATER_ONLY=1 CRATER_BUILD=builds/gatehouse/faithful
   REFEREE_OUT_DIR=docs/active/work/T-173-01
   REFEREE_RESULTS=…/results/corpus-referee-faithful.json npm run corpus-referee`.
7. **CONTRAST run** (spend): `CRATER_ONLY=1 CRATER_BUILD=builds/gatehouse/roof-covering
   REFEREE_OUT_DIR=docs/active/work/T-173-01/contrast
   REFEREE_RESULTS=…/results/corpus-referee-roofcovering.json npm run corpus-referee`.
8. Read both result JSONs + beside PNGs; write `FINDINGS.md` + `progress.md`.
9. `npm test` green; commit incrementally; write `review.md`.

## Module boundaries / interfaces

- **No new exports.** The env gates are local to the harness `main()`/top-level constants.
- **Public interfaces unchanged:** `diagnose`, `runCrater`, `styleFidelityScore`, `itemStyleClass`,
  `kindReliability`, the result JSON schema (`BAKEOFF_SCHEMA`) — all untouched.
- **Determinism:** the crater build path is now data (env), the scoring is unchanged; the only
  nondeterminism is the live model votes (VOTES=2), the established property of this harness.

## What is explicitly NOT touched
- `src/workshop/*.mjs`, `src/config.mjs`, `packs/`, `department.baml`, any `measurements/**`.
- The committed E-40 baseline `results/corpus-referee.json` and the T-170-02
  `results/corpus-referee-kind.json` (different `REFEREE_RESULTS` targets → no clobber).
- The S-171 recognition artifact + program and the S-172 roof-covering artifact (copied, not edited).
