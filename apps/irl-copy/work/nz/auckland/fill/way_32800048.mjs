// Karanga-a-Hape Station, the K' Road frontage: a 1960s-70s concrete commercial block, five to eight storeys, pale
// concrete frame with blue-glass ribbon windows on a dark stone plinth, and shopfronts on the ground storey. The lidar
// roof is smoothed by a 3x3 median and stepped to the storey lines (20, 24, 28, 32 blocks), so every tier stands on
// the one below and the setbacks are whole columns. Interiors are solid masonry, so each floor rests on the one under
// it; behind each window is a one-block air recess, and some recesses hold a light (glowstone upstairs, lanterns in the
// shops). The ground floor is the storey the street sits in: the foundation runs up to each cell's own ground.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_32800048.cells.json", "utf8"));
const W = 54, D = 47, H = 45;

// footprint: lidar ground (g) and roof (r) per cell
const G = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g, r] of cells) G[z][x] = { g, r };
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[z][x] !== null;

// tiers: the median roof of the 3x3 footprint cells, rounded to a storey line (four blocks); outside the footprint is 0
const T = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) v.push(G[z + dz][x + dx].r);
  v.sort((a, b) => a - b);
  T[z][x] = 4 * Math.floor(v[v.length >> 1] / 4 + 0.5);
}
const tAt = (x, z) => (inF(x, z) ? T[z][x] : 0);
// a face is open at height y when the neighbour is outside the footprint or has no block there
const exposed = (x, z, y) => ({ xe: tAt(x - 1, z) <= y || tAt(x + 1, z) <= y, ze: tAt(x, z - 1) <= y || tAt(x, z + 1) <= y });

// the entrance: a shell cell on the ground storey facing out on one side, nearest the south end of the frontage
let door = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const gr = G[z][x].g, t = T[z][x];
  if (gr < 1 || t < gr + 8) continue;
  const e = exposed(x, z, gr), e1 = exposed(x, z, gr + 1);
  if (!(e.xe !== e.ze) || !(e1.xe !== e1.ze)) continue;
  const facing = e.ze ? (tAt(x, z + 1) <= gr ? "south" : "north") : (tAt(x + 1, z) <= gr ? "east" : "west");
  const score = Math.abs(x - 27) + (D - 1 - z);
  if (!door || score < door.score) door = { x, z, g: gr, facing, score };
}

// window recesses: each window cell on a face gets an air cell behind it, if that cell is solid interior
const key = (x, y, z) => `${x},${y},${z}`;
const recess = new Map(), win = new Set();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z) || (door && door.x === x && door.z === z)) continue;
  const gr = G[z][x].g, t = T[z][x];
  for (let y = gr; y < t; y++) {
    if (y % 4 !== 1 && y % 4 !== 2) continue;
    const zneg = tAt(x, z - 1) <= y, zpos = tAt(x, z + 1) <= y, xneg = tAt(x - 1, z) <= y, xpos = tAt(x + 1, z) <= y;
    const exZ = zneg || zpos, exX = xneg || xpos;
    if (exX === exZ) continue;                                   // interior, or a corner pier
    let dx = 0, dz = 0;
    if (exZ) { if (zneg && zpos) continue; dz = zneg ? 1 : -1; } else { if (xneg && xpos) continue; dx = xneg ? 1 : -1; }
    const nx = x + dx, nz = z + dz;
    if (!inF(nx, nz) || tAt(nx, nz) <= y || G[nz][nx].g > y) continue;
    const ne = exposed(nx, nz, y);
    if (ne.xe || ne.ze) continue;
    win.add(key(x, y, z));
    const k = key(nx, y, nz);
    if (!recess.has(k)) recess.set(k, { lit: (x * 7 + z * 11 + Math.floor(y / 4)) % 6 === 0 && y % 4 === 1 });
  }
}

const v = new Voxels([W, H, D]);
const SHOP = "dark_oak_planks";
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const gr = G[z][x].g, t = T[z][x], shopTop = 4 * (Math.floor(gr / 4) + 1);
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) v.set(x, y, z, "stone_bricks");
  for (let y = gr; y < t; y++) {
    const k = key(x, y, z), e = exposed(x, z, y), shell = e.xe || e.ze, corner = e.xe && e.ze, inShop = y < shopTop;
    const rec = recess.get(k);
    if (rec) {                                                   // the air behind a window: a light, or air
      if (rec.lit) v.set(x, y, z, inShop ? "lantern" : "glowstone", inShop ? { hanging: "false", waterlogged: "false" } : undefined);
      continue;
    }
    if (door && door.x === x && door.z === z && (y === door.g || y === door.g + 1)) {
      v.set(x, y, z, "dark_oak_door", { facing: door.facing, half: y === door.g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (!shell) { v.set(x, y, z, y === t - 1 ? "stone" : "white_concrete"); continue; }     // solid interior; roof on top
    if (y === t - 1) { v.set(x, y, z, "light_gray_concrete"); continue; }                  // cornice
    const r = y % 4;
    if (corner) { v.set(x, y, z, r === 0 || r === 3 ? "light_gray_concrete" : "gray_concrete"); continue; }   // corner piers
    if (r === 0 || r === 3) {                                    // floor lines; the shop fascia and bulkhead
      v.set(x, y, z, inShop ? (r === 0 ? SHOP : "polished_andesite") : "light_gray_concrete");
      continue;
    }
    const mull = e.ze ? x % 3 === 0 : z % 3 === 0;               // bays of two glass to one frame, along the face
    if (mull) { v.set(x, y, z, inShop ? SHOP : "gray_concrete"); continue; }
    if (win.has(k)) v.set(x, y, z, inShop ? "glass" : "light_blue_stained_glass");
    else v.set(x, y, z, "white_concrete");
  }
  // the parapet cap on a top shell cell, and roof plant on the flat roof of the interior
  const top = exposed(x, z, t - 1);
  if (top.xe || top.ze) v.set(x, t, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  else if (t >= 28 && x % 8 === 3 && z % 8 === 3) {            // plant on the tower roofs only, in clusters of one
    v.set(x, t, z, "light_gray_concrete"); v.set(x, t + 1, z, "iron_bars", { east: "true", west: "true", south: "true", north: "true", waterlogged: "false" });
  }
}

v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_32800048.nbt");
const tiers = {}; for (const [x, z] of cells) tiers[T[z][x]] = (tiers[T[z][x]] || 0) + 1;
console.log(JSON.stringify({ blocks: v.count(), palette: v.palette.length, door, windows: win.size, recesses: recess.size, tiers }));
