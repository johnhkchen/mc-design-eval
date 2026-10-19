// 129 West 46 Street, the Comfort Inn Midtown: a 1902 ten-storey commercial and office block in the Midtown manner, on a
// 10 x 24 lot north of 46th Street. The street front is the south face (high z), which stands 2 blocks up on the lidar's
// ground: a granite base, a shopfront of glass on granite piers, and the hotel entrance (a double dark-oak door under a
// stone lintel and a dark-oak awning). Above it, red brick piers and glass bays with a stone string course every third
// row, a calcite cornice and a stone parapet. The east side and the west side where the lot abuts are blank brick party
// walls; the west side onto the light court is windowed. The rear (north) row is stepped down to 28 blocks (the lidar's
// ragged lower back wall). The roof is a flat deck with a wooden water tower on a stone plinth and a stair bulkhead.
// The lidar's 0 cell is a skylight (glass over a light well); the 22 and 1 notches are lidar noise and smoothed out.
// The mass is hollow above grade: an air gap behind every pane, a floor slab per storey, nothing hanging in the air.
// Warm glowstone sits behind some panes on the first row of a storey, where the slab below holds it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022666.cells.json`, "utf8"));
const X = 10, Y = 44, Z = 24;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const groundAt = (x, z) => cell.get(`${x},${z}`).ground;

// Roof tiers, smoothed from the lidar into flat tiers: the block at 32 (lidar 31-32), the rear row (z 0) stepped down
// to 28 (lidar 25-31 along the back wall). The lidar's 0 at (7, 13) is the skylight.
const SKYLIGHT = [7, 13];
const roofAt = (x, z) => (!inFoot(x, z) ? 0 : z === 0 ? 28 : 32);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const PRIORITY = ["S", "N", "W", "E"];                       // the street front first, then the rear, then the sides
// A face is exposed at height y when the cell beside it is outside the footprint or its roof is at or below y.
const exposed = (x, y, z) => PRIORITY.filter((d) => {
  const [dx, dz] = DIRS[d];
  return !inFoot(x + dx, z + dz) || roofAt(x + dx, z + dz) <= y;
});
const perimeter = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inFoot(x + dx, z + dz) || roofAt(x + dx, z + dz) < roofAt(x, z));

const ALONG_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // a pane in a north or south face
const ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // a pane in an east or west face
const DOOR_X = [4, 5];
const isDoor = (x, y, z) => z === 23 && DOOR_X.includes(x) && (y === 2 || y === 3);
const lit = (x, y) => y % 3 === 1 && (x * 3 + y) % 7 === 0;   // sparse, first row of a storey

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);
const lamps = [];

// 1. Shell, one column at a time: a stone foundation up to each cell's ground, the facade on every exposed face, a
// calcite cornice on the roof's edge, a roof deck, floor slabs at each storey line, and air behind the glass.
for (const [x, z] of cols) {
  const G = groundAt(x, z), R = roofAt(x, z);
  for (let y = 0; y < R; y++) {
    if (y < G) { g.set(x, y, z, "stone_bricks"); continue; }                  // foundation under the slope
    const faces = exposed(x, y, z);
    if (y === R - 1) {                                                        // roof deck, or the cornice on the facade
      if (x === SKYLIGHT[0] && z === SKYLIGHT[1]) g.set(x, y, z, "glass");
      else g.set(x, y, z, faces.length ? "calcite" : "smooth_stone");
      continue;
    }
    if (!faces.length) {                                                      // interior: a floor slab per storey, air between
      if (y % 3 === 0 || y === G) g.set(x, y, z, "stone_bricks");
      continue;
    }
    const d = faces[0];
    const [dx, dz] = DIRS[d];

    if (d === "S" && z === 23) {                                              // the street front: base, shopfront, entrance
      if (isDoor(x, y, z)) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 2 ? "lower" : "upper", hinge: x === 4 ? "left" : "right", open: "false", powered: "false" });
        continue;
      }
      if (y === G) { g.set(x, y, z, "polished_granite"); continue; }        // base course
      if (y <= 5) {
        if (x >= 3 && x <= 6 && y === 5) { g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }   // awning over the entrance
        if (x >= 4 && x <= 5 && y === 4) { g.set(x, y, z, "stone_bricks"); continue; }                                              // lintel
        if (x % 3 === 0) { g.set(x, y, z, "polished_granite"); continue; }   // granite piers
        if (y === 5) { g.set(x, y, z, "calcite"); continue; }                // transom
        g.set(x, y, z, "glass_pane", ALONG_X);                               // shop glass
        continue;
      }
    }

    if (y === G) { g.set(x, y, z, "polished_granite"); continue; }           // base course
    if (y % 3 === 0) { g.set(x, y, z, "stone_bricks"); continue; }           // string course
    const along = d === "N" || d === "S" ? x : z;                            // position along the face
    const party = d === "E" || (d === "W" && !(z >= 6 && z <= 17));         // blank brick where the neighbours build up
    if (party || along % 3 === 0) { g.set(x, y, z, "bricks"); continue; }   // party wall, or a red brick pier
    g.set(x, y, z, "glass_pane", d === "N" || d === "S" ? ALONG_X : ALONG_Z);
    if (lit(along, y)) lamps.push([x - dx, y, z - dz]);                     // the room behind, one block in
  }
}

// 2. The parapet: a stone course and a calcite cap on the perimeter, above the cornice.
for (const [x, z] of cols) {
  if (!perimeter(x, z)) continue;
  const R = roofAt(x, z);
  g.set(x, R, z, "stone_bricks");
  g.set(x, R + 1, z, "calcite");
}

// 3. Roof plant: a wooden water tower on a 3 x 3 stone plinth, and a stair bulkhead (2 x 2, bricks, calcite cap).
for (let x = 1; x <= 3; x++) for (let z = 4; z <= 6; z++) {
  g.set(x, 32, z, "stone_bricks"); g.set(x, 33, z, "stone_bricks");
  for (let y = 34; y <= 36; y++) g.set(x, y, z, "oak_planks");
  g.set(x, 37, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}
for (let x = 6; x <= 7; x++) for (let z = 18; z <= 19; z++) {
  for (let y = 32; y <= 35; y++) g.set(x, y, z, "bricks");
  g.set(x, 36, z, "calcite");
}

// 4. Warm light behind the glass (only on the first row of a storey, where the slab below holds it).
for (const [x, y, z] of lamps) {
  if (g.get(x, y, z) || exposed(x, y, z).length) continue;
  g.set(x, y, z, "glowstone");
}

// 5. Nothing hangs: every block above the ground has a block under it, or a block beside it at its level (an interior
// floor slab is held by the shell at its edges, as a real floor is held by its walls).
let floating = 0;
const solid = (x, y, z) => !!g.get(x, y, z);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 1; y < Y; y++) {
  if (!solid(x, y, z) || solid(x, y - 1, z)) continue;
  if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => solid(x + dx, y, z + dz))) continue;
  floating++;
}
if (floating) console.warn(`${floating} blocks with nothing under or beside them`);

const { blocks, palette } = g.save(`${DIR}/NYC1022666.nbt`);
console.log(`NYC1022666.nbt: ${blocks} blocks, ${palette} palette entries, ${g.size.join(" x ")}`);
