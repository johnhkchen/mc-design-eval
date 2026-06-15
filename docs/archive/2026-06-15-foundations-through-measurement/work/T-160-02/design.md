# T-160-02 Design — construction-centric wall skin from pack roles

*Grounded in research.md. Enumerate options, decide, record rejections.*

## The decision in one line

Add a pure `wallSkin(occ, {program, pack, floor, eaveY})` brush (new `src/view/wall-skin.mjs`) that
**derives an articulation plan from the program's declared `walls.*` roles + pack** (NOT from a `facade`
record, which is absent), runs the relief brushes via `applyArticulation`, then `dressOpenings`, and merges
the result over the envelope. Fold it into `construct_walls` (envelope → skin); load the pack from
`program.pack`; delete the hardcoded `wallField`. Add `barn--saltcrag` as the 4th batch subject (witness).

## The crux: where does the plan come from?

`facadeArticulationPlan(m, pack)` already lowers a `facade` record into a relief plan — but **every
recognition program is facade-free** (research: `facade:"none"`), so it emits `[]`. The roles the ticket
names live in `walls.{ground,upper,dressing}`, `plinth`, `openings` — present on every program. So a NEW
derivation `wallSkinPlan(program, pack, bands)` is required: it reads those roles and emits the same
`{brush, params}` shape `applyArticulation` consumes, with `roleBlock(pack, …)` resolving each role.

### Options for the plan source

- **A — author `facade` records into the programs, reuse `facadeArticulationPlan` unchanged.**
  Rejected: (1) mutates committed recognition programs (byte-identity / pin risk on the frozen
  barn--saltcrag chain); (2) `facadeArticulationPlan` only emits pilaster/infill/quoin/eave-overhang — it
  has **no** clinker / limewash / dressOpenings / plinth, so it can't express the ticket's named idioms
  anyway. Wrong tool.
- **B — new `wallSkinPlan(program, pack, bands)` deriving the plan from `walls.*` roles (CHOSEN).**
  Reads roles already on every program; resolves via `roleBlock`; emits the full idiom set the ticket
  names. No program edits. The brushes are unchanged — this only *wires* them, honoring "this ticket wires,
  it does not invent" (AC1).
- **C — minimal: just per-storey `zoneFill` (ground vs upper material) + quoins.**
  Rejected as the *headline* (it's the recolor the ticket criticizes), but **kept as one component** of B:
  the per-storey material split is the direct fix for the cottage's monotone-PALETTE cap, and the
  construction relief (quoins/clinker/dressing) rides on top of it.

## The skin recipe (what `wallSkinPlan` emits, in apply order)

Resolved per mass from its roles; brushes that a role/pack doesn't support are simply omitted (role-presence
gating = graceful degradation, no per-subject constants):

1. **Per-storey field material** — `surface.fill` (`zoneFill`) with a `zoneOf` splitting the wall band at
   the storey line (`y < floor+storeyHeight` ⇒ ground, else ⇒ upper); `zones.ground.dominant =
   roleBlock(walls.ground.role)`, `zones.upper.dominant = roleBlock(walls.upper.role)`. This is the
   cottage PALETTE fix (stone base + plaster/boarded upper). `preserve` keeps the dressing block.
2. **Clinker field course** — `surface.clinker` zoned to the **upper** storey, board =
   `roleBlock(walls.upper.role)`, **only when the upper material is a board family** (planks/log — the
   tarred-boarding read). Stone-uppered masses (barn) skip it. This is the "field course as construction"
   (proud laps, not a recolor).
3. **Quoins at corners** — `quoin`, material = `roleBlock(walls.dressing.role)`, `faces` = all four,
   `run` = the wall-band height. Proud stepped corner run = construction.
4. **Limewash banding** — `surface.limewash` ONLY when the pack has a `wall.finish.limewash` role (saltcrag
   yes, rustic no), block = that role, `aspects` = the weather face (the door wall), `preserve` = the
   dressing block so quoins survive.
5. **Plinth** — `walls`/`plinth` declares it but `plinth` is a *construct* (spec→cells), not a relief pass,
   so it can't ride `applyArticulation`. Express the plinth as a **proud base course** via `surface.relief`
   (one row at `floor`, depth 1, material = `roleBlock(plinth.role)`) — a base belt-course in dressed stone.

