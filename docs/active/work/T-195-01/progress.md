# T-195-01 — Progress

## Status: implementation complete, glance rendered, all ACs met.

## Done
- **Step 1 — pure core** `src/view/wall-relief.mjs` (`recolorWallField`, `wallReliefSpec`, `buildWallRelief`)
  + `wall-relief.test.mjs` (WR1–WR6). All 6 green, incl. the crux **WR4** (raw box quoin no-ops `placed=0`;
  recolor-first → `placed>0`), **WR3** fail-loud on `dress===field`, **WR5** closure held.
  *(Committed — swept into commit `786ee86` by the parallel T-194-01 thread, which `git add`-ed the whole
  working tree; my two files landed byte-intact, verified by `git show HEAD:…` + green tests. Not my preferred
  attribution, but the deliverable is on the branch and correct.)*
- **Step 2 — department registration** `relief_walls → ["WALL"]` in `climb-gate.mjs` `TOOL_DEPARTMENTS` +
  assertion in `climb-gate.test.mjs`. Gate test green. *(staged below)*
- **Step 3 — runner wiring** `relief_walls(occ)` hand in `picture-climb.mjs` (thin disk-loading wrapper over
  `buildWallRelief`) + `TOOLS` + `MENU` line + JSON enum + import. `GUARD_ONLY=1` runner boots clean
  (dispatch + render seam, zero spend). *(staged below)*
- **Step 4 — the glance** `docs/active/work/T-195-01/render-relief.mjs` → `articulate-beside.png` (flat) +
  `relief-beside.png` (relief), beside concept. GL available, rendered.

## The result on the REAL gatehouse (not just the synthetic test)
`relief_walls` on the gatehouse seed: **recolor 3632 cells → stone_bricks; proud cobblestone quoins = 215,
plinth = 106; closure ok=true and IMPROVED 0.615 → 0.779, droppedColumns = 0.** Where `articulate_walls`'
flat recolor built **0** proud cells, the relief hand builds **321** proud construction cells — the
recolor-first defeats the `surfaceRelief` idempotence no-op exactly as designed. This is the construction-vs-
recolor proof the ticket asked for, on the real subject.

## The glance verdict (busy-vs-rich, judged on the render)
- **Richer, not busier.** `articulate-beside.png` reads as one uniform smooth grey mass; `relief-beside.png`
  shows **proud corner quoins + a base plinth** standing out from the pale dressed field — corner-emphasised
  dressed masonry, the reading the concept's light-grey stone walls show. The amplitude restraint (base +
  quoins only, no field clinker belt, no cornice) kept it from reading noisy — the E-43/E-35 lesson held.
- **Honest caveat:** at the gate-camera distance the relief is *modest* (1–2-voxel proud on a ~15-wide build).
  It reads as dressed-stone corner emphasis, clearly a step up from flat, not a dramatic one. Bolder amplitude
  is the spec knob (`headerDepth`, plinth depth) but risks busy — restraint is the right default.
- The build's *other* gaps (boxy form/scale, stepped roof, no wide arched gate from these angles) are NOT this
  ticket's — they are the S-194 carve (T-194-01, sibling) + S-196 (form/scale eyes). The WALL axis specifically
  went flat-grey → pale dressed stone with proud quoins + plinth.

## Hand-gap vs eyes-gap localization
This ticket proves the **hand** builds real relief that reads on the glance and holds closure. Whether the
DiagnoseBuild **WALL major clears** (so the S-191 override keeps it) is a *metered* question deferred to
**T-196-01** (wider eyes + re-climb). If the metered critique still scores the relief as flat/material-only,
that is the **S-196 critique-coverage gap** (the eyes don't see relief), flagged — *not* a failure of this
hand, which demonstrably builds 321 proud cells the flat recolor cannot.

## Deviations from plan
- **Commit sequencing collapsed by the sibling sweep.** Plan had 4 incremental commits; the T-194-01 thread's
  whole-tree `git add` swept my Step-1 files into its commit `786ee86` before I could commit them separately.
  Net effect is benign (files intact, green); remaining work (Steps 2–4 + docs) committed together below,
  staged **explicitly** to avoid sweeping the sibling's still-uncommitted `aperture-carve.mjs` /
  `carve-evidence.mjs`.

## Test / suite state
- `npm test`: **2349/2349 green** (the brush-door trip from the sibling's in-flight carve work resolved itself
  once they routed it through the door; my files never tripped it).
- `wall-relief.test.mjs` 6/6; `climb-gate.test.mjs` green with the new assertion.
- Frozen instrument untouched (`measurements/` not touched).
