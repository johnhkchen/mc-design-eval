# T-192-01 — DESIGN: three hands the climb stalls on, one new constructive primitive, orientation flagged

Decision-first. Grounded in research §1–§6. The deliverable: the climb can *move* the arched-OPENING and
WALL-quoin majors (and attempt the ROOF band), each via its own hand, gate-kept, closure held.

## Decision 1 — THREE separate hands, not one mega-hand

`composeTreatment` could do arch + quoins + cornice in a single call. **Rejected.** The falsifiable claim is
per-hand: *critique fires → lever applied → critique clears → the S-191 gate keeps it.* A mega-hand clears
three departments at once and muddies which lever moved which defect, and the gate decision becomes a
whole-build verdict instead of a per-department one (defeating the department-dominant override's purpose).
Separate hands give the cleanest falsification and let the agent pick each in the order the critique surfaces
it (the recorded stall order: OPENING → WALL → ROOF). **Chosen: three hands**, each targeting one department:
- `frame_arch` → `[OPENING]`  · `articulate_quoins` → `[WALL]`  · `band_eave` → `[ROOF]`.

## Decision 2 — the arch is CONSTRUCTED via `archRing`, in a new pure module

Research §3 is decisive: the seed doors are flat (`isArch=false`), so the S-179 voussoir/recolor path
(`deriveArchHead`/`archHeadPlacements`) is a **no-op** — it dresses an arch that exists; it cannot make one.
The constructive primitive `archRing(spec)` (`src/form/shaped-vocab.mjs`, already tested) returns the
full-cube `ring` cells that, placed where the opening's top corners are currently air, turn the rectangle
into a voxel arch — and `jambCells` label the frame sides.

**Options for the spec source:**
- (A) `fitOpeningHead` (the fit seam) — *rejected*: it RECOVERS an arch from a head profile; there is no arch
  profile on a flat hole to fit. Wrong tool.
- (B) **Impose a known semicircle**: measure the aperture (span, y-range, wall-plane depth) and build the
  `archRing` spec directly — center = span midpoint, radius = half-span, spring y0 at the opening top minus
  the rise, yRange = the head zone above the spring. *Chosen* — we are imposing the concept's arch, not
  detecting one. Deterministic, pure, no fit tolerance to tune.

**New module `src/view/arch-frame.mjs`** — pure, under the `src/**/*.test.mjs` glob — exporting
`frameArchPlacements(occ, apertures, { frameBlock, minWidth })`:
1. for each `kind:"door"` aperture (both ±x → both passages, the reviewer's requirement falls out of the
   loop), resolve `OPENING_AXES[dir]` → `{u,v,w}`;
2. measure the air-cell span `[uLo,uHi]`, y-range `[vLo,vHi]`, width `W=uHi-uLo+1`. If `W < minWidth`
   (`minArchWidth=5`) → record a `flat-kept` conflict and skip (honest, no broken arch);
3. resolve the exterior wall-plane depth `w*` by probing `occ.solid` along `w` from the face (the
   `dressOpenings` first-solid idiom);
4. build spec: `center=[(uLo+uHi)/2, vTop-radius+1]`, `radius=W/2`, `span={axis:uAxis,range:[uLo,uHi]}`,
   `yRange=[spring, vTop]`, `depth={axis:wAxis,range:[w*,w*]}`, `block=frameBlock` (`dark_oak_log`);
5. `archRing(spec)` → push `ring` cells (the dark-timber arch head, additive into the corner air); recolor
   the `jambCells` that are currently solid wall to `frameBlock` (the dark-timber frame sides);
6. return `{placements, perOpening:[{dir,width,kept,...}]}`. PURE; byte-stable (aperture order then
   `archRing`'s canonical y,d,u walk).

Runner wrapper `frame_arch(occ)`: `extractApertures(occ)` → `frameArchPlacements` → overlay (last-writer-
wins) → return occ. The recolor of solid jamb cells is replacement (no air op); the ring fill is additive.

## Decision 3 — quoins and banding reuse the tested composers (thin inline wrappers)

These add NO new geometry, so they stay inline in the runner like the existing four hands:
- **`articulate_quoins(occ)`**: `composeTreatment(occ, { field:{recess:true}, edges:{corners:{material:
  cobblestone}}}, {floor, eaveY, extractApertures, dressOpenings})`. The lever is the **material inversion**
  — `cobblestone` (rubble, `wall.field.ground`) against the `stone_bricks` dressed field, the contrast
  `construct_walls` lost by skinning quoins in the same dressed stone (research §5). `composeTreatment`
  returns `closure` → the AC's `closureOf`-not-regressed check rides along.
- **`band_eave(occ)`**: `composeRoofTreatment(occ, { edge:{material:stone_bricks}}, {ridgeAxis, eaveY,
  ridgeY})` — the lighter-stone eave course + raking verge (`roof.trimRole:"wall.dressing"`=stone_bricks)
  banding the dark roof edges. Closure guarded over the roof band.

Material resolution is **always** `roleBlock(pack, role)` with the role read from the program (never a
hardcoded block) — quoins from `masses[0].walls.dressing.role`, band from `masses[0].roof.trimRole` — so the
hands stay subject-agnostic (the gatehouse inversion is data, not a constant).

## Decision 4 — orientation: fix it (recognition-driven) AND flag the eyes-gap

Research §2/§5: program says `ridgeAxis:"x"`, runner hardcodes `"z"` → 90° rotation. **But the recorded
critique never names orientation** — the loop cannot stall on what it cannot see. So orientation is **not**
one of the climbable hands; forcing the climb to "fix" it would be theatre.

**Chosen:** derive `RIDGE_AXIS` from `program.masses[0].roof.ridgeAxis` (fallback `"z"`) and feed it to
`apply_gable_roof`/`recolor_roof`, so the gable is built facing the gate. Report this honestly as a
**recognition-declared correction, not a climb-driven one**, and flag the critique-coverage gap (the critique
is blind to orientation) for E-50 "CRITIQUE COVERAGE" / E-49. *Rejected alternative:* leave it to the climb —
impossible, the gradient can't see it. *Rejected alternative:* skip it — it's cheap, correct, and the
reviewer named it; fixing it makes the M1 glance right even though the ruler is blind to it.

## Decision 5 — wiring and the gate

Add the three hands to `TOOLS`, `MENU`, the `agentPick` JSON enum, and `TOOL_DEPARTMENTS` (climb-gate.mjs):
`frame_arch:[OPENING]`, `articulate_quoins:[WALL]`, `band_eave:[ROOF]`. The override (T-191) then keeps
`frame_arch` when it clears the OPENING major and `articulate_quoins` when it clears the WALL major, even on
a whole-build regression — *exactly the generalization-past-roof the falsifiable claim tests.*

**The banding honesty (load-bearing):** `departmentDominant` is **major-gated** — clearing a ROOF *minor*
does not fire it. `band_eave` can be kept ONLY by a scalar improvement or a tie-coverage win. We do NOT
weaken the override to minors here (that is an S-191 gate-policy change, out of this hands ticket). If the
band is rolled back, that is the recorded finding: *the override does not generalize to minor-only levers* —
a clean input to S-191, not a failure to force.

## What this falsifies (anti-hedge)
- **Arch:** if `frame_arch` clears OPENING but the gate rolls it back → the override was roof-specific → back
  to S-191 (the claim's named failure).
- **Quoins:** if cobblestone quoins regress another department on the beside-glance (e.g. read as noise on
  the field) → not local → the `recessClosureGuard` / department signal catches it.
- **Band:** if it can't be kept (minor-only) → recorded as the override's minor-gap, named for S-191.
- **A gap needing a rebuild the loop can't reach** (e.g. the ±z slit windows, or true passage vaulting) →
  named for E-49, not forced.

## Test strategy
- `src/view/arch-frame.test.mjs` (in `npm test`): a synthetic wall + flat door hole → `frameArchPlacements`
  places `dark_oak_log` ring cells in BOTH passage corners, leaves the disc interior air (arch shape),
  recolors jambs, skips a too-narrow opening with a named conflict, closure-not-regressed. Orientation-pair
  (±x) coverage. The new pure geometry is fully unit-covered.
- Quoins/banding wrap already-tested composers → covered transitively; the runner wiring is exercised by
  `GUARD_ONLY=1` (render+wiring seam, zero spend) and, optionally, a metered climb (evidence, not asserted —
  GL+LLM, like every `experiments/` sibling).
- `npm test` green; `git status measurements/` clean.
