import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded building, read as a 1990s Taipei speculative office block:
// nine storeys (5 blocks each, roof deck at y 45), white tiled quartz skin,
// granite base, blue-glazed bays between quartz pilasters, a centre entrance
// on the south face, a plant penthouse and a mast on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw549256891";
const W = 32, D = 19, H = 57;
const ROOF = 45;          // roof deck layer, about 45 blocks above lowest ground
const MAX_G = 40;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const clamp = (v) => Math.max(0, Math.min(MAX_G, Math.round(v)));
const key = (x, z) => `${x},${z}`;

const cellG = new Map();
for (const c of cells) cellG.set(key(c[0], c[1]), clamp(c[2]));
const has = (x, z) => cellG.has(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const c of cells) {
  minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]);
  minZ = Math.min(minZ, c[1]); maxZ = Math.max(maxZ, c[1]);
}
const L = maxX - minX + 1;   // along x
const Dd = maxZ - minZ + 1;  // along z

const g = new Voxels([W, H, D]);
const solid = new Set();
const sk = (x, y, z) => `${x},${y},${z}`;

function put(x, y, z, b, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
  solid.add(sk(x, y, z));
}

function faceList(x, z) {
  const out = [];
  for (const [dx, dz, name] of [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]]) {
    if (!has(x + dx, z + dz)) out.push({ dx, dz, name });
  }
  return out;
}

// Entrance: south face (dz = +1), bay index 2 mod 4 nearest the centre.
const cxMid = (minX + maxX) / 2;
let entrance = null;
{
  let best = Infinity;
  for (const [k] of cellG) {
    const [x, z] = k.split(",").map(Number);
    const south = faceList(x, z).some((f) => f.dz === 1);
    if (!south || (x - minX) % 4 !== 2) continue;
    const d = Math.abs(x - cxMid);
    if (d < best) { best = d; entrance = { x, z }; }
  }
}
const entranceFace = entrance ? faceList(entrance.x, entrance.z).find((f) => f.dz === 1) : null;

// Structural grid of interior columns.
const isColumn = (x, z) => (x - minX) % 4 === 0 && (z - minZ) % 4 === 0;

// Penthouse footprint (inside the footprint, set back from all edges).
const PH = { x0: minX + 6, x1: maxX - 6, z0: minZ + 4, z1: maxZ - 4 };
const inPH = (x, z) => x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1;

const lightCandidates = [];

// Per-cell build
for (const [k, gr] of cellG) {
  const [x, z] = k.split(",").map(Number);
  const fs = faceList(x, z);
  const per = fs.length > 0;

  // Foundation under grade
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground course (perimeter) or ground floor slab (interior)
  put(x, gr, z, per ? "polished_granite" : "stone_bricks");

  for (let y = gr + 1; y <= 44; y++) {
    // Entrance doors on the ground floor
    if (per && entrance && x === entrance.x && z === entrance.z && y <= 4 &&
        (y === gr + 1 || y === gr + 2) && entranceFace) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: entranceFace.name, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    // Storey lines (belt courses / floor slabs) every 5 blocks
    if (y % 5 === 0) {
      put(x, y, z, "white_concrete");
      continue;
    }

    if (per) {
      const r = y % 5;
      const pil = fs.some((f) => {
        const i = f.dx !== 0 ? z - minZ : x - minX;
        const len = f.dx !== 0 ? Dd : L;
        return i % 4 === 0 || i === len - 1;
      });
      if (pil) {
        put(x, y, z, "quartz_pillar", { axis: "y" });
      } else if (r === 4) {
        put(x, y, z, "smooth_quartz");
      } else {
        // glazed bay, r = 1..3
        put(x, y, z, "light_blue_stained_glass");
        const f = fs[0];
        const i = f.dx !== 0 ? z - minZ : x - minX;
        if ((i + y) % 4 === 1) lightCandidates.push({ x, y, z, f });
      }
    } else if (isColumn(x, z) && !inPH(x, z)) {
      put(x, y, z, "light_gray_concrete");
    }
  }

  // Roof deck and parapet
  if (per) {
    put(x, ROOF, z, "smooth_quartz");
    put(x, ROOF + 1, z, "smooth_quartz");
    put(x, ROOF + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    put(x, ROOF, z, "gray_concrete");
  }
}

// Plant penthouse: solid massing on the roof deck, louvred on its faces.
for (const [k] of cellG) {
  const [x, z] = k.split(",").map(Number);
  if (!inPH(x, z)) continue;
  const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  for (let y = ROOF + 1; y <= ROOF + 3; y++) {
    if (edge && y === ROOF + 2 && (x + z) % 2 === 0) put(x, y, z, "iron_bars");
    else put(x, y, z, "light_gray_concrete");
  }
  put(x, ROOF + 4, z, "smooth_quartz");
}

// Small plant boxes on the open roof
for (const [k] of cellG) {
  const [x, z] = k.split(",").map(Number);
  if (inPH(x, z) || faceList(x, z).length > 0) continue;
  if ((x * 5 + z * 3) % 13 === 0) {
    put(x, ROOF + 1, z, "light_gray_concrete");
  }
}

// Mast on the penthouse centre
{
  const cx = Math.round((PH.x0 + PH.x1) / 2);
  const cz = Math.round((PH.z0 + PH.z1) / 2);
  if (has(cx, cz)) {
    for (let y = ROOF + 5; y <= ROOF + 8; y++) put(cx, y, cz, "iron_block");
    put(cx, ROOF + 9, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// Warm light behind some glazed bays (only where the room cell is air).
for (const c of lightCandidates) {
  const ix = c.x - c.f.dx, iz = c.z - c.f.dz;
  if (!has(ix, iz)) continue;
  if (solid.has(sk(ix, c.y, iz))) continue;
  put(ix, c.y, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
