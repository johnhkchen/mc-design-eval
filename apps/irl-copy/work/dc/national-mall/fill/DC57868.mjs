import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 655 New York Ave NW: a late-20th-century downtown office block, the Metro Center / Federal Triangle sort
// of stock. A polished granite base course, pale precast piers and quartz bands with tinted-blue glazing
// between them, three storey tiers stepping down from a small tower on the lidar roof to 2- and 1-tier wings,
// a plant penthouse on the tower, and a recessed double entrance on the longest street face.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57868.cells.json`, "utf8"));

const W = 62, H = 21, D = 39;
const STOREY = 3;                       // one tier = 3 blocks: base/spandrel, glass, band
const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });

// Lidar roof: 3x3 median (noise out, the tower's 8-9 block core survives), snapped to 3-block tiers.
// Roof 0-1 is a flat plinth of one block.
const TIER = new Map();
for (const [x, z] of cells) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const c = raw.get(key(x + dx, z + dz));
      if (c) vals.push(c.roof);
    }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  TIER.set(key(x, z), med <= 1 ? 1 : med >= 8 ? 3 * STOREY : med >= 5 ? 2 * STOREY : STOREY);
}
// then the majority tier of each 3x3 (ties go up): single-cell steps in the lidar become flat tiers
const FLAT = new Map();
for (const [x, z] of cells) {
  const n = new Map();
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const t = TIER.get(key(x + dx, z + dz));
      if (t !== undefined) n.set(t, (n.get(t) ?? 0) + 1);
    }
  let best = 0, bestN = -1;
  for (const [t, c] of n) if (c > bestN || (c === bestN && t > best)) { best = t; bestN = c; }
  FLAT.set(key(x, z), best);
}
for (const [k, t] of FLAT) TIER.set(k, t);
const tierAt = (x, z) => TIER.get(key(x, z)) ?? 0;

const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];
// a neighbour column fills y only if y is below its own tier, so an open side at height y is an exposed face
const exposed = (x, z, y, d) => !(y < tierAt(x + d.dx, z + d.dz));

// Every block of the building, by "x,y,z" (air is simply absent): built column by column, then carved and
// dressed, then written to the volume. Every column is solid from y 0 up to its tier, so each tier, setback and
// the roof stands on the solid below it.
const B = new Map();
const K = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => B.set(K(x, y, z), { block, state });
const at = (x, y, z) => B.get(K(x, y, z));

for (const [x, z] of cells) {
  const T = tierAt(x, z);
  for (let y = 0; y < T; y++) {
    const sides = DIRS.filter((d) => exposed(x, z, y, d));
    const top = y === T - 1;
    if (!sides.length && !top) { put(x, y, z, "stone"); continue; }          // core, hidden
    if (y === 0) { put(x, y, z, "polished_granite"); continue; }              // base course on the foundation
    if (!sides.length) { put(x, y, z, "stone"); continue; }                   // roof membrane of a lower tier
    const row = y % STOREY;                                                   // 0 spandrel, 1 glass, 2 band
    // a pier (the precast frame) every third cell along each exposed face
    const pier = sides.some((d) => ((d.dz ? x : z) % 3) === 0);
    const block = row === 2 ? "smooth_quartz"
      : row === 1 ? (pier ? "white_concrete" : "light_blue_stained_glass")
      : (pier ? "white_concrete" : "light_gray_concrete");
    put(x, y, z, block);
  }
}

// The main entrance: the street face with the most glazed ground-floor run, its centre pair of bays.
let door = null;
for (const d of DIRS) {
  const along = d.dz ? [1, 0] : [0, 1];
  const pairs = [];
  for (const [x, z] of cells) {
    const u = d.dz ? x : z;
    if (u % 3 !== 1 || tierAt(x, z) < STOREY || !exposed(x, z, 1, d)) continue;
    const nx = x + along[0], nz = z + along[1];
    if (!raw.has(key(nx, nz)) || tierAt(nx, nz) < STOREY || !exposed(nx, nz, 1, d)) continue;
    pairs.push({ x, z, nx, nz, u });
  }
  if (pairs.length && (!door || pairs.length > door.pairs.length)) door = { d, pairs };
}
if (door) {
  const { d, pairs } = door;
  pairs.sort((a, b) => a.u - b.u);
  const p = pairs[Math.floor(pairs.length / 2)];
  const state = (half, hinge) => ({ facing: d.name, half, hinge, open: "false", powered: "false" });
  for (const [x, z, hinge] of [[p.x, p.z, "left"], [p.nx, p.nz, "right"]]) {
    put(x, 1, z, "dark_oak_door", state("lower", hinge));
    put(x, 2, z, "dark_oak_door", state("upper", hinge));
    // a one-bay vestibule behind the doors: air at the doorway height, one lamp inside
    const ix = x - d.dx, iz = z - d.dz;
    for (const y of [1, 2]) if (at(ix, y, iz)?.block === "stone") B.delete(K(ix, y, iz));
  }
  // canopy: a dark stone band over the entrance, the storey-one spandrel row
  const along = d.dz ? [1, 0] : [0, 1];
  for (let i = -1; i <= 2; i++) {
    const cx = p.x + along[0] * i, cz = p.z + along[1] * i;
    if (at(cx, 3, cz)) put(cx, 3, cz, "polished_andesite");
  }
  put(p.x - d.dx, 2, p.z - d.dz, "glowstone");
}

// Warm light behind some glazing: the room behind a glass pane is one air cell (carved), with floor and
// ceiling slabs (the core) above and below it. Lamps in about two windows in seven.
for (const [k, v] of [...B.entries()]) {
  if (v.block !== "light_blue_stained_glass") continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y % STOREY !== 1) continue;
  const d = DIRS.find((d) => exposed(x, z, y, d));
  if (!d) continue;
  const ix = x - d.dx, iz = z - d.dz;
  if (at(ix, y, iz)?.block !== "stone") continue;
  B.delete(K(ix, y, iz));
  const h = (x * 31 + z * 17 + y * 7) % 7;
  if (h === 0) put(ix, y, iz, "glowstone");
  else if (h === 4) put(ix, y, iz, "shroomlight");
}

// Plant penthouse on the tower: the tower cells whose eight neighbours are tower cells too, one tier up.
const T9 = (x, z) => tierAt(x, z) === 3 * STOREY;
const PEN = new Set();
for (const [x, z] of cells) {
  if (!T9(x, z)) continue;
  let inset = true;
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) if (!T9(x + dx, z + dz)) inset = false;
  if (inset) PEN.add(key(x, z));
}
const penEdge = (x, z) => PEN.has(key(x, z)) && DIRS.some((d) => !PEN.has(key(x + d.dx, z + d.dz)));
for (const k of PEN) {
  const [x, z] = k.split(",").map(Number);
  if (penEdge(x, z)) {
    put(x, 9, z, "light_gray_concrete");
    const st = Object.fromEntries(DIRS.map((d) => [d.name, penEdge(x + d.dx, z + d.dz) ? "true" : "false"]));
    put(x, 10, z, "iron_bars", { ...st, waterlogged: "false" });
  } else {
    put(x, 9, z, "stone");
    put(x, 10, z, "stone");
  }
}

const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
console.log(g.save(`${DIR}/DC57868.nbt`));
