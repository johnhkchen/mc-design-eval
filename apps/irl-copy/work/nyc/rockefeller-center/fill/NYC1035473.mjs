// 350 Park Avenue, 1961 commercial office: a Modernist office slab in the Park Avenue manner. Footprint 30 x 54 (x across
// the streets, z along the avenue, so the east face x = 29 is the Park Avenue frontage and carries the lobby). A 102-block
// slab fills the middle of the lot (z 17-37) and steps down north and south in setbacks (66, 56, 50, 41, 29 by the lidar),
// each tier a full column from the ground, so nothing floats. The lidar's dropouts (roof 1) at setback ledges are filled
// from the cell to the north, the roof is median-smoothed and quantised to the tiers. A penthouse of plant sits on the
// slab. Base: a pale stone course at y 0 and a shopfront band at y 1-2. Above it: light grey spandrels at every third
// block, blue-tinted glass panes in the bays and aluminium mullions every third column. Glass sits one block out from an
// air gap, with a floor slab per storey and a solid core behind, so there are no interiors. Some panes show warm glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035473.cells.json`, "utf8"));
const X = 30, Z = 54, Y = 114;

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFoot = (x, z) => cell.has(key(x, z));
const groundOf = (x, z) => cell.get(key(x, z)).ground;

// 1. Roof: fill lidar dropouts (under 5) from the cell to the north, else the south; then a 3 x 3 median; then the tiers.
const raw = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z) || raw.get(key(x, z)) >= 5) continue;
  for (const dz of [-1, 1]) {
    if (inFoot(x, z + dz) && raw.get(key(x, z + dz)) >= 5) { raw.set(key(x, z), raw.get(key(x, z + dz))); break; }
  }
}
const median = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) vals.push(raw.get(key(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  median.set(key(x, z), vals[vals.length >> 1]);
}
const TIERS = [29, 41, 50, 56, 66, 102];
const tier = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) ? t : best));
const PENT = { x0: 9, x1: 18, z0: 24, z1: 31, top: 106 };          // plant room on the slab
const TOP = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = tier(median.get(key(x, z)));
  const pent = t === 102 && x >= PENT.x0 && x <= PENT.x1 && z >= PENT.z0 && z <= PENT.z1;
  TOP.set(key(x, z), pent ? PENT.top : t);
}
const topOf = (x, z) => TOP.get(key(x, z));
const solid = (x, y, z) => inFoot(x, z) && y < topOf(x, z);   // foundation and building both solid; outside the footprint is open

// Two-block facade rules: which face a shell cell shows, and the pane orientation that matches it.
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // on a face along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // on a face along z
const GLASS = "light_blue_stained_glass_pane", SHOP = "glass_pane", FRAME = "iron_block";
const lit = (x, y, z) => (x * 7 + y * 5 + z * 3) % 5 === 0;    // about one pane in five warm, deterministic
const DOOR_Z = [29, 30];

const g = new Voxels([X, Y, Z]);
const cols = cells.map(([x, z]) => [x, z]);

// 2. Foundation: solid from y 0 up to each cell's ground, so the slope is held up from below.
for (const [x, z] of cols) for (let y = 0; y < groundOf(x, z); y++) g.set(x, y, z, "stone_bricks");

// 3. Building, one level at a time: a cell is building at y when it is above its ground and below its tier's top. Its
// depth is the distance in from the nearest open side at that level: 0 = facade, 1 = the air gap (floor slabs at every
// storey line), 2 and more = solid core. Each tier is its own column, so every storey stands on the one below it.
for (let y = 0; y < Y; y++) {
  const B = new Set(cols.filter(([x, z]) => y >= groundOf(x, z) && solid(x, y, z)).map(([x, z]) => key(x, z)));
  if (!B.size) continue;
  const depth = new Map(), face = new Map(), q = [];
  for (const k of B) {
    const [x, z] = k.split(",").map(Number);
    const open = FACES.find(([, dx, dz]) => !solid(x + dx, y, z + dz));
    if (open) { depth.set(k, 0); face.set(k, open[0]); q.push(k); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i].split(",").map(Number), d = depth.get(q[i]);
    for (const [, dx, dz] of FACES) {
      const nk = key(x + dx, z + dz);
      if (B.has(nk) && !depth.has(nk)) { depth.set(nk, d + 1); q.push(nk); }
    }
  }
  for (const k of B) {
    const [x, z] = k.split(",").map(Number), T = topOf(x, z), d = depth.get(k) ?? 9, pent = T === PENT.top;
    if (y === T - 1) { g.set(x, y, z, d === 0 ? "smooth_quartz" : "light_gray_concrete"); continue; }   // coping and roof
    if (d >= 2) { g.set(x, y, z, "light_gray_concrete"); continue; }                                    // solid core
    if (d === 1) {                                                                                       // air gap + floors
      if (y % 3 === 0) g.set(x, y, z, "light_gray_concrete");
      else if (lit(x, y, z)) g.set(x, y, z, "glowstone");
      continue;
    }
    const f = face.get(k), u = f === "N" || f === "S" ? x : z;
    const pane = f === "N" || f === "S" ? PANE_NS : PANE_EW;
    if (pent) { g.set(x, y, z, y === T - 2 ? "smooth_quartz" : y === T - 3 ? "gray_concrete" : "light_gray_concrete"); continue; }
    if (y === T - 2) { g.set(x, y, z, "smooth_quartz"); continue; }                                     // cornice
    if (y === 0) { g.set(x, y, z, "smooth_quartz"); continue; }                                         // base course
    if (y < 3) { if (u % 3 === 0) g.set(x, y, z, FRAME); else g.set(x, y, z, SHOP, pane); continue; }  // clear shopfront
    if (y % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }                              // spandrel
    if (u % 3 === 0) { g.set(x, y, z, FRAME); continue; }                                             // mullion
    g.set(x, y, z, GLASS, pane);
  }
}

// 4. Entrance on the Park Avenue face: a pair of doors in the shopfront, a lintel band above them, and a canopy plate at
// the storey line over the bay.
for (let z = 27; z <= 31; z++) { g.set(29, 3, z, "smooth_quartz"); g.set(28, 3, z, "smooth_quartz"); }
for (const z of DOOR_Z) {
  const hinge = z === 29 ? "left" : "right";
  const door = { facing: "east", hinge, open: "false", powered: "false" };
  g.set(29, 1, z, "iron_door", { ...door, half: "lower" });
  g.set(29, 2, z, "iron_door", { ...door, half: "upper" });
}

for (const z of [28, 31]) g.set(28, 1, z, "glowstone");   // lobby lamps behind the shopfront glass

console.log("blocks", g.count(), "palette", g.palette.length - 1);
g.save(`${DIR}/NYC1035473.nbt`);
