# T-111-01 closure-milestone — Structure

File-level blueprint. Two kinds of change: (A) one scoped code fix (church settle seam) with its
pure core + tests, (B) regenerated live records/evidence via existing named runs. No new runners,
no schema changes, no gate-side edits.

> **ADDENDUM (post-`ccb198e`, see design.md):** Section A is **cancelled in full** — S-113
> (T-113-01) owns the vocabulary-authority fix; T-111 ships no source-code changes. Section B,
> C, and the ordering in D stand, minus steps 4–5's code half: D becomes 1→2→3(skipped)→
> chains→receipts→evidence→review. The church chain's expected terminal state is the honest
> settle refusal, distilled into `reconstructed/church.json` (instrument "untouched (no gate
> ran)"; after-side census on the last-completed artifact per the runner's named-fallback
> branch).

## A. Code

### `src/view/settle-account.mjs` — NEW (pure)

The settle convergence accounting, extracted from the inline closures in styled-milestone.mjs
(:124–133) so it is unit-testable (project convention: pure cores tested, impure wiring proven by
`--repro`). Public interface (final names settle after the diagnostic, boundaries fixed):

- `ownVocabulary(policy)` → `Map<zone, Set<bareBlock>>` — `{dominant} ∪ preserve` per zone,
  **in shipped space** (input is the already-substituted policy the chain runs; the function
  asserts nothing about naming, it just derives — the substitution point stays where it is,
  durable-skin.mjs, "THE one renaming point").
- `classifyFill(placements, occBefore, {zoneOf, own, toleratedSites})` →
  `{foreign: [...], tolerated: [...], ownRecolor: n}` — a fill placement over a block outside the
  zone's own vocabulary is foreign **unless** its cell is a `toleratedSites` member (the dressing
  run's non-gating slot cells — lintel/sill — i.e. exactly the ping-pong the kit-presence checker
  tolerates). Each foreign entry carries `{pos, zone, cur, block}` so non-convergence errors can
  name cells, not just counts.
- `gatingCount(dressReport, GATING_SLOTS)` — unchanged math, moved.
- `settleWants({frame, fillClass, gating})` → `{frame, foreign, gating, total}` — the zero-target
  composition (kept trivially pure so the test pins the contract: tolerated ≠ foreign,
  own-recolor ≠ foreign, target is still an exact 0).

CONTINGENCY: if the diagnostic refutes H1/H2 (e.g. fill genuinely overwrites frame lines), the
module still lands (the accounting extraction is correct regardless) and the additional fix goes
to the measured op (`placement-grammar.mjs` fill exclusion or `dress-openings.mjs`) — recorded as
a plan deviation with the measurement.

### `src/view/settle-account.test.mjs` — NEW

Synthetic-exact tests: own-vocab derivation (multi-zone, preserve unions, bare-name handling);
foreign vs tolerated vs own-recolor classification (incl. the church-shaped case: sill cells
re-filled every pass → tolerated; a genuinely foreign block in the same zone → still counted;
empty toleratedSites → byte-identical to the old accounting); gating slots; zero-target
composition. Determinism (same inputs → same outputs, no iteration-order leaks).

### `benchmarks/sculpture/styled-milestone.mjs` — MODIFIED

Settle loop (:110–155) consumes the pure core: builds `toleratedSites` from the iteration's own
`dressAgain` non-gating placements (and the initial `dress` on iteration 1), replaces the inline
`ownOf`/`foreignFill`/`gatingDressing` with the module calls. **Unchanged:** the fixpoint
zero-target, the bound (4), the THROW message shape (now with named cells appended), trail
recording, double-run byte-equality, `--repro`/`--offline` semantics, gate spawn. If H2 (naming
space) is confirmed, the one-line source correction happens here too (pass the substituted policy
the chain already holds, not the named-space registry object) — the substitution function itself
is not duplicated.

### `benchmarks/sculpture/durable-skin.mjs` — MODIFIED ONLY IF H2 measured

