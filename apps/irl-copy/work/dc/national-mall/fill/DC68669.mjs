// A 7 x 19 block brick commercial block of c. 1910-1920 on the Mall's edge: red brick walls on a stone plinth, limestone
// string courses and cornice, a shopfront on the ground storey with a recessed door, and three storeys of glass in
// brick piers above it. The lidar puts the roof at 8 blocks everywhere except a 3x3 cluster on the west side (9), read
// as a stair house on the roof. Every footprint cell is solid from y 0 to the roof; floor slabs at y 0, 3, 5 and 7 carry
// each storey, and the air behind the glass is one block deep, with a few lanterns and shroomlights in the windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68669.cells.json`, "utf8"));

const g = new Voxels([7, 21, 19]);

const key = (x, z) => `${x},${z}`;
const roofAt = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const has = (x, z) => roofAt.has(key(x, z));

// ---- massing: the flat 8-block roof, with the 9-block lidar cluster (x 2-4, z 9-11) read as a penthouse on it ----
const PENT = { x0: 2, x1: 4, z0: 9, z1: 11 };

// ---- facade: a cell with a missing neighbour is on the outside; its face sets the bay pattern ----
const face = (x, z) => {
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  return null;
};
// windows: 2-wide bays on the long sides (z 2-3, 6-7, 10-11, 14-15), 2-wide on the ends (x 1-2, 4-5), brick piers between
const isWindow = (f, x, z) => (f === "W" || f === "E" ? [2, 3].includes(z % 4) : [1, 2, 4, 5].includes(x));
const DOOR = { x: 3, z: 0 };
const isDoor = (x, z) => x === DOOR.x && z === DOOR.z;

// glass panes connect along their own wall
const paneState = (f) => (f === "W" || f === "E"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// ---- footprint walk ----
const fp = cells.map(([x, z]) => [x, z]);
for (const [x, z] of fp) {
  const f = face(x, z);

  // plinth and ground-storey floor slab, solid to the lowest ground (every footprint cell)
  g.set(x, 0, z, "stone_bricks");

  if (!f) {
    // interior: floor slabs at y 3, 5 and the roof deck at y 7; air between (behind the glass)
    g.set(x, 3, z, "smooth_stone");
    g.set(x, 5, z, "smooth_stone");
    g.set(x, 7, z, "smooth_stone");
    continue;
  }

  // ground storey: dark bulkhead and shop glass in the bays, calcite pilasters, recessed door in the north wall
  for (let y = 1; y <= 2; y++) {
    if (f === "N" && isDoor(x, z) && y <= 2) continue; // door set below
    if (isWindow(f, x, z)) g.set(x, y, z, y === 1 ? "dark_oak_planks" : "glass_pane", y === 1 ? undefined : paneState(f));
    else g.set(x, y, z, "calcite");
  }
  // string course at y 3 and y 5, the sill and lintel of each storey
  g.set(x, 3, z, "calcite");
  g.set(x, 5, z, "calcite");
  // storeys 2 and 3: glass in the bays, red brick piers
  for (const y of [4, 6]) {
    if (isWindow(f, x, z)) g.set(x, y, z, "glass_pane", paneState(f));
    else g.set(x, y, z, "bricks");
  }
  // cornice at the roof line, calcite with brick between the bays; the roof deck is inside it
  g.set(x, 7, z, "calcite");
}

// the north door: lower and upper half, opening onto the shop (a door block is one cell wide, two high)
g.set(DOOR.x, 1, DOOR.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR.x, 2, DOOR.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm lights behind some glass: hanging lanterns under the storey-2 slab on the shopfront, lanterns on the sill, shroomlights
for (const x of [2, 4]) g.set(x, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
g.set(1, 4, 2, "lantern", { hanging: "false", waterlogged: "false" });
g.set(1, 4, 10, "lantern", { hanging: "false", waterlogged: "false" });
g.set(1, 6, 6, "shroomlight");
g.set(1, 6, 14, "shroomlight");
g.set(1, 4, 14, "lantern", { hanging: "false", waterlogged: "false" });
g.set(5, 6, 1, "shroomlight");

// ---- penthouse on the 9-block cluster: brick ring, glass on the middle of each face, a calcite cap at the centre ----
for (let x = PENT.x0; x <= PENT.x1; x++) for (let z = PENT.z0; z <= PENT.z1; z++) {
  const edge = x === PENT.x0 || x === PENT.x1 || z === PENT.z0 || z === PENT.z1;
  const mid = (x === 3 && (z === PENT.z0 || z === PENT.z1)) || (z === 10 && (x === PENT.x0 || x === PENT.x1));
  if (x === 3 && z === 10) g.set(x, 8, z, "calcite");
  else if (edge && mid) g.set(x, 8, z, "glass_pane", z === 10 ? paneState("W") : paneState("N"));
  else g.set(x, 8, z, "bricks");
}

g.save(`${DIR}/DC68669.nbt`);
