import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3395525";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 3, H = 14, D = 8;
const g = new Voxels([W, H, D]);

const BRICK = "bricks";
const BASE = "stone_bricks";
const FOUND = "stone_bricks";
const TRIM = "stone_brick_slab";
const CORNICE = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane";

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const doorX = Math.round((minX + maxX) / 2);
const doorZ = minZ;

// Window bays along the long sides: every other cell, away from corners.
const isBay = (x, z) =>
  (x === minX || x === maxX) && z > minZ && z < maxZ && (z - minZ) % 2 === 0;

// Per-cell parameters from the lidar record.
const info = new Map();
for (const [x, z, ground, roof] of cells) {
  const b = Math.max(0, Math.min(H - 6, Math.round(ground)));
  // Lidar roof is about 2 blocks above the lowest ground; use it, with a 3-block minimum.
  const top = Math.min(H - 3, Math.max(Math.round(roof), b + 3));
  info.set(`${x},${z}`, { b, top });
}

for (const [x, z] of cells) {
  const { b, top } = info.get(`${x},${z}`);
  const perim = x === minX || x === maxX || z === minZ || z === maxZ;
  const isDoor = x === doorX && z === doorZ;

  // Foundation up to ground, then base course.
  for (let y = 0; y < b; y++) g.set(x, y, z, FOUND);
  g.set(x, b, z, BASE);

  // Walls from b+1 up to top-1, with cornice at top-1.
  for (let y = b + 1; y < top; y++) {
    const rel = y - b;
    const isCornice = y === top - 1;

    if (perim) {
      if (isCornice) { g.set(x, y, z, CORNICE); continue; }

      // Door: two-high iron door with stone lintel above it.
      if (isDoor && rel <= 2) {
        g.set(x, y, z, "iron_door", {
          facing: "south",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (isDoor && rel === 3) { g.set(x, y, z, TRIM); continue; }

      // Framed window: glass in the middle band, stone trim above and below.
      if (isBay(x, z) && rel === 1) { g.set(x, y, z, GLASS); continue; }
      if (isBay(x, z) && rel === 2 && top - b >= 3) {
        g.set(x, y, z, top - b >= 4 ? GLASS : TRIM);
        continue;
      }

      // End wall window centred over the door bay.
      if (z === maxZ && x === doorX && rel === 1) { g.set(x, y, z, GLASS); continue; }

      g.set(x, y, z, BRICK);
    } else {
      // Interior: air behind glass, with a floor slab if the storey is tall enough.
      if (rel === 2 && top - b >= 4) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom" });
      }
      // Warm light in one window.
      else if (rel === 1 && x === maxX - 1 && (z - minZ) === 2) {
        g.set(x, y, z, "shroomlight");
      }
    }
  }

  // Roof slab at top: smooth stone, which reads as a flat parapet roof.
  g.set(x, top, z, CORNICE);
}

// Two roof vent stacks over the interior cross-section.
for (const [x, z] of cells) {
  const { top } = info.get(`${x},${z}`);
  if (x === doorX && (z === minZ + 2 || z === maxZ - 2) && top + 2 <= H - 1) {
    g.set(x, top + 1, z, "iron_block");
    g.set(x, top + 2, z, "iron_bars");
  }
}

// Lantern sconce on the door wall beside the entrance, set into the wall face.
{
  const { b } = info.get(`${doorX},${doorZ}`);
  const sideX = doorX === minX ? maxX : minX;
  if (info.has(`${sideX},${doorZ}`)) {
    g.set(sideX, b + 2, doorZ, "lantern", { hanging: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
