# T-076-01 Structure — resemblance-gate

The blueprint: files, public interfaces, internal organization, ordering. Not code — the shape of the code.

## File map

**Created**
- `src/form/resemblance.mjs` — the **pure core**: perceptual scorer, triptych compose math, verdict parser,
  fixed judge prompt, frozen defaults. GL-free, network-free, RNG-free, `Date`-free.
- `src/form/resemblance.test.mjs` — GL-free unit tests (root `npm test` glob).
- `benchmarks/sculpture/resemblance.mjs` — the **impure runner** `runResemblanceGate` (+ CLI). GL render,
  decode/encode, metered judge, label drawing, file I/O, `--offline`. Not unit-tested.

**Modified**
- `package.json` — add `"resemblance": "node benchmarks/sculpture/resemblance.mjs"` script (mirrors the
  `building-build` script convention). No source edits to existing modules.

**Outputs (written by the runner, committed)**
- `benchmarks/sculpture/resemblance/gatehouse-triptych.png`
- `benchmarks/sculpture/resemblance/gatehouse-perceptual.json`
- `benchmarks/sculpture/resemblance/gatehouse-verdict.json`
- `benchmarks/sculpture/resemblance/gatehouse-resemblance.md`

**Not touched.** `form-fidelity.mjs`, `glb-silhouette.mjs`, `block-table.mjs`, `cielab.mjs`,
`palette-extract.mjs`, `sdk-binding.mjs`, `render/**`, the references, the build artifact. Pure reuse only.

## `src/form/resemblance.mjs` — public interface

```
export const RESEMBLANCE_SCHEMA          = "resemblance/v1";
export const RESEMBLANCE_VERDICT_SCHEMA  = "resemblance-verdict/v1";
export const VERDICTS    = ["same object", "drifted", "different object"];   // Rule 5 (frozen)
export const GAP_ATTRS   = ["form", "massing", "material zoning", "palette"];
export const RESEMBLANCE_DEFAULTS = Object.freeze({   // Rule 5 — fixed thresholds
  grid: 128,        // form-IoU normalization grid (matches FORM_DEFAULTS)
  fit: "aspect",
  zoneGrid: 8,      // Z×Z material-zoning grid
  topK: 6,          // build dominant blocks
  conceptK: 6,      // concept median-cut clusters
  deltaESet: 18,    // set-agreement match radius (Lab ΔE76)
  deltaEZone: 22,   // zone-agreement match radius
  panel: 512,       // triptych panel px (square)
  gutter: 8,        // separator px
});

// --- form half (reuse) ---
// renderImg/conceptImg: decoded {width,height,data}; meshSil: a rasterizeSilhouette() result.
export function formScores(renderImg, conceptImg, meshSil, opts) // → {meshIoU, conceptIoU, grid, fit}

// --- material half (block-table grounded) ---
export function buildPalette(artifact, blockTable, opts)   // top-K block IDs → [{block,count,lab}]
export function setAgreement(buildPal, conceptLabs, opts)  // symmetric coverage → {score, ...}
export function zoneAgreement(renderImg, conceptImg, blockTable, opts) // → {score, meanDeltaE, zones,...}

// --- the row (orchestrator, pure) ---
export function resemblanceRow({renderImg, conceptImg, meshSil, artifact, blockTable, subject}, opts)
//   → {schema, subject, form:{...}, material:{set, zone}, references:{concept,glb}, note}

// --- triptych compose math (pure) ---
export function resampleRgba(img, W, H, fit)              // box/letterbox resize → {w:W,h:H,data}
export function silhouetteToRgba(sil, {fg, bg})           // mask → grey-on-white RGBA panel
export function composeTriptych([p0,p1,p2], opts)         // paste + gutters → {w,h,data}

// --- judge (prompt pure; call is metered, elsewhere) ---
export function buildResemblancePrompt()                  // fixed string (Rule 5)
export function parseResemblanceVerdict(text)             // stripToJson + validate → verdict obj | throw
```

### Internal organization (top → bottom)
1. constants/defaults; small rounders (`round3`, `round2`) and `labOf` helpers.
2. form half — thin wrappers over `extractSilhouette`/`normalizeSilhouette`/`iou` + the mesh mask.
3. material half — `buildPalette` (artifact→Lab via table), `cellDominantLab` (grid bin → mean Lab),
   `setAgreement`, `zoneAgreement` (both snap via `nearestLab` to the table).
