// L. Ron Hubbard House, 1424 16th St NW: an early-20th-century brick office block with limestone trim.
// Four office storeys over a granite ground storey, a 2-block window grid with quartz mullions, and a central
// tower one storey higher (lidar tier 12, smoothed to a clean rectangle plus a wing), with an attic and roof plant.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57260.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..14, z 0..7
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57260.nbt";

const g = new Voxels([15, 24, 8]);
const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => ground.has(`${x},${z}`);
// lidar roof reads 11 or 12 blocks, noisy at the core: smooth it into two flat tiers (tower x6-9, wing x2-9 at z3-4)
const tier = (x, z) => ((x >= 6 && x <= 9 && z >= 1) || (x >= 2 && x <= 9 && (z === 3 || z === 4)) ? 12 : 11);

for (const [x, z, gr] of cells) {
  const R = tier(x, z), b = gr;                                          // b = this cell's ground; the body stands on it
  const exposedX = !has(x - 1, z) || !has(x + 1, z);                     // a face toward x (east/west side)
  const exposedZ = !has(x, z - 1) || !has(x, z + 1);                     // a face toward z (street or rear)
  const lower = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => has(x + dx, z + dz) && tier(x + dx, z + dz) < R);
  const shell = exposedX || exposedZ || lower;                            // envelope: outer wall or a step's wall
  for (let y = 0; y < b; y++) g.set(x, y, z, "polished_granite");        // foundation (none here: ground is 0)
  if (!shell) {                                                           // interior: slabs per floor and a roof, air between
    for (const k of [0, 3, 5, 7, 9, R - 1]) g.set(x, b + k, z, "smooth_stone");
    continue;
  }
  const corner = exposedX && exposedZ;
  const t = corner ? 0 : exposedZ ? x : exposedX ? z : x + z;            // parity sets the window bays along each face
  for (let k = 0; k < R; k++) {
    const y = b + k;
    let block;
    if (k === 0) block = "polished_granite";                              // base course
    else if (corner) block = "smooth_quartz";                             // pilasters
    else if (k === 1) block = "polished_granite";                         // ground storey kickplate
    else if (k === 3 || k === 9) block = "smooth_quartz";                 // storey strings and cornice
    else if (k === 5 || k === 7) block = "bricks";                        // spandrels
    else if (k === 10 && R === 11) block = "brick_wall";                  // parapet of the low roof
    else if (k === 11) block = "brick_wall";                              // parapet of the tower
    else block = t % 2 ? "glass" : "smooth_quartz";                       // window rows at 2, 4, 6, 8 (and 10 in the tower)
    g.set(x, y, z, block);
  }
}

// entrance: double-height door bay on the street face (z = 0) with sidelights, a granite lintel and a dark canopy
g.set(6, 3, 0, "polished_granite"); g.set(7, 3, 0, "polished_granite"); g.set(8, 3, 0, "polished_granite");
g.set(6, 2, 0, "glass"); g.set(8, 2, 0, "glass");
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(7, 1, 0, "dark_oak_door", { ...door, half: "lower" });
g.set(7, 2, 0, "dark_oak_door", { ...door, half: "upper" });
for (const x of [6, 7, 8]) g.set(x, 4, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });
g.set(7, 1, 1, "air"); g.set(7, 2, 1, "air");                             // a one-bay vestibule behind the door

// warm light behind the glass in some upper-floor windows (standing on the floor slabs)
for (const [x, y] of [[3, 4], [11, 4], [5, 6], [11, 6]]) g.set(x, y, 1, "glowstone");

// roof plant on the low roof
g.set(2, 11, 6, "iron_block"); g.set(12, 11, 2, "iron_block");

const res = g.save(OUT);
console.log(JSON.stringify(res));
