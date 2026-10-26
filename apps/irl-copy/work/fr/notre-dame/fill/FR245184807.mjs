// FR245184807: a Haussmann-style commercial range on the Île de la Cité's north side. The lidar roof height snaps to three
// flat tiers: a four-storey range with a mansard (about 19 blocks, the 4 x 5-block storeys plus the attic), a two-storey
// middle, and single-storey shopfronts on the rest. Walls are limestone render on a stone plinth; each storey stands on
// the one below. It is a shell: an air gap behind the glass, and a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184807.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184807.nbt";
const [W, H, D] = [24, 35, 20];
const PLINTH = 3;                 // the ground storey is y 3..7; the plinth fills y 0..2 under every cell
const STOREYS = [8, 13, 18];      // storey lines: the floor of each storey above the ground one (18 is the attic)

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => cell.has(key(x, z));
const perimeter = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// Lidar noise: the median roof of each cell and its footprint neighbours, snapped to three flat tiers
for (const c of cell.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell.get(key(c.x + dx, c.z + dz)); if (n) near.push(n.r); }
  const s = median(near);
  c.top = s >= 11 ? 19 : s >= 9 ? 13 : 8;
}

// The entrance: a shopfront on the south edge (the lowest tier), near the middle of the frontage
const doorCell = [...cell.values()]
  .filter((c) => c.top === 8 && perimeter(c.x, c.z))
  .sort((a, b) => b.z - a.z || Math.abs(a.x - 11) - Math.abs(b.x - 11))[0];
const doorFacing = !inF(doorCell.x, doorCell.z + 1) ? "south" : !inF(doorCell.x, doorCell.z - 1) ? "north"
  : !inF(doorCell.x + 1, doorCell.z) ? "east" : "west";
const isDoor = (x, z) => doorCell.x === x && doorCell.z === z;

// Position along a facade: x on the north and south faces, z on the east and west faces
const along = (x, z) => (!inF(x, z + 1) || !inF(x, z - 1) ? x : z);
// The neighbour a window looks into: the interior cell next to it (null if the shell is one cell thick)
const inward = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]]
  .map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) => inF(nx, nz) && !perimeter(nx, nz)) ?? null;
const storeyBase = (y) => STOREYS.filter((s) => s < y).pop();

const g = new Voxels([W, H, D]);
const lit = [];

for (const c of cell.values()) {
  const { x, z, top: T } = c;
  const P = perimeter(x, z);
  const a = along(x, z);
  // plinth: the foundation and basement storey, stone under everything
  for (let y = 0; y < PLINTH; y++) g.set(x, y, z, "stone_bricks");
  for (let y = PLINTH; y < T; y++) {
    if (!P) {
      // interior: air, with a floor slab at each storey line
      if (STOREYS.includes(y)) g.set(x, y, z, "oak_planks");
      continue;
    }
    if (isDoor(x, z) && (y === 3 || y === 4)) {
      g.set(x, y, z, "dark_oak_door", { facing: doorFacing, half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    let blk;
    if (y === 3) blk = "stone";                                   // base course
    else if (y < 8) {                                             // shopfront: glass between mullions, lintel, fascia
      if (y === 6) blk = isDoor(x, z) ? "dark_oak_planks" : "calcite";
      else if (y === 7) blk = "dark_oak_planks";
      else blk = isDoor(x, z) || a % 3 !== 0 ? "glass_pane" : "dark_oak_planks";
    } else if (y === 18) blk = a % 3 === 1 ? "glass_pane" : "deepslate_bricks";   // attic band with dormers
    else if (STOREYS.includes(y)) blk = "smooth_stone";            // storey line
    else {                                                         // upper storeys: two rows of glass under a sill row
      const r = y - storeyBase(y);
      blk = r <= 2 && a % 3 === 1 ? "glass_pane" : "calcite";
    }
    g.set(x, y, z, blk);
    if (blk === "glass_pane" && y < 18 && (x * 7 + z * 3 + y) % 5 === 0) lit.push([x, y, z]);
  }
  // the top: a mansard on the range, a flat parapet on the edges of the lower tiers, a roof over the interior
  g.set(x, T, z, T === 19 ? "deepslate_tiles" : P ? "stone_bricks" : "smooth_stone");
}

// Lamps in some lit windows: a lantern standing on the floor behind the glass (the air gap stays)
for (const [x, y, z] of lit) {
  const n = inward(x, z);
  if (!n) continue;
  const [nx, nz] = n;
  const floorY = y < 8 ? 3 : storeyBase(y) + 1;               // the ground storey's floor is the plinth; upper ones a slab
  const under = y < 8 ? 2 : storeyBase(y);
  if (cell.get(key(nx, nz)).top > under) g.set(nx, floorY, nz, "lantern", { hanging: "false" });
}

// Two chimney stacks on the mansard
for (const c of cell.values()) {
  if (c.top === 19 && !perimeter(c.x, c.z) && (c.x === 6 || c.x === 17) && c.z === 2) {
    g.set(c.x, 20, c.z, "bricks"); g.set(c.x, 21, c.z, "bricks");
  }
}

const stats = g.save(OUT);
console.log(`FR245184807: ${stats.blocks} blocks, palette ${stats.palette}, door at x${doorCell.x} z${doorCell.z} facing ${doorFacing}, ${lit.length} lit window candidates`);
