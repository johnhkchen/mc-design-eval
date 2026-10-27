// Way 332241851, Mt Eden / Eden Terrace: a 1930s Art Deco brick-and-plaster commercial block on a slope. The lidar cells
// give the footprint, the ground under each cell (0-4: a foundation fill up to it) and the roof (11-14), smoothed into
// three flat tiers: a lower wing at 11, the body at 12, and a penthouse at 14 set back two cells from the edge. The skin
// is red brick with cream plaster piers and string courses (the Deco vertical), a timber shopfront on the storey that
// meets the street, glass bays with an air cavity behind them, and warm lights in some of the cavities.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241851.cells.json`, "utf8"));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(key(x, z), { x, z, g, r });
const at = (x, z) => foot.get(key(x, z));
const list = [...foot.values()];

// 1. smooth the roof (5x5 mean) and snap it to tiers: 11 (lower wing), 12 (body), 14 (penthouse, inset two cells)
for (const c of list) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const o = at(c.x + dx, c.z + dz); if (o) { s += o.r; n++; } }
  c.rs = s / n;
}
const isPH = (c) => c.rs >= 13.2;
const PD = new Map(), pq = [];                    // distance inside the penthouse candidates (1 = touches lower/outside)
for (const c of list) if (isPH(c) && NB.some(([dx, dz]) => { const o = at(c.x + dx, c.z + dz); return !o || !isPH(o); })) { PD.set(key(c.x, c.z), 1); pq.push(c); }
for (let i = 0; i < pq.length; i++) {
  const c = pq[i], d = PD.get(key(c.x, c.z));
  for (const [dx, dz] of NB) { const o = at(c.x + dx, c.z + dz); if (o && isPH(o) && !PD.has(key(o.x, o.z))) { PD.set(key(o.x, o.z), d + 1); pq.push(o); } }
}
for (const c of list) {
  const d = PD.get(key(c.x, c.z)) ?? 0;
  c.top = c.rs < 11.6 ? 11 : isPH(c) && d >= 2 ? 14 : 12;
}

// 2. depth from the outside at each height (cells whose top is above y), so every wall is a skin, a cavity or core
const depthCache = new Map();
function depthAt(y) {
  if (depthCache.has(y)) return depthCache.get(y);
  const M = new Set(list.filter((c) => c.top > y).map((c) => key(c.x, c.z)));
  const d = new Map(), q = [];
  for (const k of M) {
    const [x, z] = k.split(",").map(Number);
    if (NB.some(([dx, dz]) => !M.has(key(x + dx, z + dz)))) { d.set(k, 1); q.push(k); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i].split(",").map(Number), dc = d.get(q[i]);
    for (const [dx, dz] of NB) { const k = key(x + dx, z + dz); if (M.has(k) && !d.has(k)) { d.set(k, dc + 1); q.push(k); } }
  }
  const r = { M, d }; depthCache.set(y, r); return r;
}

// 3. the entrance: on the north face (the lowest z), in a non-pier bay, the median of the candidates
const m0 = depthAt(0);
const northFace = list.filter((c) => m0.d.get(key(c.x, c.z)) === 1 && !at(c.x, c.z - 1) && c.x % 3 !== 0);
const minZ = Math.min(...northFace.map((c) => c.z));
const northRow = northFace.filter((c) => c.z === minZ).sort((a, b) => a.x - b.x);
const door = northRow[Math.floor(northRow.length / 2)];
const DOOR_FACING = "north";                      // outward is -z; the porch is the cell at z + 1

const PANE = (axis) => ({
  north: axis === "x" ? "true" : "false", south: axis === "x" ? "true" : "false",
  east: axis === "z" ? "true" : "false", west: axis === "z" ? "true" : "false", waterlogged: "false",
});
const DOOR = (half) => ({ facing: DOOR_FACING, half, hinge: "left", open: "false", powered: "false" });

