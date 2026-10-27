// Discovery New Zealand: a late-1980s concrete-frame office block on the city fringe, 7 to 8 storeys (roof 31 blocks above
// its lowest ground, about 26 m), with cream precast spandrels, tinted blue glazing in a 3-block mullion grid, and a dark
// volcanic basalt plinth as the New Zealand stone of its era. The lidar roof is median-smoothed (5x5), quantised to 4-block
// storeys, and every column is at least two storeys above its own plinth. Storey lines sit on multiples of 4, so every
// course lines up across the building. Each column is solid from y 0 up to its plinth (the first storey line at or above its
// ground), so each storey and tier stands on the one below. Interiors are an air gap behind the glass, a floor slab per
// storey, and a roof slab. The ground storey is a shopfront with a double-door entrance under a basalt lintel. The roof has
// a parapet and plant boxes, and warm glowstone sits behind some of the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_259886668.cells.json", "utf8"));

const X = 82, Y = 44, Z = 45;
const SIDES = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// the palette: basalt plinth, cream precast spandrels and pillars, tinted blue glass, grey roof, warm glowstone
const BASE = "polished_basalt", SPANDREL = "smooth_quartz", PILLAR = "quartz_pillar", COPING = "quartz_block";
const GLASS = "cyan_stained_glass", GLASS2 = "light_blue_stained_glass", ROOF = "gray_concrete", CAP = "smooth_quartz_slab";
const PLANT = "light_gray_concrete", LIGHT = "glowstone", DOOR = "dark_oak_door";

const key = (x, z) => `${x},${z}`;
const cell = new Map();                                 // "x,z" -> { g: ground, r: lidar roof above y 0 }
for (const [x, z, g, r] of cells) cell.set(key(x, z), { g, r });
const inF = (x, z) => cell.has(key(x, z));

// 1. The tiers: lidar noise medianed over 5x5 and quantised to 4-block storeys, and never less than two storeys above
// the column's plinth. Each column carries its ground g, its plinth top F0 (the first storey line at or above g) and its roof T.
const col = new Map();
for (const [k, { g, r }] of cell) {
  const [x, z] = k.split(",").map(Number), v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inF(x + dx, z + dz)) v.push(cell.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const F0 = 4 * Math.ceil(g / 4);
  col.set(k, { g, F0, T: Math.max(4 * Math.round(v[v.length >> 1] / 4), F0 + 8) });
}
const topAt = (x, z) => (col.get(key(x, z)) ?? { T: -1 }).T;
const maxT = Math.max(...[...col.values()].map((c) => c.T));

// A block at (x, y, z) shows the sides with no massing beside it, or a lower roof beside it.
const exposed = (x, y, z) => SIDES.filter(([, dx, dz]) => !inF(x + dx, z + dz) || topAt(x + dx, z + dz) < y);
// a roof's edge: a side that drops to the outside or to a lower roof (equal roofs are one terrace, not an edge)
const roofEdge = (x, z, T) => SIDES.some(([, dx, dz]) => !inF(x + dx, z + dz) || topAt(x + dx, z + dz) < T);
// the kind of block a column holds at y: plinth, roof slab, storey slab, wall (on an exposed side), or air (interior)
const kindOf = (x, y, z) => {
  const c = col.get(key(x, z));
  if (y <= c.F0) return "base";
  if (y === c.T) return "roof";
  if (y > c.T) return null;
  if (y % 4 === 0) return "slab";
  return exposed(x, y, z).length ? "wall" : "air";
};
const hash = (...a) => { let h = 2166136261; for (const v of a) h = Math.imul(h ^ v, 16777619); return h >>> 0; };

