// Flowers Building, Auckland (way 1031519576): a 1970s-style office tower on a nine-storey podium, built from the lidar roof
// heights. Storeys are 4 blocks, on a grid that starts at y 1 (y 0 is the stone foundation), so every floor, setback and
// roof lands on the course below. Facades: a spandrel course per storey, glazed bands between white mullions, a shopfront
// base, a parapet cornice on every exposed edge, a lift core with an aerial mast, and a canopied entrance on the south face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1031519576.cells.json`, "utf8"));
const W = 44, D = 30, H = 115;

// lidar roof (blocks above y 0) -> storeys; under 4 blocks is plaza deck. One median pass over the 3x3 neighbourhood
// removes the stair-step noise so the tiers read as flat slabs.
const raw = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, , r] of cells) raw[x][z] = r < 4 ? 0 : Math.max(1, Math.round((r - 1) / 4));
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && raw[x][z] >= 0;
const median = (x, z) => {
  const v = [];
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (inF(x + a, z + b)) v.push(raw[x + a][z + b]);
  v.sort((p, q) => p - q);
  return v[v.length >> 1];
};
// T = the top surface of a footprint cell (its roof course is the layer T-1); 0 outside the footprint
const tAt = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inF(x, z)) {
  const n = median(x, z);
  tAt[x][z] = n > 0 ? 1 + 4 * n : 1;
}
const tt = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : tAt[x][z]);
// a cell's face is exposed at height y when a plan neighbour is outside the footprint or stands no higher than y
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const perim = (x, z, y) => DIRS.some(([a, b]) => tt(x + a, z + b) <= y);
const outward = (x, z, y) => DIRS.find(([a, b]) => tt(x + a, z + b) <= y) ?? [0, 0];
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// the massing: foundation, then per storey a spandrel course (floor slab inside), three glazed rows on the faces,
// and the roof course on top
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const T = tt(x, z);
  if (!T) continue;
  const glass = T >= 61 ? "cyan_stained_glass" : "light_blue_stained_glass";
  put(x, 0, z, "stone_bricks");
  for (let y = 1; y < T; y++) {
    const off = (y - 1) % 4, k = Math.floor((y - 1) / 4), per = perim(x, z, y);
    if (y === T - 1) { put(x, y, z, "smooth_stone"); continue; }
    if (off === 0) { put(x, y, z, per && k === 0 ? "stone_bricks" : "light_gray_concrete"); continue; }
    if (!per) continue;                       // interior air behind the glass
    const [dx, dz] = outward(x, z, y);
    const coord = dz !== 0 ? x : z;           // along the face: x on north/south faces, z on east/west
    const mullion = coord % 3 === 0;
    let block;
    if (k === 0) block = off === 3 ? "white_concrete" : mullion ? "polished_andesite" : glass;
    else block = mullion ? "white_concrete" : glass;
    put(x, y, z, block);
    // warm light in some windows: a glowstone (rarer shroomlight) just inside the glass
    if (block === glass) {
      const ix = x - dx, iz = z - dz;
      if (tt(ix, iz) > y && !perim(ix, iz, y)) {
        const h = hash(x, y, z) % 100;
        if (h < 11) put(ix, y, iz, "glowstone");
        else if (h === 42) put(ix, y, iz, "shroomlight");
      }
    }
  }
}

// cornice: a stone slab course on every edge where a tier stands above open air or a lower tier
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const T = tt(x, z);
  if (T > 1 && perim(x, z, T)) put(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// roof plant on the tiers: small concrete boxes on some interior roof cells
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const T = tt(x, z);
  if (T < 9 || T > 41 || perim(x, z, T) || (x * 7 + z * 5) % 19 !== 0) continue;
  put(x, T, z, "light_gray_concrete");
  put(x, T + 1, z, "light_gray_concrete");
}

// the tower's lift core on the top tier, with a mast
const Tmax = Math.max(...tAt.flat());
const top = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (tAt[x][z] === Tmax) top.push([x, z]);
const cx = Math.round(top.reduce((s, [x]) => s + x, 0) / top.length);
const cz = Math.round(top.reduce((s, [, z]) => s + z, 0) / top.length);
for (const x of [cx - 1, cx]) for (const z of [cz - 1, cz]) {
  if (tt(x, z) !== Tmax) continue;
  put(x, Tmax, z, "light_gray_concrete");
  put(x, Tmax + 1, z, "cyan_stained_glass");
  put(x, Tmax + 2, z, "cyan_stained_glass");
  put(x, Tmax + 3, z, "light_gray_concrete");
  put(x, Tmax + 4, z, "smooth_stone");
}
for (let y = Tmax + 5; y <= Tmax + 12 && y < H; y++)
  put(cx - 1, y, cz - 1, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
put(cx - 1, Tmax + 13, cz - 1, "lightning_rod");

// entrance: a ground-storey face on the street side (south, else east) where the massing is solid on both sides of the
// door, so the canopy rests on the wall. The face with the largest x+z (the south-east corner) is the frontage.
const FACE = { "0,1": "south", "0,-1": "north", "1,0": "east", "-1,0": "west" };
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (tt(x, z) < 5) continue;
  const [dx, dz] = [[0, 1], [1, 0]].find(([a, b]) => tt(x + a, z + b) === 0) ?? [];
  if (!dx && !dz) continue;
  const across = dz !== 0 ? [1, 0] : [0, 1];
  if (tt(x - across[0], z - across[1]) < 5 || tt(x + across[0], z + across[1]) < 5) continue;
  if (!door || x + z > door.x + door.z) door = { x, z, dx, dz, across };
}
if (door) {
  const { x, z, dx, dz, across } = door, face = FACE[`${dx},${dz}`];
  const doorState = (half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
  put(x, 1, z, "dark_oak_door", doorState("lower"));
  put(x, 2, z, "dark_oak_door", doorState("upper"));
  put(x, 3, z, "white_concrete");
  // canopy over the step: a paved apron at y 0, two posts, a slab at y 4 and a hanging lantern
  const at = (j, i) => [x + j * across[0] + dx * i, z + j * across[1] + dz * i];
  for (const j of [-1, 0, 1]) for (const i of [1, 2]) {
    const [a, b] = at(j, i);
    put(a, 0, b, "stone_bricks");
    put(a, 4, b, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
  for (const j of [-1, 1]) for (let y = 1; y <= 3; y++) { const [a, b] = at(j, 2); put(a, y, b, "polished_andesite"); }
  const [la, lb] = at(0, 2);
  put(la, 3, lb, "lantern", { hanging: "true", waterlogged: "false" });
}

const stats = g.save(`${DIR}/way_1031519576.nbt`);
console.log(JSON.stringify({ footprint: cells.length, topMax: Tmax, storeys: Math.round((Tmax - 1) / 4), door, ...stats }));
