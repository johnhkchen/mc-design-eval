# T-145-01 Structure — file-level blueprint

The shape of the code, not the code. Ordering is the commit order (each step green on its own).
Convention: pure modules under `src/**` run in the test glob (no GL/IO/Date/random); the live runner
is impure under `benchmarks/`.

## S1 — Schema: optional per-mass `facade` (additive)

**Modify `schema/building-program.schema.json`.**
- Add to each mass's `properties` an optional `facade` object (NOT in `required`):
  - `eaveOverhang`: `{type:integer, minimum:0, maximum:8}`.
  - `faces`: array (`maxItems:4`) of face objects, each `required:[wall, rhythm, memberRole,
    evidence]`, `additionalProperties:false`:
    - `wall`: `$ref #/$defs/wall`.
    - `rhythm`: `oneOf [ {required:[period,phase]}, {required:[count]} ]`, each
      `additionalProperties:false`; `period/phase/count` positive integers.
    - `memberRole`: `$ref #/$defs/role`.
    - `fields`: `{required:[role]}` | `null`.
    - `quoins`: `{required:[role, run]}` | `null` (`run` posInt).
    - `courseLines`: array of `{required:[y, role]}` (`y` integer ≥0).
    - `jettyDepth`: `posInt` | `null`.
    - `openingsRhythm`: `{required:[period, phase]}` | `null`.
    - `evidence`: `{required:[source, layoutOnly], additionalProperties:false}`;
      `source: enum ["concept","textured-glb","pack-idealised"]`; `layoutOnly: boolean`.
- Reuse existing `$defs.role`, `$defs.wall`, `$defs.posInt`. **No `block` property anywhere** — the
  structural diegetic proof (design D2).

**Tests:** extend `src/recognition/program.test.mjs` — a program with a valid `facade` passes
`assertBuildingProgram`; one with a `block` key inside `facade` is rejected (additionalProperties);
absence of `facade` still passes (legacy).

## S2 — Program-level validation + diegetic proof

**Modify `src/recognition/program.mjs`.**
- New exported `FACADE_DEFAULTS`/bound helpers: `facadeBounds(pack)` derives `{periodMin, periodMax,
  maxOverhang, maxJettyDepth, maxQuoinRun}` from `pack.proportions.articulation` if present, else
  from `openingRhythm` + `storeyHeight.max` (design D6) — pure, pack-carried, no building constants.
- New exported `assertFacadeDiegetic(program, pack)` → `{ok, findings}`: per face, (a) no block ids
  (defensive), (b) every role ∈ palette, (c) `source==="textured-glb"` ⇒ `layoutOnly===true`.
- Extend `validateProgramAgainstPack`: when a mass has `facade`, validate each face — roles ∈ palette
  (reuse `checkRole`), wall ∈ the mass's plan, rhythm period/count within `facadeBounds`,
  `eaveOverhang ≤ maxOverhang`, `quoins.run ≤ maxQuoinRun`, `jettyDepth ≤ maxJettyDepth`,
  `courseLines[].y < storeys*storeyHeight`, and fold in `assertFacadeDiegetic` findings. Every finding
  an ERROR (the re-ask loop needs a verdict).

**Tests:** extend `src/recognition/program.test.mjs` — off-palette member role rejected; period
beyond pack bound rejected; `textured-glb` face with `layoutOnly:false` rejected; a clean facade
passes; `facadeBounds` falls back correctly when `articulation` absent.

## S3 — Pack schema: optional `proportions.articulation`

**Modify `schema/style-pack.schema.json`.**
- Add optional `articulation` to `proportions.properties` (NOT in `proportions.required`):
  `{memberPeriod:{$ref intRange}, maxOverhang:int≥0, maxJettyDepth:int≥1, maxQuoinRun:int≥1}`,
  `additionalProperties:false`. Absence = the fallback path (S2). Keeps every committed pack valid.

**Tests:** extend `src/pack/style-pack.test.mjs` — a pack with `articulation` validates; a pack
without it validates (fallback). No change required to shipped packs.

## S4 — Recognition step (pure): prompt builder + parse

**Create `src/recognition/facade-grammar.mjs`** (mirrors `prompt.mjs`):
- `export const FACADE_REPLY_BUDGET = MAX_REPLY_ATTEMPTS`.
- `export function unseenFaces(program)` — per mass, the walls the single 3/4 concept view never
  shows (back + the two sides + roof), deterministic from mass geometry/orientation.
- `export function facadeDigest(program, pack, {seenFaces})` — prose vocabulary: masses + walls,
  seen-vs-unseen faces, the pack's admissible roles + articulation bounds, the facade sub-schema.
- `export function facadeRenderArgs({program, pack, sketch})` → `{facade_digest, schema_json}`.
- `export function mergeFacade(program, facadeByMass)` — pure deep-merge of a `{massId: facade}` map
  into a clone of the program; returns the new program (no mutation).