// 2. The entrance: the street side's lowest ground, a pair of double doors at the middle of that boundary run.
let door = null;
for (const [name, dx, dz] of SIDES) {
  const along = dz !== 0 ? [1, 0] : [0, 1];
  const edge = [];
  for (const [k, c] of col) {
    const [x, z] = k.split(",").map(Number);
    if (inF(x + dx, z + dz)) continue;                                // on the outward boundary
    const pa = [x + along[0], z + along[1]], pk = key(...pa);
    if (!col.has(pk) || inF(pa[0] + dx, pa[1] + dz) || col.get(pk).g !== c.g) continue;   // the partner leaf too
    edge.push({ x, z, g: c.g, a: dz !== 0 ? x : z, pair: pa });
  }
  if (!edge.length) continue;
  const mid = edge.reduce((s, e) => s + e.a, 0) / edge.length;
  edge.sort((p, q) => p.g - q.g || Math.abs(p.a - mid) - Math.abs(q.a - mid));
  if (!door || edge[0].g < door.g) door = { name, dx, dz, along, ...edge[0] };
}

// 3. The massing: plinth, storey slabs, the roof slab, glazed walls with mullions, and a parapet.
const v = new Voxels([X, Y, Z]);
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= c.T + 2 && y < Y; y++) {
    const kind = kindOf(x, y, z);
    if (kind === "base") { v.set(x, y, z, BASE); continue; }
    if (kind === "roof") { v.set(x, y, z, ROOF); continue; }
    if (kind === "slab") { v.set(x, y, z, SPANDREL); continue; }
    if (kind === "wall") {
      const ex = exposed(x, y, z);
      // mullions every third block along the face the block shows (x on a north or south face, z on an east or west one)
      const ns = ex.some(([, , dz]) => dz !== 0), along = ns ? x : z;
      if (along % 3 === 0) { v.set(x, y, z, PILLAR); continue; }
      const shopfront = y <= c.F0 + 3;                 // the ground storey: a shopfront, lit more often
      const lit = shopfront ? hash(x, y, z) % 3 === 0 : hash(x, y, z) % 6 === 1;
      v.set(x, y, z, hash(x, y, z) % 5 === 0 ? GLASS2 : GLASS);
      if (lit) {                                       // glowstone behind the glass, if the cell behind is air
        const [, dx, dz] = ex[0], ix = x - dx, iz = z - dz;
        if (kindOf(ix, y, iz) === "air") v.set(ix, y, iz, LIGHT);
      }
      continue;
    }
    // above the roof: the parapet on the roof's edge (outside the footprint, or beside a lower roof), one wall block and a coping slab
    if (y === c.T + 1 && roofEdge(x, z, c.T)) v.set(x, y, z, COPING);
    if (y === c.T + 2 && roofEdge(x, z, c.T)) v.set(x, y, z, CAP, { type: "bottom", waterlogged: "false" });
  }
}
// roof plant: boxes on the top tiers, set in from their edge
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  if (c.T < maxT - 4 || roofEdge(x, z, c.T)) continue;
  if (x % 5 > 2 || z % 4 === 0) continue;
  v.set(x, c.T + 1, z, PLANT);
  if (x % 5 === 1) v.set(x, c.T + 2, z, PLANT);
}

// 4. The entrance: a pair of dark-oak double doors on the ground, with a basalt lintel over the bay.
if (door) {
  const { name, dx, dz, along, g: gd, x, z, pair } = door;
  const doorState = (half, hinge) => ({ facing: name, half, hinge, open: "false", powered: "false" });
  for (const [i, [px, pz]] of [[x, z], pair].entries()) {
    v.set(px, gd, pz, DOOR, doorState("lower", i === 0 ? "left" : "right"));
    v.set(px, gd + 1, pz, DOOR, doorState("upper", i === 0 ? "left" : "right"));
  }
  for (let t = -1; t <= 2; t++) {
    const lx = x + along[0] * t, lz = z + along[1] * t;
    if (inF(lx, lz)) v.set(lx, gd + 2, lz, BASE);
  }
}

const info = v.save(DIR + "way_259886668.nbt");
console.log(`way_259886668: ${info.blocks} blocks, ${info.palette} palette entries, tiers up to y ${maxT}, door ${door ? door.name : "none"}`);
