import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s brick commercial block: three storeys of 4 blocks on a stone plinth, a shopfront on the street (north, -z)
// face, storey bands, a cornice and a parapet, and a plant room on the roof. The lidar roof (11-13 above y 0) is
// smoothed to one flat tier at 13 (the parapet is the 14th). Only the outer ring is built; the interior is air with a
// floor slab per storey, so each window has an air gap behind it, with some warm lights in that gap.
const FILE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735497";
const cells = JSON.parse(readFileSync(`${FILE}.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const g = new Voxels([20, 26, 16]);

const has = (x, z) => cells.some(([cx, cz]) => cx === x && cz === z);
const faceOf = (x, z) => (!has(x, z - 1) ? "N" : !has(x - 1, z) ? "W" : !has(x + 1, z) ? "E" : !has(x, z + 1) ? "S" : null);
const exposed = (x, z) => faceOf(x, z) !== null;
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };   // the step from a wall cell into the air behind it
const DECK = 12, PARAPET = 13;

// the street door: the middle street-face cell
const street = cells.filter(([x, z]) => faceOf(x, z) === "N").sort((a, b) => a[0] - b[0]);
const [doorX, doorZ] = street[Math.floor(street.length / 2)];

const pane = (face) => {
  const along = face === "N" || face === "S";   // a pane runs along the wall it is in
  return { north: String(!along), south: String(!along), east: String(along), west: String(along), waterlogged: "false" };
};
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z] of cells) {
  const face = faceOf(x, z);
  g.set(x, 0, z, "stone_bricks");                                          // plinth: the foundation under every cell
  for (const y of [4, 8, DECK]) g.set(x, y, z, face ? "smooth_quartz" : "smooth_stone");   // floor slabs; bands on the walls
  if (!face) continue;

  // a wall cell: its position along the face sets the bay rhythm (glass, glass, pier)
  const i = face === "N" || face === "S" ? x : z;
  if (face === "N" && x === doorX && z === doorZ) {
    g.set(x, 1, z, "dark_oak_door", doorState("lower"));
    g.set(x, 2, z, "dark_oak_door", doorState("upper"));
    g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });   // the entrance lamp, hung from the band above
  }
  for (let k = 0; k < 3; k++) {
    const sill = 4 * k + 1, lo = 4 * k + 2, hi = 4 * k + 3;
    const isDoor = face === "N" && x === doorX && z === doorZ && k === 0;
    if (!isDoor) g.set(x, sill, z, "smooth_quartz");                        // sill / base course
    if (isDoor) continue;
    if (i % 3 === 0) {                                                       // pier
      g.set(x, lo, z, "bricks"); g.set(x, hi, z, "bricks");
      continue;
    }
    g.set(x, lo, z, "glass_pane", pane(face));
    g.set(x, hi, z, "glass_pane", pane(face));
    const lit = k === 0 && face === "N" ? i % 3 === 1 : (i + k) % 4 === 2;   // shop windows lit, upper floors some
    if (lit) {
      const [dx, dz] = INWARD[face];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !exposed(ix, iz)) g.set(ix, lo, iz, k === 2 && i % 6 === 4 ? "shroomlight" : "glowstone");
    }
  }
  g.set(x, PARAPET, z, "smooth_quartz");                                     // solid parapet course on the outer ring
}

// the plant room: the roof's centre, set back from the parapet
for (const [x, z] of cells) {
  if (!exposed(x, z) && x >= 6 && x <= 12 && z >= 5 && z <= 10) g.set(x, PARAPET, z, "stone_bricks");
}

console.log(g.save(`${FILE}.nbt`), "cells:", cells.length, "door at", doorX, doorZ);
