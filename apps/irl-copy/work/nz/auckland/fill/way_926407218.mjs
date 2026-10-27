// Halsey Street, Auckland: a five-storey reinforced-concrete commercial block of the 1960s-70s, the kind that filled the
// CBD edge after the Wynyard and Viaduct warehouses: a volcanic-basalt plinth (Auckland's own stone) on a pale concrete
// frame, ribbon glazing in tinted panes between white piers, grey spandrels, a stone parapet and a flat roof with a
// plant box. The lidar roof is 20 blocks over the lowest ground for almost the whole footprint, so the massing is one
// five-storey block; the few low edge cells are snapped to 4/8/12/16-block wings (3x3 majority, so no lone spikes).
// Storeys are 4 blocks from y 0: slab (y%4=0), two window rows, a spandrel. Foundations are basalt up to each cell's
// ground. Hollow: a cell is shell if a side faces air at that layer; everything else inside is air except the floor
// slabs (y%4=0) and the roof deck. Entrance: the longest street face, a dark oak door in a shopfront bay with a canopy.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_926407218.cells.json`, "utf8"));   // [x, z, ground, roof]
const [X, Y, Z] = [44, 24, 91];
const STOREY = 4;
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];  // E W S N (x+1, x-1, z+1, z-1)
const PANES = ["light_blue", "light_blue", "cyan", "light_blue", "light_blue", "gray"];   // tinted glazing in some bays

const k2 = (x, z) => `${x},${z}`;
const ground = new Map(), raw = new Map();
for (const [x, z, g, r] of cells) { ground.set(k2(x, z), g); raw.set(k2(x, z), r); }
const inF = (x, z) => ground.has(k2(x, z));

// tiers: the lidar roof snapped to the storey count it reads, then two 3x3 majority passes for clean flat tiers
const tierOf = (r) => (r >= 18 ? 20 : r >= 14 ? 16 : r >= 10 ? 12 : r >= 6 ? 8 : 4);
let top = new Map([...raw].map(([k, r]) => [k, tierOf(r)]));
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [k, t] of top) {
    const [x, z] = k.split(",").map(Number), votes = new Map();
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const v = top.get(k2(x + a, z + b)); if (v !== undefined) votes.set(v, (votes.get(v) || 0) + 1);
    }
    let best = t, bv = votes.get(t);
    for (const [v, c] of votes) if (c > bv) { best = v; bv = c; }
    next.set(k, best);
  }
  top = next;
}
const topAt = (x, z) => (inF(x, z) ? top.get(k2(x, z)) : 0);
const groundAt = (x, z) => ground.get(k2(x, z));
// the sides of a cell that face air at layer y: outside the footprint, or a neighbour that stands no higher than y
const exposed = (x, z, y) => DIRS.filter(([a, b]) => topAt(x + a, z + b) <= y);
const uOf = (d, x, z) => (d[0] !== 0 ? z : x);                 // position along that face

const cellList = [...top].map(([k, t]) => { const [x, z] = k.split(",").map(Number); return { x, z, t }; });

// the entrance: the street face with the most ground-floor frontage, a door on a window bay near its middle
const faceRun = (d) => cellList.filter((c) => { const e = exposed(c.x, c.z, 1); return e.length === 1 && e[0] === d; });
const street = DIRS.reduce((best, d) => (faceRun(d).length > faceRun(best).length ? d : best));
const run = faceRun(street).sort((p, q) => uOf(street, p.x, p.z) - uOf(street, q.x, q.z));
const mid = uOf(street, run[Math.floor(run.length / 2)].x, run[Math.floor(run.length / 2)].z);
const door = run.filter((c) => uOf(street, c.x, c.z) % 4 === 2)
  .sort((p, q) => Math.abs(uOf(street, p.x, p.z) - mid) - Math.abs(uOf(street, q.x, q.z) - mid))[0] ?? run[0];
const doorU = uOf(street, door.x, door.z);

// the grid: a Map of "x,y,z" to a block, a door half, or a pane (its colour; the connections are set after)
const G = new Map();
const put = (x, y, z, v) => G.set(`${x},${y},${z}`, v);
const B = (b) => ({ b });

