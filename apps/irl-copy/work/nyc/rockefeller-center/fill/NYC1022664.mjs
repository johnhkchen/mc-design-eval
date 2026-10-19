// 149 West 46th Street (1920, mixed residential and commercial): a four-storey brick loft tenement
// behind a two-storey street front, with a one-door shopfront on the street (z 0) side.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022664.cells.json`, "utf8"));   // [x, z, ground, roof]

// Clean tiers from the lidar roofs (medians, noise smoothed): the street front and the wing between the
// party piers are 2 storeys (lidar 4-8, median 6-7), the tower behind and the piers are 4 storeys (13-14).
const tier = (x, z) => (z <= 2 ? 7 : z <= 5 && x > 0 && x < 5 ? 7 : 13);
const topAt = (x, z) => (x < 0 || x > 5 || z < 0 || z > 26 ? null : tier(x, z));   // null = outside the footprint
const sides = (x, z) => ({ n: [x, z - 1], s: [x, z + 1], w: [x - 1, z], e: [x + 1, z] });
const lowerThan = ([a, b], y) => { const r = topAt(a, b); return r === null || r <= y; };   // outside, or a tier at or under y

const PANE = { east: "true", west: "true", north: "false", south: "false" };
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([6, 26, 27]);

for (const [x, z, gr] of cells) {
  const top = tier(x, z), sd = sides(x, z);
  const exposed = (y) => Object.values(sd).some((s) => lowerThan(s, y));           // a face on the outside or a lower tier
  const facesZ = (y) => [sd.n, sd.s].some((s) => lowerThan(s, y));                  // street or rear face, or the wing wall
  const edge = Object.values(sd).some(([a, b]) => { const r = topAt(a, b); return r === null || r < top; });
  for (let y = 0; y < top; y++) {
    if (y === 0 || y < gr) { g.set(x, y, z, "polished_granite"); continue; }        // base course, and fill up to the ground
    if (y === top - 1) { g.set(x, y, z, "smooth_stone"); continue; }                // roof surface and cornice
    if (y % 3 === 0) { g.set(x, y, z, "stone_bricks"); continue; }                  // storey lines: floor slabs and bands
    if (!exposed(y)) continue;                                                       // interior: air behind the glass
    if (x >= 1 && x <= 4 && facesZ(y)) {
      if (z === 0 && y < 3) {                                                        // shopfront and the entrance
        if (x === 3) g.set(x, y, z, "dark_oak_door", door(y === 1 ? "lower" : "upper"));
        else g.set(x, y, z, "glass");
      } else g.set(x, y, z, "glass_pane", PANE);
    } else g.set(x, y, z, "bricks");                                                 // party walls and the plain brick between bays
  }
  if (edge) g.set(x, top, z, "stone_bricks");                                        // coping on the roof edge
}

// Green shop awning over the storefronts and the entrance (on the floor line, so still solid).
for (let x = 1; x <= 4; x++) g.set(x, 3, 0, "green_concrete");

// Roof: an access bulkhead, a wood water tank on the tower roof, potted azaleas on the front wing's roof.
for (const x of [2, 3]) for (const z of [16, 17]) {
  for (const y of [13, 14]) g.set(x, y, z, "bricks");
  g.set(x, 15, z, "stone_bricks");
}
for (const x of [1, 2]) for (const z of [21, 22]) for (const y of [13, 14, 15]) g.set(x, y, z, "spruce_planks");
g.set(2, 7, 4, "potted_azalea_bush");
g.set(3, 7, 4, "potted_azalea_bush");

// Warm light behind some glass: a lantern by the entrance, glowstone in the upper rooms.
g.set(2, 1, 1, "lantern", { hanging: "false" });
g.set(4, 4, 1, "glowstone");
g.set(4, 7, 25, "glowstone");
g.set(1, 10, 25, "glowstone");

const stats = g.save(`${DIR}/NYC1022664.nbt`);
console.log(JSON.stringify(stats));
