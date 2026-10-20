import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988703.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988703.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 21, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Two-storey mid-century commercial block: white tiled concrete walls,
// red terracotta storey band and awning, glass shopfront on the street (-z) side,
// framed bays above, flat roof deck with a parapet and rooftop plant.
const ROOF_DECK = 10;   // solid roof deck
const PARAPET = 11;     // top of parapet = roof line (~11 above lowest ground)
const STOREY_LINE = 5;  // first-floor slab / red band
const FRONT_DOOR_U = 10;

const footprint = new Map();
for (const [x, z, gr] of cells) footprint.set(`${x},${z}`, gr);
const inF = (x, z) => footprint.has(`${x},${z}`);
const groundAt = (x, z) => footprint.get(`${x},${z}`);

function set(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function isPerimeter(x, z) {
  return !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
}

for (const [x, z, gr] of cells) {
  const perim = isPerimeter(x, z);
  const front = !inF(x, z - 1);            // street-facing (-z) edge
  const u = (front || !inF(x, z + 1)) ? x : z; // position along the face

  // Foundation under the ground level of this cell
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  // Ground-floor slab
  set(x, gr, z, "smooth_stone");

  // Storey slab (first-floor line)
  if (STOREY_LINE > gr) set(x, STOREY_LINE, z, "smooth_stone");

  // Roof deck
  set(x, ROOF_DECK, z, "smooth_stone");

  // Rooftop plant on some interior cells
  if (!perim && x % 6 === 2 && z % 4 === 1) {
    set(x, 11, z, "light_gray_concrete");
    set(x, 12, z, "light_gray_concrete");
  }

  if (!perim) {
    // Interior: air, with a warm light behind some front-facing window positions
    if (u % 6 === 4) {
      // handled from the perimeter side below
    }
    continue;
  }

  // Exterior walls
  for (let y = gr + 1; y < ROOF_DECK; y++) {
    let id;
    if (y === 5) {
      id = "red_terracotta";                    // storey band
    } else if (front && y <= 4) {
      // Shopfront ground floor
      if (y === 4) id = "red_terracotta";       // awning band
      else if (u === FRONT_DOOR_U && y <= gr + 2) {
        id = "dark_oak_door";
        const props = {
          facing: "north",
          hinge: "left",
          open: "false",
          powered: "false",
          half: y === gr + 1 ? "lower" : "upper",
        };
        set(x, y, z, id, props);
        continue;
      } else if (u % 4 === 0) id = "white_concrete"; // pilaster
      else id = "glass";
    } else if (y === 9) {
      id = "white_concrete";                    // lintel
    } else if (y === 6) {
      id = u % 3 === 0 ? "white_concrete" : "white_concrete"; // sill / spandrel
    } else if (y === 7 || y === 8) {
      id = u % 3 === 0 ? "white_concrete" : "glass_pane"; // framed windows
    } else {
      id = "white_concrete";
    }
    set(x, y, z, id);
  }

  // Base course
  if (gr >= 0) set(x, gr, z, "stone_bricks");

  // Cornice and parapet
  set(x, ROOF_DECK, z, "stone_bricks");
  set(x, PARAPET, z, "white_concrete");
}

// Warm lights behind a few upper windows (interior air gap)
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (!isPerimeter(x, z)) continue;
  const front = !inF(x, z - 1);
  const back = !inF(x, z + 1);
  const west = !inF(x - 1, z);
  const east = !inF(x + 1, z);
  const u = (front || back) ? x : z;
  if (u % 6 !== 4) continue;
  if (front && inF(x, z + 1)) set(x, 7, z + 1, "shroomlight");
  else if (back && inF(x, z - 1)) set(x, 7, z - 1, "shroomlight");
  else if (west && inF(x + 1, z)) set(x + 1, 7, z, "shroomlight");
  else if (east && inF(x - 1, z)) set(x - 1, 7, z, "shroomlight");
}

// Glowstone behind the shopfront glass, a few cells in
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (!isPerimeter(x, z) || inF(x, z - 1)) continue;
  if (!inF(x, z - 1) && x % 8 === 3 && inF(x, z + 1) && !isPerimeter(x, z + 1)) {
    set(x, 2, z + 1, "glowstone");
  }
}

g.save(OUT);
