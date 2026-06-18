# T-194-01 — DESIGN: the carve+dress hand and the aperture-coherence gate

The decision, grounded in Research. The charter narrowing is **mechanizable by composing parts that already
exist** — the carve toolkit (`hollow-carve.mjs`), the closure-with-allow-regions gate (`conformance.watertightCheck`
→ `closureCheck`), the arch builder (`arch-frame.frameArchPlacements`). The genuinely-new logic is small and
isolable: **the carve TARGET (declared opening → widened cell set) and the COHERENCE half of the gate** (is the
carved void an opening or a hole?). That earns one new pure, tested module; the hand is a thin runner wrapper.

## The shape of the problem (from Research)

The wide arch is unbuildable today because the gatehouse passage is a **1-wide slot** and `frameArchPlacements`
gates the arch head on `W >= minWidth(5)`. The program **declares** the gate: `-x door w:4 h:8 head:"arch"
headRole:"frame.timber"`. To build it we must **remove wall** to widen the slot — the air op the blanket
`facade-recess-by-exclusion` rule forbids. The narrowing: **allow that removal, but only inside a declared
opening, and only if the result is a coherent dressed aperture with closure held everywhere else.**

## Decision 1 — One new carve hand (`carve_arch`), not an extension of `frame_arch`

**Chosen: a separate hand.** `frame_arch` stays exactly as-is — recolor-only, no air op. It becomes the
**recess-only fallback** the refute path reverts to. `carve_arch` is the new construction hand: widen → frame →
arch → dress, gated. Keeping them separate means the refute ("carving can't stay clean → openings revert to
recess-only") is a *one-line runner change* (drop `carve_arch` from `TOOLS`), and `frame_arch`'s tested behavior
is untouched. It also gives the climb two distinct OPENING levers the agent can choose between (frame the slot
vs. open the gate), and keeps the falsification clean (the carve lever is isolated).

**Rejected:** folding carve into `frame_arch`. It would entangle the recess-only fallback with the thing being
tested, and any regression in the carve path would taint the proven framer.

## Decision 2 — The aperture-coherence gate = three conjuncts, reusing existing closure machinery

A carve is ACCEPTED only if **all three** hold (`apertureCoherenceGate(beforeOcc, afterOcc, declaredAperture,
{floor, eaveY})` → `{ok, scope, coherent, closure, reason?}`):

1. **SCOPE — removed cells ⊆ the declared aperture region.** `removed = keys solid in before, air in after`.
   Every removed key must lie inside the declared aperture's world AABB (`extractApertures(...).region`, widened
   to the target span/height/depth). A single removed cell outside ⇒ **hard fail** "carve leaked outside
   declared aperture" (the ticket's non-aperture-surface break). NEW logic, trivial.

2. **COHERENCE — the carved void is an opening, not a hole.** Over the carved column-set on the aperture face:
   (a) the void is a **single 6-connected component** (no isolated stray voids); (b) it is **continuous** —
   every column between the left and right jamb is open from sill to head (no ragged notches), and the head row
   is continuous. Built from the same face-projection primitives `extractApertures` uses. A ragged/multi-component
   void ⇒ fail "ragged carve" → refute. NEW logic, the heart of the gate.

3. **CLOSURE-EXCEPT-APERTURE — no new breach outside the declared opening.** Reuse the existing allow-region
   closure: `closureCheck(afterOcc, {regions:[declaredAperture.region]})` must report **no breach outside the
   region**, AND `recessClosureGuard`-style column check restricted to **non-aperture columns** must show no
   non-aperture column dropped vs `beforeOcc`. (i.e. the door columns are *expected* to drop — they're the
   opening; every *other* column must still close.) REUSE `watertightCheck`/`closureCheck` +
   `recessClosureGuard`'s droppedColumns logic with the aperture columns excluded.

This mirrors `generate-first-wall-watertightness`'s opening-coherence gate (declared openings are honorary skin;
everything else must close) — the precedent the ticket cites — and reuses the very function (`closureCheck` with
opening allow-regions) that already encodes it at the conformance layer.

## Decision 3 — The carve target: widen the declared slot, centered, at the wall plane

The carve removes wall to turn the 1-wide slot into the declared opening:
- **Width** `T = clamp(round(programW × scale), minArchWidth, apertureMaxWidth=9)`, where `scale` = build wall
  span / program mass-rect span along the opening's u-axis (the `registerProgram` affine in `wall-generate.mjs`,
  reused read-only; fallback `scale=1` ⇒ `T = max(programW, minArchWidth)`). For the gatehouse: `programW=4` →
  `T≥5`, enough for an arch head. Centered on the existing slot's u-midpoint.
