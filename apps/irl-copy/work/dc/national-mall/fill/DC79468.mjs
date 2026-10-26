// 1205 7th St NW: a 1920s brick walk-up apartment block, two storeys over a stone base, with a
// one-storey wing behind the street front. Built column by column from the lidar roof tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const raw = JSON.parse(readFileSync(`${DIR}/DC79468.cells.json`, "utf8"));

// Lidar roofs stepped into three flat tiers: 8 for the street-front bays (x 0..4, z 0), 4 for the low
// wing behind them, 5 for everything else. (The lidar's 4s at (5,0) and (6,2) read as noise, so they join 5.)
const LOW_WING = new Set(["0,1", "1,1", "2,1", "4,1", "5,1"]);
const cell = new Map();
for (const [x, z, ground, roofRaw] of raw) {
  const key = `${x},${z}`;
  cell.set(key, { ground, roof: roofRaw >= 7 ? 8 : LOW_WING.has(key) ? 4 : 5 });
}
const has = (x, z) => cell.has(`${x},${z}`);

// Per-storey profile from y 0 up: stone base, brick wall (windows go here), string course, cornice cap.
const PROFILE = {
  8: ["stone", "stone", "wall", "wall", "band", "wall", "wall", "cap"],
  5: ["stone", "stone", "wall", "wall", "cap"],
  4: ["stone", "stone", "wall", "cap"],
};
const BLOCK = { stone: "stone_bricks", wall: "bricks", band: "smooth_stone", cap: "stone_bricks" };
const kindAt = (x, z, y) => PROFILE[cell.get(`${x},${z}`).roof][y];

const g = new Voxels([10, 20, 3]);
for (const [key, { roof }] of cell) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < roof; y++) g.set(x, y, z, BLOCK[PROFILE[roof][y]]);
}

// Windows: glass on the brick rows of each exposed face, every other bay (odd index along the face).
// Street (north, z 0) and the back row (z 2) take windows; the interior faces stay brick. A window on
// the street face is backed by a one-block air gap where the cell behind it is brick.
const glass = [];
const glazeAt = (x, y, z) => { g.set(x, y, z, "glass_pane"); glass.push([x, y, z]); };
const pockets = [];
for (const [key, { roof }] of cell) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < roof; y++) {
    if (PROFILE[roof][y] !== "wall") continue;
    if (!has(x, z - 1) && x % 2 === 1) {
      glazeAt(x, y, z);
      if (has(x, z + 1) && kindAt(x, z + 1, y) === "wall") { g.set(x, y, z + 1, "air"); pockets.push([x, y, z + 1]); }
    }
    if (!has(x, z + 1) && z === 2 && x % 2 === 1) glazeAt(x, y, z);
    if (!has(x - 1, z) && z % 2 === 1) glazeAt(x, y, z);
    if (!has(x + 1, z) && z % 2 === 1) glazeAt(x, y, z);
  }
}

// Warm light in the air gap behind a street window: a lantern standing on the storey's stone.
for (const [x, y, z] of pockets) if (y === 2 && g.val(x, y - 1, z) !== 0) g.set(x, y, z, "lantern", { hanging: "false" });

// Street door in the middle bay, a plank lintel over it, and the ground floor glass beside it.
g.set(2, 2, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(2, 3, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [1, 2, 3]) g.set(x, 4, 0, "dark_oak_planks");

// Roof: a stair-access bulkhead on the back-east low roof, and a condenser unit on the low wing.
g.set(8, 5, 1, "bricks"); g.set(8, 6, 1, "bricks"); g.set(8, 7, 1, "stone_bricks");
g.set(6, 5, 0, "iron_block");

// Panes join the solid they touch (north/south/east/west), as the game would draw them.
const solid = (x, y, z) => { const v = g.val(x, y, z); return v !== 0 && !/lantern|door/.test(g.palette[v].block); };
for (const [x, y, z] of glass) {
  const state = {
    north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)),
    west: String(solid(x - 1, y, z)), east: String(solid(x + 1, y, z)),
  };
  g.set(x, y, z, "glass_pane", state);
}

const out = g.save(`${DIR}/DC79468.nbt`);
console.log(`DC79468.nbt: ${out.blocks} blocks, ${out.palette} palette entries, ${glass.length} panes, ${pockets.length} air gaps`);
