# T-189-01 — PLAN: ordered implementation steps

Eight steps, three commits. Each step verifiable; `npm test` green after every src/ step; the runner step
proven by the zero-spend `ROOF_MATERIAL_PROBE`. Baseline at start: **2313 pass / 0 fail**.

## Step 1 — `src/recognition/roof-material.mjs` (the pure core)

Write `roofMaterialFamily`, `materialMapRoofBlock`, `reconcileRoofMaterial`, `ROOF_MATERIAL_SCHEMA` per
structure §File 1. Import `roleBlock` (`compile.mjs`), `normalizePlacementRule` + `normalizeBlock`
(`form/material-map.mjs`). No I/O, no GL, no LLM.
- **Verify**: `node --input-type=module` smoke — `reconcileRoofMaterial` on inline gatehouse-shaped fixtures
  returns `{corrected:true, roofBlock:"minecraft:deepslate_tiles"}`.

## Step 2 — `src/recognition/roof-material.test.mjs` (RM1–RM6)

Write the six test groups (structure §File 2). Inline fixtures only — no disk reads, so the test is
hermetic and fast.
- **Verify**: `node --test src/recognition/roof-material.test.mjs` green; then full `npm test` green
  (2313 + new RM cases, 0 fail).

## Step 3 — `climb-gate.mjs` + test: the ROOF department entry

Add `recolor_roof: Object.freeze(["ROOF"])` to `TOOL_DEPARTMENTS` (`:28`). Append one assertion to the
existing `TOOL_DEPARTMENTS` test in `climb-gate.test.mjs` (`recolor_roof` deep-equals `["ROOF"]`).
- **Verify**: `node --test src/workshop/climb-gate.test.mjs` green; full `npm test` green.

### Commit 1
`feat(T-189-01): roof-material recognition reconcile (program↔material-map) + ROOF hand dept — pure, RM1-6`
Files: `roof-material.mjs`, `roof-material.test.mjs`, `climb-gate.mjs`, `climb-gate.test.mjs`. Confirm
`git status` shows no `measurements/` paths.

## Step 4 — `picture-climb.mjs`: imports + config + asset guard

Add the two imports (structure §File 4.1), `MATERIAL_MAP_PATH` const (§4.2), and the path to the `guard`
array in `main`. No behavior change yet.
- **Verify**: `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` still passes the guard
  (asset present) and exits clean — proves the new asset path resolves.

## Step 5 — `picture-climb.mjs`: the `recolor_roof` hand + registration + MENU

Add `recolor_roof(occ)` (structure §File 4.3, with the local `normalizeRoofBlock`), register it in `TOOLS`
(§4.4) ahead of `construct_walls`, add the MENU line + the JSON enum (§4.5).
- **Verify**: a one-off node smoke (load seed occ → `recolor_roof(occ)` → assert the roof-band cells'
  blocks are now the grey `deepslate_tiles` and the cell POSITIONS equal `apply_gable_roof(occ)`'s positions
  exactly — closure/geometry unchanged, only material differs). Run inline, not committed.

## Step 6 — `picture-climb.mjs`: the `ROOF_MATERIAL_PROBE` glance branch

Add the guarded branch in `main` (structure §File 4.6): when `ROOF_MATERIAL_PROBE==="1"`, render
`seed-beside.png` (the seed roof beside concept) and `recolored-beside.png` (`recolor_roof` roof beside
concept) into `builds/gatehouse/picture-climb/roof-material/`, print the reconcile `reason`, exit before any
LLM spend. Reuse `renderBesideConcept` + `rebuildArtifact` already imported.
- **Verify**: `ROOF_MATERIAL_PROBE=1 node experiments/eval-alignment/picture-climb.mjs` — GL renders both
  beside sheets, prints `timber dark_oak_planks → stone deepslate_tiles`, zero spend.

### Commit 2
`feat(T-189-01): recolor_roof loop hand (concept-true grey via reconcile) + zero-spend ROOF_MATERIAL_PROBE`
Files: `picture-climb.mjs`. (`builds/…` renders land in commit 3 with the review.)

## Step 7 — Run the probe; inspect the glance

Run `ROOF_MATERIAL_PROBE=1 …`. **Read both PNGs** (Read tool renders images): confirm `seed-beside` roof is
brown and `recolored-beside` roof is grey, toward the concept; confirm the roof still reads as a distinct
mass (not collapsed into the grey walls — design F failure-watch); confirm no other department visibly
regressed (walls/openings unchanged — the hand only rebuilds the roof band).

## Step 8 — `progress.md` + `review.md`; final verify

Write `progress.md` (steps done, any deviations) and `review.md` (structure §File 6): the honest verdict.
- **Metered confirmation (attempt, report honestly)**: optionally attempt a single metered DiagnoseBuild on
  the recolored build to show the ROOF-color item cleared. Following T-188 (spend deferred), if not run,
  state plainly that the glance + the geometry-equality assertion carry the claim and the metered
  critique-clears is the named next step. No hedge either way.
- **Final**: full `npm test` green; `git status` clean of `measurements/`.

### Commit 3
`docs(T-189-01): brown→grey roof glance + review — roof-color hand built, closure held`
Files: `builds/gatehouse/picture-climb/roof-material/*.png`, `docs/active/work/T-189-01/{progress,review}.md`.

## Testing strategy

- **Unit (in `npm test`, the green-bar guarantee)**: RM1–RM6 (the reconcile decision) + the
  `TOOL_DEPARTMENTS.recolor_roof` assertion. These prove the *decision* — the highest-leverage thing to get
  right — with no GL/LLM.
- **Geometry no-regress (node smoke, Step 5)**: `recolor_roof(occ)` cell positions === `apply_gable_roof(occ)`
  cell positions ⇒ closure/silhouette unchanged, only `block` differs. This is the "without regressing
  closure" AC discharged without GL.
- **Glance (Step 7, GL, zero LLM)**: the brown→grey beside renders — the falsifiable deliverable a human
  agrees with on the glance.
- **Metered critique-clears (Step 8, attempted/deferred)**: the ideal end-to-end "critique fires → clears";
  reported at true strength per the anti-hedge directive.

## Risks (named)

- **deepslate_tiles not in the render texture set** → roof renders missing/magenta. Mitigation: the probe
  Read in Step 7 catches it visually; `isKnownBlock` (block→Lab table) membership can be asserted in the
  smoke if needed. deepslate_tiles is a 1.20 block, expected present.
- **The grey roof collapses the distinct-mass read** (design F). Watched on the glance; if it regresses,
  recorded as a finding, not forced — the material-map chose a roof *darker* than the walls precisely to
  avoid this.
- **Generality is one-subject**: the no-op-on-matched test (RM4) is the generality evidence; multi-subject
  proof is E-49, named not forced (AC: "named for E-49, not forced").
