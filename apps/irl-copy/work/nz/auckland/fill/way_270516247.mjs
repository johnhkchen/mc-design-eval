// A two-storey 1960s-70s reinforced-concrete commercial block: light grey concrete walls on a stone base, storey
// lines and a smooth cornice, cyan tinted glazing in aluminium-style frames (polished andesite mullions), a flat roof
// with a one-block plant tier where the lidar stands at 9 and 10. Footprint from the lidar cells; foundation to each
// cell's ground; a 1-deep air gap behind the glass in the two storey bands; no rooms, just the shell and a solid core.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270516247.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270516247.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 117, D = 82, H = 23;
const idx = (x, z) => z * W + x;
const ground = new Map(), rawRoof = new Map();
for (const [x, z, g, r] of cells) { ground.set(idx(x, z), g); rawRoof.set(idx(x, z), r); }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground.has(idx(x, z));
const DIRS = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];
// a door's facing is the way it opens toward the inside: from the street (outward N) it faces south, and so on
const FACING = { N: "south", S: "north", W: "east", E: "west" };

// roof: a 3x3 median of the lidar (noise on the edges goes), clamped to the three tiers the lidar really has (8 wings, 9 main, 10 core)
const roof = new Map();
for (const k of ground.keys()) {
  const x = k % W, z = Math.floor(k / W), v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) v.push(rawRoof.get(idx(x + dx, z + dz)));
  v.sort((a, b) => a - b);
  roof.set(k, Math.min(10, Math.max(8, v[v.length >> 1])));
}

// depth: 0 on the outer ring of the footprint, then 1, 2, ... inward (1 is the air gap behind the glass, 2+ is solid core)
const depth = new Map(), queue = [];
for (const k of ground.keys()) {
  const x = k % W, z = Math.floor(k / W);
  if (DIRS.some(([dx, dz]) => !inF(x + dx, z + dz))) { depth.set(k, 0); queue.push(k); }
}
for (let i = 0; i < queue.length; i++) {
  const k = queue[i], x = k % W, z = Math.floor(k / W), d = depth.get(k);
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz; if (!inF(nx, nz)) continue;
    const nk = idx(nx, nz); if (!depth.has(nk)) { depth.set(nk, d + 1); queue.push(nk); }
  }
}

const outs = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));

// the entrance: the lowest facade cell nearest the middle of the footprint, so its door sits at a usable ground level
let cx = 0, cz = 0; for (const k of ground.keys()) { cx += k % W; cz += Math.floor(k / W); }
cx /= ground.size; cz /= ground.size;
const cand = [...ground.keys()].map((k) => ({ x: k % W, z: Math.floor(k / W), k }))
  .filter(({ x, z }) => depth.get(idx(x, z)) === 0 && outs(x, z).length === 1 && ground.get(idx(x, z)) <= 1);
cand.sort((a, b) => ground.get(idx(a.x, a.z)) - ground.get(idx(b.x, b.z)) || Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
const e = cand[0];
const door = e && { x: e.x, z: e.z, dn: outs(e.x, e.z)[0][2], k: outs(e.x, e.z)[0][2] === "N" || outs(e.x, e.z)[0][2] === "S" ? e.x : e.z };

const pane = (dn) => (dn === "N" || dn === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const GLASS = "cyan_stained_glass_pane";

// a lamp on the inside of some windows: a hash thins them to about one bay in five
const lampHere = (x, z) => {
  if (((x * 7 + z * 13) % 5) !== 0) return false;
  for (const [dx, dz, dn] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inF(nx, nz) || depth.get(idx(nx, nz)) !== 0) continue;
    const k = dn === "N" || dn === "S" ? nx : nz;
    return k % 4 !== 0;
  }
  return false;
};

// what a footprint cell's column holds at height y (null is air or nothing)
function at(x, y, z) {
  const k = idx(x, z), g = ground.get(k);
  if (g === undefined) return null;
  if (y < g) return ["stone"];                                            // foundation up to this cell's ground
  if (y >= roof.get(k)) return null;                                      // above the roof tier
  const d = depth.get(k);
  if (d === 0) return facade(x, z, y, g);
  if (d >= 2) return ["light_gray_concrete"];                             // the solid core
  // d = 1: slabs at y 3 and 7, the roof plant above 8, air in the two storey bands
  if (y === 7) return ["gray_concrete"];
  if (y === 3) return ["light_gray_concrete"];
  if (y >= 8) return ["gray_concrete"];
  const band = (y <= 2) || (y >= 4 && y <= 6);
  if (!band) return ["light_gray_concrete"];
  if (lampHere(x, z)) {
    if (y === 2) return ["lantern", { hanging: "true", waterlogged: "false" }];   // hangs from the storey-1 slab
    if (y === 4) return ["glowstone"];                                             // stands on the storey-2 slab
    if (y === 6) return ["lantern", { hanging: "true", waterlogged: "false" }];   // hangs from the cap
  }
  return null;
}

function facade(x, z, y, g) {
  const o = outs(x, z);
  if (y >= 8) return ["light_gray_concrete"];                             // parapet on the plant tier
  if (y === 7) return ["smooth_stone"];                                   // cornice
  if (o.length !== 1) return ["polished_andesite"];                       // corner column
  const dn = o[0][2], k = dn === "N" || dn === "S" ? x : z;
  const isDoor = door && door.x === x && door.z === z;
  if (isDoor) {
    const st = (half) => ({ facing: FACING[dn], half, hinge: "left", open: "false", powered: "false" });
    if (y === g) return ["oak_door", st("lower")];
    if (y === g + 1) return ["oak_door", st("upper")];
    if (y === g + 2 && y <= 2) return [GLASS, pane(dn)];                  // a transom
  }
  if (door && dn === door.dn && Math.abs(k - door.k) === 1 && y >= g && y <= g + 2) return ["polished_andesite"]; // jambs
  if (y === g) return ["stone_bricks"];                                   // base course
  if (y === 3) return ["smooth_stone"];                                   // storey line
  const win = (y > g && y <= 2) || (y >= 4 && y <= 6);
  if (win) return k % 4 === 0 ? ["polished_andesite"] : [GLASS, pane(dn)];   // mullions every 4 blocks
  return ["light_gray_concrete"];
}

const g = new Voxels([W, H, D]);
let placed = 0;
for (const k of ground.keys()) {
  const x = k % W, z = Math.floor(k / W);
  for (let y = 0; y < H; y++) {
    const b = at(x, y, z); if (!b) continue;
    g.set(x, y, z, b[0], b[1]); placed++;
  }
}
const saved = g.save(OUT);
console.log(JSON.stringify({ cells: ground.size, placed, door: door && { x: door.x, z: door.z, facing: FACING[door.dn] }, ...saved }));
