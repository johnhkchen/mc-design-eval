// 3 West 51 Street, 1933 commercial and office building: a 15-storey limestone Art Deco office block on a granite base,
// about 46 blocks (51 m) to its roof. Footprint 13 x 27 (x across the front, low z = north = the 51st Street frontage).
// Massing: the lidar roof is median-smoothed over its 3x3 neighbourhood (lidar gaps and single-cell spikes drop out)
// and quantised to setback tiers at 6, 15, 24, 33, 42 and 46 blocks, every one a storey line, so each tier stands on
// the solid column below it. Articulation: a granite plinth and shopfront band at the base, then cream limestone piers
// on every third column with clear glass bays between, dark-grey spandrel bands at each storey line, a calcite cornice
// on every roof edge and a stone-brick parapet. The middle of the 42 tier carries a stepped penthouse with a copper cap
// and a lantern, and two plant boxes sit on the 33 tier. Glass sits one block out from a solid core with an air gap
// behind it (no interiors); warm glowstone sits behind some panes. The street entrance is a double door under a black
// marquee band with two hanging lanterns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034515.cells.json`, "utf8"));
const X = 13, Y = 58, Z = 27;

const lidarAt = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, roof]));
const inFoot = (x, z) => lidarAt.has(`${x},${z}`);

// Lidar roof, median of the in-footprint 3x3 (zeros are gaps, not roofs), then quantised to setback tiers.
const smooth = (x, z) => {
  const vs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = lidarAt.get(`${x + dx},${z + dz}`);
    if (r > 0) vs.push(r);
  }
  vs.sort((a, b) => a - b);
  return vs.length ? vs[Math.floor(vs.length / 2)] : 0;
};
// The top tier is 42: the penthouse on it brings the roof to about 46 (a 46 tier left two stray posts on the east edge).
const tierOf = (v) => (v <= 10 ? 6 : v <= 19 ? 15 : v <= 27 ? 24 : v <= 37 ? 33 : 42);
// The east edge column (x 12) reads 46 along its whole length: the lidar there picks up the neighbouring tower's wall,
// a one-block blade the building does not have. Its roof follows the column in from it (x 11) instead.
const roofAtCell = (x, z) => (x === 12 ? Math.min(smooth(x, z), smooth(x - 1, z)) : smooth(x, z));
// A tier cell with at most one neighbour at its own height or higher is a one-block post: it steps down to the highest
// neighbour below it. Two passes, so a stair of single cells comes down too.
const tierMap = new Map();
for (const [x, z] of cells) tierMap.set(`${x},${z}`, tierOf(roofAtCell(x, z)));
for (let pass = 0; pass < 2; pass++) {
  const next = new Map(tierMap);
  for (const [k, t] of tierMap) {
    const [x, z] = k.split(",").map(Number);
    const nb = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dz]) => tierMap.get(`${x + dx},${z + dz}`)).filter((v) => v !== undefined);
    const lower = nb.filter((v) => v < t);
    if (nb.filter((v) => v >= t).length <= 1 && lower.length) next.set(k, Math.max(...lower));
  }
  tierMap.clear(); for (const [k, v] of next) tierMap.set(k, v);
}
const topOf = (x, z) => tierMap.get(`${x},${z}`) ?? 0;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

const open = (x, y, z) => !inFoot(x, z) || topOf(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
const edgeAt = (x, z, top) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => topOf(x + dx, z + dz) < top);

const cols = cells.map(([x, z]) => [x, z]);
const g = new Voxels([X, Y, Z]);

// 1. Solid mass: the core from y 0 to each tier, the cornice course on top, and a granite plinth at the base.
// Ground is 0 under every cell, so there is no foundation to fill.
for (const [x, z] of cols) {
  const top = topOf(x, z);
  for (let y = 0; y < top; y++) g.set(x, y, z, y === top - 1 ? "calcite" : "stone_bricks");
}

