# T-159-01 Research — generate-first watertightness

Epic E-35 / Story S-159. Goal: the generate-first barn (`generated/barn/artifact.json`,
regen via `npm run generated:barn`) renders **holey** — diagnose WHERE and WHY, before fixing.
Descriptive only.

## The generate-first chain (where the barn comes from)

`benchmarks/sculpture/generated-milestone.mjs --subject barn` runs:

1. **FIT** — `fitProvision({occ, glb, alignment})` in `src/form/provision-fit.mjs`. The voxelized
   TRELLIS blob is *evidence*: `occ` is the conditioned blob occupancy. `decompose(occ)`
   (`component-decompose.mjs`) yields `record.masses[].plan.runs` (plan-view row runs) and
   `record.openingGroups` (projection air components). The roof goes through the fitter ladder
   (`gablesFromRecord` → end/hip/ridge fits) → clean parametric gables. Output: `provision-fit.json`.
2. **GENERATE** — `generateProvision(fit, {family, policy, bands, sheetBlock})` in
   `src/form/provision-generate.mjs`. Authors every cell from the fitted parameters. Output is the
   **`base-artifact.json`** (raw generate-first build). The zero-blob check
   (`assertGeneratedProvenance`) proves every cell carries generator provenance.
3. **GRAMMAR / SKIN** — downstream styled passes produce `grammar-artifact.json` and the final
   `artifact.json` (8952 cells; base is 6844). `render:beside` renders `artifact.json`.

`--repro`/`--offline`: the runner re-proves the generated artifact byte-identically from the
serialized fit record alone, and (T-153-01) proves two fresh runs are byte-identical. The chain is
deterministic over its inputs — any fix must stay a pure function of the recorded parameters.

## What I observed (renders + cell census)

Rendered both the final `artifact.json` (`render:beside --subject barn`) and the raw
`base-artifact.json` directly (`renderBesideConcept`, → `pr/assets/frames/diag-base-artifact-barn.png`):

- **The roof is SOLID and clean** in the base build. 6844 cells, bbox 48×21×26. A ≥4/6-exposed-face
  census (the spike/thin-shell lens, [[spike-census-counts-declared-cells]]) finds only **81 cells**
  exposed — **79 cobblestone, 2 spruce_planks**. The roof wedge (spruce_planks y14–20, spruce_slab,
  spruce_stairs) is a genuine solid prism; the parametric roof generator works.
- **The walls are holey.** Printing the front wall plane (z=−13) by (x,y):
  - y0–3, y7–9 solid; **y4–6 riddled with scattered single-cell holes** (e.g. y6:
    `#######.####.##.##.####.#.##.#`).
  - The render shows the long walls as a vertical "comb" of slots plus the scattered y4–6 gaps;
    front- and back-wall holes align, so you can **see straight through** the building.

The ≥4/6 census *undercounts* this: a 1-wide slot through a 2-thick wall leaves its neighbours at
3 exposed faces, below the threshold. The damage is real but invisible to that lens.

## Root cause (named, with counts)

The walls and openings **inherit the raw voxelized-blob plan-view noise**; only the roof is
re-authored. Two compounding sources, both in the FIT stage passing blob data straight through:

1. **Ragged / gappy footprint runs.** `fitProvision` (provision-fit.mjs:151–183) records
   `m.plan.runs` verbatim — the only treatment is a `minRunWidth=2` *named finding* (still generated
   as-is, provision-fit.mjs:155). For barn `mass-0` the plan footprint has **96 plan-holes** (rectArea
   1248, occupied cols 1152) and a ragged perimeter (e.g. z=−6 runs:
   `−24..−24, −21..−2, 3..3, 8..11, 14..23`). `generateProvision` builds the wall as the perimeter
   ring of these cols (provision-generate.mjs:173–186) — so every missing/ragged perimeter column is a
   **vertical wall slot**; every interior plan-hole spawns a stray interior wall ring.
