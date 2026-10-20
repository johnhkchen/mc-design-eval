import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682871";
const W = 15, H = 23, D = 11;

// Two-storey mid-century commercial block: white concrete frame, shopfront at grade,
// tinted glass upper storey, quartz cornice and parapet, flat roof with plant box.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Entrance: centre of the south-most footprint cell on the middle column.
const DOOR_X = 7;
let DOOR_Z = -1;
for (const [x, z] of cells) if (x === DOOR_X && z > DOOR_Z) DOOR_Z = z;

const g = new Voxels([W, H, D]);

for (const [x, z, gr] of cells) {
  const edgeN = !has(x, z - 1), edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z), edgeE = !has(x + 1, z);
  const edgeZ = edgeN || edgeS, edgeX = edgeW || edgeE;
  const edge = edgeZ || edgeX;
  const corner = edgeZ && edgeX;
  const alongX = edgeN || edgeS;          // wall runs along the x axis
  const along = alongX ? x : z;
  const pillar = corner || along % 3 === 0;
  const paneP = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slabs per storey and roof deck; air otherwise.
    g.set(x, 5, z, "light_gray_concrete");
    g.set(x, 10, z, "smooth_stone");
    if (x >= 5 && x <= 9 && z >= 3 && z <= 7) {
      g.set(x, 11, z, "light_gray_concrete");
      g.set(x, 12, z, "light_gray_concrete");
    }
    continue;
  }

  const isDoor = x === DOOR_X && z === DOOR_Z;

  for (let y = gr + 1; y <= 11; y++) {
    if (isDoor) {
      if (y === gr + 1) {
        g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === gr + 2) {
        g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === gr + 3) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
    }

    let b = null, props;
    if (y === 5) {
      b = "light_gray_concrete";                 // storey line / spandrel
    } else if (y === 10) {
      b = "smooth_quartz";                        // cornice
    } else if (y === 11) {
      b = corner ? "smooth_quartz" : "white_concrete"; // parapet
    } else if (y <= 4) {
      // Ground storey shopfront
      if (pillar) b = "white_concrete";
      else if (y === 4) b = "stone_bricks";      // fascia
      else { b = "glass_pane"; props = paneP; }
    } else {
      // Upper storey: tinted curtain-glass bays, warm lit bays at y 7
      if (pillar) b = "white_concrete";
      else if (y === 7 && along % 6 === 1) b = "glowstone";
      else { b = "light_blue_stained_glass_pane"; props = paneP; }
    }

    if (b) {
      if (props) g.set(x, y, z, b, props);
      else g.set(x, y, z, b);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
