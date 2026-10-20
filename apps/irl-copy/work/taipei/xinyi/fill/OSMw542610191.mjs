import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record has no metadata. Reading from lidar: roof ~11 blocks above lowest ground,
// so two storeys of ~5 blocks with a cornice and a low parapet.
// Era: 1980s-90s Taipei mid-rise commercial. Pale quartz-clad concrete, tinted
// glass shopfront on the ground floor, a red canopy over the entrance, and a
// flat roof with a small plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610191";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const GROUND = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => GROUND.has(key(x, z));
const ground = (x, z) => GROUND.get(key(x, z));

// A cell is on the facade if any side borders outside the footprint.
const isEdge = (x, z) =>
  !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Entrance: the southern (+z) facade cell nearest the middle of the width.
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!isEdge(x, z) || has(x, z + 1)) continue;
    const d = Math.abs(x - (W - 1) / 2);
    if (d < best) { best = d; doorCell = [x, z]; }
  }
}

const isDoor = (x, z) => doorCell && doorCell[0] === x && doorCell[1] === z;

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-level course: base course on the facade, floor slab inside.
  g.set(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // Storey lines: spandrel on the facade, floor slab inside.
  g.set(x, gr + 5, z, edge ? "smooth_quartz" : "smooth_stone");

  // Roof deck inside; cornice on the facade.
  g.set(x, gr + 10, z, edge ? "quartz_block" : "smooth_stone");

  if (!edge) {
    // Interior: air gap with occasional warm lanterns behind the glass.
    if ((x * 3 + z) % 5 === 0) {
      g.set(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
    if ((x + z * 2) % 7 === 0) {
      g.set(x, gr + 7, z, "shroomlight");
    }
    // Plant box on the roof, centre of the plan.
    if (x >= 6 && x <= 10 && z >= 4 && z <= 9) {
      g.set(x, gr + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade: parapet cap.
  g.set(x, gr + 11, z, "quartz_slab", { type: "bottom", waterlogged: "false" });

  // Pilaster pattern: every third column is solid quartz, the rest glazed.
  const isPier = (x + z) % 3 === 0;

  // Shopfront band (gr+1 .. gr+4).
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (isDoor(x, z)) {
      if (y === gr + 1 || y === gr + 2) continue; // doorway, set below
      if (y === gr + 3) { g.set(x, y, z, "red_concrete"); continue; } // canopy
      g.set(x, y, z, "light_blue_stained_glass");
      continue;
    }
    g.set(x, y, z, isPier ? "smooth_quartz" : "light_blue_stained_glass");
  }

  // Entrance doorway, two blocks high, facing outward (south).
  if (isDoor(x, z)) {
    g.set(x, gr + 1, z, "oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, "oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }

  // Upper storey windows (gr+6 .. gr+9), framed by the same piers.
  for (let y = gr + 6; y <= gr + 9; y++) {
    g.set(x, y, z, isPier ? "smooth_quartz" : "light_blue_stained_glass");
  }

  // Parapet course at gr+10 is already cornice; gr+10 wall stays quartz_block.
}

g.save(`${DIR}/${ID}.nbt`);