2. **Fragmented phantom openings.** `fitProvision` (provision-fit.mjs:187–200) maps every
   `record.openingGroups` entry to a carved aperture with no coherence/minimum-size gate. The barn has
   **42 apertures, 28 of them ≤2 cells** — e.g. og-3/og-14 each carve **seven 1×1 windows at y6**,
   og-4/og-15 three at y4. These exactly match the scattered y4–6 holes. The *real* wagon door
   (og-10/og-21, 13×7 at y1–7) is among the 14 larger ones and is legitimate. Because +z and −z carve
   the same x-positions, the phantom windows align front-to-back → see-through.

This is the [[reference-is-spec-not-substrate]] failure mode: **mesh-inherited surfaces carry the
voxelization noise; re-authored ones don't.** The roof is re-authored (clean parametric wedge); the
wall envelope and openings are mesh-inherited (ragged blob plan + projection specks). The remedy
class is the [[morphology-cage-learnings]] one: *close does the work* — regularize the plan, suppress
the specks — applied at the fit→generate seam, not per building.

## Ruling out the AC's other candidates

- **`src/view/hollow-carve.mjs` over-aggressive** — NOT involved. Hollow-carve is the *program*
  (cottage/E-23) path; the generate-first chain never calls it. Generate-first makes hollow masses
  by eroding the perimeter ring (provision-generate.mjs:166–186), not by carving.
- **Roof `sheet` thin-shell leaving the underside open** — NOT the defect. The roof is solid (census
  above); `sheetCols` for the barn are few and on the verge only. No eave gap: walls reach y13
  (`wallTop`/fascia), roof field starts y14 — contiguous.
- **Voxelization** — the *source* of the noise, but the blob is evidence by design; the actionable
  fix point is the regularization seam between FIT and GENERATE.

## Constraints & boundaries

- **Pure modules.** provision-fit.mjs / provision-generate.mjs / roof-generate.mjs are PURE (no GL,
  I/O, Date, random) — covered by `src/**/*.test.mjs`. Any new helper must stay pure.
- **Determinism / --repro.** Fix must be a deterministic function of the recorded parameters so both
  `--repro` (two fresh runs identical) and the re-prove-from-record check stay green
  ([[repro-is-determinism-not-vs-committed-draft]]).
- **No per-building constants** (AC). Use general defaults (like the existing `minRunWidth`), not
  barn-tuned numbers.
- **Generate-first-general & inert elsewhere.** The cottage milestone uses the *workshop* path with a
  concept-materials artifact, not generate-first — but church/gatehouse/barn all share this chain. The
  fix must be proven INERT where the plan was already clean (no new holes, no lost real apertures).
- **Watertight AROUND the carve** (S-084 precedent): closed exterior shell, hollow loft preserved.
  Note generate-first deliberately has **no interior floor slab** (provision-generate.mjs:159–164 — a
  floor course flips the storey-band y-anchor); bottom closure rides on the ground plane, not a slab.
- **Shared files.** provision-generate.mjs / roof-generate.mjs last touched by the now-complete
  T-150-01; T-154-01 (unified chain) just landed. Be additive, re-Read before each edit
  ([[shared-file-commit-sweep]]).

## Key files

| File | Role |
|---|---|
| `src/form/provision-fit.mjs` | FIT: records `runs` (minRunWidth only) + openings (no coherence gate) |
| `src/form/provision-generate.mjs` | GENERATE: wall ring from cols; openings carve by exclusion |
| `src/form/component-decompose.mjs` | `columnRuns`/`runCells` (plan↔runs), `decompose` |
| `src/view/roof-generate.mjs` | clean parametric roof (the working reference for "re-authored") |
| `benchmarks/sculpture/generated-milestone.mjs` | the chain runner + --repro |
| `src/form/provision-{fit,generate}.test.mjs`, `src/view/roof-generate.test.mjs` | test surface |
