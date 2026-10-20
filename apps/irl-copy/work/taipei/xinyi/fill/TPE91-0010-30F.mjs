import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Uni-President International Building (統一國際大樓, 2002).
// Lidar roof ≈ 215 blocks above lowest ground: a 3-storey retail podium,
// a full-footprint glass tower to y=150, a setback to y=200, and a crown
// set back further to a parapet at y=215. Cyan/light-blue glass with
// light-grey mullions and white spandrels; warm glowstone behind some panes.
// Entrances: a centred doorway with canopy on every facade of the podium.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0010-30F";
const W = 149, H = 227, D = 77;
const TOP = 215;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), gr);
}
const fp = new Set(ground.keys());
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function erode(set, k) {
  let cur = set;
  for (let i = 0; i < k; i++) {
    const nx = new Set();
    for (const kk of cur) {
      const [x, z] = kk.split(",").map(Number);
      if (N4.every(([dx, dz]) => cur.has(key(x + dx, z + dz)))) nx.add(kk);
    }
    cur = nx;
  }
  return cur;
}

const C = erode(fp, 3);   // tower setback
const Dt = erode(fp, 8);  // crown

function outward(S, x, z) {
  for (const [dx, dz] of N4) if (!S.has(key(x + dx, z + dz))) return [dx, dz];
  return null;
}
const isEdge = (S, x, z) => outward(S, x, z) !== null;

function put(x, y, z, id) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  g.set(x, y, z, id);
}

// Curtain-wall envelope for a tier whose footprint is S.
function envelope(S, x, z, y) {
  const out = outward(S, x, z);
  if (!out) {
    if (y % 5 === 0) put(x, y, z, "white_concrete");
    return;
  }
  if (y % 5 === 0) { put(x, y, z, "white_concrete"); return; } // spandrel / slab line
  const horiz = out[1] !== 0;
  const coord = horiz ? x : z;
  const floor = Math.floor(y / 5);
  if (coord % 3 === 0) {
    put(x, y, z, "light_gray_concrete"); // mullion
  } else {
    put(x, y, z, floor % 3 === 0 ? "light_blue_stained_glass" : "cyan_stained_glass");
  }
  if (coord % 9 === 4 && y % 5 === 2) {
    const ix = x - out[0], iz = z - out[1];
    if (S.has(key(ix, iz)) && !isEdge(S, ix, iz)) put(ix, y, iz, "glowstone");
  }
}

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const edgeFp = isEdge(fp, x, z);
  const fOut = outward(fp, x, z);

  // foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // podium: 3 storeys, shopfronts, centred entrances on all four faces
  const podiumTop = Math.min(gr + 15, TOP);
  for (let y = gr; y < podiumTop; y++) {
    if (y === gr) { put(x, y, z, edgeFp ? "stone_bricks" : "smooth_stone"); continue; }
    if (!edgeFp) { if (y % 5 === 0) put(x, y, z, "white_concrete"); continue; }

    const horiz = fOut[1] !== 0;
    const coord = horiz ? x : z;
    // centred doorway, one per facade run, every 30 blocks
    const entrance = (coord % 30) >= 12 && (coord % 30) <= 16;

    if (entrance) {
      if (y <= gr + 2) continue;                       // open doorway
      if (y === gr + 3) { put(x, y, z, "smooth_stone"); continue; } // canopy
    }
    if (y % 5 === 0) { put(x, y, z, "white_concrete"); continue; }
    if (y < gr + 5) {
      put(x, y, z, coord % 4 === 0 ? "light_gray_concrete" : "light_blue_stained_glass");
      continue;
    }
    envelope(fp, x, z, y);
  }

  // tier B: full footprint to y=150, terrace top at y=149 outside tier C
  for (let y = Math.max(gr + 15, podiumTop); y < 150 && y < TOP; y++) {
    if (y === 149 && !C.has(k)) {
      put(x, y, z, edgeFp ? "white_concrete" : "smooth_stone");
      continue;
    }
    envelope(fp, x, z, y);
  }

  // tier C: setback to y=200, terrace top at y=199 outside crown
  if (C.has(k)) {
    for (let y = 150; y < 200 && y < TOP; y++) {
      if (y === 199 && !Dt.has(k)) {
        put(x, y, z, isEdge(C, x, z) ? "white_concrete" : "smooth_stone");
        continue;
      }
      envelope(C, x, z, y);
    }
  }

  // tier D: crown to y=215 with parapet and roof cap
  if (Dt.has(k)) {
    const edgeD = isEdge(Dt, x, z);
    for (let y = 200; y < TOP; y++) {
      if (y === 214) { put(x, y, z, "light_gray_concrete"); continue; }
      if (y >= 212 && edgeD) { put(x, y, z, "white_concrete"); continue; }
      envelope(Dt, x, z, y);
    }
  }
}

// roof equipment: mechanical boxes and a mast on the crown
const dCells = [...Dt].map(s => s.split(",").map(Number));
if (dCells.length) {
  let cx = 0, cz = 0;
  for (const [x, z] of dCells) { cx += x; cz += z; }
  cx /= dCells.length; cz /= dCells.length;
  let best = dCells[0], bd = Infinity;
  for (const [x, z] of dCells) {
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d < bd) { bd = d; best = [x, z]; }
  }
  for (let y = TOP; y < TOP + 10; y++) put(best[0], y, best[1], "lightning_rod");

  for (const [x, z] of dCells) {
    if (isEdge(Dt, x, z)) continue;
    if (x % 10 >= 2 && x % 10 <= 4 && z % 10 >= 2 && z % 10 <= 3) {
      put(x, TOP, z, "iron_block");
      put(x, TOP + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
