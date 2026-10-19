// 689 Fifth Avenue, 1927 NYC individual landmark, commercial and office building: a stepped limestone-and-brick office
// block of about 20 storeys (66 blocks, about 73 m). Footprint 33 x 20 (x along the streets, z along the avenue; the
// entrance faces the south street side at z 19). Lidar roof heights are quantized into tiers (lobby 4, low wing 36,
// setbacks 42 and 50, shoulder 60, tower 66) and smoothed by a 3 x 3 majority so noise becomes flat terraces. A
// 6-block penthouse with a parapet sits on the tower at x 10-15, z 6-7. Every column is solid from y 0 to its roof, so
// nothing floats. Facade: granite base, a 4-block shopfront with a pair of iron doors under a granite lintel, then
// 3-block storeys with sandstone floor bands, sandstone piers every third bay and glass panes with air behind them.
// Sparse glowstone sits behind some panes. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035741.cells.json`, "utf8"));
const X = 33, Y = 78, Z = 20;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Lidar roof -> flat tier. Values under 10 are lobby or canopy roofs, not open ground.
const tier = (r) => (r < 10 ? 4 : r < 40 ? 36 : r < 46 ? 42 : r < 56 ? 50 : r < 63 ? 60 : 66);
const raw = (x, z) => tier(cell.get(`${x},${z}`).roof);

// 3 x 3 majority over footprint cells; a cell keeps its own tier unless a tier clearly outvotes it.
const top = new Map();
for (const [key] of cell) {
  const [x, z] = key.split(",").map(Number);
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!inFoot(x + dx, z + dz)) continue;
    const t = raw(x + dx, z + dz); votes.set(t, (votes.get(t) || 0) + 1);
  }
  const own = raw(x, z);
  let best = own, n = votes.get(own) || 0;
  for (const [t, c] of votes) if (c > n) { best = t; n = c; }
  top.set(key, best);
}
// Penthouse on the tower's north-west shoulder: 6 more blocks over the 66 band.
for (let z = 6; z <= 7; z++) for (let x = 10; x <= 15; x++) if (top.get(`${x},${z}`) === 66) top.set(`${x},${z}`, 72);

const H = (x, z) => (inFoot(x, z) ? top.get(`${x},${z}`) : 0);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// A side is exposed at height y when the cell beside it is outside the footprint or its roof is at or below y.
const exposed = (x, y, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return H(x + dx, z + dz) <= y; });
const lowerNeighbour = (x, z, h) => Object.values(DIRS).some(([dx, dz]) => H(x + dx, z + dz) < h);

const glass = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }   // pane on a face along x
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }); // pane on a face along z
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 13 === 0;   // sparse, deterministic warm windows

const DOOR_X = [8, 9], DOOR_Z = 19;          // entrance on the south street face
const g = new Voxels([X, Y, Z]);
const windows = [];                          // [x, y, z, d] for each glass pane, to back with air or light

for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  const h = H(x, z), { ground } = cell.get(key);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");
  for (let y = ground; y < h; y++) {
    const sides = exposed(x, y, z);
    if (!sides.length) {
      // Roof surface and core. Roof edges that drop to a lower tier get a granite coping.
      g.set(x, y, z, y === h - 1 ? (lowerNeighbour(x, z, h) ? "polished_granite" : "smooth_stone") : "stone");
      continue;
    }
    // Facade. Corners and every third bay along a face are sandstone piers.
    const corner = sides.length > 1;
    const d = sides[0];
    const along = d === "N" || d === "S" ? x : z;
    const pier = corner || along % 3 === 0;
    if (y === 0 || y === h - 1 || y === 4) { g.set(x, y, z, "polished_granite"); continue; }
    if (y <= 3) {
      if (d === "S" && z === DOOR_Z && DOOR_X.includes(x)) {
        if (y === 3) { g.set(x, y, z, "polished_granite"); continue; }   // lintel over the doors
        g.set(x, y, z, "iron_door", {
          facing: "south", half: y === 1 ? "lower" : "upper", hinge: x === DOOR_X[0] ? "right" : "left",
          open: "false", powered: "false",
        });
        continue;
      }
      if (pier) { g.set(x, y, z, "polished_granite"); continue; }
      g.set(x, y, z, "glass_pane", glass(d)); windows.push([x, y, z, d]); continue;
    }
    const row = (y - 5) % 3;
    if (row === 0) { g.set(x, y, z, "smooth_sandstone"); continue; }   // storey floor band
    if (pier) { g.set(x, y, z, "smooth_sandstone"); continue; }
    g.set(x, y, z, "glass_pane", glass(d)); windows.push([x, y, z, d]);
  }
}

// Air behind each pane (the core cell one step inward), or a warm light in some of them. Only where the inward cell is
// plain core: a thin wing with no core behind it keeps its pane on solid.
for (const [x, y, z, d] of windows) {
  const [dx, dz] = DIRS[d];
  const ix = x - dx, iz = z - dz;
  if (!inFoot(ix, iz) || H(ix, iz) <= y || exposed(ix, y, iz).length) continue;
  g.set(ix, y, iz, lit(x, y, z) ? "glowstone" : "air");
}

const stats = g.save(`${DIR}/NYC1035741.nbt`);
console.log(JSON.stringify({ size: [X, Y, Z], ...stats }));
