import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1340538538";
const W = 49, H = 19, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), gr);
const inside = (x, z) => groundOf.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Era/type decision: no record, so read it as a 1980s-90s single-storey
// commercial hall in Xinyi: white tile/concrete walls, a glazed shopfront
// band with white piers, a red fascia sign band with warm shroomlights,
// a stone cornice and parapet, and a flat roof with a few AC plants.
// Roof reads about 7 blocks above the lowest ground.

for (const [x, z, gr0] of cells) {
  const b = Math.max(0, gr0);                 // ground top under this cell
  const top = Math.max(7, b + 6);             // roof surface (exclusive)
  const Hh = top - b;                         // rows of building above ground

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const exN = !inside(x, z - 1);
  const exS = !inside(x, z + 1);
  const exW = !inside(x - 1, z);
  const exE = !inside(x + 1, z);
  const edge = exN || exS || exW || exE;

  // Floor slab per storey (ground floor)
  put(x, b, z, "smooth_stone");

  // Roof slab / parapet level
  if (!edge) {
    const skylight = x % 10 === 5 && z % 8 === 4;
    put(x, top - 1, z, skylight ? "glass" : "gray_concrete");
    // Roof plant: small AC blocks
    if (x % 12 === 6 && z % 9 === 5) put(x, top, z, "iron_block");
  }

  if (!edge) continue;

  // Facade face and index along it
  let face, idx;
  if (exS) { face = "S"; idx = x; }
  else if (exN) { face = "N"; idx = x; }
  else if (exE) { face = "E"; idx = z; }
  else { face = "W"; idx = z; }

  // Outward and interior-neighbour offsets
  const out = { S: [0, 1, "north"], N: [0, -1, "south"], E: [1, 0, "west"], W: [-1, 0, "east"] }[face];
  const facing = { S: "south", N: "north", E: "east", W: "west" }[face];
  const inX = x - out[0], inZ = z - out[1]; // interior neighbour

  const isPier = idx % 4 === 0;
  const isDoor = (face === "S" || face === "N") && idx % 16 === 8;

  for (let r = 0; r < Hh; r++) {
    const y = b + r;

    if (r === 0) {
      put(x, y, z, "stone_bricks");                       // base course
      continue;
    }

    if (r <= 3) {
      // Shopfront band
      if (isDoor && r <= 2) {
        put(x, y, z, "oak_door", {
          facing,
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isPier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane");
        // Warm light behind some shop windows
        if (r === 2 && idx % 6 === 2 && inside(inX, inZ)) {
          put(inX, y, inZ, "glowstone");
        }
      }
      continue;
    }

    if (r === 4) {
      // Red fascia sign band with shroomlight accents
      put(x, y, z, idx % 6 === 3 ? "shroomlight" : "red_concrete");
      continue;
    }

    if (r === Hh - 2) {
      // Stone cornice
      put(x, y, z, "smooth_stone");
      continue;
    }

    if (r === Hh - 1) {
      // Parapet cap
      put(x, y, z, isPier ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    // Upper window band (only when the building is taller than one hall storey)
    if (isPier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
