# T-074-01 — concept-materials-consolidation · Research

Descriptive map of what exists for the **terminal E-21 measurement** ticket. E-21 replaced "nearest mean
colour" as the sole material authority with a concept-grounded, LLM-defined **material map** (T-071),
assigned by **geometric feature** (T-072), and **refined against the concept** (T-073). This ticket does not
add pipeline capability — it **measures clean-and-true**: applies the whole pipeline to a small subject set,
A/Bs it against the colorimetric E-19 build, records the concept-justified palette growth, and writes the
epic's learnings + the E-12 handoff.

## The pipeline as it stands (the three predecessors)

- **T-071 `material-map`** — `baml_src/materialmap.baml` (`MaterialMap(design_doc, concept:image) →
  MaterialMapResult`) + the PURE parser `src/form/material-map.mjs`. Output `material-map/v1`:
  `{schema, subject, map:[{block, placementRule, role?, rationale?}], palette, dropped, preservesNearTone,
  nearTonePairs}`. Committed maps: **gatehouse** (5 blocks, 0 dropped) and **cottage** (7 blocks; added
  white_terracotta/spruce_planks/bricks beyond the doc; dropped spruce_door/dark_oak_trapdoor/lantern as
  non-full-cube). `nearTonePairs` is the headline evidence: gatehouse keeps `stone_bricks`+`cobblestone`
  (ΔL*=2.08) apart — the exact pair mean-colour collapses. Key pure fns: `paletteFromMap`, `nearTonePairs`,
  `preservesDistinctGreys`, `normalizeBlock`, `isKnownBlock`.
- **T-072 `feature-assign`** — PURE `src/form/feature-classify.mjs`: `classifyFeatures(occupancy) →
  Map<"i,j,k", feature>` over `{flat-face, edge-corner, top-roof, base, opening-recess}`;
  `assignFeatureBlocks(occ, features, map, {colors, palette}) → bare keys[]`; `featureBlockMatrix`,
  `featureCounts`, `FEATURE_RULE` (rule→feature). Places the map's block **by where a voxel is**, not its
  colour — this is what separates brick (flat-face) from cobble (edge-corner) when their mean colours are
  ~identical. The colorimetric `nearestLab` matcher is demoted to a silent-map fallback. Committed runner
  `benchmarks/sculpture/material-assign.mjs` (gatehouse only): builds the artifact, asserts AJV, renders,
  tabulates the block×feature matrix, writes `material-assign/gatehouse.{json}` + `…/gatehouse/artifact.json`.
  Verdict fn `brickNotCobbleByFeature` (walls@flat-face ∧ corners@edge-corner). Known gap: `trim` (a
  1-block accent) has no geometric feature → recorded in `unplacedRules`.
- **T-073 `material-correct`** — the concept-refine pass: the E-15 `reviseLoop` reused unchanged with a
  MATERIAL target (`src/form/material-target.mjs`: `conceptMaterialTarget`, deterministic CIE76 colour
  agreement vs the concept) + a recolor-only editor (`src/revise/material-edit.mjs`) gated by the PURE
  palette policy (`src/form/material-policy.mjs`: `allowedPalette`, `gateAddition`, `classifySwap`,
  `applyCorrection`). The editor may **add** a missing concept material (gated by justification, not a cap —
  near-tone allowed, near-duplicate rejected). Committed runner `benchmarks/sculpture/material-correct.mjs`
  (gatehouse + gatehouse-probe). Honest finding: on the as-built gatehouse the correction is a **no-op**
  (materials already correct, 0.657→0.657); the probe (a *visible* roof mis-zone) is corrected and accepted;
  a *near-tone* corner collapse yields 0 proposals (invisible to a render — which is exactly why T-072 places
  by geometry). The correct pass is the complement for VISIBLE semantic mis-zoning, not a near-tone net.

## The colorimetric "before" (what E-21 is measured against)

- **E-19 colorimetric build** = `src/form/material-segment.mjs` `segmentMaterials(build, opts)` (region
  segmentation under the augmented design-doc palette, the mean-colour authority) + `pruneStrays` +
  `voxelizeRouted`. Metrics live there: `speckleScore`, `offPaletteCount`. The terminal E-19 sweep
  (`benchmarks/sculpture/e19-build.mjs` → `e19-cleanup.{md,json}`) ran the **7 sculptures** and produced
  committed `e19-build/<subj>/artifact.json` for each. **There is NO committed colorimetric build for the
  gatehouse or cottage** — the architectural subjects were never run through the colorimetric path, so the
  "before" for the headline must be **built fresh** via `segmentMaterials` on their GLBs. The sculpture
  "before" is the committed `e19-build/<subj>/artifact.json`.

