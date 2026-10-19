// 20 West 46th Street, 1920 mixed residential and commercial block: a five-storey brick walk-up over a shop front,
// its rear wing stepping down to three storeys and then to two. Footprint 6 x 24: x across the 46th Street front at low
// z (the 6-block face), z along the depth between the party walls. Tiers come from the lidar medians (main 15-18 -> 16,
// wing 8-9 -> 10, tail 4-9 -> 7), each snapped to the 3-block storey grid so every top is a belt course. Walls are red
// brick with limestone belts, a polished granite base, a dark fascia over the shop front and a black canopy over the
// door. Windows are glass panes in iron-bar frames set one block back from the face, with an air gap behind (no
// interiors) and a floor slab in every storey. A few glowstone lights sit behind the glass, two lanterns hang in the
// shop, and stone-brick parapets run along every exposed roof edge, with a water tower and an HVAC box on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034257.cells.json`, "utf8"));
const X = 6, Y = 30, Z = 24;

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => foot.has(`${x},${z}`);

// Tier tops (block heights above y 0), flat per band: main block to 16, rear wing to 10, tail to 7.
const roofAt = (x, z) => (!has(x, z) ? 0 : z <= 16 ? 16 : z <= 20 ? 10 : 7);
const isBelt = (y) => y % 3 === 0;                                  // limestone belt course at the start of each storey
const open = (x, y, z) => roofAt(x, z) <= y;                        // outside the footprint, or lower, is open air
const DIRS = { front: [0, -1], rear: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, y, z) => Object.fromEntries(Object.entries(DIRS).map(([k, [dx, dz]]) => [k, open(x + dx, y, z + dz)]));
const onFace = (e) => e.front || e.rear;
const anyFace = (e) => e.front || e.rear || e.west || e.east;
const bay = (x) => x >= 1 && x <= 4;                                // window bays between the brick piers at x 0 and 5
const windowRow = (y) => !isBelt(y);

// Glass panes and iron bars join their neighbours in the same wall plane (x only; the face is the z plane).
const joins = (x, y, z, dx) => (has(x + dx, z) && y < roofAt(x + dx, z) ? "true" : "false");
const frame = (x, y, z) => ({ east: joins(x, y, z, 1), west: joins(x, y, z, -1), north: "false", south: "false", waterlogged: "false" });

// Warm glass: window cells (x, y, z) with a glowstone behind them.
const LIT = new Set(["2,4,0", "3,7,0", "2,10,0", "3,13,0", "3,10,16", "2,4,23", "3,7,20"]);
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

// The block (and state) for each solid cell from the bottom of the tier up to its top.
const materialAt = (x, y, z) => {
  const R = roofAt(x, z), e = exposed(x, y, z);
  if (y === R - 1) return anyFace(e) ? ["calcite"] : ["gray_concrete"];   // cornice on the edge, tar roof inside
  if (!anyFace(e)) return ["stone"];                                    // core behind the skin
  if (y === 0) return ["polished_granite"];                              // base course
  if (e.front && y === 3) return [x === 1 ? "black_concrete" : "dark_oak_planks"];   // shop fascia and door canopy
  if (onFace(e) && windowRow(y) && bay(x)) {
    if (e.front && y < 3) return x === 1 ? ["oak_door", { ...DOOR, half: y === 1 ? "lower" : "upper" }] : ["glass"];
    if (x === 1 || x === 4) return ["iron_bars", frame(x, y, z)];
    return ["glass_pane", frame(x, y, z)];
  }
  if (isBelt(y)) return ["calcite"];                                     // storey lines on every face
  return ["bricks"];                                                      // brick piers and party walls
};

// The window cells, whose inner neighbour is the one-block air gap (glass in front, no room behind).
const windowCell = (x, y, z) => {
  const e = exposed(x, y, z);
  return onFace(e) && windowRow(y) && bay(x) && y < roofAt(x, z);
};
const gapZ = (x, y, z) => (exposed(x, y, z).front ? z + 1 : z - 1);

// Parapets along every exposed top edge, joined to the parapets beside them at the same height.
const parapets = new Map();
for (const [x, z] of cells) {
  const R = roofAt(x, z);
  if (anyFace(exposed(x, R - 1, z))) parapets.set(`${x},${z}`, R);
}
const joinsWall = (x, z, dx, dz) => (parapets.get(`${x + dx},${z + dz}`) === parapets.get(`${x},${z}`) ? "low" : "none");

const g = new Voxels([X, Y, Z]);

// 1. Solid mass with its skin, one column per footprint cell.
for (const [x, z] of cells) {
  const R = roofAt(x, z);
  for (let y = 0; y < R; y++) {
    const [block, state] = materialAt(x, y, z);
    g.set(x, y, z, block, state);
  }
}

// 2. The air gap behind each window, one block deep, between the glass and the core (the floor slabs stay solid).
for (const [x, z] of cells) {
  for (let y = 0; y < roofAt(x, z); y++) {
    if (windowCell(x, y, z)) g.set(x, y, gapZ(x, y, z), "air");
  }
}

// 3. Warm light: glowstone behind the lit panes, and two lanterns hanging in the shop front.
for (const key of LIT) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, gapZ(x, y, z), "glowstone");
}
for (const x of [2, 4]) g.set(x, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Parapets on the exposed roof edges.
for (const [key, R] of parapets) {
  const [x, z] = key.split(",").map(Number);
  g.set(x, R, z, "stone_brick_wall", {
    east: joinsWall(x, z, 1, 0), west: joinsWall(x, z, -1, 0),
    north: joinsWall(x, z, 0, -1), south: joinsWall(x, z, 0, 1), up: "true", waterlogged: "false",
  });
}

// 5. Roof plant: a water tower on four steel legs over the main roof, and a plant box on the rear wing.
const legs = { waterlogged: "false" };
for (const x of [1, 2]) for (const z of [10, 11]) {
  g.set(x, 16, z, "iron_bars", { ...legs, east: String(x === 1), west: String(x === 2), south: String(z === 10), north: String(z === 11) });
  g.set(x, 17, z, "iron_bars", { ...legs, east: String(x === 1), west: String(x === 2), south: String(z === 10), north: String(z === 11) });
  for (const y of [18, 19]) g.set(x, y, z, "spruce_planks");
  g.set(x, 20, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}
for (const x of [3, 4]) for (const z of [18, 19]) {
  for (const y of [10, 11]) g.set(x, y, z, "light_gray_concrete");
  g.set(x, 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/NYC1034257.nbt`);
