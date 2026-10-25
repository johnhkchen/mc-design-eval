import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial building, lidar roof ~17 blocks. Granite-and-render walls, slate roof,
// shopfront at street level with a slab awning, paired storey windows every 5 blocks,
// glowing windows at dusk.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499747";
const W = 31, H = 29, D = 19;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const c of raw) {
  const [x, z, gr, r] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  cells.set(`${x},${z}`, { g: gr, r });
}
const has = (x, z) => cells.has(`${x},${z}`);

// Smooth the lidar roof over the 3x3 neighbourhood into clean flat tiers.
const roofS = new Map();
for (const [key, c] of cells) {
  const [x, z] = key.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const k = `${x + dx},${z + dz}`;
    if (cells.has(k)) { sum += cells.get(k).r; n++; }
  }
  roofS.set(key, Math.max(Math.round(sum / n), c.g + 6));
}

// Facade faces of a cell (directions with no footprint neighbour).
const facesOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const inwardOf = (face, x, z) => {
  if (face === "N") return [x, z + 1];
  if (face === "S") return [x, z - 1];
  if (face === "W") return [x + 1, z];
  return [x - 1, z];
};

const g = new Voxels([W, H, D]);

const WALL = "stone_bricks";
const BAND = "smooth_stone";
const FOUND = "stone";
const ROOF = "deepslate_tiles";
const GLASS = "glass";
const PIER = "polished_andesite";

// Street-front door: southernmost footprint cell nearest x = 15.
let doorCell = null;
{
  let bestZ = -1, bestD = Infinity;
  for (const key of cells.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (has(x, z + 1)) continue;
    const d = Math.abs(x - 15);
    if (z > bestZ || (z === bestZ && d < bestD)) {
      bestZ = z; bestD = d; doorCell = [x, z];
    }
  }
}

for (const [key, c] of cells) {
  const [x, z] = key.split(",").map(Number);
  const gr = c.g;
  const top = roofS.get(key) - 1;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Solid walls to the roof cap.
  for (let y = gr; y <= top; y++) g.set(x, y, z, WALL);
  g.set(x, top, z, ROOF);

  const faces = facesOf(x, z);
  if (faces.length === 0) continue;

  const ns = faces.includes("N") || faces.includes("S");
  const idx = ns ? x : z;
  const face = faces[0];
  const [ix, iz] = inwardOf(face, x, z);
  const inwardOK = has(ix, iz);

  // Facade articulation, storey by storey.
  for (let y = gr; y < top; y++) {
    const local = y - gr;
    const k = Math.floor(local / 5);
    const l = local % 5;

    // Base course and storey string courses.
    if (l === 0 || l === 4) { g.set(x, y, z, BAND); continue; }

    if (k === 0) {
      // Shopfront: glass bays between stone piers.
      if (idx % 3 === 0) g.set(x, y, z, PIER);
      else {
        g.set(x, y, z, GLASS);
        if (inwardOK) {
          const glow = ((x * 3 + z * 5) % 4 === 0) && l === 2;
          g.set(ix, y, iz, glow ? "glowstone" : "air");
        }
      }
    } else {
      // Upper storeys: paired windows, stone pier every third bay.
      const windowBay = idx % 3 !== 0 && y <= top - 3;
      if (windowBay) {
        g.set(x, y, z, GLASS);
        if (inwardOK) {
          const glow = ((x * 5 + z * 3 + k) % 4 === 0) && l === 2;
          g.set(ix, y, iz, glow ? "glowstone" : "air");
        }
      } else {
        g.set(x, y, z, idx % 3 === 0 ? PIER : WALL);
      }
    }
  }

  // Cornice course below the roof cap.
  if (top - 1 >= gr) g.set(x, top - 1, z, BAND);
}

// Street-front door with transom, slab awning and hanging lantern.
if (doorCell) {
  const [xd, zd] = doorCell;
  const gr = cells.get(`${xd},${zd}`).g;
  const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  g.set(xd, gr, zd, "oak_door", doorProps("lower"));
  g.set(xd, gr + 1, zd, "oak_door", doorProps("upper"));
  g.set(xd, gr + 2, zd, GLASS);

  // Dark slab awning over the entrance, inside the fascia line.
  for (const dx of [-1, 0, 1]) {
    if (has(xd + dx, zd)) {
      g.set(xd + dx, gr + 3, zd, "dark_oak_slab", { type: "top", waterlogged: "false" });
    }
  }

  if (has(xd, zd - 1)) {
    g.set(xd, gr, zd - 1, "air");
    g.set(xd, gr + 1, zd - 1, "air");
    g.set(xd, gr + 2, zd - 1, "air");
    g.set(xd, gr + 3, zd - 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
