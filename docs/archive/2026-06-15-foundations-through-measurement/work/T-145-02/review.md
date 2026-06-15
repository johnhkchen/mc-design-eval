# T-145-02 Review — storey-aware facade recognition

Handoff for a human reviewer. What changed, what's tested, what's deferred, what to watch.

## Summary

The facade grammar can now carry a **storey band** per face, the recognition prompt teaches the model
to emit it, the compiler threads it into the relief brushes, and the brushes restrict the frame/field
relief to that band. The result: half-timber studs land on the plaster *upper* storey and stay off the
plinth and out of the roof — the spike's "timber cage" failure mode is structurally prevented. The
mis-rolled barn grammar is corrected (stone piers, not timber). A judge-free render proves the cottage
look. `npm test` is green at 2138/2138.

## Files changed

**Feature (deterministic core):**
- `schema/building-program.schema.json` — optional per-face `band ∈ {ground, upper, all}`. Additive; not
  in `required`; `additionalProperties:false` already present.
- `src/recognition/program.mjs` — `bandYRange(m, band)` (exported): the **single** named-band →
  mass-relative `{yLo,yHi}` mapping (`ground=[0,sh-1]`, `upper=[sh,eaveY-1]`, `all=[0,eaveY-1]`), derived
  from the mass's own `storeyHeight`/`eave` (no per-building constant). Check-9 gains one rule:
  `band:"upper"` needs `storeys ≥ 2`. `assertFacadeDiegetic` untouched (band is geometry, not material).
- `src/recognition/compile.mjs` — `facadeArticulationPlan` computes the band once per face and adds
  `band:{yLo,yHi}` (PURE DATA, no functions — the plan stays replay-stable) to the pilaster / infill-panel
  / quoin params. Whole-mass eave-overhang and belt courses stay positional (no band). Absent band ⇒ no
  key ⇒ byte-identical legacy plan.
- `src/view/facade-articulation.mjs` — module-private `bandZone({yLo,yHi})` builds the y-band predicate;
  `pilaster`/`infillPanel`/`quoin` accept an optional `band` and derive `{zoneOf,zone}` from it (an
  explicit `zoneOf` still wins — the test seam). `infillPanel` gates BOTH the studs and the field recolor.
  `quoin` composes the band with its corner/parity `restrict`. Reports echo `band`.
