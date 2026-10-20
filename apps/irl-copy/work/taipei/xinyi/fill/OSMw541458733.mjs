import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded low-rise: a two-storey 1980s Xinyi shophouse-style concrete block.
// Ground floor shopfront with glass bays and a central entrance, upper storey with
// white-piered tinted windows, a white roof line, a parapet with cap, and rooftop
// water tank and plant. Roof deck sits at y=10, parapet to y=12, cap at y=13.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458733";
const W = 18, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), Math.round(gr));
const has = (x, z) => fp.has(key(x, z));

// Neighbours outside the footprint (edge cells of the outline).
function missing(x, z) {
  const m = [];
  if (!has(x - 1, z)) m.push([-1, 0]);
  if (!has(x + 1, z)) m.push([1, 0]);
  if (!has(x, z - 1)) m.push([0, -1]);
  if (!has(x, z + 1)) m.push([0, 1]);
  return m;
}
const isInterior = (x, z) => has(x, z) && missing(x, z).length === 0;

const DOOR_LOWER = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };
const LANTERN = { hanging: "true", waterlogged: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };

// Pass 1: wall cells (outer ring) and foundations, interior floors.
for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);

  // Foundation under every cell, up to its own ground level.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const m = missing(x, z);

  if (m.length === 0) {
    // Interior: ground slab, storey floor, roof deck. Air otherwise (no interiors).
    g.set(x, gr, z, "smooth_stone");
    if (gr < 5) g.set(x, 5, z, "smooth_stone");
    g.set(x, 10, z, "smooth_stone");
    // Warm hanging lanterns on the ground floor ceiling, spaced on a grid.
    if (gr < 4 && x % 4 === 2 && z % 4 === 2) g.set(x, 4, z, "lantern", LANTERN);
    continue;
  }

  const corner = m.length >= 2;
  const pier = corner || (x + z) % 3 === 0;
  const [dx, dz] = m[0];
  const front = dx === 0 && dz === -1; // north face, the street-facing entrance side
  const entrance = front && x === 8;
  const sign = front && x >= 6 && x <= 11;

  for (let y = gr; y <= 12; y++) {
    if (y === gr) {
      // Base course.
      g.set(x, y, z, "polished_andesite");
    } else if (y <= 3) {
      // Ground-floor shopfront.
      if (pier) g.set(x, y, z, "stone_bricks");
      else if (entrance && y <= gr + 2) g.set(x, y, z, "oak_door", y === gr + 1 ? DOOR_LOWER : DOOR_UPPER);
      else g.set(x, y, z, "light_blue_stained_glass");
    } else if (y === 4) {
      // Beam / fascia; red sign band over the entrance.
      g.set(x, y, z, sign ? "red_concrete" : "white_concrete");
    } else if (y === 5) {
      // Storey line.
      g.set(x, y, z, "white_concrete");
    } else if (y === 6) {
      g.set(x, y, z, pier ? "white_concrete" : "light_gray_concrete");
    } else if (y === 7 || y === 8) {
      // Upper windows between white piers; tinted glass.
      g.set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
    } else if (y === 9) {
      g.set(x, y, z, pier ? "white_concrete" : "light_gray_concrete");
    } else if (y === 10) {
      // Roof line.
      g.set(x, y, z, "white_concrete");
    } else {
      // Parapet, y 11..12.
      g.set(x, y, z, "white_concrete");
    }
  }

  // Parapet cap.
  g.set(x, 13, z, "smooth_stone_slab", SLAB_BOTTOM);
}

// Pass 2: warm light behind upper windows, and rooftop plant.
for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);
  const m = missing(x, z);
  if (m.length === 0 || m.length >= 2) continue;
  const [dx, dz] = m[0];
  const front = dx === 0 && dz === -1;
  const pier = (x + z) % 3 === 0;
  const entrance = front && x === 8;
  if (pier || entrance) continue;
  if (gr > 6) continue;
  if ((x + z) % 6 !== 1) continue;
  // Interior cell directly behind this window, one step inward.
  const ix = x - dx, iz = z - dz;
  if (isInterior(ix, iz)) g.set(ix, 7, iz, "glowstone");
}

// Rooftop: a water tank and a plant unit on the roof deck (y=10).
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (!isInterior(x, z)) continue;
  if ((x === 4 || x === 5) && (z === 3 || z === 4)) {
    g.set(x, 11, z, "gray_concrete");
    g.set(x, 12, z, "gray_concrete");
  } else if ((x === 12 || x === 13) && z === 7) {
    g.set(x, 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