## The A/B report pattern to mirror (E-19's own consolidation)

`src/form/e19-cleanup.mjs` is the template for THIS ticket's pure roll-up: a PURE assembler
(`assembleCleanup({rows}) → {md, json}`) with a schema const, per-axis `classifyAxis`
(improved/held/regressed by direction-aware delta + eps), `cleanupRow`, averages, a headline verdict, and a
private `render*Md`. It is null-tolerant (a missing cell renders "—", never throws). It is unit-tested under
`src/**/*.test.mjs` (the suite's glob). Its impure runner does the GL/dwebp/I/O and feeds it cells. **This is
the exact shape T-074's `concept-materials-ab` should take.**

## E-12 handoff conventions

`pr/assets/` holds per-epic `.md` handoff docs (`voxel-cleanup.md`, `value-true.md`, …) + `frames/`
(before/after PNGs copied by the runner, gitignored renders but committed frame copies). `e19-build.mjs`'s
`copyFrames()` copies `e19-<subj>-{before,after}.png` to `pr/assets/frames/`. The before/after **visual** for
AC#3 is a gatehouse colorimetric→concept-grounded pair (the "grey-blob walls → brick-walls-with-cobble-
corners" story). `src/form/montage.mjs` (`montageRow`, PURE RGBA compositor) is available if a side-by-side
single image is wanted; the established idiom is separate before/after frames.

## Rendering / runner idiom (impure edges)

GL render via `render/src/render-tool.mjs` `renderArtifact(artifact, {outPath, view: SCULPTURE_VIEW_3Q})` —
**verified working** in this environment. GLB texture decode via `dwebp` (WebP→PNG host tool) then
`decodeImage`. GLBs live in `benchmarks/sculpture/glb/` (gitignored but **present**: stone-gatehouse,
cottage, moai, pineapple, heart, koi, …). Metered model path is `claude -p` via `src/sdk-binding.mjs`
(`requestTextWithImage`) + the `.mts` BAML bridges run under `tsx`; the `claude` CLI is **on PATH**.
`baml_client/**` is gitignored — regenerate with `npm run baml:gen` before any bridge import. Runners follow
a fixed shape: a **live** branch (GL + maybe metered) and an **`--offline`** branch that re-derives the
verdict + re-validates artifacts from committed JSON with no GL/model. The pure core is unit-tested; the
live branch is exercised only by committed runs (never in `npm test`). `npm test` baseline = **742 pass**.

## Subjects available for the A/B

- **gatehouse** — `glb/stone-gatehouse.glb`, `material-map/gatehouse.json` (committed),
  `material-assign/gatehouse/artifact.json` (committed), `material-correct/gatehouse*` (committed). Concept
  `runs/015-…/concept.png`. THE headline; near-tone pair stone_bricks/cobblestone.
- **cottage** — `glb/cottage.glb`, `material-map/cottage.json` (committed; no assign/correct yet). Concept
  `runs/014-vConcept-a-cottage/` (design-doc.md present; concept image to confirm). Second headline.
- **sculptures** — moai, pineapple (+ heart/koi/mushroom/bow) have `glb/*.glb`, `runs/00x-…/{concept.png,
  design-doc.md}`, and committed `e19-build/<subj>/artifact.json` (the colorimetric before). **No material
  map** for any sculpture → generating one is a metered `material:map` call. moai (near-monochrome stone)
  and pineapple (body/crown two-material) are a good honest pair: moai has *no* near-tone distinction to
  restore (growth should stay flat — a bloat check), pineapple does.

## Assumptions & constraints

1. The colorimetric gatehouse/cottage builds **do not exist** and must be generated — the A/B builds both
   sides of the headline, not just reads them.
2. The feature classifier is **architectural** (flat-face/edge-corner/roof/base/recess). On organic
   sculptures these features are ill-defined → the concept-grounded sculpture build will lean on the colour
   fallback / may mis-zone. AC#5 explicitly asks to be **honest where the LLM over-reaches** — the
   sculptures are the over-reach evidence, not a regression.
3. Sculpture material maps require metered `claude -p`; this is available but slow/flaky. The pure roll-up +
   `--offline` re-verify must make the report reproducible from committed JSON without re-running the model.
4. The "judge categorical" (AC#2) should be a **deterministic** classification (restored / collapsed / n-a;
   clean held / speckled; growth justified / bloat) — the loud E-15/T-073 lesson that a non-deterministic
   gate confounds the measurement. An optional multimodal judge is a separable follow-up.
5. Palette growth is a first-class AC: per subject, `palette ∖ design-doc-manifest` = the blocks the LLM
   added back, each carrying the map entry's `role`/`rationale` (concept justification) — growth must be
   justified additions, not a slide back to full-table bloat.
