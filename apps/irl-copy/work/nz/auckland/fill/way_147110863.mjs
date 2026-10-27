// General Buildings, Auckland (way 147110863): a 1960s-70s concrete-framed office block, nine storeys on a podium with a
// ten-storey tower stepped back from it, bluestone plinth and parapets, white-concrete piers with tinted glass between.
// The lidar roof is smoothed into three flat tiers (38, 41, 46), the tower is inset one cell from the podium, and each
// storey is four blocks: a floor band, two rows of glass (or piers), a head band. Behind the glass sits one air cell, a
// floor slab per storey, and solid core inside, so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_147110863.cells.json`, "utf8"));

const W = 31, D = 43, H = 59;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const grid = (fill) => Array.from({ length: D }, () => Array(W).fill(fill));

// footprint and the lidar roof per cell
const R = grid(null);
for (const [x, z, , r] of cells) R[z][x] = r;
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && R[z][x] !== null;

// 1. three flat tiers from the lidar roof: 38 (low wings), 41 (podium), 46 (tower)
const tierOf = (r) => (r >= 44 ? 46 : r >= 40 ? 41 : 38);
let T = grid(0);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z)) T[z][x] = tierOf(R[z][x]);

// 2. majority over the 3x3 neighbourhood drops lidar speckle
const S = T.map((row) => row.slice());
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const n = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!inside(x + dx, z + dz)) continue;
    const t = T[z + dz][x + dx]; n.set(t, (n.get(t) || 0) + 1);
  }
  let best = T[z][x], bc = n.get(best) || 0;
  for (const [t, c] of n) if (c > bc) { best = t; bc = c; }
  S[z][x] = best;
}
T = S;

// 3. the tower steps in one cell from the podium on every edge it shares with a lower tier or the outline
const U = T.map((row) => row.slice());
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z) || T[z][x] !== 46) continue;
  const edge = NB.some(([dx, dz]) => !inside(x + dx, z + dz) || T[z + dz][x + dx] < 46);
  if (edge) U[z][x] = 41;
}
T = U;

// present at height h: a cell whose column reaches above h
const present = (x, z, h) => inside(x, z) && T[z][x] > h;

// depth from the exterior at height h: 0 = wall ring, 1 = air gap behind the glass, 2+ = solid core
function depthAt(h) {
  const dist = grid(-1), q = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!present(x, z, h)) continue;
    if (NB.some(([dx, dz]) => !present(x + dx, z + dz, h))) { dist[z][x] = 0; q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [dx, dz] of NB) {
      const nx = x + dx, nz = z + dz;
      if (present(nx, nz, h) && dist[nz][nx] < 0) { dist[nz][nx] = dist[z][x] + 1; q.push([nx, nz]); }
    }
  }
  return dist;
}
const depth = [];
for (let h = 0; h < 46; h++) depth.push(depthAt(h));

// 4. the kind of block for every present cell, by height
const kindOf = (x, z, h) => {
  const top = T[z][x];
  if (h < 4) return "plinth";
  const d = depth[h][z][x];
  if (h === top - 1) return d === 0 ? "parapet" : "roof";
  const n = Math.floor((top - 5) / 4);            // full storeys under the cornice
  const inStoreys = h < 4 + 4 * n;
  const r = (h - 4) % 4;                          // 0 floor band, 1-2 glass, 3 head band
  if (d === 0) {
    if (!inStoreys || r === 0 || r === 3) return "band";
    const exX = !present(x - 1, z, h) || !present(x + 1, z, h);
    const exZ = !present(x, z - 1, h) || !present(x, z + 1, h);
    const pier = exX && exZ ? true : exZ ? x % 3 === 0 : z % 3 === 0;
    if (h < 8) return pier ? "shopPier" : "shop";  // ground floor: shopfront
    return pier ? "pier" : "glass";
  }
  if (d === 1 && inStoreys) return r === 0 ? "band" : "gap";
  return "solid";
};
const K = Array.from({ length: H }, () => grid(null));
for (let h = 0; h < 46; h++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (present(x, z, h)) K[h][z][x] = kindOf(x, z, h);
}

