# T-189-01 — STRUCTURE: file-level blueprint

The shape of the code for the roof-material recognition hand (design A2+B2+C2+D2+E+F). **One new pure
module + its test**, two small edits to existing files (the climb runner + the pure tool-department map),
and one generated render pair. The frozen instrument (`measurements/`), `compile.mjs`, the program/pack
JSON, and the seed artifact are **untouched** — the loop applies the fix, we do not pre-correct the seed.

## File 1 (NEW, pure, in `npm test`) — `src/recognition/roof-material.mjs`

The roof-material reconciliation decision: program-resolved roof block vs the concept-true material-map roof
block, joined by coarse material family. Pure (no GL, no LLM, no I/O) — the runner does the disk loads and
the rebuild; this module only decides. Exports:

```
export const ROOF_MATERIAL_SCHEMA = "roof-material/v1";

// Decision C2 — coarse, semantic material family from a block id (NOT chroma). Deterministic, no
// thresholds. timber: *_log|*_planks|*_wood|oak|spruce|birch|jungle|acacia|mangrove|cherry|bamboo.
// stone: stone|cobble|deepslate|andesite|diorite|granite|tuff|blackstone|basalt|*_tiles|*_bricks
// (excluding nether_brick → that is "other"); else "other". Namespace-tolerant (strips minecraft:).
export function roofMaterialFamily(block)   // → "timber" | "stone" | "other"

// The material-map's roof block — the entry whose normalized placementRule === "roof". Pure lookup over
// a parsed/asserted material-map's `map[]`. Returns the normalized block id or null (no roof entry).
export function materialMapRoofBlock(materialMap)   // → "minecraft:deepslate_tiles" | null

// Decision B2 — reconcile the program's roof field material with the concept-read material-map. corrected
// iff the two resolve to DIFFERENT known families (timber↔stone); then the material-map (the picture read)
// wins. No material-map / unknown family / same family ⇒ corrected:false, roofBlock = the program block.
export function reconcileRoofMaterial({ program, pack, materialMap, massIndex = 0 })
  // → { roofBlock, corrected, programBlock, conceptBlock, fromFamily, toFamily, reason }
```

`reconcileRoofMaterial` internals (all pure, reusing existing authorities):
- `programBlock = roleBlock(pack, program.masses[massIndex].roof.fieldRole)` — the ONE role→block point
  (`compile.mjs:28`), imported, not re-implemented.
- `conceptBlock = materialMapRoofBlock(materialMap)` — `null` ⇒ `corrected:false`, graceful.
- `fromFamily = roofMaterialFamily(programBlock)`, `toFamily = roofMaterialFamily(conceptBlock)`.
- `corrected = conceptBlock && fromFamily !== "other" && toFamily !== "other" && fromFamily !== toFamily`.
- `roofBlock = corrected ? conceptBlock : programBlock`; `reason` a one-line human string
  (`"timber dark_oak_planks → stone deepslate_tiles (concept reads grey)"` or `"matched: roof already
  timber"`).

