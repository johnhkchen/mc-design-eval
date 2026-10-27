// Way 912170825: a two-storey Edwardian brick shop block (Eden Terrace / Mt Eden road edge, c.1905-1920).
// Red brick walls on a stone plinth, stone string courses at each floor line and a stone cornice, a dark timber
// shop fascia and glass shopfront on the north (downhill) face, a recessed street door on the east with a timber
// hood, a single-storey stone-coped wing and a paved terrace on the uphill south side, and a brick parapet
// around a flat roof with two plant units. Massing from the lidar: each cell's roof is its top surface
// (T blocks), so the main block is 10 high (2.5 storeys at 1.2 blocks/m) and its parapet takes it to 11.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_912170825.cells.json`, "utf8"));

// [x, z, ground, roof]: a column is solid from y 0 (foundation up to ground), its body from ground to roof - 1.
// Roof 0 means the lidar sees no building there (open ground), so the cell is left out.
const col = new Map();
for (const [x, z, ground, roof] of cells) if (roof > 0) col.set(`${x},${z}`, { g: ground, T: roof });

const at = (x, z) => col.get(`${x},${z}`);
const present = (x, y, z) => { const c = at(x, z); return !!c && y < c.T; };
// the sides of a cell at height y that face open air (a shell face): [dx, dz] pairs, north is dz = -1
const exposed = (x, y, z) => [[0, -1], [0, 1], [1, 0], [-1, 0]].filter(([dx, dz]) => !present(x + dx, y, z + dz));

const v = new Voxels([7, 23, 8]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
// a glass pane joins the wall it sits in: connected along the wall's run
const pane = (ex) => {
  const alongX = ex.some(([, dz]) => dz !== 0);
  return { north: String(!alongX), south: String(!alongX), east: String(alongX), west: String(alongX), waterlogged: "false" };
};

const DOOR = [6, 2];   // the street door, on the east face
for (const key of col.keys()) {
  const [x, z] = key.split(",").map(Number);
  const { g, T } = at(x, z);

  if (T <= g) { put(x, 0, z, "smooth_stone"); continue; }     // open paved terrace at street level

  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");   // foundation: nothing floats on a slope

  for (let y = g; y < T; y++) {
    const ex = exposed(x, y, z), shell = ex.length > 0, corner = ex.length > 1;
    const north = ex.some(([, dz]) => dz === -1);

    if (y === T - 1) { put(x, y, z, shell ? "stone_bricks" : "smooth_stone"); continue; }   // roof deck / coping
    if (!shell) { if (y === g || y === 4) put(x, y, z, "smooth_stone"); continue; }     // floor slabs, air between

    const window = (x + z) % 2 === 1;                                                   // every other bay is glazed
    if (corner) {                                                                       // stone quoins
      put(x, y, z, "stone_bricks");
    } else if (y === g || y === 3 || y === 8) {                                         // plinth, shop fascia, cornice
      put(x, y, z, y === 3 && north ? "dark_oak_planks" : "stone_bricks");
    } else if (y === 4 || y === 7) {                                                    // sills and lintels frame the glazed bays
      put(x, y, z, window ? "stone_bricks" : "bricks");
    } else if (y <= 2 && north) {                                                       // shopfront glass
      put(x, y, z, "glass_pane", pane(ex));
    } else if (window) {                                                                // upper window grid
      put(x, y, z, "glass_pane", pane(ex));
    } else {
      put(x, y, z, "bricks");
    }
  }

  if (T >= 10 && exposed(x, T - 1, z).length) put(x, T, z, "bricks");                  // parapet to 11
}

// street door: lower and upper halves on the east face, with a timber hood over it
const [dx, dz] = DOOR;
put(dx, 1, dz, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx, 2, dz, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
put(dx, 3, dz, "dark_oak_stairs", { facing: "east", half: "top", shape: "straight", waterlogged: "false" });

// warm light: glowstone behind two shopfront panes, lanterns on the floors of the upper and ground storeys
put(3, 1, 1, "glowstone");
put(5, 1, 2, "lantern", { hanging: "false", waterlogged: "false" });
put(3, 5, 2, "lantern", { hanging: "false", waterlogged: "false" });
put(4, 5, 3, "glowstone");

// roof plant: two units standing on the roof deck inside the parapet
put(2, 10, 3, "iron_block");
put(4, 10, 2, "iron_block");

v.save(`${DIR}/way_912170825.nbt`);
console.log("saved", `${DIR}/way_912170825.nbt`, "cells:", v.count());
