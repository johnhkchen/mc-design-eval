import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw385812664: no record, so this is a generic early-1990s Taipei
// mid-rise: four storeys on a long, narrow plot. White tiled upper walls, a
// grey band at each floor line, a shopfront ground floor with pillars and
// coloured fascia signs, a framed entrance with a canopy, a cornice and
// parapet, and a rooftop plant room. Lit windows are shroomlight behind the glass.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw385812664";
const W = 17, H = 33, D = 87;
const STOREY = 5;
const STOREYS = 4;

// ---- footprint -----------------------------------------------------------
let raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
if (raw && !Array.isArray(raw) && Array.isArray(raw.cells)) raw = raw.cells;

const key = (x, z) => x + "," + z;
const foot = new Map();
let minG = Infinity;
for (const c of raw) {
  const x = Math.round(c[0]), z = Math.round(c[1]), gr = Math.round(c[2]);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  foot.set(key(x, z), gr);
  minG = Math.min(minG, gr);
}
if (foot.size === 0) throw new Error("no footprint cells");
for (const [k, gr] of foot) foot.set(k, gr - minG); // y 0 = lowest ground

const has = (x, z) => foot.has(key(x, z));
const groundOf = (x, z) => foot.get(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midZ = (minZ + maxZ) / 2;

// outward normals of a cell (x-facing first, so corners read as x-faces)
function normals(x, z) {
  const n = [];
  if (!has(x + 1, z)) n.push([1, 0]);
  if (!has(x - 1, z)) n.push([-1, 0]);
  if (!has(x, z + 1)) n.push([0, 1]);
  if (!has(x, z - 1)) n.push([0, -1]);
  return n;
}
const isPerim = (x, z) => normals(x, z).length > 0;

// ---- voxel helpers -------------------------------------------------------
const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// ---- entrance: one door on an x-facing wall near the middle of the plot ----
let doorCell = null;
{
  let best = Infinity;
  for (const k of foot.keys()) {
    const [x, z] = k.split(",").map(Number);
    const n = normals(x, z);
    const xFace = n.find(v => v[0] !== 0);
    if (!xFace) continue;
    const d = Math.abs(z - midZ);
    if (d < best) { best = d; doorCell = { x, z, nx: xFace[0], nz: 0, gr: groundOf(x, z) }; }
  }
}
// is this footprint cell one of the entrance bay cells (door, or its flanking piers)?
function entranceBay(x, z) {
  if (!doorCell || doorCell.nx === 0) return 0;
  if (x !== doorCell.x) return 0;
  const d = Math.abs(z - doorCell.z);
  return d <= 1 ? 1 + d : 0; // 1 = door column, 2 = flank (pier)
}

// ---- build ---------------------------------------------------------------
for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  const n = normals(x, z);
  const per = n.length > 0;
  const nrm = n[0];
  const t = nrm ? (nrm[0] !== 0 ? z : x) : 0; // coordinate along the facade

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // ground slab / base course
  put(x, gr, z, per ? "polished_andesite" : "smooth_stone");

  for (let s = 0; s < STOREYS; s++) {
    const b = gr + s * STOREY;

    // floor slab (for upper storeys; the ground slab is already placed)
    if (s > 0) put(x, b, z, per ? "light_gray_concrete" : "smooth_stone");

    if (!per) continue;

    const winCol = t % 3 === 1;

    if (s === 0) {
      const bay = entranceBay(x, z);
      const pillar = t % 6 === 0;
      for (let y = b + 1; y <= b + 3; y++) {
        if (bay === 1 && y <= b + 2) {
          // door, lower and upper halves
          put(x, y, z, "dark_oak_door", {
            facing: nrm[0] !== 0 ? (nrm[0] > 0 ? "west" : "east") : "north",
            half: y === b + 1 ? "lower" : "upper",
            hinge: "left", open: "false", powered: "false",
          });
        } else if (bay === 1) {
          put(x, y, z, "smooth_stone"); // canopy soffit over the door
        } else if (bay === 2) {
          put(x, y, z, "quartz_block"); // pier flanking the door
        } else if (pillar) {
          put(x, y, z, "quartz_block");
        } else {
          put(x, y, z, "glass");
        }
      }
      // canopy band over the entrance, in place of the sign fascia
      if (bay) {
        put(x, b + 4, z, "smooth_stone");
      } else {
        // signage fascia alternating red and orange by bay
        const fascia = Math.floor(t / 6) % 2;
        put(x, b + 4, z, fascia ? "orange_concrete" : "red_concrete");
      }
    } else {
      for (let y = b + 1; y <= b + 3; y++) {
        put(x, y, z, winCol ? "light_blue_stained_glass" : "white_concrete");
      }
      put(x, b + 4, z, "white_concrete");
    }

    // warm light behind some windows, in the interior cell just inside the glass
    if (winCol) {
      const bayIdx = Math.floor(t / 3);
      const lit = (bayIdx + s) % 3 === 0;
      if (lit) {
        const ix = x - nrm[0], iz = z - nrm[1];
        if (has(ix, iz) && !isPerim(ix, iz)) {
          put(ix, b + 2, iz, s === 0 ? "glowstone" : "shroomlight");
        }
      }
    }
  }

  // roof deck, cornice and parapet
  const R = gr + STOREYS * STOREY;
  put(x, R, z, per ? "smooth_stone" : "gray_concrete");
  if (per) {
    put(x, R + 1, z, "white_concrete");
    if (t % 3 === 0) put(x, R + 1, z, "quartz_block");
  }
}

// ---- rooftop plant room ----------------------------------------------------
for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  const R = gr + STOREYS * STOREY;
  if (R + 4 > H - 1) continue;
  const inX = x >= minX + 4 && x <= maxX - 4;
  const inZ = z >= midZ - 7 && z <= midZ + 7;
  if (!(inX && inZ)) continue;
  const border = x === minX + 4 || x === maxX - 4 || z === Math.round(midZ - 7) || z === Math.round(midZ + 7);
  if (border) {
    for (let y = R + 1; y <= R + 3; y++) put(x, y, z, "light_gray_concrete");
  }
  put(x, R + 4, z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
