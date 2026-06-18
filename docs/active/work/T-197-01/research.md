# T-197-01 — Research

Story S-197 / Epic E-51. **Close-the-shell form hand + form-before-detail climb ordering.** Descriptive
map of what exists, where, and the measured ground truth. No solutions here.

## The problem, measured (not asserted)

The reviewer's finding — the gatehouse is an open colonnade — is real and I reproduced it with a pure probe
(`/tmp/closure-probe.mjs`, against the live seed + program):

```
seed wall-band ring closure (closeColumns→perimeter): 0.615   ← gappy colonnade
registerRect dense program-rect ring closure:          1.000   ← dense shell IS available
  axis=identity coverage=0.69 ambiguous=true  scale=(1.73,1.67)
AFTER constructWalls: band perimeter closure:          0.615   ← constructWalls does NOT close it
```

**Root cause located.** The dense, watertight shell already exists inside `registerRect` — the program's
`masses[0].rect` (15×15) registered to the build frame yields a perimeter ring with **closure 1.000** and
coverage 0.69 (above the FLOOR=0.5 trust gate). But `constructWalls` *suppresses* it:

```js
const useReg = reg && !reg.ambiguous && closureOf(reg.ring) > closureOf(closeRing);
```

`reg.ambiguous` is `true` because the gatehouse footprint is **near-square** (15×15): `registerRect` flags
`ambiguous` when `nearSquare && |coverage(identity) − coverage(swap)| < EPS` — the two axis assignments tie.
So `useReg=false`, it falls back to the close-derived ring (closure 0.615), and the shell stays open. This
is exactly the standing finding [[wall-construct-needs-dense-shell]] (replace-via-occupancy walls climb only
on dense shells; sparse → colonnade) and the [[cottage-gate-and-volume-gate-are-one-fix]] note (build from
program masses[]/absolute footprint, not ragged occupancy). The ticket's quoted ~0.05 is a stricter measure
elsewhere (solid-only / post-carve); my 0.615 is the close-ring band measure — either way the shell is open
and the dense rect is being thrown away. Both numbers recorded honestly.

**The fix is available and composable.** A second probe (`/tmp/closeshell-probe.mjs`) solidifies the dense
program-rect ring floor→eave, drops stray posts outside its bbox, and keeps everything above the eave:
```
AFTER closeShell: band perimeter closure 0.615 → 1.000;  roof cells (y>eave) 1177 → 1177 PRESERVED
```
The dense shell closes the gatehouse AND leaves the won roof byte-untouched. The near-square axis tie is
*immaterial* for a square footprint — identity and swap produce the same square ring — so the `ambiguous`
guard is over-conservative here, not protecting against a real error.

## Where the code lives

### `src/view/wall-generate.mjs` (the wall-form substrate, PURE)
- `registerRect(masses, cols, opts)` — registers a program's `masses[].rect` to the build frame using the
  occupancy's wall-band columns for scale/offset only. Returns `{transform, ring, coverage, axis, scale,
  ambiguous, extent, reason}`. The `ring` is `perimeterColumns(filledRect(rect))` per mass → always a closed
  rectangle (closure ~1). `ambiguous` = coverage below FLOOR (0.5) **OR** near-square axis tie. This is the
  dense-shell engine; the close-the-shell hand should *use* its ring without the ambiguity suppression.
- `closureOf(ring)` — fraction of a ring's bbox-rectangle perimeter it occupies (1 = watertight, <1 =
  colonnade). The form-readiness metric primitive.
- `perimeterColumns`, `closeColumns`, `coverageOf`, `robustExtent`, `constructWalls` — the existing brush.
  `constructWalls` deletes band cells in ring columns then solidifies the ring in each column's local
  material; keeps roof (y>eave) and interior verbatim; carves a program/derived opening rhythm. It is the
  *current* wall hand; T-160 deliberately gated the dense-rect path on `!ambiguous` to avoid cottage/barn
  regression — so changing that guard in-place is risky. A dedicated form hand avoids that blast radius.

### `src/workshop/climb-gate.mjs` (the climb's DECISIONS, PURE — no occ, no GL)
- `TOOL_DEPARTMENTS` — tool → departments it touches (the eyes-vs-hands labels). All E-51 hands registered
  (`carve_arch`, `relief_walls`, `band_eave`, etc.). A new `close_shell` belongs here (WALL).
- `acceptsRound`, `stoppingDecision`, `classifyInventory`, `deptMajorCounts/deptItemCounts`, `buildDigest`.
- **No ordering / stage concept exists yet.** The gate decides *keep/rollback* and *stop*, never *eligible*.
  This module takes scalars + items, never an occupancy — so a form-readiness gate here must take a **closure
  scalar**, computed upstream (the geometry stays in wall-generate; the decision stays here). Clean seam.

### `experiments/eval-alignment/picture-climb.mjs` (the metered runner, NOT in npm test)
- Hands are plain `occ→occ` functions; `TOOLS` map + `MENU` strings + the agent-pick JSON enum. The S-192
  and E-51 hands (`frame_arch`, `carve_arch`, `articulate_walls`, `relief_walls`, `band_eave`) are wired
  here. The loop: `scoreBuild` (renders + VOTES median DiagnoseBuild) → `agentPick` → apply → `acceptsRound`
  (department-dominant override) → `stoppingDecision`. `GUARD_ONLY=1` renders round-0 + beside, zero spend.
- The framing eyes (T-196-01, `framingReport`) are already wired as REPORTED-not-scored per round — the exact
  precedent for attaching a pure geometric read to the loop. The ordering gate follows the same seam.
- `construct_walls` hand loads program+pack and calls `constructWalls` + `wallSkin` (envelope AND skin AND
  openings in one — it conflates form with detail). The close-the-shell hand should be **form only**.

### `src/view/occupancy.mjs`
- `occupancyFromCells([{pos,block,form?,state?}])`, `artifactOccupancy`. `occ.cells` is a `Map("x,y,z"→block)`,
  `occ.bounds = {min,max}` inclusive. The closeShell brush reads/writes via this.

## Assets / constants (real values)
- Seed: `benchmarks/sculpture/generated/gatehouse/artifact.json` (bounds min[-13,0,-13] max[13,24,13], 4809
  cells). Program: `benchmarks/sculpture/recognition/gatehouse.program.json` — `masses[0].rect {x0:0,z0:0,
  w:15,d:15}`, `storeys 4 × storeyHeight 5`, ridgeAxis x, door on -x. eaveY 18 (`CFG.eaveY`).
- `registerRect` FLOOR=0.5; gatehouse coverage 0.69 → trustworthy. `CLIMB_DEFAULTS` margin 4 / stallK 2 /
  maxRounds 5 / minRounds 3.

## Constraints / assumptions
- Frozen instrument (`measurements/`) untouched — this is a creation-loop change only [[recognition-not-reconstruction]].
- Recess-by-exclusion outside declared apertures [[facade-recess-by-exclusion]]: closeShell ADDS mass (solid
  ring) and drops strays; the only sanctioned air op stays `carve_arch` for the declared gate.
- `climb-gate.mjs` must stay occ-free / PURE (its whole point). Form-readiness measurement lives in
  wall-generate; the gate consumes the scalar. Mirrors the framing-eyes seam (geometry in framing.mjs,
  reporting in the runner).
- Anti-hedge [[anti-hedge-falsifiable-commitment]]: if the dense shell can't form on this seed I must name
  the geometry wall, not fake density. Probes show it DOES form (0.615→1.0) — recorded as the live result.
