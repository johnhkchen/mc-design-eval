import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87184";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 20, D = 12;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Footprint: key "x,z" -> ground (gr)
const map = new Map();
const roofs = [];
for (const c of cells) {
  const [x, z, ground, roof] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = clamp(Math.round(ground), 0, H - 8);
  map.set(`${x},${z}`, { gr });
  roofs.push(Math.round(roof));
}
const has = (x, z) => map.has(`${x},${z}`);

// One clean roof tier for the whole block (median of lidar, clamped)
roofs.sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)] ?? 12;
const RF = clamp(medianRoof, 8, H - 4);

const isEdge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Street face = min z. Centre bay for the entrance.
let zMin = Infinity, xMin = Infinity, xMax = -Infinity;
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  zMin = Math.min(zMin, z);
  xMin = Math.min(xMin, x);
  xMax = Math.max(xMax, x);
}
const xMid = Math.round((xMin + xMax) / 2);

const WALL = "bricks";
const TRIM = "stone_bricks";
const CAP = "smooth_stone";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane";

for (const [key, { gr }] of map) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);
  const onFront = edge && z === zMin;
  const rf = Math.max(RF, gr + 4);

  // Foundation to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Base course
  g.set(x, gr, z, edge ? BASE : FLOOR);

  for (let y = gr + 1; y < rf; y++) {
    const rel = y - gr;
    const top = y === rf - 1;
    const storeyLine = rel % 4 === 0;

    if (!edge) {
      if (storeyLine || top) g.set(x, y, z, FLOOR); // floor slab per storey
      continue;
    }

    if (top || storeyLine) {
      g.set(x, y, z, TRIM);
      continue;
    }

    // Pilaster bays: corners and every other column on the street face
    const pilaster = (x === xMin || x === xMax) || (onFront && (x - xMin) % 2 === 0);
    if (pilaster) {
      g.set(x, y, z, TRIM);
      continue;
    }

    // Window grid on the remaining bays (rows 1-2 of each storey)
    const winRow = rel % 4 === 1 || rel % 4 === 2;
    if (winRow) {
      g.set(x, y, z, GLASS);
      if (rel % 4 === 2 && (x + z) % 3 === 0) {
        const ix = x === xMin ? x + 1 : x === xMax ? x - 1 : x;
        const iz = z === zMin ? z + 1 : z === zMin + D ? z - 1 : z;
        if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
      }
    } else {
      g.set(x, y, z, WALL);
    }
  }

  // Cornice cap over the parapet
  g.set(x, rf, z, CAP);
}

// Entrance: stone surround, double-height door on centre of the street face
const entKey = `${xMid},${zMin}`;
if (map.has(entKey)) {
  const { gr } = map.get(entKey);
  const x = xMid, z = zMin;
  // Lower door (faces outward, toward -z)
  g.set(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Trim lintel over the door and a hanging lantern beside it
  g.set(x, gr + 3, z, TRIM);
  if (x - 1 >= 0 && has(x - 1, z)) g.set(x - 1, gr + 3, z, "lantern", { hanging: "true" });
}

// Belfry: lantern tower above the centre of the street face, clear of the parapet
const towerKey = `${xMid},${zMin}`;
if (map.has(towerKey)) {
  const top = Math.min(H - 2, RF + 4);
  for (let y = RF + 1; y < top; y++) {
    g.set(xMid, y, zMin, (y - RF) % 2 === 1 ? GLASS : WALL);
  }
  g.set(xMid, top, zMin, TRIM);
  g.set(xMid, top + 1, zMin, "lantern", { hanging: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
