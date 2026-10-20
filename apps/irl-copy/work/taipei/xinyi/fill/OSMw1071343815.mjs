import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1990s-2000s Xinyi shophouse-office: two storeys of ~5 blocks,
// tiled white/grey facade on a stone base, shopfront glazing at street level,
// and a 1-block parapet, so the roof lands 11 blocks above the lowest ground.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343815";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 7, H = 23, D = 25;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which exterior face (if any) a footprint cell sits on.
function face(x, z) {
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  return null;
}

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = face(x, z);
  const k = f === "west" || f === "east" ? z : x; // index along the wall
  const alongZ = f === "west" || f === "east";

  // Interior floor slabs and roof deck.
  if (!f) {
    put(x, gr, z, "smooth_stone");           // ground floor slab
    put(x, gr + 5, z, "smooth_stone");       // second floor slab
    put(x, gr + 10, z, "smooth_stone");      // roof deck
  } else {
    // Exterior envelope, row by row (r = height above this cell's ground).
    put(x, gr, z, "stone_bricks");           // base course
    const pier = k % 3 === 0;

    // Storey 1: shopfront glazing with piers; door on the street (west) face.
    for (let r = 1; r <= 3; r++) {
      if (f === "west" && z === 12 && r <= 2) {
        const half = r === 1 ? "lower" : "upper";
        put(x, gr + r, z, "dark_oak_door", {
          facing: "west", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (pier) {
        put(x, gr + r, z, "white_concrete");
      } else {
        put(x, gr + r, z, "light_blue_stained_glass");
      }
    }
    put(x, gr + 4, z, "light_gray_concrete"); // storey line

    // Spandrel below the second storey.
    put(x, gr + 5, z, "white_concrete");

    // Storey 2: framed panes.
    for (let r = 6; r <= 8; r++) {
      if (pier) put(x, gr + r, z, "white_concrete");
      else put(x, gr + r, z, "light_blue_stained_glass_pane", alongZ ? PANE_EW : PANE_NS);
    }
    put(x, gr + 9, z, "stone_bricks");        // cornice
    put(x, gr + 10, z, "stone_bricks");       // parapet, 11 blocks above lowest ground

    // Warm light: a shroomlight just inside selected windows.
    if (k % 6 === 1 || k % 6 === 4) {
      let ix = x, iz = z;
      if (f === "west") ix = x + 1;
      else if (f === "east") ix = x - 1;
      else if (f === "north") iz = z + 1;
      else if (f === "south") iz = z - 1;
      if (has(ix, iz) && !face(ix, iz)) {
        const row = k % 6 === 1 ? gr + 2 : gr + 7;
        put(ix, row, iz, "shroomlight");
      }
    }
  }
}

// Roof plant: two AC condenser blocks standing on the roof deck, inside the parapet.
const plant = [[2, 4], [3, 4], [2, 5], [3, 5], [3, 19], [4, 19], [3, 20], [4, 20]];
for (const [x, z] of plant) {
  if (!has(x, z) || face(x, z)) continue;
  const gr = ground.get(`${x},${z}`);
  put(x, gr + 11, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
