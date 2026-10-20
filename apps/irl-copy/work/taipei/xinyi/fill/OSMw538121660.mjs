import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121660";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint: "x,z" -> base level (ground relative to lowest ground, clamped so the roof stays inside the box)
const base = new Map();
let minGround = Infinity;
for (const [, , gr] of cells) minGround = Math.min(minGround, gr);
for (const [x, z, gr] of cells) {
  const rel = Math.round(gr - minGround);
  base.set(`${x},${z}`, Math.min(Math.max(rel, 0), 10));
}
const has = (x, z) => base.has(`${x},${z}`);
const gr = (x, z) => base.get(`${x},${z}`);

// Two storeys of 5 blocks, cornice at +10, parapet cap at +11, rooftop plant to +12.
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const INWARD = {
  north: [0, 1],
  south: [0, -1],
  west: [1, 0],
  east: [-1, 0],
};

const glassProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [key, g0] of base) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground, so nothing floats on a slope
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  // Base course and floor slabs
  g.set(x, g0, z, "smooth_stone");
  g.set(x, g0 + 5, z, "smooth_stone");

  // Roof slab over the building; interior cells get a concrete roof, exterior a stone cornice course
  const faces = Object.keys(DIRS).filter(f => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });
  const exterior = faces.length > 0;

  if (exterior) {
    g.set(x, g0 + 10, z, "stone_bricks");
    g.set(x, g0 + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, g0 + 10, z, "light_gray_concrete");
  }

  if (!exterior) continue;

  // Exterior walls, storey by storey
  for (let y = g0 + 1; y <= g0 + 9; y++) {
    if (y === g0 + 5) {
      // Storey line: stone band
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    g.set(x, y, z, "white_concrete");
  }

  // Facade detailing on single-face cells (corners and piers stay solid)
  if (faces.length !== 1) continue;
  const face = faces[0];
  const t = (face === "north" || face === "south") ? x : z;
  const isWindowBay = t % 3 !== 0 && t > 0 && t < 16;
  if (!isWindowBay) continue;

  // Ground floor shopfront glass
  for (let y = g0 + 1; y <= g0 + 3; y++) {
    g.set(x, y, z, "glass_pane", glassProps(face));
  }
  // Upper storey windows
  for (let y = g0 + 6; y <= g0 + 8; y++) {
    g.set(x, y, z, "glass_pane", glassProps(face));
  }

  // Warm light behind some upper windows (interior cell, one step inward)
  if (t % 6 === 1) {
    const [ix, iz] = INWARD[face];
    const cx = x + ix, cz = z + iz;
    if (has(cx, cz) && gr(cx, cz) !== undefined) {
      const isInterior = Object.keys(DIRS).every(f => {
        const [dx, dz] = DIRS[f];
        return has(cx + dx, cz + dz);
      });
      if (isInterior) g.set(cx, g0 + 7, cz, "glowstone");
    }
  }
}

// Entrance: centre bay of the north (street-facing) wall
const doorX = 8;
if (has(doorX, 0) && gr(doorX, 0) !== undefined) {
  const g0 = gr(doorX, 0);
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(doorX, g0 + 1, 0, "dark_oak_door", doorProps("lower"));
  g.set(doorX, g0 + 2, 0, "dark_oak_door", doorProps("upper"));
  g.set(doorX, g0 + 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
  // Lintel over the door
  g.set(doorX - 1, g0 + 4, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  g.set(doorX, g0 + 4, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  g.set(doorX + 1, g0 + 4, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// Rooftop plant: a small concrete housing with a stone cap, near the centre
for (const [cx, cz] of [[6, 6], [7, 6], [6, 7], [7, 7]]) {
  if (!has(cx, cz)) continue;
  const g0 = gr(cx, cz);
  g.set(cx, g0 + 11, cz, "light_gray_concrete");
  g.set(cx, g0 + 12, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
