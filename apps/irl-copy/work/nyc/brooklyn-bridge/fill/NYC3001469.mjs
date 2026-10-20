import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001469.cells.json`, "utf8"));

const W = 13, H = 18, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { gr: Math.max(0, Math.round(gr)), rf });
const inside = (x, z) => map.has(key(x, z));
const isEdge = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

let minZ = Infinity, maxZ = -Infinity, minX = Infinity, maxX = -Infinity;
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
}

// Flat roof tiers: quantise lidar heights to even blocks, clamp to a sane range
const roofOf = new Map();
for (const [k, v] of map) {
  const rt = Math.min(H - 4, Math.max(v.gr + 4, Math.round(v.rf / 2) * 2));
  roofOf.set(k, rt);
}
const tiers = [...roofOf.values()];
const mainRoof = tiers.slice().sort((a, b) => a - b)[Math.floor(tiers.length / 2)];
const topRoof = Math.max(...tiers);

// Front = the footprint's lowest-z edge; door on the edge cell nearest the centre
const midX = (minX + maxX) / 2;
let doorX = null;
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z === minZ && (doorX === null || Math.abs(x - midX) < Math.abs(doorX - midX))) doorX = x;
}

// Palette: red brick body, pale stone trim and piers, dark stone plinth
const BRICK = "bricks";
const TRIM = "smooth_stone";
const PIER = "calcite";
const PLINTH = "stone_bricks";
const FLOOR = "smooth_stone";
const GLASS = "glass_pane";
const LIGHT = "glowstone";

for (const [k, v] of map) {
  const [x, z] = k.split(",").map(Number);
  const gr = v.gr;
  const rt = roofOf.get(k);
  const edge = isEdge(x, z);
  const i = x + z;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, PLINTH);

  if (!edge) {
    // Interior: floor slabs each storey, air between, roof slab on top
    for (let y = gr; y < rt; y++) if ((y - gr) % 2 === 0) g.set(x, y, z, FLOOR);
    g.set(x, rt, z, FLOOR);
    continue;
  }

  const isFront = z === minZ;
  const isDoorCol = isFront && x === doorX;

  for (let y = gr; y < rt; y++) {
    const r = y - gr;

    if (r === 0) { g.set(x, y, z, PLINTH); continue; }

    if (r === 1 || r === 2) {
      if (isDoorCol && r === 1) { g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (isDoorCol && r === 2) { g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (r === 2) { g.set(x, y, z, TRIM); continue; }
      if (i % 4 === 0) { g.set(x, y, z, PIER); continue; }
      g.set(x, y, z, GLASS);
      continue;
    }

    // Upper storeys: trim bands on even rows, windows on odd rows
    if (r % 2 === 0) {
      g.set(x, y, z, TRIM);
    } else if (i % 3 === 1) {
      const warm = ((x * 7 + z * 3 + y) % 11 === 0);
      g.set(x, y, z, warm ? LIGHT : GLASS);
    } else {
      g.set(x, y, z, BRICK);
    }
  }

  // Canopy over the entrance: slab on the row above the door, across the front
  // (only where that cell is inside the footprint and on the front edge)
  if (isFront && Math.abs(x - doorX) <= 1 && gr + 3 < rt) {
    g.set(x, gr + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Coping on the parapet
  g.set(x, rt, z, TRIM);
}

// Central penthouse on the top tier only (3x3 footprint cells at topRoof)
const topCells = [...roofOf.entries()].filter(([, rt]) => rt === topRoof).map(([k]) => k.split(",").map(Number));
const cx = Math.round(midX), cz = Math.round((minZ + maxZ) / 2);
for (const [x, z] of topCells) {
  if (Math.abs(x - cx) > 1 || Math.abs(z - cz) > 1) continue;
  if (x === cx - 1 && z === cz - 1) continue; // leave one corner open for a stair hatch
  for (let y = topRoof + 1; y <= Math.min(H - 1, topRoof + 2); y++) {
    g.set(x, y, z, y === topRoof + 2 ? TRIM : BRICK);
  }
}

g.save(`${DIR}/NYC3001469.nbt`);
