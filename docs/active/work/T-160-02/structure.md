# T-160-02 Structure — file-level blueprint

*The shape of the code, not the code. Grounded in design.md.*

## Files

| File | Action | Why |
|---|---|---|
| `src/view/wall-skin.mjs` | **CREATE** | The pure wall-skin brush + plan derivation + pack treatments. |
| `src/view/wall-skin.test.mjs` | **CREATE** | WS1–WSn unit tests, co-located, under `src/**/*.test.mjs`. |
| `experiments/eval-alignment/autonomy-loop.mjs` | **MODIFY** | Fold skin into `construct_walls`; load pack; drop `wallField`; add witness subject. |
| `experiments/eval-alignment/results/{autonomy-*,volume-ledger}.json` | regenerated | Batch output (measurement leg). |
| `docs/active/work/T-160-02/{*.png, batch.log, RDSPI artifacts}` | produced | Renders + run log + phase docs. |

No edits to `compile.mjs`, `facade-articulation.mjs`, `clinker.mjs`, `limewash.mjs`, `zone-fill.mjs`,
`opening-dressing.mjs`, `idiom-registry.mjs`, `wall-generate.mjs`, or `defect-eval.mjs` — this ticket
**wires** existing brushes. (One *optional* `constructWalls` tweak — accept the derived fill — is additive
and byte-default; see below.)

## `src/view/wall-skin.mjs` — public interface

```js
// imports: roleBlock, applyArticulation (compile.mjs); occupancyFromCells, bareBlock (occupancy.mjs);
//          extractApertures, dressOpenings (opening-dressing.mjs)

/** Board-family test for the clinker gate (planks/log read as boarded). PURE. */
function isBoardFamily(block) -> boolean

/** Build the dressOpenings treatments {slots:{infill,shutter,door,light,frame}} from pack roles.
 *  Each slot omitted when its role is absent (no per-subject constants). PURE. */
export function packTreatments(pack) -> { slots }

/** Derive the articulation plan from a program's declared wall roles + pack. Emits {brush,params}[]
 *  in apply order: surface.fill (per-storey) → surface.clinker (boarded upper) → quoin → surface.limewash
 *  (iff wall.finish.limewash role) → surface.relief (plinth base course). zoneOf closures are runtime
 *  (the loop's plan is computed, not a committed replay artifact). PURE. */
export function wallSkinPlan(program, pack, { floor, eaveY }) -> [{ brush, params }]

/** THE BRUSH. Skin the constructed envelope as construction-centric relief from roles. occ→occ.
 *  No program OR no pack ⇒ returns occ unchanged (gatehouse graceful degradation). PURE. */
export function wallSkin(occ, { program, pack, floor, eaveY }) -> occ
```

### Internals / contracts

- `overlay(cells, placements)` — local last-writer-wins merge (the registry's `overlayCells` rule):
  `Map` of `"x,y,z"→{pos,block,form?,state?}`, placements overwrite, blocks stored namespaced, then
  `occupancyFromCells([...map.values()])`. (Re-implemented locally so the brush stays self-contained and
  pure; identical semantics to `idiom-registry.overlayCells`.)
- `wallSkinPlan` reads **only** `program.masses[]` (the first mass's `walls`/`plinth` drive the shared
  envelope skin — the envelope is one merged ring; per-mass roles are homogeneous on these subjects).
  `storeyHeight` from the mass; storey line = `floor + storeyHeight`.
- Per-storey `surface.fill`: `zoneOf(pos) = pos[1] < storeyLine ? "ground" : "upper"`; emitted **only when
  ground and upper roles resolve to different blocks** (else one material — no split needed, skip the fill).
- `surface.clinker`: emitted only when `isBoardFamily(upperBlock)`; `zoneOf` = upper band; `board` = upper.
- `quoin`: `material` = dressing block; `faces` = `["+x","-x","+z","-z"]`; `run` = `eaveY - floor + 1`.
- `surface.limewash`: only when `pack` has role `wall.finish.limewash`; `aspects` = `[weatherFace]`
  (the door wall from `openings`, default `-z`); `preserve` = `[dressingBlock]`.
- `surface.relief` (plinth): only when `mass.plinth`; `zoneOf` = the `floor` row; `material` = plinth role.
- `wallSkin` runs `applyArticulation(occ, plan)` → overlay → `extractApertures` → `dressOpenings` →
  overlay. Each `applyArticulation` failure mode (empty plan) → unchanged occ.

## `experiments/eval-alignment/autonomy-loop.mjs` — changes

- **Imports:** add `wallSkin` from `../../src/view/wall-skin.mjs`.
- **`SUBJECTS`:** remove `wallField` from every entry. Add:
  ```
  "barn--saltcrag": { artifact: "benchmarks/sculpture/workshop/barn--saltcrag/final-artifact.json",
                      concept: <barn concept png>, eaveY: 9, ridgeAxis: "x" }
  ```
  (eaveY = storeys·storeyHeight = 3·3 from the program.)
- **`loadPack(program)`:** new helper — `JSON.parse(readFileSync(packs/${program.pack}.json))` when
  `program?.pack`, else `null`.
- **`construct_walls(occ)`:** load program + pack; `env = constructWalls(occ, {floor, eaveY, program,
  wallField: groundFill})`; `return wallSkin(env, {program, pack, floor, eaveY})`. `groundFill` =
  `roleBlock(pack, program.masses[0].walls.ground.role)` when pack present, else `constructWalls`'s default.
- **`MENU`:** update the `construct_walls` line to name the skin (per-storey material, quoins, clinker,
  dressed openings).
- **`main()` default queue:** `["cottage", "barn", "gatehouse", "barn--saltcrag"]` (witness last).
- The agent enum strings, `evalBuild`, `agentPick`, `runSubject` shapes are unchanged.

## Ordering of changes (commits)

1. `src/view/wall-skin.mjs` + `wall-skin.test.mjs` — pure brush, green in isolation. (atomic)
2. Wire into `autonomy-loop.mjs` (skin in `construct_walls`, pack load, drop `wallField`, witness subject,
   MENU). Full `npm test` green. (atomic)
3. Run the volume batch → renders beside concept (`walls-beside.mjs` or `render-beside`) → ledger + log;
   honest per-subject report. (artifacts)

## Module boundaries honored

- **Single door:** every technique reached via `getBrush` (through `applyArticulation`) or its direct
  exported fn (`dressOpenings`, `extractApertures`) — no new geometry primitive (AC1).
- **Pure brush, co-located test, `occ→occ`** — matches `wall-generate.mjs` / `roof-generate.mjs`.
- **Role authority:** all block ids come from `roleBlock(pack, role)` — no derived/suffixed names, no
  per-building constants (the recognize self-grep discipline).
- **Instrument untouched:** changes live in `experiments/` + a new pure `src/view/` brush; `defect-eval.mjs`
  and the measured chain are not on the diff.