If the diagnostic proves the policy object settle receives is named-space, the fix is wiring the
existing substituted policy through `gOpts` — no new mapping code. Coverage gates, registry data,
kit/zone records: untouched.

### `docs/active/work/T-111-01/diagnose-settle.mjs` — NEW (work-dir, not committed to benchmarks/)

Throwaway diagnostic: re-runs the deterministic chain in-process to the settle entry (reusing the
runners' exported stage functions + on-disk church intermediates), then dumps per-cell
`{pos, zone, cur, fillBlock, ownVerdict, dressingSlot}` for the frame-14 and foreign-170
populations. No gate, no judge, no record writes.

## B. Regenerated records & evidence (existing named runs)

| Path | How | Note |
|---|---|---|
| `benchmarks/sculpture/roof/church.{json,md}`, `roof/church/artifact.json`, ridge/end frames | `npm run roof:church` (+`--repro`,`--offline`) | first cut under T-108+T-109 cores; per-component fit/fallback recorded |
| `benchmarks/sculpture/styled/<s>.{json,md}`, `styled/<s>/*artifact*.json`, component-plan | spawned by `reconstructed:<s>` | church's currently-untracked `styled/church/*` gets committed with the fresh run |
| `benchmarks/sculpture/multi-angle/<s>-styled.json` + `pr/assets/frames/multi-angle-<s>-styled.png` | spawned gate, ONE judge pass per view | church: first styled-label gate record |
| `benchmarks/sculpture/reconstructed/<s>.{json,md}` + `reconstructed/<s>/` sheets | `npm run reconstructed:<s>` | instrument diff embedded per record |
| `pr/assets/frames/reconstructed-<s>-{before,after}.png` | runner copies | overwritten by fresh runs (before = E-26 baseline, unchanged convention) |
| `pr/assets/frames/closure-<s>-before.png` ×3 | `cp` of committed `reconstructed-<s>-after.png` BEFORE any live run | provenance = HEAD blob, named in the epic sheet |
| `pr/assets/frames/closure-<s>-after.png` ×3 | `cp` of fresh after-sheets | |
| `pr/assets/closure-milestone.md` — NEW | authored | verdict movement (E-27→E-28), metrics vs AC3 baselines, fit errors, instrument statement, repro receipt |
| `docs/knowledge/design-learnings.md` — MODIFIED | authored after outcomes | E-28 section (E-26/E-27 shape) + E-12 handoff |

## C. Boundaries / invariants

- **Gate-side untouched**: `multi-angle-gate.mjs`, `src/form/multi-angle-gate.mjs`,
  `src/config.mjs`, kit-presence core — zero edits. The instrument-diff in each fresh record is
  the proof, not an assertion.
- **No subject constants**: the settle fix is expressed in checker-tolerance terms (slot classes,
  vocabulary sets) — registry data and committed records are not edited to make the church pass.
- **Roof cores untouched**: T-108/T-109 modules consumed as-is; `roof:{cottage,gatehouse}` not
  re-run (already at-core; `--offline` asserts only).
- **Record schemas**: all regenerated records keep their existing `schema` ids (additive nothing).

## D. Ordering (binding for the plan)

1. Evidence pre-capture (closure-before copies) — MUST precede any live run (overwrite hazard).
2. Baseline `npm test` green at HEAD.
3. `roof:church` + its repro/offline asserts; inspect/commit.
4. Diagnostic on the church settle populations (read-only).
5. Settle accounting core + tests + runner wiring; `npm test` green; commit. (No chain runs yet.)
6. `reconstructed:cottage` → `:gatehouse` → `:church`, each once live; commit per subject
   (records + sheets + regenerated styled/multi-angle outputs).
7. `--repro` then `--offline` per subject; commit any receipt-only deltas.
8. closure frames-after copies + `pr/assets/closure-milestone.md`.
9. `design-learnings.md` E-28 section; final `npm test`; commit.

Rationale for 5-before-6: the chains must embed the final construction code so each subject is
judged exactly once (D3). Rationale for 3-before-6: the styled chain consumes `roof/church/
artifact.json` from disk; the new roof must exist before the church chain runs.
