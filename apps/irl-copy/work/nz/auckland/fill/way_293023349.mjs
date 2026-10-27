// Rodney Apartments, Eden Terrace side of Maungawhau: a 1970s reinforced-concrete apartment slab.
// Twelve storeys (4 blocks each, the lidar's roof at 47-49 blocks above y 0), a brick podium on the first storey,
// white-concrete piers and smooth-stone spandrels between blue glass bands, recessed balconies on the east face,
// a glazed entrance on the south corner under a canopy, and a lift overrun with roof plant on top.
// Build only on the footprint: the walls are one cell thick with air behind the glass, a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293023349.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293023349.nbt";

// The footprint, and each cell's ground (under it) and roof (lidar, above y 0).
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => F.has(`${x},${z}`);

// Lidar roof: 47 on most cells, 48-49 on the east and south, a few edge cells are noise (1, 10, 26, 32) and
// the median of the footprint is 47. The massing takes it as twelve storeys of 4 blocks on a 1-block base:
// the floor of storey k is at y = 1 + 4k, the roof deck is at y 49 and the parapet at y 50.
const NS = 12, STOREY = 4, BASE = 1;
const floorY = (k) => BASE + STOREY * k;
const ROOF = floorY(NS);            // 49
const PARAPET = ROOF + 1;           // 50

// Which sides of a cell face the outside: an exposed boundary cell is a wall cell.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const isBoundary = (x, z) => inF(x, z) && exposed(x, z).length > 0;

// Lift overrun: the footprint's most central 3x3 block.
let core = null, best = Infinity;
const cx0 = cells.reduce((s, c) => s + c[0], 0) / cells.length, cz0 = cells.reduce((s, c) => s + c[1], 0) / cells.length;
for (const [x, z] of cells) {
  const ok = [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => inF(x + dx, z + dz)));
  if (!ok) continue;
  const d = Math.hypot(x - cx0, z - cz0);
  if (d < best) { best = d; core = [x, z]; }
}

const g = new Voxels([15, 62, 17]);

// 1. Plinth on every cell (the ground under the lowest cells is 0, so the plinth is the base course there too).
for (const [x, z] of cells) g.set(x, 0, z, "stone_bricks");

// 2. Storeys: a floor slab over the whole footprint, then the wall rows on the boundary.
for (let k = 0; k < NS; k++) {
  const b = floorY(k);
  for (const [x, z] of cells) g.set(x, b, z, "smooth_stone");

  for (const [x, z] of cells) {
    const ex = exposed(x, z);
    if (!ex.length) {
      // Inside: air, except a glowstone just behind some windows (see below).
      continue;
    }
    const xFace = ex.some((d) => d === "E" || d === "W");
    const zFace = ex.some((d) => d === "N" || d === "S");
    const corner = xFace && zFace;
    const face = xFace ? z : x;                     // the coordinate that runs along the exposed face
    const pier = corner || face % 3 === 0;
    const balconyE = !corner && ex.includes("E") && k >= 1 && face % 6 === 3;

    if (balconyE) {
      // Recessed balcony: a rail at the floor, open above it, the storey's spandrel across the top.
      g.set(x, b + 1, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      g.set(x, b + 3, z, "smooth_stone");
      continue;
    }

    if (pier) {
      g.set(x, b + 1, z, k === 0 ? "bricks" : "white_concrete");
      g.set(x, b + 2, z, k === 0 ? "bricks" : "white_concrete");
    } else {
      g.set(x, b + 1, z, "light_blue_stained_glass");
      g.set(x, b + 2, z, "light_blue_stained_glass");
      // Warm light in some rooms: a glowstone on the floor, just behind the glass (the cell inside is the air gap).
      const ix = x + (ex.includes("E") ? -1 : ex.includes("W") ? 1 : 0);
      const iz = z + (ex.includes("S") ? -1 : ex.includes("N") ? 1 : 0);
      const lit = (x * 7 + z * 13 + k * 5) % 5 === 0;
      if (lit && inF(ix, iz) && !isBoundary(ix, iz)) g.set(ix, b + 1, iz, "glowstone");
    }
    g.set(x, b + 3, z, "smooth_stone");           // spandrel under each storey's glass
  }
}

// 3. Roof: deck over the footprint, a parapet on the boundary, roof plant and the lift overrun.
for (const [x, z] of cells) {
  g.set(x, ROOF, z, "smooth_stone");
  if (isBoundary(x, z)) g.set(x, PARAPET, z, "white_concrete");
}
g.set(3, PARAPET, 6, "iron_block");
g.set(11, PARAPET, 10, "iron_block");
if (core) {
  for (let y = PARAPET; y <= PARAPET + 3; y++)
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++)
      g.set(core[0] + dx, y, core[1] + dz, y === PARAPET + 3 ? "smooth_stone" : "white_concrete");
}

// 4. Entrance on the south corner: a glazed-door bay under a canopy, with a hanging lantern beside it.
g.set(10, 1, 16, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(10, 2, 16, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(9, 3, 16, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
g.set(10, 3, 16, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
g.set(9, 2, 16, "lantern", { hanging: "true", waterlogged: "false" });

const res = g.save(OUT);
console.log(`Rodney Apartments: ${res.blocks} blocks, palette ${res.palette}, lift core at ${core}`);
