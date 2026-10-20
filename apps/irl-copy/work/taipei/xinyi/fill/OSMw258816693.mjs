import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw258816693";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 42, H = 19, D = 22;
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground level (rounded)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Edge tests against the footprint
const missingX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const missingZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const isEdge = (x, z) => missingX(x, z) || missingZ(x, z);
const isCorner = (x, z) => missingX(x, z) && missingZ(x, z);
// Entrance bay: the south (+z) street frontage, centred on the exit
const isEntrance = (x, z) => !has(x, z + 1) && x >= 15 && x <= 26;
// Pilaster rhythm along the facade (every third cell)
const isPilaster = (x, z) => (x + z) % 3 === 0;
// Entrance door bays and their framing
const isDoorBay = (x) => x >= 19 && x <= 22;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  const entrance = edge && isEntrance(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab / plinth course
  if (edge) {
    put(x, gr, z, "polished_granite");
    put(x, gr + 1, z, "polished_granite"); // taller dark plinth reads as a base
  } else {
    put(x, gr, z, "smooth_quartz");
  }

  // Storey walls: gr+2 .. gr+5 above the plinth
  if (edge) {
    if (corner) {
      // Corner piers run up past the cornice
      for (let y = gr + 2; y <= gr + 6; y++) put(x, y, z, "white_concrete");
    } else if (entrance) {
      if (isDoorBay(x)) {
        // Glazed entrance: clear glass doors behind a light frame
        for (let y = gr + 2; y <= gr + 4; y++) {
          put(x, y, z, x === 19 || x === 22 ? "light_gray_concrete" : "glass");
        }
      } else {
        // Entrance piers: granite jambs running up to the sign band
        for (let y = gr + 2; y <= gr + 6; y++) {
          put(x, y, z, (x === 15 || x === 26) ? "polished_granite" : "white_concrete");
        }
      }
      // Red sign fascia spanning the entrance bay, cornice above
      put(x, gr + 5, z, "red_terracotta");
      put(x, gr + 6, z, "smooth_quartz");
    } else {
      // Spandrel below, cornice band above, glazing between
      put(x, gr + 2, z, "white_concrete");
      put(x, gr + 5, z, "smooth_quartz");
      if (isPilaster(x, z)) {
        // Pilasters project above the cornice for vertical rhythm
        for (let y = gr + 3; y <= gr + 6; y++) put(x, y, z, "white_concrete");
        for (let y = gr + 3; y <= gr + 4; y++) put(x, y, z, "white_concrete");
      } else {
        for (let y = gr + 3; y <= gr + 4; y++) {
          // A few warm lamps behind the glass at dusk
          if (y === gr + 3 && (x * 3 + z) % 7 === 0) put(x, y, z, "glowstone");
          else put(x, y, z, "light_blue_stained_glass_pane");
        }
      }
    }
  }
  // Interior: air gap above the floor slab (no interiors)

  // Warm light behind the entrance glass, inside the footprint
  if (!edge && has(x, z - 1) && !has(x, z + 1) && isDoorBay(x) && z === 20) {
    put(x, gr + 3, z, "glowstone");
  }

  // Roof slab over every cell
  if (!(edge && !corner && (entrance || isPilaster(x, z)) && !isDoorBay(x))) {
    put(x, gr + 6, z, "light_gray_concrete");
  }
  // Parapet on the perimeter
  if (edge) put(x, gr + 7, z, "white_concrete");
}

// Roof plant: a plant block and a skylit stair hall, both on the roof slab
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  // Mechanical plant, west side of the roof
  if (x >= 8 && x <= 13 && z >= 6 && z <= 11) {
    put(x, gr + 7, z, "iron_block");
  }
  // Skylight over the stair hall, east side of the roof
  if (x >= 17 && x <= 23 && z >= 8 && z <= 13) {
    put(x, gr + 7, z, "light_blue_stained_glass");
  }
}

g.save(`${DIR}/${ID}.nbt`);