// 5. the entrance on the longer street-facing edge of the podium (cells on the outline at height 4)
const north = [], south = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!present(x, z, 4) || T[z][x] !== 41) continue;
  if (!present(x, z - 1, 4)) north.push(x);
  if (!present(x, z + 1, 4)) south.push(x);
}
const front = north.length >= south.length ? { list: north, dz: -1, facing: "north" } : { list: south, dz: 1, facing: "south" };
const doorX = front.list.sort((a, b) => a - b)[Math.floor(front.list.length / 2)];
const doorZ = front.dz < 0 ? Math.min(...[...Array(D).keys()].filter((z) => present(doorX, z, 4))) : Math.max(...[...Array(D).keys()].filter((z) => present(doorX, z, 4)));
for (const dx of [-1, 1]) {
  K[5][doorZ][doorX + dx] = "shopPier"; K[6][doorZ][doorX + dx] = "shopPier";
  K[7][doorZ][doorX + dx] = "parapet";
}
K[7][doorZ][doorX] = "parapet";                   // lintel over the door
K[4][doorZ][doorX] = "door_lo";
K[5][doorZ][doorX] = "door_hi";
K[6][doorZ][doorX] = "shopPier";

// 6. warm light: glowstone and shroomlight in the air gap behind some lit glass
for (let h = 9; h < 46; h++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (K[h][z][x] !== "gap") continue;
  const r = (h - 4) % 4;
  if (r !== 2) continue;
  const behindGlass = NB.some(([dx, dz]) => K[h]?.[z + dz]?.[x + dx] === "glass");
  if (!behindGlass) continue;
  const roll = (x * 7 + z * 11 + h * 5) % 13;
  if (roll === 0) K[h][z][x] = "lamp";
  else if (roll === 6) K[h][z][x] = "lamp2";
}

// 7. roof equipment: a plant room on the tower roof, and two plant boxes on the podium roof
const equip = [];
const boxOK = (x0, z0, size, tier, h) => {
  for (let dz = 0; dz < size; dz++) for (let dx = 0; dx < size; dx++) {
    const x = x0 + dx, z = z0 + dz;
    if (!inside(x, z) || T[z][x] !== tier || depth[h][z][x] < 2) return false;
  }
  return true;
};
const towerBox = [];
for (let z = 0; z < D - 3; z++) for (let x = 0; x < W - 3; x++) if (boxOK(x, z, 4, 46, 45)) towerBox.push([x, z]);
if (towerBox.length) {
  const cx = W / 2, cz = D / 2;
  const [x0, z0] = towerBox.sort((a, b) => Math.hypot(a[0] + 2 - cx, a[1] + 2 - cz) - Math.hypot(b[0] + 2 - cx, b[1] + 2 - cz))[0];
  for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) {
    for (let h = 46; h <= 48; h++) equip.push([x0 + dx, h, z0 + dz, "equip"]);
    equip.push([x0 + dx, 49, z0 + dz, "equipRoof"]);
  }
}
const podBox = [];
for (let z = 0; z < D - 2; z++) for (let x = 0; x < W - 2; x++) if (boxOK(x, z, 3, 41, 40)) podBox.push([x, z]);
const placed = [];
for (const [x, z] of podBox) {
  if (placed.length && placed.some(([px, pz]) => Math.abs(px - x) + Math.abs(pz - z) < 12)) continue;
  placed.push([x, z]);
  if (placed.length === 2) break;
}
for (const [x0, z0] of placed) for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) {
  for (let h = 41; h <= 42; h++) equip.push([x0 + dx, h, z0 + dz, "equip"]);
  equip.push([x0 + dx, 43, z0 + dz, "equipRoof"]);
}

// 8. write the volume
const BLOCK = {
  plinth: "polished_andesite",
  band: "light_gray_concrete",
  glass: "light_blue_stained_glass",
  shop: "glass",
  pier: "white_concrete",
  shopPier: "polished_andesite",
  parapet: "polished_andesite",
  roof: "gray_concrete",
  solid: "light_gray_concrete",
  lamp: "glowstone",
  lamp2: "shroomlight",
  equip: "light_gray_concrete",
  equipRoof: "gray_concrete",
};
const g = new Voxels([W, H, D]);
for (let h = 0; h < 46; h++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const k = K[h][z][x];
  if (!k || k === "gap") continue;
  if (k === "door_lo") { g.set(x, h, z, "iron_door", { facing: front.facing, half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
  if (k === "door_hi") { g.set(x, h, z, "iron_door", { facing: front.facing, half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
  g.set(x, h, z, BLOCK[k]);
}
for (const [x, y, z, k] of equip) g.set(x, y, z, BLOCK[k]);
g.save(`${DIR}/way_147110863.nbt`);
