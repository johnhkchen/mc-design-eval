# T-133-01 measured-proportions — Structure

## Files

### Created

1. **`src/recognition/measured-program.mjs`** — the pure seam. No I/O, no model, no GL, no subject
   keys. Exports (public interface):
   - `MEASURED_PROGRAM_SCHEMA = "measured-program/v1"`
   - `sketchBlocksFactor(sketch)` → `registryScale / sampleScale` (unit conversion; throws if
     either param is absent — malformed sketch fails loudly).
   - `sketchMeasurements(sketch)` → normalized, registry-block measurements:
     `{eaveBlocks, heightBlocks, plan: {w, d}, pitchRatio, primaries: [{id, bbox, pitchRatio,
     eaveBlocks?}], storeyCandidates}` — `null` for any measurement the sketch lacks (the
     fallback trigger). Plan = `round(planDims × factor)`.
   - `factorEave({eaveBlocks, recognizedStoreys, packBand})` → `{storeys, storeyHeight, used,
     residual}` — exhaustive search storeys 1..4 × sh 2..6, min `|n×sh − eave|`; ties: sh in band,
     then `|n − recognizedStoreys|`, then smaller n. Pure arithmetic, unit-tested exhaustively.
   - `snapPitch(ratio, pitchClasses)` → `{pitchClass, residual}` — nearest class; ties to the
     smaller class (deterministic).
   - `scaleFootprint(masses, target)` → `{rects: Map<id, rect>, applied: {x: bool, z: bool},
     notes}` — per-axis endpoint scaling + rounding; returns unapplied axes (caller records
     fallback) when feasibility re-checks fail.
   - `applyMeasuredProportions({program, sketch, pack})` → `{program, dimensions, conflicts}`:
     the revised building-program/v1 (frozen), the per-parameter source ledger, the recognition-vs-
     sketch conflict list. Runs `assertBuildingProgram` on its own output; runs
     `validateProgramAgainstPack` and tolerates only the findings its conflict ledger predicts
     (storeyHeight band), throws on anything else.
   - `silhouetteRatios(workshopProgram)` → `{ridgeToEave, roofShare, aspect}` from compiled
     geometry (max ridgeY / eaveY over roof elements, occupied shell bbox). Consumed for
     before/after/target rows; numbers rounded to 4 dp for byte-stable records.
   - `measuredProgramRecord({ticket, subject, pack, programSha, sketchSha, applied})` → the
     `measured-program/v1` record object (sorted, byte-stable shape).

   Internal (not exported): ledger-entry constructor enforcing `{mass, parameter, source,
   measured, used, residual, note}` shape; bbox/overlap helpers for the multi-primary mapping;
   lane-feasibility re-check reusing `openingLanes`/`headRows` from `./program.mjs` and the
   pack's `openingRhythm` (no duplicated rules — imports, never copies).

2. **`src/recognition/measured-program.test.mjs`** — unit tests, `MP1…` naming, node:test +
   assert/strict, inline synthetic fixtures (a minimal pack, program, sketch — no file I/O).
   Coverage in Plan §Tests.

3. **`benchmarks/sculpture/measured-proportions.mjs`** — the runner (the named runs). Imports:
   `loadStylePack`, `parseProgramReply`, `seedWorkshopProgram`, `recognitionRels`, `packNs`,
   `DEFAULT_PACK_REL`, `chainRels` (for the *before* seed path), pin-guard quartet, `SUBJECTS`,
   the seam module, `renderViews` (dynamic import, evidence-only). Structure mirrors
   pattern-book.mjs: stages pure-of-GL, `runLive` / `runRepro`, CLI tail, self-grep. Record paths
   derived by a local `measuredRels(key, packRel)` helper built on `packNs` (same shape as
   `recognitionRels`, base `benchmarks/sculpture/measured/<runKey>`):
   `{runKey, program, artifact, record, md}` + view PNGs `view-<runKey>-<angle>.png`.

### Modified

4. **`package.json`** — four scripts:
   - `measured:cottage` / `measured:barn` → `node benchmarks/sculpture/measured-proportions.mjs --subject <key>`
   - `measured:repro` / `measured:offline` → `… --all --repro|--offline`