4. compose math — `resampleRgba` (inverse-map box filter, letterbox like `resampleInto`), `silhouetteToRgba`,
   `composeTriptych`.
5. judge — `buildResemblancePrompt`, `parseResemblanceVerdict` (imports `stripToJson` from `sdk-binding`).
6. `resemblanceRow` orchestrator.

Imports (pure only): `extractSilhouette, normalizeSilhouette, iou, RENDER_BG, CONCEPT_BG` from
`./form-fidelity.mjs`; `srgbToLab, deltaE76, nearestLab` from `../color/cielab.mjs`; `medianCutLab,
aggregateForeground, isBackground` from `../color/palette-extract.mjs`; `stripToJson` from `../sdk-binding.mjs`.
`blockTable` is **injected** (a `loadBlockTable()` result) so the core stays I/O-free and tests pass a
synthetic table.

## `benchmarks/sculpture/resemblance.mjs` — runner

```
export async function runResemblanceGate({ subject, conceptPath, glbPath, artifactPath, outDir, offline })
```
Flow (live):
1. Guard inputs; `loadBlockTable()`. If `glbPath` absent → throw with the T-067 provisioning hint.
2. **minecraft render** — `renderArtifact(artifact,{outPath:<tmp>, view:BUILDING_VIEW_3Q})` (fixed lens);
   `offline` → use committed `building/scale-64/render-3q.png` instead (no GL).
3. **mesh silhouette** — `loadMeshFromGlb(glbBytes)` → `rasterizeSilhouette(mesh,{view:BUILDING_VIEW_3Q})`.
4. **decode** concept + minecraft render (`decodeImage`).
5. **perceptual row** — `resemblanceRow({...})` → write `<subj>-perceptual.json`.
6. **triptych** — `resampleRgba` concept + render to `panel²`; `silhouetteToRgba(meshSil)`;
   `composeTriptych` → label via node-canvas → `encodeRgbaToPng` → `<subj>-triptych.png`.
7. **judge** — live: `requestTextWithImage({prompt:buildResemblancePrompt(), images:[triptychPng]})` →
   `parseResemblanceVerdict` → `<subj>-verdict.json`; `offline` → placeholder `{verdict:"(not run)"}`.
8. **summary** — `<subj>-resemblance.md` (triptych path, form/material table, verdict + named gap).

CLI: `node benchmarks/sculpture/resemblance.mjs [--offline] [--subject gatehouse]`. `main()` wires the
gatehouse paths (run-015 concept, `glb/stone-gatehouse.glb`, `building/best/artifact.json`).

## Data shapes

`gatehouse-perceptual.json` (the row):
```
{ schema, subject:"gatehouse",
  form:    { meshIoU, conceptIoU, grid, fit },
  material:{ set:{score, build:[{block,count}], concept:[blocks]},
            zone:{score, meanDeltaE, zoneGrid, zones:{build:[...],concept:[...]}} },
  references:{ concept:<path>, glb:<path> },         // immutable (Rule 1)
  note:"diagnostic, not the verdict (Rule 2)" }
```
`gatehouse-verdict.json`:
```
{ schema, verdict:"same object|drifted|different object",
  gap:{region, attribute}|null, rationale, judge:{model, usage} }   // gap null iff same object
```

## Ordering of changes (commit boundaries)
1. Pure core `resemblance.mjs` + tests → `npm test` green (no runner yet). **Atomic, CI-safe.**
2. Runner `resemblance.mjs` + `package.json` script. (No suite impact — not unit-tested.)
3. Live/offline run on the gatehouse → commit the four output artifacts.

## Edge cases the structure must hold
- GLB gitignored → live guard + `--offline` from committed PNG (CI reproducible).
- Empty/degenerate silhouette → `iou` both-empty → 1 (inherited); `zoneAgreement` over zero common cells →
  score `null`, not NaN.
- Judge returns prose/garbled JSON → `parseResemblanceVerdict` throws a precise error (runner logs, writes a
  `verdict:"unparsed"` record rather than crashing the gate).
- Verdict "same object" with a non-null gap, or "drifted" with null gap → validation error (Rule 7 integrity).