- `src/recognition/facade-grammar.mjs` — `facadeDigest` teaches the band vocabulary ("name the storey
  band … never name a row number"). The facade sub-schema (handed verbatim) also now carries `band`.

**Data / proof:**
- `benchmarks/sculpture/relief/barn-grammar.json` — de-mis-rolled: `memberRole frame.timber →
  wall.dressing` (dressed-quarry piers), added `fields.role: wall.field.ground` (fieldstone panels),
  `band:"all"` on both faces. Matches the recorded read; schema-valid, pack-clean, diegetic.
- `src/recognition/fixtures/facade/prompt.txt` — regenerated via the production `facadeDigest` (never by
  hand), so the prompt-pin test holds. `expected.json`/`reply.txt` unchanged ⇒ offline replay
  byte-identical.
- `benchmarks/sculpture/facade-relief-proof.mjs` (new) + `pr/assets/frames/beside-concept-cottage-relief.png`
  — judge-free producer: augments the recognized cottage program with the storey-aware grammar, runs the
  REAL compiler band-threading, applies the E-35 brushes over the clean workshop build, renders beside
  concept.

**Tests:** `program.test.mjs` (+3), `compile.test.mjs` (+2), `facade-articulation.test.mjs` (FA10–12),
`facade-build.test.mjs` (+1 end-to-end), `facade-grammar.test.mjs` (+1 digest mention).

## Acceptance-criteria status

- **AC1 — live storey-aware grammar, correct roles per subject:** machinery COMPLETE (schema field,
  prompt clause, validation). Correct roles proven on the barn grammar fix (`wall.dressing` piers +
  `wall.field.ground` field, `band:"all"`) and the cottage proof grammar (`frame.timber` studs +
  `wall.infill.upper` field, `band:"upper"`). **The live `claude -p` pass that EMITS the records is
  deferred** (see Open concerns) — the shim is confirmed available; the deferral is about not committing a
  billed non-deterministic record in an autonomous tail.
- **AC2 — compiler honors the band:** DONE. `facadeArticulationPlan` threads the band; brushes restrict.
  Covered by `compile.test.mjs` (params carry `{yLo,yHi}`) and `facade-build.test.mjs` (every banded
  frame/field placement lands in `[4,7]` end-to-end).
- **AC3 — render proof:** DONE for the cottage (`beside-concept-cottage-relief.png`): studs frame the
  upper plaster storey, stone ground storey clean. Spatial layout only (the brushes operate on the build
  occupancy; no material comes from the GLB). Barn render rides S-159 (its build is holey) — deferred
  per the AC's own note.
- **AC4 — byte-identical offline + fixture + npm test + no constants:** DONE. The fixture replay is
  byte-identical (only `prompt.txt` regenerated, expected/reply untouched). A dedicated `compile.test.mjs`
  guard asserts a bandless facade carries NO `band` key (legacy bytes). The band y-range is derived from
  `storeyHeight`/`eave` (`bandYRange`), not hard-coded. `npm test` 2138/2138.

## Test coverage

- **bandYRange:** all three names for cottage-like (2×4) and barn-like (3×3) masses; null for absent.
- **Validation:** `upper` on a 1-storey mass fails; off-enum band rejected by the schema; a banded facade
  passes the pack gate cleanly.
- **Compiler:** band → `{yLo,yHi}` in the right params; bandless ⇒ byte-identical; plan stays JSON-pure.
- **Brushes:** FA10 (pilaster in-band, and unbanded reaches below — proves the band actually excludes),
  FA11 (infill studs+field in-band), FA12 (quoin band clips the corner run, and unbanded reaches the
  clipped course — proves clipping).
- **End-to-end:** compile → realize → applyArticulation; every banded frame/field/quoin placement in
  `[4,7]`.
- **Gaps:** no automated test of the *rendered pixels* (the render proof is a committed PNG, eyeballed —
  consistent with the repo's judge-free render posture). No test that the LIVE model emits a band (that's
  the deferred producer; the offline replay test would cover it once a record is committed).

## Open concerns / for human attention

1. **Live recognition run is the one remaining producer (AC1's "live").** Run
   `npm run facade-grammar -- --subject cottage --ticket T-145-02` and `--subject barn --ticket T-145-02`,
   confirm each emitted face carries the expected `band` (cottage `upper`, barn `all`) and correct roles,
   commit the records, then `npm run facade-grammar:offline` to pin byte-identical replay. If the model
   omits `band`, the record still validates (band is optional) but would not be storey-aware — re-ask or
   strengthen the digest clause. The machinery, prompt, and schema are all in place; this is a curation
   step, not new code.
2. **Barn render depends on S-159** (generate-first watertightness). The corrected barn grammar is ready;
   the render will look clean only once the barn seed is watertight.
3. **`band` granularity is storey-level (enum), not arbitrary y.** Sufficient for cottage/barn; a future
   subject needing a partial-storey band (e.g. a belt course mid-storey) would want a `{from,to}` form.
   `bandYRange` is the single extension point. Documented in design.md (D1).
4. **Concurrency:** a sibling thread (T-154-01) interleaved commits on `main` during this work. All
   T-145-02 commits are isolated to T-145-02 files; no shared-file overlap. Pre-existing uncommitted
   worktree files (barn artifacts, `.lisa.*`) from prior sessions were left untouched.
5. **Flaky test observed:** `AS1 BUILD_BUDGET` (seed-artifact.test.mjs) failed once under full-suite
   parallelism, passed in isolation and on re-run — the known "budget-edge flappy" test, unrelated to
   this change.
