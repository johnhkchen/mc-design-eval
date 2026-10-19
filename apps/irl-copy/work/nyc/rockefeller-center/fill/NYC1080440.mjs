// 17 West 54th Street, 1937, NYC individual landmark, a multi-family elevator building. Decided from the record: a
// Moderne apartment block of the late 1930s in buff-and-red brick with pale stone bands and piers, the Art Deco look
// the period gives a Midtown residential block. Footprint 34 x 21 (x across the front, low z = the 54th Street
// frontage). The lidar reads a 13-storey core (40 blocks, about 44 m) near the middle of the lot, 10-storey street and
// rear walls (32), 36-block shoulders on the front and west side, and lower 28-block wing ends at the west. Those four
// tiers are the massing: the lidar rounded to them, its specks (under 20 blocks) taken from neighbours, then one mode
// pass so single cells do not stand out. Each tier stands on the one below (one solid column per cell from the
// foundation up), so nothing floats. Walls: brick, with a granite plinth and water table, pale stone storey bands
// every 3 blocks, calcite piers every 3rd column, and clear glass in 2-wide bays with an air gap one block behind each
// pane (no interiors). Some windows show a glowstone behind the glass. Front: a double iron door at x 16-17 with a
// vestibule, under a black canopy band with hanging lanterns. Roof: calcite cornice on each tier, stone-brick
// parapets on the edges, and a brick penthouse and a spruce water tank on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1080440.cells.json`, "utf8"));
const X = 34, Y = 46, Z = 21;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const key = (x, z) => `${x},${z}`;
const inFoot = (x, z) => cell.has(key(x, z));
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const around = (x, z) => NB.map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => inFoot(a, b));

// 1. Massing: four stepped roof tiers, the lidar's specks filled from neighbours, then a mode pass (ties keep the cell).
const tierOf = (l) => (l <= 30 ? 28 : l <= 34 ? 32 : l <= 38 ? 36 : 40);
const count = (vals, v) => vals.filter((u) => u === v).length;
const freqPick = (vals) => {
  let best = null;
  for (const v of vals) if (best === null || count(vals, v) > count(vals, best) || (count(vals, v) === count(vals, best) && v > best)) best = v;
  return best;
};
const selfPick = (self, others) => {
  const vals = [self, ...others], best = freqPick(vals);
  return count(vals, self) >= count(vals, best) ? self : best;
};

const base = new Map();
for (const [k, { roof }] of cell) base.set(k, roof >= 20 ? tierOf(roof) : null);
const filled = new Map();
for (const [k, t] of base) {
  if (t !== null) { filled.set(k, t); continue; }
  const [x, z] = k.split(",").map(Number);
  const near = around(x, z).map(([a, b]) => base.get(key(a, b))).filter((v) => v !== null);
  filled.set(k, near.length ? freqPick(near) : 32);
}
const tier = new Map();
for (const [k, t] of filled) {
  const [x, z] = k.split(",").map(Number);
  tier.set(k, selfPick(t, around(x, z).map(([a, b]) => filled.get(key(a, b)))));
}
const roofAt = (x, z) => (inFoot(x, z) ? tier.get(key(x, z)) : 0);
const groundAt = (x, z) => cell.get(key(x, z)).ground;

// Faces: N = low z (the street), S = rear, W/E = the side walls. A face is exposed where the neighbour outward is open.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const SIDE = { N: 1, S: 2, W: 3, E: 4 };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows
const open = (x, y, z) => roofAt(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
const edgeAt = (x, z, top) => NB.some(([dx, dz]) => roofAt(x + dx, z + dz) < top);

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);

// 2. Solid mass: a foundation from y 0 up to each cell's ground, then the core to the tier's roof, with a roof
// covering (gray concrete) on each top.
for (const [x, z] of cols) {
  const ground = groundAt(x, z), top = roofAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  for (let y = ground; y < top; y++) g.set(x, y, z, y === top - 1 ? "gray_concrete" : "bricks");
}

// 3. Facades. Granite plinth and water table, a pale stone band at every storey line (y multiple of 3), calcite piers
// every third column, and two-wide glass bays between them. Each pane has an air gap behind it (a recess), or a glowstone.
const recess = [];
for (const [x, z] of cols) {
  const ground = groundAt(x, z), top = roofAt(x, z);
  for (let y = 0; y < top; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                              // position along the face
    if (y < ground) { g.set(x, y, z, "polished_granite"); continue; }
    if (y === top - 1) { g.set(x, y, z, "calcite"); continue; }           // cornice
    if (y === ground) { g.set(x, y, z, "polished_granite"); continue; }   // water table
    if (y % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }        // storey band
    if (u % 3 === 0) { g.set(x, y, z, "bricks"); continue; }              // brick pier between the stone bands
    g.set(x, y, z, "glass_pane", dx === 0 ? NS : EW);
    const ix = x - dx, iz = z - dz;                                       // one block in, behind the pane
    if (inFoot(ix, iz) && roofAt(ix, iz) > y && !faceOf(ix, y, iz)) recess.push([ix, y, iz, lit(u, y, SIDE[d])]);
  }
}
for (const [x, y, z, warm] of recess) g.set(x, y, z, warm ? "glowstone" : "air");

// 4. Entrance (x 16-17, street front, ground 2): a double iron door with a vestibule behind it (air, one block deep),
// under a black canopy band on the wall at y 4, with two hanging lanterns. The canopy sits on the wall above it.
g.set(16, 2, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(16, 3, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(17, 2, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(17, 3, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [16, 17]) for (const y of [2, 3]) g.set(x, y, 1, "air");
for (let x = 15; x <= 18; x++) g.set(x, 4, 0, "black_concrete");
for (const x of [15, 18]) g.set(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 5. Parapets: a half slab on the edge of each roof tier, standing on the cornice below it (skips the rooftop works).
const rooftop = new Set();
const equip = (x0, x1, z0, z1, top) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (roofAt(x, z) !== top) throw new Error(`rooftop cell ${x},${z} is at ${roofAt(x, z)}, not ${top}`);
    rooftop.add(key(x, z));
  }
};
// Penthouse on the core: a brick box 3 high, capped with calcite. Water tank on the core beside it: spruce, 3 high.
equip(14, 17, 8, 11, 40);
equip(20, 22, 12, 14, 40);
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  if (!rooftop.has(key(x, z)) && edgeAt(x, z, top)) g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 6. Rooftop works (on the 40-block core).
for (let x = 14; x <= 17; x++) for (let z = 8; z <= 11; z++) {
  for (let y = 40; y <= 42; y++) g.set(x, y, z, "bricks");
  g.set(x, 43, z, "calcite");
}
for (const x of [14, 17]) for (let z = 8; z <= 11; z++) g.set(x, 41, z, "glass_pane", EW);
for (let x = 20; x <= 22; x++) for (let z = 12; z <= 14; z++) {
  for (let y = 40; y <= 42; y++) g.set(x, y, z, "spruce_planks");
  g.set(x, 43, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

// 7. Stats: the tier map, the lidar's deviation from it (on cells that have a roof), and the saved structure.
let dev = 0, n = 0;
for (const [x, z, , roof] of cells) if (roof > 0) { dev += Math.abs(roofAt(x, z) - roof); n++; }
const stats = g.save(`${DIR}/NYC1080440.nbt`);
console.log(JSON.stringify({ cells: cols.length, roofMax: Math.max(...cols.map(([x, z]) => roofAt(x, z))), meanRoofDevFromLidar: +(dev / n).toFixed(2), ...stats }));
