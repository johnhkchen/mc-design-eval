# T-203-01 — Research

**Ticket:** wide arched gate by **rebuild**, not widen-carve (E-52 / S-203, the defining feature).
**Depends on:** T-202-01 (the plane-closure metric, landed at `47b7688`).
Descriptive map only — no solution here.

## The thing to explain: why the live carve_arch can never keep an arch

The E-49 capstone (T-201) logged the exact failure this ticket exists to fix. From
`docs/active/work/T-201-01/climb.log` (round 3, the `carve_arch` pick):

```
[carve_arch] -x: width=7 carved=351 framed=true arched=true
[carve_arch] gate ok=false — ragged carve: notched columns 3,4,8,9 (scope=true coherent=false closure=true)
[carve_arch] REFUTE: aperture-coherence gate rejected the carve — reverting to recess-only (frame_arch)
[frame_arch] +x: framed=true arched=false — passage too narrow for an arch head — needs a wider opening (a rebuild; E-49)
[frame_arch] -x: framed=true arched=false — passage too narrow for an arch head — needs a wider opening (a rebuild; E-49)
```

The carve itself was clean: `scope=true` (nothing removed outside the declared region),
`closure=true` (no non-aperture wall column dropped), 351 cells carved into a wide rectangle.
The refute came from `coherent=false`: **notched columns 3,4,8,9** — the two columns at *each*
end of the 7-wide span. That is the arch-spandrel signature, not a ragged carve.

### The mechanism (read from the code, three modules)

1. `carve_arch` (`experiments/eval-alignment/picture-climb.mjs:230`) calls
   `carveTargetCells` → removes the *whole* rectangle `[uLo..uHi]×[vLo..vHi]` across the tunnel
   depth (a clean wide void), then `frameArchPlacements` to dress it.
2. `frameArchPlacements` (`src/view/arch-frame.mjs:66`) recolors the jambs/lintel **and ADDS**
   the voxel arch ring (`archConstruct` → `archRing`) — full-cube spandrel cells into the upper
   corner air, turning the rectangle into an arch. Spring `= max(vLo+1, vHi − floor(radius))`,
   `radius = W/2`, yRange `[spring, vHi]`.
3. The gate `apertureCoherenceGate` (`src/view/aperture-carve.mjs:172`) runs
   `carvedVoidCoherence` (line 140) on the *dressed* occupancy. Its `continuous` conjunct
   requires **every** column `au∈[uLo,uHi]` to be air over the **full** height `[vLo,vHi]`
   (line 144-152). The arch ring re-solidified the end columns above the springline → those
   columns are no longer air over the full height → `notches.push(au)` → `continuous=false`.

**Conclusion (the crux):** the `continuous` conjunct is *fundamentally incompatible with a
voxel arch head.* Any arch fills its upper corners; that is what an arch IS. So `carve_arch`,
which carves-then-arches-then-checks-full-height-continuity, can NEVER keep an arch — it carves
a clean wide hole and then refutes its own dressing. It always falls back to `frame_arch`, which
on the 1-wide gatehouse slot frames a too-narrow slot ("needs a wider opening (a rebuild)").

The carve is right; the **coherence check is the wrong shape for an arched void.** That is the
single seam to fix.

## The pure parts that already exist (reuse, do not re-implement)

