// A three-storey brick Edwardian commercial block on Auckland's ridge (lidar roof 11-12 blocks above the lowest ground).
// Stone plinth, shopfront with dark frames on the ground floor, quartz string courses and sills, brick piers between
// glass-paned bays, quoins at the corners, a cream cornice and a brick parapet; a flat roof with two plant boxes.
// Terrain falls to the west: solid foundation under every cell up to its ground, the floors and roof on one datum.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_326735501.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([15, 25, 9]);

const key = (x, z) => `${x},${z}`;
const plot = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const inFP = (x, z) => plot.has(key(x, z));
const exposedFaces = (x, z) => ["N", "S", "W", "E"].filter((f) =>
  !inFP(x + (f === "W" ? -1 : f === "E" ? 1 : 0), z + (f === "N" ? -1 : f === "S" ? 1 : 0)));

const DOOR = { x: 3, z: 1 };                 // the north entrance: a single-face cell on the lower ground
const DOOR_FACING = "south";                 // inward
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// roof tiers: the lidar's 11 is the west wing one block lower than the main 12
const tierTop = (roof) => (roof <= 11 ? 11 : 12);

const paneState = (face, x, z) => (face === "N" || face === "S"
  ? { north: "false", south: "false", east: inFP(x + 1, z) ? "true" : "false", west: inFP(x - 1, z) ? "true" : "false" }
  : { east: "false", west: "false", north: inFP(x, z - 1) ? "true" : "false", south: inFP(x, z + 1) ? "true" : "false" });

// the block at (x, y, z) for a footprint cell, from its ground up to its roof tier (interior air returns null)
function columnBlock(c, y) {
  const T = tierTop(c.roof), G = c.ground;
  const exposed = exposedFaces(c.x, c.z), perim = exposed.length > 0;
  // a stepped edge is many two-face cells: only the silhouette's true corners (extreme in their row and column) get quoins
  const rowX = cells.filter(([, z]) => z === c.z).map(([x]) => x), colZ = cells.filter(([x]) => x === c.x).map(([, z]) => z);
  const corner = exposed.length >= 2 && (c.x === Math.min(...rowX) || c.x === Math.max(...rowX)) && (c.z === Math.min(...colZ) || c.z === Math.max(...colZ));
  const face = exposed.includes("E") ? "E" : exposed.includes("W") ? "W" : exposed[0];   // east and west faces read first
  const u = face === "N" || face === "S" ? c.x : c.z;     // position along the exposed face
  if (y < G) return { id: "stone_bricks" };                                  // foundation to the lowest ground
  if (y === G) return { id: perim ? "stone_bricks" : "smooth_stone" };      // plinth / floor
  if (y === T) return { id: perim ? "smooth_quartz" : "stone" };             // cornice / roof deck
  if (y > T) return perim && y === T + 1 ? { id: "bricks" } : null;          // parapet
  if (y === 4 || y === 8) return { id: perim ? "smooth_quartz" : "smooth_stone" };   // storey lines
  if (!perim) return null;                                                   // interior air behind the glass
  if (corner) return { id: y % 2 === 0 ? "smooth_quartz" : "bricks" };      // quoins banded cream and brick (stepped edges are all corners)
  if (y <= 2 && y > G) {                                                     // shopfront
    if (c.x === DOOR.x && c.z === DOOR.z) return { id: "dark_oak_door", state: { facing: DOOR_FACING, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
    return u % 3 === 0 ? { id: "dark_oak_planks" } : { id: "glass_pane", state: paneState(face, c.x, c.z) };
  }
  if (y === 3 && y > G) return { id: "dark_oak_planks" };                    // fascia over the shops
  if (y === 5 || y === 9) return { id: u % 3 === 0 ? "bricks" : "smooth_quartz" };   // sills
  if (y === 6 || y === 7 || y === 10 || y === 11) {                          // window rows, glass in bays
    return y < T && u % 3 !== 0 ? { id: "glass_pane", state: paneState(face, c.x, c.z) } : { id: "bricks" };
  }
  return { id: "bricks" };
}

for (const c of plot.values()) {
  const T = tierTop(c.roof);
  for (let y = 0; y <= T + 1; y++) {
    const b = columnBlock(c, y);
    if (b) g.set(c.x, y, c.z, b.id, b.state);
  }
}

// warm light: glowstone one cell inside some storey windows, a lantern hanging inside the door
for (const c of plot.values()) {
  const exposed = exposedFaces(c.x, c.z);
  if (exposed.length !== 1) continue;
  const face = exposed[0], u = face === "N" || face === "S" ? c.x : c.z;
  const [dx, dz] = INWARD[face];
  if (u % 6 !== 1) continue;
  for (const y of [6, 10]) {
    if (y >= tierTop(c.roof) || y < c.ground) continue;
    if (!inFP(c.x + dx, c.z + dz)) continue;
    g.set(c.x + dx, y, c.z + dz, "glowstone");
  }
}
g.set(DOOR.x, 3, DOOR.z + 1, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant: two iron boxes on the main roof, clear of the parapet
g.set(7, 13, 4, "iron_block");
g.set(8, 13, 4, "iron_block");

const out = `${dir}/way_326735501.nbt`;
console.log(g.save(out));
