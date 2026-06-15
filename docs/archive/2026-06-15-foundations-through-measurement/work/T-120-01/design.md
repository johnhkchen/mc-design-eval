# T-120-01 design — registration-hardening

Two independent decisions: (A) how the pre-spend lens smoke runs a build-relative lens with no
build, and (B) what shape the glb-smoke speck tolerance takes. Plus wiring/records/runbook.

## A. Pre-spend lens smoke

### A1. How to run the lens without a build — options

**(a) Reduced row-space readability check** — new logic that re-derives "do field-class blocks
dominate any wall rows" directly over `rowProfile` rows. REJECTED: reimplements the lens's
dominance/projection semantics (a second copy of the T-117 rung to keep in sync — the exact
divergence class T-113 closed for vocabulary); its verdicts would not be the production
refusal taxonomy.

**(b) Run `buildSkin`** — impossible: it loads `def.build` (no artifact exists pre-spend) and
asserts against committed records.

**(c) Proxy geometry + the real `extractConceptZoneMap` (CHOSEN)** — synthesize the three
occupancy-side inputs from the concept's own row profile and call the real lens. Research §2
established the fidelity argument: `mapRowsToLayers` relocates histograms but never changes
their content, and both axes use the same robust-extent/anchor statistics — so with layer
counts ≡ reversed row counts the map is identity-shaped and every *material-readability*
refusal (`too-few-cells`, `extent-too-short`, `no-field-cells`, `weak-dominant:*`,
`unmapped-dominant:*`) reproduces exactly, T-117 rung included. Band y-geometry is proxy-true
only — the smoke's claim is readability, never band placement, and the record says so.

### A2. The wall/roof split (`upperTop`) without occupancy

The lens needs one geometric line. Three sources, tried as a ladder (T-104 attempt semantics —
each rung named in the record):

1. **Widest-row anchor (the eave)** — `anchorIndex` on the row widths, verbatim (narrow-plateau
   condition included). Measured invariant: the eave is the widest line of both axes (cottage
   y14, gatehouse y18 — band-profile header). `upperTop` = anchor row's proxy y + 1.
