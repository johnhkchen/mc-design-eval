import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3414822.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3414822.nbt";

const W = 5, H = 15, D = 11;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const inside = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inside(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Street face is x = 0 (the 11-long side). Entrance centred at z = 5.
const ENTRY_Z = 5;

const DOOR = (half) => ({
  facing: "west", half, hinge: "left", open: "false", powered: "false",
});

function faceOf(x, z) {
  if (x === 0) return "west";
  if (x === W - 1) return "east";
  if (z === 0) return "north";
  if (z === D - 1) return "south";
  return null;
}

// Glazing rules for perimeter walls on pane rows (one row per storey).
function isGlass(face, x, z) {
  if (face === "west") return [2, 3, 4, 6, 7, 8].includes(z);
  if (face === "east") return [2, 4, 6, 8].includes(z);
  if (face === "north" || face === "south") return x === 1 || x === 3;
  return false;
}

// Warm light just inside selected windows.
function litInterior(face, x, z) {
  if (face === "west" && (z === 2 || z === 7)) return [1, z];
  if (face === "east" && (z === 4 || z === 8)) return [W - 2, z];
  return null;
}

for (const c of cells) {
  const [x, z, gRaw, rRaw] = c;
  const G = clamp(Math.round(gRaw), 0, 10);
  // Lidar roof plus one course of parapet; at least five blocks of massing.
  const T = clamp(Math.max(Math.round(rRaw) + 1, G + 5), G + 5, 14);

  // Foundation.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  const face = faceOf(x, z);
  const perim = face !== null;
  const isFloor = (y) => y >= G && y <= T - 3 && (y - G) % 2 === 0;

  for (let y = G; y <= T - 1; y++) {
    // Roof slab over every cell, coping on the perimeter.
    if (y === T - 1) {
      put(x, y, z, perim ? "stone_brick_slab" : "smooth_stone");
      continue;
    }
    // Parapet course.
    if (y === T - 2 && perim) {
      put(x, y, z, "bricks");
      continue;
    }
    if (isFloor(y)) {
      if (perim) put(x, y, z, y === G ? "stone_bricks" : "smooth_stone");
      else put(x, y, z, "stone");
      continue;
    }
    if (!perim) continue; // hollow interior air gap

    const paneRow = (y - G) % 2 === 1;
    if (paneRow) {
      if (face === "west" && z === ENTRY_Z) {
        put(x, y, z, "oak_door", DOOR("lower"));
        continue;
      }
      if (isGlass(face, x, z)) {
        put(x, y, z, "glass_pane");
        const lit = litInterior(face, x, z);
        if (lit) {
          put(lit[0], y, lit[1], "glowstone");
        }
        continue;
      }
      put(x, y, z, "bricks");
      continue;
    }

    put(x, y, z, "bricks");
  }

  // Entrance: upper door half, warm lantern just inside.
  if (face === "west" && z === ENTRY_Z) {
    put(x, G + 2, z, "oak_door", DOOR("upper"));
    put(x, G, z, "stone_bricks");
    put(1, G + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }

  // Rooftop bulkhead on the interior of the roof.
  if (!perim && x <= 2 && z >= 3 && z <= 4 && T <= 13) {
    put(x, T, z, "bricks");
  }
}

g.save(OUT);
