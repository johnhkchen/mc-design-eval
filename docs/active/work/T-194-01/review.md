# T-194-01 — REVIEW: the charter narrowing, built and judged

**Verdict against the falsifiable claim.** The loop now **carves the declared gatehouse gate to a wide (8-wide),
single, continuous, dressed aperture — scope held, coherence held, closure held on every non-aperture surface.**
The anti-hedge failure mode the gate exists to catch — *"carving reopens holes; the coherence gate can't tell an
opening from a hole"* — **did not occur**: the carve is clean and the gate proves it deterministically (and the
hand self-reverts to recess-only when it doesn't). The charter narrowing is **vindicated at the mechanism level
on this subject.** The remaining gap — the wide arch does not yet clearly *read* on the glance — is **not a carve
failure**: it is the constructed wall being a near-colonnade (closureOf 0.05), the pre-existing sparse-shell
problem that is S-195's domain. This is the ticket's explicitly-named "carve is clean but the substrate doesn't
read" branch, recorded at full strength.

## Files changed

**New (source + tests, in `npm test`):**
- `src/view/aperture-carve.mjs` — the pure core: `carveTargetCells` (widen the declared slot, tunnel-depth),
  `carvedVoidCoherence` (opening-vs-hole), `apertureCoherenceGate` (scope + coherence + closure-except-aperture),
  `carveAperture`. Reuses `carveOccupancy`/`closureCheck`/`componentLabels`/`recessClosureGuard` — no refork.
- `src/view/aperture-carve.test.mjs` — 9 tests (AC1 plane widen, AC1b tunnel depth, AC2 clean accept, AC3 ragged
  reject, AC4 scope-leak reject, AC5 closure-except-aperture, AC6 byte-stable, AC7 width clamp, AC8 coherence).

**Modified:**
- `src/workshop/climb-gate.mjs` — `TOOL_DEPARTMENTS += carve_arch:["OPENING"]` (additive, generic consumers).
- `experiments/eval-alignment/picture-climb.mjs` — the `carve_arch` hand (carve → frame+arch → gate →
  self-revert), registered in `TOOLS`/`MENU`/`agentPick` enum. (NOT in `npm test`.)
- `src/pack/brush-door.conformance.test.mjs` — one allowlist entry: `aperture-carve.mjs` may import the one
  `hollow-carve` exclusion-carve definition (the `shell-integrity`/`roof-swap` composition precedent).

**Work-dir artifacts:** `research.md`, `design.md`, `structure.md`, `plan.md`, `progress.md`, this `review.md`;
`carve-evidence.mjs` (deterministic gate proof), `render-arch.mjs` (GL render reproducer), `before-carve-beside.png`,
`arch-beside.png`.

## The ACs, answered

- **No-air-op narrowed to an aperture-coherence gate (carve only declared openings; closure-except-aperture;
  non-aperture surfaces still no-air-op; unit-tested).** ✔ `apertureCoherenceGate` gates on scope (removed ⊆ the
  declared region — a removal anywhere else is a hard fail, AC4) + coherence + non-aperture closure
  no-regression. The blanket no-air-op (`arch-frame.mjs:92`, `recessClosureGuard` everywhere else) is unchanged;
  carving happens **only** inside `carve_arch`, **only** on a declared `head:"arch"` door, **only** within the
  declared region.
- **Carve+dress hand built (width/shape + head/jambs/sill + S-179 voussoir arch).** ✔ `carve_arch` widens to the
  programmed width, then `frameArchPlacements` dresses jambs/lintel and builds the voxel arch head
  (`archConstruct`/`archRing`). On the gatehouse: width 8, `arched=true`, 12-cell arch ring.
- **The wide arched gate reads beside concept; `closureOf` everywhere-but-aperture not regressed.** ◑ **Closure:
  ✔** — closureOf 0.05→0.05, zero non-aperture columns dropped (the AC's metric, satisfied). **Reads: PARTIAL** —
  the carve is clean and the wide timber-framed opening is present in the render, but it doesn't clearly read as
  an arched gate because the wall substrate is a near-colonnade (S-195), not the carve.
- **Recorded honestly; revert to recess-only if carves can't stay clean; name wide arches a bounded limit if
  so.** ✔ The carves **did** stay clean, so the relaxation is **kept** (not refuted). The hand still carries the
  revert path live (gate-fail → `frame_arch`). The honest bound recorded is different from the one the ticket
  anticipated: not *"carving is unsafe"* but *"the carve is clean; readability waits on a dense wall shell
  (S-195)."*
- **`npm test` green; frozen instrument untouched.** ✔ 2350/0. `git status`: no `measurements/`,
  `bakeoff-score.mjs`, `compile.mjs`, program/pack/schema change.

## Two decisions worth the reviewer's attention (deviations from design.md, made on evidence)

1. **Closure gate = closureOf-no-regression, NOT absolute watertightness.** design.md Decision 2 said reuse
   `closureCheck().closed`. But the gatehouse is never watertight (GLB-voxelized seed; constructed wall is a
   0.05-closure colonnade), so an absolute test rejects *every* clean carve for pre-existing gaps (560 phantom
   "new breaches"). The AC says "closureOf … *not regressed*" — a no-regression statement. The gate uses
   `recessClosureGuard` with the aperture columns excluded (no non-aperture column dropped); the volumetric
   mouth count is reported as evidence, not gated. This is the honest, build-agnostic metric.
2. **Carve depth = tunnel, not single plane.** design.md Decision 3 chose the single exterior plane (smaller
   blast radius). Evidence showed a single-plane carve on a thick/voxelized wall exposes the cavity behind it
   (560 volumetric breaches). A gatehouse gate IS a through-passage; the tunnel carve is both correct and
   closure-clean. `depth:"plane"` is retained for window-like openings.

## Test coverage / gates
- `npm test`: **2350 pass / 0 fail.** The gate + carve geometry are deterministic and fully unit-tested
  (AC1–AC8). The `carve_arch` hand and the climb are GL+LLM (out of `npm test` by design); their evidence is the
  deterministic gate proof (`carve-evidence.mjs`) + the GL beside renders.
- **Coverage gap (named):** `carve_arch` has not been exercised by a *live metered climb pick* (the agent
  choosing it mid-run). The mechanism claim does not need it (the deterministic gate + render carry it, the
  `frame_arch` precedent); a live pick is an S-196 re-climb input.

## Open concerns / handoff
1. **The wide arch's readability is gated by the wall substrate (S-195).** `constructWalls` on the sparse
   gatehouse yields a colonnade (closureOf 0.05); the arch is carved cleanly into it but cannot read against a
   substrate that itself doesn't read as walls. `carve_arch` is ready to land a readable arch the moment S-195's
   dense-shell + relief lands. This is the single most actionable handoff.
2. **Scale/material of the gate** (the wide opening's proportion vs the compact concept) is an S-196 (wider eyes)
   input — the critique still can't see scale.
3. **The volumetric closure signal is retained as reported evidence** (`closure.volumetricNewBreaches`). If a
   future build is genuinely watertight, it becomes a meaningful second check; on today's colonnades it is noise.
