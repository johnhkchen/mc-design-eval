# T-194-01 — RESEARCH: where carving must land, and the rule it narrows

Descriptive map. The job (S-194 / E-51): **narrow the blanket no-air-op rule to an aperture-coherence gate**
(carve only a *declared* opening; closure holds everywhere else) and **build the carve+dress hand** that widens
the gatehouse passage into a wide **arched dressed** gate. No frozen-instrument change. Reviewer authorized the
charter narrowing 2026-06-17.

## 1. The wall the loop ran into (the plateau is recorded, not guessed)

T-193-01 ran the M1 capstone climb to its own stall. The ROOF reached its picture; the **OPENING plateaued**.
The review (`docs/active/work/T-193-01/review.md`) names the exact ceiling:

> the arch residual is independently known (1-wide slot → E-49) … `frame_arch` … even applied would only
> *frame* the 1-wide slot — the true wide arch needs the opening *widened*, an air-op the facade charter forbids.

So the wide arch is **unbuildable today by construction**, not by a missing tool. `frame_arch` exists and works;
it is blocked upstream by `minArchWidth`.

## 2. Why `frame_arch` cannot reach the arch (the load-bearing constraint)

`src/view/arch-frame.mjs` (`frameArchPlacements`, T-192-01) does two sub-levers:
- **FRAME** — recolor the reveal (flanks + lintel) of an existing opening to the frame block (dark timber).
  Last-writer-wins recolor of *existing solid wall* — no air op. Works on any width.
- **ARCH HEAD** — `archConstruct(spec)` (door-wrapped `archRing`, `src/form/shaped-vocab.mjs`) ADDS full-cube
  spandrels into the corner air above the spring, turning a rectangle top into a voxel arch. **Gated on
  `W >= minWidth` (default 5).**

The gatehouse passage in the seed (`benchmarks/sculpture/generated/gatehouse/artifact.json`) is a **1-wide
slot** (`extractApertures` → `±x/door`, W=1, 13 cells tall, `isArch=false`). `W=1 < 5` ⇒ arch-frame logs
`reason: "passage too narrow for an arch head — needs a wider opening (a rebuild; E-49), framed only"`. T-194's
job is to make that "rebuild" a *hand the loop can pick* — by **widening the slot** (removing wall), which is
exactly the air op the blanket rule forbids.

The **declared** target is unambiguous — `benchmarks/sculpture/recognition/gatehouse.program.json`,
mass `hall`, openings:
- `-x door w:4 h:8 head:"arch" headRole:"frame.timber"` (the wide arched gate)
- `±z window w:1 h:3 head:"flat"` (narrow slits — not to be widened).

Program opening widths are in program/sketch units (the `registerProgram` affine, `wall-generate.mjs:168`,
maps program rect → build voxel frame); the build seed currently realizes the door as a 1-wide slot. The intended
widened width is `w:4` scaled to the build (≥ `minArchWidth`).

## 3. The invariant being narrowed — and the precedent that makes carving SAFE

**`facade-recess-by-exclusion`** (memory + `docs/knowledge`): there is NO air op; a voxel is "removed" by NOT
placing it. Every existing pass that "carves" actually *re-emits kept cells*:

- **`src/view/hollow-carve.mjs`** — the carve toolkit ALREADY exists (T-080, E-23). `carveOccupancy(occ, remove)`
  / `carveArtifact(artifact, remove)` drop a key-set by exclusion (byte-stable, AJV-valid). `markHollowable`
  picks the removable set (ENCLOSED mass only); **`exteriorHeld(before, after)`** PROVES the 6-ortho exterior
  surface digest is identical before/after — i.e. interior hollowing never changes a front-most surface voxel.
  This is the carve mechanism T-194 reuses — but **inverted at the aperture**: a door carve INTENDS to change
  the exterior at the declared opening, so `exteriorHeld` must hold *everywhere except the aperture columns*.

- **`recessClosureGuard(occBefore, occAfter, {floor, eaveY})`** (`src/view/treatment-grammar.mjs:302`) — the
  closure proof. Builds the wall-band ring (`"x,z"` columns) before/after, restricted to the BEFORE footprint
  bbox, and requires `closureOf(after) >= closureOf(before)` AND **no before-column dropped**. `closureOf(ring)`
  (`src/view/wall-generate.mjs:152`) = fraction of the bbox perimeter the ring occupies (1 = watertight, <1 =
  colonnade/holes). **A door carve drops the aperture columns → this guard TRIPS by design.** T-194 needs a
  variant that *excludes the declared aperture columns* from the dropped-column check while still catching any
  non-aperture column that goes missing (the leak the ticket calls a hard failure).