- `export function parseFacadeReply(text, {program, pack, registry})` — strip → JSON → `mergeFacade`
  → `assertBuildingProgram` → `validateProgramAgainstPack` (incl. facade) → return merged program.
  Throws on any violation (the ledger's evidence).

**Create `src/recognition/facade-grammar.test.mjs`:**
- `facadeRenderArgs` shape + sha-stable digest (byte-deterministic across runs).
- `mergeFacade` is pure (input frozen-safe, output distinct).
- `parseFacadeReply` accepts a good reply, rejects off-vocabulary / non-diegetic / off-bound.
- reply-policy integration: a malformed-then-malformed sequence through `runReplyPolicy` REFUSES
  (null verdict), never re-rolls; a malformed-then-good sequence accepts on attempt 2.

## S5 — Textured-GLB render seam (pure plan + impure leaf)

**Create `src/recognition/facade-render.mjs`:**
- PURE `export function texturedGlbRenderPlan({glbPath, azimuths, palette})` → a recorded plan
  `{glb, method:"voxel-colour-splat", azimuths, layoutOnly:true, note:"layout evidence, not relief"}`.
- IMPURE leaf `export async function renderTexturedGlbViews({glbPath, palette, azimuths, outDir,
  label})` — lazy-imports the GLB decode + `glbVoxelOccupancy` (`src/view/glb-splat.mjs`) +
  `renderViews` (`src/view/multi-angle.mjs`); returns `{plan, views:[{angle, path, sha256, bytes}]}`.
  Mirrors `multi-angle.mjs`'s pure-table / impure-render split so the test glob stays GL-free.

**Create `src/recognition/facade-render.test.mjs`:** the pure plan only (azimuths echoed, layoutOnly
true, method tagged). The impure leaf is exercised by the runner, not the unit glob.

## S6 — The runner (impure)

**Create `benchmarks/sculpture/facade-grammar.mjs`** (mirrors `recognize.mjs`):
- LIVE: load the committed recognition program + pack + sketch + concept PNG; render the textured-GLB
  azimuth views (S5); `requestTextWithImage` STRONG tier with concept + GLB-view images; drive
  `runReplyPolicy(parse: parseFacadeReply)`; write the merged program, the facade-replies ledger
  (full raw texts), the prompt (sha), the render seam, and the **diegetic receipt**
  (`assertFacadeDiegetic`). Pin-guarded writes (`guardedWriteRecord`/`preflightPins`, `--rotate-pins`).
  `--tier light` knob enables per-face confirmation asks (default: single strong ask).
- `--offline`: committed facade-reply → `parseFacadeReply` against the committed base program →
  byte-compare the merged program against the committed merged program + re-run the diegetic receipt.
  No model, no writes.
- Fallback (D5): render-throw or unreadable face ⇒ `evidence.source:"pack-idealised"`, recorded in a
  `fallback` block; never fatal.
- E-25 Rule 3 self-grep: no subject keys in the runner source.
- `package.json`: add `facade-grammar:offline` (and per-subject) scripts mirroring `recognize:*`.

**Create `benchmarks/sculpture/recognition/facade/<subject>.*`** committed records (program, reply,
prompt, render seam, receipt) for the offline replay — the byte-identity pins.

## S7 — Offline replay fixture (the AC's byte-identical test)

**Create `src/recognition/fixtures/facade/{base-program.json, reply.txt, expected.json,
prompt.txt}`** + wire into `src/recognition/facade-grammar.test.mjs`: `parseFacadeReply(reply.txt,
{program: base})` deep-equals `expected.json` AND `JSON.stringify` byte-matches the committed
`expected.json` — offline, no model. Pins the recorded-reply → grammar contract.

## Ordering & atomicity

1. **S1+S3** schema (additive) — green: existing programs/packs still validate.
2. **S2** program validation + diegetic proof — green: new rejections + clean-facade accept.
3. **S4+S7** recognition pure core + offline fixture — green: parse/merge/replay.
4. **S5** render seam — green: pure plan test.
5. **S6** runner + committed records + npm scripts — green: `--offline` byte-identical.

Each step commits independently; the realize path and every committed artifact are untouched
(facade is recorded, not realized — design D0), so `--repro`/`--offline` stay byte-identical
throughout. `npm test` must be green after each step.

## Files touched (summary)

- Modify: `schema/building-program.schema.json`, `schema/style-pack.schema.json`,
  `src/recognition/program.mjs`, `src/recognition/program.test.mjs`,
  `src/pack/style-pack.test.mjs`, `package.json`.
- Create: `src/recognition/facade-grammar.mjs` (+ `.test.mjs`),
  `src/recognition/facade-render.mjs` (+ `.test.mjs`),
  `src/recognition/fixtures/facade/*`, `benchmarks/sculpture/facade-grammar.mjs`,
  `benchmarks/sculpture/recognition/facade/*`.
- Untouched on purpose: `src/recognition/compile.mjs`, `src/workshop/program.mjs` (realize),
  `src/pack/conformance.mjs` (the proof is program-level, design D2), all committed artifacts.
