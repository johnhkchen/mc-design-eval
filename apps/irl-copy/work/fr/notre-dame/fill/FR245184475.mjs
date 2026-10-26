// FR245184475: an Indifférencié block on the Île de la Cité's Paris footprint (46 x 18 cells). Lidar roofs read as three
// flat tiers: a 5-storey limestone block (25) on the west, a 4-storey one (20) on the east, and 3-storey wings (15) at the
// edges, each tier stepping down to its neighbours. Haussmann-style massing in cream stone: a dark-stone plinth, a
// shopfront ground storey with a dark awning, storey lines every 5 blocks, pier-and-window bays, and a slate deck with
// brick chimneys. Every column stands on the foundation and each storey on a full floor slab; interiors are air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184475.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184475.nbt";

const W = 46, D = 18, H = 30;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const roofAt = new Map(), groundAt = new Map();
for (const [x, z, g, r] of cells) { roofAt.set(key(x, z), r); groundAt.set(key(x, z), g); }
const inFp = (x, z) => roofAt.has(key(x, z));

// Lidar roof smoothed by the median of each cell's footprint neighbourhood, then snapped to three flat tiers.
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const tierOf = (r) => (r >= 22 ? 25 : r >= 18 ? 20 : 15);
const top = new Map();
for (const [k] of roofAt) {
  const [x, z] = k.split(",").map(Number);
  const around = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) around.push(roofAt.get(key(x + dx, z + dz)));
  top.set(k, tierOf(median(around)));
}
const T = (x, z) => top.get(key(x, z));

// A wall face is exposed where the neighbour is outside the footprint, or its roof is lower than this row (open air above it).
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || T(x + dx, z + dz) <= y);

const PLINTH = "polished_andesite", STONE = "stone_bricks", CREAM = "smooth_quartz", QUOIN = "quartz_bricks";
const DECK = "deepslate_tiles", GLASS_PANE = "glass_pane", SHOP = "glass", AWNING = "black_concrete", BRICK = "bricks";

const g = new Voxels([W, H, D]);
const cellsList = [...top.keys()].map((k) => k.split(",").map(Number));

for (const [x, z] of cellsList) {
  const t = T(x, z);

  // foundation down to the lowest ground, then the plinth course the whole way round
  g.set(x, 0, z, STONE);
  g.set(x, 1, z, PLINTH);

  for (let y = 2; y < t; y++) {
    const ex = exposed(x, z, y);
    const outer = ex.length > 0;

    // the roof: the top row is a cornice on the walls and a slate deck inside
    if (y === t - 1) { g.set(x, y, z, outer ? QUOIN : DECK); continue; }

    // floor slab per storey (the storey lines at 5, 10, 15, 20), a string course on the walls
    if (y % 5 === 0) { g.set(x, y, z, outer ? QUOIN : CREAM); continue; }

    if (!outer) continue;                                     // interior: air behind the glass

    const xFace = ex.some(([dx]) => dx !== 0), zFace = ex.some(([, dz]) => dz !== 0);
    if (xFace && zFace) { g.set(x, y, z, QUOIN); continue; }  // corner quoins
    const along = xFace ? z : x;
    const b = 5 * Math.floor(y / 5), row = y - b;             // storey base line and row within the storey
    const pier = along % 3 === 0;

    if (b === 0) {                                            // shopfront storey
      if (row === 4) { g.set(x, y, z, pier ? QUOIN : AWNING); continue; }   // dark awning over the bays
      g.set(x, y, z, pier ? QUOIN : SHOP);
      continue;
    }
    if (pier) { g.set(x, y, z, QUOIN); continue; }
    if (row === 1 || row === 4) { g.set(x, y, z, CREAM); continue; }        // sill and lintel
    g.set(x, y, z, GLASS_PANE);
    // a warm lamp behind some panes (in the air gap, one cell in)
    if ((along * 5 + y * 3 + x + z) % 13 === 0) {
      const [dx, dz] = ex[0];
      const ix = x - dx, iz = z - dz;
      if (inFp(ix, iz) && !exposed(ix, iz, y).length) g.set(ix, y, iz, "glowstone");
    }
  }
}

// The front door on the quai side (the +z face), with a plinth step and lamp on the wall beside it.
const DOOR = [5, 16];
g.set(DOOR[0], 2, DOOR[1], "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR[0], 3, DOOR[1], "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(DOOR[0], 4, DOOR[1], AWNING);

// Chimney stacks on the slate deck of the tall and mid tiers, where the deck is interior.
for (const [x, z] of cellsList) {
  const t = T(x, z);
  if (exposed(x, z, t - 1).length) continue;
  if (((x * 7 + z * 3) % 17) !== 0) continue;
  if (x < 3 || x > 42 || z < 2 || z > 14) continue;
  g.set(x, t, z, BRICK); g.set(x, t + 1, z, BRICK);
}

const stats = g.save(OUT);
console.log(JSON.stringify(stats));
