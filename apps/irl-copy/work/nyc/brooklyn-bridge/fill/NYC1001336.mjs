import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001336.cells.json`, "utf8"));

// 225 Front Street, South Street Seaport, 1822: a Federal/Greek Revival brick
// commercial-residential block. Lidar roof ~15 blocks, so five storeys with a
// shopfront at street level, storey bands at y = 3, 6, 9, 12, a brick parapet
// and a stone cap.
const W = 7, H = 27, D = 16;
const g = new Voxels([W, H, D]);

const FLOORS = [3, 6, 9, 12];
const WINDOW_ROWS = [4, 5, 7, 8, 10, 11, 13];
const PARAPET_Y = 14;
const CAP_Y = 15;

const has = new Set();
const gnd = new Map();
for (const [x, z, gr] of cells) {
  has.add(`${x},${z}`);
  gnd.set(`${x},${z}`, Math.max(0, Math.min(12, Math.round(gr))));
}
const exists = (x, z) => has.has(`${x},${z}`);

const glassNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glassEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = gnd.get(`${x},${z}`);
  const perim = !(exists(x + 1, z) && exists(x - 1, z) && exists(x, z + 1) && exists(x, z - 1));

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Face: W = street face (Front Street side), E = back, N/S = ends.
  let face = null;
  if (perim) {
    if (x === 0) face = "W";
    else if (x === W - 1) face = "E";
    else if (z === 0) face = "N";
    else if (z === D - 1) face = "S";
  }
  const t = (face === "W" || face === "E") ? z : x; // tangential index along the face

  for (let y = gr; y <= CAP_Y; y++) {
    if (!perim) {
      if (y <= PARAPET_Y) {
        if (FLOORS.includes(y)) g.set(x, y, z, "spruce_planks");
        else if (y === PARAPET_Y) g.set(x, y, z, "smooth_stone"); // roof deck
        // else air gap
      }
      continue;
    }

    if (y === CAP_Y) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }          // base course
    if (FLOORS.includes(y)) { g.set(x, y, z, "smooth_stone"); continue; } // storey band
    if (y === PARAPET_Y) { g.set(x, y, z, "bricks"); continue; }
    if (y > PARAPET_Y) continue;

    // Ground-floor shopfront on the street face.
    if (face === "W" && y < 3) {
      if (z === 0 || z === D - 1) { g.set(x, y, z, "bricks"); continue; }
      if (z === 7) { // entrance
        if (y === gr) { g.set(x, y, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gr + 1) { g.set(x, y, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        g.set(x, y, z, "dark_oak_planks"); // lintel over door
        continue;
      }
      if (y === gr) { g.set(x, y, z, "dark_oak_planks"); continue; } // bulkhead
      if (y <= 2) { g.set(x, y, z, "glass_pane", glassNS); continue; }
    }

    // Upper windows.
    if (face && WINDOW_ROWS.includes(y)) {
      const pier = t % 3 === 0;
      if (pier) { g.set(x, y, z, "bricks"); continue; }
      const props = (face === "W" || face === "E") ? glassNS : glassEW;
      g.set(x, y, z, "glass_pane", props);
      // Warm light behind some lower-row glass, sitting on the floor band below.
      if ([4, 7, 10].includes(y) && (face === "W" || face === "E") && t % 3 === 1 && (t + y) % 2 === 0) {
        const lx = face === "W" ? 1 : W - 2;
        if (exists(lx, z)) g.set(lx, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
      continue;
    }

    g.set(x, y, z, "bricks");
  }
}

// Roof equipment: two brick chimneys with stone caps on interior roof cells.
for (const [cx, cz] of [[2, 4], [4, 11]]) {
  if (!exists(cx, cz)) continue;
  const interior = exists(cx + 1, cz) && exists(cx - 1, cz) && exists(cx, cz + 1) && exists(cx, cz - 1);
  if (!interior) continue;
  g.set(cx, 15, cz, "bricks");
  g.set(cx, 16, cz, "bricks");
  g.set(cx, 17, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/NYC1001336.nbt`);
