# T-203-01 — Design

Goal: a **rebuild** hand that turns the declared 1-wide gate into a **wide arched opening** —
coherent head/jambs/sill + voussoir (S-179) — that **passes** the coherence gate (the thing
`carve_arch` could not), with **closure-except-aperture** holding on the S-202 plane metric so the
climb does not re-lock detail / let `close_shell` eat the gate.

The research found the carve is already correct; two seams are wrong: (1) the COHERENT conjunct is
full-height and so refutes every arch; (2) the plane metric is blind to a *declared-open* aperture.

## Decision 1 — arch-aware void coherence (the crux fix)

**Chosen:** add a pure `archedVoidCoherence(afterOcc, target, { spring })` beside the existing
`carvedVoidCoherence`, and make `apertureCoherenceGate` take an optional `arch:{spring}` that
routes COHERENT to it. SCOPE and CLOSURE conjuncts are **unchanged** (they are arch-agnostic and
already correct). Legacy path (no `arch`) is byte-identical → AC1-AC8 untouched.

`archedVoidCoherence` redefines the two coherence facts for an arched void:
- **single** — the void air cells (rectangular passage **+** arch intrados) form ONE 6-connected
  component. (Same as today; a split void is still a hole.)
- **passageContinuous** — every column `au∈[uLo,uHi]` is air over `[vLo, spring]` (the rectangular
  passage *below and including* the springline). A solid cell there is a real notch/blockage.
  **Above** `spring` the arch shapes the void, so spandrel solids are the head, **not** notches.
- **headBuilt** — at least one solid ring cell exists in `[spring+1, vHi]` (the arch was actually
  built; a bare rectangle with no head is not an arched gate). Reported; gated.

`ok = single && passageContinuous && headBuilt`. The T-201 failure (notched end columns 3,4,8,9 at
the head) now **passes**: those cells are above `spring`, outside the passage window.

*Why this window is exactly right (verified against `archRing`):* `archRing` sets
`center=[u0, spring]`, `inside=(u,y)=> y<spring ? true : (u−u0)²+(y−spring)² ≤ r²`. At `y=spring`,
`|u−u0|≤r` for every column in the span (half-width = r), so the whole `[vLo, spring]` block is
air across the full width — clean to test. The curve (and its spandrels) live strictly above.

**Rejected — relax `continuous` to "≥1 air cell per column":** would also accept a ragged carve
where a column is open only at the bottom and blocked mid-passage. The passage window is the
precise discriminator (clean below the spring, free above it).

**Rejected — a separate `archCoherenceGate` function:** duplicates SCOPE + CLOSURE (the two
correct conjuncts) and forks the one gate authority. An opt-in arg keeps a single gate.

`spring` is passed in (not re-derived inside the pure fn) so the runner and tests use the *same*
formula `frameArchPlacements` uses. The hand computes it once; tests pass it explicitly.

## Decision 2 — closure-except-aperture on the S-202 plane metric

**Chosen:** extend `eaveRingClosure(occ, { floor, eaveY, openCols })` with an optional
`openCols:Set<"x,z">` — the declared-open aperture columns. A perimeter slot that falls in
`openCols` counts as **satisfied** (intentionally open, not a hole). Implementation: after building
the robust footprint and its `perimeterColumns`, treat `present` as `ring.has(c) || openCols.has(c)`
inside `closureOf`. Default `openCols=∅` → byte-identical to T-202 → the WG-CS / closure tests and
`closeShell`'s own report are unchanged.

The climb tracks the declared aperture's `(x,z)` columns in a module-level `openColumns` set the
moment a `rebuild_arch` is **kept**, and threads it through every later `closureNow(occ)` and the
`close_shell` report path. So once the gate is built, the plane metric reads ~1.0 again
(closure-except-aperture) → the form gate stays satisfied → `close_shell` is not triggered →
no oscillation, the gate survives. This is the literal "closure held everywhere but the declared
aperture, on the S-202 plane metric" the AC asks for.

**Rejected — carve a single `-x` face plane instead of a tunnel (avoid the perimeter hit):** the
gatehouse gate is a *through*-passage; a plane carve leaves the back wall (not a gate) and exposes
the interior cavity (the depth lesson `carveTargetCells` was written to avoid). Keep the tunnel;
make the metric aperture-aware instead.

**Rejected — lower `FORM_READY_CLOSURE` below the post-carve dip:** weakens the open-shell reject
for *every* build (T-202 already flagged 0.9 sits in a thin band). The metric must read the
aperture as intentional, not the threshold be loosened.