5. **`docs/knowledge/design-learnings.md`** (or the epic's journal home, matching E-32 precedent) —
   one section at Review time. *(Only if the repo's convention expects it at ticket level — check
   at implement; E-32 wrote design-learnings per milestone ticket. If owned by S-138, skip.)*

### Explicitly untouched

- `schema/building-program.schema.json`, `src/recognition/program.mjs`,
  `src/recognition/compile.mjs`, `src/workshop/seed.mjs`, `src/workshop/program.mjs`,
  `benchmarks/sculpture/pattern-book.mjs`, all committed records under `recognition/`,
  `workshop/`, `pattern-book/` — AC 4's "prior pins valid" is enforced by not editing them.

## Record shapes

### `measured/<runKey>.program.json` — `measured-program/v1`

```json
{
  "schema": "measured-program/v1",
  "ticket": "T-133-01",
  "subject": "<key>", "pack": "<style>",
  "inputs": {
    "recognitionProgram": { "path": "...", "sha256": "..." },
    "sketch": { "path": "...", "sha256": "..." }
  },
  "program": { "schema": "building-program/v1", "...": "the revised program" },
  "dimensions": [
    { "mass": "*|<id>", "parameter": "footprint.w|footprint.d|eaveHeight|storeyFactorization|pitchClass|ridgeHeight(derived)",
      "source": "measured|fallback", "measured": 19.3, "used": 20, "residual": 0.7, "note": "..." }
  ],
  "conflicts": [
    { "mass": "<id>", "parameter": "...", "recognition": 8, "sketch": 19.3, "resolved": "sketch", "note": "..." }
  ]
}
```

### `measured/<runKey>.record.json`

Run receipt: schema `measured-proportions/v1`, ticket, runKey, input shas, program/artifact paths +
shas, seed conformance `{passed}`, `ratios: {before, after, target}` (each
`{ridgeToEave, roofShare, aspect}`; `before: null` when no committed chain seed exists),
renders `[{angle, path, sha256}]` or `renderError`, `generalization` self-grep, replay line.
`.md` is the human digest (table of dimensions with sources, ratio rows, render links).

### `measured/<runKey>.artifact.json`

The measured seed's realized artifact, `serializeArtifact`-stable — the byte-compare target for
`--repro` (the seed's workshop-program serialization is embedded in the record's sha receipt; the
artifact file is the render/inspection substrate, mirroring `recognition/<key>.artifact.json`).

## Data flow (live)

```
form-sketch/<key>.json ──┐ (sha-receipted)
recognition/<runKey>.program.json ── parseProgramReply (live gates) ──┐
                         └───────► applyMeasuredProportions(program, sketch, pack)
                                        │  {program', dimensions, conflicts}
                                        ▼
                          seedWorkshopProgram({program', pack})   (conformance must PASS)
                                        │
                ┌── silhouetteRatios(after) ── vs before (workshop/<runKey>/program.json, if any)
                │                              vs target (sketch numbers)
                ▼
   measured/<runKey>.program.json / .artifact.json / .record.json / .md / view-*.png
   (preflightPins → guardedWriteRecord; renders evidence-only)
```

`--repro`: same derivation, byte-compare each committed file (renders excluded), no writes.

## Ordering of changes

1. Seam module + tests (self-contained; `npm test` green before any runner exists).
2. Runner + npm scripts (first run writes are free under pin-guard).
3. Live runs for the two named subjects; inspect renders; commit records.
4. Repro/offline sweeps + full-suite green; review.

## Boundary notes

- The seam imports from `./program.mjs` (gates, lanes) and `../pack/*` nothing directly — pack is
  data. It must NOT import compile (the ratio helper takes the *compiled* program as an argument;
  the runner does the compiling via `seedWorkshopProgram`). Keeps the dependency direction:
  measured-program → program contracts, runner → everything.
- The runner never names `multi-angle-gate` verdict paths, never spawns the workshop or judge —
  keeps the isolation receipt's spirit; no entry in `isolation.test.mjs`'s scan set is needed
  (it scans `src/workshop/*` + pattern-book.mjs; verify at implement that adding nothing there
  is correct).
- `chainRels` is consumed read-only for the *before* seed; absence → `before: null` (no chain
  dependency; a fresh subject can run measured-first).
