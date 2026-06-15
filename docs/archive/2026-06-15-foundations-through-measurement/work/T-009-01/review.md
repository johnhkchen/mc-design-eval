# Review — T-009-01: effort-ab-on-champion

Handoff for the `--effort` deliberation-knob A/B on the champion `vRefRevise-designdoc` (Taj, seed 11).
What changed, what it found, what's covered, what to watch.

## Outcome in one line

`--effort` is wired through `src/sdk-binding.mjs` (`npm test` 133/133 green); the default-vs-high A/B on
the champion moved **only `detail` (competent→strong, both rounds)** at **+31% wall-clock / +32% output
tokens** — and that lone move is the P15 generation-noise signature, **independently corroborated** by the
persona A/B (run 025) flipping the same single dimension via the same more-output mechanism. **Verdict:
`--effort high` is NOT a real lever on this config; no default changed.**

## Files changed

### Source (the code change — minimal, default-preserving)
- **`src/sdk-binding.mjs`** — added an optional `effort` param to the two artifact functions that lacked
  it, each pushing `--effort String(effort)` guarded by `if (effort)` (after the `--model` push), plus a
  JSDoc `@param` mirroring `requestText`:
  - `requestDesignArtifact` (stage 2: high-res build)
  - `requestDesignArtifactWithImage` (stage 3: reference-compared 2nd pass)
  - `requestText` / `requestTextWithImage` were **already** wired (stage 1) — untouched.
  - Invariant: `effort === undefined` ⇒ `args` byte-identical ⇒ default path unchanged. Verified by the
    DEFAULT arm (run 024, no flag) reproducing the established champion behavior.
- **`benchmarks/temple-facade/run.mjs`** — threaded a `--effort` flag: `parseArgs` branch + default;
  `main` destructures `effort`, passes it into the approach `ctx`, and records `summary.effort = effort ??
  null`; the `vRefRevise-designdoc` approach passes `effort: ctx.effort` to all three stage calls.

### Work artifacts (`docs/active/work/T-009-01/`)
`research.md`, `design.md`, `structure.md`, `plan.md`, `progress.md`, `review.md` (this), and
`judge-round0.mjs` (copied from T-006-01 — the median-of-3 round-0 scorer for P14 attribution).

### Journal (AC #3)
`docs/knowledge/design-learnings.md` — one dated attempt-log entry (run 024+026) with the wiring note, the
per-dimension table, the cost delta, and the verdict. The T-014-01 consolidation thread independently
folded the same finding into **P15** and **"Tunable parameters"** (cross-knob noise corroboration).

### Run outputs (AC #4 — retained)
`benchmarks/temple-facade/runs/024-vRefRevise-designdoc/` (DEFAULT) and `026-vRefRevise-designdoc/` (HIGH),
each with `reference.png`, `design-doc.md`, `*.prompt.txt`, `round-0.png`, `render.png`, `artifact.json`,
`summary.json` (carrying the `effort` arm), `transcript.jsonl`. README gallery regenerated.

## Acceptance criteria — status

- [x] **AC #1** — `--effort` confirmed wired through `src/sdk-binding.mjs` (minimally wired into the two
  artifact fns; diff recorded in the journal + `progress.md`), `npm test` green (133/133).
- [x] **AC #2** — two champion trials (DEFAULT 024 vs HIGH 026), same reference (`taj_mahal.png`) + seed
  (11), each scored with the categorical judge (median-of-3), per-dimension, both rounds.
- [x] **AC #3** — journal attempt-log entry records the per-dimension default-vs-high comparison, the
  wall-clock cost difference (723s→946s, +31%), and a verdict (*not worth the latency* / not a real lever).
- [x] **AC #4** — renders + `summary.json` for both runs retained under `benchmarks/temple-facade/runs/`.

## The result, read carefully

| dim | DEFAULT (024) both rounds | HIGH (026) both rounds | moved? |
|-----|:-:|:-:|:-:|
| proportion | strong | strong | no |
| color | strong | strong | no |
| detail | competent | **strong** | **+1 step** |
| fidelity | strong | strong | no |
| overall | strong | strong | no |

Cost: wall-clock **+31%** (1.31×), output tokens **+32%**, build/2nd-pass ops up ~35%.

**Why "not a real lever," not "adopt":**
1. **Below the pre-registered bar.** Decision D set ADOPT at ≥2 dimensions moving a full step with no
   regression. Only one dimension moved.
2. **It's the noisy dimension.** P15 names `detail` as the lagging flat-field holdout that swings with
   build verbosity. The HIGH render notes confirm the broad iwan/wall fields *still read flat* — the
   detail=strong comes from denser ornament *around openings*, not filled fields (the same whack-a-mole).
3. **Cross-knob corroboration (the decisive datum).** The independent persona A/B (run 025) flipped the
   *same* lone `detail` competent→strong and *also* emitted more output. Two unrelated knobs producing the
   identical single-dimension flip, both mediated by output size, is the "busier-reads-as-detail"
   generation-noise signature — not a deliberation effect.

## Test coverage and gaps

- **Unit:** none added. The four request functions are LIVE/METERED and untested by spec §4; the guarded
  `effort` pass-through touches no pure helper, so the existing 133-test suite stays green — that green is
  the regression gate. **Gap (acceptable, by spec):** no test asserts that `--effort` actually appears in
  the spawned `args`. Mitigation: the wiring is a verbatim copy of `requestText`'s already-shipping line,
  and the HIGH arm exercised it end-to-end (`summary.json.effort === "high"`, build demonstrably busier).
- **Behavioral:** the DEFAULT arm is the regression check (no-flag path reproduces champion behavior); the
  HIGH arm is the end-to-end exercise of the new flag.

## Open concerns / for a human reviewer

1. **n=1 per arm.** A single paired sample at a fixed seed; `claude -p` is not bit-deterministic across
   effort levels (effort changes the reasoning trace), so the two builds differ structurally regardless.
   The verdict is calibrated to that — it claims a *null/noise* result, which n=1 supports more safely than
   it would support a positive "adopt." A confirmer (n≥3 per arm) would harden it, but the cross-knob
   corroboration already makes the "not a real lever" prior strong; a confirmer is **optional**, not
   blocking.
2. **Scope of the null.** The finding is specific to **`--effort high` on this champion + Taj**. It does
   **not** claim effort is inert for *other* tasks/configs — only that it doesn't clear the rubric-noise
   floor on the one design pipeline tested. Higher levels (`xhigh`/`max`) were not tested (out of AC scope:
   pairwise default-vs-high only) and would only worsen the latency trade unless they cross a quality
   threshold this run gives no reason to expect.
3. **Latency is the real cost.** If `--effort` is ever revisited, weigh the +31% wall-clock — on the
   autonomous overnight loop that compounds across a chain.
4. **No git commits made.** Per the repo's shared-branch convention (prior tickets' work artifacts and all
   `runs/` dirs are uncommitted in the tree, and `design-learnings.md` was concurrently edited by the
   T-014-01 thread mid-task), commits are left to Lisa. The `--effort` source diff in `sdk-binding.mjs` and
   `run.mjs` is staged-by-edit only; a reviewer should confirm it lands in a commit.

## Recommendation

Accept the wiring (it's the minimal, default-safe knob the seam was missing and is now available for any
future metered/effort study). Accept the verdict: **do not adopt `--effort high` as a default.** The single
recommended next detail experiment remains the **whole-facade fenced ornament pass** (P15), not a
deliberation knob.