**Rejected — exclude aperture columns from the band entirely (drop from numerator AND
denominator):** changes the metric's meaning for `close_shell`'s own report and risks reading a
genuinely-reopened shell as closed. Counting an *explicitly-declared* open column as satisfied is
narrower and safer (it only forgives columns the rebuild actually opened).

## Decision 3 — the `rebuild_arch` hand and its dressing

**Chosen:** a new OPENING hand `rebuild_arch(occ)` in `picture-climb.mjs`, the wide-arch rebuild
lever, self-reverting to `frame_arch` on gate fail (mirrors `carve_arch`'s refute path). It:

1. Resolves the declared arched door (program `head:"arch"`), measures the live slot, scales width
   into the build — **identical to `carve_arch`'s preamble** (reused).
2. `carveTargetCells` → the wide removable set + `target`. Computes `radius=target.width/2`,
   `spring=max(target.vLo+1, target.vHi−floor(radius))` (the `frameArchPlacements` formula).
3. Carves (`carveAperture`), then dresses with `frameArchPlacements` (frame jambs/lintel + arch
   ring = the voussoir wedge stones) **plus** a **sill course** (the AC's "sill"): the band row at
   `vLo−1` across `[uLo,uHi]` recolored to the frame/dress block, and a **voussoir crown** via
   `deriveArchHead` (S-179) over the rebuilt aperture — head cells set to the dress block (an honest
   reuse of the S-179 primitive, not a re-derivation of the ring).
4. Gates with `apertureCoherenceGate(occ, dressed, target, { floor, eaveY, arch:{spring} })`.
   On `ok` → return `dressed` and **register** `target`'s `(x,z)` columns into `openColumns`.
   On refute → log + revert to `frame_arch` (recess-only, recorded — the anti-hedge path).

**Wiring:** add `rebuild_arch` to `TOOLS`, the `MENU`, the JSON enum, `TOOL_DEPARTMENTS`
(`["OPENING"]`) and `TOOL_STAGE` (`"detail"`) in `climb-gate.mjs`, with a matching
`climb-gate.test.mjs` assertion. **Retire `carve_arch` from the agent-visible MENU + enum**
(it provably always refutes) so the agent reaches for `rebuild_arch`; keep the `carve_arch`
function and its `TOOL_DEPARTMENTS/STAGE` entries (no test churn, no dead-map removal). Update the
`formReadyGate` prompt strings that list detail tools to name `rebuild_arch`.

**Rejected — make `carve_arch` itself arch-aware (no new hand):** less legible against the
ticket's "rebuild, not widen-carve" framing, and the trajectory/menu already burned the agent on
`carve_arch`. A distinct, correctly-named lever is the honest record.

## Decision 4 — tests (pure, in `npm test`)

Extend `aperture-carve.test.mjs` (the gate's home) — reuse `closedBoxWithSlot`, widen it, and run
the **real** `frameArchPlacements`/`archRing` geometry (the T-202 "test the real build" discipline,
not a mock):
- **AR1** `archedVoidCoherence` on a clean carved+arched void → `single && passageContinuous &&
  headBuilt`, and the legacy `carvedVoidCoherence` on the SAME occupancy reports `continuous=false`
  (proves the bug and the fix in one test — the T-201 notched-spandrel case).
- **AR2** `apertureCoherenceGate(..., {arch:{spring}})` **accepts** the carved+arch-ringed build;
  the same gate WITHOUT `arch` **refutes** it (`/ragged/`). The exact T-201 regression, both ways.
- **AR3** a real ragged carve (a solid notch left **below** the spring) is **refuted** even with
  `arch` (the arch option must not blind the gate to a true passage blockage).
- **AR4** `eaveRingClosure` with `openCols` = the aperture columns reads ≥ `FORM_READY_CLOSURE` on
  a tunnel-carved shell; WITHOUT `openCols` it dips below (proves the coupling and the fix).
- **AR5** byte-stable: two runs identical removal + verdict; `arch` path deterministic.

`npm test` stays green (2400 + 4-5 new); the metered climb is out of `npm test`. Real-build evidence
is a scoped GL render of the rebuilt gate beside the concept (glance) + the gate's coherence/closure
numbers, captured via the GUARD_ONLY/probe seam — recorded in `progress.md`.

## How this fails (anti-hedge, carried from the ticket)

- The arch-aware gate still refutes the real build → wide-opening carving is a deeper limit than
  E-51's charter assumed; **name it** as a bound (the rebuild can't keep a clean aperture).
- Closure-except-aperture still dips because the aperture is wider than the trim → S-203 + S-202
  are coupled; co-design the metric (record it; don't lower the threshold).
- The wide span needs a load path (lintel/arch can't span) the generator lacks → name the missing
  structural support, ship the framed-narrow honest fallback.
