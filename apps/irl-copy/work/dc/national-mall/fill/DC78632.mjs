// 462 N St NW, Washington DC: a red-brick residential walk-up, 3 x 10 blocks (x 0..2 across, z 0..9 along the street).
// Front (the door) is the x = 0 face. Massing follows the lidar roof per street-row (majority of the three cells), so
// the tall bays (z 0, 3-4, 9) stand 4 high and the rest 3. Storeys are one block each: a stone base (y 0), a window
// row (y 1) of glass panes between brick piers with an air gap behind (x 1), a stone cornice or floor belt (y 2),
// and a stone coping (y 3) on the tall bays.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78632.cells.json", "utf8"));   // [x, z, ground, roof]
const W = 3, D = 10, H = 16;
const roofAt = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const groundAt = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));

// The street row's height: the majority of its three lidar roofs (4 or more = a tall bay), so the stepped roof is clean.
const tallRow = [];
for (let z = 0; z < D; z++) {
  const rs = [0, 1, 2].map((x) => roofAt.get(`${x},${z}`));
  tallRow[z] = rs.filter((r) => r >= 4).length >= 2 ? 4 : 3;
}

const DOOR_Z = 4, PIER_Z = new Set([0, 3, 6, 9]), LAMP = new Map([[1, "glowstone"], [5, "shroomlight"], [8, "lantern"]]);
const DOOR_STATE = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });

// The spec of every filled block: [name, state] or null. Air is left out of the file.
const specs = new Map();
const put = (x, y, z, block, state) => specs.set(`${x},${y},${z}`, [block, state]);
for (let z = 0; z < D; z++) {
  const h = tallRow[z];
  for (let x = 0; x < W; x++) {
    const ground = Math.min(...[0, 1, 2].map((k) => groundAt.get(`${k},${z}`)));
    for (let y = ground; y < h; y++) {
      if (y === 0) {
        if (x === 0 && z === DOOR_Z) put(x, y, z, "dark_oak_door", DOOR_STATE("lower"));
        else put(x, y, z, "stone_bricks");
      } else if (y === 1) {
        if (x === 1) { if (LAMP.has(z)) put(x, y, z, LAMP.get(z), LAMP.get(z) === "lantern" ? { hanging: "false", waterlogged: "false" } : undefined); }
        else if (x === 0 && z === DOOR_Z) put(x, y, z, "dark_oak_door", DOOR_STATE("upper"));
        else if (PIER_Z.has(z)) put(x, y, z, "bricks");
        else put(x, y, z, "glass_pane");                       // panes get their connections below
      } else if (y === 2) {
        if (h === 3) put(x, y, z, "smooth_stone");                              // cornice / roof cover on the low bays
        else if (x === 0 && z === DOOR_Z) put(x, y, z, "smooth_stone");        // hood over the door
        else put(x, y, z, "bricks");                                            // tall bay: brick wall and floor slab
      } else if (y === 3) {
        put(x, y, z, "smooth_stone");                           // coping on the tall bays
      }
    }
  }
}

// Roof plant: a brick chimney on the rear of the tall bay at z 4, and an iron AC unit on the low roof at z 6.
put(2, 4, 4, "bricks"); put(2, 5, 4, "bricks"); put(2, 6, 4, "smooth_stone");
put(1, 3, 6, "iron_block");

// Glass panes connect to the neighbours along the street (and to the lamp inside), as the game would draw them.
const solid = (b) => b && b !== "dark_oak_door" && b !== "lantern" && b !== "air";
for (const [key, [block]] of specs) {
  if (block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const conn = (dx, dz) => { const n = specs.get(`${x + dx},${y},${z + dz}`); return solid(n?.[0]) ? "true" : "false"; };
  specs.set(key, [block, { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" }]);
}

const g = new Voxels([W, H, D]);
for (const [key, [block, state]] of specs) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78632.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
