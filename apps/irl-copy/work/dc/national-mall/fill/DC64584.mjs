// 2025 M St NW: a 1980s-style Commercial-Office-Large. A pale precast-stone office block on a 12-block wing with a
// 15-block tower block and a 16-block penthouse core, bronze-blue tinted glazing in a 2-block storey grid.
// Massing follows the lidar roof, smoothed into clean tiers; the floor slabs sit on even rows, windows on odd rows,
// with a 1-block air gap behind the glass. Solid below each cell's ground is the foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC64584.cells.json`, "utf8"));
const W = 20, Y = 28, D = 29;

// footprint: [x, z, ground, roof] per cell
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, r });
const inside = (x, z) => foot.has(`${x},${z}`);

// Massing tiers, smoothed from the lidar roof: 3 = the one-storey bay on the north edge, 12 = the wing and podium,
// 13 = the lower west wing, 15 = the office block, 16 = the penthouse core.
function tier(x, z) {
  const { r } = foot.get(`${x},${z}`);
  if (r <= 3) return 3;
  if (r === 13 && x <= 1) return 13;
  if (r >= 15) {
    if (x >= 7 && x <= 11 && z >= 18 && z <= 21) return 16;
    if (x >= 2 && x <= 16 && z >= 15 && z <= 25) return 15;
  }
  return 12;
}
const sol = (x, z, y) => inside(x, z) && tier(x, z) > y;

const B = new Map();                       // "x,y,z" -> { block, state }, written to the volume once every rule has run
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => B.get(`${x},${y},${z}`);

for (const [key, { g }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const h = tier(x, z);
  for (let y = 0; y < h; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }                  // foundation up to the cell's ground
    const edge = !sol(x - 1, z, y) || !sol(x + 1, z, y) || !sol(x, z - 1, y) || !sol(x, z + 1, y);
    if (y === h - 1) { put(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete"); continue; }   // parapet / roof
    if (y % 2 === 0) { put(x, y, z, y === 0 && edge ? "stone_bricks" : "smooth_quartz"); continue; } // floor slab and spandrel
    if (!edge) continue;                                                   // air gap behind the glass
    const ex = !sol(x - 1, z, y) || !sol(x + 1, z, y);                      // exposed on an x-facing wall
    const ez = !sol(x, z - 1, y) || !sol(x, z + 1, y);                      // exposed on a z-facing wall
    const pier = (ex && ez) || (ex && z % 3 === 0) || (ez && x % 3 === 0);
    if (pier) put(x, y, z, y === 1 ? "stone_bricks" : "quartz_pillar", y === 1 ? undefined : { axis: "y" });
    else put(x, y, z, "light_blue_stained_glass_pane", {});
  }
}

// entrance on the west face at z 19..20, a double door on the ground storey under a flush stone lintel
for (const z of [19, 20]) {
  const hinge = z === 19 ? "left" : "right";
  put(0, 1, z, "iron_door", { facing: "west", half: "lower", hinge, open: "false", powered: "false" });
  put(0, 2, z, "iron_door", { facing: "west", half: "upper", hinge, open: "false", powered: "false" });
}
for (let z = 18; z <= 21; z++) put(0, 3, z, "stone_bricks");

// rooftop plant: a box on the wing roof and a penthouse plant room on the core
const box = (x0, x1, z0, z1, y0, y1, block) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) put(x, y, z, block);
};
box(13, 14, 3, 4, 12, 13, "light_gray_concrete");
box(16, 17, 6, 7, 12, 12, "light_gray_concrete");
box(8, 10, 19, 20, 16, 17, "light_gray_concrete");

// warm lights: lanterns hung from the floor slab above, in some of the bays behind the glass
for (const [key, { g }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const h = tier(x, z);
  for (let y = 1; y + 1 < h; y += 2) {
    if (y < g || at(x, y, z) || (x * 5 + z * 3 + y) % 13 !== 0) continue;
    if (!at(x, y + 1, z)) continue;
    put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// glass panes connect to neighbouring panes and full blocks, so each run of glazing is one ribbon
const FULL = new Set(["stone_bricks", "smooth_quartz", "light_gray_concrete", "quartz_pillar", "smooth_stone"]);
const linked = (b) => Boolean(b) && (b.block.endsWith("_pane") || FULL.has(b.block));
for (const [k, b] of B) {
  if (b.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  b.state = {
    north: String(linked(at(x, y, z - 1))), south: String(linked(at(x, y, z + 1))),
    east: String(linked(at(x + 1, y, z))), west: String(linked(at(x - 1, y, z))), waterlogged: "false",
  };
}

const g = new Voxels([W, Y, D]);
for (const [k, b] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const out = g.save(`${DIR}/DC64584.nbt`);
console.log(out);
