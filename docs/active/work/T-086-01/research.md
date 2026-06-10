# T-086-01 — value-true-block-selection — Research

Descriptive map of what exists. No solutions proposed here (one measured finding is recorded
because it constrains every design option).

## The ticket in one line

The cottage plaster role was assigned `white_terracotta` by NAME (E-21 material map); it renders
pink, not the concept's warm cream. Select each material role's block for VALUE-faithfulness
against the concept swatch in CIE-Lab, within the role's material family, using the E-14 engine.

## The color stack (what the "E-14 engine" actually is)

- `src/color/cielab.mjs` — the portable core (E-10/T-020). `srgbToLab`, `deltaE76`, `nearestLab`,
  `nearest`, and `nearestFlat` (T-064: variance-penalized nearest — busy blocks lose to flat blocks
  of comparable ΔE; `FLAT_LAMBDA = 0.1`). **The distance metric is pluggable** — every `nearest*`
  takes `{ metric }`. Zero project deps; the reuse boundary is enforced by `reuse-boundary.test.mjs`
  (nothing in cielab.mjs may import `../`).
- `src/color/block-table.mjs` + `block-lab-table.json` — 305 survival, full-cube, untinted blocks,
  each with mean-texture `rgb`, `lab` (3-dec), and `var` (texture busy-ness). `loadBlockTable()` is
  the runtime path (no asset deps). The table invariant: a real full-cube block renders as itself.
- `src/color/palette-extract.mjs` — `decodeImage` (lazy PNG/JPEG by magic bytes), `resolvePalette`
  (full table or whitelist → `[{key, lab, rgb}]` candidates), `rgbToHex`, `isBackground`.
- `src/color/image-grid.mjs` — `gridFromPixels`/`gridFromImage`: image → N×M cell grid, per-cell
  FOREGROUND mean color → `nearestLab` over candidates (whitelist = validate mode). Returns
  `grid` (block keys), `legend`, `blockCounts`, `meanDeltaE` — but **NOT per-cell mean colors**;
  the cell means are computed in a private `aggregateCells` and discarded after matching.
  Background removal default is near-BLACK (`dropColor: [0,0,0]`).
