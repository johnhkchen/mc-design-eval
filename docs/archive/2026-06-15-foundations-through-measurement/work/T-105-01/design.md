# T-105-01 shaped-vocabulary — Design

## The shape of the problem

Three pure generators (stair run, slab step, arch) + fits that produce their specs from the
component record (+ GLB where the record carries a GLB fit), + one witnessed application: the
gatehouse arch and church opening heads rebuilt under the T-102 cage. The division of labor with
the in-flight T-104 (roof-as-program): **T-105 ships the vocabulary and the fits as library code;
T-104 composes stair/slab runs into the roof replacement.** T-105's only *applied* construct is the
opening head (arch/flat), so nothing here touches roof code or files a roof ticket would own.

## Decisions

### D1 — Module layout: three new src modules, split by dependency set

- **`src/form/shaped-vocab.mjs`** — the generators. Pure integer voxel math, no occupancy import,
  no record knowledge. Exports `stairRun(spec)`, `slabStep(spec)`, `archRing(spec)`,
  `SHAPED_DEFAULTS`. Returns plain placement rows `{pos:[x,y,z], block, state?}` plus labeled cell
  sets (arch: `aperture`, `ring`, `jambCells`, `headCells`). This is the library future epics
  (and T-104) import.
- **`src/form/shaped-fit.mjs`** — the fit-from-component seam. Consumes component-record
  fragments (an opening, a roof plane), produces generator specs **with fit error recorded**, or
  `null` + a named finding (mirrors `glbFitForPlane`'s honest-miss contract exactly). Exports
  `fitOpeningHead(opening, opts)` (arch|flat dispatch), `fitArch(headProfile, opts)`,
  `stairRunSpecFromPlane(roofPlane, opts)`, `slabStepSpecFromPlane(roofPlane, opts)`.
- **`src/view/opening-reconstruct.mjs`** — the application. Occupancy surgery (so it lives beside
  the cage in `src/view/`): `reconstructOpeningHeads(occ, record, opts)` carves/fills opening
  heads to fitted specs; `openingHeadStep(record, opts)` adapts it to the cage's injectable step
  seam `{op, fn}`. Knows occupancy + record, never GL/IO.

Rejected: one mega-module (generators must stay importable without occupancy/record coupling —
T-104 wants only `stairRun`); putting generators in `src/view/` (they are form-domain construct
geometry, like fixture-card); extending `shell-regularize.mjs` (the cage stays generic; openings
are a consumer of its step seam, the designed-for extension point).

### D2 — Arch = full-block voxel circle; stairs are NOT the arch primitive

The arch ring is built of **full cube blocks** forming a voxel circle (the Minecraft-native arch at
13-block span), with `jambCells`/`headCells` labeled for the later dressing pass per the AC. Stairs
are deliberately not used in the ring: (a) prismarine-viewer 1.33.0 renders no stair block (T-097
named residual) — an all-stair head would erase the AC's before/after render evidence; (b) at the
witnessed spans, players build voxel-circle arches from cubes; stairs only soften the intrados at
larger radii. Stair/slab generators are proven by AJV + state read-back (the T-097 path), not
pixels.

### D3 — Arch fit: Kåsa circle LSQ on `headProfile`, tolerance-or-named-fallback

Fit target is the opening's `headProfile [{at, topY}]` (E-27 Rule 4: the record is the contract —
never re-read occupancy). Fit a circle `(u−u0)² + (y−y0)² = r²` to the head points by the **Kåsa
linear least-squares** (3×3 solve — deterministic, no iteration, pure). Fit error = RMSE of radial
residuals `|dist(p, center) − r|` in cells. Acceptance gates (declared defaults, op parameters not
subject constants): `rmseTol` (default 0.8 cells), `r ≥ width/2 − slack` and center within the
span (a degenerate or off-span circle is a miss), minimum width (5) and minimum rise (2) for an
arch to be meaningful. Out of tolerance → **`null` + named finding; the regularized sampled head
stays** (Rule 1). Dispatch in `fitOpeningHead`: `archCandidate && spring != null` → try arch fit;
otherwise (or on arch miss for non-candidates) → **flat head**: fitted level = modal `topY`,
fit error = RMSE vs that level, its own `flatRmseTol`; a 1-wide or already-flat profile is a
recorded no-op ("already-flat" — the presence-fixpoint flavor). This gives the AC's "church
openings get arch/flat heads per their geometry" with zero subject-specific logic.

**GLB's role:** the headProfile is already GLB-anchored by provenance (GLB → voxelize →
T-102 cage gated against GLB silhouettes → T-103 record), and the application is re-gated against
GLB silhouettes by the cage at apply time — the GLB stays the arbiter where it has authority
(silhouette), and the spec records the record's `alignment` mode as provenance. For the
stair/slab fits the GLB enters directly: `stairRunSpecFromPlane` prefers the plane's **`glbFit`
gradient** when present (voxelFit fallback is a named finding), pitch snapped to stair-legal 1:1
(gradient magnitude within `pitchTol` of 1.0, error recorded) and slab-legal 1:2 for
`slabStepSpecFromPlane`. Rejected: fitting the arch against a fresh GLB silhouette rasterization
(a new lens, heavy, and redundant — the cage already arbitrates the same evidence at apply time).

