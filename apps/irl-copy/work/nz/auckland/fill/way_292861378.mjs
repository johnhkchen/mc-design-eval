// Way 292861378, Newton/Eden Terrace edge: a 1980s concrete-frame office block on a sloping site. Lidar roofs snap to
// storey tiers (annex, 4-storey wing, setback, shoulder, tower, crown); every column is solid from y 0, so each tier stands
// on the one below. Facades are cut per exposed face at each level: base course, glass bays with polished-andesite
// mullions, floor bands and spandrels, a cornice and a parapet. Glass sits over a 1-block air gap; some gaps hold glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861378.cells.json`, "utf8"));

const W = 58, D = 67, H = 94, N = W * D;
const at = (x, z) => x * D + z;
const ground = new Int16Array(N).fill(-1), roof = new Int16Array(N);
for (const [x, z, gr, r] of cells) { ground[at(x, z)] = gr; roof[at(x, z)] = r; }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[at(x, z)] >= 0;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Lidar roof: 3x3 median over footprint cells, then snapped to a storey tier (block heights; 4 per storey)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) v.push(roof[at(x + dx, z + dz)]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierTop = (x, z) => {
  const gr = ground[at(x, z)], m = median(x, z);
  if (m <= gr + 5) return gr + 4;   // single-storey annex
  if (m < 22) return 16;            // 4-storey wing
  if (m < 60) return 40;            // 10-storey setback
  if (m < 69) return 68;            // 17-storey shoulder
  if (m < 77) return 72;            // 18-storey tower
  return 80;                        // 20-storey crown
};
const top = new Int16Array(N);
for (const [x, z] of cells) top[at(x, z)] = tierTop(x, z);
const maxT = Math.max(...top);

// Facade block for an exposed face: u is the coordinate along the wall (mullions every 3)
const facade = (y, u, gr, T) => {
  if (y === T - 1) return "smooth_stone";            // cornice
  if (y === gr) return "stone_bricks";               // base course at grade
  const r = y % 4;
  if (r === 0) return "light_gray_concrete";         // floor band
  if (r === 3) return "white_concrete";              // spandrel
  return u % 3 === 0 ? "polished_andesite" : "light_blue_stained_glass";
};

// Entrance: the larger of the north or south street faces (tall enough to be a frontage), centred on its run
const bigFace = (dz) => cells.filter(([x, z]) => !inF(x, z + dz) && top[at(x, z)] >= 8);
const faceN = bigFace(-1), faceS = bigFace(1);
const face = faceN.length >= faceS.length ? { cells: faceN, oz: -1, facing: "north" } : { cells: faceS, oz: 1, facing: "south" };
const mx = face.cells.map(([x]) => x).sort((a, b) => a - b)[face.cells.length >> 1];
const [dx0, dz0] = face.cells.reduce((best, c) => (Math.abs(c[0] - mx) < Math.abs(best[0] - mx) ? c : best));

const g = new Voxels([W, H, D]);
const lits = [];
for (let y = 0; y < maxT; y++) {
  const inS = (x, z) => inF(x, z) && top[at(x, z)] > y;
  // depth of each solid cell from the outside at this level (0 = exposed face)
  const dist = new Int16Array(N).fill(-1), q = [];
  for (const [x, z] of cells) {
    if (!inS(x, z)) continue;
    if (DIRS.some(([a, b]) => !inS(x + a, z + b))) { dist[at(x, z)] = 0; q.push([x, z]); }
  }
  for (let k = 0; k < q.length; k++) {
    const [x, z] = q[k], d0 = dist[at(x, z)];
    for (const [a, b] of DIRS) if (inS(x + a, z + b) && dist[at(x + a, z + b)] < 0) { dist[at(x + a, z + b)] = d0 + 1; q.push([x + a, z + b]); }
  }
  for (const [x, z] of cells) {
    if (!inS(x, z)) continue;
    const i = at(x, z), gr = ground[i], T = top[i], d = dist[i];
    if (y < gr) { g.set(x, y, z, "stone"); continue; }             // foundation under the grade
    if (y === T - 1 && d > 0) { g.set(x, y, z, "stone"); continue; }   // roof membrane
    if (d === 0) {
      const ox = !inS(x - 1, z) ? -1 : !inS(x + 1, z) ? 1 : 0;
      const oz = ox ? 0 : (!inS(x, z - 1) ? -1 : 1);
      const u = ox ? z : x;
      const block = facade(y, u, gr, T);
      if (block === "light_blue_stained_glass" && y % 4 === 1 && y >= 4 && (x * 7 + z * 13 + y) % 11 === 0) {
        const ix = x - ox, iz = z - oz;                                 // the air cell behind this pane
        if (inS(ix, iz) && dist[at(ix, iz)] === 1) lits.push([ix, y, iz]);
      }
      g.set(x, y, z, block);
    } else if (d === 1 && y >= gr && y < T - 1 && (y % 4 === 1 || y % 4 === 2)) {
      // air gap behind the glass (floor bands and spandrels stay solid)
    } else {
      g.set(x, y, z, "stone");                                         // core
    }
  }
  for (const [ix, iy, iz] of lits) if (iy === y) g.set(ix, iy, iz, "glowstone");
}

// Entrance: a pair of iron doors on the frontage, one bay wide, over the base course
const doorY = ground[at(dx0, dz0)];
g.set(dx0, doorY + 1, dz0, "iron_door", { facing: face.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx0, doorY + 2, dz0, "iron_door", { facing: face.facing, half: "upper", hinge: "left", open: "false", powered: "false" });

// Parapet on every roof edge (outside the footprint, or next to a lower tier)
for (const [x, z] of cells) {
  const T = top[at(x, z)];
  if (DIRS.some(([a, b]) => !inF(x + a, z + b) || top[at(x + a, z + b)] < T)) g.set(x, T, z, "white_concrete");
}

// Roof plant: boxes on flat roof areas (a margin ring of same-height roof around each), with a mast on the crown box
const findRect = (T, w, h) => {
  const cs = cells.filter(([x, z]) => top[at(x, z)] === T);
  const cx = cs.reduce((s, c) => s + c[0], 0) / cs.length, cz = cs.reduce((s, c) => s + c[1], 0) / cs.length;
  let best = null, bd = Infinity;
  for (let x0 = 0; x0 < W; x0++) for (let z0 = 0; z0 < D; z0++) {
    let ok = true;
    for (let x = x0 - 1; x <= x0 + w && ok; x++) for (let z = z0 - 1; z <= z0 + h && ok; z++) if (!inF(x, z) || top[at(x, z)] !== T) ok = false;
    if (!ok) continue;
    const dd = (x0 + w / 2 - cx) ** 2 + (z0 + h / 2 - cz) ** 2;
    if (dd < bd) { bd = dd; best = { x0, z0 }; }
  }
  return best;
};
const plant = (T, w, h) => {
  const r = findRect(T, w, h); if (!r) return null;
  for (let x = r.x0; x < r.x0 + w; x++) for (let z = r.z0; z < r.z0 + h; z++) {
    g.set(x, T, z, "light_gray_concrete"); g.set(x, T + 1, z, "light_gray_concrete");
  }
  return r;
};
plant(72, 4, 3);
const crown = plant(80, 5, 4);
if (crown) for (let y = 82; y <= 89; y++) g.set(crown.x0 + 2, y, crown.z0 + 1, "iron_bars");

g.save(`${DIR}/way_292861378.nbt`);

// check: every block above y 0 rests on a block below, or is a floor/ceiling slab held by solid neighbours at its level
const hanging = {};
let count = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 1; y < H; y++) {
  const b = g.get(x, y, z); if (!b) continue; count++;
  if (g.get(x, y - 1, z)) continue;
  const side = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([a, c]) => g.get(x + a, y, z + c));
  if (!side) hanging[b.block] = (hanging[b.block] || 0) + 1;
}
console.log(`blocks ${count}, palette ${g.palette.length - 1}, maxY ${maxT}, hanging with no side support ${JSON.stringify(hanging)}`);
