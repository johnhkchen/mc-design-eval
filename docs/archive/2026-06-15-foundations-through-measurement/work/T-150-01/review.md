# T-150-01 Review — realistic-construction-gable-and-roof

Handoff for a human reviewer. The construction model changed from **prism-on-prism** (a solid roof
triangle dropped on the wall box) to **envelope-then-covering** (wall envelope incl. gable-end walls;
roof = sloped covering with overhang). Landed deterministically on `main`; `npm test` green
(**2107 pass / 0 fail**, +9 new). No judge run (the glance is the proof; GL is the operator step).

## What changed (files)

**Pure cores (byte-identical by default — opt-in):**
- `src/view/roof-generate.mjs` — new exported `gableEndColumns(gable)` (the two vertical end slices;
  empty for hip ends). `roofHeightfield` stamps `owner.gableEnd`. `generateRoof(gables, family, opts)`
  honours `opts.gableBlock`: the sub-surface fill of each end slice is authored in that wall block and
  collected in the new return field `gableWallKeys`; the sloped covering is untouched. Absent ⇒
  byte-identical legacy prism.
- `src/view/zone-map.mjs` — `zonesFromBands` accepts optional `gableWallKeys`; `zoneOf` classifies a
  gable-wall key by its y-band **before** the `y ≥ upperTop || roofKeys` roof clause.
- `src/view/structural-read.mjs` — `structuralZones` accepts `opts.gableWallKeys`; same precedence
  (base/upper before roof).

**Construct + generate-first activation:**
- `src/pack/idiom-registry.mjs` — `roofGableConstruct` threads `spec.blocks.gable` → `generateRoof`
  opts, returns `gableWallKeys`. `BLOCKS_FRAGMENT` gains optional `gable`.
- `src/view/roof-steep.mjs` — `roofSteepGableConstruct` threads `blocks.gable` likewise (the steep
  invariant checks each column's top cell only, so the sub-surface retag is invariant-safe).
- `src/form/provision-generate.mjs` — resolves the eave-band wall block, builds the gable-end walls
  banded per y (storey banding continues up the triangle), excludes them from the roof fascia, and
  reports `roofPlan.gableWallKeys`.
- `benchmarks/sculpture/generated-milestone.mjs` — folds `roofPlan.gableWallKeys` into the mass
  census so `planCensusZoneOf` classifies the gable end as wall, matching the zone map.
- `src/recognition/compile.mjs` — a NOTE only (no behavior change): the workshop-path activation is
  deferred (see Open concerns).

**Tests / docs:**
- `src/view/roof-generate.test.mjs` (+3), `src/view/zone-map.test.mjs` (+1),
  `src/view/structural-read.test.mjs` (+1), `src/pack/idiom-registry.test.mjs` (+1),
  `src/form/provision-generate.test.mjs` (+1), `src/view/gable-overhang.test.mjs` (+2, AC3).
- `docs/knowledge/design-learnings.md` — E-35 construction-model note.

## Acceptance criteria status

- **AC1 Gable-end-as-wall** ✅ — `gableBlock` builds the end slices as wall (default = the realized
  wall ground/upper field, the `gableRole` intent), tagged `gableWallKeys`, zoned wall. Silhouette-
  neutral (only material/zone change). *Literal compile-path `gableRole` consumption deferred — see
  Open concerns.*
- **AC2 Roof-as-covering** ✅ — covering emission byte-identical (unit-proven: the `form:"fixture"`
  subset is byte-equal on/off; companion to the GL silhouette gate). Slopes/ridge/pitch unmoved.
- **AC3 Eave + verge overhang** ✅ (mechanism + verification) — reuses the S-147 `eaveOverhang` relief
  op; `reliefNoRegress` confirms the E-34 ruler reads the eave correctly (in-plane mask + ridge/eave
  ratios byte-identical, perpendicular widening recorded both ways). No per-building constant. *Live
  activation on the barn rides with the regeneration — see Open concerns.*
- **AC4 Hollowness** ✅ — only block ids move, never cell positions; occupancy (hence the hollow loft)
  is byte-identical. The gable-end walls are the outermost slice (shell), never interior fill.
- **AC5 Barn re-run + the glance** ⏳ operator — deterministic core proven in `npm test`; the
  corrected glance sheet is GL: `npm run generated:barn -- --repro` (byte-identical, judge-free) then
  `npm run diff:roof -- --subject barn` → `pr/assets`. Out of `npm test` by project rule; **no judge**.
- **AC6 Learnings + review + tests + green** ✅ — all present; no per-building constants; byte-identity
  preserved for committed records.

## Test coverage & gaps

- **Covered:** gable-end material + `gableWallKeys` content; hip ⇒ empty; covering byte-identity
  on/off; zone classification (both `zonesFromBands` and `structuralZones`) wall-vs-roof above the
  eave; construct threading; generate-first end-to-end (banded gable wall, fascia exclusion,
  zero-blob provenance still passes); AC3 overhang reuse + `reliefNoRegress` + projects-past-wall.
- **Gaps (honest):**
  1. **No GL/render assertion** — the actual barn glance (gable reads stone, covering+overhang) is
     not asserted in `npm test` (GL is out of `npm test` by rule). Verified by construction +
     `reliefNoRegress`, not by pixels. Operator runs the sheet.
  2. **Overhang not live on a committed subject** — AC3 is proven as a reusable mechanism; no
     committed pack yet carries a `roofOverhang` amount, so no committed build widens. Activation is a
     pack edit + regeneration (changes silhouette → operator/pin step).
  3. **Workshop/compile path inert** — gable-end walls are active only in generate-first.

## Open concerns (need human attention)

1. **The conformance gate is not `gableWallKeys`-aware.** Wiring `blocks.gable` into `compileProgram`
   makes the realized workshop barn build, but `courses-even` reads the gable wall as a *"foreign roof
   block"* (it re-derives zones from geometry without `gableWallKeys`). This is the same class as the
   multi-angle judge and the **same owner**: the relief-aware gate (S-148) already exports
   `reliefNoRegress` for exactly this kind of envelope-aware verdict. Making that gate consume
   `gableWallKeys` (or re-derive the gable triangle) **and rotating the judge pins** is its own
   ticket — never re-pin from here (pin-guard is structural). Until then the compile path carries a
   NOTE, not a behavior change.
2. **Per-y vs single-material gable banding.** generate-first bands the gable per y (storey banding
   continues up). For the barn this is one material above the plinth (cobblestone) — matches the
   concept. A reviewer should confirm banding-up-the-gable is the desired read for multi-band subjects
   before live activation.
3. **`gableBlock` source in generate-first** is the realized eave-band wall block, not the program's
   `gableRole` field directly (the generate-first path fits from GLB evidence, not the program JSON).
   This faithfully realizes the `gableRole` *default* ("the wall field"); a reviewer wanting the literal
   recognized `gableRole` to override should thread the program through the generate stage.

## How to verify (operator)

```
npm test                                   # green, the deterministic gate
npm run generated:barn -- --repro          # fresh-process byte-identical generate (judge-free)
npm run diff:roof -- --subject barn        # per-azimuth + pr/assets/frames/roof-diff-barn-*.png
```
The glance: the gable end reads stone (wall), the roof reads as covering with overhang — beside the
prior-flat and the concept.
