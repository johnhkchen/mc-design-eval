# T-195-01 — Structure

The blueprint for Option C (recolor-the-field → `composeTreatment`). Pure core in `src/view/`, thin hand in
the runner, one-line department registration. Additive everywhere (shared-file collision risk with T-194-01 —
see §Collision).

## Files

### 1. CREATE `src/view/wall-relief.mjs` (the pure core — unit-tested)
The novel logic, GL-free and disk-free so it runs under `npm test`. Reaches all proud/quoin geometry through
`composeTreatment` (the registry door), never a direct technique import.

Imports: `occupancyFromCells, bareBlock` (`./occupancy.mjs`), `composeTreatment` (`./treatment-grammar.mjs`),
`roleBlock` (`../recognition/compile.mjs`).

Exports:
- `recolorWallField(occ, { fieldBlock, floor, eaveY, keep = [] }) → Occupancy`
  Pure recolor: every **cube** (`!occ.forms.has(key)`) with `floor ≤ y ≤ eaveY` whose bare block is not in
  `keep` and is not already `fieldBlock` is rewritten to `fieldBlock`; shaped/stair cells and the `keep` set
  (the dark-oak frame) pass through unchanged. Returns a new occupancy + (via a second return or attached
  field) the recolored count. *This is the step that clears the cobblestone corners so the quoin can emit —
  the move neither existing hand makes.*
