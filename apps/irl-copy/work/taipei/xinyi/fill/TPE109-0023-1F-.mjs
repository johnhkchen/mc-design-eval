import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Shin Kong Mitsukoshi A11 (2020): a long, low-rise mall podium. Cream-white
// precast facades with a stone base, glass shopfront bands, a quartz cornice and
// parapet, and a skylit atrium running the length of the roof. The lidar roof is
// about 7 blocks above the lowest ground, so the design is one 5-block storey
// plus a 2-block parapet. Downhill cells get stone foundations down to y 0.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE109-0023-1F-";
const W = 62, H = 19, D = 204;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Set(cells.map(([x, z]) => key(x, z)));
const inFP = (x, z) => fp.has(key(x, z));
const isPerimeter = (x, z) =>
  !inFP(x - 1, z) || !inFP(x + 1, z) || !inFP(x, z - 1) || !inFP(x, z + 1);

// Writes only inside the volume; props are optional.
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Atrium: central skylit well running along the long axis.
const inAtrium = (x, z) =>
  Math.abs(x - 30.5) <= 5 && z >= 10 && z <= D - 11;

// Entrance on the low-z face, centred on the long side.
const inEntranceSpan = (x) => x >= 27 && x <= 34;
const entranceFace = (x, z) => !inFP(x, z - 1) && x >= 25 && x <= 36;

for (const [x, z, ground] of cells) {
  const G = ground;

  // Foundation from y 0 up to the cell's ground, so nothing floats on a slope.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // Floor / base course at the cell's ground level.
  const perim = isPerimeter(x, z);
  put(x, G, z, perim ? "polished_granite" : "smooth_stone");

  if (perim) {
    const wallX = !inFP(x, z - 1) || !inFP(x, z + 1); // wall runs along x
    const wallZ = !inFP(x - 1, z) || !inFP(x + 1, z); // wall runs along z
    const corner = wallX && wallZ;
    const pier = corner || (wallX ? x % 4 === 0 : z % 4 === 0);

    // Entrance: framed doorway with glass-lit lintel and piers either side.
    if (entranceFace(x, z)) {
      if (inEntranceSpan(x)) {
        // Open doorway, recessed under a white lintel.
        for (let dy = 1; dy <= 3; dy++) put(x, G + dy, z, "air");
        put(x, G + 4, z, "light_gray_concrete");
      } else {
        // Flanking piers framing the entrance.
        for (let dy = 1; dy <= 3; dy++) put(x, G + dy, z, "white_concrete");
        put(x, G + 4, z, "white_concrete");
      }
    } else {
      // Shopfront band (G+1..G+3): glass panes between white piers.
      for (let dy = 1; dy <= 3; dy++) {
        if (pier) {
          put(x, G + dy, z, "white_concrete");
        } else if (dy === 2 && (x + z) % 9 === 4) {
          // Warm light behind the glass.
          put(x, G + dy, z, "glowstone");
        } else {
          const connect = wallX
            ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
            : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
          put(x, G + dy, z, "glass_pane", connect);
        }
      }
      // Storey line.
      put(x, G + 4, z, "white_concrete");
    }

    // Cornice, darker parapet band for a shadow line, and cap slab.
    put(x, G + 5, z, "smooth_quartz");
    put(x, G + 6, z, "light_gray_concrete");
    put(x, G + 7, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  } else {
    // Interior: floor at G, air above, roof deck at G+5 (skylight over the atrium).
    if (inAtrium(x, z)) {
      put(x, G + 5, z, "light_blue_stained_glass");
    } else {
      put(x, G + 5, z, "light_gray_concrete");

      // Roof plant: grouped 2x2 HVAC rooms on a loose grid.
      const px = x % 4, pz = z % 6;
      if ((px === 1 || px === 2) && (pz === 1 || pz === 2) &&
          ((Math.floor(x / 4) + Math.floor(z / 6)) % 4 === 0)) {
        put(x, G + 6, z, "iron_block");
      }
      // Rooftop garden at the south end.
      if (z > 160 && (x + z) % 3 === 0) {
        put(x, G + 6, z, "moss_block");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
