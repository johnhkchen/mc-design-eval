// FR245184456: a residential building of 1800 on the Île de la Cité's irregular stone footprint (267 cells).
// Cream limestone walls on a stone-brick base course, storey lines every 5 blocks, glass panes in cut-stone surrounds
// with a shroomlight here and there, a slate mansard on the tall tiers (stair eaves, stepped caps), a street door on the
// north front under a lintel, and a chimney stack on the tallest tier. The lidar roof is averaged over 3x3 and rounded
// to whole storeys (2 to 5), so each tier is flat and every storey stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184456.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184456.nbt";

const WALL = "smooth_sandstone", LINE = "cut_sandstone", BASE = "stone_bricks", FLOOR = "oak_planks";
const SLATE = "deepslate_tiles", SLATE_EAVE = "deepslate_tile_stairs", CHIMNEY = "stone_bricks", CHIMNEY_CAP = "stone_brick_wall";
const GLASS = "light_blue_stained_glass_pane", LIGHT = "shroomlight", DOOR = "oak_door";
const STOREY = 5;

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPPOSITE = { north: "south", south: "north", west: "east", east: "west" };
const key = (x, z) => `${x},${z}`;

// the lidar roof, averaged over each cell and its present neighbours (noise out), then to whole storeys: 2 to 5
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const fp = new Map();
for (const [x, z, ground] of cells) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = roof.get(key(x + dx, z + dz)); if (r !== undefined) { sum += r; n++; }
  }
  const storeys = Math.min(5, Math.max(2, Math.round(sum / n / STOREY)));
  fp.set(key(x, z), { x, z, ground, storeys, T: storeys * STOREY });
}
const at = (x, z) => fp.get(key(x, z));
const nbr = (c, dir) => at(c.x + DIRS[dir][0], c.z + DIRS[dir][1]);
// the faces open to the street at height y: no neighbour there, or one whose roof is at or below y
const openFaces = (c, y) => Object.keys(DIRS).filter((d) => { const nb = nbr(c, d); return !nb || nb.T <= y; });
// a facade bay runs along x on a north or south face, along z on an east or west face
const along = (c, d) => (DIRS[d][1] !== 0 ? c.x : c.z);

// the mansard's depth: each tier's cells counted inward from its own eave (BFS over the same-roof region)
const depth = new Map(), parent = new Map(), queue = [];
for (const c of fp.values()) if (openFaces(c, c.T - 1).length) { depth.set(key(c.x, c.z), 0); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const d of Object.keys(DIRS)) {
    const nb = nbr(c, d);
    if (!nb || nb.T !== c.T || depth.has(key(nb.x, nb.z))) continue;
    depth.set(key(nb.x, nb.z), depth.get(key(c.x, c.z)) + 1);
    parent.set(key(nb.x, nb.z), OPPOSITE[d]);                          // the stair faces back toward the eave
    queue.push(nb);
  }
}

const g = new Voxels([21, 43, 24]);

for (const c of fp.values()) {
  const { x, z, ground, T } = c;
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);              // foundation under the cell's own ground
  for (let y = ground; y < T; y++) {
    const open = openFaces(c, y);
    if (!open.length) {
      // interior: a floor at each storey line (and at the ground and the ceiling), air between (no rooms)
      if (y === ground || y === T - 1 || (y % STOREY === 0 && y > ground)) g.set(x, y, z, FLOOR);
      continue;
    }
    if (y === ground) { g.set(x, y, z, BASE); continue; }             // base course
    if (y % STOREY === 0) { g.set(x, y, z, LINE); continue; }         // storey line
    const bay = open.find((d) => along(c, d) % 3 === 1);              // a window bay on a street face
    if (bay && y % STOREY === 4) { g.set(x, y, z, LINE); continue; }  // lintel over the glass
    if (bay) {
      if ((along(c, bay) + 2 * y) % 11 === 0) { g.set(x, y, z, LIGHT); continue; }   // about one window in eleven
      const runsEastWest = DIRS[bay][1] !== 0;                        // a north or south face: the pane runs east-west
      const pane = runsEastWest ? { east: "true", west: "true", north: "false", south: "false" }
                                : { north: "true", south: "true", east: "false", west: "false" };
      g.set(x, y, z, GLASS, { ...pane, waterlogged: "false" });
      continue;
    }
    g.set(x, y, z, WALL);
  }

  // the roof: a stair eave on the outside edge; on the tall tiers (4 or 5 storeys) a two-step mansard inward
  const d = depth.get(key(x, z)) ?? 0;
  if (d === 0) {
    g.set(x, T, z, SLATE_EAVE, { facing: openFaces(c, T - 1)[0], half: "bottom", shape: "straight", waterlogged: "false" });
    continue;
  }
  g.set(x, T, z, SLATE);
  if (c.storeys >= 4 && d === 1) g.set(x, T + 1, z, SLATE_EAVE, { facing: parent.get(key(x, z)), half: "bottom", shape: "straight", waterlogged: "false" });
  else if (c.storeys >= 4 && d >= 2) g.set(x, T + 1, z, SLATE);
}

// the street door: the north front, under a cut-stone lintel, with a stone surround either side
const door = at(7, 0);
if (door) {
  const y0 = door.ground;
  g.set(6, y0, 0, BASE); g.set(6, y0 + 1, 0, BASE); g.set(8, y0, 0, BASE); g.set(8, y0 + 1, 0, BASE);
  g.set(7, y0 + 2, 0, LINE); g.set(6, y0 + 2, 0, LINE); g.set(8, y0 + 2, 0, LINE);
  g.set(7, y0, 0, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(7, y0 + 1, 0, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// a chimney stack on the tallest tier, standing on its mansard (the cell with the most depth nearest the middle)
const tall = [...fp.values()].filter((c) => c.storeys === 5 && (depth.get(key(c.x, c.z)) ?? 0) >= 2);
if (tall.length) {
  const cx = tall.reduce((s, c) => s + c.x, 0) / tall.length, cz = tall.reduce((s, c) => s + c.z, 0) / tall.length;
  const [c] = tall.sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
  g.set(c.x, c.T + 2, c.z, CHIMNEY); g.set(c.x, c.T + 3, c.z, CHIMNEY); g.set(c.x, c.T + 4, c.z, CHIMNEY_CAP);
}

const stats = g.save(OUT);
console.log(JSON.stringify(stats));
