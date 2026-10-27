// Q Central Apartments, Mt Eden, Auckland. Read from the lidar record: a six-storey concrete-frame apartment block
// from the late 20th century (white render and precast concrete, grey aluminium frames, glass, a stone base).
// Massing follows the lidar roof per cell as three flat tiers: the tower (roof ~27), a west wing (~24) and a few
// low podium cells at the edges. Storey lines run down from each tier's roof slab in steps of 4, so the whole tier
// shares one set of floor lines and the downhill side simply has more storeys. A solid plinth (0-3 blocks) carries
// each cell from its ground up to the lowest storey line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const SIZE = [44, 40, 27];
const cells = JSON.parse(readFileSync(`${DIR}/way_162814447.cells.json`, "utf8"));
const g = new Voxels(SIZE);

const key = (x, z) => `${x},${z}`;
const inBox = (x, z) => x >= 0 && z >= 0 && x < SIZE[0] && z < SIZE[2];
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const NAME = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };

// Roof slab row of each tier (the roof surface is one above it): the tower at 27, the wing at 23, the podium at 11.
const tierS = (roof) => (roof >= 25 ? 26 : roof >= 19 ? 22 : roof >= 8 ? 10 : 6);

// Lidar noise: single cells one tier off their neighbours would grow into thin poles, so each cell takes the most
// common tier among itself and its footprint neighbours (two passes; a tie keeps the cell's own tier).
let tier = new Map(cells.map(([x, z, , R]) => [key(x, z), tierS(R)]));
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [k, s] of tier) {
    const [x, z] = k.split(",").map(Number);
    const votes = new Map([[s, 1]]);
    for (const [dx, dz] of DIRS) {
      const t = tier.get(key(x + dx, z + dz));
      if (t !== undefined) votes.set(t, (votes.get(t) ?? 0) + 1);
    }
    const best = Math.max(...votes.values());
    const modes = [...votes].filter(([, v]) => v === best).map(([t]) => t);
    next.set(k, modes.includes(s) ? s : Math.min(...modes));
  }
  tier = next;
}

const C = new Map();
for (const [x, z, G] of cells) {
  const S = Math.max(tier.get(key(x, z)), G + 4);  // roof slab row, at least one storey above this cell's ground
  const n = Math.floor((S - G) / 4);               // storeys; floor lines step down from S
  C.set(key(x, z), { x, z, G, S, n, F0: S - 4 * n });
}

// Exterior faces: a side open to the outside, else a side against a lower tier (a setback). Perimeter cells get
// full-height walls; interior cells are only floor slabs and the roof, so the air between them is the apartments.
for (const c of C.values()) {
  const out = DIRS.find(([dx, dz]) => !C.has(key(c.x + dx, c.z + dz)));
  const low = DIRS.find(([dx, dz]) => { const nb = C.get(key(c.x + dx, c.z + dz)); return nb && nb.S < c.S; });
  const taller = DIRS.some(([dx, dz]) => { const nb = C.get(key(c.x + dx, c.z + dz)); return nb && nb.S > c.S; });
  const d = out ?? low ?? null;
  c.face = d ? { dx: d[0], dz: d[1] } : null;
  c.outside = !!out;
  c.perim = !!(out || low || taller);
}

// Kind of a volume cell: solid plinth, a floor slab, a wall (perimeter), or air. Used for support and air-behind checks.
function kindAt(x, y, z) {
  const c = C.get(key(x, z));
  if (!c) return "out";
  if (y < c.F0) return "solid";
  if (c.perim) return y <= c.S + 1 ? "wall" : "air";
  return y <= c.S && (y - c.F0) % 4 === 0 ? "floor" : "air";
}

// The entrance: an outside-facing pair of cells at the lowest ground, on a storey line that meets the street (plinth 0).
let ent = null;
for (const c of C.values()) {
  if (!c.perim || !c.face || !c.outside) continue;
  const { dx, dz } = c.face;
  const [tx, tz] = dz !== 0 ? [1, 0] : [0, 1];
  const p = C.get(key(c.x + tx, c.z + tz));
  if (!p || !p.perim || !p.outside || p.face.dx !== dx || p.face.dz !== dz) continue;
  if (!inBox(c.x + dx, c.z + dz) || !inBox(p.x + dx, p.z + dz)) continue;   // the canopy needs room outside
  const score = (c.F0 - c.G) + (p.F0 - p.G) + 0.1 * (c.G + p.G);
  if (!ent || score < ent.score) ent = { score, a: c, b: p, dx, dz, tx, tz };
}
const entKeys = new Map(ent ? [[key(ent.a.x, ent.a.z), "lower"], [key(ent.b.x, ent.b.z), "upper"]] : []);

