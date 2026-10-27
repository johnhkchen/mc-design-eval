import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s four-storey plaster-and-concrete commercial walk-up (shopfront at street level,
// green-tiled fascia, cream render with pilaster piers, flat roof with a coping and a lift overrun).
// Lidar roof is 15-16 above y0 across the footprint: smoothed to one flat tier (the lone 12 at (4,9)
// is treated as lidar noise at the edge). Floors are level at y 4/8/12 above the lowest ground;
// the uphill cells are buried deeper so the downhill side shows the extra storeys.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_1014529465.cells.json`, "utf8"));

const TOP = 15;              // cornice / roof-deck row (roof tier 16 with the coping above)
const FLOORS = [4, 8, 12];   // storey lines above y0
const DOOR = [5, 9];         // south face, on the downhill side
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N S W E

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFp = (x, z) => ground.has(`${x},${z}`);
const outFaces = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const interior = (x, z) => outFaces(x, z).length === 0;

const v = new Voxels([10, 29, 10]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const lights = [];

for (const [x, z, gr] of cells) {
  // foundation: solid from y0 up to this cell's ground, so nothing floats on the slope
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = outFaces(x, z);
  if (faces.length === 0) {
    // interior: floor slabs per storey and air between them (no rooms, no fill)
    for (const y of [gr, ...FLOORS, TOP]) put(x, y, z, "smooth_stone");
    continue;
  }

  const corner = faces.length > 1;
  const [dx, dz] = faces[0];
  const along = dx === 0 ? x : z;                       // index along the face
  const inward = [x - dx, z - dz];
  const glazed = !corner && inFp(...inward) && interior(...inward);   // a real room behind the glass
  const glass = dx === 0
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const pier = corner || along % 3 === 0;
  const isDoor = x === DOOR[0] && z === DOOR[1];

  for (let y = gr; y <= TOP + 1; y++) {
    if (isDoor && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
    } else if (y === gr) {
      put(x, y, z, "polished_andesite");                 // base course
    } else if (y === TOP + 1) {
      put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // coping
    } else if (y === TOP) {
      put(x, y, z, "smooth_quartz");                     // cornice
    } else if (FLOORS.includes(y)) {
      put(x, y, z, isDoor && y === 4 ? "green_terracotta" : "smooth_quartz");        // string course / entrance canopy
    } else if (y === 3) {
      put(x, y, z, "green_terracotta");                  // ground-floor fascia
    } else if (y % 4 === 3) {
      put(x, y, z, "quartz_block");                      // spandrel under each sill
    } else if (glazed && (y <= 2 || along % 3 !== 0)) {          // continuous shopfront glass, upper bays with piers
      put(x, y, z, "glass_pane", glass);
      if (y === gr + 1 || FLOORS.includes(y - 1)) {          // lower row of each window
        const storey = Math.floor(y / 4);
        if ((along + storey) % 4 === 1 && y > 2) lights.push([inward[0], y, inward[1]]);
      }
    } else {
      put(x, y, z, pier ? "quartz_pillar" : "quartz_block");
    }
  }
}

// warm light behind some glass: glowstone in the air gap, inside the shell
for (const [x, y, z] of lights) put(x, y, z, "glowstone");

// lift overrun on the roof (interior cells only, sitting on the roof deck)
for (const [x, z] of [[4, 5], [5, 5], [4, 6], [5, 6]]) {
  put(x, 16, z, "quartz_block");
  put(x, 17, z, "quartz_block");
  put(x, 18, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

v.save(`${dir}/way_1014529465.nbt`);
