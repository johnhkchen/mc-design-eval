// Way 912170800, Auckland: a small Edwardian brick shop-top building (c.1910s) on a sloping corner site.
// Footprint 7 x 9 from the cells file; ground is per cell (0 or 1 block above y 0); roof from lidar,
// smoothed to its median (every cell reads 11; the 6 and 10 are noise). Three storeys in 11 blocks:
// shopfront at ground, two upper floors of sash windows between quoins and quartz (plaster) bands,
// a stone cornice and gravel roof with an air-conditioning plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_912170800.cells.json`, "utf8"));
const W = 7, D = 9, H = 24;

const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inside = (x, z) => at.has(`${x},${z}`);
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const DECK = roofs[Math.floor(roofs.length / 2)];      // lidar roof height, median-smoothed: 11
const PARAPET = DECK + 1;                              // 12: the parapet course, about 12 above the low ground

// storey lines: quartz bands at 4 (ground/first floor), 8 (second floor), 11 (cornice under the roof); brick between
const BAND = new Set([4, 8, 11]);
// glass rows: ground shopfront 1-3, first floor 5-6, second floor 9-10
const GLASS = new Set([1, 2, 3, 5, 6, 9, 10]);
const LIGHT_ROWS = new Set([1, 5, 9]);                 // lowest glass row of each storey, where a lamp sits behind the glass

const outward = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inside(x + dx, z + dz));
const isWall = (x, z) => outward(x, z).length > 0;

const vox = new Voxels([W, H, D]);
const set = (x, y, z, block, state) => vox.set(x, y, z, block, state);

let windows = 0;
for (const [x, z, ground] of cells) {
  const faces = outward(x, z);
  const wall = faces.length > 0;
  const corner = faces.length > 1;

  for (let y = 0; y < ground; y++) set(x, y, z, "stone_bricks");        // foundation up to the cell's ground
  set(x, ground, z, wall ? "stone_bricks" : "smooth_stone");           // base course on the walls, floor inside

  for (let y = ground + 1; y <= PARAPET; y++) {
    if (y === PARAPET) {
      if (wall) set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else set(x, y, z, "gravel");                                      // roof covering
      continue;
    }
    if (!wall) {                                                        // inside: only the floor plates, air between
      if (BAND.has(y)) set(x, y, z, "smooth_stone");
      continue;
    }
    if (corner) { set(x, y, z, "bricks"); continue; }                   // every step of the jagged outline is a corner: keep brick

    const [dx, dz] = faces[0];
    if (BAND.has(y)) { set(x, y, z, "quartz_block"); continue; }
    if (!GLASS.has(y) || y <= ground) { set(x, y, z, "bricks"); continue; }

    // the street face (north): shopfront with a door in the middle cell, glass either side
    if (dz === -1 && y <= 3) {
      if (x === 3 && y === 1) set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (x === 3 && y === 2) set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else set(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      continue;
    }

    // upper walls: a sash on every other cell of each face, brick piers between
    const along = dx ? z : x;
    const bx = x - dx, bz = z - dz;                                     // the cell behind this wall cell
    const airBehind = inside(bx, bz) && !isWall(bx, bz);
    if (along % 2 === 1 && airBehind) {
      const pane = dx ? { north: "true", south: "true", east: "false", west: "false" }
                      : { north: "false", south: "false", east: "true", west: "true" };
      set(x, y, z, "glass_pane", { ...pane, waterlogged: "false" });
      windows++;
      // a lamp behind every third sash, on the storey's lowest glass row
      if (LIGHT_ROWS.has(y) && windows % 3 === 0 && y > at.get(`${bx},${bz}`).ground) set(bx, y, bz, "glowstone");
    } else set(x, y, z, "bricks");
  }
}

// the shopfront's lamp behind the glass to the right of the door
set(4, 2, 1, "glowstone");

// roof plant: one air-conditioning unit on the interior roof cell nearest the middle
const interior = cells.filter(([x, z]) => !isWall(x, z));
const [cx, cz] = interior.reduce((best, c) => (Math.hypot(c[0] - 3, c[1] - 4) < Math.hypot(best[0] - 3, best[1] - 4) ? c : best));
set(cx, PARAPET, cz, "iron_block");

const out = vox.save(`${DIR}/way_912170800.nbt`);
console.log(JSON.stringify({ footprint: cells.length, deck: DECK, windows, ...out }));
