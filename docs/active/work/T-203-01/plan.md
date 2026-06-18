# T-203-01 — Plan

Five ordered steps, each independently `npm test`-verifiable and atomically committable. Pure-core
first (the real deliverable + the safety net), runner last, evidence to close.

## Step 1 — arch-aware void coherence + opt-in arch gate (`aperture-carve.mjs`)

- Add `archedVoidCoherence(afterOcc, target, { spring })`:
  - **single**: collect the void air cells over `[uLo,uHi]×[vLo,vHi]` at the wall plane `wStar`
    (the same window `carvedVoidCoherence` walks), feed to `componentLabels(int32ShapeOfKeys(...),
    {connectivity:6})`, `single = sizes.length === 1`.
  - **passageContinuous**: for each `au∈[uLo,uHi]`, every `av∈[vLo, spring]` must be air at
    `wStar`; a solid one pushes `au` to `notches`. `passageContinuous = notches.length === 0`.
  - **headBuilt**: ≥1 solid cell in `av∈[spring+1, vHi]` at `wStar`.
  - Return `{ single, passageContinuous, headBuilt, components, notches }`.
- Route `apertureCoherenceGate(..., { floor, eaveY, arch })`: when `arch` truthy use
  `archedVoidCoherence(afterOcc, target, arch)` with `ok = single && passageContinuous &&
  headBuilt`; else the legacy `carvedVoidCoherence` path verbatim. Extend `reason` for the three
  arch failure facts. SCOPE + CLOSURE conjuncts **unchanged**.
- Export `apertureColumns(target)` = today's private `aperColumns` (rename + export; the gate
  keeps calling it).
- **Tests:** AR1 (arch coherence true / legacy continuous false on the SAME carved+arched build),
  AR2 (gate accepts with `arch`, refutes without), AR3 (notch below spring refuted even with
  `arch`), AR5 (byte-stable). Build the fixture by widening `closedBoxWithSlot` and running the
  REAL `frameArchPlacements`/`archRing` (import from `arch-frame.mjs`) — not a mock.
- **Verify:** `node --test src/view/aperture-carve.test.mjs`; AC1-AC8 still green (legacy
  byte-identical). **Commit.**

## Step 2 — closure-except-aperture (`wall-generate.mjs`)

- `eaveRingClosure(occ, { floor, eaveY, openCols })`: default `openCols=∅` → return
  `closureOf(perimeterColumns(footprint))` exactly as today. When non-empty, count a perimeter
  rectangle slot as present if `ring.has(c) || openCols.has(c)` (reproduce `closureOf`'s
  `present/perimeter` math with the one extra term; do not fork `closureOf`).
- **Tests:** WG-CS9 in `wall-generate.test.mjs` — a tunnel-carved closed ring reads below
  `FORM_READY_CLOSURE` with `openCols=∅` and `≥ FORM_READY_CLOSURE` with `openCols` = the carved
  columns. AR4 in `aperture-carve.test.mjs` may instead carry this if the fixture is cleaner there
  (one of the two, not both — avoid a duplicate). Assert the default path unchanged on an existing
  WG-CS fixture value.
- **Verify:** `node --test src/view/wall-generate.test.mjs`; WG-CS1-CS8 unchanged. **Commit.**

## Step 3 — climb-gate maps (`climb-gate.mjs` + test)

- `TOOL_DEPARTMENTS.rebuild_arch = ["OPENING"]`; `TOOL_STAGE.rebuild_arch = "detail"`.
- `climb-gate.test.mjs`: assert both (beside the existing `carve_arch`/`frame_arch` asserts);
  a `formReadyGate({tool:"rebuild_arch", closure:0.05})` → `allow:false` sanity assert.
- **Verify:** `node --test src/workshop/climb-gate.test.mjs`. **Commit.**

## Step 4 — the `rebuild_arch` hand + wiring (`picture-climb.mjs`)

- Add `rebuild_arch(occ)` per structure.md (reuse `carve_arch`'s door-resolve + scale preamble;
  `carveTargetCells`; `spring`; `frameArchPlacements` + sill course + `deriveArchHead` voussoir;
  `apertureCoherenceGate(..., {arch:{spring}})`; keep on ok + register `openColumns`; revert to
  `frame_arch` on refute).
- Module-level `let openColumns = new Set()`; thread into `closureNow` (both call sites: round-0
  and the loop). Register `openColumns ∪= apertureColumns(target)` only when the gate **and** the
  accept-gate keep the round (set it inside the hand on `gate.ok`; the climb's accept-gate may
  still roll the round back on picture score — acceptable: an unkept rebuild leaves the aperture
  un-tracked AND the occ reverts, so they stay consistent. If kept-by-hand but rolled-by-climb,
  reset is automatic next `closureNow` since occ is the pre-rebuild build with no open columns —
  but `openColumns` would be stale; guard: only register after the climb keeps. Implementer:
  register in the loop AFTER `gate.accept` for an OPENING tool, reading the hand's target via a
  returned side-channel, OR re-derive the aperture columns from the kept build. Simplest correct:
  compute the declared aperture columns from the program/seed once and add to `openColumns` only
  when an OPENING tool is KEPT by the climb accept-gate.)
- `TOOLS.rebuild_arch`; add the MENU line + JSON enum token; remove `carve_arch` from the MENU +
  enum; update the `formReadyGate` detail-tool list strings (`picture-climb.mjs:454-455,477`) to
  name `rebuild_arch`.
- **Verify:** `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` — wiring + render
  seam, zero spend, no throw. **Commit.**

## Step 5 — real-build evidence (the glance + the numbers)

- A scoped, zero/low-spend probe (a small env-gated block mirroring `ROOF_MATERIAL_PROBE`, or a
  one-off script): close the shell, apply the roof, run `rebuild_arch`, render the rebuilt build
  beside the concept, and print: carved cells, `gate.ok`, the three arch-coherence facts, the
  per-opening `framed/arched`, and `eaveRingClosure` with/without `openColumns` (closure-except-
  aperture). Save the beside PNG + the numbers to the work dir.
- **Record honestly in `progress.md`:** does the gate read as a wide arch on the glance and pass
  the coherence gate with closure-except-aperture holding? Or is wide-opening carving a named
  charter bound (the anti-hedge outcome)? Either is a valid close.
- **Commit** the evidence + artifacts.

## Testing strategy

- **Unit (in `npm test`):** AR1-AR5 + WG-CS9 + the climb-gate map asserts. The both-ways tests
  (arch true / legacy false on one build; gate accept-with-arch / refute-without) are the
  discriminator — they prove the T-201 bug AND the fix in one fixture, on the REAL arch geometry.
- **Byte-stability:** AC1-AC8, WG-CS1-CS8, `closureOf`, default `eaveRingClosure` all unchanged
  (every new behaviour opt-in). Run full `npm test` after Step 2 and again after Step 4.
- **Integration (out of `npm test`):** GUARD_ONLY wiring proof (Step 4) + the Step 5 glance.

## Risks / watch

- **Climb still rolls the kept rebuild back on picture score** (the accept-gate is picture-driven
  for OPENING/detail tools). Then `openColumns` must not be registered. Handle in Step 4 (register
  only on climb-keep). If the picture vote refuses the arch even when it reads right, that is an
  EYES gap to name for S-205, not a hand bug.
- **Closure-except-aperture still dips** if the trim already ate part of the aperture edge → name
  the S-202 coupling (don't lower the threshold).
- **Frozen instrument:** never touch `benchmarks/sculpture/measurements/**`; never re-pin another
  ticket's record; `npm test` green before every commit.
