import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw539950885: no record, footprint 36 x 17, roof ~11 blocks above lowest ground.
// Read as a two-storey, mid-century-style commercial block of pale concrete, with a granite
// base, a tinted-glass shopfront on the ground floor, a band of ribbon windows above, a cornice
// and a flat roof with plant units. Typical of older low-rise retail and office blocks in Xinyi.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950885";
const W = 36, H = 23, D = 17;
const TOP = 11;       // roof slab level (absolute y)
const STOREY_LINE = 5; // floor/band between storeys
const CORNICE = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const k = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(k(x, z), Math.round(gr));

const inside = (x, z) => ground.has(k(x, z));
const isEdge = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

const g = new Voxels([W, H, D]);

// Front face: the z = 0 side, entrance centred on it.
const DOOR_X = 18;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const corner = (x === 0 || x === W - 1 || z === 0 || z === D - 1) && edge &&
                 ((x === 0 || x === W - 1) && (z === 0 || z === D - 1));

  if (edge) {
    // Along-facade index decides pier spacing (every 4th cell), corners are always piers.
    const onXFace = x === 0 || x === W - 1;
    const along = onXFace ? z : x;
    const pier = corner || along % 4 === 0;
    const isDoor = z === 0 && x === DOOR_X;

    for (let y = gr; y <= TOP; y++) {
      if (y === gr) {
        // Base course.
        g.set(x, y, z, "polished_granite");
      } else if (y === TOP) {
        // Parapet cap.
        g.set(x, y, z, "white_concrete");
      } else if (y === CORNICE) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (y === STOREY_LINE) {
        g.set(x, y, z, "white_concrete");
      } else if (y <= STOREY_LINE - 1) {
        // Ground storey shopfront.
        if (isDoor && y === gr + 1) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else if (isDoor && y === gr + 2) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
          });
        } else if (pier) {
          g.set(x, y, z, "white_concrete");
        } else if (y === STOREY_LINE - 1) {
          g.set(x, y, z, "light_gray_concrete"); // transom bar
        } else {
          g.set(x, y, z, "tinted_glass");
        }
      } else {
        // Upper storey: sill at 6, ribbon glazing 7 to 9, piers between.
        if (pier) {
          g.set(x, y, z, "light_gray_concrete");
        } else if (y === 6) {
          g.set(x, y, z, "light_gray_concrete"); // sill
        } else if (y <= 9) {
          const onZFace = z === 0 || z === D - 1;
          g.set(x, y, z, "light_blue_stained_glass_pane", {
            north: onZFace ? "false" : "true",
            south: onZFace ? "false" : "true",
            east: onZFace ? "true" : "false",
            west: onZFace ? "true" : "false",
            waterlogged: "false",
          });
        } else {
          g.set(x, y, z, "light_gray_concrete");
        }
      }
    }
  } else {
    // Interior: no rooms, only floor slabs, the roof slab, and a few warm lights behind glazing.
    if (gr <= STOREY_LINE) g.set(x, gr, z, "smooth_stone");
    if (gr < STOREY_LINE) g.set(x, STOREY_LINE, z, "smooth_stone");
    g.set(x, TOP, z, "smooth_stone");

    // Shroomlights behind upper windows, on the inner ring next to the facade.
    const nearFacade = x === 1 || x === W - 2 || z === 1 || z === D - 2;
    const along = (x === 1 || x === W - 2) ? z : x;
    if (nearFacade && along % 4 === 2 && gr < 7) {
      g.set(x, 7, z, "shroomlight");
    }

    // Roof plant units standing on the roof slab.
    if (x % 10 === 5 && z % 6 === 3) {
      g.set(x, TOP + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
