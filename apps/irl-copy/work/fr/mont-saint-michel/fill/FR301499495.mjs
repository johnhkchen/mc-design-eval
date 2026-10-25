import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499495.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499495.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 87, H = 24, D = 128;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const c of cells) cellMap.set(c[0] + "," + c[1], c);
const has = (x, z) => cellMap.has(x + "," + z);

function set(x, y, z, b, p) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Materials: render-like sandstone walls, stone-brick plinth and trim.
const WALL = "smooth_sandstone";
const WALL_ALT = "sandstone";
const BASE = "stone_bricks";
const TRIM = "chiseled_stone_bricks";
const PILASTER = "cut_sandstone";
const GLASS = "glass";
const FLOOR = "smooth_stone";
const ROOF = "stone";
const PARAPET = "stone_bricks";

// Smooth lidar roof: average over a 3x3 neighbourhood, then step to 2-block tiers.
function smoothRoof(x, z) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = cellMap.get((x + dx) + "," + (z + dz));
    if (c) { sum += c[3]; n++; }
  }
  return sum / n;
}

// Entrance: north-facing boundary cell nearest the middle of the width.
let doorCell = null;
for (const c of cells) {
  const [x, z] = c;
  if (!has(x, z - 1)) {
    if (!doorCell || Math.abs(x - 43) < Math.abs(doorCell[0] - 43)) doorCell = c;
  }
}

for (const c of cells) {
  const [x, z] = c;
  const gr = Math.max(0, Math.round(c[2]));
  const rf = smoothRoof(x, z);
  const top = Math.min(21, Math.max(gr + 6, Math.round(rf / 2) * 2));

  // Foundation to local ground, then floor slab.
  for (let y = 0; y < gr; y++) set(x, y, z, BASE);
  set(x, gr, z, FLOOR);

  const faces = [];
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");
  const boundary = faces.length > 0;

  // Roof deck over every cell, supported by the walls at its edge.
  set(x, top - 1, z, boundary ? TRIM : ROOF);

  if (!boundary) {
    // Interior: air gap, warm lights standing on the floor, roof plant on the deck.
    if ((x * 7 + z * 3) % 23 === 0 && gr + 1 < top - 2) set(x, gr + 1, z, "glowstone");
    if ((x * 5 + z * 11) % 37 === 0) set(x, top, z, "iron_block");
    continue;
  }

  const face = faces[0];
  const along = face === "N" || face === "S" ? x : z;
  const pilaster = along % 8 === 0;
  const bay = along % 4 === 1 || along % 4 === 2;

  for (let y = gr + 1; y <= top - 2; y++) {
    if (y <= gr + 1) { set(x, y, z, BASE); continue; }          // plinth
    if (y === gr + 5) { set(x, y, z, TRIM); continue; }         // storey band
    if (pilaster) { set(x, y, z, PILASTER); continue; }         // pilasters every 8
    if (y >= gr + 2 && y <= gr + 4 && bay) { set(x, y, z, GLASS); continue; }
    // Alternate render tone every few bays for relief.
    set(x, y, z, (along % 12 < 6) ? WALL : WALL_ALT);
  }

  set(x, top, z, PARAPET);

  // Warm light behind shopfront glass.
  if (face === "N" && along % 8 === 2 && gr + 1 < top - 2) set(x, gr + 1, z, "shroomlight");
}

// Entrance: recessed doorway with stone surround, lanterns and a lintel.
if (doorCell) {
  const [x, z] = doorCell;
  const gr = Math.max(0, Math.round(doorCell[2]));
  const props = { facing: "north", hinge: "left", open: "false", powered: "false" };
  set(x, gr + 1, z, "dark_oak_door", { ...props, half: "lower" });
  set(x, gr + 2, z, "dark_oak_door", { ...props, half: "upper" });
  set(x, gr + 3, z, TRIM);
  for (const dx of [-1, 1]) {
    if (has(x + dx, z)) {
      set(x + dx, gr + 1, z, TRIM);
      set(x + dx, gr + 2, z, TRIM);
      set(x + dx, gr + 3, z, TRIM);
    }
  }
  // Lanterns flanking the door, standing on the plinth line inside the glass.
  if (has(x - 1, z)) set(x - 1, gr + 1, z, "lantern", { hanging: "false" });
  if (has(x + 1, z)) set(x + 1, gr + 1, z, "lantern", { hanging: "false" });
  // Interior light behind the door.
  if (has(x, z + 1)) set(x, gr + 1, z + 1, "shroomlight");
}

g.save(OUT);
