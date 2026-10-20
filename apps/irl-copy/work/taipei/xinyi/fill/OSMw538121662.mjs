import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s-era Xinyi commercial block: granite plinth, pale quartz and concrete
// spandrels, blue-glass ribbon windows on mullions, cornice, parapet, rooftop plant box.
// Two storeys of five blocks (ground 0-4, upper 5-9), cornice at 10, roof deck at 11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121662";
const W = 18, H = 23, D = 21;
const ROOF = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.min(ROOF - 1, Math.max(0, gr)));

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const missingX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const missingZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const isPerim = (x, z) => missingX(x, z) || missingZ(x, z);

// Entrance: middle of the north-most row (smallest z), facing outward (north).
const minZ = Math.min(...cells.map(([, z]) => z));
const rowXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const DOOR_X = rowXs[Math.floor(rowXs.length / 2)];
const DOOR_Z = minZ;

const g = new Voxels([W, H, D]);

const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

function perimBlock(x, z, y, gr) {
  const corner = missingX(x, z) && missingZ(x, z);
  const sideX = missingX(x, z) && !missingZ(x, z); // wall normal runs along x
  const idx = sideX ? z : x;
  const pillar = corner || idx % 3 === 0;
  const pane = sideX ? paneX : paneZ;

  if (y === gr) return ["polished_granite"];                 // base course
  if (y <= 4) {                                              // ground-floor shopfront
    if (y === 4) return ["light_gray_concrete"];             // lintel band
    return pillar ? ["smooth_quartz"] : ["light_blue_stained_glass_pane", pane];
  }
  if (y === 5) return ["smooth_quartz"];                     // storey line
  if (y >= 6 && y <= 8) {                                    // upper windows
    return pillar ? ["smooth_quartz"] : ["light_blue_stained_glass_pane", pane];
  }
  if (y === 9) return ["light_gray_concrete"];               // spandrel
  if (y === 10) return ["smooth_quartz"];                    // cornice
  return ["light_gray_concrete"];                            // parapet 11-12
}

// Foundation and shell
for (const [x, z, gr] of cells) {
  // Foundation under the cell up to its ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  for (let y = gr; y <= ROOF; y++) {
    if (!perim) {
      // Interior: floor slabs per storey and roof deck, air elsewhere
      if (y === gr) g.set(x, y, z, "smooth_quartz");
      else if (y === 5 || y === 10) g.set(x, y, z, "smooth_quartz");
      else if (y === ROOF) g.set(x, y, z, "gray_concrete");
      else if (y === 7 && (x * 7 + z * 3) % 9 === 0) g.set(x, y, z, "glowstone");
      continue;
    }

    // Entrance
    if (x === DOOR_X && z === DOOR_Z && y === gr) {
      g.set(x, y, z, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
      continue;
    }
    if (x === DOOR_X && z === DOOR_Z && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    const [name, props] = perimBlock(x, z, y, gr);
    if (props) g.set(x, y, z, name, props);
    else g.set(x, y, z, name);
  }

  // Parapet above roof line on the perimeter
  if (perim) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
  }
}

// Rooftop plant box, centred, with iron-bar vents on top
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (x >= 6 && x <= 11 && z >= 7 && z <= 13) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
    g.set(x, ROOF + 3, z, (x + z) % 2 === 0 ? "iron_bars" : "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
