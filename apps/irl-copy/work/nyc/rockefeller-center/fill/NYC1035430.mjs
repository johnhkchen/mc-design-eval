// 597 Fifth Avenue, a 1913 commercial and office building (NYC individual and interior landmark), in the Beaux-Arts
// commercial manner of its decade: a granite base with a shopfront, a brick shaft with limestone string courses at
// every storey line (every third block), flush windows in the bays between brick piers, and a calcite parapet. Footprint
// 24 x 15. The lidar roof is smoothed into three clean tiers: a 36-block wing, a 42-block step and the 45-block main
// shaft, each stepping on what is below. Two light courts (lidar sees nothing there) are open to the sky at ground
// level; one-cell lidar holes are filled from their neighbours. A brick-and-glass penthouse sits on the main roof.
// The Fifth Avenue frontage is taken as the +x face: the entrance is there, a granite door surround with a bronze-ish
// dark oak door. Glass sits in the outer layer with air behind it and a floor slab in each storey (no interiors); a
// sparse set of panes has glowstone behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035430.cells.json`, "utf8"));
const X = 24, Y = 57, Z = 15;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidarAt = (x, z) => cell.get(`${x},${z}`).roof;

// A light court: lidar roof 1 with at least three court neighbours. An isolated 1 is a lidar hole, not a court.
const NEIGHBOURS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const court = (x, z) => inFoot(x, z) && lidarAt(x, z) <= 1 &&
  NEIGHBOURS.filter(([dx, dz]) => inFoot(x + dx, z + dz) && lidarAt(x + dx, z + dz) <= 1).length >= 3;
const built = (x, z) => inFoot(x, z) && !court(x, z);

// Smoothed lidar: the median of the built neighbours (lidar holes and noise excluded), then three roof tiers.
const smooth = (x, z) => {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (built(x + dx, z + dz) && lidarAt(x + dx, z + dz) > 1) vals.push(lidarAt(x + dx, z + dz));
  }
  vals.sort((a, b) => a - b);
  return vals[vals.length >> 1];
};
const tierTop = (h) => (h >= 43 ? 45 : h >= 39 ? 42 : 36);     // storey lines at multiples of 3: 45, 42, 36
const topAt = (x, z) => (built(x, z) ? tierTop(smooth(x, z)) : 0);

// Faces: E = +x (the Fifth Avenue frontage), W = -x, N = low z (uptown), S = high z.
const DIRS = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
const ORDER = ["E", "W", "N", "S"];
const open = (x, y, z) => !built(x, z) || topAt(x, z) <= y;     // outside, a court, or the roof is below y
const exposed = (x, y, z) => ORDER.filter((d) => open(x + DIRS[d][0], y, z + DIRS[d][1]));
const paneState = (d) => (DIRS[d][0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }    // pane on a face along z
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });  // pane on a face along x

// Entrance: a 3-block bay on the +x face at z 6-8 (granite pilasters, the door in the middle), ground storey.
const ENTRANCE = (x, y, z, d) => d === "E" && x === 23 && z >= 6 && z <= 8 && (y === 1 || y === 2);
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm panes

const g = new Voxels([X, Y, Z]);
const cols = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (inFoot(x, z)) cols.push([x, z]);

// 1. Solid mass from y 0 to each tier's top, a stone core. Courts get a paved floor at y 0 and nothing above.
for (const [x, z] of cols) {
  if (court(x, z)) { g.set(x, 0, z, "smooth_stone"); continue; }
  const t = topAt(x, z);
  for (let y = 0; y < t; y++) g.set(x, y, z, "stone");
}

// 2. Outer layer. Base course in granite, the ground storey a shopfront (granite piers, glass), a calcite string
// course at every storey line, brick piers with glass in the bays above, a calcite parapet on the top course.
const windows = [];   // [x, y, z, d, face index] for each glass pane on the shell
for (const [x, z] of cols) {
  const t = topAt(x, z);
  if (!t) continue;
  for (let y = 0; y < t; y++) {
    const faces = exposed(x, y, z);
    if (!faces.length) continue;
    const d = faces[0];
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                         // position along the face
    const pier = u % 3 === 0;
    if (ENTRANCE(x, y, z, d)) {
      if (z === 7) g.set(x, y, z, "dark_oak_door", { facing: "east", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "polished_granite");
      continue;
    }
    if (y === 0) { g.set(x, y, z, "granite"); continue; }
    if (y === t - 1) { g.set(x, y, z, "calcite"); continue; }           // parapet cap
    if (y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }           // string course at each storey line
    if (y < 3) {                                                        // shopfront
      if (pier) g.set(x, y, z, "polished_granite");
      else { g.set(x, y, z, "glass_pane", paneState(d)); windows.push([x, y, z, d, faces.length]); }
      continue;
    }
    if (pier) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "glass_pane", paneState(d)); windows.push([x, y, z, d, faces.length]);
  }
}

// 3. Air behind each pane (no interiors): the cell one block in from the glass, unless it is itself on the outer layer.
// The door's lobby is air too. Storey slabs stay solid, so every pane is held above and below.
for (const [x, y, z, d] of windows) {
  const [dx, dz] = DIRS[d];
  const bx = x - dx, bz = z - dz;
  if (!built(bx, bz) || y >= topAt(bx, bz) || exposed(bx, y, bz).length) continue;
  g.set(bx, y, bz, "air");
}
for (const [x, z] of cols) {
  if (!ENTRANCE(x, 1, z, "E") || x !== 23 || z !== 7) continue;
  for (const y of [1, 2]) g.set(22, y, 7, "air");
}

// 4. Lit panes: glowstone just behind some glass in the upper storeys and the shopfronts.
for (const [x, y, z, d, k] of windows) {
  const [dx, dz] = DIRS[d];
  const u = dx === 0 ? x : z;
  if (!lit(u, y, k)) continue;
  const bx = x - dx, bz = z - dz;
  if (built(bx, bz) && y < topAt(bx, bz)) g.set(bx, y, bz, "glowstone");
}

// 5. Roof covering: calcite where the cell is on the outer edge (already set above), tar-grey concrete elsewhere.
for (const [x, z] of cols) {
  const t = topAt(x, z);
  if (!t || exposed(x, t - 1, z).length) continue;
  g.set(x, t - 1, z, "gray_concrete");
}

// 6. Penthouse on the main roof: a 3-block brick box over the middle of the 45-block shaft, glass on its outer walls,
// a calcite cap. Solid, so nothing hangs.
for (let z = 5; z <= 8; z++) for (let x = 9; x <= 14; x++) {
  if (!built(x, z) || topAt(x, z) !== 45) continue;
  const outer = exposed(x, 46, z).length > 0;
  g.set(x, 45, z, "bricks");
  g.set(x, 46, z, outer ? "glass_pane" : "bricks", outer ? paneState(exposed(x, 46, z)[0]) : undefined);
  g.set(x, 47, z, "calcite");
}

const { blocks, palette } = g.save(`${DIR}/NYC1035430.nbt`);
console.log(`NYC1035430: ${blocks} blocks, ${palette} palette entries`);
