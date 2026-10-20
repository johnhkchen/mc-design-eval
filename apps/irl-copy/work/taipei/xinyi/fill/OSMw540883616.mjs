import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883616";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, D = 5, H = 23;
const g = new Voxels([W, H, D]);

// Lowest ground under the footprint anchors the building. Two storeys of 5 blocks,
// a parapet and roof deck bring the top to 11 blocks above that lowest ground.
const minG = Math.min(...cells.map(c => c[2]));
const TOP = minG + 10;      // top block of the roof deck / parapet
const DOOR_X = 4;

const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

// Exterior wall block for a perimeter cell at height offset dy above minG.
// Returns null for nothing, a string id, or [id, state].
function wall(x, z, dy) {
  const front = z === 0, back = z === D - 1;
  const cornerX = x === 0 || x === W - 1;
  const cornerZ = z === 0 || z === D - 1;
  if (cornerX && cornerZ) return "white_concrete";

  if (dy >= 1 && dy <= 3) {
    if (front) {
      if (cornerX) return "white_concrete";
      if (x === DOOR_X) {
        if (dy === 1) return ["dark_oak_door", DOOR_LOWER];
        if (dy === 2) return ["dark_oak_door", DOOR_UPPER];
        return "white_concrete";
      }
      return "light_blue_stained_glass_pane";
    }
    if (back) return x % 2 === 1 ? "light_blue_stained_glass_pane" : "white_concrete";
    // sides
    return z === 2 ? "light_blue_stained_glass_pane" : "white_concrete";
  }

  if (dy === 4) {
    return front ? "red_terracotta" : "white_concrete"; // shopfront fascia / awning band
  }

  if (dy >= 6 && dy <= 8) {
    if (front || back) return x % 2 === 1 ? "light_blue_stained_glass_pane" : "white_concrete";
    return z === 2 ? "light_blue_stained_glass_pane" : "white_concrete";
  }

  if (dy === 9) return "light_gray_concrete"; // upper spandrel
  return "white_concrete";
}

for (const [x, z, gr] of cells) {
  if (gr > TOP) continue;
  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP; y++) {
    const dy = y - minG;

    if (dy === 10) {
      g.set(x, y, z, perim ? "red_terracotta" : "light_gray_concrete");
      continue;
    }
    if (dy === 5) {
      g.set(x, y, z, "smooth_stone"); // storey floor line / band, also interior floor
      continue;
    }
    if (!perim) {
      if (y === gr) g.set(x, y, z, "smooth_stone"); // ground-floor slab inside
      continue;                                    // interior air otherwise
    }
    if (y === gr) {
      g.set(x, y, z, "polished_andesite");          // base course
      continue;
    }
    const w = wall(x, z, dy);
    if (w === null) continue;
    if (typeof w === "string") g.set(x, y, z, w);
    else g.set(x, y, z, w[0], w[1]);
  }
}

// Warm light behind selected windows (interior cells next to the glass).
const lamp = (x, dy, z) => {
  const y = minG + dy;
  if (y >= 0 && y < H) g.set(x, y, z, "glowstone");
};
lamp(3, 7, 1);
lamp(7, 7, 1);
lamp(5, 7, 3);
lamp(1, 7, 3);

// Hanging lantern under the ground-floor slab, visible through the shopfront at dusk.
g.set(DOOR_X, minG + 4, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant box on the roof deck.
for (const x of [2, 3]) {
  const y = TOP + 1;
  if (y < H) g.set(x, y, 2, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
