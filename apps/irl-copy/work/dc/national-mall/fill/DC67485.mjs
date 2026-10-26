// DC67485: a four-storey Federal-style limestone office block on the Mall's north-east edge (10 x 8 footprint).
// Massing from the lidar roof heights: a 3-cell tower (8 high) on a 7-high podium, wings at 6, the lone 4 at (0,1)
// smoothed to the podium (noise). Storeys are 2 blocks: spandrel rows (even y) and window rows (odd y), a chiseled
// cornice two below the roof, a calcite parapet. Corners and bay mullions are calcite; a few windows glow shroomlight.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC67485.cells.json", "utf8"));

const W = 10, D = 8, H = 20;
const fp = new Map();                                    // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof });

// smoothed top of each cell (its solid runs y 0..top-1); 0 outside the footprint
const TOWER = new Set(["5,2", "5,3", "6,3"]);
const topOf = (x, z) => {
  const c = fp.get(`${x},${z}`); if (!c) return 0;
  if (TOWER.has(`${x},${z}`)) return 8;
  if (c.roof === 6) return 6;
  return 7;                                              // lidar 7 and the noisy 4 and the 8 at (1,3)
};

// faces of cell (x,z) at height y that have nothing solid beside them (outside footprint or lower neighbour)
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => topOf(x + dx, z + dz) <= y).map(([, , n]) => n);

const g = new Voxels([W, H, D]);
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const LIMESTONE = "calcite", BAND = "smooth_stone", FLOOR = "smooth_stone", BASE = "stone_bricks", ROOF = "stone_bricks";

for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  const T = topOf(x, z), { ground } = fp.get(key);
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);
  for (let y = ground; y < T; y++) {
    const ex = exposed(x, z, y);
    // the door: the north face of (2,0), first two rows
    if (x === 2 && z === 0 && (y === 1 || y === 2)) { g.set(x, y, z, "dark_oak_door", doorState(y === 1 ? "lower" : "upper")); continue; }
    if (y === T - 1) { g.set(x, y, z, ex.length ? LIMESTONE : ROOF); continue; }   // parapet or roof deck
    if (ex.length === 0) {                                                       // interior: floor slabs only
      if (y % 2 === 0 && y <= T - 2) g.set(x, y, z, FLOOR);
      continue;
    }
    if (ex.length >= 2) { g.set(x, y, z, LIMESTONE); continue; }                 // corners and steps: pilasters
    const face = ex[0], bay = (face === "north" || face === "south") ? x : z;
    if (y === 0) g.set(x, y, z, BASE);                                           // base course
    else if (y === T - 2) g.set(x, y, z, "chiseled_stone_bricks");               // cornice
    else if (y % 2 === 0) g.set(x, y, z, BAND);                                  // spandrel / storey line
    else if (x === 2 && z === 0 && face === "north" && y === 3) g.set(x, y, z, LIMESTONE); // door head
    else if (bay % 2 === 0) g.set(x, y, z, LIMESTONE);                           // mullion
    else if (y >= 3 && (bay + y + z) % 5 === 0) g.set(x, y, z, "shroomlight");  // warm lit window
    else g.set(x, y, z, "light_blue_stained_glass");                             // full-block glazing: a pane is a thin plate that reads as a slot edge-on
  }
}

// roof equipment: lanterns on the tower deck and two podium corners
g.set(5, 8, 2, "lantern", { hanging: "false", waterlogged: "false" });
g.set(6, 8, 3, "lantern", { hanging: "false", waterlogged: "false" });
g.set(2, 7, 1, "lantern", { hanging: "false", waterlogged: "false" });
g.set(8, 7, 6, "lantern", { hanging: "false", waterlogged: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC67485.nbt";
console.log(g.save(out));
