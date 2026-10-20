import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341554069";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 43, D = 8;
const g = new Voxels([W, H, D]);

// Footprint: key "x,z" -> ground height under that cell
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);

// Outward-facing directions for a footprint cell
const DIRS = [
  [1, 0, "east"],
  [-1, 0, "west"],
  [0, 1, "south"],
  [0, -1, "north"],
];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !G.has(key(x + dx, z + dz)));

// Top of 31 blocks above lowest ground: parapet at 31, roof slab at 30
const TOP = 31;
const ROOF_SLAB = 30;

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pick the main entrance: ground-level non-corner edge cell facing south (or any), near middle
let door = null;
{
  const cand = [];
  for (const [k, gr] of G) {
    const [x, z] = k.split(",").map(Number);
    const out = outward(x, z);
    if (out.length !== 1) continue;
    cand.push({ x, z, gr, out: out[0] });
  }
  const pref = cand.filter((c) => c.out[0] === 0 && c.out[1] === 1);
  const pool = pref.length ? pref : cand;
  const mid = W / 2;
  pool.sort((a, b) => (Math.abs(a.x - mid) + a.gr * 10) - (Math.abs(b.x - mid) + b.gr * 10));
  if (pool.length) door = pool[0];
}

// Roof centre cell for antenna
let centre = null;
{
  let mx = 0, mz = 0;
  for (const [k] of G) {
    const [x, z] = k.split(",").map(Number);
    mx += x; mz += z;
  }
  mx /= G.size; mz /= G.size;
  let best = Infinity;
  for (const [k] of G) {
    const [x, z] = k.split(",").map(Number);
    const d = (x - mx) ** 2 + (z - mz) ** 2;
    const interior = outward(x, z).length === 0;
    const score = d + (interior ? 0 : 100);
    if (score < best) { best = score; centre = { x, z }; }
  }
}

// Body of each footprint cell
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const ground = gr;
  const top0 = Math.ceil(ground / 5) * 5; // first floor line at or above ground
  const out = outward(x, z);
  const edge = out.length > 0;
  const corner = out.length >= 2;
  const [ox, oz] = out.length ? [out[0][0], out[0][1]] : [0, 0];
  const isDoor = door && door.x === x && door.z === z;

  for (let y = 0; y <= TOP; y++) {
    // Foundation under the ground line
    if (y < ground) { put(x, y, z, "stone_bricks"); continue; }

    // Entrance door, two cells high, on the ground storey
    if (isDoor && (y === ground || y === ground + 1)) {
      const half = y === ground ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: door.out.length ? DIRS.find(([dx, dz]) => dx === door.out[0] && dz === door.out[1])[2] : "south",
        half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    // Parapet on top
    if (y === TOP) {
      if (edge) put(x, y, z, "white_concrete");
      continue;
    }

    // Roof slab and cornice
    if (y === ROOF_SLAB) {
      put(x, y, z, edge ? "light_gray_concrete" : "gray_concrete");
      continue;
    }

    // Solid plinth for interior cells between ground and first floor line
    if (!edge && y < top0) { put(x, y, z, "gray_concrete"); continue; }

    // Interior: floor slabs only, air otherwise
    if (!edge) {
      if (y % 5 === 0) put(x, y, z, "gray_concrete");
      continue;
    }

    // Edge cells from here on
    if (y === ground) { put(x, y, z, "stone_bricks"); continue; } // base course
    if (corner) { put(x, y, z, "white_concrete"); continue; }     // corner pillars

    if (y % 5 === 0) { put(x, y, z, "light_gray_concrete"); continue; } // storey line

    const k5 = Math.floor(y / 5);
    if (y % 5 === 4) { put(x, y, z, "white_concrete"); continue; }    // spandrel

    // Window band: rows 1..3 of each storey
    const idx = ox !== 0 ? z : x;
    if (k5 === 0) {
      // Shopfront
      put(x, y, z, idx % 3 === 0 ? "white_concrete" : "glass");
    } else {
      // Tinted glass with white mullions
      put(x, y, z, idx % 2 === 0 ? "light_blue_stained_glass" : "white_concrete");
    }
  }
}

// Warm lights: shroomlight in interior air behind some windows
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z);
  if (out.length !== 1) continue;
  const [ox, oz] = out[0];
  const idx = ox !== 0 ? z : x;
  const ix = x - ox, iz = z - oz;
  if (!G.has(key(ix, iz))) continue;
  const innerTop0 = Math.ceil(G.get(key(ix, iz)) / 5) * 5;
  for (let y = 7; y <= 27; y += 5) {
    const yy = y - 3; // row 2 of each storey, k >= 1
    if (yy < 1 || yy % 5 !== 2) continue;
    if (idx % 3 !== 0) continue;
    if (yy < innerTop0 || yy < gr) continue;
    put(ix, yy, iz, "shroomlight");
  }
}

// Roof: two plant units beside the centre, antenna at centre
const interiorRoof = [];
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  if (outward(x, z).length === 0 && !(centre && centre.x === x && centre.z === z)) {
    interiorRoof.push({ x, z });
  }
}
for (const u of interiorRoof.slice(0, 2)) {
  put(u.x, TOP, u.z, "light_gray_concrete");
  put(u.x, TOP + 1, u.z, "light_gray_concrete");
}
if (centre) {
  for (let y = TOP + 1; y <= 38; y++) put(centre.x, y, centre.z, "iron_bars");
  put(centre.x, 39, centre.z, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
