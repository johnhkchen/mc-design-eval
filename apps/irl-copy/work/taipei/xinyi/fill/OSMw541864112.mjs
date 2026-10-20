import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Xinyi-district commercial block (c. 1980s-90s):
// white-tiled concrete frame, stone-brick base and cornice, tinted glass
// with frames, a shopfront ground floor, a central entrance with canopy,
// and a parapet with rooftop units. Roof sits at y = 11 above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541864112";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 10;
const ROOF_Y = 11;
const FLOOR_Y = 5;     // first-floor slab / storey line
const DECK_Y = 10;     // second-floor slab / roof deck / cornice course

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// footprint map: key -> ground height (clamped to the record's range)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(Math.round(gr), 11)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gr_of = (x, z) => ground.get(`${x},${z}`);

// number of exposed sides (missing footprint neighbours)
const exposure = (x, z) =>
  (!has(x - 1, z) ? 1 : 0) + (!has(x + 1, z) ? 1 : 0) +
  (!has(x, z - 1) ? 1 : 0) + (!has(x, z + 1) ? 1 : 0);

// entrance on the south (max z) face, centred
let maxZ = -1;
for (const k of ground.keys()) maxZ = Math.max(maxZ, Number(k.split(",")[1]));
let doorX = Math.floor(W / 2);
if (!(has(doorX, maxZ) && exposure(doorX, maxZ) > 0)) {
  for (let x = 0; x < W; x++) if (has(x, maxZ) && exposure(x, maxZ) > 0) { doorX = x; break; }
}
const doorCell = `${doorX},${maxZ}`;

const isWindowCell = (x, z) => exposure(x, z) === 1 && (x + z) % 3 !== 0;
const isGlassLightCell = (x, z) => isWindowCell(x, z) && (x + z) % 6 === 1;

// 1. foundations, floors, decks, walls and facade
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const perim = exposure(x, z) > 0;

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  // floor slab at storey line, deck at second-floor level (interior and perimeter)
  if (FLOOR_Y >= gr) S(x, FLOOR_Y, z, "smooth_stone");
  if (DECK_Y >= gr && !perim) S(x, DECK_Y, z, "smooth_stone");

  if (!perim) continue;

  for (let y = gr; y <= ROOF_Y; y++) {
    let id = "white_concrete";
    let props;
    if (y === gr) {
      id = "stone_bricks";                                  // base course
    } else if (y === FLOOR_Y) {
      id = "smooth_stone";                                  // storey line
    } else if (y === DECK_Y) {
      id = "stone_bricks";                                  // cornice course
    } else if (y === ROOF_Y) {
      id = "stone_bricks";                                  // parapet cap
    } else if (y < FLOOR_Y) {
      // ground-floor shopfront band (above base course)
      if (exposure(x, z) === 1 && y >= gr + 1 && y <= FLOOR_Y - 1) {
        id = "light_blue_stained_glass_pane";
        if (exposure(x, z) === 1 && (x + z) % 3 === 0) id = "white_concrete";
      }
    } else if (y >= FLOOR_Y + 1 && y <= DECK_Y - 1) {
      // upper storey: tinted glass with white frames
      if (isWindowCell(x, z) && y >= FLOOR_Y + 1 && y <= DECK_Y - 2) {
        id = "gray_stained_glass_pane";
      }
    }
    S(x, y, z, id, props);
  }
}

// 2. entrance: double-height door, lintel and canopy on the south face
if (has(doorX, maxZ)) {
  const gd = gr_of(doorX, maxZ);
  S(doorX, gd, maxZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  S(doorX, gd + 1, maxZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  S(doorX, gd + 2, maxZ, "stone_bricks");                  // canopy lintel over door
  // flanking pilasters on the ground floor
  for (const dx of [-1, 1]) {
    if (has(doorX + dx, maxZ)) {
      for (let y = gr_of(doorX + dx, maxZ); y <= gd + 2; y++) {
        S(doorX + dx, y, maxZ, "white_concrete");
      }
    }
  }
}

// 3. warm light behind selected upper windows (glowstone / shroomlight)
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isGlassLightCell(x, z) || 7 < gr) continue;
  // inward neighbour: a footprint cell that is not on the perimeter
  const nbrs = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];
  for (const [nx, nz] of nbrs) {
    if (has(nx, nz) && exposure(nx, nz) === 0) {
      S(nx, 7, nz, (x + z) % 12 === 1 ? "shroomlight" : "glowstone");
      break;
    }
  }
}

// 4. roof equipment: a few rooftop units on the deck, kept off the parapet
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (exposure(x, z) !== 0 || gr > DECK_Y) continue;
  if (x >= 3 && x <= 8 && z >= 3 && z <= 6 && (x + z) % 4 === 1) {
    S(x, ROOF_Y, z, "iron_block");
  }
}

// keep the entrance clear of any roof units and warm glass behind the door
S(doorX, ROOF_Y, maxZ, "air");

g.save(`${DIR}/${ID}.nbt`);
