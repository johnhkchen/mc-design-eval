import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612486";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 8 x 23 x 6: two storeys, cream-tile concrete frame, shopfront on the street (z = 0) face.
const W = 8, H = 23, D = 6;
const g = new Voxels([W, H, D]);

const gr = new Map();
for (const [x, z, y] of cells) gr.set(`${x},${z}`, y);
const has = (x, z) => gr.has(`${x},${z}`);
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, G] of cells) {
  const perim = isEdge(x, z);
  const front = !has(x, z - 1);       // street face (z = 0 side)
  const back = !has(x, z + 1);
  const westF = !has(x - 1, z);
  const eastF = !has(x + 1, z);
  const corner = (westF || eastF) && (front || back);
  const alongX = front || back;       // wall runs along x on this cell
  const idx = alongX ? x : z;         // position along the wall
  const win = perim && !corner && idx % 2 === 0;
  const glassProps = alongX ? GLASS_EW : GLASS_NS;

  // Foundation fill up to this cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone");

  // Floor at ground level.
  put(x, G, z, perim ? "stone_bricks" : "smooth_stone");

  if (perim) {
    // Ground storey (G+1 .. G+4).
    for (let y = G + 1; y <= G + 4; y++) {
      if (y === G + 4) {
        put(x, y, z, front ? "stone_bricks" : (corner ? "light_gray_concrete" : "white_concrete"));
        continue;
      }
      if (corner) { put(x, y, z, "light_gray_concrete"); continue; }
      if (front) {
        if (x === 2 && y === G + 1) {
          put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (x === 2 && y === G + 2) {
          put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (x === 2 && y === G + 3) {
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        } else {
          put(x, y, z, "glass_pane", glassProps);
        }
      } else {
        const lit = win && (y === G + 2 || y === G + 3);
        put(x, y, z, lit ? "glass_pane" : "white_concrete", lit ? glassProps : undefined);
      }
    }

    // Storey line at G+5.
    put(x, G + 5, z, "light_gray_concrete");

    // Upper storey (G+6 .. G+9).
    for (let y = G + 6; y <= G + 9; y++) {
      if (corner) { put(x, y, z, "light_gray_concrete"); continue; }
      if (win) {
        if (y === G + 7 || y === G + 8) put(x, y, z, "glass_pane", glassProps);
        else put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "white_concrete");
      }
    }

    // Cornice at G+10, parapet at G+11.
    put(x, G + 10, z, "stone_bricks");
    put(x, G + 11, z, corner ? "light_gray_concrete" : "white_concrete");
  } else {
    // Interior: floor slabs only, air between (no interiors).
    put(x, G + 5, z, "light_gray_concrete");
    put(x, G + 10, z, "light_gray_concrete");
  }
}

// Warm lights set behind upper-storey glass on interior cells (air gap kept).
for (const [x, z, G] of cells) {
  if (isEdge(x, z)) continue;
  if (x === 3 && z === 2) {
    put(x, G + 7, z, "shroomlight");
    put(x, G + 2, z, "shroomlight");
  }
  if (x === 4 && z === 3) {
    put(x, G + 7, z, "glowstone");
  }
}

// Roof plant: one small unit on the roof slab.
for (const [x, z, G] of cells) {
  if (!isEdge(x, z) && x === 3 && z === 3) {
    put(x, G + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
