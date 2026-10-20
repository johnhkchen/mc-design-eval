import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw662834855";
const W = 85, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const key = (x, z) => x + "," + z;
const ground = new Map();
let B = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  if (gr < B) B = gr;
}
const has = (x, z) => ground.has(key(x, z));

// Level-roof profile, 2 storeys + parapet, top exclusive at B + 11
const R = B + 11;          // roof/parapet top (exclusive)
const F0 = B + 5;          // first-floor line (ground storey is B..B+4)
const ROOF_DECK = B + 9;   // roof deck / cornice level
const PARAPET = B + 10;    // top course of parapet

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which outward face an edge cell sits on (null = interior)
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

// Inward offset from an edge cell (toward the building interior)
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Glass pane connection props so panes read as a continuous window wall
const paneProps = (face) =>
  face === "N" || face === "S"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const BAY = 4; // pier every 4 blocks along each facade

// Pass 1: foundations, roof deck, floor slabs, rooftop plant (footprint only)
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  const edge = faceOf(x, z);
  if (!edge) {
    // interior: floor slab at first floor, roof deck at cornice level
    if (F0 > gr) put(x, F0, z, "light_gray_concrete");
    if (ROOF_DECK > gr) put(x, ROOF_DECK, z, "light_gray_concrete");
    // rooftop plant boxes and a few units
    if (x % 11 === 5 && z % 7 === 3 && ROOF_DECK > gr) {
      put(x, PARAPET, z, "iron_block");
    }
  }
}

// Pass 2: facade walls, shopfronts, windows, doors, lights (edge cells)
for (const [x, z, gr] of cells) {
  const face = faceOf(x, z);
  if (!face) continue;

  const along = face === "N" || face === "S" ? x : z;
  const pier = along % BAY === 0;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  const innerOK = has(ix, iz);

  for (let y = gr; y < R; y++) {
    if (y < F0) {
      // Ground storey: shopfront
      let id;
      if (y === gr) id = "polished_andesite";              // base course
      else if (y === F0 - 1) id = pier ? "polished_andesite" : "red_concrete"; // sign band
      else if (pier) id = "polished_andesite";
      else if (y === F0 - 2 && along % 8 === 2 && gr < F0 - 2) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      } else id = "glass";
      put(x, y, z, id);
    } else if (y === PARAPET) {
      put(x, y, z, "smooth_quartz");                       // parapet cap
    } else if (y === ROOF_DECK) {
      put(x, y, z, "quartz_block");                        // cornice
    } else if (y === F0) {
      put(x, y, z, "smooth_quartz");                       // floor band
    } else {
      // Upper storey: window bays
      if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
        // warm light behind some windows, inside the air gap
        if (innerOK && along % 8 === 5 && y === F0 + 2) {
          put(ix, y, iz, "shroomlight");
        }
      }
    }
  }
}

// Pass 3: entrance doors on the north (street) face
for (const [x, z, gr] of cells) {
  if (faceOf(x, z) !== "N") continue;
  const along = x;
  if ((along === 22 || along === 62) && gr <= B + 2) {
    put(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

g.save(`${DIR}/${ID}.nbt`);
