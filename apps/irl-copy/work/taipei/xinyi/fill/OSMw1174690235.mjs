import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690235";
const W = 30, H = 23, D = 15;

// Footprint: [x, z, ground] per cell
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, gr] of raw) cells.set(`${x},${z}`, gr);

const inFp = (x, z) => cells.has(`${x},${z}`);
const isEdge = (x, z) => !(inFp(x - 1, z) && inFp(x + 1, z) && inFp(x, z - 1) && inFp(x, z + 1));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Design: mid-century two-storey Taipei shophouse-style block.
// White terracotta tile walls, quartz storey lines, glass bays,
// stone plinth, shopfront with entrance on the north (street) face,
// flat roof with light-grey parapet and a small rooftop plant room.
for (const [key, gr] of cells) {
  const [x, z] = key.split(",").map(Number);

  // Foundation down to the lowest ground beneath each cell
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-floor base course / slab
  put(x, gr, z, "polished_andesite");

  const north = !inFp(x, z - 1);
  const south = !inFp(x, z + 1);
  const west = !inFp(x - 1, z);
  const east = !inFp(x + 1, z);
  const edge = north || south || west || east;
  const face = north ? "N" : south ? "S" : west ? "W" : east ? "E" : null;
  const idx = face === "N" || face === "S" ? x : z;

  if (!edge) {
    // Interior: air gap, storey floor slab, roof slab
    put(x, gr + 5, z, "smooth_quartz");
    put(x, gr + 10, z, "light_gray_concrete");

    // Rooftop plant room near centre
    if (x >= 10 && x <= 14 && z >= 5 && z <= 9) {
      put(x, gr + 11, z, "light_gray_concrete");
      if (x >= 11 && x <= 13 && z >= 6 && z <= 8) put(x, gr + 12, z, "white_concrete");
    }
    continue;
  }

  // Edge walls: storey line, cornice, parapet
  put(x, gr + 5, z, "smooth_quartz");
  put(x, gr + 9, z, "white_terracotta");
  put(x, gr + 10, z, "smooth_quartz");
  put(x, gr + 11, z, "light_gray_concrete");

  // Ground storey (gr+1 .. gr+4)
  if (face === "N") {
    if (idx === 14) {
      // Entrance door, glass transom above
      put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "light_blue_stained_glass");
      put(x, gr + 4, z, "smooth_quartz");
    } else if (idx % 4 === 0) {
      for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "white_terracotta");
    } else {
      for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "light_blue_stained_glass");
      put(x, gr + 4, z, "smooth_quartz");
    }
  } else {
    if (idx % 3 === 0) {
      for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "white_terracotta");
    } else {
      for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "glass");
      put(x, gr + 4, z, "white_terracotta");
    }
  }

  // Upper storey (gr+6 .. gr+8), bays of glass between tile piers
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (idx % 3 === 0) put(x, y, z, "white_terracotta");
    else put(x, y, z, "glass");
  }

  // Warm light behind some upper-storey glass: glowstone in the air gap
  if (idx % 3 !== 0 && idx % 6 === 1) {
    let ix = x, iz = z;
    if (face === "N") iz = z + 1;
    else if (face === "S") iz = z - 1;
    else if (face === "W") ix = x + 1;
    else if (face === "E") ix = x - 1;
    if (inFp(ix, iz) && !isEdge(ix, iz)) put(ix, gr + 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