- **Height** sill→head from the program (`sill`, `h`); the arch head curves above the spring (`frameArchPlacements`
  computes the spring from `radius=T/2`).
- **Depth** the **single exterior wall plane** of the face (`probeWallPlane` idiom, already in `arch-frame.mjs`)
  — NOT the full passage depth. Rationale: smallest closure blast radius, cleanest read, and the arch reads on
  the glance from the exterior; a full through-vault is a noted future option (more removed wall, more closure
  risk). The opposite (+x) mouth keeps its existing 1-wide slot framed (only the *declared* -x gate is widened;
  the program declares one door).

The removable set is computed in the new module: `carveTargetCells(occ, declaredAperture, {programW, programH,
sill, scale, minArchWidth})` → the wall cells inside `[uMid−T/2 … uMid+T/2] × [sill … sill+h] × wallPlane` that
are currently **solid** (we only remove wall, and the existing slot cells are already air).

## Decision 4 — The hand body (revert-on-fail is built in)

`carve_arch(occ)`:
1. Load program/pack; find the declared `head:"arch"` door; if none → no-op (return occ).
2. `declared = extractApertures(seedRefOcc)` for the door dir; compute `removeSet = carveTargetCells(...)`.
3. `carved = carveOccupancy(occ, removeSet)` (exclusion; no air op in the artifact sense — cells re-emit minus
   removed, byte-stable).
4. Re-`extractApertures(carved)` on the door dir (now W=T) → `frameArchPlacements(carved, [wideAp], {frameBlock})`
   → overlay frame+arch placements (last-writer-wins). Optionally `dressOpenings` for the sill course.
5. `gate = apertureCoherenceGate(occ, dressedOcc, widenedDeclaredRegion, {floor, eaveY})`.
6. **If `gate.ok`** → return `dressedOcc` (the wide arched gate). **Else** → log the refute reason, return
   `frame_arch(occ)` (recess-only fallback, no carve) and record `reverted:"recess-only"`. The hand never returns
   a leaky carve.

## Decision 5 — Where it lives, and what stays frozen

- **New `src/view/aperture-carve.mjs`** (pure, `src/**/*.test.mjs`): `carveTargetCells`, `apertureCoherenceGate`,
  helper `carvedVoidCoherence`. Imports `carveOccupancy` (hollow-carve), `closureCheck`/closure helpers, the
  face-projection primitives. No GL/IO/Date/random. Tested.
- **`carve_arch` hand** inline in `experiments/eval-alignment/picture-climb.mjs` (NOT in `npm test`), beside
  `frame_arch`; registered in `TOOLS`, `MENU`, the `agentPick` enum.
- **`src/workshop/climb-gate.mjs`**: `TOOL_DEPARTMENTS += carve_arch:["OPENING"]` (additive; CG-tests green).
- **Frozen instrument untouched**: `measurements/`, `bakeoff-score.mjs`, `compile.mjs`, program/pack/schema JSON
  — READ only. Materials via `roleBlock`. Shaped vocab only via `archConstruct` (brush-door honored).

## What was rejected and why
- **A blanket "allow air ops" relaxation** — refuted by the whole project history (spikes/colonnade,
  `reference-is-spec-not-substrate`). The narrowing is the entire point: scope ⊆ declared opening + coherence +
  closure-except-aperture.
- **Inferring the opening from geometry** — the declared opening is the only safe scope (`proportion-vs-concept`
  / symmetry precedent: declared, never inferred). Carving an *inferred* hole is exactly the failure mode.
- **A brand-new closure metric** — `closureCheck`/`watertightCheck`/`recessClosureGuard` already encode
  closure-with-allow-regions; reuse, don't reinvent (the value-true / single-definition discipline).
- **Through-passage vault now** — larger closure blast radius for no glance gain at M1; noted as future.

## How this design fails (anti-hedge, carried into Plan)
- The coherence conjunct can't tell a clean wide aperture from a ragged one → carves pass that read as holes →
  the gate is the wrong discriminator → **refute, revert to recess-only**, wide arch = named limit.
- The scope guard leaks (removed cell outside the region) → closure breaks on a non-aperture surface → hard
  fail, re-scope `carveTargetCells`.
- The carve is clean but the wide arch still doesn't read on the glance (scale/material) → an S-195/S-196 input,
  recorded; the *carve* claim (clean, closure held) can still be true while the *glance* claim isn't.
