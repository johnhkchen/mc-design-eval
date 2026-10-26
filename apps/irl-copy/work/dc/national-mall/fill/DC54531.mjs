// 1818 N St NW, Commercial-Office-Large. A 1960s concrete-frame office: a limestone base, pale precast spandrels,
// a ribbon of blue-glass panes between white mullions, and a flat roof. The lidar tiers are smoothed into five heights
// (3 south lobby, 7 north podium, 9 middle wing, 12 main slab, 13 central crown). Each storey is a 2-block band
// (spandrel below, glass above); the interior is air behind the glass with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54531.cells.json", "utf8"));

// lidar roof height -> smoothed tier: the south row is a 1-storey lobby, the north row a 2-storey podium,
// the rest of the roof steps 9 / 12 / 13 (cell (2,11) reads 12 with its neighbours, not a one-cell light well)
function tierOf(x, z, R) {
  if (z === 15) return 3;
  if (x === 2 && z === 11) return 12;
  if (z <= 1 && R <= 7) return 7;
  if (R <= 11) return 9;
  return R;
}

const foot = new Map();
for (const [x, z, g, R] of cells) foot.set(x + "," + z, { g, R, T: tierOf(x, z, R) });
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the sides of a footprint cell at height y that face outside the building (off the footprint, or over a lower tier)
function exposed(x, z, y) {
  return DIRS.filter(([dx, dz]) => {
    const n = foot.get((x + dx) + "," + (z + dz));
    return !n || n.T <= y;
  });
}

// what a cell is at height y: foundation, cap, roof deck, wall (facade), floor slab, or air behind glass
function cls(x, z, y) {
  const c = foot.get(x + "," + z);
  if (y < c.g) return { k: "found" };
  const ex = exposed(x, z, y);
  if (y === c.T - 1) return ex.length ? { k: "cap" } : { k: "roof" };
  if (ex.length) return { k: "wall", ex, rel: y - c.g };
  return (y - c.g) % 2 === 0 ? { k: "slab" } : { k: "air" };
}

const H = 25;
const g = new Voxels([17, H, 16]);

const GLASS = "light_blue_stained_glass_pane";
const FRAME = "white_concrete";
const SPANDREL = "light_gray_concrete";
const BASE = "smooth_stone";
const CAP = { block: "smooth_stone_slab", state: { type: "bottom" } };

// the two entrances, set over the generic wall pattern: a shop door on the north podium, the lobby door to the south
const doors = [
  { x: 5, z: 0, facing: "north" },
  { x: 10, z: 15, facing: "south" },
];
const doorAt = new Map();
for (const d of doors) {
  doorAt.set(d.x + "," + d.z + ",0", { ...d, half: "lower" });
  doorAt.set(d.x + "," + d.z + ",1", { ...d, half: "upper" });
}

for (const [key, c] of foot) {
  const [x, z] = key.split(",").map(Number);
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone_bricks");
  for (let y = c.g; y < c.T; y++) {
    const d = doorAt.get(x + "," + z + "," + (y - c.g));
    if (d) {
      g.set(x, y, z, "dark_oak_door", { facing: d.facing, half: d.half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (x === 10 && z === 15 && y === 2) { g.set(x, y, z, "dark_oak_slab", { type: "bottom" }); continue; }   // lobby canopy over the door
    const k = cls(x, z, y);
    switch (k.k) {
      case "slab": g.set(x, y, z, SPANDREL); break;
      case "roof": g.set(x, y, z, SPANDREL); break;
      case "cap": g.set(x, y, z, CAP.block, CAP.state); break;
      case "air": break;
      case "wall": {
        if (k.rel === 0) { g.set(x, y, z, BASE); break; }
        if (k.rel % 2 === 0) { g.set(x, y, z, SPANDREL); break; }
        // a window row: white mullions every third bay, glass panes between, corners solid
        if (k.ex.length >= 2) { g.set(x, y, z, FRAME); break; }
        const [dx] = k.ex[0];
        const along = dx !== 0 ? z : x;
        if (along % 3 === 0) { g.set(x, y, z, FRAME); break; }
        const runsX = dx === 0;   // a pane on a north or south face runs along x
        g.set(x, y, z, GLASS, { north: String(!runsX), south: String(!runsX), east: String(runsX), west: String(runsX) });
        // a warm light behind some panes: the cell inside, when it is air (not wall or slab)
        const [ox, oz] = [x - k.ex[0][0], z - k.ex[0][1]];
        const inner = foot.get(ox + "," + oz);
        if (inner && (x * 3 + z * 5 + y * 7) % 6 === 0 && cls(ox, oz, y).k === "air") g.set(ox, y, oz, "glowstone");
        break;
      }
    }
  }
}

// roof plant: two 2x2 mechanical units on the middle wing's roof (all four cells at tier 9, so they stand on it)
for (const [ux, uz] of [[3, 3], [9, 3]]) {
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([i, j]) => foot.get((ux + i) + "," + (uz + j))?.T === 9);
  if (!ok) continue;
  for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (const y of [9, 10]) g.set(ux + i, y, uz + j, "stone_bricks");
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54531.nbt");
console.log("DC54531.nbt", out);