// one wall block of a skin cell (depth 1), by height: cornice on top, plinth, shopfront, then Deco storeys
function skin(c, y) {
  const T = c.top, b = c.g === 0 ? 0 : 4, inM = depthAt(y).M;
  if (y === T - 1) return { kind: "cornice", block: "smooth_quartz" };
  if (y < b) return { kind: "plinth", block: "stone_bricks" };
  const exZ = NB.some(([dx, dz]) => dz && !inM.has(key(c.x + dx, c.z + dz)));
  const bay = exZ ? c.x : c.z, axis = exZ ? "z" : "x";
  const pier = bay % 3 === 0;
  if (door && c.x === door.x && c.z === door.z && (y === b + 1 || y === b + 2))
    return { kind: "door", block: "dark_oak_door", state: DOOR(y === b + 1 ? "lower" : "upper") };
  if (y < b + 4) {                                // the shopfront storey
    if (pier) return { kind: "pier", block: "quartz_block" };
    if (y === b) return { kind: "bulk", block: "dark_oak_planks" };
    if (y === b + 3) return { kind: "fascia", block: "dark_oak_planks" };
    return { kind: "shopwin", block: "glass_pane", state: PANE(axis) };
  }
  if (y % 4 === 0) return { kind: "string", block: "quartz_block" };
  if (pier) return { kind: "pier", block: "quartz_block" };
  if (y % 4 === 3) return { kind: "head", block: "bricks" };
  return { kind: "win", block: "glass_pane", state: PANE(axis) };
}

// a depth-2 cell: air behind a glass bay (a warm light in some), the porch behind the door, else solid
function cavity(c, y) {
  const T = c.top, b = c.g === 0 ? 0 : 4, d = depthAt(y).d;
  if (y === T - 1) return { block: "stone" };
  if (door && c.x === door.x && c.z === door.z + 1 && (y === b + 1 || y === b + 2)) {
    if (y === b + 2) return { block: "lantern", state: { hanging: "true", waterlogged: "false" } };
    return { block: "air" };
  }
  for (const [dx, dz] of NB) {
    const o = at(c.x + dx, c.z + dz);
    if (!o || d.get(key(o.x, o.z)) !== 1) continue;
    const s = skin(o, y);
    if (s.kind !== "win" && s.kind !== "shopwin" && s.kind !== "door") continue;
    const h = (c.x * 7 + c.z * 13 + y * 5) % 5;
    if (s.kind !== "win" && y === b + 1 && h === 0) return { block: "lantern", state: { hanging: "false", waterlogged: "false" } };
    if (s.kind === "win" && h === 0) return { block: "glowstone" };
    if (s.kind === "win" && h === 1) return { block: "shroomlight" };
    return { block: "air" };
  }
  return { block: "stone" };
}

// 4. fill: foundation below the ground, then the wall (skin), its cavity (depth 2) and the core
const out = new Voxels([37, 27, 39]);
let blocks = 0;
for (const c of list) {
  for (let y = 0; y < c.top; y++) {
    if (y < c.g) { out.set(c.x, y, c.z, "stone_bricks"); blocks++; continue; }
    const dd = depthAt(y).d.get(key(c.x, c.z));
    const s = dd === 1 ? skin(c, y) : dd === 2 ? cavity(c, y) : { block: "stone" };
    if (s.block === "air") continue;
    out.set(c.x, y, c.z, s.block, s.state); blocks++;
  }
}

// 5. roof plant: a 3 x 2 x 2 box on the body roof, away from the edges and the penthouse
const d11 = depthAt(11).d;
let plant = 0;
for (const c of list) {
  if (c.top !== 12 || c.x % 9 !== 3 || c.z % 8 !== 3) continue;
  const box = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]].map(([dx, dz]) => at(c.x + dx, c.z + dz));
  if (box.some((o) => !o || o.top !== 12 || (d11.get(key(o.x, o.z)) ?? 0) < 4)) continue;
  plant++;
  for (const o of box) for (const y of [12, 13]) out.set(o.x, y, o.z, "light_gray_concrete");
}

const saved = out.save(`${DIR}/way_332241851.nbt`);
const tops = {};
for (const c of list) tops[c.top] = (tops[c.top] ?? 0) + 1;
console.log(JSON.stringify({ cells: list.length, tops, door: door && [door.x, door.z], plant, blocks, ...saved }));
