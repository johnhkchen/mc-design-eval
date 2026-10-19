// Columbia Recording Studios, 49 East 52nd Street, Midtown: a 1908 commercial and office loft in the red-brick manner
// (brick walls, calcite sill courses and quoins, a polished granite base, a shopfront on the street front, a smooth
// quartz cornice on every tier). The lidar tower is a stepped slab on the west half, 34 blocks at its west spine and
// 27 to 30 over the body, with a low wing at 3 and a paved grade deck (1) over the east half. Lidar roofs are median-smoothed
// over 3x3 and snapped to 3-block storeys (1 for the deck, 34 for the crown). The street front is the high-z side (z 27), with
// the entrance on the centre bay at x 6. Every column is solid from y 0 up to its tier, so nothing hangs. Windows are glass
// panes set in the outer wall with an air pocket behind them and a floor course per storey; some pockets hold glowstone.
// A small penthouse drum with a glass band and a smooth quartz cap sits on the best plateau.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035712.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 22, D = 28, H = 46;

const MAT = {
  base: "polished_granite", brick: "bricks", sill: "calcite", quoin: "calcite", cornice: "smooth_quartz",
  shopPier: "dark_oak_planks", glass: "glass_pane", core: "stone", roof: "smooth_stone", lamp: "glowstone",
};
const DOOR_X = 6;                                    // the entrance sits on the centre bay of the 22-wide street front
const STREET_Z = D - 1;
const DIRS = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] };   // S is the street (high z)

// Lidar roof -> clean tier: deck 1, low wings 3, every other storey a multiple of 3 (6, 9, ... 30), the crown 34.
const snap = (v) => (v <= 0 ? 0 : v === 1 ? 1 : v >= 33 ? 34 : Math.max(3, Math.round(v / 3) * 3));
const median = (a) => { a = [...a].sort((p, q) => p - q); return a[a.length >> 1]; };
const lidar = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const TOP = new Map();
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = lidar.get(`${x + dx},${z + dz}`); if (r !== undefined) v.push(r);
  }
  TOP.set(`${x},${z}`, snap(median(v)));
}
const top = (x, z) => TOP.get(`${x},${z}`) ?? 0;
const solid = (x, y, z) => x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < top(x, z);
const exposed = (x, y, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !solid(x + dx, y, z + dz)).map(([f]) => f);

const K = (x, y, z) => `${x},${y},${z}`;
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(K(x, y, z), { block, state });
const pockets = [];                                   // [x, y, z, lamp] air behind the glass, applied after the shell

// Shell: every solid cell, facade or core.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, y, z);
    const onTop = y === t - 1;
    if (!ex.length) { put(x, y, z, onTop ? MAT.roof : MAT.core); continue; }

    const face = ex.includes("S") ? "S" : ex.includes("N") ? "N" : ex[0];
    const zFace = face === "S" || face === "N";
    const u = zFace ? x : z;
    const along = zFace ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
    const isEnd = along.some(([dx, dz]) => !solid(x + dx, y, z + dz));
    const bayPier = u % 3 === 0;

    if (zFace && face === "S" && z === STREET_Z && x === DOOR_X && (y === 1 || y === 2)) {
      put(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      put(x, y, z - 1, "air");                                        // the vestibule behind the door is air
      continue;
    }
    let block;
    if (y === 0) block = MAT.base;
    else if (t >= 6 && y === t - 1) block = MAT.cornice;
    else if (y <= 2) block = isEnd ? MAT.base : bayPier ? MAT.shopPier : MAT.glass;
    else if (y % 3 === 0) block = MAT.sill;
    else if (isEnd) block = MAT.quoin;
    else block = bayPier ? MAT.brick : MAT.glass;

    put(x, y, z, block);

    // A window bay: air behind the glass (only where the inner cell is solid core and the wall is one cell thick there).
    if (block === MAT.glass && y < t - 1) {
      const [dx, dz] = DIRS[face];
      const ix = x - dx, iz = z - dz;
      if (solid(ix, y, iz) && !exposed(ix, y, iz).length) {
        pockets.push([ix, y, iz, y % 3 === 1 && (x * 5 + z * 3 + Math.floor(y / 3)) % 4 === 0]);
      }
    }
  }
}
for (const [x, y, z, lamp] of pockets) { put(x, y, z, "air"); if (lamp) put(x, y, z, MAT.lamp); }

// Roof equipment: a 3x3 penthouse drum on the best plateau (uniform tier 24 to 30, nearest the middle).
let best = null;
for (let x = 0; x <= W - 3; x++) for (let z = 0; z <= D - 3; z++) {
  const t = top(x, z); if (t < 24 || t > 30) continue;
  let uniform = true;
  for (let dz = 0; dz < 3 && uniform; dz++) for (let dx = 0; dx < 3; dx++) if (top(x + dx, z + dz) !== t) { uniform = false; break; }
  if (!uniform) continue;
  const score = t * 100 - Math.hypot(x + 1 - W / 2, z + 1 - D / 2);
  if (!best || score > best.score) best = { x, z, t, score };
}
if (best) {
  const { x: px, z: pz, t } = best;
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) {
    const x = px + dx, z = pz + dz, corner = dx !== 1 && dz !== 1, centre = dx === 1 && dz === 1;
    if (centre) { put(x, t, z, MAT.core); put(x, t + 1, z, MAT.lamp); put(x, t + 2, z, MAT.core); }
    else {
      put(x, t, z, MAT.brick);
      put(x, t + 1, z, corner ? MAT.sill : MAT.glass);
      put(x, t + 2, z, MAT.brick);
    }
    put(x, t + 3, z, MAT.cornice);
  }
}

// Glass panes connect to any non-air neighbour, so the bands read as continuous glazing rather than posts.
const PANE = (x, y, z) => { const e = plan.get(K(x, y, z)); return !!e && e.block !== "air"; };
for (const [k, e] of plan) {
  if (e.block !== MAT.glass) continue;
  const [x, y, z] = k.split(",").map(Number);
  e.state = { east: String(PANE(x + 1, y, z)), north: String(PANE(x, y, z - 1)), south: String(PANE(x, y, z + 1)), west: String(PANE(x - 1, y, z)), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/NYC1035712.nbt`);
const maxY = Math.max(...[...plan.keys()].map((k) => Number(k.split(",")[1])));
console.log(JSON.stringify({ blocks: out.blocks, palette: out.palette, maxY, penthouse: best }));