Then, **outside the plan** (3-arg signature): **opening dressing** — `extractApertures(occ)` on the
carved envelope → `dressOpenings(occ, apertures, packTreatments(pack))`, where `packTreatments` builds the
`{slots}` from the pack's `door.main` / `window.shutter` / `window.infill`|`window.glazing` /
`opening.lintel` roles (frame slot ← `walls.dressing` block).

## `wallSkin` orchestration (occupancy-native, mirrors `articulateArtifact`)

```
wallSkin(occ, {program, pack, floor, eaveY}):
  if !program or !pack: return occ                      # gatehouse — envelope only (graceful)
  plan = wallSkinPlan(program, pack, {floor, eaveY})
  {placements} = applyArticulation(occ, plan)           # relief + per-storey fill, all over base occ
  occ1 = occupancyFromCells(overlay(occ.cells, placements))   # last-writer-wins, plan order
  apertures = extractApertures(occ1)
  {placements: dr} = dressOpenings(occ1, apertures, packTreatments(pack))
  return occupancyFromCells(overlay(occ1.cells, dr))
```

Ordering rationale: per-storey fill (recolor) first so relief fronts the *final* material; quoins/clinker
proud cells front the field; dressOpenings last so it reads the relieved wall and dresses the holes (which
`zoneFill` left open — it recolors only occupied cells). `overlay` is the registry's last-writer-wins merge.

### Why occupancy-native, not `articulateArtifact`

The loop is occupancy-based (`construct_walls(occ)→occ`). `articulateArtifact` is the artifact twin;
`applyArticulation(occ, plan)` is its occupancy core. Using the occupancy path avoids a rebuild→re-expand
round-trip per tool call and keeps the brush's `occ→occ` shape. (AC1 names `articulateArtifact` as the
*vehicle*; `applyArticulation` is literally its engine — same seam, occupancy side.)

## Loop wiring (`autonomy-loop.mjs`)

- `construct_walls(occ)`: `constructWalls(...)` (envelope) **then** `wallSkin(envelope, {program, pack,
  floor, eaveY})`. Load pack via new `loadPack(program)` reading `packs/${program.pack}.json`.
- **Delete `wallField` from `SUBJECTS`**; `constructWalls` derives its last-resort fill from
  `roleBlock(pack, ground.role)` when a pack is present, else its existing modal-`localFill` default.
- Add SUBJECTS entry `barn--saltcrag` (artifact = workshop final-artifact, concept = barn concept, eaveY
  from program `storeys*storeyHeight`, ridgeAxis x) and append to the default batch queue (the witness).
- MENU text for `construct_walls` updated: "rebuild the wall envelope **and skin it as construction**
  (per-storey material, quoins, clinker courses, dressed openings) from the recognized roles + pack."

## Falsifiability (lead with how it fails) — carried from the ticket

- **(a) eval doesn't move** → the eval is blind to relief/grammar; that is the finding (→ S-161); the
  render is the judge. Reported, not hidden.
- **(b) the passes drown the build** (relief floods, >50% single block) → we replaced one blunt tool with
  another; report the collapse. Mitigation: relief is proud-only (charter), per-storey fill keeps two
  materials by construction, limewash is one face.
- **(c) roles don't map to zones** (corners/storeys/openings not locatable in the envelope frame) → zone
  registration is the real sub-problem (same family as T-160-01's footprint registration). The envelope is
  built in the build frame, so corners/storeys ARE locatable from it; openings are the carved holes.

## Test strategy (decided here, detailed in plan.md)

Pure unit tests co-located `src/view/wall-skin.test.mjs` (WS-prefixed), like the other brushes: plan
derivation per role-set (ground≠upper ⇒ two-material fill; dressing ⇒ quoin; limewash only when role
present; plinth row; board-upper gating), `wallSkin` determinism + idempotence + roof-untouched +
no-program no-op (gatehouse). The measurement leg (batch + renders) is GL+LLM integration, evidenced by the
committed ledger + beside-concept renders (not CI), exactly as T-160-01.
