// 信義富邦國際館 (OSM way 370145093), Xinyi, Taipei.
// Read from the lidar record: roof about 54 blocks above lowest ground, about 11 storeys
// of 5 blocks. Era: late-1990s/2000s glass-curtain office tower on a shopfront podium,
// typical of the Xinyi district. Materials: stone-brick plinth, polished granite base,
// light-grey concrete spandrels, blue-tinted glazing with grey metal-look mullions,
// and a setback tower over a two-storey podium with a small penthouse and mast.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370145093";
const W = 71, H = 66, D = 112;

const ROOF = 54;      // roof level above lowest ground (lidar)
const PODIUM = 10;    // two storeys of podium above each cell's ground
const STEP = 5;       // storey height in blocks
const SETBACK = 6;    // tower cells lie at least this far (8-neighbour) inside the edge
const PH_D = 9;       // penthouse cells lie at least this far inside the edge

const M = {
  found: "stone_bricks",
  base: "polished_granite",
  band: "light_gray_concrete",
  floor: "white_concrete",
  mull: "gray_concrete",
  glassT: "light_blue_stained_glass",
  glassP: "cyan_stained_glass",
  glassAlt: "gray_stained_glass",
  coping: "smooth_stone",
  roof: "gray_concrete",
  terrace: "moss_block",
  light: "glowstone",
  mast: "iron_block",
  tip: "end_rod",
  door: "dark_oak_door",
};

const key = (x, z) => `${x},${z}`;
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// [dx, dz] -> outward facing name
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

const inFoot = (x, z) => ground.has(key(x, z));

// Footprint outward normals per cell
const footNormals = (x, z) => DIRS4.filter(([dx, dz]) => !inFoot(x + dx, z + dz));

// Chebyshev distance from the footprint edge (edge cells = 1). Smoother setbacks
// than a 4-neighbour metric on diagonal outlines.
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (DIRS8.some(([dx, dz]) => !inFoot(x + dx, z + dz))) {
    dist.set(key(x, z), 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS8) {
    const nk = key(x + dx, z + dz);
    if (inFoot(x + dx, z + dz) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push([x + dx, z + dz]);
    }
  }
}
const distOf = (x, z) => dist.get(key(x, z)) ?? 1;
const isTower = (x, z) => inFoot(x, z) && distOf(x, z) >= SETBACK;

// Entrances: on each street facade, the footprint-edge cell nearest the facade midpoint,
// plus a three-cell canopy centred on it.
const entrances = new Map(); // key -> facing
const canopy = new Set();
for (const [dx, dz] of DIRS4) {
  let best = null, bestDelta = Infinity;
  for (const [x, z] of cells) {
    const n = footNormals(x, z);
    if (n.length !== 1 || n[0][0] !== dx || n[0][1] !== dz) continue;
    const along = dx !== 0 ? z : x;
    const mid = dx !== 0 ? (minZ + maxZ) / 2 : (minX + maxX) / 2;
    const delta = Math.abs(along - mid);
    if (delta < bestDelta) { bestDelta = delta; best = [x, z]; }
  }
  if (!best) continue;
  const [bx, bz] = best;
  entrances.set(key(bx, bz), FACING[`${dx},${dz}`]);
  for (const off of [-1, 0, 1]) {
    const cx = dx !== 0 ? bx : bx + off;
    const cz = dx !== 0 ? bz + off : bz;
    if (!inFoot(cx, cz)) continue;
    const n = footNormals(cx, cz);
    if (n.length === 1 && n[0][0] === dx && n[0][1] === dz) canopy.add(key(cx, cz));
  }
}

// Deterministic pseudo-random for sparse lights and glass variation
const hash = (a, b, c) => Math.abs((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) % 1000;

const g = new Voxels([W, H, D]);

// Pass 1: foundations, podium, tower, facades, roofs
for (const [x, z, gz] of cells) {
  const k = key(x, z);
  const d = distOf(x, z);
  const tower = isTower(x, z);

  // Facade outward directions: tower cells face the non-tower zone, podium cells face the street
  const inSet = (nx, nz) => (tower ? isTower(nx, nz) : inFoot(nx, nz));
  const normals = DIRS4.filter(([dx, dz]) => !inSet(x + dx, z + dz));
  const facade = normals.length > 0;

  const top = Math.min(H - 1, tower ? Math.max(ROOF, gz + PODIUM) : gz + PODIUM);

  // Solid foundation from y 0 up to this cell's ground
  for (let y = 0; y < gz; y++) g.set(x, y, z, M.found);

  for (let y = gz; y <= top; y++) {
    const rel = y - gz;
    const relMod = rel % STEP;
    const s = Math.floor(rel / STEP);

    // Roof surface / parapet
    if (y === top) {
      if (facade) g.set(x, y, z, M.coping);
      else if (!tower && (x + z) % 4 === 0) g.set(x, y, z, M.terrace);
      else g.set(x, y, z, M.roof);
      continue;
    }

    // Storey lines: base course at ground, spandrel bands on facades, floor slabs inside
    if (relMod === 0) {
      if (facade) g.set(x, y, z, rel === 0 ? M.base : M.band);
      else g.set(x, y, z, M.floor);
      continue;
    }

    // Window zone rows
    if (facade) {
      const entranceFacing = entrances.get(k);
      if (entranceFacing && s === 0 && relMod <= 2) {
        // Door: lower half at rel 1, upper half at rel 2
        g.set(x, y, z, M.door, {
          facing: entranceFacing,
          half: relMod === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (canopy.has(k) && s === 0 && relMod === 3) {
        g.set(x, y, z, M.coping); // canopy over the entrance
        continue;
      }
      // Mullions: corners always, otherwise every 3rd cell along the facade
      const coord = normals[0] && normals[0][0] !== 0 ? z : x;
      const isMull = normals.length >= 2 || coord % 3 === 0;
      if (isMull) {
        g.set(x, y, z, M.mull);
      } else if (tower) {
        g.set(x, y, z, hash(x, z, s) % 7 === 0 ? M.glassAlt : M.glassT);
      } else {
        g.set(x, y, z, M.glassP);
      }
      continue;
    }

    // Interior: air gap, with sparse lanterns standing on the floor slab
    if (relMod === 1 && d >= 2 && hash(x, z, s + 3) % 13 === 0) {
      g.set(x, y, z, M.light);
    }
  }
}

// Pass 2: penthouse and mast on the tower roof
let mastCell = null, mastD = -1;
for (const [x, z] of cells) {
  const d = distOf(x, z);
  if (d >= SETBACK && d > mastD) { mastD = d; mastCell = [x, z]; }
}
for (const [x, z] of cells) {
  const d = distOf(x, z);
  if (d < PH_D) continue;
  const y0 = ROOF; // penthouse sits on the tower roof at ROOF
  g.set(x, y0 + 1, z, M.band);                   // penthouse floor slab
  if (d === PH_D) {                              // penthouse ring walls
    g.set(x, y0 + 2, z, M.band);
    g.set(x, y0 + 3, z, M.glassT);
    g.set(x, y0 + 4, z, M.glassT);
  }
  g.set(x, y0 + 5, z, M.band);                   // cap
}
if (mastCell) {
  const [mx, mz] = mastCell;
  g.set(mx, ROOF + 6, mz, M.mast);
  g.set(mx, ROOF + 7, mz, M.mast);
  g.set(mx, ROOF + 8, mz, M.mast);
  g.set(mx, ROOF + 9, mz, M.tip);
}

g.save(`${DIR}/${ID}.nbt`);
