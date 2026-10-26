// FR241937485: a Haussmann-era residential block (built 1867, 6 storeys, stone) on the Île de la Cité's left-bank
// neighbour. Walls are calcite with smooth-stone string courses and a stone-brick plinth; windows sit between the strings
// in bays of three (a calcite pier, then two panes). Lidar roof heights snap to storey tiers (5, 10, 15, 20, 25, 31
// blocks); each tier is capped in deepslate tiles, and the 31-tier's top storey ends in a slate cornice stepping out at
// the edge.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937485.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..23, z 0..20

const g = new Voxels([24, 47, 21]);

// Storey tiers: a roof height snaps to the nearest storey line (ties go up). 31 = six storeys with the attic.
const TIERS = [5, 10, 15, 20, 25, 31];
const tierOf = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) || (Math.abs(t - r) === Math.abs(best - r) && t > best) ? t : best));

// Storey lines (smooth stone) and window bands per row; the plinth is row 0.
const STRINGS = new Set([4, 5, 9, 10, 14, 15, 19, 20, 24, 25, 28]);
const WINDOWS = new Set([1, 2, 3, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22, 23, 26, 27]);
const MID_WINDOW_ROWS = new Set([2, 7, 12, 17, 22, 27]);
const FLOOR_ROWS = [5, 10, 15, 20, 25];

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

const cellMap = new Map();
for (const [x, z, ground, roof] of cells) cellMap.set(`${x},${z}`, { x, z, ground, T: tierOf(roof) });
const at = (x, z) => cellMap.get(`${x},${z}`);

// The neighbours that are not part of the footprint: the street side of a wall.
const outsideDirs = (c) => DIRS.filter((d) => !at(c.x + d.dx, c.z + d.dz));
// A wall also stands where a neighbour is a lower tier (a setback's exposed face).
const isWall = (c) => outsideDirs(c).length > 0 || DIRS.some((d) => at(c.x + d.dx, c.z + d.dz).T < c.T);

// The facade's bay: a pier every third cell along the wall, panes in between.
const bayOf = (c) => (c.x + c.z) % 3;

// Entrance: the middle of the street front (the z = 0 edge), taking the tallest run of it.
const frontCells = cells.map(([x, z]) => at(x, z)).filter((c) => c.z === 0 && outsideDirs(c).some((d) => d.name === "north"));
const doorCell = frontCells.sort((a, b) => b.T - a.T || Math.abs(a.x - 17) - Math.abs(b.x - 17))[0];

// Chimneys on the top tier's roof, on cells clear of the walls.
const CHIMNEY_CELLS = [[8, 6], [15, 6], [8, 14], [15, 14], [12, 10]];

for (const c of cellMap.values()) {
  const { x, z, T } = c;
  const exposed = outsideDirs(c);
  const corner = exposed.length >= 2;

  // Foundation and plinth: solid from y 0 up to the cell's ground.
  for (let y = 0; y <= c.ground; y++) g.set(x, y, z, "stone_bricks");

  if (isWall(c)) {
    for (let y = 1; y <= T - 2; y++) {
      if (y === T - 2) {
        // the cornice: a slate step on the outer edge of the top tier, smooth stone elsewhere
        if (T === 31 && exposed.length) g.set(x, y, z, "deepslate_tile_stairs", { facing: exposed[0].name, half: "bottom", shape: "straight", waterlogged: "false" });
        else g.set(x, y, z, "smooth_stone");
      } else if (STRINGS.has(y)) g.set(x, y, z, "smooth_stone");
      else if (WINDOWS.has(y)) {
        if (exposed.length && !corner && bayOf(c) !== 0) {
          // a pane, connected along the wall it stands in (a z-facing wall runs east-west, and the reverse)
          const zFacing = exposed[0].name === "north" || exposed[0].name === "south";
          g.set(x, y, z, "glass_pane", { north: String(!zFacing), south: String(!zFacing), east: String(zFacing), west: String(zFacing), waterlogged: "false" });
        } else g.set(x, y, z, "calcite");
      }
    }
  } else {
    // an interior cell: a floor slab over each storey below the top, and a solid band from the top floor to the cap
    const floors = FLOOR_ROWS.filter((f) => f <= T - 2);
    const bandStart = Math.max(0, ...floors);
    for (const f of floors) g.set(x, f, z, "spruce_planks");
    for (let y = bandStart; y <= T - 1; y++) g.set(x, y, z, "stone_bricks");
  }
  // every tier is capped in slate
  g.set(x, T - 1, z, "deepslate_tiles");
}

// The entrance: a dark-oak door in the street front, its lower and upper halves, with a pier over it.
g.set(doorCell.x, 1, doorCell.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(doorCell.x, 2, doorCell.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(doorCell.x, 3, doorCell.z, "calcite");

// Warm light behind some windows: glowstone one cell inside, in the air gap between the glass and the next room.
for (const c of cellMap.values()) {
  if (!isWall(c)) continue;
  const exposed = outsideDirs(c);
  if (exposed.length !== 1 || bayOf(c) === 0) continue;
  for (const y of MID_WINDOW_ROWS) {
    if (y > c.T - 3 || (c.x * 5 + c.z * 3 + y) % 4 !== 0) continue;
    const ix = c.x - exposed[0].dx, iz = c.z - exposed[0].dz;
    if (at(ix, iz) && !isWall(at(ix, iz))) g.set(ix, y, iz, "glowstone");
  }
}

// Chimneys: brick stacks rising from the top tier's slate, capped in a slab.
for (const [x, z] of CHIMNEY_CELLS) {
  const c = at(x, z);
  if (!c || c.T !== 31 || isWall(c)) continue;
  for (let y = 31; y <= 33; y++) g.set(x, y, z, "bricks");
  g.set(x, 34, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937485.nbt";
const info = g.save(out);
console.log(JSON.stringify({ file: out, ...info, door: [doorCell.x, doorCell.z] }));
