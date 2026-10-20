import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341337624";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 19, D = 10;
const g = new Voxels([W, H, D]);

const SLAB_Y = 5;      // roof slab level: top surface at 6 blocks
const PARAPET_Y = 6;   // parapet top at 7 blocks above lowest ground

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);
const edge = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

function setb(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Pass 1: foundations and body, cell by cell.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) {
    setb(x, y, z, y < gr ? "stone" : "stone_bricks");
  }

  const roofY = Math.max(SLAB_Y, gr + 1);
  const perimeter = edge(x, z);

  if (perimeter) {
    for (let y = gr + 1; y < roofY; y++) {
      const rel = y - gr;
      let block = "white_concrete";
      let props;

      if (rel === 1) {
        block = "polished_andesite"; // base course
      } else if (rel === 2 || rel === 3) {
        // Glass zone with frames.
        if (z === 0) {
          // Front: mullions every 3 blocks along x.
          if (x % 3 === 0) block = "gray_concrete";
          else { block = "light_blue_stained_glass_pane"; props = { east: "true", west: "true", north: "false", south: "false" }; }
        } else if (x === 0 || x === W - 1) {
          // Side: mullions along z.
          if (z % 3 === 0) block = "gray_concrete";
          else { block = "light_blue_stained_glass_pane"; props = { north: "true", south: "true", east: "false", west: "false" }; }
        } else if (z === D - 1) {
          // Back: mullions along x.
          if (x % 3 === 0) block = "gray_concrete";
          else { block = "light_blue_stained_glass_pane"; props = { east: "true", west: "true", north: "false", south: "false" }; }
        }
      } else if (rel === 4 && z === 0) {
        block = "red_concrete"; // fascia sign band on the street front
      }

      setb(x, y, z, block, props);
    }

    // Front entrance: door at x=12, canopy over x 10..14, lanterns under canopy.
    if (z === 0) {
      if (x === 12 && gr + 2 < roofY) {
        setb(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        setb(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      }
      if (x >= 10 && x <= 14 && gr + 3 < roofY) {
        setb(x, gr + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
      if ((x === 10 || x === 14) && gr + 2 < roofY) {
        setb(x, gr + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }

    // Cornice coping and parapet on the perimeter.
    if (roofY < H) setb(x, roofY, z, "stone_bricks");
    setb(x, roofY + 1, z, "stone_brick_wall");
  } else {
    // Interior: roof slab only, air above the floor.
    setb(x, roofY, z, "smooth_stone");

    // Warm lights just behind the front glass.
    if (z === 1 && [5, 9, 15, 19].includes(x) && gr + 2 < roofY) {
      setb(x, gr + 2, z, "glowstone");
    }

    // Roof equipment: two small plant boxes.
    if ((x === 6 || x === 18) && (z === 5 || z === 6)) {
      setb(x, roofY + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
