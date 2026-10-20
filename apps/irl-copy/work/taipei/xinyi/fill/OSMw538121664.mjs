import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121664";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const occ = new Map();
for (const [x, z, gr] of cells) occ.set(`${x},${z}`, gr);
const has = (x, z) => occ.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Street frontage is the low-z face (the Xinyi-side road edge in this grid).
const minZ = Math.min(...cells.map(c => c[1]));

// Palette: 1980s-90s Taipei commercial block. Pale ceramic-tile cladding,
// stone-base course, dark bronze-tinted glass, quartz parapet with a cornice.
const WALL = "smooth_quartz";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const SLAB = "light_gray_concrete";
const FRAME = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const TRIM = "quartz_slab";
const ROOF = "light_gray_concrete";
const EQUIP = "iron_block";
const WARM = "glowstone";

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const b = Math.min(gr, H - 13); // base level of ground floor slab
  const edge = isEdge(x, z);
  const front = edge && z === minZ;

  // Foundation: solid from y 0 up to the ground under this cell.
  for (let y = 0; y < b; y++) g.set(x, y, z, FOUND);

  // Ground-floor slab, then storey 1 (b+1..b+4), slab b+5, storey 2 (b+6..b+9),
  // roof slab b+10, parapet b+11.
  g.set(x, b, z, SLAB);
  g.set(x, b + 5, z, SLAB);
  g.set(x, b + 10, z, ROOF);

  if (!edge) {
    // Interior: air above the slabs, with a rooftop unit on a grid of cells.
    if ((x + z) % 5 === 0) {
      g.set(x, b + 11, z, EQUIP);
    }
    continue;
  }

  // Edge cells: full wall ring with articulation.
  const along = front ? x : (x + z);
  const onGrid = along % 2 === 0; // alternating bays of glass and tile

  // Base course at the first storey.
  g.set(x, b + 1, z, BASE);

  if (front) {
    // Shopfront: glass with a centre entrance and a canopy over it.
    const centre = Math.floor(W / 2);
    const isDoor = x === centre || x === centre - 1;
    if (isDoor) {
      // Doorway: open at ground floor, canopy above.
      g.set(x, b + 2, z, "air");
      g.set(x, b + 3, z, TRIM);
    } else {
      g.set(x, b + 2, z, GLASS);
      g.set(x, b + 3, z, FRAME);
    }
    // Ground-floor pillars on alternate bays.
    if (!isDoor && onGrid) g.set(x, b + 2, z, FRAME);
  } else {
    // Ordinary upper storey wall with pane windows.
    for (const sy of [b + 2, b + 3, b + 7, b + 8]) {
      const warm = ((x * 7 + z * 3 + sy) % 11 === 0);
      if (onGrid) g.set(x, sy, z, warm ? WARM : GLASS);
      else g.set(x, sy, z, WALL);
    }
    // Storey lintels and sills.
    g.set(x, b + 4, z, FRAME);
    g.set(x, b + 9, z, FRAME);
    g.set(x, b + 1, z, BASE);
    if (!onGrid) {
      g.set(x, b + 2, z, WALL);
      g.set(x, b + 3, z, WALL);
      g.set(x, b + 7, z, WALL);
      g.set(x, b + 8, z, WALL);
    }
  }

  // Storey-line course on the wall, then the cornice and parapet.
  g.set(x, b + 5, z, FRAME);
  g.set(x, b + 6, z, edge && !front && !onGrid ? WALL : (front ? WALL : g.get ? WALL : WALL));
  g.set(x, b + 10, z, TRIM);
  g.set(x, b + 11, z, WALL);
}

g.save(`${DIR}/${ID}.nbt`);
