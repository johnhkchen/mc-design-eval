import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538401873.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538401873.nbt";

// Footprint 25 x 8. Lidar roof about 11 blocks above lowest ground: two storeys
// of about 5 blocks with a cornice. Reads as a 1980s Taipei commercial block:
// white wall tile, a glazed shopfront with a central entrance, a storey line,
// window grids with piers, and a flat roof with plant.
const W = 25, D = 8, H = 23;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const ROOF = minG + 11; // first empty row above the cornice

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which outward face an edge cell sits on (null = interior of the footprint).
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
};

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  const face = faceOf(x, z);

  if (!face) {
    // Interior: floor slabs only (no rooms), air between them.
    if (gr < ROOF) put(x, gr, z, "smooth_stone");
    if (minG + 5 >= gr) put(x, minG + 5, z, "light_gray_concrete");
    if (ROOF - 1 >= gr) put(x, ROOF - 1, z, "light_gray_concrete");
    // Roof plant on the flat roof: a copper water tank and an AC unit.
    if (ROOF - 1 >= gr) {
      if (x % 8 === 4 && z === 3) {
        put(x, ROOF, z, "copper_block");
        put(x, ROOF + 1, z, "copper_block");
      }
      if (x % 8 === 1 && z === 5) put(x, ROOF, z, "white_concrete");
    }
    continue;
  }

  const northSouth = face === "N" || face === "S";
  const u = northSouth ? x : z;
  const maxU = northSouth ? W - 1 : D - 1;
  const pier = u % 3 === 0 || u === maxU;

  for (let y = gr; y < ROOF; y++) {
    let id;
    let props;

    if (y === gr) {
      id = "smooth_stone"; // base course
    } else if (y === ROOF - 1) {
      id = "smooth_quartz"; // cornice / parapet cap
    } else if (y <= minG + 4) {
      // Ground storey: shopfront glazing with piers, header band at minG+4.
      if (pier) id = "white_terracotta";
      else if (y === minG + 4) id = "light_gray_concrete";
      else id = face === "N" ? "light_blue_stained_glass_pane" : "light_gray_stained_glass_pane";
    } else if (y === minG + 5) {
      id = "light_gray_concrete"; // storey line
    } else {
      // Upper storey: window openings in rows minG+7..minG+8 between piers.
      if (pier || y === minG + 6 || y === minG + 9) id = "white_terracotta";
      else id = "light_gray_stained_glass_pane";
    }

    // Central entrance on the street face (u = 13), with a canopy above.
    if (face === "N" && u === 13 && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (face === "N" && u >= 12 && u <= 14 && y === gr + 3) {
      id = "light_gray_concrete"; // canopy over the entrance
    }

    put(x, y, z, id, undefined);
  }

  // Floor slab at the storey line where the cell is above its ground.
  // (Storey line already placed in the loop above.)

  // Warm lights in the air gap behind selected windows on the street face.
  if (face === "N" && has(x, z + 1) && !faceOf(x, z + 1)) {
    if (u % 6 === 2 && minG + 2 > gr) put(x, minG + 2, z + 1, "glowstone");
    if (u % 6 === 4 && minG + 7 > gr) put(x, minG + 7, z + 1, "glowstone");
  }
}

g.save(OUT);
