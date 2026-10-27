// Way 363687870 (Auckland CBD edge, Mt Eden side): a four-storey 1970s office block on a one-storey podium, with a
// three-storey wing and a setback top floor. Glass panes sit in the outer skin with an air gap behind them, lanterns
// and shroomlights in some windows, a recessed porch with a canopy, a parapet and a plant room on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_363687870";
const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));
const SIZE = [49, 31, 56];

const k2 = (x, z) => `${x},${z}`;
const key3 = (x, y, z) => `${x},${y},${z}`;
const foot = new Map();                                    // "x,z" -> { g: ground, r: lidar roof above y 0 }
for (const [x, z, g, r] of cells) foot.set(k2(x, z), { g, r });
const inF = (x, z) => foot.has(k2(x, z));
const N4 = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// depth: steps in from the footprint edge (0 = edge cell)
const depth = new Map(), queue = [];
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (N4.some(([dx, dz]) => !inF(x + dx, z + dz))) { depth.set(k, 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = depth.get(k2(x, z));
  for (const [dx, dz] of N4) {
    const nx = x + dx, nz = z + dz;
    if (inF(nx, nz) && !depth.has(k2(nx, nz))) { depth.set(k2(nx, nz), d + 1); queue.push([nx, nz]); }
  }
}

// tiers: the median roof over a 5x5 window, quantised to three flat tops (5 podium, 13 wing, 17 tower)
const top = new Map();
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number), v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inF(x + dx, z + dz)) v.push(foot.get(k2(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const m = v[Math.floor(v.length / 2)];
  top.set(k, m >= 16 ? 17 : m >= 12 ? 13 : 5);
}

// storey k (1..4) is y 4k-3 .. 4k; a cell has it when its tier reaches 4k+1. The top storey steps back two cells.
const inM = (k, x, z) => {
  if (!inF(x, z)) return false;
  const t = top.get(k2(x, z));
  if (k === 1) return true;
  if (k === 2) return t >= 9;
  if (k === 3) return t >= 13;
  return t >= 17 && depth.get(k2(x, z)) >= 2;
};
const outward = (k, x, z) => N4.find(([dx, dz]) => !inM(k, x + dx, z + dz)) ?? null;
const pier = (n, x, z) => (n[0] !== 0 ? z : x) % 3 === 0;   // piers every 3 along the facade

const blocks = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blocks.set(key3(x, y, z), { block, state });
const air = new Set(), WIN = new Map(), RAIL = new Map();

// pass 1: window cells on the outer skin, and the air gap behind each one
for (let k = 1; k <= 4; k++) for (const kk of foot.keys()) {
  const [x, z] = kk.split(",").map(Number);
  if (!inM(k, x, z)) continue;
  const n = outward(k, x, z);
  if (!n) continue;
  for (let r = 1; r <= 2; r++) {
    const y = 4 * k - 3 + r;
    if (pier(n, x, z)) continue;
    WIN.set(key3(x, y, z), n);
    const ix = x - n[0], iz = z - n[1];
    if (inM(k, ix, iz)) air.add(key3(ix, y, iz));
  }
}

// pass 2: every storey, and the foundation under the whole footprint
for (const kk of foot.keys()) {
  const [x, z] = kk.split(",").map(Number);
  put(x, 0, z, "polished_andesite");
  for (let k = 1; k <= 4; k++) {
    if (!inM(k, x, z)) continue;
    const n = outward(k, x, z);
    for (let r = 0; r < 4; r++) {
      const y = 4 * k - 3 + r, id = key3(x, y, z);
      if (air.has(id)) continue;
      if (WIN.has(id)) { put(x, y, z, "light_blue_stained_glass_pane", {}); continue; }
      if (!n) { put(x, y, z, y === 4 * k && !inM(k + 1, x, z) ? "gray_concrete" : "light_gray_concrete"); continue; }
      if (r === 0) put(x, y, z, k === 1 ? "polished_andesite" : "smooth_stone");   // base course, sill
      else if (r === 3) put(x, y, z, "smooth_stone");                               // spandrel, cornice
      else put(x, y, z, "white_concrete");                                           // pier between windows
    }
  }
}

// parapet round the top storey; railing on the terrace the setback leaves
for (const kk of foot.keys()) {
  const [x, z] = kk.split(",").map(Number);
  if (inM(4, x, z) && outward(4, x, z)) put(x, 17, z, "stone_bricks");
  if (inM(3, x, z) && !inM(4, x, z) && depth.get(kk) === 0 && top.get(kk) === 17) {
    const n = N4.find(([dx, dz]) => !inF(x + dx, z + dz));
    if (n) { put(x, 13, z, "iron_bars", {}); RAIL.set(key3(x, 13, z), n); }
  }
}

// roof plant room: a 7 x 5 box on the top storey, two blocks high, its lid in iron
{
  let best = null;
  for (const kk of foot.keys()) {
    const [x, z] = kk.split(",").map(Number);
    if (inM(4, x, z) && (!best || depth.get(kk) > best.d)) best = { x, z, d: depth.get(kk) };
  }
  for (let x = best.x - 3; x <= best.x + 3; x++) for (let z = best.z - 2; z <= best.z + 2; z++) {
    if (!inM(4, x, z) || depth.get(k2(x, z)) < 3) continue;
    put(x, 17, z, "light_gray_concrete");
    put(x, 18, z, "iron_block");
  }
}

// the entrance: a recessed porch on the outer skin of the ground floor, with a canopy at y 3
let entry = null;
for (const kk of foot.keys()) {
  const [x, z] = kk.split(",").map(Number);
  const n = N4.find(([dx, dz]) => dx === 0 && !inF(x + dx, z + dz) || dx === 0 && !inM(1, x + dx, z + dz));
  if (!n || top.get(kk) !== 17) continue;
  if (![-1, 0, 1].every((i) => inF(x + i, z) && inF(x + i, z - n[1]))) continue;   // the porch stays on the footprint
  if (!entry || Math.abs(x - 24) < Math.abs(entry.x - 24) || (Math.abs(x - 24) === Math.abs(entry.x - 24) && z < entry.z)) entry = { x, z, n };
}
const { x: ex, z: ez, n: en } = entry;
const zi = ez - en[1];                                   // the cell just inside the porch
for (let i = -1; i <= 1; i++) for (const y of [1, 2]) { blocks.delete(key3(ex + i, y, ez)); blocks.delete(key3(ex + i, y, zi)); }
for (let i = -1; i <= 1; i++) { put(ex + i, 3, ez, "black_concrete"); put(ex + i, 3, zi, "black_concrete"); }
const doorState = (half) => ({ half, facing: en[2], hinge: "left", open: "false", powered: "false" });
put(ex, 1, ez, "dark_oak_door", doorState("lower"));
put(ex, 2, ez, "dark_oak_door", doorState("upper"));
put(ex - 1, 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
put(ex + 1, 2, ez, "lantern", { hanging: "true", waterlogged: "false" });

// warm light in some windows: a lantern or shroomlight in the air gap, standing on the sill
for (const [kk3] of WIN) {
  const [x, y, z] = kk3.split(",").map(Number), n = WIN.get(kk3);
  if (!blocks.has(kk3) || (y - 1) % 4 !== 1) continue;
  const ix = x - n[0], iz = z - n[1];
  if (!blocks.has(key3(ix, y - 1, iz)) || blocks.has(key3(ix, y, iz))) continue;
  if ((x * 7 + z * 5 + y) % 6 === 0) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else if ((x * 3 + z * 11 + y) % 9 === 0) put(ix, y, iz, "shroomlight", {});
}

// panes and railings join the neighbours along the wall; the way they face the outside stays open
const along = (n) => (n[0] !== 0 ? ["north", "south"] : ["east", "west"]);
const DXZ = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const joins = (x, y, z, n) => {
  const st = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  for (const dir of along(n)) {
    const [dx, dz] = DXZ[dir], nb = blocks.get(key3(x + dx, y, z + dz));
    st[dir] = nb && !["lantern", "dark_oak_door", "shroomlight"].includes(nb.block) ? "true" : "false";
  }
  return st;
};
for (const [kk3, n] of WIN) {
  const e = blocks.get(kk3);
  if (!e) continue;
  const [x, y, z] = kk3.split(",").map(Number);
  e.state = joins(x, y, z, n);
  e.block = "light_blue_stained_glass_pane";
}
for (const [kk3, n] of RAIL) {
  const [x, y, z] = kk3.split(",").map(Number);
  blocks.get(kk3).state = joins(x, y, z, n);
}

const g = new Voxels(SIZE);
for (const [kk3, e] of blocks) {
  const [x, y, z] = kk3.split(",").map(Number);
  g.set(x, y, z, e.block, e.state);
}
const out = g.save(`${SRC}.nbt`);
console.log(`way_363687870: ${out.blocks} blocks, ${out.palette} palette entries, entrance at ${ex},${ez}`);
