import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s Xinyi commercial block: stone-based shopfront ground floor,
// one upper storey of tiled-quartz office/apartment bays, light-gray string
// courses and cornice, flat roof with rooftop AC plant. Hollow interior:
// air behind the glass, one floor slab at y=5, roof slab at y=11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542683416";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 28;
const ROOF = 11;     // roof slab top course, ~11 blocks above lowest ground
const PARAPET = 12;  // parapet course on the perimeter
const FLOOR = 5;     // slab between ground and upper storey

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Exposed faces of a footprint cell (the missing neighbour side).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

// Inward offset for each exposed face.
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Bays: piers on every third along-face index and at the corners.
function isPier(face, x, z) {
  const t = (face === "north" || face === "south") ? x : z;
  const min = (face === "north" || face === "south") ? minX : minZ;
  const max = (face === "north" || face === "south") ? maxX : maxZ;
  const i = t - min;
  return i % 3 === 0 || t === max;
}

const GLASS = "light_blue_stained_glass";
const WALL = "smooth_quartz";
const TRIM = "light_gray_concrete";
const BASE = "polished_granite";
const FOUND = "stone_bricks";

// Door: centre two columns on the north (z = 0) street face.
const isDoorCell = (x, z) => z === minZ && (x === 6 || x === 7);

for (const [x, z, gr] of cells) {
  const fs = faces(x, z);
  const perim = fs.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Floor slab and roof slab across the whole footprint.
  g.set(x, FLOOR, z, perim ? TRIM : WALL);
  g.set(x, ROOF, z, perim ? TRIM : WALL);

  if (!perim) {
    // Interior: hollow, except rooftop plant on the roof.
    if (x % 5 === 2 && z % 7 === 3) g.set(x, ROOF + 1, z, "iron_block");
    continue;
  }

  // Perimeter shell from ground to the roof.
  for (let y = gr; y < ROOF; y++) g.set(x, y, z, WALL);

  // Parapet and cornice.
  g.set(x, ROOF, z, TRIM);
  g.set(x, PARAPET, z, WALL);

  // Base course at the cell's ground.
  g.set(x, gr, z, BASE);

  // String courses at the lintel and floor line.
  g.set(x, 4, z, TRIM);
  g.set(x, FLOOR, z, TRIM);

  // Decide whether this cell carries windows on any exposed face.
  const windowFace = fs.find((f) => !isPier(f, x, z));
  const hasWindow = windowFace !== undefined;

  // Ground-floor storefront glazing.
  if (hasWindow) {
    for (let y = gr + 1; y <= 3; y++) g.set(x, y, z, GLASS);
  }

  // Upper storey: sill, glazing, head.
  if (hasWindow) {
    g.set(x, 6, z, TRIM);
    for (let y = 7; y <= 9; y++) g.set(x, y, z, GLASS);
    g.set(x, 10, z, TRIM);
  }

  // Entrance doors and transom on the street face.
  if (isDoorCell(x, z)) {
    const lower = gr + 1, upper = gr + 2;
    g.set(x, lower, z, "oak_door", {
      facing: "north", half: "lower", hinge: x === 6 ? "left" : "right",
      open: "false", powered: "false",
    });
    g.set(x, upper, z, "oak_door", {
      facing: "north", half: "upper", hinge: x === 6 ? "left" : "right",
      open: "false", powered: "false",
    });
    g.set(x, gr + 3, z, GLASS);
  }

  // Warm lights standing just behind some windows.
  if (windowFace) {
    const [dx, dz] = INWARD[windowFace];
    const bx = x + dx, bz = z + dz;
    const behindInterior = has(bx, bz) && faces(bx, bz).length === 0;
    if (behindInterior) {
      const t = (windowFace === "north" || windowFace === "south") ? x : z;
      const min = (windowFace === "north" || windowFace === "south") ? minX : minZ;
      const i = t - min;
      if (i % 4 === 1) g.set(bx, gr, bz, "glowstone");
      if (i % 4 === 2) g.set(bx, 6, bz, "shroomlight");
    }
  }

  // Entrance canopy over the door zone (z = 0 and z = 1, x = 4..9).
  if (z <= minZ + 1 && x >= 4 && x <= 9) {
    g.set(x, 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
