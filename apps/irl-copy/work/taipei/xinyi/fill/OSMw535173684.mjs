import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi office/retail block, c.1990s: two storeys over a plinth, light
// tiled concrete with a glazed ground-floor shopfront and a stone-banded
// parapet, flat roof with plant. Footprint 17 x 14, roof 11 above lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535173684";
const W = 17, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

let b = Infinity;
for (const v of ground.values()) b = Math.min(b, v);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Storey rows relative to b:
// 0 plinth, 1-3 ground glazing, 4 lintel band, 5 storey line,
// 6-8 upper windows, 9 cornice band, 10 parapet (top solid row, roof surface b+11).
const PARAPET = 10;

for (const [x, z, gc] of cells) {
  const fg = gAt(x, z);
  const edge = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < fg; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slabs only, air between them (no interiors).
    for (const yr of [0, 5, PARAPET]) {
      const y = b + yr;
      if (y >= fg) put(x, y, z, "smooth_stone");
    }
    continue;
  }

  // Facade face selection: front = south (+z), then north, west, east.
  let face;
  if (!inFp(x, z + 1)) face = "s";
  else if (!inFp(x, z - 1)) face = "n";
  else if (!inFp(x - 1, z)) face = "w";
  else face = "e";
  const u = (face === "n" || face === "s") ? x : z;
  const pillar = (u % 3 === 0);
  const front = face === "s";
  const doorCol = front && x === 8;

  for (let yr = 0; yr <= PARAPET; yr++) {
    const y = b + yr;
    if (y < fg) continue;

    if (yr === 0) {
      put(x, y, z, "polished_granite");
    } else if (yr === 4 || yr === 5 || yr === 9) {
      put(x, y, z, "light_gray_concrete");
    } else if (yr === PARAPET) {
      put(x, y, z, "white_concrete");
    } else if (yr >= 1 && yr <= 3) {
      if (doorCol) {
        // door handled below; leave wall otherwise
        put(x, y, z, "white_concrete");
      } else if (pillar) {
        put(x, y, z, "white_concrete");
      } else if (front) {
        put(x, y, z, "light_blue_stained_glass");
      } else {
        put(x, y, z, "glass_pane", PANE);
      }
    } else if (yr >= 6 && yr <= 8) {
      if (pillar) {
        put(x, y, z, "white_concrete");
      } else if (yr === 7 && u % 6 === 2) {
        // warm lit window, glowstone behind the glazing position
        put(x, y, z, "glowstone");
      } else {
        put(x, y, z, "glass_pane", PANE);
      }
    }
  }

  // Entrance: double-height door on the south face at x = 8.
  if (doorCol) {
    const doorY = Math.max(fg, b + 1);
    if (doorY + 1 <= b + 3) {
      put(x, doorY, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, doorY + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    // Hanging lantern under the lintel above the door.
    if (b + 3 >= fg) put(x, b + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof: interior plant plinths and a lightning rod on the flat roof (surface b+11).
const roofY = b + PARAPET + 1;
for (const [x, z] of [[6, 5], [7, 5], [6, 6], [7, 6], [10, 8], [10, 9]]) {
  if (inFp(x, z) && !(!inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1))) {
    if (roofY < H) put(x, roofY, z, "gray_concrete");
  }
}
if (inFp(8, 6) && roofY + 1 < H) {
  put(8, roofY, 6, "gray_concrete");
  put(8, roofY + 1, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