### D4 — Stair-run semantics (exhaustive, documented, 8 orientations)

Spec `{origin:[x,y,z], ascent:"+x"|"-x"|"+z"|"-z", steps, width=1, winding:"walk"|"soffit",
block}`. Cell *i* of a run sits at `origin + i·ascentDir + i·up`, replicated `width` across the
lateral axis. States via the proven CARD_ROWS vocabulary: `facing` = compass of `ascent`
(+x→east, −x→west, +z→south, −z→north — Minecraft's axis convention), `shape:"straight"` always;
`winding:"walk"` → `half:"bottom"` (a climbable slope, the roof-top course), `winding:"soffit"` →
`half:"top"` with `facing` **reversed** (the mirrored underside — an eave/arch soffit course).
4 ascents × 2 windings = 8 orientation cases, each unit-tested against hand-written expected
states. Slab step: spec `{origin, axis:"x"|"z", length, kind:"bottom"|"top"|"double", block}` —
a half-block course at one level (the y+0.5 transition between full-block courses); kind maps
1:1 to the proven slab `type` state.

### D5 — Application under the cage: carve + fill inside the opening head window only

`reconstructOpeningHeads(occ, record)`: per opening group, per opening with a fitted head spec:
- The work window is the opening's span (`extent.range` on its width axis) × y ∈ [spring(or
  fitted y0)…crown+1] × the wall's **measured depth run** at the jamb columns (the solid depth
  range of the wall there — geometric, no constants; openings carve through the full wall).
- Inside the window: cell **above** the fitted curve (outside the disc / above flat level) →
  must be solid (fill with the majority block of solid 6-neighbors, `closeShell`'s deterministic
  rule); cell at-or-below the curve → must be air (carve). Cells outside the window untouched.
- Output report: per-opening `{id, kind, spec, fitError, carved, filled, jambCells, headCells,
  findings}` — jamb/head labels feed the dressing pass.
- `openingHeadStep` wraps this as the cage step; **all three T-102 gates apply unchanged**
  (per-azimuth IoU vs input ≥ −0.02, closure no-regress with the openingRegions allow-list,
  protected regions byte-identical) — a regressing reconstruction rolls back and is recorded,
  satisfying "closure + dressed-opening semantics preserved". Dressed cells (occupied-not-solid,
  carrying `state`) inside the aperture are below the head window's carve set by construction
  (the head is above `spring`; dressing sits in the aperture body) — asserted by the integration
  unit test rather than assumed.

Rejected: free placement of a generated arch as new geometry outside the cage (E-15 lesson — no
form op without the 3-D target gate); re-deriving openings from occupancy (Rule 4).

### D6 — Runner: new `shaped:*` chain over all three subjects

New impure runner `benchmarks/sculpture/shaped-vocabulary.mjs`, npm `shaped:cottage|gatehouse|
church` (registry pattern of `regularize-shell.mjs`: SUBJECTS = input paths, not behavior).
Inputs: `regularize/<subj>/artifact.json` (the cage output — the correct substrate: openings were
decomposed from it), `components/<subj>.json`, `glb/*.glb`. Per subject: validate record schema →
fit all opening heads + record stair/slab specs from roofPlanes (fit evidence only — not applied;
the roof replacement is T-104's) → apply opening heads under the cage → `rebuildArtifact` →
**double-run byte-identity (sha256)** → renders before/after at the 4 gate azimuths (best-effort
GL, excluded from decisions) with **`unmapped` asserted empty** → write `shaped/<subj>.{json,md}`
+ `shaped/<subj>/artifact.json` + committed evidence frames. All three subjects run the same chain
(E-25 anti-tuning); cottage simply witnesses flat/no-op heads.

### D7 — Tolerances are declared op parameters

`SHAPED_DEFAULTS = { rmseTol: 0.8, flatRmseTol: 0.6, minArchWidth: 5, minArchRise: 2,
pitchTol: 0.25, slabPitchTol: 0.15 }` (single frozen object, every consumer names what it used in
its durable record — the REGULARIZE_DEFAULTS precedent). Exact values are implementer-declared
and asserted against the witnessed subjects in the runner, not tuned per subject.

## Risks

- The gatehouse head spans z∈[−6,6] (width 13, even half-span 6.5): the Kåsa fit must be verified
  on the real profile early (Implement step 2) — if rmse lands just over `rmseTol`, the honest
  outcome is a named finding, but the AC expects the arch rebuilt; the profile (12,14,15…15,14,12)
  is near-circular (segmental), so a pass is expected. If not, revisit the tolerance *with the
  rationale recorded* before any application code exists.
- Cage IoU: carving the head changes silhouettes only within the aperture (<1% of the 128-grid
  frame) — well inside 0.02/azimuth. Closure: carved cells extend a declared opening region's
  air; `openingRegions` allow-list covers them since regions back-project the full depth.