2. **Roof-run bottom** — when the anchor is null (flat-sided mass, broad plateau): top-down
   scan for the first row where field-class cells ≥ roof-class cells (both classes from the
   map's `placementRule` rows — committed data, no new threshold); the split sits there. Only
   defined when the map declares both classes.
3. **Named refusal `proxy-eave-undecidable`** — neither source decides: the smoke refuses
   honestly (cheap, pre-spend, regenerate or inspect manually). A smoke must never guess a
   split and then certify readability off it.

Rejected: a declared wall-share fraction constant (e.g. 0.6·extent) — a made-up threshold with
no measurement behind it, exactly what T-117 avoided; sweeping multiple candidate splits and
taking the best — turns a gate into a search, mushy refusal semantics.

### A3. Kit dry-run depth

CHOSEN: everything `kit-extract.mjs` does before its live call, against an **ephemeral**
zone-record-shaped object built from the smoke's lens output
(`{schema:"zone-map/v1", source:"concept", derived:{bands}}`):
`bandRefsFromZoneRecord` (the exact precondition that refused the barn) → `buildKitPrompt` →
`loadBlockVocab`. Recorded: bandNames, promptChars. Zero spend.

Rejected: also running the cube-grid/swatch value pass — that machinery
(`verifyKitValues`) consumes the *model reply*; there is nothing to verify pre-reply. The
grid itself is already exercised by the lens smoke (same `gridFromPixels` call).

### A4. Where the pure core lives

`src/form/registration-smoke.mjs` (new, pure). It composes `src/color/band-profile.mjs`
(lens) + `src/form/kit.mjs` (dry-run) — form already imports color (kit.mjs ← value-select),
so no new dependency direction. Unit-tested with synthetic images/grids (the
band-profile.test.mjs idiom; suite stays decode-free and GL-free).

### A5. Wiring into the flow — options

**(a) Runbook/checklist discipline only.** Necessary but not sufficient — the barn showed the
gap is exactly the step nobody was forced to run.

**(b) Flag on `trellis-glb.mjs` (`--require-smoke <rec>`).** Flags get swallowed (the T-119
lesson was a swallowed `--subject`); an *optional* flag protects nothing by default.

**(c) Sibling-record detection in `trellis-glb.mjs` (CHOSEN), plus (a).** The smoke runner
writes `registration-smoke.json` beside the concept PNG. `trellis-glb.mjs` main (CLI path
only; `generateGlb` export untouched) looks for that sibling next to its input PNG:
- present and `pass:false` → **refuse before the POST** (named, exit 1);
- present and `pass:true` → proceed, note the record;
- absent → proceed with a stderr note (sculpture subjects have no material map and never get a
  smoke record — their path is unchanged; no contract relaxed, a gate added).
Data-driven, zero new flags, fail-safe against the realistic mistake (re-running TRELLIS after
a refusal). The checklist gains step 8 ("lens smoke record beside the image, pass required"),
so registration is blocked by process *and* the spend is blocked by mechanism.

New impure runner: `benchmarks/sculpture/registration-smoke.mjs`
(`npm run registration:smoke -- --concept <png> --map <json> [--subject <name>]`). Decodes the
concept, builds the grid exactly as `buildSkin` does (whitelist = map palette, n=96, border
dropColor, cellMeans), calls the pure core, writes `registration-smoke.{json,md}` beside the
concept via `guardedWriteRecord` (joins the PIN_WRITERS conformance list), exit 0/1/2. It takes
explicit paths — pre-registration subjects have no SUBJECTS entry, and must not need one.

**Bootstrap reorder this implies (runbook-recorded):** material-map minting moves BEFORE the
TRELLIS call (it is concept-only — research §1; the lens is map-relative, so the smoke needs
it). Concept refused → concept and map regenerate together (pre-registration, nothing is
immutable yet — S-094-compatible by construction).

## B. glb-smoke sub-speck tolerance

### B1. Gate semantics — options

**(a) Total-stray-fraction budget** (`strayCount/total ≤ x`). REJECTED: a mesh fragmented into
many medium shards could pass on a generous total while no single shard is a speck — the gate
would stop measuring fragmentation class.

**(b) Per-component cell-fraction budget (CHOSEN)** — exactly the story's words: every
non-principal 26-conn component must individually be ≤ a declared fraction of total cells;
ANY component above it ⇒ fail (the strict check, held above the budget). Specks are reported
(count, cells, fraction each) and explicitly delegated to the standing `shellStage`
`componentStrip` (the barn probe: voxelize@48 → shellStage → 1 component) — the gate's record
names the remediation instead of deviating around it.

**(c) Absolute cell count (e.g. ≤ 2 cells).** REJECTED: scale-dependent (the same mesh debris
is 1 cell @48 and 19 @32 — the barn sweep); a fraction is scale-stable.

### B2. The declared budget value

`GLB_SMOKE_SPECK_FRACTION = 0.02` (2% of total cells, per component). Grounding:
- barn (the must-pass fixture): worst sweep point @32 has total stray 1.87% across 7 stray
  components — every single component ≤ 1.87% < 2%; at the working scale 48 the speck is
  0.03%. Passes everywhere with margin.
- moai (the must-fail control): largestFraction 0.5213 ⇒ its second mass is ≈ 25–48% of cells
  — 12–24× over budget. Fails unambiguously.
- An order-of-magnitude gap on both sides; one exported constant, no per-subject data.

### B3. Where the decision lives

Pure function `speckVerdict(sizes, total, {speckFraction})` in
`src/form/voxel-components.mjs` (beside `componentLabels`/`strayVoxelStats`, which already own
component analysis; `componentLabels` provides the per-component `sizes[]` that
`strayVoxelStats` discards). Returns
`{pass, principal:{cells,fraction}, specks:[{cells,fraction}], oversize:[{cells,fraction}]}`.
`glb-smoke.mjs` becomes a thin consumer: report keeps the raw conn26/conn6 stats verbatim
(evidence unchanged) and adds the `speckGate` section; exit code moves from
`components === 1` to `speckVerdict.pass`. Optional `--record <repo-rel path>` writes the
report through `guardedWriteRecord` (glb-smoke joins PIN_WRITERS) so fixture re-runs are
committed records, byte-reproducible.

Rejected: a `--strict` escape flag (two behaviors, swallowable); putting the verdict inline in
the script (the current untested state — the AC demands pure + unit-tested).

## C. Fixtures and records (AC 3)

- **Barn lens smoke (former deviation 1):** run the real runner on the barn concept + map →
  `runs/017-…/registration-smoke.{json,md}` committed, `pass:true`, `fieldResolution` rung
  engaged (post-T-117). Plus unit tests: a synthetic flipped-field grid passes through the
  smoke core; a synthetic lens-unreadable concept refuses `no-field-cells` (zero spend is
  structural — the core cannot spend).
- **Barn glb-smoke (former deviation 2):** `node glb-smoke.mjs glb/barn.glb --scale 48
  --record …/barn@48.json` → committed record under `benchmarks/sculpture/glb/smoke/`,
  `pass:true`, one speck reported. Moai control: `…/moai@48.json`, `pass:false` (oversize
  component). Church: `pass:true`, zero specks (the clean baseline). GLB binaries stay
  gitignored; records are the durable fixtures (sha pins already exist).
- **Unit-level controls:** synthetic occupancies in voxel-components.test.mjs shaped like
  barn (1-cell speck), moai (half-mass second component), and the boundary (component exactly
  at budget passes; one cell over fails).

## D. The runbook (AC 3)

New `docs/knowledge/registration-runbook.md` — the one place (pin-rotation-policy.md is the
citable-doc precedent): the S-094 checklist items 1–7 verbatim + **item 8: registration smoke**
(command, record location, refusal semantics), then the full order
`concept → checklist 1–7 → material-map → registration smoke (lens + kit dry-run) → TRELLIS →
glb-smoke (speck-tolerant) → registry edits (all four DATA lists) → bootstrap`. The per-run
`concept-checklist.md` keeps being the per-subject record; design-learnings stays history.
`provision-concept.mjs`'s "next:" hint and `glb/README.md`'s gate description get one-line
updates pointing at the runbook.

## Constraints honored

- No contract relaxation: kit-extract/generated-milestone/zone-map preconditions verbatim;
  the smoke adds a gate; the tolerance is declared, bounded, strict above budget.
- No subject-specific constants: two new exported generic constants
  (`GLB_SMOKE_SPECK_FRACTION`; the smoke has none — its ladder uses existing lens constants
  and committed map data only).
- Pure/live split: both decisions pure + unit-tested; runners stay impure leaves.
- Pin discipline: all new committed records written via `guardedWriteRecord`; both new/changed
  writers join the pin-guard conformance list.
