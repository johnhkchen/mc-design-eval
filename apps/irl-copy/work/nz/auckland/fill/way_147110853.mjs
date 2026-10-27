import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 147110853: a 1990s glass-and-concrete office tower on the CBD's edge. Basalt (polished blackstone) base course and
// podium, pale precast piers, blue-grey spandrel-banded glazing, a stone parapet on every exposed top edge, a lobby with a
// double door under a lintel canopy, and a plant room with louvres and a lightning rod on the tallest core. Storeys are
// 4 blocks: each cell's height is its lidar roof / 4 (rounded), mode-smoothed over 5x5, so tiers are flat and the tower
// steps down to its lower wings with no holes. Each storey's floor slab is solid over the footprint; the interior is air.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110853.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110853.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const X = 43, Y = 90, Z = 30;
const STOREY = 4;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const GLASS = "light_blue_stained_glass_pane", PIER = "light_gray_concrete", SPANDREL = "gray_concrete";
const SLAB = "smooth_stone", BASE = "polished_blackstone", PODIUM = "stone_bricks", FOUND = "stone";
const PARAPET = "stone_brick_wall", PLANT = "light_gray_concrete", LOUVRE = "iron_bars";
const LIGHT = "glowstone", LANTERN = "lantern", LINTEL = "polished_blackstone";

// storeys per footprint cell: the lidar roof over a storey height, then the mode over the 5x5 around it
const at = new Map();
for (const [x, z, gr, r] of cells) at.set(x + "," + z, { gr, n0: Math.max(1, Math.round(r / STOREY)), n: 0 });
const cell = (x, z) => at.get(x + "," + z);
for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number), votes = new Map();
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const o = cell(x + dx, z + dz); if (o) votes.set(o.n0, (votes.get(o.n0) || 0) + 1);
  }
  c.n = [...votes].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}
const NMAX = Math.max(...[...at.values()].map((c) => c.n));
const TOP = (c) => STOREY * c.n;
const keyOf = (x, z) => x + "," + z;

// the faces of a column with no storey s beside them: outside the footprint, or a neighbour that stops below s
const exposed = (x, z, s) => DIRS.filter(([dx, dz]) => { const o = cell(x + dx, z + dz); return !o || o.n <= s; });
// a pane runs along the wall it sits in, so it joins its glazed neighbours
const pane = (dx) => (dx
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// the lobby: the north face's middle cell at ground level (the outermost cell with no neighbour to the north)
const northCells = [...at.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !cell(x, z - 1))
  .sort((a, b) => a[0] - b[0]);
const [DOOR_X, DOOR_Z] = northCells[Math.floor(northCells.length / 2)];

// the plant room: the middle third of the tallest core (cells whose four neighbours are all at the top)
const core = [...at].map(([k, c]) => [k.split(",").map(Number), c])
  .filter(([[x, z], c]) => c.n === NMAX && DIRS.every(([dx, dz]) => { const o = cell(x + dx, z + dz); return o && o.n === NMAX; }))
  .map(([p]) => p);
const bx = core.map(([x]) => x), bz = core.map(([, z]) => z);
const [x0, x1, z0, z1] = [Math.min(...bx), Math.max(...bx), Math.min(...bz), Math.max(...bz)];
const plant = core.filter(([x, z]) => x >= x0 + (x1 - x0) / 3 && x <= x1 - (x1 - x0) / 3 && z >= z0 + (z1 - z0) / 3 && z <= z1 - (z1 - z0) / 3);
const PLANT_SET = new Set(plant.map(([x, z]) => keyOf(x, z)));

const g = new Voxels([X, Y, Z]);

for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number);
  // foundation under the ground, then each storey: floor slab, then the walls where the column is exposed
  for (let y = 0; y < c.gr; y++) g.set(x, y, z, FOUND);
  for (let s = 0; s < c.n; s++) {
    const y0 = STOREY * s;
    g.set(x, y0, z, s === 0 ? BASE : SLAB);
    const ex = exposed(x, z, s);
    if (!ex.length) continue;                                    // interior: air behind the floor slab

    if (s === 0 && x === DOOR_X && z === DOOR_Z) {               // the lobby doors
      const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
      g.set(x, y0 + 1, z, "iron_door", { ...door, half: "lower" });
      g.set(x, y0 + 2, z, "iron_door", { ...door, half: "upper" });
      g.set(x, y0 + 3, z, LINTEL);
      continue;
    }
    if (ex.length > 1) {                                         // a corner: a full-height pier
      g.set(x, y0 + 1, z, PIER); g.set(x, y0 + 2, z, PIER); g.set(x, y0 + 3, z, SPANDREL);
      continue;
    }
    const [dx] = ex[0];
    const a = dx ? z : x;                                        // the bay's place along the face
    const pier = a % 3 === 0;
    for (const dy of [1, 2]) pier ? g.set(x, y0 + dy, z, PIER) : g.set(x, y0 + dy, z, GLASS, pane(dx));
    g.set(x, y0 + 3, z, SPANDREL);                               // the spandrel band under each storey's sill
    // a warm light behind some panes: the cell inside, when it is open air at this storey
    if (!pier && (a + 3 * s) % 7 === 2) {
      const ix = x - dx, iz = z - ex[0][1];
      const inner = cell(ix, iz);
      if (inner && inner.n > s && !exposed(ix, iz, s).length) {
        if (s < 3) g.set(ix, y0 + 1, iz, LIGHT);
        else g.set(ix, y0 + 1, iz, LANTERN, { hanging: "false", waterlogged: "false" });
      }
    }
  }
  g.set(x, TOP(c), z, SLAB);                                      // the roof, flush with the cornice
}

// the parapet on every top edge that stands above nothing (a lower neighbour or the outside), except the plant room
for (const [k, c] of at) {
  if (PLANT_SET.has(k)) continue;
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => { const o = cell(x + dx, z + dz); return !o || o.n < c.n; })) g.set(x, TOP(c) + 1, z, PARAPET);
}

// the plant room: walls with a louvre course, a roof, and a lightning rod on the centre
if (plant.length) {
  const top = STOREY * NMAX;
  for (const [x, z] of plant) {
    for (const [dx, dz] of DIRS) {
      if (PLANT_SET.has(keyOf(x + dx, z + dz))) continue;
      g.set(x, top + 1, z, PLANT); g.set(x, top + 2, z, LOUVRE, pane(dx)); g.set(x, top + 3, z, PLANT);
    }
    g.set(x, top + 4, z, SLAB);
  }
  const cx = plant.reduce((s, [x]) => s + x, 0) / plant.length, cz = plant.reduce((s, [, z]) => s + z, 0) / plant.length;
  const [mx, mz] = plant.reduce((best, p) => (Math.hypot(p[0] - cx, p[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? p : best));
  for (let y = top + 5; y <= top + 8; y++) g.set(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// the lintel canopy over the lobby: the three bays across its face
for (const dx of [-1, 0, 1]) if (cell(DOOR_X + dx, DOOR_Z)) g.set(DOOR_X + dx, 3, DOOR_Z, LINTEL);

const stat = g.save(OUT);
console.log(`way_147110853: ${stat.blocks} blocks, ${stat.palette} palette entries, ${at.size} cells, ${NMAX} storeys max`);