| Part | Where | What it gives |
|------|-------|---------------|
| `carveTargetCells(occ, declaredAperture, {programW, scale})` | `aperture-carve.mjs:70` | The wide removable cell set + `target {ax,uLo,uHi,vLo,vHi,wStar,wMin,wMax,width,widenedRegion}`. Width clamps to `[minArchWidth=5, maxWidth=9]` so an arch is always buildable. **Already correct.** |
| `carvedVoidCoherence(afterOcc, target)` | `aperture-carve.mjs:140` | single + continuous(full-height) + notches. The full-height window is the bug for arches. |
| `apertureCoherenceGate(before, after, target, {floor,eaveY})` | `aperture-carve.mjs:172` | 3-conjunct gate: SCOPE (no leak), COHERENT (the above), CLOSURE-except-aperture (`recessClosureGuard` minus aperture columns + reported volumetric). SCOPE + CLOSURE are arch-agnostic and correct; only COHERENT mis-fires. |
| `frameArchPlacements(occ, apertures, {frameBlock, minWidth})` | `arch-frame.mjs:66` | frame (jambs+lintel recolor) + arch ring (spandrels) placements + `perOpening`. Already builds head+jambs. No sill. |
| `archRing(spec)` / `flatHead(spec)` | `shaped-vocab.mjs:179` | voxel-circle aperture/ring/headCells/jambCells. Reached only via `archConstruct` (brush-door, `idiom-registry.mjs:153`). |
| `deriveArchHead(aperture)` | `treatment-grammar.mjs:447` | **S-179** voussoir: per-column `crown` air cell + `voussoirs` (the wedge stone one step toward the lintel) + `curve`. The AC's "voussoir from S-179." |
| `deriveOpeningEdges(aperture)` | `treatment-grammar.mjs:421` | `isArch` (bbox interior solid). |
| `eaveRingClosure(occ, {floor,eaveY})` | `wall-generate.mjs:292` | **The S-202 plane metric.** Clamps band columns to `robustExtent(…PROUD_TRIM)` then `closureOf(perimeterColumns(footprint))`. Invariant to proud detail (T-202). No aperture awareness yet. |
| `perimeterColumns(F)` / `closureOf(ring)` / `robustExtent` | `wall-generate.mjs:69/160/117` | The one closure authority. `closureOf` = fraction of the bbox-rectangle perimeter the ring occupies. |
| `recessClosureGuard(before, after, {floor,eaveY})` | `treatment-grammar.mjs:302` | column-drop no-regression guard the gate's CLOSURE conjunct uses. |

## The climb wiring (the OPENING lever path)

- `picture-climb.mjs` HANDS: `frame_arch` (203), `carve_arch` (230), and the apply loop.
- `TOOLS` (337) dispatch map; `MENU` (338) the agent-visible tool list; the JSON enum at line 477.
- `climb-gate.mjs`: `TOOL_DEPARTMENTS` (`carve_arch:["OPENING"]`, 50), `TOOL_STAGE`
  (`carve_arch:"detail"`, 81), `formReadyGate` (98) — a DETAIL tool is locked until
  `closure ≥ FORM_READY_CLOSURE` (0.9). `closureDecidedMove` (93) — only WALL-form moves.
- `climb-gate.test.mjs` asserts the department/stage maps (lines 150, 346-355) — additive edits
  need a matching assertion. `aperture-carve.test.mjs` (AC1-AC8) pins the pure gate — must stay
  byte-stable (any arch extension must be opt-in).

### The S-202 ↔ S-203 coupling (named in the ticket, real)

The declared gate is a **through-tunnel** on the `-x` gable end (program: `wall:-x, kind:door,
w:4, h:8, head:arch`; `rect 15×15`). `carveTargetCells` removes a z-swath across the full
x-depth. Those `(x,z)` columns are **perimeter** columns of the footprint bbox — so after a kept
rebuild, `eaveRingClosure` drops (T-201 width-7 ≈ 14/56 perimeter columns lost → ~0.75 < 0.9).

The climb reads `closureNow = eaveRingClosure(occ)` every round (`picture-climb.mjs:586,610`) to
gate detail and to let the agent pick `close_shell`. If the post-rebuild closure reads < 0.9:
the next detail pick is **locked**, the agent is told to `close_shell`, and `closeShell` rebuilds
the dense program ring — **re-filling the aperture and destroying the gate**. That is the
oscillation the ticket warns of. The fix must make the plane metric read **closure-except-
aperture**: the declared-open columns count as intentional, not as holes. T-202's review §"open
concerns" explicitly hands this reconciliation ("open by design vs open by defect") to T-203.

## Assets / fixtures

- Program: `benchmarks/sculpture/recognition/gatehouse.program.json` (door `-x`, w4 h8 arch).
- Seed: `benchmarks/sculpture/generated/gatehouse/artifact.json`; pack `packs/rustic.json`
  (`frame.timber → dark_oak_log`); `CFG.eaveY=18`, `ridgeAxis` recognition-declared.
- Pure tests run under `src/**/*.test.mjs` (`npm test`, 2400 green at `47b7688`). The metered
  climb is NOT in `npm test`; real-build evidence is the GUARD_ONLY render seam / a scoped probe.

## Constraints

- Frozen instrument untouched (`benchmarks/sculpture/measurements/**`); subscription shim only.
- Recess-by-exclusion holds OUTSIDE the declared aperture (the carve is the one sanctioned air op).
- PURE core (no GL/IO/Date/random), byte-stable; the existing AC1-AC8 gate tests must not move.
- Anti-hedge: if even the arch-aware rebuild can't keep a clean wide aperture (or closure-except-
  aperture won't hold without coupling S-202), that is a charter bound to **name**, not paper over.
