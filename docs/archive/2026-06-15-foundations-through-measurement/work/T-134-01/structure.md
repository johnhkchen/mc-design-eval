# T-134-01 — steep-pitch-construct — Structure

Phase artifact 3/6. File-level blueprint; interfaces; ordering.

## New facts surfaced since design (bind the blueprint)

- compile's band declarations auto-set `mixed: true` for any multi-block y-slice
  (compile.mjs:318-323) — the roof band is already mixed; courses-even is structurally
  compatible with steep, the test just has to prove it.
- `roofBlocks(pack, idiomName, fieldBlock)` (compile.mjs:86-92) keys by **exact idiom name** into
  `pack.idioms[].params.blocks` and only uses the row when `row.field === fieldBlock`. Without a
  fallback, `roof.gable.steep` always gets `stairs: null` → treadless emission. The steep idiom
  must fall back to the `roof.gable` row (D5/D9 risk, now confirmed required).
- **The committed rustic barn build has zero stair blocks** (its program's
  `fieldRole: "roof.trim"` → dark oak ≠ the rustic gable row's spruce → full-block fallback);
  the saltcrag barn has 1,153 (its row is dark oak and matches). So the steep realization's
  primary subject is `barn--saltcrag`; the rustic barn records a **named refusal** (no stair
  family) — an honest E-33 finding feeding S-133, not a failure of this ticket.
- The steep classes are integer ⇒ no half-steps ⇒ **slab never required** by this brush
  (saltcrag's row has no slab — fine).
- Render helper exists: `renderViews(artifact, angles, opts)` in `src/view/multi-angle.mjs`;
  gate azimuths from `MULTI_ANGLE_GATE` (src/config.mjs).
- Brush-count pin: `src/pack/brush-contract.test.mjs:215-222` ("22 brushes", "12 constructs +
  10 passes") → 23 / 13 constructs.

## Files created

### 1. `src/view/roof-steep.mjs` — the brush (pure)
```
export const STEEP_PITCH_CLASSES = Object.freeze([2, 3]);   // realizable (rise:run, >45°)
export const STEEP_REFUSALS = Object.freeze({                // named refusal reasons (data)
  nonInteger: "...slab-serrated courses are refused by construction...",
  shallow:    "...≤ 1 is not steep — roof.gable owns 1 (stair) and 0.5 (slab)...",
  cliff:      "...> 3:1 reads as a wall, not a roof...",
  hip:        "steep hip/pyramid are not offered (corner states unproven at multi-rise steps)",
});
export function roofSteepGableConstruct(spec) → { cells, counts, capKeys, bandFloor, ridgeY }
```
Spec: `{ footprint:{x0,x1,z0,z1}, ridgeAxis:"x"|"z", eaveY:int, ridgeY:int, pitch:2|3,
blocks:{field, stairs, slab?} }`. Fail-loud gates, in order:
footprint/eaveY/ridgeAxis/blocks shape (thatch-style local checks); `pitch` ∈
STEEP_PITCH_CLASSES with the three named refusals above; **`blocks.stairs` required** (a
treadless steep wedge is a cliff, not the stepping family — refusal names the missing stair
family, the roofFamily full-block fallback explicitly does NOT apply here);
`ridgeY > eaveY` and `(ridgeY − eaveY) % pitch === 0` (off-stepping ridge = named refusal).
Body: `gableRecord(...)` (imported from roof-generate) → `generateRoof([g], family)` →
**steep invariant post-check** (every non-cap slope column tops with
`{facing: uphill, half:"bottom", shape:"straight"}` stair; exposed riser run = pitch−1; throw on
violation — guards against future roof-generate drift). PURE; byte-stable (generateRoof order).

### 2. `src/view/roof-steep.test.mjs` — the proof
- ST1 orientation matrix: ridgeAxis {x,z} × pitch {2,3} × perp-span parity {odd,even} — tops
  monotone ±pitch from both eaves; stair tread + facing per column on **both** sides (all four
  facings exercised); riser exposure = pitch−1; states ∈ proven vocabulary.
- ST2 ridge caps: capKeys 1-per-ridge-column (odd span) / 2-wide cap (even span); never a tread.
- ST3 verges: gable with fitted `ends` at pitch 2 — trim past verge tip; sheet strip
  surface-course-only (open underside).
- ST4 gable ends: end-face cross-section solid to the ridge (no holes).
- ST5 dormer composition: steep main roof + compile-shaped dormer spec (wall-plane front, 1×1
  aperture) — cheeks/ridge embedded in wedge mass, aperture a sealed niche.
- ST6 courses-even: `coursesEvenCheck` passes over the steep emission with compile-shaped
  declarations (roof band, mixed).
- ST7 refusals: pitch 1.5 / 1 / 0.5 / 4 / non-finite; missing stairs; off-stepping ridgeY —
  each throws the named finding.
- ST8 determinism + byte-stability: two runs identical cell order.
- ST9 plateau cap: ridgeY below pitch·half-span (multiple of pitch) — wide cap allowed, invariant
  holds (cap columns exempt).

### 3. `benchmarks/sculpture/steep-pitch.mjs` — evidence runner (impure wiring only)
CLI: `--subject barn [--pack packs/saltcrag.json] [--repro|--offline]`. Flow per subject:
1. Read committed `recognition/<key>.program.json` + pack (read-only; pin-guard: writes only to
   new paths).
2. **before** = `seedWorkshopProgram({program, pack})`; **after** = same with the subject's roof
   patched in memory (`idiom: "roof.gable.steep"`, `pitchClass: 2`) through the same seam.
   A construct refusal (rustic stairs-null) is caught and recorded as
   `{status:"refused", finding}` — exit 0, the honest-fallback convention.
3. Determinism: pure core run twice, sha256 over both serialized artifacts recorded; `--repro`
   recomputes and compares; `--offline` re-asserts committed hashes.
4. Record: `benchmarks/sculpture/steep-pitch/<key>.{json,md}` — demand evidence (brief text;
   concept ≈2:1; sketch 45° + TRELLIS-flattening note; T-133 pending), before/after ridgeY,
   eave:ridge ratios, counts (stairs/full), conformance verdicts (incl. courses-even), shas.
   After-artifacts to `steep-pitch/<key>/after-artifact.json`.
5. Renders (best-effort GL, evidence only): 4-view sheets at MULTI_ANGLE_GATE azimuths via
   `renderViews`, committed as `pr/assets/frames/steep-<key>-{before,after}.png`. GL failure =
   loud stop (the AC needs frames), never silent.

## Files modified

### 4. `src/view/roof-generate.mjs`
Move in `gableRecord` + `colsOf` from idiom-registry.mjs verbatim (exported); JSDoc noting the
program-gable record shape now lives beside its consumer. No emission change.

### 5. `src/pack/idiom-registry.mjs`
- Import `gableRecord` from roof-generate (delete the private copy + `colsOf`).
- `roofGableConstruct`: add `pitch > 1` refusal naming `roof.gable.steep`; paramsSchema pitch
  gains `maximum: 1`. (`roof.hip`/`roof.pyramid` untouched.)
- Import `roofSteepGableConstruct`; new frozen entry `"roof.gable.steep"`:
  source/tests → roof-steep files, CONSTRUCT_IO, `preview: { card: ["gable-steep-z",
  "gable-steep-x", "gable-steep-3"] }`, paramsSchema `{ pitch: { enum: [2, 3] },
  blocks: BLOCKS_FRAGMENT }`.

### 6. `src/pack/idiom-card.mjs` — three IDIOM_CARD_SPECS entries (ROOF_BLOCKS, local coords):
`gable-steep-z` (footprint x0..6/z0..5, ridgeAxis z, eaveY 0, pitch 2, ridgeY 6),
`gable-steep-x` (transpose), `gable-steep-3` (5-span, pitch 3, ridgeY 6).

### 7. `src/pack/idiom-registry.test.mjs` — SYNTH_SPECS entry for `roof.gable.steep`
(minimal: 7×5 footprint, pitch 2, ridgeY 6, spruce family).

### 8. `src/pack/brush-contract.test.mjs` — baseline 22 → 23, "13 constructs + 10 passes",
growth-history comment extended (T-132 precedent).

### 9. `src/recognition/program.mjs` — `ROOF_LAYOUTS["roof.gable.steep"] = { ridge: true,
gableEnds: true }`.

### 10. `src/recognition/compile.mjs` — `roofBlocks` falls back: when no row matches
`roof.gable.steep`, resolve via the `roof.gable` row (same field-match rule). One commented line.

### 11. `src/pack/style-pack.mjs` — `REALIZABLE_PITCHES = new Set([0.5, 1, 2, 3])`; message:
"(0.5 slab, 1 stair — roof.gable; 2/3 steep — roof.gable.steep)".

### 12. `package.json` — scripts `steep:barn`, `steep:barn:saltcrag` (+ `--` repro variants used
ad hoc, no dedicated script needed).

### 13. Regenerated/committed artifacts
`benchmarks/sculpture/brush-catalog/{catalog.json, record.json, brush-catalog.md, *.png}`
(`npm run brush:catalog`); steep-pitch records + after-artifacts; two frame sheets ×2 subjects.

### 14. Ripple updates (expected, test-only — never committed records)
Any test pinning: registry size/name list, ROOF_LAYOUTS error text ("have: …"), style-pack
pitch message, idiom-card spec count, catalog coverage; the BAML registry fixture if it snapshots
brush names (T-132 hit this — same fix shape). Found by running the suite at each step.

## Module boundary summary

```
src/form/roof-fit.mjs            (untouched)
   ↑
src/view/roof-generate.mjs       (+ gableRecord, colsOf — shared record builder)
   ↑                       ↑
src/view/roof-steep.mjs    src/pack/idiom-registry.mjs   (registry imports both)
   ↑                       ↑
src/pack/idiom-card.mjs (specs)  src/recognition/{program,compile}.mjs (layout row, blocks fallback)
   ↑
benchmarks/sculpture/steep-pitch.mjs (impure runner; reads committed pins, writes new paths)
```

## Ordering (matters)

1. `gableRecord` extraction (pure refactor; suite green proves byte-identity).
2. roof-steep module + ST tests (registry-independent; testable alone).
3. Registry entry + card specs + SYNTH_SPECS + baselines + ripple fixes + catalog regen.
4. Demand-side surfaces: roof.gable tightening, ROOF_LAYOUTS, roofBlocks fallback,
   REALIZABLE_PITCHES (+ their test ripples).
5. Evidence runner + records + frames (needs 1–4 landed).
6. Full suite + formation/patternbook offline replays + commit hygiene.
