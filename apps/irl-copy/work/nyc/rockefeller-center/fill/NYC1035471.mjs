// 477 Madison Avenue, 1954 commercial and office building: a mid-century slab on a two-storey limestone base, rising
// in clean setback tiers (about 3-block storeys) to an 81-block roof. Footprint 41 x 27 (x across the front, low z is
// the street-facing side and carries the entrance). Lidar roof per cell is median-smoothed over 3 x 3 and snapped to
// the nearest tier, so the massing reads as flat stepped tiers instead of lidar noise. Every cell is a solid column
// from y 0 (or its ground) up to its tier, so nothing floats: each storey and setback stands on the one below.
// Facades: pale limestone (smooth quartz) storey bands and piers, light-blue glass panes in iron-block mullion bays,
// light-grey spandrels, a dark-glass shopfront at ground level. Glass sits in the face layer with an air gap behind it
// and a solid floor slab on each storey line (no interiors). Warm glowstone sits behind some panes. Parapets on each
// roof edge, a plant room on the mid tier, and a lit canopy over the entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035471.cells.json`, "utf8"));
const X = 41, Y = 88, Z = 27;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);

// Median of the in-footprint lidar values in the 5 x 5 window (a wide window, so the tier edges are clean rather than
// flickering between neighbouring tiers), then snapped to the nearest storey-multiple tier.
const TIERS = [3, 33, 45, 57, 69, 81];
const median = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const snap = (h) => TIERS.reduce((best, t) => (Math.abs(t - h) < Math.abs(best - h) ? t : best));
const tierOf = new Map();
for (const [x, z] of cell.keys().map((k) => k.split(",").map(Number))) {
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFoot(x + dx, z + dz)) near.push(lidar(x + dx, z + dz));
  tierOf.set(`${x},${z}`, snap(median(near)));
}
const roofAt = (x, z) => (inFoot(x, z) ? tierOf.get(`${x},${z}`) : 0);
const kindOf = (top) => (top <= 33 ? "base" : "tower");

// The entrance on the street face (low z): the cell nearest x 20 that stands at least two storeys high.
let entX = 20;
for (let d = 0; d <= 20; d++) {
  const cand = [20 - d, 20 + d].find((x) => inFoot(x, 0) && roofAt(x, 0) >= 9);
  if (cand !== undefined) { entX = cand; break; }
}

// Outward faces: N = low z (street), S = high z, W/E = the side walls. [dx, dz] points out of the building.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const PIER = { facing: "north", waterlogged: "false" };
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

const open = (x, y, z) => roofAt(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
const edgeAt = (x, z, top) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => roofAt(x + dx, z + dz) < top);

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);

// 1. Solid mass: foundation from y 0 up to each cell's ground, the core to its tier, a limestone cover on each top.
for (const [x, z] of cols) {
  const { ground } = cell.get(`${x},${z}`), top = roofAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  for (let y = ground; y < top; y++) g.set(x, y, z, y === top - 1 ? "smooth_quartz" : "light_gray_concrete");
}

// 2. Faces. Base course at y 0, a limestone storey band on every storey line (y 3, 6, ...), the two base storeys
// (y 1-2) a dark-glass shopfront between quartz piers, and on the tower iron-block mullions in every third column with
// light-blue glass between and light-grey spandrels at the storey lines' neighbours. Lit panes set after the faces.
const recesses = [];
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  for (let y = 0; y < top; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                       // position along the face
    const ix = x - dx, iz = z - dz;                   // one block in, behind the face
    const k = kindOf(top);
    if (y === top - 1) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y <= 2 && k === "base") {                     // shopfront: dark glass between quartz piers
      if (u % 3 === 0) g.set(x, y, z, "smooth_quartz");
      else g.set(x, y, z, "black_stained_glass_pane", dx === 0 ? NS : EW);
      continue;
    }
    if (y % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }             // storey band
    if (u % 3 === 0) { g.set(x, y, z, "iron_block"); continue; }                  // mullion
    if (y % 3 === 2 && k === "tower") { g.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel under the sill
    g.set(x, y, z, "light_blue_stained_glass_pane", dx === 0 ? NS : EW);
    // Air one block behind a pane: a recess, not a hole through a solid wall.
    const deep = inFoot(ix, iz) && roofAt(ix, iz) > y && !faceOf(ix, y, iz);
    if (deep) recesses.push([ix, y, iz, lit(u, y, d === "N" ? 1 : d === "S" ? 2 : 3)]);
  }
}
for (const [x, y, z, warm] of recesses) g.set(x, y, z, warm ? "glowstone" : "air");

// 3. Entrance on the street face: a double iron door under a flat canopy, a vestibule behind it, and two hanging
// lanterns. The canopy sits on the storey band below it and on the solid wall behind it, so it does not float.
g.set(entX, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(entX, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(entX + 1, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(entX + 1, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [entX, entX + 1]) for (const y of [1, 2]) g.set(x, y, 1, "air");
for (let x = entX - 1; x <= entX + 2; x++) { g.set(x, 4, 0, "black_concrete"); g.set(x, 4, 1, "smooth_quartz"); }
for (const x of [entX, entX + 1]) g.set(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Parapets: a half slab on the edge of each roof, standing on the cover below it.
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  if (edgeAt(x, z, top)) g.set(x, top, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Roof equipment: a plant room on the 57-block tier (a 3-block box, the top course smooth stone), sited where a 5 x 3
// patch of that tier lies fully inside the footprint, nearest its centre. It stands on the tier's cover. Lanterns on
// the tower roof's edge, each on a cover.
const onTier = (x, z, t) => inFoot(x, z) && roofAt(x, z) === t;
let plantAt = null;
for (const [x, z] of cols) {
  const patch = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -2; dx <= 2; dx++) patch.push([x + dx, z + dz]);
  if (!patch.every(([px, pz]) => onTier(px, pz, 57))) continue;
  const d = Math.abs(x - 20) + Math.abs(z - 13);
  if (!plantAt || d < plantAt.d) plantAt = { x, z, d };
}
const plant = plantAt ? [-2, -1, 0, 1, 2].flatMap((dx) => [-1, 0, 1].map((dz) => [plantAt.x + dx, plantAt.z + dz])) : [];
for (const [x, z] of plant) for (let y = 57; y < 60; y++) g.set(x, y, z, y === 59 ? "smooth_stone" : "light_gray_concrete");
for (const [x, z] of [[20, 10], [21, 14]]) if (roofAt(x, z) > 3) g.set(x, roofAt(x, z), z, "lantern", { hanging: "false", waterlogged: "false" });

// Lidar check (not used for the massing): how far the tiers sit from the measured roof, on the cells that have one.
let dev = 0, n = 0, maxTop = 0;
for (const [x, z, , roof] of cells) if (roof > 0) { dev += Math.abs(roofAt(x, z) - roof); n++; }
for (const [x, z] of cols) maxTop = Math.max(maxTop, roofAt(x, z));

const stats = g.save(`${DIR}/NYC1035471.nbt`);
console.log(JSON.stringify({ cells: cols.length, entrance: [entX, 0], plant: plant.length, maxTop, meanRoofDevFromLidar: +(dev / n).toFixed(2), ...stats }));
