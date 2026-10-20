import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-century Taipei shophouse block (c. 1960s-80s): stone foundation,
// white tiled concrete piers and spandrels, a red fascia over a glazed street-level
// shopfront, punched upper-storey windows with continuous sill and lintel bands,
// a cornice and a parapet, and rooftop AC plant and a water tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365103466";
const W = 23, H = 23, D = 11;
const TOP = 11;           // roof about 11 blocks above the lowest ground (y = 0)
const SLAB_A = 5;         // storey line between ground and upper floor
const SLAB_B = 10;        // roof deck / cornice line
const FASCIA = 4;         // red fascia above the shopfront
const SHOP_TOP = 3;       // last glazed shopfront row
const SILL = 6;           // upper storey sill band
const HEAD = 9;           // upper storey lintel band
const DOOR_X = 11;        // entrance column on the street (north) face

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(g))));
}
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return;                       // build only on footprint cells
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces of a cell: n = -z (street front), s = +z, w = -x, e = +x
const outward = (x, z) => {
  const out = [];
  if (!has(x, z - 1)) out.push("n");
  if (!has(x, z + 1)) out.push("s");
  if (!has(x - 1, z)) out.push("w");
  if (!has(x + 1, z)) out.push("e");
  return out;
};

// Glass panes: connection axis follows the wall they sit in
const PANE_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_Z = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

for (const [key, gnd] of ground) {
  const [x, z] = key.split(",").map(Number);
  const dirs = outward(x, z);
  const perim = dirs.length > 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  for (let y = gnd; y <= TOP; y++) {
    if (y === gnd) { put(x, y, z, "smooth_stone"); continue; }        // base course / ground floor
    if (y === SLAB_A) { put(x, y, z, "smooth_stone"); continue; }     // storey floor slab
    if (y === SLAB_B) {                                              // cornice on edge, deck inside
      put(x, y, z, perim ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (y === TOP) { if (perim) put(x, y, z, "white_concrete"); continue; } // parapet
    if (!perim) continue;                                            // interior air

    if (dirs.length >= 2) {                                          // corner pier, full height
      put(x, y, z, "white_concrete");
      continue;
    }

    const dir = dirs[0];
    const i = (dir === "n" || dir === "s") ? x : z;                  // index along the face
    const pier = i % 3 === 0;
    const glassProps = (dir === "n" || dir === "s") ? PANE_X : PANE_Z;

    if (y === FASCIA) {
      put(x, y, z, dir === "n" ? "red_concrete" : "light_gray_concrete");
      continue;
    }

    if (y <= SHOP_TOP) {                                             // street level
      if (dir === "n") {
        if (pier) put(x, y, z, "white_concrete");
        else if (i === DOOR_X) {
          if (y === 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (y === 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, "glass_pane", PANE_X);                   // transom over door
        } else put(x, y, z, "glass_pane", PANE_X);                   // shopfront glazing
      } else {
        if (pier) put(x, y, z, "white_concrete");
        else put(x, y, z, "glass_pane", glassProps);
      }
      continue;
    }

    // Upper storey: continuous sill at 6, glazing 7..8, continuous lintel at 9
    if (y === SILL) {
      put(x, y, z, pier ? "white_concrete" : "light_gray_concrete");
    } else if (y === HEAD) {
      put(x, y, z, "light_gray_concrete");
    } else if (y >= SILL + 1 && y < HEAD) {
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", glassProps);
    }
  }
}

// Warm light behind the street glazing and the upper windows (interior air gap, z = 1)
const isInterior = (x, z) => has(x, z) && outward(x, z).length === 0;
for (let x = 1; x < W - 1; x++) {
  if (x % 6 === 4 && isInterior(x, 1)) put(x, 2, 1, "shroomlight");
  if (x % 6 === 1 && isInterior(x, 1)) put(x, 7, 1, "glowstone");
}

// Roof plant: AC units, and a water tank on stone legs at the back of the roof
for (const [x, z] of [[4, 7], [5, 7], [4, 8], [5, 8]]) {
  if (has(x, z)) put(x, TOP, z, "iron_block");
}
for (const [x, z] of [[16, 7], [17, 7], [16, 8], [17, 8]]) {
  if (has(x, z)) {
    put(x, TOP, z, "stone_bricks");
    put(x, TOP + 1, z, "oak_planks");
    put(x, TOP + 2, z, "oak_planks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