- `src/color/value-palette.mjs` (S-039) — `resolveValueTruePalette`: design palette names → the
  value-honest card (real block, true hex/Lab, L* "value", snapped?, ΔE). Resolve order: exact
  table name → passthrough with ΔE 0 ("a real block renders as ITSELF — a hint never overrides
  truth"). **So S-039 by construction can never flag `white_terracotta`** — it IS a real block;
  the card passes it through at ΔE 0. That is precisely the gap this ticket fills.
- `src/color/value-gate.mjs` (S-042) — concept↔build Δvalue gate; `realizedPaletteFromArtifact`
  (placement-weighted realized palette); `DEFAULT_VALUE_GATE_THRESHOLD = 6` (mean ΔE CIE76).
- `src/color/palette-swatch.mjs` (S-040) — card → swatch grid image (the concept-side preview).

Prior art for "family": `src/sculptor/material.mjs` `hueFamilySet` — nearest block + Lab
neighbours within a ΔE radius. That is a **Lab-neighborhood** family, not a semantic material
family; memory `material-identity-is-semantic` records why mean-color neighborhoods collapse
near-tone-distinct materials (brick vs cobble). No semantic material-family registry exists
anywhere in the repo today (grep "family" → only hue-family and unrelated uses).

## The material map (the role prior)

`benchmarks/sculpture/material-map/cottage.json` (`material-map/v1`, E-21): 7 roles, each
`{ role, block, placementRule, rationale }`. The plaster role: "upper-storey plaster infill
between the timbers" → `minecraft:white_terracotta`, rationale literally says "warm, matte CREAM
off-white". The map also has `palette` (the 7-block manifest) and `nearTonePairs` (dL guards).
Other subjects with maps: gatehouse, moai, pineapple (+ `.raw.json` variants).

## The consumer pipeline and the E-24 DAG boundary

`benchmarks/sculpture/spray-paint.mjs` (`npm run spray:paint`) is where the plaster block is
applied: hard-coded `PLASTER = "minecraft:white_terracotta"` and a `ZONE_MATERIALS` policy
(upper = white_terracotta + dark_oak_log + stone_bricks). It seals, builds structural zones
(`structuralZones`), splats concept/GLB targets, paints zone-masked, and writes
`spray-paint/cottage.json` + `spray-paint/cottage/artifact.json` (7009 placements, 6-block
manifest, committed) + face PNGs.

**Concurrency boundary:** sibling ticket T-085-01 (zone-fill-dominant, also `phase: research`,
running in parallel) will rewire `spray-paint.mjs` (fill ahead of the splat). Both E-24 tickets
feed S-089 (durable consolidation), which owns end-to-end integration. Per the RDSPI concurrency
rule (two tickets touching one file = missing DAG edge) and memory `parallel-roots-duplicate-
shared-deps`, T-086-01 must NOT edit `spray-paint.mjs`; its deliverable is the selection engine +
its own runner/record, consumable by S-089.

## Concept image reality (measured)

`benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png`, 1408×768, committed.

- Quantized 48-wide against the 7-block manifest: white_terracotta gets 62.7% of filled cells —
  but the background is near-WHITE, not near-black, so the default `dropColor` removes nothing
  and the building sits in a sea of background cells.
- L* histogram of the white_terracotta-assigned cells: **711/781 cells have L* ≥ 95** (the white
  background); the genuine plaster sub-population (L* < 92, 62 cells) has mean Lab
  **(76.7, 1.3, 11.1)** — a warm cream, near-neutral a*.
- `white_terracotta`'s table Lab is **(74.9, 8.9, 13.0)**: L* matches the concept cream within
  1.8; **the defect is a\* (8.9 vs 1.3)** — the red shift that reads pink. ΔE76 ≈ 8.1.

**The finding that constrains the design:** ranking the FULL 305-block table by plain ΔE76
against the sampled cream, `white_terracotta` is itself the NEAREST block (8.1); runners-up:
diorite 11.5 (var 3606, busy), birch_log 12.6 (var 8880), **bone_block 13.5 (var 70, flat)**,
chiseled_quartz 15.0, white_concrete 15.1 (cold, a*−1.8 b*−1.2), sand 14.4, sandstones ≈15.2–15.5
(yellow, b*≈24). So: (a) naive nearest-ΔE selection KEEPS the pink block — the metric must care
about hue drift specifically; (b) any sampler must mask the white background or the sampled
"plaster" Lab is ~pure white (98.0, 0.1, 1.0); (c) the table has no perfect cream — the honest
result is "least-bad within family", with the value-ΔE recorded (E-24 Rule 5: report the gap).

Silhouette masking machinery exists: `projectSurface(occ, "+z")` (Path P) gives the build's
front-face occupied grid; `spray-paint.mjs` already aligns concept-grid ↔ face-grid by resampling
(`resampleBlockGrid`, glb-splat.mjs). `artifactOccupancy`/`bareBlock` live in `src/view/occupancy.mjs`.

## Verification & conventions

- Tests: `npm test` = schema self-test + `node --test src/**/*.test.mjs`. Pure modules in
  `src/color/` test GL-free, network-free with nothing mocked (980+ tests green as of T-079-02).
- Benchmarks runners are IMPURE wiring only; pure cores live in `src/`; every runner has a named
  npm script (`material:map`, `material:assign`, `spray:paint`, …). Records are committed JSON
  (+ `.md` render); renders/PNGs are gitignored per-directory.
- Rendering proof: `renderViews` (`src/view/multi-angle.mjs`) used best-effort (a headless-GL
  failure degrades to a recorded gap, never a crash — spray-paint's `tryRenderFace` pattern).
- E-24 binding rules: results must come from a named `npm run` end-to-end (Rule 1); deterministic
  cores pure (Rule 2); value-true not name-true (Rule 4); residuals named, not hidden (Rule 5).

## Assumptions surfaced

- The concept image is the value truth for every role visible in it (front facade); roles not
  cleanly visible (e.g. chimney-cap bricks, 6 cells) will have thin samples — sample size must be
  recorded.
- "Value-ΔE" in the AC is read as the CIE-Lab distance concept↔block recorded before/after (with
  L*/a*/b* components broken out for honesty), matching E-14's vocabulary where value = L* but the
  card records full Lab.
- The downstream consumer (S-089/T-085 pipeline) takes this ticket's output as data (a value-true
  role map), not as an import-time behavior change to spray-paint.
