// 2 West 46 Street, 1926 commercial and office building: a setback office block of about 60 blocks (about 67 m) on a
// 27 x 26 footprint, built as the Zoning-Resolution stepped mass of the 1920s. Lidar roof heights are snapped to seven
// tiers (24, 28, 34, 40, 47, 56, 60) so the setbacks read as clean terraces; the few lidar gaps (roof 0 or near 0)
// take the average of their valid neighbours. The lower shoulders (below 40) are Indiana-style limestone, the tower
// above is brick with limestone spandrel bands at every storey line. Storeys are 3 blocks: a solid spandrel course at
// y % 3 == 0 (the floor slab), then two rows of windows. Each window is a light-blue glass pane on the face with an
// air pocket behind it (no interiors), and some pockets hold glowstone for warm light. Ground floor: granite base
// course at y 0, clear shopfront glass in y 1-2, and a recessed central entrance on the north (low z) face with a
// double door, a dark marquee and a hanging lantern. Roof: calcite cornice on every exposed edge, a smooth-stone roof
// covering on each terrace, and a small calcite bulkhead with a lantern on the tower top. Everything stands on the
// tier below it: each footprint column is solid from y 0 to its tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034254.cells.json`, "utf8"));
const X = 27, Y = 64, Z = 26;

const raw = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => raw.has(`${x},${z}`);
const TIERS = [24, 28, 34, 40, 47, 56, 60];
const snap = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) ? t : best));

// Clean roof per cell: lidar gaps (roof 5 or less) take the mean of their valid neighbours, then every cell snaps to a tier.
const NEI = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const top = new Map();
for (const [key, { roof }] of raw) {
  const [x, z] = key.split(",").map(Number);
  let r = roof;
  if (r <= 5) {
    const ok = NEI.map(([dx, dz]) => raw.get(`${x + dx},${z + dz}`)?.roof).filter((v) => v > 5);
    r = ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : 24;
  }
  top.set(key, snap(r));
}
const T = (x, z) => (inFoot(x, z) ? top.get(`${x},${z}`) : 0);
const cols = [...raw.keys()].map((k) => k.split(",").map(Number));

// Outward faces: N = low z (the north frontage, the entrance), S = high z, W/E = the side walls.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows
const K = { N: 0, S: 1, W: 2, E: 3 };

// A cell is open at height y when it is outside the footprint or its tier is at or below y.
const open = (x, y, z) => !inFoot(x, z) || T(x, z) <= y;
const faceOf = (x, y, z) => {
  if (y >= T(x, z)) return null;
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};

const g = new Voxels([X, Y, Z]);

// 1. Solid core from y 0 to each tier (foundation and storeys), the roof covering on each terrace top.
for (const [x, z] of cols) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    if (faceOf(x, y, z)) continue;   // faces are set below
    g.set(x, y, z, y === t - 1 ? "smooth_stone" : "stone");
  }
}

// 2. Faces: base course, shopfront, spandrels, piers and windows. Windows are set on interior cells only, so the air
// pocket behind each pane is never on the outside of the building.
const LAST = { N: X - 1, S: X - 1, W: Z - 1, E: Z - 1 };
for (const [x, z] of cols) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                      // position along the face
    const ix = x - dx, iz = z - dz;                  // one block in, behind the face
    const pane = dx === 0 ? NS : EW;
    const pier = (t < 40 ? "calcite" : "bricks");
    const pierBay = u % 3 === 0 || u === LAST[d];
    if (y === t - 1) { g.set(x, y, z, "calcite"); continue; }                      // cornice
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }                // base course
    if (y < 3) {                                                                  // shopfront storey
      if (pierBay) { g.set(x, y, z, "polished_granite"); continue; }
      g.set(x, y, z, "glass_pane", pane);
      if (open(ix, y, iz) === false && !faceOf(ix, y, iz)) g.set(ix, y, iz, lit(u, y, K[d]) ? "glowstone" : "air");
      continue;
    }
    if (y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                     // floor slab / spandrel course
    const interior = !faceOf(ix, y, iz) && !open(ix, y, iz);
    if (pierBay || !interior) { g.set(x, y, z, pier); continue; }
    g.set(x, y, z, "light_blue_stained_glass_pane", pane);
    g.set(ix, y, iz, lit(u, y, K[d]) ? "glowstone" : "air");
  }
}

// 3. Central entrance on the north face: a recessed lobby (x 12-14, y 1-2, one block in), a double door at x 13, a
// dark granite marquee across the lobby ceiling, and a lantern hanging from it.
for (let x = 12; x <= 14; x++) for (let y = 1; y <= 2; y++) g.set(x, y, 1, "air");
for (let x = 11; x <= 15; x++) { g.set(x, 3, 0, "polished_granite"); g.set(x, 3, 1, "polished_granite"); }
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(13, 1, 0, "dark_oak_door", { ...door, half: "lower" });
g.set(13, 2, 0, "dark_oak_door", { ...door, half: "upper" });
g.set(13, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
g.set(12, 1, 0, "polished_granite"); g.set(14, 1, 0, "polished_granite");

// 4. Tower roof: a calcite bulkhead with a stone cap on the tower top (tier 60), and a lantern on it.
for (let x = 12; x <= 14; x++) for (let z = 11; z <= 13; z++) {
  g.set(x, 60, z, "calcite"); g.set(x, 61, z, "smooth_stone");
}
g.set(13, 62, 12, "lantern", { hanging: "false", waterlogged: "false" });

g.save(`${DIR}/NYC1034254.nbt`);
console.log("NYC1034254.nbt", g.count(), "blocks", g.palette.length, "palette entries");
