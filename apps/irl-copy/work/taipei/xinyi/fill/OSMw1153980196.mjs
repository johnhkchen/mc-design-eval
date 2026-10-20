import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1153980196.cells.json", "utf8"));

const W = 21, H = 43, D = 27;
const ROOF_Y = 30;          // top course; building height = 31 blocks
const PENT_BASE = 31;       // roof equipment / penthouse sits on the roof slab
const PENT_TOP = 35;        // penthouse roof slab

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inside = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outDirs = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const isPerim = (x, z) => outDirs(x, z).length > 0;

// Wall block for a perimeter cell at a window-band / storey-line height.
function wallBlock(x, y, z, gr, od) {
  if (od.length >= 2) return "white_concrete";           // corner pier, always solid
  const r = y % 5;
  if (r === 0) return "light_gray_concrete";              // storey line
  if (r === 4) return "white_concrete";                   // spandrel
  const along = od[0][0] !== 0 ? z : x;                   // index along the face
  if (along % 3 === 0) return "white_concrete";           // mullion
  return "light_blue_stained_glass";                      // window
}

const isWindow = (blk) => blk === "light_blue_stained_glass";

// 1. Foundations, base course, walls, floor slabs, roof.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gr = Math.min(gnd(x, z), H - 1);
  const od = outDirs(x, z);
  const per = od.length > 0;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  g.set(x, gr, z, per ? "smooth_stone" : "light_gray_concrete");

  if (gr >= ROOF_Y) continue;

  for (let y = gr + 1; y <= ROOF_Y; y++) {
    if (y === ROOF_Y) {
      g.set(x, y, z, per ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (!per) {
      if (y % 5 === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    g.set(x, y, z, wallBlock(x, y, z, gr, od));
  }
}

// 2. Warm light behind some windows (glowstone in the air gap inside the glass).
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const od = outDirs(x, z);
  if (od.length !== 1) continue;
  const gr = Math.min(gnd(x, z), H - 1);
  const ix = x - od[0][0], iz = z - od[0][1];
  if (!inside(ix, iz) || isPerim(ix, iz)) continue;
  for (let y = gr + 1; y < ROOF_Y; y++) {
    const r = y % 5;
    if (r < 1 || r > 3) continue;
    if (y <= gnd(ix, iz)) continue;
    if (!isWindow(wallBlock(x, y, z, gr, od))) continue;
    if ((x * 7 + y * 13 + z * 31) % 5 === 0) g.set(ix, y, iz, "glowstone");
  }
}

// 3. Entrance on the street face: door, transom, lintel.
{
  let best = null;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    const od = outDirs(x, z);
    if (od.length !== 1) continue;
    const score = (od.some(d => d[0] === 0 && d[1] === 1) ? 0 : 100) + Math.abs(x - 10);
    if (!best || score < best.score) best = { x, z, od: od[0], score };
  }
  if (best) {
    const { x, z, od } = best;
    const gr = Math.min(gnd(x, z), H - 1);
    const facing = od[0] === 1 ? "east" : od[0] === -1 ? "west" : od[1] === 1 ? "south" : "north";
    g.set(x, gr, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "light_blue_stained_glass");
    g.set(x, gr + 3, z, "white_concrete");
  }
}

// 4. Setback penthouse on the roof slab, inset 5 blocks from the footprint edge.
for (let x = 5; x <= 15; x++) {
  for (let z = 5; z <= 21; z++) {
    if (!inside(x, z) || gnd(x, z) > ROOF_Y) continue;
    const edge = x === 5 || x === 15 || z === 5 || z === 21;
    for (let y = PENT_BASE; y < PENT_TOP; y++) {
      if (!edge) continue;
      const along = (x === 5 || x === 15) ? z : x;
      let blk;
      if (y === PENT_BASE || y === PENT_TOP - 1) blk = "white_concrete";
      else if (along % 3 === 0) blk = "white_concrete";
      else blk = "light_blue_stained_glass";
      g.set(x, y, z, blk);
    }
    g.set(x, PENT_TOP, z, "light_gray_concrete");
  }
}

// Antenna on the penthouse centre.
g.set(10, PENT_TOP + 1, 13, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1153980196.nbt");
