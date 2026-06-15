# T-092-01 — concept-derived-zone-map — Design

## Problem restated

Replace the hard-coded zone assignments (`SUBJECTS.policy` building prior) with bands read from the
concept image, aligned to the geometric floor-lines, resolved to E-21 roles, consumed by the
existing `zoneFill` — prior demoted to a recorded fallback. Zero subject-specific code.

## Options considered

### A. Row-profile over the existing validate-mode quantized grid — CHOSEN

Reuse the gridResult `buildSkin` already computes for value-true selection (whitelist = the
material map's named manifest, `n = SAMPLE_GRID_N`, border-estimated dropColor, cellMeans). Per
grid row, histogram the assigned named blocks; map rows → voxel y by aligning the *robust* vertical
extents (image rows vs occupancy layers, both filtered by a width/mass floor that excludes the
chimney); aggregate per-y histograms; segment y-layers into bands by dominant block; snap
boundaries to floor-lines when within tolerance; resolve dominants/secondaries to roles via the
map's 1:1 block→role.

- Pros: zero new decode or quantize (one concept read per run — determinism preserved trivially);
  leans on the proven T-086 locator (the named block locates its concept region — committed
  evidence it works); pure and unit-testable on synthetic RGBA + synthetic occupancy; the output
  drops straight into the name-agnostic `zoneFill`/`coverageGate`.
- Cons: per-row dominants are noisy at transitions and where roof slopes flank gable plaster —
  needs explicit smoothing rules (min band height, merge), and the row→y map is approximate under
  perspective. Both handled below.

### B. Color clustering (k-means / Lab histogram) per row, matched to role swatches — REJECTED

Re-derives material identity from mean color — exactly the near-tone collapse documented in
`material-identity-is-semantic` (brick vs cobble, plaster vs stone cream/grey). The whole E-21
design exists because nameable-block identity beats color matching; the validate-mode quantize
already injects that knowledge per cell.

### C. LLM reads the band structure from the concept — REJECTED

Puts an LLM on the durable-skin path, breaking E-24 Rule 2 (double-run byte-equality, no LLM on
the deterministic core) and the `--offline` re-assert. Also unnecessary: the bands are a
column-histogram problem.

### D. Use `storeyBands()` dominant-block bands as the band source — REJECTED (forbidden)

Explicitly excluded by the ticket: the build's dominant-block bands are corrupted by the very
material noise (collapsed plaster→stone) this chain of tickets is fixing. Geometry only.

### E. Commit a hand-authored zone map per subject — REJECTED

That is the prior with extra steps; violates E-25 Rule 3 (subject enters as registry entry only)
and fixes nothing for the challenge subject (S-095).

## Key design decisions (within A)

**D1 — "Align to floor-lines" means snap-when-near, not force-to.** Boundaries are snapped to the
nearest floor-line when within `SNAP_TOLERANCE` (2 voxel layers); otherwise the proportionally
mapped y stands. Rationale: the AC itself requires a boundary that is *not* a floor-line — the
cottage plinth top sits mid-ground-storey (no floor slab there). Forcing every boundary onto a
floor-line would reproduce the exact defect (plinth → whole-storey stone). Floor-lines are the
geometric y-axis the mapping is calibrated against; `storeyBands().bands` are never consulted.

**D2 — Robust extent alignment, same statistic on both axes.** Image side: rows whose filled-cell
count ≥ `EXTENT_WIDTH_FLOOR` (0.25) of the max row width. Voxel side: y-layers whose occupied-cell
count ≥ the same fraction of the max layer count. Linear map between the two extents. This excludes
the chimney (narrow) from *both* axes symmetrically, so a chimney whose proportions differ between
concept and voxelization cannot shear the band mapping. Generic — no subject knowledge.

**D3 — Segment in voxel space.** Each grid row's histogram is accumulated into its mapped voxel y
(plain rounding); bands are runs of consecutive y-layers sharing a dominant named block. Bands
shorter than `MIN_BAND_HEIGHT` (2 layers) merge into the adjacent band with the same dominant if
one exists, else the taller neighbour. Segmenting in voxel space makes `yRange` the native output
and the unit tests direct.

**D4 — Walls vs roof split is geometric, material policy is conceptual.** Only layers `y <
upperTop` produce wall bands. All rows mapping to `y ≥ upperTop` aggregate into ONE roof histogram
that supplies the roof zone's dominant + secondaries; roof *membership* stays
`roofKeys ∪ y ≥ upperTop` (structuralZones, unchanged) — the concept cannot out-vote geometry on
where the roof is, only on what it's made of. This sidesteps the gable-overlap noise entirely.

**D5 — Role resolution + policy synthesis are map-driven.**
- `dominantRole` = the map row whose block is the band's dominant (block→role is 1:1 per map).
- `secondaries` = blocks with band share ≥ `SECONDARY_MIN_SHARE` (0.05) **∪** map blocks whose
  `placementRule ∈ {trim, corners-edges, openings}`. Rationale: linear/local design features
  (timber studs, quoins, chimney shaft, door leaf) cross bands and are by construction never
  row-dominant — the placementRule field already declares them. This reproduces today's
  hand-written preserve lists from data (e.g. the gatehouse door leaf survives the base fill
  because `openings` is unioned in).
- Zone policy per band: `{dominant, preserve: secondaries, splat: secondaries − dominant}`.
- Everything stays in NAMED block space; the value-true substitution applies via the existing
  `mapPolicy` single renaming point.

**D6 — Fallback is whole-map, recorded, never overriding.** Unreadable triggers: too few filled
foreground cells (`MIN_PROFILE_CELLS`), robust extent shorter than 4 layers, any wall band whose
dominant share < `MIN_DOMINANT_SHARE` (0.3) of the band's cells, or a dominant block absent from
the material map. On any trigger the extractor returns `{readable: false, reason}` and the caller
uses the registry prior `policy`, recording `zoneSource: "prior-fallback"` + reason in the durable
record. A readable concept always wins (E-25: "recorded when used, never overriding").

**D7 — Integration mirrors the value-select record pattern.** `buildSkin` derives the map live
(pure function of the same committed inputs) and the T-092 runner commits it to
`benchmarks/sculpture/zone-map/<subject>.json`; on later runs durable-skin asserts agreement with
the committed record (like `valueSelectRecord` — divergence throws as a wiring bug). The committed
record carries the derived bands, the prior policy, and the diff (per-zone dominant + boundary
deltas) — the AC's "saved and diffed".

**D8 — durable-skin gate generalization (names stop being base/upper/roof).** Derived wall zones
are named `band0..bandN` bottom-up; roof stays `"roof"`. The name-coupled checks generalize:
- *Plaster invariant* → "the registry's `plasterInvariant` block must have a zero shell count on
  every zone whose policy does not include it (dominant ∪ preserve)". Under the derived cottage map
  plaster is legitimate on both storeys above the plinth and forbidden on the plinth + roof —
  the original T-079-02 intent, expressed without zone-name knowledge.
- *Band evidence*: `roofMaterialsFraction` unchanged (roof zone persists). The `upperResidue`
  check generalizes to: for each wall band, the shell fraction of *other* wall bands' dominants
  (excluding its own dominant/preserve) ≤ `UPPER_RESIDUE_MAX`. Same intent (the displaced field
  must not survive in a band), name-free.
- The E-23 splat-only *legacy baseline* keeps the prior zones + legacy palettes verbatim — it is
  the historical counterfactual and must not silently improve when the map changes.

**D9 — Before/after evidence.** `buildSkin(def, {zoneSource})` gains a `"derived" | "prior"`
switch (default `"derived"`); the T-092 runner runs the cottage both ways, renders front + oblique
for each, and writes `pr/assets/frames/zonemap-cottage-{before,after}.png` (+ a strip). "Before" is
thus a *fresh* prior-map run, not a stale committed frame — an honest same-code comparison.

## Module boundaries (preview — detailed in structure.md)

- `src/color/band-profile.mjs` — pure, plain-data inputs (gridResult + floorLines array + voxel
  layer counts + material map JSON): row profile, robust extents, row→y mapping, voxel-space
  segmentation, snapping, role resolution, readability verdict. No occupancy import, no I/O.
- `src/view/zone-map.mjs` — pure, occupancy-side: per-y layer counts, `zonesFromBands` →
  `{zoneOf, zones}` for `zoneFill` (composes bands with roofKeys/upperTop), policy diff helper.
- `benchmarks/sculpture/durable-skin.mjs` — derive-by-default + record agreement + generalized
  gates (impure wiring only; pure logic stays in src/).
- `benchmarks/sculpture/zone-map.mjs` — the T-092 runner (npm run zone:map): derive + save + diff
  both subjects (GL-free), cottage before/after renders (GL, best-effort).

## Risks and mitigations

- **Plinth boundary lands ±1-2 voxels off** (perspective): acceptable — AC asks that the ground
  storey *read* half-timbered over a low plinth; snapping never moves it to the storey divide
  unless it is genuinely within 2 layers of one.
- **Cottage upper band loses the hand-tuned `spruce_planks`/`dark_oak_planks` preserves** (T-090
  gable framing): gable triangles sit above `upperTop` → roof zone, where planks are
  dominant/secondary anyway; if under-eave plank cells exist in a wall band below the share floor,
  they recolor to plaster — strictly closer to the concept (timber frame is log, not planks).
  Verified by the end-to-end run's gates + renders rather than assumed.
- **Plinth band dominant could be `cobblestone` or `stone_bricks`** (the concept mixes both): either
  satisfies "low stone plinth"; the diff record makes the choice visible.
- **Coverage/band gates under new zone names**: thresholds unchanged (0.5 / 0.9 / 0.05); the
  end-to-end run is the proof. If a derived-map run fails a gate, that is a finding to record, not
  a reason to bend the extractor toward the prior (E-25 Rule 6).
- **Determinism**: the extractor adds no new input reads — same concept decode, same grid, same
  committed material map; double-run byte-equality and `--offline` sha checks must stay green.

## Rejected refinements

- Per-band fallback (mix derived + prior bands): more states to record and test for no measured
  need; whole-map fallback keeps the source attribution unambiguous.
- Perspective-corrected (non-linear) row→y mapping: floor-line snapping already absorbs the error
  at the boundaries that matter; added complexity without a measured defect.
- Reading band boundaries from color-gradient edges instead of dominant changes: more sensitive to
  shading/AO in the concept render; dominant-run segmentation is robust to per-cell noise.
