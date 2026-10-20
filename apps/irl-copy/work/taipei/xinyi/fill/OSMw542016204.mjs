import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542016204.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542016204.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 17, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const gy = new Map();
for (const [x, z, ground] of cells) gy.set(`${x},${z}`, ground);
const inFp = (x, z) => gy.has(`${x},${z}`);
const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
// Number of sides of this cell that face outside the footprint
const exteriorCount = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz)).length;
const isRing = (x, z) => exteriorCount(x, z) > 0;
const isCorner = (x, z) => exteriorCount(x, z) >= 2;

// Entrance: a non-corner ring cell on the north (min-z) face, nearest the middle of the facade
let door = null;
{
  const cand = cells
    .filter(([x, z]) => isRing(x, z) && !isCorner(x, z) && !inFp(x, z - 1))
    .sort((a, b) => a[0] - b[0]);
  if (cand.length) {
    const [x, z] = cand[Math.floor(cand.length / 2)];
    door = { x, z, facing: "north" };
  } else {
    for (const [x, z] of cells) {
      if (!isRing(x, z) || isCorner(x, z)) continue;
      for (const [dx, dz, name] of DIRS) {
        if (!inFp(x + dx, z + dz)) { door = { x, z, facing: name }; break; }
      }
      if (door) break;
    }
  }
}

const TOP = 11;      // parapet level (roof about 11 above lowest ground)
const BAND_LO = 5;   // storey line between ground and upper floor
const BAND_HI = 10;  // cornice under the parapet

// Pass 1: foundations, floors, walls, windows, roof
for (const [x, z, ground] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  if (!isRing(x, z)) {
    // Interior: floor slabs per storey and the roof deck, air between
    g.set(x, ground, z, "smooth_stone");
    for (const y of [BAND_LO, BAND_HI]) if (y > ground) g.set(x, y, z, "smooth_stone");
    if (TOP > ground) g.set(x, TOP, z, "light_gray_concrete");

    // Roof plant: a small mechanical penthouse near the middle of the roof
    if (x >= 6 && x <= 10 && z >= 8 && z <= 12) {
      g.set(x, TOP + 1, z, "light_gray_concrete");
      if (x >= 7 && x <= 9 && z >= 9 && z <= 11) g.set(x, TOP + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Exterior ring (the facade wall, one block thick)
  const corner = isCorner(x, z);
  const windowable = !corner && (x + z) % 3 !== 0;
  const isDoorCell = door && door.x === x && door.z === z;

  // Base course at the ground surface
  g.set(x, ground, z, "stone_bricks");

  for (let y = ground + 1; y <= TOP; y++) {
    let b = "white_concrete";
    let props = null;

    if (y === BAND_LO || y === BAND_HI || y === TOP) {
      b = "smooth_stone"; // storey line, cornice, parapet cap
    } else if (y < BAND_LO) {
      // Ground storey: shopfront glass under a lintel
      const shopTop = Math.min(ground + 2, BAND_LO - 1);
      const isShop = y <= shopTop;
      if (corner || !windowable) b = "light_gray_concrete";
      else if (isShop) b = "glass";
      else b = "white_concrete";
    } else {
      // Upper storey: sill, then framed panes, with piers between
      if (y === 6 && windowable) b = "smooth_stone";
      else if (y >= 7 && y <= 9 && windowable) b = "glass_pane";
      else if (corner || !windowable) b = "light_gray_concrete";
    }

    if (isDoorCell && (y === ground + 1 || y === ground + 2)) {
      const half = y === ground + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: door.facing,
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (b === "glass_pane") {
      props = {
        north: String(inFp(x, z - 1)),
        south: String(inFp(x, z + 1)),
        west: String(inFp(x - 1, z)),
        east: String(inFp(x + 1, z)),
        waterlogged: "false",
      };
    }
    g.set(x, y, z, b, props ?? undefined);
  }
}

// Pass 2: warm light behind some glass (glowstone at storey 2, lantern by the door)
for (const [x, z, ground] of cells) {
  if (!isRing(x, z)) continue;
  // Interior neighbour of this ring cell
  let inward = null;
  for (const [dx, dz] of DIRS.map(([a, b]) => [a, b])) {
    const nx = x + dx, nz = z + dz;
    if (inFp(nx, nz) && !isRing(nx, nz)) { inward = [nx, nz]; break; }
  }
  if (!inward) continue;
  const [ix, iz] = inward;
  const isDoorCell = door && door.x === x && door.z === z;

  if (isDoorCell) {
    g.set(ix, ground + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  } else if (!isCorner(x, z) && (x + z) % 6 === 1) {
    g.set(ix, 8, iz, "glowstone");
  }
}

g.save(OUT);