// One facade block. Piers and frames fix the bay rhythm; glass bays have air behind them; the ground storey is a
// glazed lobby with the entrance.
function facade(c, y) {
  if (y === c.S + 1) return put(c.x, y, c.z, "stone_bricks");                      // parapet cap
  if (y === c.S) return put(c.x, y, c.z, "smooth_stone");                          // cornice at the roof slab
  const rel = y - c.F0;
  if (rel % 4 === 0) return put(c.x, y, c.z, rel === 0 ? "stone_bricks" : "smooth_stone");   // storey line / base course
  const s = Math.floor(rel / 4), row = rel % 4;                                     // row is 1..3 within a storey
  if (s === 0 && entKeys.has(key(c.x, c.z))) {
    if (row === 3) return put(c.x, y, c.z, "stone_bricks");                        // entrance lintel
    const isA = entKeys.get(key(c.x, c.z)) === "lower";
    const facing = NAME[`${ent.dx},${ent.dz}`];
    return put(c.x, y, c.z, "iron_door", {
      facing, half: row === 1 ? "lower" : "upper", hinge: isA ? "left" : "right", open: "false", powered: "false",
    });
  }
  if (!c.face) return put(c.x, y, c.z, "white_concrete");
  const bay = c.face.dz !== 0 ? c.x : c.z;
  const m = ((bay % 4) + 4) % 4;
  if (m === 0) return put(c.x, y, c.z, "white_concrete");                            // pier
  if (m === 3) return put(c.x, y, c.z, "gray_concrete");                            // window frame
  if (row === 3 && s > 0) return put(c.x, y, c.z, "white_concrete");                 // spandrel above each window
  const bc = C.get(key(c.x - c.face.dx, c.z - c.face.dz));                          // the room behind the glass
  if (!bc || kindAt(bc.x, y, bc.z) !== "air") return put(c.x, y, c.z, "white_concrete");
  const st = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  for (const k of c.face.dz !== 0 ? ["east", "west"] : ["north", "south"]) st[k] = "true";
  const h = (c.x * 7 + c.z * 13 + s * 5) % 17;
  put(c.x, y, c.z, (c.x + c.z + s) % 5 === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", st);
  if (row === 1 && (h === 0 || h === 5)) {                                          // a warm light behind some panes
    const supported = ["solid", "floor", "wall"].includes(kindAt(bc.x, y - 1, bc.z));
    if (supported) put(bc.x, y, bc.z, h === 0 ? "glowstone" : "lantern", h === 0 ? undefined : { hanging: "false" });
  }
}

for (const c of C.values()) {
  for (let y = 0; y <= c.S + 1; y++) {
    if (y < c.F0) put(c.x, y, c.z, "stone_bricks");                                 // solid plinth up from the ground
    else if (c.perim) facade(c, y);
    else if (y <= c.S && (y - c.F0) % 4 === 0) put(c.x, y, c.z, y === c.S ? "gray_concrete" : "smooth_stone");
  }
}

// Canopy over the entrance: projects one block out from the wall, with a hanging lantern at its outer edge.
if (ent) {
  const { a, dx, dz, tx, tz } = ent;
  const y = a.F0 + 3;
  for (let k = -1; k <= 2; k++) {
    const x = a.x + dx + tx * k, z = a.z + dz + tz * k;
    if (inBox(x, z) && !C.has(key(x, z))) put(x, y, z, "stone_bricks");
  }
  const lx = a.x + dx - tx, lz = a.z + dz - tz;
  if (inBox(lx, lz) && !C.has(key(lx, lz))) put(lx, y - 1, lz, "lantern", { hanging: "true" });
}

// Roof plant: a 4 x 3 service box on the tower roof, near the middle of the plan.
const cells0 = [...C.values()];
const cx = cells0.reduce((s, c) => s + c.x, 0) / cells0.length, cz = cells0.reduce((s, c) => s + c.z, 0) / cells0.length;
let plant = null;
for (const c of cells0) {
  if (c.S !== 26) continue;
  let ok = true;
  for (let i = 0; i < 4 && ok; i++) for (let j = 0; j < 3 && ok; j++) {
    const q = C.get(key(c.x + i, c.z + j));
    if (!q || q.S !== 26 || q.perim) ok = false;
  }
  if (!ok) continue;
  const d = (c.x + 1.5 - cx) ** 2 + (c.z + 1 - cz) ** 2;
  if (!plant || d < plant.d) plant = { c, d };
}
if (plant) {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) for (let y = 27; y <= 28; y++) {
    put(plant.c.x + i, y, plant.c.z + j, "light_gray_concrete");
  }
}

const res = g.save(`${DIR}/way_162814447.nbt`);
console.log(JSON.stringify({ cells: C.size, entrance: ent && [ent.a.x, ent.a.z], plant: plant && [plant.c.x, plant.c.z], ...res }));
