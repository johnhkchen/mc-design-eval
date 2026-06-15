# Plan — T-009-01: effort-ab-on-champion

Ordered, independently verifiable steps. Code-and-test steps are deterministic; the two trial steps are
LIVE/METERED (subscription) on the champion pipeline. Commit after each meaningful unit.

## Step 0 — Probe the legal `--effort` token (non-metered)
- Inspect `claude --help` for the `--effort <level>` value set; if values aren't enumerated, run a trivial
  non-design probe (`echo hi | claude -p --effort high --output-format stream-json --verbose`) and confirm
  it exits success (not "invalid effort level").
- **Verify:** the token `high` is accepted. Record the confirmed token. If `high` is rejected, pin the
  advertised top level instead and note the substitution. The "default" arm uses **no flag** (not an
  explicit level).
- No commit (investigation only).

## Step 1 — Wire `effort` into `requestDesignArtifact` (sdk-binding.mjs)
- Add `effort` to the destructured params; after the `--model` push, add
  `if (effort) args.push("--effort", String(effort));`. Update the JSDoc `@param` (mirror `requestText`).
- **Verify:** read the diff — single guarded push; `effort` undefined ⇒ args unchanged. No edit to the
  retry loop or `void options`.

## Step 2 — Wire `effort` into `requestDesignArtifactWithImage` (sdk-binding.mjs)
- Identical change in the image-bearing function (push after `--model`, before the image-stream args are
  irrelevant since they're already in the base `args`). Update its JSDoc.
- **Verify:** diff shows the same guarded one-liner; `requestText*` untouched (already wired).

## Step 3 — `npm test` green (gate the wiring)
- Run `npm test` (validate-artifact self-test + bad-case + `test:unit`).
- **Verify:** all tests pass (the 20 sdk-binding pure-helper tests + the rest). The request functions are
  untested by spec §4, so a guarded pass-through cannot break the suite — this confirms no collateral.
- **Commit:** `feat(T-009-01): wire --effort pass-through into the two artifact request fns`.

## Step 4 — Thread `--effort` through the harness (run.mjs)
- `parseArgs`: add the `--effort` branch + `effort: undefined` default.
- `main`: destructure `effort`; thread into ctx; set `summary.effort = effort ?? null`.
- `vRefRevise-designdoc`: add `effort: ctx.effort` to the three stage calls.
- **Verify:** `node -e "import('./benchmarks/temple-facade/run.mjs')"` parses (no syntax error); a dry
  `--help`-style read of parseArgs shows the new flag. `npm test` still green (run.mjs isn't imported by the
  suite, but re-run to be safe).
- **Commit:** `feat(T-009-01): thread --effort flag to the champion in run.mjs`.

## Step 5 — Copy the round-0 judge helper
- `cp docs/active/work/T-006-01/judge-round0.mjs docs/active/work/T-009-01/judge-round0.mjs` (same import
  depth — no path edit).
- **Verify:** the import paths resolve from the new location (identical directory depth).

## Step 6 — Run the DEFAULT arm (LIVE/METERED)
- `npm run bench:temple-facade -- --approach vRefRevise-designdoc --ref references/taj_mahal.png
  --note "T-009-01 effort A/B: DEFAULT (no --effort)"`.
- **Verify:** completes with a `runs/<NNN>-vRefRevise-designdoc/` dir containing `render.png`,
  `round-0.png`, `summary.json` (`effort: null`), `artifact.json`, `design-doc.md`, `transcript.jsonl`.
  Note `summary.json.durationMs` and the auto-judged `render.png` scores.
- Run `node docs/active/work/T-009-01/judge-round0.mjs runs/<NNN>-…/round-0.png` → record build scores.

## Step 7 — Run the HIGH arm (LIVE/METERED)
- Same command **plus** `--effort high`, note `"T-009-01 effort A/B: HIGH (--effort high)"`.
- **Verify:** new `runs/<NNN+1>-…/` dir, `summary.json.effort === "high"`, all artifacts present. Record
  `durationMs` and render.png scores; judge its `round-0.png`.
- **Commit:** `chore(T-009-01): champion effort A/B runs (default vs high) on Taj` (run dirs are retained
  artifacts).

## Step 8 — Fill progress.md scoreboard
- Tabulate per-dimension default-vs-high for **both rounds** (round-0 build, render 2nd pass) of **both
  runs**, plus the two `durationMs` values and their ratio.
- **Verify:** every cell sourced from a `summary.json` or `judge-round0.mjs` output (no placeholders).

## Step 9 — Apply the verdict rubric (Decision D) and append the journal entry
- Compute the deltas; pick ADOPT / NOT-WORTH-LATENCY / INCONCLUSIVE per the pre-registered thresholds.
- Append one dated entry to `docs/knowledge/design-learnings.md` "Attempt log" tail: run ids, ref, seed,
  config, effort token, the **wiring diff** + `npm test` green, the **per-dimension table**, the
  **wall-clock delta**, and the **verdict** with the n=1 / P15-detail caveat. If ADOPT, flag that a
  confirmer run is required before changing any default.
- **Verify:** the entry states an effect size and a verdict, not just scores; the caveat is present.
- **Commit:** `docs(T-009-01): journal the effort A/B verdict + per-dimension table`.

## Step 10 — Write review.md (handoff)
- Summarize files changed, the A/B outcome, test coverage + gaps, and open concerns (n=1, effort-token
  caveat, whether a confirmer is recommended).
- **Commit:** `docs(T-009-01): review — effort A/B handoff`.

## Testing strategy
- **Unit:** none added — the four request functions are LIVE/METERED and untested by design (spec §4); the
  pure helpers they call are unchanged, so existing coverage holds. The gate is `npm test` green (Steps 3,
  4) — proving the guarded pass-through is collateral-free.
- **Integration / behavioral:** the DEFAULT arm IS the regression check — a no-`--effort` champion run must
  reproduce the unchanged path (same artifact shape, judged successfully). The HIGH arm exercises the new
  flag end-to-end (assert `summary.json.effort === "high"` and that `--effort` rode into the live call).
- **Verification criteria = the AC:** (1) `--effort` confirmed wired + `npm test` green; (2) two champion
  trials, same ref+seed, each median-of-3 per-dimension; (3) journal entry with default-vs-high, wall-clock,
  verdict; (4) renders + `summary.json` retained under `runs/<id>/`.

## Risk / mitigation
- *Rate-limit or transient failure mid-run* → runs are sequential (Step 6 before 7); a failed arm is re-run,
  not abandoned (metered but cheap relative to a wrong verdict). If one arm degenerates, the verdict is
  INCONCLUSIVE per Decision D.
- *`--effort high` rejected by the CLI* → caught in Step 0 before any metered run; substitute the advertised
  top level and record it.
- *Small/noisy deltas* → the pre-registered rubric (Decision D) and the n=1 caveat prevent over-claiming;
  detail moves are down-weighted (P15).
