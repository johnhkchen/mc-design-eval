import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540298926.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540298926.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 16, H = 23, D = 22;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inside = (x, z) => G.has(`${x},${z}`);
const perimeter = (x, z) =>
  !inside(x + 1, z) || !inside(x - 1, z) || !inside(x, z + 1) || !inside(x, z - 1);
const corner = (x, z) =>
  (!inside(x - 1, z) || !inside(x + 1, z)) && (!inside(x, z - 1) || !inside(x, z + 1));

// Storey logic (1990s Taipei low-rise commercial block, white tile and glass):
// y 0..g-1 foundation; y g base course; g+1..4 shopfront; 5 storey band;
// 6..9 upper storey windows; 10 cornice/roof slab; 11 parapet cap.
const ROOF = 10, PARAPET = 11;

// Entrance: a perimeter cell on the minimum-z (north) side nearest the centre.
let door = null;
{
  const xs = cells.map(c => c[0]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const minZ = Math.min(...cells.map(c => c[1]));
  let best = Infinity;
  for (const [x, z, gr] of cells) {
    if (z !== minZ || !perimeter(x, z)) continue;
    const d = Math.abs(x - cx);
    if (d < best) { best = d; door = { x, z, g: gr }; }
  }
}

for (const [x, z, gr] of cells) {
  // Foundation below ground level of this cell.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const isEdge = perimeter(x, z);

  // Floor slab at storey line for every footprint cell above ground.
  if (5 >= gr) g.set(x, 5, z, "smooth_stone");

  // Roof slab over the whole footprint.
  if (ROOF >= gr) g.set(x, ROOF, z, isEdge ? "stone_bricks" : "light_gray_concrete");

  if (!isEdge) {
    // Rooftop plant units on interior cells.
    if (x % 5 === 2 && z % 5 === 2) g.set(x, PARAPET, z, "iron_block");
    continue;
  }

  const pier = corner(x, z) || (x + z) % 3 === 0;

  // Base course.
  if (gr <= 4) g.set(x, gr, z, "stone_bricks");

  // Ground floor shopfront: glass bays between white piers.
  for (let y = gr + 1; y <= 4; y++) {
    if (y < 0) continue;
    g.set(x, y, z, pier ? "white_concrete" : "glass");
  }

  // Upper storey: 6..9 with frames top and bottom, glass between.
  for (let y = 6; y <= 9; y++) {
    if (y < gr) continue;
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }
    if (y === 6 || y === 9) { g.set(x, y, z, "light_gray_concrete"); continue; }
    // Warm lights behind some upper windows.
    if (y === 7 && (3 * x + z) % 7 === 0) g.set(x, y, z, "glowstone");
    else g.set(x, y, z, "glass_pane");
  }

  // Cornice and parapet cap.
  g.set(x, ROOF, z, "stone_bricks");
  g.set(x, PARAPET, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance door set into the chosen north-face cell.
if (door) {
  const { x, z, g: gr } = door;
  const base = Math.max(0, gr);
  g.set(x, base, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, base + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel over the entrance and a warm lantern beside it.
  if (base + 2 <= 4) g.set(x, base + 2, z, "smooth_stone");
}

g.save(OUT);
