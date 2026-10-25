import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499521";
const W = 52, H = 23, D = 19;

// ---- read cells: [x, z, ground, roof] per footprint cell ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = Array.isArray(raw) ? raw : (raw.cells ?? raw.features ?? []);
const list = rows.map(c => (Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof]));

const key = (x, z) => `${x},${z}`;
const src = new Map();
for (const [x0, z0, g0, r0] of list) {
  const x = Math.round(Number(x0)), z = Math.round(Number(z0));
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  src.set(key(x, z), { x, z, g: Math.max(0, Math.round(Number(g0))), r: Number(r0) });
}

// ---- smooth lidar roof (wider window) into clean flat tiers ----
const cells = [];
for (const c of src.values()) {
  let sum = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const nb = src.get(key(c.x + dx, c.z + dz));
    if (nb && Number.isFinite(nb.r)) { sum += nb.r; n++; }
  }
  const avg = n ? sum / n : c.r;
  let R = Math.round(avg);
  R = Math.max(R, c.g + 11);      // two 5-block storeys + roof deck
  R = Math.min(R, H - 3);         // leave room for parapet
  cells.push({ ...c, R });
}

const has = (x, z) => src.has(key(x, z));
const xs = cells.map(c => c.x), zs = cells.map(c => c.z);
const xmin = Math.min(...xs), zmin = Math.min(...zs);

// exterior face info: count missing 4-neighbours
function info(c) {
  const { x, z } = c;
  const miss = {
    north: !has(x, z - 1),
    south: !has(x, z + 1),
    west: !has(x - 1, z),
    east: !has(x + 1, z),
  };
  const m = Object.values(miss).filter(Boolean).length;
  let face = null, inward = [0, 0];
  if (m === 1) {
    if (miss.north) { face = "north"; inward = [0, 1]; }
    else if (miss.south) { face = "south"; inward = [0, -1]; }
    else if (miss.west) { face = "west"; inward = [1, 0]; }
    else if (miss.east) { face = "east"; inward = [-1, 0]; }
  }
  return { m, face, inward };
}

// ---- choose a front door: middle of the largest straight face ----
const faceCells = { north: [], south: [], west: [], east: [] };
for (const c of cells) {
  const i = info(c);
  if (i.m === 1) faceCells[i.face].push(c);
}
let doorFace = null;
for (const f of ["north", "south", "east", "west"]) {
  if (faceCells[f].length >= 3) { doorFace = f; break; }
}
if (!doorFace) doorFace = Object.keys(faceCells).find(f => faceCells[f].length) ?? null;

let doorKey = null, doorT = null;
if (doorFace) {
  const arr = faceCells[doorFace];
  const horiz = doorFace === "north" || doorFace === "south";
  const mean = arr.reduce((s, c) => s + (horiz ? c.x : c.z), 0) / arr.length;
  let best = null, bd = Infinity;
  for (const c of arr) {
    const d = Math.abs((horiz ? c.x : c.z) - mean);
    if (d < bd) { bd = d; best = c; }
  }
  if (best) {
    doorKey = key(best.x, best.z);
    doorT = horiz ? best.x : best.z;
  }
}

// ---- build ----
const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const c of cells) {
  const { x, z, R } = c;
  const gr = c.g;
  const { m, face, inward } = info(c);

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (m === 0) {
    // interior: floor slabs per storey, roof deck, air between
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, R - 1, z, "stone_bricks");
    if (x % 9 === 4 && z % 7 === 3) put(x, R, z, "light_gray_concrete"); // roof plant
    continue;
  }

  const corner = m >= 2;
  const horiz = face === "north" || face === "south";
  const t = corner ? null : (horiz ? x : z);
  const t0 = horiz ? xmin : zmin;
  const isDoor = !corner && key(x, z) === doorKey && face === doorFace;
  const isJamb = !corner && !isDoor && face === doorFace && doorT !== null && Math.abs(t - doorT) === 1;
  const isWin = !corner && !isDoor && !isJamb && (((t - t0) % 3) + 3) % 3 === 1;
  const isPier = !corner && !isDoor && !isJamb && !isWin && (((t - t0) % 3) + 3) % 3 === 0;

  // exterior shell: base course, storey bands, cornice, stone walls, quoins/pilasters
  for (let y = gr; y <= R - 1; y++) {
    let b = "stone";
    if (corner) b = "polished_andesite";              // quoins
    else if (isPier || isJamb) b = "polished_andesite"; // vertical rhythm
    if (y === gr) b = "stone_bricks";                 // base course
    else if (y === gr + 5 || y === R - 1) b = "smooth_stone"; // storey band / cornice
    put(x, y, z, b);
  }
  // solid parapet
  put(x, R, z, "stone_bricks");

  if (isDoor) {
    // stone surround, lintel, lantern, oak door
    put(x, gr, z, "oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "lantern", { hanging: "true" });
    put(x, gr + 3, z, "stone_bricks");
    put(x, gr + 4, z, "polished_andesite");
  } else if (isWin) {
    // window grid: two storeys of glass in stone reveals with polished sills
    const spans = [[gr + 1, gr + 3], [gr + 6, gr + 8]];
    for (const [a, b] of spans) {
      put(x, a - 1 < gr + 1 ? gr + 1 : a - 1, z, "smooth_stone");     // sill row beneath glass is band row, keep solid
      for (let y = a; y <= b; y++) put(x, y, z, "glass");
    }
    // warm light behind some glass
    const idx = Math.floor((t - t0) / 3);
    if (idx % 2 === 0) {
      const ix = x + inward[0], iz = z + inward[1];
      if (has(ix, iz)) {
        put(ix, gr + 2, iz, "glowstone");
        if (idx % 4 === 0) put(ix, gr + 7, iz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
