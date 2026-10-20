import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339253344";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 19, D = 11;
const g = new Voxels([W, H, D]);

// Ground per footprint cell, clamped so the single storey and roof stay above it.
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(gr, 5)));
}
const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const isPerimeter = (x, z) => !(has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z));
const nearPerimeter = (x, z) => isPerimeter(x - 1, z) || isPerimeter(x + 1, z) || isPerimeter(x, z - 1) || isPerimeter(x, z + 1);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pane connection props: glass panes in a continuous shopfront / clerestory grid.
const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Roof deck at y=5, parapet top at y=6 (7 blocks above lowest ground).
const DECK_Y = 5;
const PARAPET_Y = 6;
const CORNICE_Y = 5;
const DOOR_X = 6;

for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const gr = G(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isPerimeter(x, z)) {
    // Interior: ground floor slab, air above, roof deck.
    put(x, gr, z, "smooth_stone");
    put(x, DECK_Y, z, "smooth_stone");

    // Warm light behind the shopfront glass, on the inner ring only.
    if (nearPerimeter(x, z) && (x + z) % 4 === 0 && gr + 2 <= 4) {
      put(x, gr + 2, z, "glowstone");
    }

    // Hanging lantern under the deck at the entrance axis.
    if (x === DOOR_X && z === D - 2 && gr <= 4) {
      put(x, 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    }

    // Rooftop air-conditioning plinths.
    if (x % 4 === 2 && z % 4 === 1 && x >= 2 && x <= 9 && z >= 2 && z <= 8) {
      put(x, PARAPET_Y, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter wall: determine outward face (first match wins for corners).
  let face, along;
  if (!has(x, z - 1)) { face = "north"; along = x; }
  else if (!has(x, z + 1)) { face = "south"; along = x; }
  else if (!has(x - 1, z)) { face = "west"; along = z; }
  else { face = "east"; along = z; }

  const zFacing = face === "north" || face === "south";

  for (let y = gr; y <= 4; y++) {
    // Entrance door on the south frontage, centre bay.
    if (face === "south" && along === DOOR_X && (y === gr + 1 || y === gr + 2) && y <= 4) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (y === gr) {
      // Base course.
      put(x, y, z, "stone_bricks");
    } else if (y === 3) {
      // Red-tile fascia / canopy band over the shopfronts.
      put(x, y, z, "red_concrete");
    } else if (y === 4) {
      // Clerestory glazing with pillars.
      const pillar = along % 3 === 0;
      if (pillar) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", PANE);
    } else if (y > gr && y <= 2) {
      // Shopfront glazing with frame pillars.
      const pillar = along % 3 === 0;
      if (pillar) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", PANE);
    } else {
      // Remaining wall (e.g. raised ground cell): plain cream tile.
      put(x, y, z, "smooth_quartz");
    }
  }

  // Cornice band and parapet.
  put(x, CORNICE_Y, z, "smooth_stone");
  put(x, PARAPET_Y, z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
