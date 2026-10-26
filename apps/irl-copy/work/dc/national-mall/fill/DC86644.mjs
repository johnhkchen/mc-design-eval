import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86644.cells.json", "utf8"));

const W = 15, H = 20, D = 7;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map(cells.map(c => [key(c[0], c[1]), c]));
const has = (x, z) => map.has(key(x, z));

const xs = cells.map(c => c[0]);
const zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

// Entrance on the north (street) face, centred on that frontage.
const northXs = cells.filter(c => !has(c[0], c[1] - 1)).map(c => c[0]).sort((a, b) => a - b);
const doorX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : Math.floor((minX + maxX) / 2);

for (const [x, z, gr0, rf0] of cells) {
  const gr = Math.max(0, Math.round(gr0));
  // Smoothed flat roof from lidar, kept inside the build height.
  const R = Math.min(18, Math.max(gr + 6, Math.round(rf0)));
  const top = R - 1; // cornice / roof cap course

  const exN = !has(x, z - 1), exS = !has(x, z + 1);
  const exW = !has(x - 1, z), exE = !has(x + 1, z);
  const exposed = [exN, exS, exW, exE].filter(Boolean).length;
  const perimeter = exposed > 0;
  const corner = (exN || exS) && (exW || exE);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Base course at street level.
  g.set(x, gr, z, "polished_granite");

  // Floor slabs per storey (span the interior, rest on perimeter walls).
  for (let y = gr + 3; y < top; y += 3) {
    g.set(x, y, z, perimeter ? "stone_bricks" : "smooth_stone");
  }

  // Roof cap / parapet course.
  g.set(x, top, z, perimeter ? "stone_bricks" : "smooth_stone");

  // Roof equipment on the interior of the flat roof.
  if (!perimeter && R <= 17 && x >= 5 && x <= 9 && z >= 2 && z <= 4 && (x + z) % 2 === 0) {
    g.set(x, R, z, "iron_block");
  }

  if (perimeter) {
    // Piers: corners always; along N/S faces every third column, along E/W faces every third row.
    const pierHere = corner ||
      ((exN || exS) && (x - minX) % 3 === 0) ||
      ((exE || exW) && (z - minZ) % 3 === 0);

    for (let y = gr + 1; y < top; y++) {
      const rel = y - gr;
      if (rel % 3 === 0) {
        // Storey line band.
        g.set(x, y, z, "polished_andesite");
        continue;
      }
      const isGround = rel <= 2;

      // Entrance: door on north face, with a glazed transom above.
      if (isGround && exN && x === doorX && !corner) {
        if (rel === 1) {
          g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else {
          g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        }
        continue;
      }

      if (pierHere) {
        g.set(x, y, z, isGround ? "stone_bricks" : "bricks");
        continue;
      }

      // Window bays: glazing inside brick reveal.
      g.set(x, y, z, "glass_pane");
    }
  }

  // Warm lights set back behind the glazing on the interior.
  if (!perimeter) {
    if (gr + 1 < top && z === 1 && x % 3 === 1) {
      g.set(x, gr + 1, z, "glowstone");
    }
    if (gr + 4 < top && z === 1 && x % 3 === 2) {
      g.set(x, gr + 4, z, "shroomlight");
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86644.nbt");