// 2. Faces. Plinth at y 0, the lower storeys in granite piers, the shaft in cream limestone piers on every third
// column, spandrel bands at each storey line, glass bays between the piers.
const recesses = [];
for (const [x, z] of cols) {
  const top = topOf(x, z);
  for (let y = 0; y < top; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;
    const ix = x - dx, iz = z - dz;
    if (y === top - 1) { g.set(x, y, z, "calcite"); continue; }
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }
    if (u % 3 === 0) { g.set(x, y, z, y < 6 ? "polished_granite" : "calcite"); continue; }
    g.set(x, y, z, "glass_pane", dx === 0 ? NS : EW);
    const deep = inFoot(ix, iz) && topOf(ix, iz) > y && !faceOf(ix, y, iz);
    if (deep) recesses.push([ix, y, iz, lit(u, y, d === "N" ? 1 : d === "S" ? 2 : 3)]);
  }
}
for (const [x, y, z, warm] of recesses) g.set(x, y, z, warm ? "glowstone" : "air");

// 3. Street entrance (x 5-6, low z): double bronze-look iron doors, a vestibule behind them, a black marquee band
// over them on the solid wall at z 1, and two hanging lanterns under the marquee.
g.set(5, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(5, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(6, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(6, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [5, 6]) for (const y of [1, 2]) g.set(x, y, 1, "air");
for (let x = 4; x <= 7; x++) { g.set(x, 4, 0, "black_concrete"); g.set(x, 4, 1, "smooth_stone"); }
for (const x of [5, 6]) g.set(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Parapets: a stone-brick half slab on each roof edge, standing on the calcite cornice below it.
for (const [x, z] of cols) {
  const top = topOf(x, z);
  if (top && edgeAt(x, z, top)) g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Roof crown: a 3 x 3 penthouse on the 42 tier, nearest the middle of the roof and wholly on that tier.
// Calcite walls, glass in the middle storey, a solid calcite core (no interior), a copper cap and a lantern.
const onTier = (x0, z0, w, t) => { for (let z = z0; z < z0 + w; z++) for (let x = x0; x < x0 + w; x++) if (topOf(x, z) !== t) return false; return true; };
let best = null;
for (let z = 1; z < Z - 2; z++) for (let x = 1; x < X - 2; x++) {
  if (!onTier(x - 1, z - 1, 3, 42)) continue;
  const d = Math.abs(x - 6) + Math.abs(z - 13);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  const { x: cx, z: cz } = best;
  for (let y = 42; y <= 44; y++) for (let z = cz - 1; z <= cz + 1; z++) for (let x = cx - 1; x <= cx + 1; x++) {
    const edge = x !== cx || z !== cz;
    if (!edge) { g.set(x, y, z, "calcite"); continue; }
    const side = x === cx - 1 || x === cx + 1 ? "x" : "z";
    if (y === 43) g.set(x, y, z, "glass_pane", side === "x" ? EW : NS);
    else g.set(x, y, z, "calcite");
  }
  for (let z = cz - 1; z <= cz + 1; z++) for (let x = cx - 1; x <= cx + 1; x++) g.set(x, 45, z, "waxed_oxidized_copper");
  g.set(cx, 46, cz, "lantern", { hanging: "false", waterlogged: "false" });
}

// 6. Plant boxes on the 33 tier: two 2-block housings side by side, nearest the rear of the building.
let plant = null;
for (let z = 1; z < Z - 1; z++) for (let x = 0; x < X - 1; x++) {
  if (topOf(x, z) !== 33 || topOf(x + 1, z) !== 33) continue;
  const d = Math.abs(z - 19) + Math.abs(x - 4);
  if (!plant || d < plant.d) plant = { x, z, d };
}
if (plant) for (const x of [plant.x, plant.x + 1]) for (const y of [33, 34]) g.set(x, y, plant.z, "light_gray_concrete");

const stats = g.save(`${DIR}/NYC1034515.nbt`);
const tiers = {};
for (const [x, z] of cols) tiers[topOf(x, z)] = (tiers[topOf(x, z)] || 0) + 1;
console.log(JSON.stringify({ cells: cols.length, tiers, penthouse: best ? [best.x, best.z] : null, plant: plant ? [plant.x, plant.z] : null, ...stats }));
