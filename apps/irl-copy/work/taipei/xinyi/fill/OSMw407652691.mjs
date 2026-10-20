import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 光復樓 (Guangfu Building), Xinyi, Taipei.
// 1970s-80s Taiwanese commercial-residential mid-rise: four storeys of 5 blocks,
// concrete frame, white piers, quartz spandrels, granite base and jambs, tinted glass,
// shopfronts on the ground storey, a parapet, a rooftop penthouse, water tank and mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407652691";
const W = 63, H = 33, D = 66;

const ROOF = 20;       // roof slab layer; parapet sits on 21
const TOP_WALL = 19;   // last wall layer under the roof slab
const BAND = 5;        // storey height in blocks

const M = {
  found: "stone_bricks",
  base: "polished_granite",
  jamb: "polished_granite",
  pier: "white_concrete",
  spandrel: "smooth_quartz",
  corner: "smooth_quartz",
  glassU: "light_blue_stained_glass_pane",
  glassS: "glass_pane",
  floor: "smooth_stone",
  roof: "light_gray_concrete",
  parapet: "white_concrete",
  lamp: "glowstone",
  core: "light_gray_concrete",
  tank: "light_gray_concrete",
  tankCap: "iron_block",
  mast: "iron_bars",
};

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const fp = new Map();
for (const [x, z, gr] of raw) {
  const cx = Math.round(x), cz = Math.round(z);
  if (cx < 0 || cx >= W || cz < 0 || cz >= D) continue;
  fp.set(`${cx},${cz}`, Math.max(0, Math.min(18, Math.round(gr))));
}

const has = (x, z) => fp.has(`${x},${z}`);
const gAt = (x, z) => fp.get(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const missing = (x, z) => Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));
const isEdge = (x, z) => missing(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Footprint extents and centre.
const cellXZ = [...fp.keys()].map(k => k.split(",").map(Number));
const minX = Math.min(...cellXZ.map(c => c[0]));
const maxZ = Math.max(...cellXZ.map(c => c[1]));
const cx = Math.round(cellXZ.reduce((s, c) => s + c[0], 0) / cellXZ.length);
const cz = Math.round(cellXZ.reduce((s, c) => s + c[1], 0) / cellXZ.length);

// Entrance: on the face with the most single-face edge cells (the main frontage),
// at the median of its lowest-ground cells.
const cand = {};
for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);
  const m = missing(x, z);
  if (m.length === 1) (cand[m[0]] ??= []).push([x, z, gr]);
}
let entrance = null, entranceFace = null;
{
  const faces = Object.keys(cand).sort((a, b) => cand[b].length - cand[a].length);
  if (faces.length) {
    const f = faces[0];
    const list = cand[f];
    const minG = Math.min(...list.map(c => c[2]));
    const along = f === "north" || f === "south" ? 0 : 1;
    const low = list.filter(c => c[2] === minG).sort((a, b) => a[along] - b[along]);
    const pick = low[Math.floor(low.length / 2)];
    entrance = `${pick[0]},${pick[1]}`;
    entranceFace = f;
  }
}

// Granite jambs on the wall either side of the door, same face.
const jambs = new Set();
if (entrance) {
  const [ex, ez] = entrance.split(",").map(Number);
  const alongX = entranceFace === "north" || entranceFace === "south";
  for (const s of [-1, 1]) {
    const jx = alongX ? ex + s : ex;
    const jz = alongX ? ez : ez + s;
    if (has(jx, jz) && missing(jx, jz).includes(entranceFace)) jambs.add(`${jx},${jz}`);
  }
}

// Pass 1: foundations, floors, walls, cornice and parapet.
for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);

  for (let y = 0; y < gr; y++) put(x, y, z, M.found);

  const miss = missing(x, z);

  if (miss.length === 0) {
    for (const y of [0, 5, 10, 15]) if (y >= gr) put(x, y, z, M.floor);
    put(x, ROOF, z, M.roof);
    continue;
  }

  const ns = miss.includes("north") || miss.includes("south");
  const ew = miss.includes("west") || miss.includes("east");
  const corner = ns && ew;
  const face = corner ? null : miss[0];
  const alongX = face === "north" || face === "south";
  const isEntrance = k === entrance;
  const isJamb = jambs.has(k);
  const yd = Math.max(gr, 1);
  const doorOK = yd + 1 <= 3;

  for (let y = gr; y <= TOP_WALL; y++) {
    const yb = Math.floor(y / BAND) * BAND;
    const yr = y - yb;

    if (corner) {
      put(x, y, z, yb === 0 && yr === 0 ? M.base : M.corner);
      continue;
    }

    // Entrance door, two blocks high.
    if (isEntrance && doorOK && (y === yd || y === yd + 1)) {
      put(x, y, z, "oak_door", {
        facing: face,
        half: y === yd ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Granite jambs flanking the door, up to the transom.
    if (isJamb && yb === 0 && yr >= 0 && yr <= 3 && y <= yd + 2) {
      put(x, y, z, M.jamb);
      continue;
    }

    const s = alongX ? x : z;
    const pier = s % 4 === 0;

    let id;
    if (yb === 0 && yr === 0) id = M.base;
    else if (yr === 0 || yr === 4) id = M.spandrel;
    else if (pier) id = M.pier;
    else id = yb === 0 ? M.glassS : M.glassU;

    // Glowing transom over the entrance.
    if (isEntrance && y === yd + 2 && yr >= 1 && yr <= 3) {
      put(x, y, z, M.lamp);
      continue;
    }

    if (id === M.glassS || id === M.glassU) {
      const p = alongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, id, p);

      // Warm light just inside some windows.
      if (yr === 2 && (x * 3 + z * 5 + yb) % 3 === 0) {
        const [dx, dz] = DIRS[OPP[face]];
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && !isEdge(ix, iz) && gAt(ix, iz) <= y) put(ix, y, iz, M.lamp);
      }
    } else {
      put(x, y, z, id);
    }
  }

  // Cornice and parapet.
  put(x, ROOF, z, M.spandrel);
  put(x, ROOF + 1, z, M.parapet);
}

// Pass 2: rooftop penthouse, centred on the footprint.
const pent = (x, z) => has(x, z) && Math.max(Math.abs(x - cx), Math.abs(z - cz)) <= 5;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [x, z] of cellXZ) {
  if (!pent(x, z)) continue;
  const ring = NB.some(([a, b]) => !pent(x + a, z + b));
  if (!ring) {
    put(x, 21, z, M.core);
    put(x, 22, z, M.core);
    put(x, 23, z, M.spandrel);
    continue;
  }
  const onNS = Math.abs(z - cz) === 5;
  const s = onNS ? x : z;
  put(x, 21, z, M.pier);
  if (s % 3 === 0) {
    put(x, 22, z, M.pier);
  } else {
    const p = onNS
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, 22, z, M.glassU, p);
  }
  put(x, 23, z, M.spandrel);
}

// Antenna mast on the penthouse centre.
if (pent(cx, cz)) {
  for (let y = 24; y <= 27; y++) {
    put(cx, y, cz, M.mast, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
}

// Pass 3: water tank on the roof, clear of the penthouse.
const tx = minX + 10, tz = maxZ - 10;
for (const [x, z] of cellXZ) {
  if (pent(x, z)) continue;
  if ((x - tx) ** 2 + (z - tz) ** 2 > 5) continue;
  for (let y = 21; y <= 25; y++) put(x, y, z, M.tank);
  put(x, 26, z, M.tankCap);
}

g.save(`${DIR}/${ID}.nbt`);
