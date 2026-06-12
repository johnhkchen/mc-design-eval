# Style packs

A **style pack** is the per-STYLE bundle (E-31 Rule 2: per-style data is sanctioned; per-building
code stays forbidden): the diegetic material story (`provenance`), the human-curated palette that
derives from it role by role, the idiom set with style defaults, proportion rules, decoration
vocabulary, and the conformance checks the workshop runs every round.

- Contract: `schema/style-pack.schema.json` + `src/pack/style-pack.mjs` (loader, semantic
  validation, `packPolicy` → the T-113 vocabulary authority).
- Validate: `npm run pack:validate` (or `node scripts/validate-pack.mjs packs/<style>.json`).
- The `palette[].valueCheck` snapshots are authored once with the E-14/T-086 tooling and
  re-derived deterministically by the validator — a stale snapshot fails the pack.
- GLB textures are never read for materials (they are non-diegetic amalgam); precedence is
  concept evidence > pack assignment > vernacular default (`MATERIAL_PRECEDENCE`).

## Proportion conformance (T-135-01, S-135)

Beside the regularity checks, the workshop's round gate owns one **proportion-vs-concept** check
(`src/pack/conformance.mjs` → `src/form/silhouette-proportion.mjs`). It is **declaration-driven**,
not pack-listed: it runs iff the program declares `declarations.proportions` — subject data
measured from the concept, not style policy — so committed chains that predate declarations
re-derive byte-identically. Packs *may* also list `proportion-vs-concept` explicitly (undeclared
→ vacuous pass, the symmetry precedent).

**Metrics** (silhouette-derived; build side = orthographic occupancy projections, never GL bytes;
concept side = the E-22 `extractSilhouette` mask — one detection rule, two substrates):

- **eave** = the topmost silhouette row whose horizontal extent is ≥ `eaveWidthFrac` (0.98) of the
  **eave-reference** extent — "the eave stays the widest layer". A jetty or eave overhang wider than
  the roof IS the silhouette's eave line. The reference is the dominant **wall band**, not the
  global max: a plinth/water-table course in the bottom `skirtBandFrac` (0.2) of the silhouette that
  juts out past the body above it is a **skirt**, never the eave (T-139-01) — else the latched
  plinth inverts the workshop's gradient (the E-33 cottage's bent-ruler read, 5.5 not ≈1.7). The
  protrusion threshold reuses `eaveWidthFrac` (a skirt pokes beyond the body's own eave-tolerance
  band, absorbing antialiasing); `skirtBandFrac` 0 recovers the legacy global-max ruler exactly, so
  every skirt-free mask (the barn) derives byte-identical lines.
- **ridge** = the topmost row with extent ≥ `ridgeMinWidthFrac` (0.25) of the max — a thin chimney
  or finial never reads as the ridge. The build measures both elevations: eave height is the MIN
  across views (the taper view sees the true eave), total height the MAX (the along-ridge view
  sees the full-extent ridge row).
- **ridge:eave** = totalH/eaveH, **roofShare** = (totalH−eaveH)/totalH (eaveH counts rows strictly
  below the eave layer — the program's `eaveY` convention), **aspect** = plan-bbox long/short side.

**Targets** are derived once (`deriveProportionDeclarations`), recorded with a per-ratio `source`:
the **concept is the contract**; a concept whose silhouette covers > `conceptMaxCoverage` (0.5) of
its frame did not background-segment (full illustrated scene) and the **conditioned sketch is the
recorded fallback**; `aspect` is always sketch-sourced (a single perspective view cannot measure a
plan ratio). Per-mass rows run where `proportions.masses[]` names masses (bboxes from the sketch's
mass record); they gate only when a mass declares its own targets, otherwise they are recorded
information.

**Tolerance** is one declared number (default `0.15`), relative per ratio
(`|measured−target|/|target| ≤ tolerance`); targets below `absoluteFloor` (0.05) compare the
absolute delta instead. Rollback: a revision that leaves any ratio beyond tolerance with a
strictly larger delta than before is a regression (`proportionRegression`, `src/workshop/loop.mjs`)
even when the findings count ties — the no-regress cage on top of the lexicographic score. Every
round's ledger entry carries the full ratio table inside the check verdict.

Witness on the committed T-127 chains: `npm run proportion:cottage` / `proportion:barn` /
`proportion:repro` (records under `benchmarks/sculpture/proportion/`).
