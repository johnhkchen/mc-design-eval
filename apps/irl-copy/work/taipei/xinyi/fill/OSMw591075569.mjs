import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075569";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 29, D = 17;
const ROOF = 17;                       // roof deck level above lowest ground
const g = new Voxels([W, H, D]);

// ground heights, relative to the lowest ground under the footprint
const groundRaw = new Map();
let low = Infinity;
for (const [x, z, gr] of cells) {
  groundRaw.set(`${x},${z}`, gr);
  low = Math.min(low, gr);
}
const foot = (x, z) => groundRaw.has(`${x},${z}`);
const G = (x, z) => groundRaw.get(`${x},${z}`) - low;
const edgeOf = (x, z) => {
  const mz = !foot(x, z - 1) || !foot(x, z + 1);
  const mx = !foot(x - 1, z) || !foot(x + 1, z);
  return { mz, mx, edge: mz || mx, corner: mz && mx };
};

// 1. foundations, walls, floor slabs, window grid
for (const [x, z, gr0] of cells) {
  const gr = gr0 - low;
  const { mz, mx, edge, corner } = edgeOf(x, z);

  // solid foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < ROOF; y++) {
    if (!edge) {
      // interior: only floor slabs, air otherwise (no interiors)
      if (y === gr || (y % 5 === 0 && y > gr)) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }          // base course
    if (corner) { g.set(x, y, z, "light_gray_concrete"); continue; }     // corner piers
    if (y % 5 === 0 || y % 5 === 4) { g.set(x, y, z, "white_concrete"); continue; } // storey lines / lintels

    // window rows (y % 5 in 1..3)
    const idx = mz ? x : z;
    if (idx % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; } // mullions
    g.set(x, y, z, "light_blue_stained_glass");

    // warm light behind some panes
    if (y === 7 && idx % 3 === 1) {
      let nx = x, nz = z;
      if (mz) nz = foot(x, z - 1) ? z - 1 : z + 1;
      else nx = foot(x - 1, z) ? x - 1 : x + 1;
      if (foot(nx, nz) && !edgeOf(nx, nz).edge && G(nx, nz) <= 7) {
        g.set(nx, 7, nz, "glowstone");
      }
    }
  }

  // roof deck over every footprint cell
  g.set(x, ROOF, z, "light_gray_concrete");

  // parapet and coping on the perimeter
  if (edge) {
    g.set(x, ROOF + 1, z, "white_concrete");
    g.set(x, ROOF + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 2. roof plant housing and lightning-rod mast on the central cells
for (let x = 5; x <= 10; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!foot(x, z) || edgeOf(x, z).edge) continue;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) g.set(x, y, z, "white_concrete");
    g.set(x, ROOF + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (foot(8, 8) && !edgeOf(8, 8).edge) {
  for (let y = ROOF + 5; y <= ROOF + 8; y++) {
    g.set(8, y, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// 3. entrance on the south (max z) street face, near the middle of that face
const southCells = cells
  .filter(([x, z]) => !foot(x, z + 1))
  .map(([x, z, gr]) => ({ x, z, gr: gr - low }));
if (southCells.length) {
  const midX = southCells.map(c => c.x).sort((a, b) => a - b)[Math.floor(southCells.length / 2)];
  const door = southCells.reduce((best, c) =>
    Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best);
  const { x, z, gr } = door;
  g.set(x, gr, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // lintel over the door
  g.set(x, gr + 2, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
