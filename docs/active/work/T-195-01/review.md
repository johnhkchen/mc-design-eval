# T-195-01 — Review

Story **S-195** / Epic **E-51**. Build a **real wall-relief hand** so the gatehouse walls read as pale dressed
stone with proud quoins/coursing (construction, not the flat recolor `articulate_walls` could only do), and the
WALL major can clear. The judge is the glance.

## What changed

| File | Change |
|------|--------|
| `src/view/wall-relief.mjs` | **NEW.** Pure core: `recolorWallField`, `wallReliefSpec`, `buildWallRelief`. The recolor-then-`composeTreatment` engine. No GL/IO. (Committed in `786ee86`.) |
| `src/view/wall-relief.test.mjs` | **NEW.** WR1–WR6 unit tests. (Committed in `786ee86`.) |
| `experiments/eval-alignment/picture-climb.mjs` | `relief_walls(occ)` hand (thin wrapper over `buildWallRelief`); `buildWallRelief` import; `TOOLS`/`MENU`/JSON-enum registration. (`011e114`.) |
| `src/workshop/climb-gate.mjs` | `relief_walls → ["WALL"]` in `TOOL_DEPARTMENTS`. (`011e114`.) |
| `src/workshop/climb-gate.test.mjs` | assertion for the new department. (`011e114`.) |
| `docs/active/work/T-195-01/render-relief.mjs` + `*-beside.png` | the zero-spend glance triptych + verdict. (`011e114`.) |

`measurements/` (the frozen instrument) untouched. No schema, no BAML, no gate-logic changes — `relief_walls`
is a new lever, the accept-gate/override are unchanged.

## The core idea (what made it work)

`articulate_walls` recolors a flat plane; the residual WALL critique wanted the dressed field reading **distinct
from** proud rough rubble corners — relief the recolor cannot build. And `composeTreatment`'s quoin no-op'd in
`articulate_walls` (`proudCells=0`) because **`surfaceRelief` skips a proud column whose source cell already IS
the relief material** (the idempotence rule) and the gatehouse corners are already cobblestone == the quoin
material. The fix: **recolor the field (corners included) to the pale dressed block FIRST, then compose the
proud cobblestone quoin/plinth** — now the corner source is `stone_bricks ≠ cobblestone`, so the proud quoin
emits. Recolor fixes the value defect; compose builds the relief. All proud geometry is reused from the E-43
`composeTreatment` engine through the registry door (no direct technique import — brush-door clean).

## Evidence (on the real gatehouse, not just the synthetic test)

`relief_walls` on the seed: **recolor 3632 → stone_bricks; 215 proud quoin cells + 106 plinth cells**
(`articulate_walls`: 0); **closure ok=true, improved 0.615 → 0.779, droppedColumns=0**. 321 proud construction
cells where the flat recolor builds none — the construction-vs-recolor proof, on the real subject.

**Glance verdict (render, busy-vs-rich):** **richer, not busier.** `articulate-beside.png` reads as a uniform
smooth grey mass; `relief-beside.png` shows proud corner quoins + a base plinth — corner-emphasised dressed
masonry, the concept's light-grey-stone reading. Restraint (base + quoins only, no field clinker belt, no
cornice) held the E-43/E-35 amplitude lesson. Honest caveat: at gate-camera distance the relief is *modest*
(1–2-voxel proud on a ~15-wide build) — a clear but not dramatic step up; bolder amplitude is the spec knob
(`headerDepth`, plinth depth) and risks busy, so restraint is the right default.

## Acceptance criteria

- [x] **Wall-relief hand built via E-43 relief ops, not recolor; pure parts unit-tested.** `buildWallRelief`
      reuses `composeTreatment` (door-routed). WR1–WR6 cover recolor, spec, fail-loud, the proud-quoin-emits
      crux (WR4), closure, purity.
- [x] **Walls read as pale dressed stone with relief beside concept; WALL major clears OR residual localized to
      S-196.** Glance shows pale dressed stone + proud quoins/plinth (richer). The metered WALL-major-clears
      verdict is deferred to **T-196-01** (the loop's re-climb); if the critique still scores it flat that is
      the **S-196 critique-coverage gap**, localized here — not a hand gap (the hand demonstrably builds 321
      proud cells).
- [x] **`closureOf` not regressed; busy-vs-rich reported on the render.** Closure improved (0.615→0.779, 0
      dropped); busy-vs-rich reported above (richer).
- [x] **Recorded honestly:** richer (not busier); modest-but-real; hand-gap vs eyes-gap localized.
- [x] **`npm test` green; frozen instrument untouched.** 2349/2349; no `measurements/` edits.

## Test coverage & gaps

- **Covered (in `npm test`):** the entire pure core — `recolorWallField` correctness + keep/shaped pass-through
  (WR1), spec shape/restraint (WR2), the `dress===field` fail-loud (WR3), **the recolor-first proud-quoin
  emission crux** (WR4: raw box `placed=0` → recolored `placed>0`), closure-not-regressed (WR5),
  purity/no-mutation/byte-stability (WR6); the department registration (`climb-gate.test.mjs`).
- **Not in `npm test` (by design — the runner is metered/GL):** the `relief_walls` runner wrapper and the
  glance render. Smoke-verified via `GUARD_ONLY=1` (dispatch + render seam) and the standalone
  `render-relief.mjs` (produced the beside sheets, logged the 215/106/closure numbers).
- **Gap (intended):** no metered DiagnoseBuild assertion that the WALL major clears — that is T-196-01's
  re-climb, and would burn the metered budget here. Flagged, not hidden.

## Open concerns / handoff

1. **The WALL-major-clears claim is unproven until the metered re-climb (T-196-01).** This ticket proves the
   *hand* + the *glance*; if the critique is relief-blind, S-196 widens the eyes. The falsifiable risk
   ("critique still can't see relief") is genuinely open and correctly routed downstream.
2. **Coexists with `articulate_walls`.** Both target WALL; the agent picks via the MENU descriptions (relief =
   construction/dressed, articulate = flat recolor). Whether the climb *prefers* relief (and whether
   `articulate_walls` should be retired) is an S-196 policy observation, not this ticket's call.
3. **Parallel-thread collision (T-194-01), resolved.** The sibling's whole-tree `git add` swept my Step-1 files
   into commit `786ee86` (intact, green). My remaining hunks were staged **explicitly** (`011e114`) to avoid
   sweeping the sibling's still-in-flight `aperture-carve.mjs` / `carve-evidence.mjs`. The two hands
   (`relief_walls` WALL, `carve_arch` OPENING) are additive and non-overlapping. No shared-logic conflict.
4. **Amplitude is a knob, not a constant.** If the T-196-01 glance reads the relief as too subtle, raise
   `headerDepth`/plinth depth or enable `includeTop` (the cornice) — but each notch risks the busy tell; tune
   on the render. `wallReliefSpec` exposes `includeBase`/`includeTop` for exactly this.

## Critical issues for a human reviewer
None blocking. The one judgment call worth a glance: the relief is **real but modest** at gate-camera distance
(321 proud cells, corner-emphasised). It is a defensible step up from flat recolor and holds closure; whether
it is *bold enough* to clear the metered WALL major is the open T-196-01 question this ticket deliberately does
not pre-judge.