## 4. The hand registry and how a hand applies (the wiring T-194 extends)

Hands are inline functions in `experiments/eval-alignment/picture-climb.mjs` (the metered runner, NOT in
`npm test`), registered three ways:
- `const TOOLS = { apply_gable_roof, recolor_roof, construct_walls, add_timber_framing, frame_arch,
  articulate_walls, band_eave }` (line 223)
- `MENU` — a one-line "best when…" description per tool (line 224+), fed to `agentPick`
- the `agentPick` output-JSON enum string (the `{"tool":"…"}` allow-list, ~line 290).

A hand takes `occ`, returns a new `occ`. Additive hands overlay via
`occupancyFromCells([...occToCells(occ), ...placements])` (last-writer-wins, `frame_arch` line 174). A
**carving** hand cannot overlay — it must *remove* cells, i.e. return `carveOccupancy(occ, removeSet)` then
overlay the dress placements on the carved occ.

The accept-gate (`src/workshop/climb-gate.mjs`, T-190/T-191) reads **`TOOL_DEPARTMENTS`** (line 31): each tool
maps to the departments it targets; the **department-dominant override** keeps a tool that cleared a *major* in
a targeted dept even on a whole-build scalar regression. `frame_arch → ["OPENING"]` (line 40). A carve hand is
also an OPENING tool. `acceptsRound`/`departmentDominant`/`classifyInventory` consume the map generically — a
new entry is additive (CG-tests stay green, T-192 precedent).

## 5. The aperture shape (what "declared opening" gives us to scope the carve)

`extractApertures(refOcc, dirs)` (`src/view/opening-dressing.mjs:154`) returns per opening:
`{ dir, kind, bbox:{u0,v0,u1,v1}, cells, flanks:{left,right}, lintel, sill, perim, region:{min,max} }` — `region`
is the full-depth world AABB of the opening (the carve's allow-list footprint); `cells`/`flanks`/`lintel`/`sill`
are `{au, av}` face coords. `OPENING_AXES` (`arch-frame.mjs:37`) maps `±x/±z` → `{u,v,w,sign}`. This is the
exact geometry that scopes the carve: **the removable set ⊆ the declared aperture's intended (widened) column
span × height × wall-plane depth**, measured from the program's `w/h/sill/head` against the seed aperture.

## 6. Tests, boundaries, constraints (surfaced, not solved)

- **Test runner:** `npm test` → `node --test "src/**/*.test.mjs"` (2335 green at T-193). New pure geometry earns
  its own `src/**/*.test.mjs` module + tests (the `arch-frame.test.mjs` / `hollow-carve.test.mjs` precedent);
  the thin hand wrapper goes inline in the runner (not in `npm test`).
- **No existing aperture-coherence module** — net new (`grep` found none). Closure-except-aperture + the carve
  target + ragged-void detection are the new logic to isolate and test.
- **Boundaries:** `measurements/`, `bakeoff-score.mjs`, `compile.mjs`, the program/pack JSON — READ only, no
  edit (frozen instrument untouched). Materials via `roleBlock(pack, role)` — never a hardcoded block id.
  Brush-door rule: reach shaped vocab only through `archConstruct` (idiom-registry), as `arch-frame.mjs` already
  does.
- **The anti-hedge risk (ticket):** carving reopens the holes/spikes the project fought
  (`reference-is-spec-not-substrate`). The coherence gate is what makes the relaxation safe — if it cannot keep
  carves clean (ragged voids, or closure breaks on a *non*-aperture surface) the charter change is **refuted**:
  openings revert to recess-only and wide arches become a named bounded limit. That refute path is a real,
  recordable result, not a failure to avoid by tuning.

## 7. Open questions for Design
- One carve+dress hand (`carve_arch`) vs. extend `frame_arch` to carve-then-frame? (Separate hand keeps
  `frame_arch`'s recess-only behavior intact as the refute fallback.)
- Where the coherence gate lives: new `src/view/aperture-carve.mjs` (carve target + gate, pure, tested) vs. add
  to `hollow-carve.mjs`. The "carve target from program+seed" geometry is genuinely new → leans new module.
- Carve depth: widen at the single exterior wall plane, or through the full passage depth (a true vault)? Read
  vs. closure-blast-radius trade.
- Coherence definition: how strict is "no ragged edges / stray voids" — connected-component count of the void +
  continuous head/jambs/sill, vs. a perimeter-solidity check.
