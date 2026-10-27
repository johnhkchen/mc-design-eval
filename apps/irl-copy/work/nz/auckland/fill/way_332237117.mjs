// A two-storey interwar brick shop-top block with a one-storey wing on its east side, fronting north onto the street.
// Read from the lidar: roofs 7-9 blocks above y 0 are one flat two-storey tier (their 1-2 block spread is noise), roofs
// 4-5 are the one-storey setback wing. The footprint's own ground (0 or 1) is under a common plinth at y 0 and a common
// ground floor at y 1, so every slab and wall rests on the course below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237117.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..12, z 0..8

const at = new Map();
for (const [x, z, ground, roof] of cells) at.set(`${x},${z}`, { ground, roof });
const inFp = (x, z) => at.has(`${x},${z}`);
// the storey line the cell's roof deck sits on: 9 for the two-storey tier, 5 for the one-storey wing
const deck = (x, z) => (at.get(`${x},${z}`).roof >= 7 ? 9 : 5);
// faces onto the street or open air: north, south, east, west (order matters: north wins for shopfronts)
const SIDES = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
const exposed = (x, z) => SIDES.filter(([, dx, dz]) => !inFp(x + dx, z + dz)).map(([s]) => s);
// a wall where the cell faces open air, or where a lower tier meets it (the taller side keeps its wall above the lower roof)
const isWall = (x, z) => exposed(x, z).length > 0 || SIDES.some(([, dx, dz]) => inFp(x + dx, z + dz) && deck(x + dx, z + dz) < deck(x, z));

const g = new Voxels([13, 22, 9]);
const paneState = (faces) => faces.some((f) => f === "north" || f === "south")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const key of at.keys()) {
  const [x, z] = key.split(",").map(Number);
  const top = deck(x, z);
  const faces = exposed(x, z);
  const wall = isWall(x, z);
  const shop = faces.includes("north");                 // the street frontage: ground-floor shopfronts
  const bay = (x + z) % 2 === 1;                        // alternate bays carry windows
  g.set(x, 0, z, "stone_bricks");                       // plinth under every cell, so nothing floats on the slope
  if (!wall) {                                          // open interior: ground floor, storey slab, roof deck
    g.set(x, 1, z, "stone");
    if (top === 9) g.set(x, 5, z, "stone");
    g.set(x, top, z, "stone");
    continue;
  }
  g.set(x, 1, z, "polished_andesite");                  // base course
  for (let y = 2; y < top; y++) {
    if (y === 5 && top === 9) { g.set(x, y, z, "smooth_stone"); continue; }   // string course at the storey line
    if (shop && (y === 2 || y === 3)) {
      if (x === 2 && z === 0) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "glass");
    } else if (shop && y === 4) {
      if (x === 2 && z === 0) g.set(x, y, z, "dark_oak_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });   // door canopy
      else g.set(x, y, z, "dark_oak_planks");           // shop fascia
    } else if (bay && faces.length && (y === 2 || y === 3 || y === 6 || y === 7)) {
      g.set(x, y, z, "glass_pane", paneState(faces));  // window with air behind it
    } else if (bay && faces.length && (y === 4 || y === 8)) {
      g.set(x, y, z, "stone_bricks");                  // lintel over a window
    } else {
      g.set(x, y, z, "bricks");
    }
  }
  g.set(x, top, z, "bricks");                           // parapet on the roof deck
  g.set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // coping
}

// warm light behind some glass: the cell inward of a window, if it is open interior
for (const key of at.keys()) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposed(x, z);
  if (!faces.length || !isWall(x, z)) continue;
  const shop = faces.includes("north");
  const bay = (x + z) % 2 === 1;
  const face = faces[0];
  const [dx, dz] = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] }[face];
  const ix = x + dx, iz = z + dz;
  if (!inFp(ix, iz) || isWall(ix, iz)) continue;          // only where the glass has an air gap behind it
  if (shop ? (x + z) % 2 === 0 : bay && (x + z) % 3 === 0) g.set(ix, 2, iz, "glowstone");
  if (deck(x, z) === 9 && bay && (x + z) % 4 === 1) g.set(ix, 6, iz, "shroomlight");
}

// roof plant on the two-storey roof, standing on its deck
for (const [x, z] of [[2, 4], [3, 4]]) {
  g.set(x, 10, z, "smooth_stone");
  g.set(x, 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237117.nbt";
const stats = g.save(out);
console.log(JSON.stringify(stats));
