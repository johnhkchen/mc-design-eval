// Pitt Street Theatre, Auckland CBD: a 1920s-30s cream render commercial block on a volcanic basalt plinth,
// with a taller auditorium/fly core. Storeys are 4 blocks on a common datum (y 6); the shell is the perimeter
// ring, the interior is air with floor slabs and a few structural columns; the roof steps 24 / 26 / 28.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152479.cells.json", "utf8"));

const W = 32, D = 16, H = 40;
const DATUM = 6;          // common ground-floor slab level, above the highest ground under the footprint (6)
const BAND = 4;           // storey height: slab, two rows of glass, spandrel
const PIER = 3;           // a glass bay every 3 cells: a quartz pier then two panes
const COLUMN = 5;         // structural interior columns on a 5-cell grid

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { ground, roof });
const inside = (x, z) => cell.has(key(x, z));

// Smooth the lidar roof into three flat tiers (24 wing, 26 main, 28 core); values under 15 are noise and take the
// most common tier of their neighbours.
const tierOf = (r) => (r >= 27 ? 28 : r >= 25 ? 26 : 24);
const neighbours = (x, z) => { const out = []; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if ((dx || dz) && inside(x + dx, z + dz)) out.push(key(x + dx, z + dz)); return out; };
for (const [k, c] of cell) {
  if (c.roof >= 15) { c.top = tierOf(c.roof); continue; }
  const votes = new Map();
  for (const n of neighbours(...k.split(",").map(Number))) { const t = tierOf(cell.get(n).roof); votes.set(t, (votes.get(t) ?? 0) + 1); }
  c.top = votes.size ? [...votes].sort((a, b) => b[1] - a[1])[0][0] : 26;
}

// Perimeter: a footprint cell with any 8-neighbour outside. Its outward axis (if the outside is straight across)
// decides the facade it shows; diagonal-only edges are plain wall.
const perimeter = (x, z) => [-1, 0, 1].some((dx) => [-1, 0, 1].some((dz) => (dx || dz) && !inside(x + dx, z + dz)));
const outward = (x, z) => (!inside(x - 1, z) ? [-1, 0] : !inside(x + 1, z) ? [1, 0] : !inside(x, z - 1) ? [0, -1] : !inside(x, z + 1) ? [0, 1] : null);

const v = new Voxels([W, H, D]);
const isFloor = (y) => y >= DATUM && (y - DATUM) % BAND === 0;
const doorCells = new Set(["0,7"]);          // the single entrance on the uphill west face
const glowBehind = [];                       // interior cells behind a lit window, placed last

for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const edge = perimeter(x, z), out = edge ? outward(x, z) : null;
  const along = out && out[0] !== 0 ? z : x;     // coordinate running along the facade
  const storey = (y) => Math.floor((y - DATUM) / BAND);

  for (let y = 0; y < c.top; y++) {
    if (y < c.ground) { v.set(x, y, z, "deepslate_bricks"); continue; }
    if (y < DATUM) { v.set(x, y, z, "polished_deepslate"); continue; }
    if (y === c.top - 1) { v.set(x, y, z, edge ? "quartz_bricks" : "stone_bricks"); continue; }
    if (isFloor(y)) { v.set(x, y, z, edge ? "smooth_quartz" : "smooth_stone"); continue; }
    if (!edge) {
      // interior: air storey, with a column on the grid for the floor slabs above it
      if (x % COLUMN === 0 && z % COLUMN === 0) v.set(x, y, z, "quartz_pillar");
      continue;
    }
    const r = (y - DATUM) % BAND;
    if (doorCells.has(k) && (y === 7 || y === 8)) {
      v.set(x, y, z, "dark_oak_door", { facing: "west", half: y === 7 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (!out) { v.set(x, y, z, "smooth_quartz"); continue; }   // diagonal-only edge: solid
    if (r === 3) { v.set(x, y, z, "smooth_quartz"); continue; } // spandrel
    if (along % PIER === 0) { v.set(x, y, z, "quartz_pillar"); continue; }
    // a pane joins its neighbours along the facade: on a west/east face that runs north-south
    const onWestEast = out[0] !== 0;
    v.set(x, y, z, "glass_pane", onWestEast
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    if (r === 1 && (along + storey(y)) % 4 === 1) glowBehind.push([x - out[0], y, z - out[1]]);
  }

  // a continuous cornice parapet one block above the roof edge (a 1920s-30s block, not battlements)
  if (edge) v.set(x, c.top, z, "smooth_quartz");
  // roof plant on the main roof: iron air handling units on a loose grid, kept off the edge
  if (!edge && c.top === 26 && x % 6 === 3 && z % 4 === 2) v.set(x, c.top, z, "iron_block");
}

// warm light behind some windows (glowstone in the air gap, interior side)
for (const [x, y, z] of glowBehind) if (inside(x, z) && x % COLUMN && z % COLUMN) v.set(x, y, z, "glowstone");
// the foyer lamp just inside the entrance
v.set(1, 7, 7, "lantern", { hanging: "false", waterlogged: "false" });

const { blocks, palette } = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152479.nbt");
console.log(`way_162152479: ${blocks} blocks, palette ${palette}`);
