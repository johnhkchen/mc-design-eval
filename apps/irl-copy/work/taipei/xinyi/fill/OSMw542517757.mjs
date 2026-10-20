import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542517757";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 38, H = 23, D = 25;
const g = new Voxels([W, H, D]);

// Record: low-rise two-storey commercial/civic block, roof ~11 blocks above lowest ground.
// Storey 1: y ground..4, storey 2: y 5..9, roof deck y=10, parapet to y=12.
const ROOF = 10;
const PARAPET_TOP = 12;
const SPANDREL = 5;
const HEAD = 9;

const gr = new Map();
let minX = Infinity, maxX = -Infinity;
for (const [x, z, y] of cells) {
  gr.set(x + "," + z, y);
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
}
const at = (x, z) => gr.get(x + "," + z);
const midX = Math.floor((minX + maxX) / 2);

const FACES = [
  { dx: 0, dz: -1, f: "north" },
  { dx: 0, dz: 1, f: "south" },
  { dx: -1, dz: 0, f: "west" },
  { dx: 1, dz: 0, f: "east" },
];
function outward(x, z) {
  for (const face of FACES) {
    if (at(x + face.dx, z + face.dz) === undefined) return face;
  }
  return null;
}
const isEdge = (x, z) => outward(x, z) !== null;

// Entrance: north-face edge cell closest to the middle of the frontage.
let doorX = null, bestD = Infinity;
for (const [x, z] of cells) {
  const o = outward(x, z);
  if (o && o.f === "north" && Math.abs(x - midX) < bestD) {
    bestD = Math.abs(x - midX);
    doorX = x;
  }
}

for (const [x, z, ground] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground && y < H; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  // Roof deck (interior) and floor slabs.
  if (ground <= ROOF && !edge) g.set(x, ROOF, z, "smooth_stone");
  if (ground <= 4 && !edge) g.set(x, SPANDREL, z, "smooth_stone");

  // Ground-floor interior ceiling lights (hanging lanterns under the slab).
  if (!edge && ground <= 4 && x % 6 === 3 && z % 6 === 3) {
    g.set(x, 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Roof equipment: condenser units on the roof deck.
  if (!edge && ground <= ROOF && x % 9 === 4 && z % 9 === 4) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
  }

  if (!edge) continue;

  const o = outward(x, z);
  const along = o.dz !== 0 ? x : z;

  for (let y = ground; y <= PARAPET_TOP && y < H; y++) {
    if (y === ground) {
      // Base course at street level.
      g.set(x, y, z, "stone_bricks");
    } else if (y <= 4) {
      // Ground-floor shopfront: glass bays between white pillars, entrance on north.
      if (o.f === "north" && x === doorX && (y === ground + 1 || y === ground + 2)) {
        const half = y === ground + 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (along % 4 === 0) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "glass");
      }
    } else if (y <= HEAD) {
      // Upper storey: spandrels top and bottom, window bays with frames.
      if (y === SPANDREL || y === HEAD) {
        g.set(x, y, z, "white_concrete");
      } else if (along % 3 === 0) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "glass_pane", {
          north: "false", south: "false", east: "false", west: "false", waterlogged: "false",
        });
      }
    } else if (y === ROOF) {
      // Cornice.
      g.set(x, y, z, "stone_bricks");
    } else if (y === ROOF + 1) {
      // Parapet.
      g.set(x, y, z, "white_concrete");
    } else {
      // Coping.
      g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }

  // Warm light behind some upper-storey windows (interior neighbour, air gap kept).
  if (ground <= 9 && along % 3 !== 0 && along % 6 === 1) {
    const ix = x - o.dx, iz = z - o.dz;
    if (at(ix, iz) !== undefined && !isEdge(ix, iz)) {
      g.set(ix, 7, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