Imports: `roleBlock` from `../recognition/compile.mjs`; `normalizePlacementRule`, `normalizeBlock` from
`../form/material-map.mjs` (the placementRule + block normalizers — don't restate the kebab/namespace logic).

## File 2 (NEW, in `npm test`) — `src/recognition/roof-material.test.mjs`

Pure unit tests (fast, no GL/LLM), tagged `RM1…`. Inline fixtures (a minimal program mass with
`roof.fieldRole`, a 2-row pack palette, a minimal material-map) — no disk reads:
- **RM1 roofMaterialFamily**: `dark_oak_planks`/`spruce_planks`/`oak_log` → `timber`; `deepslate_tiles`/
  `stone_bricks`/`cobblestone` → `stone`; `white_terracotta`/`glass` → `other`; namespace-tolerant
  (`minecraft:stone_bricks` === `stone_bricks`).
- **RM2 materialMapRoofBlock**: picks the `placementRule:"roof"` entry (normalizes `Roof`/`roof`); returns
  `null` when no roof entry.
- **RM3 reconcile — the gatehouse case**: program `roof.fieldRole:"roof.trim"` (→ `dark_oak_planks`) +
  material-map roof `deepslate_tiles` ⇒ `corrected:true`, `roofBlock:"minecraft:deepslate_tiles"`,
  `fromFamily:"timber"`, `toFamily:"stone"`.
- **RM4 reconcile — matched (no-op)**: program roof resolves to timber AND material-map roof is timber ⇒
  `corrected:false`, `roofBlock` = the program block (generality: no-op on matched subjects).
- **RM5 reconcile — graceful**: no material-map roof entry ⇒ `corrected:false`, program block; `other`
  family (terracotta roof) never triggers a correction (conservative).
- **RM6 purity**: inputs not mutated.

This is the **`npm test` decision surface** — the steering logic is proven without GL/LLM.

## File 3 (EDIT, in `npm test`) — `src/workshop/climb-gate.mjs`

Add the new hand to the pure tool-department map (`:28`) so `classifyInventory` records it acting on ROOF:
```
recolor_roof: Object.freeze(["ROOF"]),
```
`climb-gate.test.mjs` gains one assertion (`TOOL_DEPARTMENTS.recolor_roof` deep-equals `["ROOF"]`) — append
to the existing `TOOL_DEPARTMENTS` test (the CG block), not a new file.

## File 4 (EDIT, metered runner, NOT in `npm test`) — `experiments/eval-alignment/picture-climb.mjs`

The thin lever beside the three existing hands. Edits, in file order:
1. **Imports** (after `:32`'s `roleBlock` import): add
   `import { reconcileRoofMaterial } from "../../src/recognition/roof-material.mjs";` and
   `import { parseMaterialMap, assertMaterialMap } from "../../src/form/material-map.mjs";`.
2. **Config** (after `:55`): add
   `const MATERIAL_MAP_PATH = "benchmarks/sculpture/material-map/gatehouse.json";` and include it in the
   asset guard list (`main`'s `guard` array, `:184`).
3. **The hand** (after `apply_gable_roof`, `:91`): `recolor_roof(occ)` —
   ```
   function recolor_roof(occ) {
     const program = loadProgram(PROGRAM_PATH);
     const pack = loadPackOf(program);
     const materialMap = assertMaterialMap(parseMaterialMap(
       JSON.parse(readFileSync(join(ROOT, MATERIAL_MAP_PATH), "utf8"))));
     const { roofBlock, corrected, reason } = reconcileRoofMaterial({ program, pack, materialMap });
     if (!corrected) return occ;                       // no divergence → no-op (honest)
     // same gable geometry as apply_gable_roof, grey field-only family (honest cubes — design D2)
     const kept = []; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
     for (const [key, block] of occ.cells) {
       const [x, y, z] = key.split(",").map(Number);
       if (y >= CFG.eaveY + 1) continue;
       kept.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
       if (y === CFG.eaveY) { x0=Math.min(x0,x); x1=Math.max(x1,x); z0=Math.min(z0,z); z1=Math.max(z1,z); }
     }
     const perp = CFG.ridgeAxis === "z" ? x1 - x0 : z1 - z0;
     const gable = gableRecord({ footprint:{x0,x1,z0,z1}, ridgeAxis:CFG.ridgeAxis, eaveY:CFG.eaveY,
       ridgeY: CFG.eaveY + Math.floor(perp/2), pitch:1, hip:{demanded:false} });
     const family = { field: normalizeRoofBlock(roofBlock), stairs: null, slab: null, findings: [] };
     console.error(`  [recolor_roof] ${reason}`);
     return occupancyFromCells([...kept, ...generateRoof([gable], family).cells]);
   }
   ```
   `normalizeRoofBlock` strips the `minecraft:` namespace (the occ/FAMILY blocks are bare ids like
   `spruce_planks`); a 1-line local `(b) => b.replace(/^minecraft:/, "")`.
4. **Register** (`:113`): `const TOOLS = { apply_gable_roof, recolor_roof, construct_walls, add_timber_framing };`
5. **MENU** (`:114`): add, after the `apply_gable_roof` line:
   `"- recolor_roof: rebuild the roof in the CONCEPT-TRUE material read by recognition (e.g. grey stone when the concept roof is stone, not the program's default timber). Best when the worst divergence is ROOF COLOR / MATERIAL (roof reads the wrong material vs the concept)."`
   and add `recolor_roof` to the `Output ONE JSON` enum (`:176`).
6. **A standalone roof-material proof entry** (guarded, zero-LLM) so the GLANCE is producible without the
   full climb: when `process.env.ROOF_MATERIAL_PROBE === "1"`, `main` renders the seed roof and the
   `recolor_roof` roof each beside the concept to
   `builds/gatehouse/picture-climb/roof-material/{seed,recolored}-beside.png`, prints the reconcile reason,
   and exits before any spend. This is the deliverable evidence (design F).

## File 5 (NEW, generated artifacts) — `builds/gatehouse/picture-climb/roof-material/`

`seed-beside.png` (brown roof beside concept) + `recolored-beside.png` (grey roof beside concept) — the
brown→grey glance. Git-tracked (like the other `builds/…` renders).

## File 6 (NEW, work dir) — `progress.md`, `review.md`

Written in Implement/Review: the honest verdict — glance moved brown→grey; closure held (the rebuilt gable
geometry is identical to `apply_gable_roof`'s, only `block` differs); metered critique-clears
attempted/deferred; generality = `corrected:false` no-op on matched subjects.

## Ordering (matters)

1. **File 1 + File 2** (pure core + tests) — land first; `npm test` stays green and the decision is proven.
2. **File 3** (+ its test) — the department map entry.
3. **File 4** (runner lever + probe) — wire it; `ROOF_MATERIAL_PROBE=1` proves the rebuild + render with
   zero spend.
4. **File 5** — run the probe, write the two beside renders (GL available — research §7).
5. **File 6** — read the renders, write the verdict.
6. Commit incrementally: (a) pure core + tests + dept map, (b) runner lever + probe, (c) render glance + review.

## Invariants / guards

- `measurements/` never written; `compile.mjs`, the program/pack JSON, the seed artifact, and
  `autonomy-loop.mjs` all **untouched** ([[location-encodes-status]], [[pin-guard-is-structural]]).
- No name derivation (`_stairs` suffixing) — the family is field-only honest cubes
  ([[voxel-palette-must-be-design-doc]]).
- No air-op / recess-by-exclusion ([[facade-recess-by-exclusion]]): the roof is REBUILT, never carved.
- The pure core holds all the decision logic and is tested; the runner holds zero material-decision logic of
  its own (it loads, calls, rebuilds, renders).
- GL asserted loud before any render ([[render-every-loop-pattern]]); no re-ask on malformed
  ([[spend-limit-reply-failure-mode]]) — inherited unchanged from the runner.
