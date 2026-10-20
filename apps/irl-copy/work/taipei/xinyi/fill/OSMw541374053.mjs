import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 12 x 18 footprint, roof about 11 blocks above lowest ground.
// Read as a late-1970s/1980s Taipei low-rise commercial block: two storeys over
// a shopfront, cream tiled walls, tinted upper glazing, a grey base and cornice,
// and a steel water tank on the roof. The street face is z = 0 (north).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541374053";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

// Outward faces of a footprint cell (neighbour missing from the footprint).
const faces = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push({ dx: -1, dz: 0 });
  if (!has(x + 1, z)) f.push({ dx: 1, dz: 0 });
  if (!has(x, z - 1)) f.push({ dx: 0, dz: -1 });
  if (!has(x, z + 1)) f.push({ dx: 0, dz: 1 });
  return f;
};
const isPerim = (x, z) => faces(x, z).length > 0;
const interior = (x, z) => has(x, z) && !isPerim(x, z);

const v = new Voxels([12, 23, 18]);
const put = (x, y, z, id, p) => (p ? v.set(x, y, z, id, p) : v.set(x, y, z, id));

// Along-facade index and window eligibility for a single-face perimeter cell.
function winInfo(x, z, f) {
  const single = f.length === 1;
  if (!single) return { single, win: false };
  const d = f[0];
  const ns = d.dz !== 0;                 // face on north/south side (runs along x)
  const t = ns ? x : z;
  const len = ns ? 12 : 18;
  const front = d.dz === -1;
  const win = t >= 1 && t <= len - 2 && t % 3 !== 0;
  return { single, win, t, ns, front, d };
}

// Wall block for a perimeter cell at height y.
function wallBlock(x, z, g, y, f) {
  if (y === g) return ["gray_concrete"];                       // base course
  if (y === 5 || y === 6 || y === 10) return ["light_gray_concrete"]; // floor line, sill, cornice

  const { single, win, t, ns, front } = winInfo(x, z, f);
  const paneP = ns
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };

  if (y < 5) {                                                 // ground storey
    if (win) {
      if (y === 4) return [front ? "red_terracotta" : "white_terracotta"];
      if (front && t === 5 && y <= g + 2) {
        return ["oak_door", {
          facing: "north",
          half: y === g + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        }];
      }
      return ["glass_pane", paneP];
    }
    if (single && front && y <= 3 && t % 3 === 0) return ["gray_concrete"];
    return ["white_terracotta"];
  }

  // upper storey (y 6..9)
  if (win && (y === 7 || y === 8)) return ["cyan_stained_glass_pane", paneP];
  return ["white_terracotta"];
}

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Storeys, cornice and roof deck.
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (f.length === 0) {
    // Interior: floor slabs per storey and the roof deck. Air elsewhere.
    if (gr <= 0) put(x, 0, z, "smooth_stone");
    put(x, gr, z, "smooth_stone");
    if (5 >= gr) put(x, 5, z, "smooth_stone");
    if (10 >= gr) put(x, 10, z, "light_gray_concrete");
  } else {
    for (let y = gr; y <= 10; y++) {
      const [id, p] = wallBlock(x, z, gr, y, f);
      put(x, y, z, id, p);
    }
  }
}

// 3. Warm light behind some windows (glowstone in the room behind the glass).
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (f.length !== 1) continue;
  const info = winInfo(x, z, f);
  if (!info.win) continue;
  const ix = x - info.d.dx;
  const iz = z - info.d.dz;
  if (!interior(ix, iz)) continue;
  if (info.front && info.t % 6 === 2) {
    put(ix, gr + 2, iz, "glowstone");
  } else if (info.t % 6 === 4) {
    put(ix, 7, iz, "glowstone");
  }
}

// 4. Roof equipment: steel water tank with cap and lightning rod, stair housing.
const tankOk = [];
for (let x = 3; x <= 5; x++) for (let z = 6; z <= 8; z++) tankOk.push(interior(x, z));
if (tankOk.every(Boolean)) {
  for (let x = 3; x <= 5; x++) {
    for (let z = 6; z <= 8; z++) {
      for (let y = 11; y <= 13; y++) put(x, y, z, "iron_block");
      put(x, 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  put(4, 15, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const stairOk = [];
for (let x = 8; x <= 9; x++) for (let z = 2; z <= 3; z++) stairOk.push(interior(x, z));
if (stairOk.every(Boolean)) {
  for (let x = 8; x <= 9; x++) {
    for (let z = 2; z <= 3; z++) {
      put(x, 11, z, "white_terracotta");
      put(x, 12, z, "white_terracotta");
      put(x, 13, z, "light_gray_concrete");
    }
  }
}

v.save(`${DIR}/${ID}.nbt`);
