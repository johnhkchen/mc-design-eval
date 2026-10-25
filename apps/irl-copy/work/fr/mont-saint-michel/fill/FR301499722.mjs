import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499722.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499722.nbt";

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const W = 15, D = 19;
const key = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr, roof] of list) map.set(key(x, z), { g: gr, r: roof });

const cellList = Array.from(map.keys()).map((k) => k.split(",").map(Number));

// Flat roof: median lidar roof height, clamped to a low-rise range.
const roofs = list.map((c) => c[3]).sort((a, b) => a - b);
const H = Math.min(20, Math.max(7, roofs[Math.floor(roofs.length / 2)]));

const g = new Voxels([W, 22, D]);

// Outward normals for each side.
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const FACE_ORDER = ["north", "south", "east", "west"];

// Names of sides on which the cell has no neighbour (i.e. it is on the outside).
const exposed = (x, z) =>
  FACE_ORDER.filter((d) => !map.has(key(x + DIRS[d][0], z + DIRS[d][1])));

// Choose the street front: the side with the most exposed cells.
const counts = { north: 0, south: 0, east: 0, west: 0 };
for (const [x, z] of cellList) {
  for (const d of exposed(x, z)) counts[d]++;
}
let front = "south";
for (const d of ["south", "north", "east", "west"]) if (counts[d] > counts[front]) front = d;

// Cells that sit on the front face only (not corners).
const frontCells = cellList.filter(([x, z]) => {
  const ex = exposed(x, z);
  return ex.length === 1 && ex[0] === front;
});
const alongIdx = (x, z) => (front === "north" || front === "south" ? x : z);
const fIdx = frontCells.map(([x, z]) => alongIdx(x, z));
const fMin = Math.min(...fIdx), fMax = Math.max(...fIdx);
const fMid = Math.floor((fMin + fMax) / 2);

const WALL = "calcite";          // render-finished stone walls
const BASE = "stone_bricks";     // plinth, pillars, roof edge
const FLOOR = "smooth_stone";
const GLASS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const glass = (x, y, z) => g.set(x, y, z, "glass_pane", GLASS);

for (const [x, z] of cellList) {
  const { g: gr } = map.get(key(x, z));
  const g0 = Math.min(gr, H - 5);
  const ex = exposed(x, z);
  const edge = ex.length > 0;
  const corner = ex.length >= 2;

  // Foundation fill up to the cell's ground.
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  // Ground floor plinth / floor slab.
  g.set(x, g0, z, edge ? BASE : FLOOR);

  // Roof deck / parapet cap at H-1.
  g.set(x, H - 1, z, edge ? BASE : FLOOR);

  if (!edge) continue;

  // Wall column from plinth to cornice.
  for (let y = g0 + 1; y <= H - 2; y++) {
    g.set(x, y, z, corner ? BASE : WALL);
  }
  // Cornice course under the parapet cap.
  if (!corner) {
    g.set(x, H - 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  if (corner) continue;

  const face = ex[0];
  const idx = alongIdx(x, z);
  const pillar = idx % 3 === 0 || idx === fMin || idx === fMax;

  if (face === front) {
    // Shopfront: glass up to the fascia, door at the middle bay.
    for (let y = g0 + 1; y <= H - 6; y++) {
      if (idx === fMid && y <= g0 + 2) continue;
      if (pillar) g.set(x, y, z, BASE);
      else glass(x, y, z);
    }
    if (idx === fMid) {
      const facing = front;
      g.set(x, g0 + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, g0 + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      if (g0 + 3 <= H - 6) glass(x, g0 + 3, z);
    }
    // Fascia band.
    g.set(x, H - 5, z, "dark_oak_planks");
    // Upper windows above the fascia.
    for (let y = H - 4; y <= H - 3; y++) {
      if (pillar) g.set(x, y, z, BASE);
      else glass(x, y, z);
    }
    // Warm light just behind the shop glass.
    const ix = x - DIRS[front][0], iz = z - DIRS[front][1];
    if (map.has(key(ix, iz)) && idx % 6 === 1) {
      g.set(ix, g0 + 2, iz, "glowstone");
    }
  } else {
    // Side and rear faces: punched window grid.
    const w0 = Math.max(g0 + 2, H - 6);
    for (let y = w0; y <= H - 3; y++) {
      if (pillar) g.set(x, y, z, BASE);
      else glass(x, y, z);
    }
    // Sill course below the windows.
    if (w0 - 1 >= g0 + 1) g.set(x, w0 - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    // Lantern behind some windows.
    const ix = x - DIRS[face][0], iz = z - DIRS[face][1];
    if (map.has(key(ix, iz)) && idx % 6 === 2 && w0 + 1 <= H - 3) {
      g.set(ix, w0 + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Roof equipment: one AC unit on the interior cell nearest the centre.
let best = null, bestD = Infinity;
const cx = (W - 1) / 2, cz = (D - 1) / 2;
for (const [x, z] of cellList) {
  if (exposed(x, z).length) continue;
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < bestD) { bestD = d; best = [x, z]; }
}
if (best) g.set(best[0], H, best[1], "iron_block");

g.save(OUT);
