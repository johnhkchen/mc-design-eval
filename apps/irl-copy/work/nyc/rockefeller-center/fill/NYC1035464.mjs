// 320 Park Avenue, a 1994 Midtown commercial office tower for Mutual of America: about 130 blocks (about 145 m) of
// blue-tinted glass curtain wall on a granite podium, 33 x 55 blocks. The lidar roof is median-smoothed and snapped to
// clean setback tiers (21, 30, 40, 46, 61, 92, 118, 130): a granite podium along the north street wall, a stepped
// mid-rise, shoulders at 61 and 92 and a 118/130 slab crown in the middle with a mechanical penthouse on top. Faces:
// a granite base course, shopfront glass at y 1-2, then a bay grid of glass panes with grey mullions every third
// block, and a spandrel at every storey line (granite on the podium, light-grey panels above it). The north entrance
// is clear glass under a granite lintel, on the open forecourt. The shell is hollow: air behind the glass, one floor
// slab per storey and a roof cap per tier (no interiors). Warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035464.cells.json`, "utf8"));
const X = 33, Y = 142, Z = 55;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const raw = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
const built = (x, z) => inFoot(x, z) && raw(x, z) > 1;   // roof 1 is open forecourt, not a building

// Roof tiers: 3x3 median of the lidar (built cells only), snapped to the nearest tier height.
const TIERS = [21, 30, 40, 46, 61, 92, 118, 130];
const snap = (v) => TIERS.reduce((a, t) => (Math.abs(t - v) < Math.abs(a - v) ? t : a));
const medianRoof = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (built(x + dx, z + dz)) v.push(raw(x + dx, z + dz));
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const topOf = new Map();
for (const k of cell.keys()) { const [x, z] = k.split(",").map(Number); if (built(x, z)) topOf.set(k, snap(medianRoof(x, z))); }
const roofAt = (x, z) => topOf.get(`${x},${z}`) ?? 0;          // 0 = nothing built here
const open = (x, y, z) => roofAt(x, z) <= y;                    // outside the footprint, unbuilt, or roof at or below y

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };  // N = low z = uptown, the Park Avenue street wall
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const PODIUM = 46;                                              // tiers at or below this are granite, above is glass
const ENTRY = new Set(["15,0", "16,0"]);                        // the north entrance, two bays wide
const lights = [];

const g = new Voxels([X, Y, Z]);

for (const k of cell.keys()) {
  const [x, z] = k.split(",").map(Number);
  const { ground } = cell.get(k);
  const T = roofAt(x, z);

  // Open forecourt: foundation to the ground, then paving.
  if (!T) {
    for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
    g.set(x, ground, z, "smooth_stone");
    continue;
  }

  // Foundation from y 0 up to the ground, faced in granite where it shows.
  for (let y = 0; y < ground; y++) g.set(x, y, z, faceOf(x, y, z) ? "polished_granite" : "stone_bricks");

  for (let y = ground; y < T; y++) {
    const d = faceOf(x, y, z);
    if (y === T - 1) { g.set(x, y, z, d ? "polished_granite" : "gray_concrete"); continue; }   // cornice or tar roof
    if (!d) { if (y % 3 === 0) g.set(x, y, z, "smooth_stone"); continue; }                   // floor slab, air between
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                                 // position along the face
    const ix = x - dx, iz = z - dz;                             // the cell one block in, behind the face
    if (ENTRY.has(k) && d === "N" && y <= 3) { g.set(x, y, z, y === 3 ? "polished_granite" : y === 0 ? "polished_granite" : "glass"); continue; }
    if (y % 3 === 0) { g.set(x, y, z, T <= PODIUM ? "polished_granite" : "light_gray_concrete"); continue; }   // storey line
    if (y < 3) { g.set(x, y, z, u % 3 === 0 ? "polished_granite" : "light_blue_stained_glass_pane", dx === 0 ? NS : EW); continue; }   // shopfront
    if (u % 3 === 0) { g.set(x, y, z, "gray_concrete"); continue; }                                    // mullion
    g.set(x, y, z, "light_blue_stained_glass_pane", dx === 0 ? NS : EW);
    const side = { N: 1, S: 2, W: 3, E: 4 }[d];
    if (y % 3 === 1 && (u * 5 + y * 7 + side * 3) % 11 === 0 && !faceOf(ix, y, iz)) lights.push([ix, y, iz]);
  }
}

// Warm light behind some panes, in the air gap.
for (const [x, y, z] of lights) g.set(x, y, z, "glowstone");

// Mechanical penthouse on the 130 crown: a ribbed plant box three storeys tall on the roof cap.
for (let x = 12; x <= 20; x++) for (let z = 22; z <= 30; z++) {
  if (roofAt(x, z) !== 130) continue;
  for (let y = 130; y < 133; y++) {
    const edge = x === 12 || x === 20 || z === 22 || z === 30;
    g.set(x, y, z, edge && (x % 3 === 0 || z % 3 === 0) ? "gray_concrete" : "light_gray_concrete");
  }
  g.set(x, 133, z, "polished_granite");
}

const out = g.save(`${DIR}/NYC1035464.nbt`);
console.log(out);
