# T-100-01 kit-aware-gate — Review

## What shipped (4 commits)

| commit | change |
|---|---|
| `ea28265` | `src/view/opening-dressing.mjs` (+test): perOpening reports gain per-slot `placed` counters — NEW placements only, distinct from `applied` (satisfied cells). The idempotence/presence witness. Additive; placements byte-identical; committed dress record still `--offline`-valid. |
| `ebf0077` | **`src/form/kit-presence.mjs`** (new, pure) + `kit-presence.test.mjs` (15 tests): the checker + verdict composition. |
| `e6379f5` | **`benchmarks/sculpture/kit-presence.mjs`** (new runner, no GL/LLM) + `npm run presence:cottage` + committed proof record `kit-presence/cottage.{json,md}` + positive fixture `kit-presence/cottage/dressed-artifact.json`. |
| `a4440f4` | `benchmarks/sculpture/multi-angle-gate.mjs`: presence wired beside the gate; `kitPresence` + `overall` in the record/md/exit code; additive `--offline` consistency check; re-run live cottage-current record + sheet. |

## How it works (one paragraph)

A kit entry is *present at its grammar sites* iff re-running the pure op that supplies it is a
no-op there (the fixpoint rule): `placementGrammar` would paint no frame cells
(painted+adopted = 0) and `zoneFill` would repaint no **foreign** cells in band/roof zones
(panel/course); `dressOpenings` would place nothing per slot (`placed` = 0, fence/shutters/door/
light). Tolerated geometry — respected declared secondaries, skipped broken-line isolates,
no-jamb shutter sides, own-vocabulary sub-minRun residue — is inherited from the ops that define
it, counted, never silent. Absences come back named in the ticket's format. The kit is the
committed `kit/v1` record, handed verbatim (no extraction call exists on any gate path; deep-
freeze unit test). `composeKitAwareVerdict` ANDs presence with the untouched T-093 aggregate:
presence cannot be passed around, cannot replace the judge, and a resemblance refusal stays a
refusal with presence still reported.

## Acceptance criteria — all met

1. **Pure, unit-tested checker; named gaps** — `kitPresence` (15 unit tests); live gaps:
   `missing: spruce_planks frame @ 192/321 frame-line cells`, `missing: spruce_fence infill @
   openings 1/2/3/4/5/6`, `missing: spruce_trapdoor shutters @ openings 1/2/3/4/5/6`.
2. **Wired beside the multi-angle gate, both run/both reported** — presence runs before
   rendering (deterministic, judge-independent); the live cottage record shows presence FAIL
   *and* three judged views (drifted, roof form) *and* the T-088 coverage short-circuit, all in
   one record; exit code from the composed `overall`. The judge is never skipped on presence
   failure; presence is never skipped on judge refusal.
3. **Proof both ways, recorded** — `kit-presence/cottage.json`: the kit-less durable-skin
   cottage FAILS with the named absences above (door/light are recorded honesty skips — the
   cottage doorway is not a through-hole, T-099 D7); the composed pipeline build (committed
   grammar artifact + 38 dressing placements, sha-recorded fixture) PASSES with zero gaps.
   Plus the gate-level negative in `multi-angle/cottage-current.json`.
4. **Kit immutable; `npm test` green; no weakening** — kit loaded committed, verbatim
   (immutability unit test); 1215/1215 tests green; pre-T-100 multi-angle records
   (gatehouse-current, cottage-baseline) still pass `--offline` unchanged; `aggregateMultiAngle`,
   verdict vocabularies, judge prompt, and thresholds untouched.

## Test coverage

- **Unit (pure)**: 15 kit-presence tests (gap naming/indices, fixpoint pass on satisfied
  fixtures, no-jamb + residue toleration, unfulfilled-slot and door-less skips, verdict matrix
  incl. refusal passthrough, immutability, determinism); 2 new assertions in the dressing tests
  (`placed` semantics). Suite: 1199 → 1215.
- **Integration (deterministic)**: `presence:cottage` re-runs the checker twice per side
  (byte-identical), asserts both directions, `--offline` re-asserts record + fixture sha.
- **Integration (metered, once)**: one live `gate:multi --subject cottage` run proving the
  composed path; its record passes the new `kitAware` `--offline` consistency check.
- **Gaps in coverage**: no gatehouse proof run (registry supports it; cottage is the AC
  subject); the `no-concept-bands` / `no-reference-build` skip paths in the gate runner are
  exercised only by the synthetic-hut's `no-kit-record` sibling, not end-to-end.

## Open concerns / follow-ups

1. **Dressing breaks runs (pipeline seam, pre-existing).** Re-opening sealed panes and
   recoloring lintels/sills leaves ~6 adjacent declared-secondary cells below minRun on the
   composed cottage; the fill contract would strip them. The checker tolerates them as
   `tolerated.residue` (own-vocabulary, not missing ingredients) — but a final cleanliness pass
   after dressing (or minRun-aware dressing recolors) would close the seam properly. Candidate
   for S-101.
2. **Deviation from design, documented in progress.md**: the foreign-vs-own-vocabulary
   distinction replaced the design's pre-planned region-scoped fallback when the fixpoint risk
   materialized (root cause was run-breakage, not unskinned reveals). It also sharpened the
   negative — panel/course false-gaps (preserve-family residue) vanished, leaving exactly the
   ticket's expected families.
3. **Presence on `--artifact` overrides**: a `gate:multi --label baseline --artifact <raw>` run
   will (correctly) fail presence — the raw build lacks frame/dressing. That is the gate's
   purpose, but operators re-running the historical baseline label should expect a kit-aware
   FAIL where the old record said only resemblance-FAIL.
4. **Door detection** remains S-101's gap (silhouette-based `openings` can't see the cottage's
   non-through doorway); the checker records it as a named skip, same wording as T-099.
5. The cottage-current resemblance verdict remains FAIL (major roof-form gaps at obliques — the
   known E-25 finding); the kit-aware gate composes with it, so the cottage now needs BOTH the
   E-26 pipeline output (not the bare durable skin) and the roof-form fix to pass end-to-end.

## For the human reviewer

The highest-leverage reads: `src/form/kit-presence.mjs` (the fixpoint + residue rules, ~250
lines), `benchmarks/sculpture/kit-presence/cottage.md` (the proof, human-readable), and the
"Kit presence (T-100)" section of `benchmarks/sculpture/multi-angle/cottage-current.md` (the
wired gate's live output).
