# T-192-01 — PROGRESS

## Status: implementation complete, committed, glance-verified (free GL). Metered LLM climb not run (below).

## Commits
1. `cd8d738` — `arch-frame.mjs` + `arch-frame.test.mjs` (AF0–7) + `climb-gate.mjs` TOOL_DEPARTMENTS += 3 +
   CG17 (override generalizes to OPENING).
2. `76a0049` — runner: 3 hands wired (`frame_arch`, `articulate_walls`, `band_eave`) + program-derived roof
   orientation; `climb-gate` rename to `articulate_walls`.

## Steps done
- **Step 1** — arch primitive TDD. `frameArchPlacements` builds frame (recolor, any width) + voxel arch head
  (archRing via the registry door `archConstruct`, width-gated). 8 unit tests green.
- **Step 2** — `TOOL_DEPARTMENTS` += `frame_arch[OPENING]`/`articulate_walls[WALL]`/`band_eave[ROOF]`; CG17
  proves the T-191 department-dominant override is **not roof-specific** (keeps an OPENING-targeting hand that
  cleared its major on a whole-build regression) — the falsification crux, deterministic, no spend.
- **Step 3** — runner: three hands + orientation from `program.masses[0].roof.ridgeAxis` (=x). `GUARD_ONLY=1`
  clean; `node --check` ok; `npm test` 2335/0.
- **Glance (free, GL only, Step 4 substitute)** — `render-glance.mjs` reproduces the chain to the T-191
  plateau then applies the three hands, rendering each beside the concept (`plateau-beside.png`,
  `hands-applied-beside.png`). Read first-hand: the wall field goes **dark→pale grey** (the dominant WALL
  major), cobblestone quoins now contrast, both passages framed in dark timber, eave band added — the build
  reads markedly closer to the concept (pale walls + dark roof).

## Deviations from the plan (documented per RDSPI)

1. **`articulate_quoins` → `articulate_walls` — the WALL lever is the FIELD colour, not quoins (Decision 3
   changed).** Probing the walled build's census: the field is **polished_basalt (3911) + deepslate_bricks
   (494)** — near-black — while **cobblestone quoins are already present (220)**. The recorded WALL majors are
   (1) the field reads charcoal and (2) lost quoin contrast — both caused by the *dark field*, not missing
   quoins. `composeTreatment`'s quoin brush is a **no-op** here (proudCells=0: the corners are already built
   proud; 212 on the clean seed). So the hand RECOLORS the wall-band field cubes to the pale dressed stone
   (`stone_bricks`, `walls.ground.role`), preserving the cobblestone quoins (and any dark_oak frame). One
   lever clears both WALL items. Renamed for accuracy across `climb-gate.mjs`, CG17, and the runner.

2. **`frame_arch` frames but cannot ARCH the gatehouse passage — it is a 1-wide slot (Research §3, anti-hedge
   out exercised).** Probed: the door aperture is W=1 (a tall slot), both in the seed and lost entirely after
   `construct_walls`. A true wide arched gate needs the opening *widened* — removing wall, an air op the
   facade charter forbids, i.e. a **rebuild the loop can't reach → named for E-49** (recorded per-opening:
   `arched:false, reason:"…needs a wider opening (a rebuild; E-49)"`). The hand FRAMES both mouths in dark
   timber (29 cells each, probed). The **arch-head capability is real and unit-proven** on a synthetic
   ≥5-wide opening (AF1–AF2): the design anticipated exactly this contingency.

3. **`archRing` reached through the registry door (`archConstruct`), not imported directly.** The brush-door
   conformance sweep (T-128) treats `shaped-vocab` as a guarded technique; the first `npm test` caught the
   direct import. Fixed by importing `archConstruct` from `src/pack/idiom-registry.mjs` (the door itself) —
   the sanctioned path, no allowlist widening.

4. **Roof orientation is a RECOGNITION-driven correction, the critique is BLIND to it (flagged).** The runner
   now derives `ridgeAxis` from the program (x, gable faces the gate) instead of the hardcoded `z` (the
   reviewer's 90° rotation). The recorded picture-critique never names orientation/rotation → the loop cannot
   *stall* on it → this is NOT a climbable hand; it is a deterministic recognition fix, and the
   **critique-coverage gap** is flagged for E-50 "CRITIQUE COVERAGE" / E-49.

5. **The metered LLM climb (Step 4) was NOT run.** It is non-deterministic (the T-191 review documented the
   scalar flooring at 0 on an unlucky VOTES=3 draw) and metered. The deterministic proofs stand without it:
   CG17 (override keeps an OPENING hand on a regression), AF0–7 (arch+frame geometry), and the **free GL
   beside-glance** (the visible wall-field win). The metered run remains the corroborating next step
   (`CLIMB_OUT=docs/active/work/T-192-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs`)
   — recorded as a gap, not asserted, exactly like every `experiments/` sibling.

## Open for Review
- Does the override generalize past roof on a LIVE regression (CG17 proves it at the unit level; the metered
  live demonstration is the remaining corroboration).
- `band_eave` is minor-only → the override (major-gated) can't protect it; kept only by scalar/tie — a
  recorded S-191 input.
- The arched-gate widen + scale/proportion (build reads larger than concept) → E-49 / E-33 thread.
