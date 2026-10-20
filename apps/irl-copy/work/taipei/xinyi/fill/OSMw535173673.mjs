import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535173673";
const W = 14, H = 23, D = 35;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward face of a footprint cell: x-faces take priority at corners.
// u is the coordinate running along that facade.
function face(x, z) {
  if (!has(x - 1, z)) return { side: "W", u: z };
  if (!has(x + 1, z)) return { side: "E", u: z };
  if (!has(x, z - 1)) return { side: "N", u: x };
  if (!has(x, z + 1)) return { side: "S", u: x };
  return null;
}

// Inward neighbour across the facade, used to place glowing lamps behind glass.
function inward(x, z, side) {
  if (side === "W") return [x + 1, z];
  if (side === "E") return [x - 1, z];
  if (side === "N") return [x, z + 1];
  return [x, z - 1];
}

const ROOF_Y = 10;      // roof deck, top surface at 11
const PARAPET_Y = 11;   // parapet course
const DOOR_U = 17;      // entrance position on the west (street) facade

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = face(x, z);

  if (!f) {
    // Interior: floor slabs per storey and a roof deck. No interiors.
    put(x, gr, z, "smooth_stone");
    if (gr + 5 <= 9) put(x, gr + 5, z, "smooth_stone");
    put(x, ROOF_Y, z, "light_gray_concrete");
    // Small roof plant box in the middle of the roof.
    if (x >= 5 && x <= 8 && z >= 14 && z <= 20) {
      put(x, PARAPET_Y, z, "light_gray_concrete");
      put(x, PARAPET_Y + 1, z, "light_gray_concrete");
    }
    continue;
  }

  const { side, u } = f;

  // Base course / plinth.
  put(x, gr, z, "stone_bricks");

  // Ground storey: shopfront glazing with white concrete piers, entrance on the west face.
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (side === "W" && u === DOOR_U) {
      if (y === gr + 1) {
        put(x, y, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (y === gr + 2) {
        put(x, y, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "glass");
      }
    } else if (u % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass");
    }
  }

  // Awning band over the shopfronts (red on the street face), plain band elsewhere.
  put(x, gr + 4, z, side === "W" ? "red_concrete" : "white_concrete");

  // Storey line between the two storeys.
  if (gr + 5 <= 9) put(x, gr + 5, z, "smooth_stone");

  // Upper storey windows with frames.
  const topWin = Math.min(gr + 8, 8);
  for (let y = gr + 6; y <= topWin; y++) {
    put(x, y, z, u % 3 === 1 ? "glass" : "white_concrete");
  }

  // Warm lamps behind some upper windows (air gap behind glass).
  if (u % 6 === 1 && gr + 7 <= topWin) {
    const [ix, iz] = inward(x, z, side);
    if (has(ix, iz) && !face(ix, iz)) put(ix, gr + 7, iz, "glowstone");
  }

  // Cornice, roof deck and parapet.
  put(x, 9, z, "polished_andesite");
  put(x, ROOF_Y, z, "light_gray_concrete");
  put(x, PARAPET_Y, z, "stone_brick_wall");
}

g.save(`${DIR}/${ID}.nbt`);
