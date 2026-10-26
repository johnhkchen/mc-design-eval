import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// District Building (John A. Wilson Bldg.), 1908 Beaux-Arts municipal office block.
// Stone-faced classical block on a granite plinth: regular window bays with wide
// piers, string courses each storey, a parapet, a central front pavilion one
// storey higher, a three-bay entrance with a canopy lintel, and a flat roof with
// a single mechanical penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87069.cells.json`, "utf8"));

const W = 32, H = 28, D = 26;
const STOREY = 3;
const g = new Voxels([W, H, D]);

// ---- index footprint -----------------------------------------------------
const cellMap = new Map();
for (const c of cells) {
  const [x, z, gr0, r0] = c;
  cellMap.set(`${x},${z}`, { x, z, gr: Math.round(gr0), r0: Math.round(r0) });
}
const has = (x, z) => cellMap.has(`${x},${z}`);

// bounds
let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
for (const c of cellMap.values()) {
  xmin = Math.min(xmin, c.x); xmax = Math.max(xmax, c.x);
  zmin = Math.min(zmin, c.z); zmax = Math.max(zmax, c.z);
}
const xmid = Math.round((xmin + xmax) / 2);

// ---- smooth lidar, then quantize to clean storey tiers -------------------
for (const c of cellMap.values()) {
  let sum = c.r0, n = 1;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const o = cellMap.get(`${c.x + dx},${c.z + dz}`);
    if (o) { sum += o.r0; n++; }
  }
  c.rs = sum / n;
}
const rsSorted = [...cellMap.values()].map(c => c.rs).sort((a, b) => a - b);
const medR = rsSorted[Math.floor(rsSorted.length / 2)];
const mainTop = Math.min(H - 5, Math.max(...[...cellMap.values()].map(c => c.gr)) + STOREY * 5 + 1);

for (const c of cellMap.values()) {
  // quantize to whole storeys around the median roof, so tiers are clean
  let steps = Math.round((c.rs - medR) / STOREY);
  steps = Math.max(-1, Math.min(1, steps));           // at most one storey off main
  let top = mainTop + steps * STOREY;
  // front central pavilion: one storey higher, a clean crown
  const pav = c.x >= xmid - 4 && c.x <= xmid + 4 && c.z <= zmin + 5;
  if (pav && steps >= 0) top = mainTop + STOREY;
  c.top = Math.max(c.gr + STOREY * 2, Math.min(top, H - 4));
}

const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 23;

function exposure(x, z) {
  const fr = !has(x, z - 1), bk = !has(x, z + 1);
  const wv = !has(x - 1, z), ev = !has(x + 1, z);
  const alongZ = fr || bk, alongX = wv || ev;
  return { fr, bk, wv, ev, alongZ, alongX, perim: fr || bk || wv || ev };
}

// front entrance: centre of the min-z face
const frontXs = [];
for (const c of cellMap.values()) if (!has(c.x, c.z - 1)) frontXs.push(c.x);
frontXs.sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;
const doorZ = zmin;

// ---- pass 1: foundation, shell, floors, parapet --------------------------
const lightSpots = [];
for (const c of cellMap.values()) {
  const { x, z, gr, top } = c;
  const ex = exposure(x, z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (ex.perim) {
    const corner = ex.alongZ && ex.alongX;
    const t = ex.alongZ ? x : z;
    // wide piers every 5 blocks; corners are piers
    const pier = corner || (t % 5 === 0);
    const paneAxis = ex.alongZ
      ? { east: "true", west: "true", north: "false", south: "false" }
      : { north: "true", south: "true", east: "false", west: "false" };

    // entrance surround: door on centre, calcite jambs beside it
    const inEntrance = ex.fr && Math.abs(x - doorX) <= 1 && z === doorZ;

    for (let y = gr; y < top; y++) {
      const off = (y - gr) % STOREY;
      if (y === top - 1) { g.set(x, y, z, "smooth_stone"); continue; }   // parapet cap
      if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }    // base course
      if (off === 0) { g.set(x, y, z, "smooth_stone"); continue; }       // string course
      const ground = (y - gr) < STOREY;

      if (inEntrance) {
        if (ground && x === doorX && (off === 1 || off === 2)) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north", half: off === 1 ? "lower" : "upper",
            hinge: "left", open: "false", powered: "false",
          });
        } else if (ground) {
          g.set(x, y, z, "calcite");
        } else {
          g.set(x, y, z, "calcite");
        }
        continue;
      }

      if (pier) { g.set(x, y, z, "calcite"); continue; }

      g.set(x, y, z, "glass_pane", { ...paneAxis, waterlogged: "false" });
      if (off === 2 && !ground && hash(x, y, z) === 0) lightSpots.push({ x, y, z, ex });
    }
  } else {
    for (let k = 0; gr + STOREY * k < top - 1; k++) {
      g.set(x, gr + STOREY * k, z, "smooth_stone");
    }
    g.set(x, top - 1, z, "light_gray_concrete");
  }
}

// ---- pass 2: a few warm lights behind glass ------------------------------
for (const s of lightSpots) {
  let ix = s.x, iz = s.z;
  if (s.ex.fr) iz = s.z + 1;
  else if (s.ex.bk) iz = s.z - 1;
  else if (s.ex.wv) ix = s.x + 1;
  else if (s.ex.ev) ix = s.x - 1;
  const inner = cellMap.get(`${ix},${iz}`);
  if (!inner || exposure(ix, iz).perim) continue;
  const off = (s.y - inner.gr) % STOREY;
  if (s.y < inner.gr || off === 0 || s.y >= inner.top - 1) continue;
  g.set(ix, s.y, iz, "glowstone");
}

// ---- pass 3: entrance canopy, lanterns, roof penthouse -------------------
if (doorX >= 0) {
  const dc = cellMap.get(`${doorX},${doorZ}`);
  if (dc) {
    // stone canopy lintel over the three-bay entrance, supported by the jambs
    for (const dx of [-1, 0, 1]) {
      const cc = cellMap.get(`${doorX + dx},${doorZ}`);
      if (!cc) continue;
      const ly = cc.gr + 3;
      if (ly < cc.top - 1) g.set(cc.x, ly, cc.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      if (dx !== 0) g.set(cc.x, cc.gr + 2, cc.z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// one mechanical penthouse on the pavilion roof, not a field of stubs
for (const c of cellMap.values()) {
  const { x, z, top } = c;
  if (exposure(x, z).perim) continue;
  if (x === xmid && z === zmin + 2 && top + 2 < H) {
    g.set(x, top, z, "stone_bricks");
    g.set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC87069.nbt`);
