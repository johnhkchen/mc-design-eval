// Way 269439749, Mt Eden / Eden Terrace, Auckland: a 1930s brick-and-render flats-and-shops block, stepped down the hill.
// Roof tiers come from the lidar (10 / 8 / 6 / 5 above y 0), the foundation runs down to each cell's ground, and the
// storeys sit on absolute lines (y 4 and 8) so the downhill side shows its extra storey. Red brick walls, cream render
// string courses and cornice, a stone base course, glass panes set in air gaps, warm hanging lanterns behind some of them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439749.cells.json", "utf8"));
const X = 30, Z = 33, Y = 23;
const gnd = Array.from({ length: X }, () => Array(Z).fill(null));
const roofRaw = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, g, r] of cells) { gnd[x][z] = g; roofRaw[x][z] = r; }

// smooth the lidar roof into four flat tiers (9 -> 10, 7 -> 8), then a 3 x 3 median over the footprint to drop single-cell
// spikes, never closer than 2 blocks to its ground
const snap = (r) => (r >= 9 ? 10 : r >= 7 ? 8 : r === 6 ? 6 : 5);
const inF = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && gnd[x][z] !== null;
const G = (x, z) => gnd[x][z];
const tier = Array.from({ length: X }, (_, x) => Array.from({ length: Z }, (_, z) => {
  if (!inF(x, z)) return 0;
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) vals.push(snap(roofRaw[x + dx][z + dz]));
  return vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)];
}));
const T = (x, z) => Math.max(tier[x][z], gnd[x][z] + 2);

const DIRS = [["n", 0, -1], ["e", 1, 0], ["s", 0, 1], ["w", -1, 0]];
// faces of cell (x, z) at height y that see the open air (outside the footprint, or above a lower neighbouring tier)
function exposed(x, z, y) {
  const out = [];
  for (const [d, dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inF(nx, nz) || y >= T(nx, nz)) out.push(d);
  }
  return out;
}

// storey lines: the ground storey starts at the cell's ground, upper storeys on y 4 and 8 when they fit under the roof
const bases = (g, t) => [g, ...[4, 8].filter((L) => L > g && L < t)];

// the wall's block at (x, y, z) on an exposed face: string courses, base, cornice, sills, lintels, glazing on a bay pattern
function facade(x, z, y, d) {
  const g = G(x, z), t = T(x, z), bs = bases(g, t);
  const k = bs.findLastIndex((b) => b <= y), b = bs[k], first = k === 0, last = k === bs.length - 1;
  const nTop = last ? t - 1 : (bs[k + 1]) - 1;          // the lintel row (last storey: the cornice is t-1)
  const along = d === "n" || d === "s" ? x : z;
  if (y === t - 1) return { block: "quartz_block" };     // cornice
  if (y === b) return { block: first ? "polished_andesite" : "quartz_block" };   // base course / string course
  if (y > b && y < nTop) {
    const bay = first ? along % 5 !== 0 : along % 4 === 1 || along % 4 === 2;
    if (!bay) return { block: "bricks" };                // pier
    if (!first && y === b + 1) return { block: "quartz_slab", state: { type: "bottom", waterlogged: "false" } };   // sill
    return { block: "glass_pane", window: true, row: y, nTop };
  }
  return { block: "bricks" };                           // lintel
}

const spec = new Map();                                 // "x,y,z" -> { block, state }
const key = (x, y, z) => `${x},${y},${z}`;
const shell = new Set();                                // cells on the outer skin
const panes = [];                                       // glazed cells, with the cell they open into
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const g = G(x, z), t = T(x, z);
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, z, y);
    if (y < g) { spec.set(key(x, y, z), { block: ex.length ? "stone_bricks" : "stone" }); continue; }
    if (ex.length) {
      shell.add(key(x, y, z));
      const f = facade(x, z, y, ex[0]);
      if (f.window) panes.push({ x, y, z, d: ex[0], f });
      else spec.set(key(x, y, z), { block: f.block, state: f.state });
    }
  }
}
// interior: solid, a membrane on top, and an air gap one cell in behind every pane
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  for (let y = G(x, z); y < T(x, z); y++) {
    if (shell.has(key(x, y, z))) continue;
    spec.set(key(x, y, z), { block: y === T(x, z) - 1 ? "smooth_stone" : "stone" });
  }
}
const inward = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] };
let bay = 0;
for (const p of panes) {
  const [ix, iz] = inward[p.d], gx = p.x + ix, gz = p.z + iz;
  spec.set(key(p.x, p.y, p.z), { block: "glass_pane" });
  if (!inF(gx, gz) || shell.has(key(gx, p.y, gz))) continue;
  spec.delete(key(gx, p.y, gz));                        // the air gap behind the glass
  // one warm lantern hanging from the storey's lintel course, in every other bay of the top window row
  const along = p.d === "n" || p.d === "s" ? p.x : p.z;
  if (p.y === p.f.nTop - 1 && along % 8 === 2) {
    spec.set(key(gx, p.y, gz), { block: "lantern", state: { hanging: "true", waterlogged: "false" } });
    bay++;
  }
}
// the entrance: a dark oak door on the south face at the lowest bay of the front, a quartz lintel over it, an entry hall in
const frontZ = Z - 1;
let door = null;
for (let x = 0; x < X; x++) if (inF(x, frontZ) && (!door || G(x, frontZ) < G(door, frontZ) || (G(x, frontZ) === G(door, frontZ) && Math.abs(x - 9) < Math.abs(door - 9)))) door = x;
const dg = G(door, frontZ);
spec.set(key(door, dg, frontZ), { block: "dark_oak_door", state: { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" } });
spec.set(key(door, dg + 1, frontZ), { block: "dark_oak_door", state: { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" } });
spec.set(key(door, dg + 2, frontZ), { block: "quartz_block" });
spec.delete(key(door, dg, frontZ - 1));
spec.delete(key(door, dg + 1, frontZ - 1));
// roof plant: 3 x 2 stone-brick units on the top tier, set on the membrane (only where the tier and its neighbours stand)
let units = 0;
for (let x = 1; x < X - 3 && units < 2; x++) for (let z = 1; z < Z - 2 && units < 2; z++) {
  const ok = [];
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 2; dz++) ok.push([x + dx, z + dz]);
  if (!ok.every(([a, c]) => inF(a, c) && T(a, c) === 10 && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([p, q]) => inF(a + p, c + q) && T(a + p, c + q) === 10))) continue;
  for (const [a, c] of ok) spec.set(key(a, 10, c), { block: "stone_bricks" });
  units++; x += 3;
}

// glass panes connect to the solid or glazed cell beside them
const solidAt = (x, y, z) => { const s = spec.get(key(x, y, z)); return s && (s.block !== "lantern"); };
for (const p of panes) {
  if (spec.get(key(p.x, p.y, p.z))?.block !== "glass_pane") continue;   // the door and its lintel keep their own blocks
  const c = (dx, dz) => (solidAt(p.x + dx, p.y, p.z + dz) ? "true" : "false");
  spec.set(key(p.x, p.y, p.z), { block: "glass_pane", state: { north: c(0, -1), east: c(1, 0), south: c(0, 1), west: c(-1, 0), waterlogged: "false" } });
}

const g = new Voxels([X, Y, Z]);
for (const [k, s] of spec) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, s.block, s.state);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439749.nbt";
const r = g.save(out);
console.log(`way_269439749: ${r.blocks} blocks, ${r.palette} palette entries, ${panes.length} panes, ${bay} lanterns, ${units} roof units`);
