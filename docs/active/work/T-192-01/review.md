# T-192-01 — REVIEW: three hands built, the wall-field win is real on the glance, the arch is an E-49 rebuild

**Result:** the climb gained the three levers it stalled on. Two move their defect visibly; one is honestly
partial. **`articulate_walls` is the standout** — it recolors the dark charcoal wall field to pale dressed
stone, and the beside-concept glance confirms the build jumps from "all-dark blob" to a recognizable grey
gatehouse with pale walls under a dark roof (the dominant WALL major, cleared on the glance). **`frame_arch`
frames both through-passages in dark timber but cannot build a true arch head — the gatehouse passage is a
1-wide slot, so the wide arched gate needs a rebuild the loop can't reach (named for E-49).** **`band_eave`**
adds the lighter eave/verge band. Roof orientation is corrected from the program (the reviewer's 90° rotation),
flagged as recognition-driven because the critique is blind to orientation. `npm test` 2335/0; frozen
instrument untouched.

## Files changed

| File | Change |
|---|---|
| `src/view/arch-frame.mjs` | **New pure module.** `frameArchPlacements(occ, apertures, {frameBlock, minWidth})` → frame (recolor reveal, any width) + voxel arch head (archRing via the registry door `archConstruct`, width-gated; a too-narrow slot is framed and records the E-49 rebuild). No air op; additive/recolor only. |
| `src/view/arch-frame.test.mjs` | **New.** AF0–AF7: arch built on a wide opening, aperture stays open, both jambs framed, narrow slot framed-not-arched (E-49 reason), pure/byte-stable, additive (no cell dropped), both ±x in one call. |
| `src/workshop/climb-gate.mjs` | `TOOL_DEPARTMENTS` += `frame_arch[OPENING]`, `articulate_walls[WALL]`, `band_eave[ROOF]`. No logic change. |
| `src/workshop/climb-gate.test.mjs` | **+CG17** — the override is NOT roof-specific: it keeps an OPENING-targeting hand that cleared its major on a whole-build regression (CG14's shape on a different department). |
| `experiments/eval-alignment/picture-climb.mjs` | Three hands wired into `TOOLS`/`MENU`/`agentPick` enum; `ridgeAxis` derived from `program.masses[0].roof.ridgeAxis`. NOT in `npm test`. |
| `docs/active/work/T-192-01/` | RDSPI artifacts, `render-glance.mjs` + `plateau-beside.png` + `hands-applied-beside.png` (the free GL glance). |

## The per-hand falsification (anti-hedge — how each could fail, and what happened)

| Hand | Dept | Critique fired | Lever | Cleared on glance? | Gate keeps it? |
|---|---|---|---|---|---|
| `frame_arch` | OPENING | "arch head + dark-timber frame around the passage" | frame both passages (29 cells each) + arch head where W≥5 | **Frame yes; arch NO** — passage is W=1, arch head needs a wider opening (**E-49 rebuild**) | Override generalizes to OPENING (CG17, unit-proven); live keep = metered, not run |
| `articulate_walls` | WALL | "field near-black; lost rubble-quoin contrast" | recolor 4405 dark field cubes → pale `stone_bricks`, keep cobblestone quoins | **YES — clear glance win** (dark→pale, quoins now contrast) | Clears the WALL major → override keeps on a regression (CG17 shape); live = metered |
| `band_eave` | ROOF | "lighter stone eave/verge band" (a MINOR) | `composeRoofTreatment` eave+verge in `stone_bricks` | Adds the band (subtle) | **MINOR-only → the major-gated override CANNOT protect it** (kept by scalar/tie only) — a recorded S-191 input |

## The honest answers to the ACs

**Did the S-191 override generalize past the roof?** **At the unit level, yes (CG17)** — it keeps an
OPENING-targeting hand that cleared its major on a whole-build regression, byte-deterministically. A *live*
regression demonstration is metered and not run (see Gaps). For `band_eave` the answer is **no, by design** —
the override is **major-gated**; a hand that clears only a *minor* never trips it. That is a clean finding for
S-191 (extend the override to minors? or accept minors ride the scalar?), surfaced, not forced.

**Any gap needing a rebuild the loop can't reach (E-49)?** **Yes — the wide arched gate.** The gatehouse
passage is a 1-wide slot; a 4-wide arched gate needs the opening *widened* (removing wall = an air op the
facade charter forbids). `frame_arch` frames it but records `arched:false, reason:"needs a wider opening
(a rebuild; E-49)"` per opening. The arch-head capability itself is real and unit-proven on a ≥5-wide opening
(AF1–AF2). Also for E-49/E-33: the build reads **larger than the concept** (scale/proportion, out of scope).

**Closure not regressed; no glance regression elsewhere?** All three hands are additive/recolor (no cell
removed): `frame_arch` adds the arch ring + recolors the reveal; `articulate_walls` recolors field cubes;
`band_eave`'s `composeRoofTreatment` carries `recessClosureGuard` (logged if it ever trips). The glance shows
the wall-field recolor improves WALL with no roof/opening regression (the roof stays dark, the passage stays
open and is now framed).

## Test coverage & gaps
- **Unit (in `npm test`, +9):** `arch-frame.test.mjs` AF0–7 (the new geometry, the only genuinely new logic);
  `climb-gate.test.mjs` CG17 (override generalizes to OPENING + the three department mappings). 2335/0.
- **Wiring (free):** `GUARD_ONLY=1` runner — assets, GL, role resolution, derived orientation, render seam.
- **Glance (free, GL):** `render-glance.mjs` → the before/after beside sheets. The wall-field win is visible
  and was read first-hand.
- **GAP — the metered LLM climb was not run.** It is non-deterministic (T-191: the VOTES=3 scalar can floor
  at 0) and metered; the deterministic proofs (CG17, AF0–7) + the free glance stand without it. Reproduce:
  `CLIMB_OUT=docs/active/work/T-192-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs`.
  This is the standing corroboration: a live demonstration that the agent picks each hand in stall order and
  the gate keeps it (the structural claim is already unit-proven; the live trace would be the witness).

## Open concerns for the human reviewer
1. **The arch is the headline gap, and it is NOT a missing hand — it is a missing *opening*.** The lesson
   T-190 taught for the roof (the ceiling was the ruler, not the hand) repeats for the gate: the hand exists,
   but the build's passage is a 1-wide slot. Widening it is a constructive rebuild (an opening op), the E-49
   scope. The frame is the achievable half.
2. **`articulate_walls` is a broad recolor**, not a per-storey grammar — it paints the whole wall band pale.
   On the gatehouse (one tall hall, one field role) that is correct; on a two-storey subject it would flatten
   a storey split. The hand reads the program's `walls.ground.role`, so it generalizes to the *field block*
   but not yet to a per-storey palette. Named for E-49's generalization.
3. **The critique is blind to orientation** (and, per the 2026-06-17 glance audit, to scale and
   opening-cleanliness). The orientation fix here is recognition-driven; the eyes-gap is the CRITIQUE
   COVERAGE frontier the epic already names. The ruler must learn to see rotation before the loop can climb it.
4. **Frozen instrument untouched** — `git status measurements/` clean; no edit to `bakeoff-score.mjs`,
   `compile.mjs`, the program/pack JSON (roles READ, never written).

## Handoff
Read `hands-applied-beside.png` next to `plateau-beside.png`: the wall field going dark→pale is the whole
story — a visible climb on the dominant WALL major, achieved by a hand the loop did not have. The arch is
framed but not widened (E-49). The engine split is unchanged: pure, tested geometry in `src/view/arch-frame.mjs`
+ `src/workshop/climb-gate.mjs` (17 + 8 tests), the thin metered runner in `picture-climb.mjs`. The single
highest-value next move is **E-49's opening-widening rebuild** (the real arched gate) and a **scale pass**;
the next *gate* move is extending the override to minor-only levers (S-191) so `band_eave` and trim climb too.
