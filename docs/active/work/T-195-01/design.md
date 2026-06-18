# T-195-01 — Design

Goal: a **wall-relief hand** that makes the gatehouse walls read as **pale dressed stone with proud
quoins/coursing** (construction), so the WALL major can clear and the S-191 override keeps it. Reuse the E-43
treatment-grammar relief ops. The judge is the glance.

## The key insight (from Research)

The E-50 walls stayed dark *and flat* for two compounding reasons:
1. **Value:** the field was near-black; `articulate_walls` fixed this by recolor — necessary but not sufficient.
2. **Relief:** the residual WALL item wants "the dressed field reading **distinct from** the rough rubble
   corners" — i.e. proud corners, recessed field. A flat recolor cannot build that.

And the reason `composeTreatment`'s quoin no-op'd in `articulate_walls`: `surfaceRelief` skips a column whose
**source cell already IS the relief material**. The gatehouse corners are already cobblestone == the quoin
material → `proudCells=0`. **The fix is to recolor the field (corners included) to the pale dressed block
FIRST, then compose the quoin/plinth relief** — now the corner source is `stone_bricks ≠ cobblestone`, so the
proud cobblestone quoin emits. Recolor-then-compose is the one move neither existing hand makes; it is exactly
what turns "recolor" into "construction."

## Options considered

### Option A — `composeTreatment` directly on the seed occ (no recolor)
Apply `composeTreatment` with corners/base = cobblestone on the raw seed. **Rejected:** this is what
`articulate_walls` already proved no-ops (`proudCells=0`) — the corners are already cobblestone so the quoin
brush emits nothing. No relief is built. Refuted by the existing code's own recorded finding.

### Option B — call the `quoin` / `clinkerCourses` brushes directly, hand-roll the fold
Import `quoin`/`surfaceRelief`/`clinkerCourses` and assemble placements myself. **Rejected:** (1) trips the
**brush-door conformance** tripwire (direct technique import from a non-allowlisted file); (2) re-implements
the fold + closure guard `composeTreatment` already provides; (3) more surface area, less reuse. The ticket
says *reuse the E-43 ops as primitives* — `composeTreatment` is that composition.

### Option C — recolor-the-field, then `composeTreatment` (CHOSEN)
A two-step pure transform:
1. **Recolor** every wall-band **cube** (`!occ.forms.has(key)`, `floor ≤ y ≤ eaveY`) to the pale dressed
   **field** block, EXCEPT a small KEEP set (the dark-oak arch frame timber, and any shaped/stair cells stay
   untouched). This both fixes the value defect AND clears the cobblestone corners so the quoin can emit.
2. **`composeTreatment`** on the recolored occ with a restrained `treatment-grammar/v1` spec:
   - `base` → proud cobblestone plinth course (depth 1) at the floor row;
   - `field` → `recess:true` (recess by exclusion, emits nothing);
   - `edges.corners` → proud cobblestone **quoins** (alternating stretcher/header, full wall-band run);
   - `edges.top` → **omitted by default** (restraint — avoid an eave cornice fighting the roof / band_eave);
   - `edges.opening` → **omitted** (OPENING is S-194/T-194-01's territory; keeps me WALL-only, no file overlap).

   Materials read from roles: field = `walls.ground.role` (stone_bricks), dressing = `walls.dressing.role`
   (cobblestone). composeTreatment returns `.closure` (the `recessClosureGuard` verdict) for free.

**Why C:** it is the *minimum* construction step that turns the flat recolor into real relief, reuses the E-43
engine through the registry door (door-compliant — `composeTreatment` already routes brushes via
`applyArticulation`), inherits the closure guard, and stays restrained (base + quoins only) per the
amplitude-is-the-lever lesson. The recolor-first step is the novel, load-bearing idea; everything proud is
borrowed.

### Option D — supersede / replace `articulate_walls`
Delete the recolor hand, keep only relief. **Rejected:** out of scope and risky — `articulate_walls` is a live
lever in committed runs and the parallel/measurement narrative. The honest move is to ADD `relief_walls`
alongside and let the MENU descriptions steer (relief = construction/dressed; articulate = flat recolor). If
the climb later prefers relief, that is an S-196 policy observation, not this hand's job.

## Amplitude / busy-vs-rich (the falsifiable risk, led with)

The claim **fails if the relief reads busy/noisy**. Mitigations, all on the render:
- **Restraint by default:** base plinth + corner quoins only — no field-wide clinker belt (the E-43 "busy
  tell" was the extra mid-field belt; candidate A restrained read best). `edges.top` cornice is available but
  **off** by default.
- **Depth 1 / headerDepth 2** (the `quoin` defaults) — a 1–2 voxel proud, not a heavy buttress.
- **Report it:** emit a **triptych** — concept | `articulate_walls` (flat recolor) | `relief_walls`
  (relief) — and judge busy-vs-rich directly, recording the verdict honestly in `progress.md`/`review.md`.
- If the render reads busy, the spec is the knob (drop the plinth, shorten the quoin run) — tuned on the
  glance, not asserted.

## How it can fail (anti-hedge, restated against the design)

- **Reads busy/noisy** → record it; the amplitude knob is the spec (base/quoin depth + run). A busy result is a
  reported E-43/E-35 amplitude finding, still worthy.
- **Proud op regresses closure** → `composeTreatment.closure` (recessClosureGuard) catches it; additive proud
  holds by construction, so a `closure.ok=false` would be a real bug to fix, not shipped.
- **WALL major doesn't clear on the critique even though the build reads as relief** → that is the **S-196
  critique-coverage gap** (the critique scored material but not relief). Flag it as eyes-gap, localized; not a
  hand failure. (This ticket does not run the metered climb to closure — see Plan; it proves the *hand* and the
  *glance*, and localizes the residual.)
- **Recolor-first leaks** (recolors the timber frame or a shaped cell) → KEEP set + cube-only guard; unit-test
  asserts the frame survives.

## Scope decisions

- **Pure core in `src/`:** the recolor + spec + compose is a pure function `buildWallRelief(occ, opts)` (no
  disk/GL) → fully unit-testable, satisfying "pure parts unit-tested." The runner hand is a thin disk-loading
  wrapper.
- **WALL-only:** no aperture/opening work (avoids T-194-01 collision; `edges.opening` omitted).
- **Frozen instrument untouched**; `measurements/` not touched. New code is creation-side
  (`src/view/`, the runner, `climb-gate.mjs` department map + its test).
