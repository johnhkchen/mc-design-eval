import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Read as a 1980s-90s two-storey Xinyi shophouse-style block:
// tiled white walls, quartz storey lines and cornice, a glazed shopfront with a
// red fascia, and a plain parapet roof with an AC plant box. Roof sits 12 blocks above
// the lowest ground (h 0..11 inclusive).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1304288426";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 24, D = 16;
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [x, z, ground] of cells) {
  const gr = ground;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const at = (h) => gr + h;
  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === 0;
  const back = z === D - 1;
  const sideL = x === 0;
  const sideR = x === W - 1;

  // h0: base course across the footprint.
  put(x, at(0), z, "polished_andesite");

  // Ground storey, h1..h4.
  if (perim) {
    if (front) {
      if (sideL || sideR) {
        // Shopfront pillars.
        for (let h = 1; h <= 3; h++) put(x, at(h), z, "smooth_quartz");
        put(x, at(4), z, "smooth_quartz");
      } else if (x === 3) {
        // Entrance door (lower and upper halves), lantern under the fascia.
        put(x, at(1), z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, at(2), z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, at(3), z, "lantern", { hanging: "true" });
        put(x, at(4), z, "red_terracotta");
      } else if (x === 4) {
        // Glass beside the door.
        for (let h = 1; h <= 3; h++) put(x, at(h), z, "light_blue_stained_glass");
        put(x, at(4), z, "red_terracotta");
      } else {
        // Shopfront glazing with red fascia above.
        for (let h = 1; h <= 3; h++) put(x, at(h), z, "light_blue_stained_glass");
        put(x, at(4), z, "red_terracotta");
      }
    } else {
      // Side and back ground-floor walls.
      for (let h = 1; h <= 4; h++) put(x, at(h), z, "white_concrete");
    }
  }

  // Storey line over the ground floor (also the upper floor slab).
  put(x, at(5), z, "smooth_quartz");

  // Upper storey, h6..h8 with windows, h9 lintel band.
  if (perim) {
    let windowHere = false;
    if (front || back) windowHere = (x % 4 === 1 || x % 4 === 2) && x !== 0 && x !== W - 1;
    if (sideL || sideR) windowHere = (z % 4 === 1 || z % 4 === 2) && z >= 1 && z <= 13;

    for (let h = 6; h <= 8; h++) {
      if (windowHere) put(x, at(h), z, "light_blue_stained_glass");
      else put(x, at(h), z, "white_concrete");
    }
    put(x, at(9), z, "smooth_quartz");
  } else {
    // Interior: air gap for the upper storey, with warm lights behind the front glass.
    if (z === 1 && (x === 2 || x === 5)) put(x, at(7), z, "glowstone");
  }

  // Cornice at h10 on the perimeter, roof deck inside.
  if (perim) put(x, at(10), z, "smooth_quartz");
  else put(x, at(10), z, "light_gray_concrete");

  // Parapet at h11 on the perimeter; AC plant box on the roof.
  if (perim) put(x, at(11), z, "white_concrete");
  else if ((x === 2 || x === 3) && (z === 4 || z === 5)) put(x, at(11), z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