for (const { x, z, t } of cellList) {
  const g = groundAt(x, z);
  for (let y = 0; y < t; y++) {
    if (y < g) { put(x, y, z, B("basalt")); continue; }                       // foundation up to the ground
    const ex = exposed(x, z, y);
    if (!ex.length) {
      if (y % STOREY === 0) put(x, y, z, B("light_gray_concrete"));          // floor slab
      else if (y === t - 1) put(x, y, z, B("gray_concrete"));                 // roof deck
      continue;
    }
    const k = Math.floor(y / STOREY), r = y % STOREY, corner = ex.length > 1;
    const d = ex[0], u = uOf(d, x, z);
    if (r === 0) { put(x, y, z, B(k === 0 ? "polished_basalt" : "light_gray_concrete")); continue; }   // base course, band
    if (r === 3) {
      const canopy = k === 0 && d === street && Math.abs(u - doorU) <= 1;   // the entrance canopy over the door bay
      put(x, y, z, B(canopy ? "polished_andesite" : "gray_concrete"));
      continue;
    }
    // r is 1 or 2: the window band
    if (k === 0 && x === door.x && z === door.z && d === street) {
      put(x, y, z, { door: true, b: "dark_oak_door", s: { facing: d[2], half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } });
      continue;
    }
    const pier = corner || u % 4 === 0;
    if (pier) { put(x, y, z, B(k === 0 ? "polished_basalt" : "white_concrete")); continue; }
    put(x, y, z, { pane: PANES[((u >> 2) + k) % PANES.length] });
  }
  // the parapet: the top course of a roof on its outside edge
  if (exposed(x, z, t).length) put(x, t, z, B("smooth_stone"));
}

// warm lights behind some upper windows (glowstone, shroomlight), and a lit lobby behind the entrance
for (const { x, z, t } of cellList) for (let k = 1; k * STOREY < t; k++) {
  const y = k * STOREY + 1;
  const e = G.get(`${x},${y},${z}`);
  if (!e || !e.pane) continue;
  const ex = exposed(x, z, y); if (ex.length !== 1) continue;
  const d = ex[0], u = uOf(d, x, z);
  if (u % 4 !== 2 || ((u >> 2) + k) % 3 !== 0) continue;
  const ix = x - d[0], iz = z - d[1];
  if (inF(ix, iz) && topAt(ix, iz) > y && !exposed(ix, iz, y).length) put(ix, y, iz, B(k % 2 ? "glowstone" : "shroomlight"));
}
{
  const ix = door.x - street[0], iz = door.z - street[1];
  if (inF(ix, iz)) put(ix, 1, iz, B("glowstone"));
}

// the rooftop plant: a 5 x 5 box, two storeys high, on the widest flat run of the main roof
const core = cellList.filter((c) => c.t === 20 && [-2, -1, 0, 1, 2].every((a) => [-2, -1, 0, 1, 2].every((b) => topAt(c.x + a, c.z + b) === 20)));
const cx = core.reduce((s, c) => s + c.x, 0) / core.length, cz = core.reduce((s, c) => s + c.z, 0) / core.length;
const plant = core.reduce((best, c) => (Math.hypot(c.x - cx, c.z - cz) < Math.hypot(best.x - cx, best.z - cz) ? c : best));
for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
  put(plant.x + a, 20, plant.z + b, B("light_gray_concrete"));
  put(plant.x + a, 21, plant.z + b, B("white_concrete"));
  put(plant.x + a, 22, plant.z + b, B("smooth_stone"));
}

// the panes: each joins its neighbours in the plane of the wall (other panes, and solid blocks that are not doors)
const HORIZ = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];
const g = new Voxels([X, Y, Z]);
let panes = 0;
for (const [key, v] of G) {
  const [x, y, z] = key.split(",").map(Number);
  if (x < 0 || x >= X || y < 0 || y >= Y || z < 0 || z >= Z) continue;
  if (v.pane) {
    const s = { waterlogged: "false" };
    for (const [name, a, b] of HORIZ) {
      const n = G.get(`${x + a},${y},${z + b}`);
      s[name] = n && (n.pane || (!n.door && n.b)) ? "true" : "false";
    }
    g.set(x, y, z, `${v.pane}_stained_glass_pane`, s); panes++;
  } else g.set(x, y, z, v.b, v.s);
}

const out = `${DIR}/way_926407218.nbt`;
const r = g.save(out);
console.log(`footprint ${cells.length} cells, tiers ${[...new Set(top.values())].sort((a, b) => a - b)}, street face ${street[2]}, door at (${door.x}, ${door.z}), panes ${panes}, plant at (${plant.x}, ${plant.z})`);
console.log(`saved ${out}: ${r.blocks} blocks, palette ${r.palette}`);
