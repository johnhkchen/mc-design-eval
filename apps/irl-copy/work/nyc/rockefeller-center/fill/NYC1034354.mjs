// 1190 Avenue of the Americas, a 1920 mixed residential and commercial block. Footprint 22 x 6 (x along the street, low z
// = north = the cross-street front). Brick walls over a granite base, calcite storey lines and cornices, shopfronts on the
// ground storey, window bands above. Massing: a 4-storey body on the west (x 0-14), a 2-storey wing east of it (x 15-20),
// a 5-storey end pier at x 21 that stands above both, and a 3-storey notch in the north front (x 7-10). The light well at
// (14, 3) is open to the sky. Lidar roof is read as clean tiers: the median of each cell and its neighbours, snapped to
// the nearest tier. Glass sits in the facade cell with air behind it and a floor slab per storey (no interiors). Warm
// lanterns and glowstone sit behind some panes. The lobby is in the north front at x 9-11, under a dark awning, with a
// rooftop water tank on the body.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034354.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const X = 22, Y = 29, Z = 6;

// Storey tiers (block heights above y 0): 7 = wing, 9 = notch, 14 = body (4 storeys and a cornice), 17 = end pier.
const TIERS = [7, 9, 14, 17];
const BELTS = [4, 7, 10, 13];                  // storey lines: the floor slab in each storey and the calcite course over each sill
const LIGHT_ROWS = [5, 8, 11, 14];             // the bottom pane of each window band, where a lamp can stand on the floor slab
const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };   // n = low z, the cross-street front; [dx, dz] points out

const raw = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => raw.has(`${x},${z}`);
const lidarRoof = (x, z) => (inFoot(x, z) ? raw.get(`${x},${z}`).roof : 0);
const court = (x, z) => inFoot(x, z) && lidarRoof(x, z) === 0;   // the light well: paved at y 0, no walls

// Median of the cell and its footprint neighbours (lidar noise and the light well left out), but never below the cell's
// own lidar roof: the lidar drops at parapet edges and misses roof corners, not the other way round. Snapped to the
// nearest tier; ties go to the lower tier.
function tierOf(x, z) {
  const vals = [lidarRoof(x, z)];
  for (const [dx, dz] of Object.values(DIRS)) if (inFoot(x + dx, z + dz) && lidarRoof(x + dx, z + dz) > 0) vals.push(lidarRoof(x + dx, z + dz));
  vals.sort((a, b) => a - b);
  const median = vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
  const m = Math.max(median, lidarRoof(x, z));
  return TIERS.reduce((best, t) => (Math.abs(m - t) < Math.abs(m - best) ? t : best));
}
const H = (x, z) => (!inFoot(x, z) ? 0 : court(x, z) ? 1 : tierOf(x, z));
const solid = (x, y, z) => y < H(x, z);
const faces = (x, y, z) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d];
  return !inFoot(x + dx, z + dz) || y >= H(x + dx, z + dz);      // the neighbour is outside, or open at this height
});
const lastZ = (x) => Math.max(...[...Array(Z).keys()].filter((z) => inFoot(x, z)));

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // pane on a face along x
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };

// One exposed wall cell. The entrance (x 9-11, north front) is a granite portal with a door, a hanging lantern and a dark
// awning over it; the rest follows the storey lines, the granite base and lintel, the shopfront or the window bands.
function wall(x, y, z, f, h) {
  const alongX = f.includes("n") || f.includes("s");
  const out = alongX ? f.find((d) => d === "n" || d === "s") : f[0];
  const [ix, iz] = DIRS[out].map((v) => -v);     // inward, toward the building's air
  const lx = x + ix, lz = z + iz;
  const inside = inFoot(lx, lz) && !solid(lx, y, lz);

  if (z === 0 && x >= 9 && x <= 11 && y >= 1 && y <= 4) {
    if (y === 4) return put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    if (y === 3) return x === 10 ? put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }) : put(x, y, z, "polished_granite");
    if (x !== 10) return put(x, y, z, "polished_granite");
    return put(x, y, z, "dark_oak_door", { ...DOOR, half: y === 1 ? "lower" : "upper" });
  }
  if (y === h - 1 || BELTS.includes(y)) return put(x, y, z, "calcite");
  if (y === 0 || y === 3) return put(x, y, z, "polished_granite");   // base course; lintel over the shopfronts
  const pier = alongX ? x % 3 === 0 : z === 0 || z === lastZ(x);     // bays: piers every third block on the street fronts
  if (pier) return put(x, y, z, y < 4 ? "polished_granite" : "bricks");
  if (y < 4) {
    put(x, y, z, "glass");
    if (y === 1 && (x * 5 + z) % 4 === 0 && inside) put(lx, 1, lz, "glowstone");
    return;
  }
  put(x, y, z, "glass_pane", alongX ? PANE_X : PANE_Z);
  if (LIGHT_ROWS.includes(y) && (x * 3 + z * 2) % 5 === 1 && inside) put(lx, y, lz, "lantern", { hanging: "false", waterlogged: "false" });
}

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (court(x, z)) { put(x, 0, z, "smooth_stone"); continue; }
  const h = H(x, z);
  for (let y = 0; y < h; y++) {
    const f = faces(x, y, z);
    if (f.length) wall(x, y, z, f, h);
    else if (y === h - 1) put(x, y, z, "stone");                     // flat roof over the building's air
    else if (y === 0 || BELTS.includes(y)) put(x, y, z, "smooth_stone");   // ground slab and the floor under each storey
  }
}

// Rooftop water tank on the body: a 2 x 2 x 3 timber drum standing on the roof (x 3-4, z 1-2).
for (const x of [3, 4]) for (const z of [1, 2]) for (const y of [14, 15, 16]) put(x, y, z, "spruce_planks");

// Report the massing so the tiers can be checked against the lidar.
for (let z = 0; z < Z; z++) console.log(`z${z} ` + [...Array(X).keys()].map((x) => (inFoot(x, z) ? String(H(x, z)).padStart(3) : "  .")).join(""));
const { blocks, palette } = g.save(`${DIR}/NYC1034354.nbt`);
console.log(`saved NYC1034354.nbt: ${blocks} blocks, ${palette} palette entries`);