- `wallReliefSpec({ fieldBlock, dressBlock, floor, eaveY, includeBase = true, includeTop = false }) → spec`
  Builds a restrained `treatment-grammar/v1` spec (pure data): `field:{recess:true}`,
  `edges.corners:{material:dressBlock, amplitude:{headerDepth:2, run:eaveY-floor+1}}`, plus `base:{material:
  dressBlock, amplitude:{depth:1}}` when `includeBase`, and `edges.top` only when `includeTop` (off by
  default — restraint). **Fail-loud when `dressBlock === fieldBlock`** (replicating `sourceTreatment`'s guard —
  a same-material relief silently no-ops). No `edges.opening` (WALL-only; OPENING is T-194-01's).
- `buildWallRelief(occ, { program, pack, floor, eaveY, includeBase?, includeTop? }) → { occ, closure, report,
  materials:{fieldBlock,dressBlock}, recolored }`
  Orchestrates: resolve `fieldBlock = roleBlock(pack, walls.ground.role)` and
  `dressBlock = roleBlock(pack, walls.dressing.role ?? walls.upper.role ?? walls.ground.role)`; recolor;
  `composeTreatment(recolored, wallReliefSpec(...), { floor, eaveY })`; return its `{occ, closure, report}` plus
  the materials and recolored count. Pure (program/pack are data in; no disk, no GL, no injected dressing).

KEEP set default = `["dark_oak_log"]` (the timber arch frame), parameterizable.

### 2. CREATE `src/view/wall-relief.test.mjs` (prefix `WR`)
`node:test` + `assert/strict`, a small local `boxWithCobbleCorners()` stub (a hollow stone box with cobblestone
corner columns + one dark-oak frame cell), mirroring `treatment-grammar.test.mjs`'s style. Cases:
- **WR1** `recolorWallField` rewrites field cubes to `fieldBlock`, preserves the `keep` (dark-oak) cell and any
  shaped cell; returns the right recolored count.
- **WR2** `wallReliefSpec` shape: `field.recess===true`, `edges.corners.material===dressBlock`, base present
  when asked, `edges.top` absent by default, no `edges.opening`.
- **WR3** `wallReliefSpec` **fail-loud** when `dressBlock===fieldBlock`.
- **WR4 (the crux)** `buildWallRelief` on the cobble-cornered box **emits proud quoins** — `report.byLayer`/
  placements show `corners` placed `> 0` (proudCells>0), i.e. the recolor-first defeats the idempotence no-op.
- **WR5** `closure.ok === true` (recessClosureGuard not regressed; additive proud holds).
- **WR6** purity/idempotence: input `occ` not mutated; same input → byte-stable output (digest equality).

### 3. MODIFY `experiments/eval-alignment/picture-climb.mjs` (the hand — additive)
- Add import: `import { buildWallRelief } from "../../src/view/wall-relief.mjs";` (near the other view imports).
- Add the hand after `articulate_walls` (~line 204):
  ```js
  // THE WALL-RELIEF HAND (WALL) — construction, not recolor. Recolor the wall field to the pale dressed
  // stone AND build proud cobblestone quoins + plinth standing proud of it, so the dressed field reads
  // distinct from the rough rubble corners (the residual WALL item articulate_walls' flat recolor can't
  // clear). The recolor-FIRST is load-bearing: surfaceRelief skips a proud column whose source already IS
  // the relief block, so the quoin no-op'd on the already-cobblestone corners (articulate_walls' note) —
  // recoloring them to the field first makes it emit. Reuses composeTreatment (the E-43 engine, door-routed).
  function relief_walls(occ) {
    const program = loadProgram(PROGRAM_PATH); const pack = loadPackOf(program);
    const floor = occ.bounds.min[1];
    const { occ: out, closure, report, materials, recolored } =
      buildWallRelief(occ, { program, pack, floor, eaveY: CFG.eaveY });
    console.error(`  [relief_walls] recolor ${recolored}→${materials.fieldBlock}; quoins ${materials.dressBlock} placed=${report.byLayer?.corners?.placed ?? 0} base=${report.byLayer?.base?.placed ?? 0}; closure ${closure.ok ? "held" : "REGRESSED "+JSON.stringify(closure)}`);
    return out;
  }
  ```
- Register: add `relief_walls` to `TOOLS` (line 223); add a `MENU` line (steer: "build proud dressed-stone
  relief — recolor the field pale AND stand cobblestone quoins/plinth proud of it; construction, not a flat
  recolor"); add `relief_walls` to the JSON enum string (line 290).

### 4. MODIFY `src/workshop/climb-gate.mjs` (department map — additive, one line)
Add to `TOOL_DEPARTMENTS` (after `articulate_walls`): `relief_walls: Object.freeze(["WALL"]),` with a short
comment. This is what lets the S-191 override keep the hand on a whole-build scalar regression.

### 5. MODIFY `src/workshop/climb-gate.test.mjs` (additive)
Extend the `TOOL_DEPARTMENTS` assertion (~line 342) to include `relief_walls → ["WALL"]`.

### 6. CREATE `docs/active/work/T-195-01/render-relief.mjs` (the glance artifact — zero spend)
A standalone guard-only script (NOT in `npm test`), modeled on the runner's `ROOF_MATERIAL_PROBE`: load the
gatehouse seed → apply `apply_gable_roof` + `recolor_roof` (so the roof matches the climb state) → render a
**triptych** beside the concept: `articulate_walls` (flat recolor) vs `relief_walls` (relief), via
`renderBesideConcept` + `assertGlAvailable`. Writes `relief-beside.png` / `articulate-beside.png` for the
busy-vs-rich judgement. No LLM, no measurement.

## Ordering
1. `wall-relief.mjs` + `wall-relief.test.mjs` (pure core, green in isolation) → commit.
2. `climb-gate.mjs` department entry + test → commit (small, independent).
3. Runner hand wiring (`picture-climb.mjs`) + GUARD_ONLY smoke → commit.
4. `render-relief.mjs` glance + render (if GL) → commit the script + the PNG.

## Module boundaries
- `wall-relief.mjs` owns the recolor + spec + compose orchestration (pure, testable). It does **not** know about
  disk, GL, the climb loop, or the concept image.
- The runner hand owns disk loading (program/pack) + logging only.
- `climb-gate.mjs` owns the department mapping (the override's input).
- The render script owns the glance — separate from the hand so the hand stays pure.

## Collision note (T-194-01 runs in parallel)
T-194-01 (S-194, carve/arch) also edits `picture-climb.mjs` (TOOLS/MENU/enum), `climb-gate.mjs`
(`TOOL_DEPARTMENTS`), and `climb-gate.test.mjs`. Per [[shared-file-commit-sweep]]: keep every edit **additive**,
**re-Read each file immediately before editing**, and **verify `npm test` green before each commit**. My new
`src/view/wall-relief.mjs` + `.test.mjs` are collision-free; the three shared files take only one-line additive
hunks. If the sibling's commit lands first, re-Read and re-apply my hunk on top.
