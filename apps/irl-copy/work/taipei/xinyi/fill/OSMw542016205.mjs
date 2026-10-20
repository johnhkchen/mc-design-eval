import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 17 x 12 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey, cream-tiled 1970s-80s Taipei shophouse block: stone base,
// shopfront with a red fascia on the ground floor, two upper storeys of
// punched windows, a cornice, a parapet, and a rooftop water tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542016205";
const W = 17, H = 23, D = 12;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;

// Normalise grounds so the lowest footprint ground is y 0.
let cells = raw.map(([x, z, g]) => [x, z, Number(g) || 0]);
const gMin = Math.min(...cells.map((c) => c[2]));
cells = cells.map(([x, z, g]) => [x, z, Math.round(g - gMin)]);

const G = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const has = (x, z) => G.has(key(x, z));

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const gMax = Math.max(...cells.map((c) => c[2]));

// Floor datum: the uphill side meets ground at F; everything below is foundation.
// Body is 11 blocks from F to the parapet top, so the roof reads ~11 above the lowest ground.
// F is clamped so the rooftop tank (up to F+13) stays inside H = 23.
const F = Math.min(9, gMax);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isInterior = (x, z) => has(x, z) && outward(x, z).length === 0;

const doorX = Math.round((minX + maxX) / 2);
const g = new Voxels([W, H, D]);

const glass = "light_blue_stained_glass";
const doorProps = (half) => ({
  facing: "south",
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});

for (const [x, z, gl] of cells) {
  // Foundation: solid from y 0 up to the floor datum, so nothing floats on the slope.
  for (let y = 0; y < F; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs at ground, storey 2 and roof deck.
  g.set(x, F, z, "smooth_stone");
  g.set(x, F + 5, z, "smooth_stone");
  g.set(x, F + 10, z, "smooth_stone");

  const outs = outward(x, z);
  if (outs.length === 0) continue; // interior cell: air above the slabs

  const corner = outs.some(([dx]) => dx !== 0) && outs.some(([, dz]) => dz !== 0);

  // Cornice band and parapet on every perimeter cell.
  g.set(x, F + 5, z, "smooth_quartz");
  g.set(x, F + 10, z, "smooth_quartz");
  g.set(x, F + 11, z, "white_terracotta");

  // Corner parapet lanterns for dusk.
  if (corner) g.set(x, F + 12, z, "lantern", { hanging: "false" });

  // Pick the facade this cell belongs to (for non-corners there is exactly one).
  const [dx, dz] = outs[0];
  const along = dx !== 0 ? z : x;
  const alongMin = dx !== 0 ? minZ : minX;
  const a = along - alongMin;
  const ix = x - dx, iz = z - dz; // inward neighbour
  const behindIsInterior = isInterior(ix, iz);

  // Ground storey (k = 1..4).
  if (corner) {
    for (let k = 1; k <= 4; k++) g.set(x, F + k, z, "smooth_quartz");
  } else {
    const isDoor = dz === 1 && z === maxZ && x === doorX;
    const isPillar = a % 3 === 0;

    if (isDoor) {
      g.set(x, F + 1, z, "birch_door", doorProps("lower"));
      g.set(x, F + 2, z, "birch_door", doorProps("upper"));
      g.set(x, F + 3, z, glass);
      g.set(x, F + 4, z, "red_concrete");
    } else if (isPillar) {
      for (let k = 1; k <= 4; k++) g.set(x, F + k, z, "stone_bricks");
    } else {
      g.set(x, F + 1, z, "stone_bricks");
      g.set(x, F + 2, z, glass);
      g.set(x, F + 3, z, glass);
      g.set(x, F + 4, z, "red_concrete");
      if (behindIsInterior && a % 3 === 1) {
        g.set(ix, F + 1, iz, "lantern", { hanging: "false" });
      }
    }
  }

  // Upper storey (k = 6..9).
  if (corner) {
    for (let k = 6; k <= 9; k++) g.set(x, F + k, z, "smooth_quartz");
  } else {
    const isWindow = a % 3 === 2;
    if (isWindow) {
      g.set(x, F + 6, z, "smooth_quartz");
      g.set(x, F + 7, z, glass);
      g.set(x, F + 8, z, glass);
      g.set(x, F + 9, z, "smooth_quartz");
      const wIdx = (a - 2) / 3;
      if (behindIsInterior && wIdx % 2 === 0) {
        g.set(ix, F + 6, iz, "lantern", { hanging: "false" });
      }
    } else {
      for (let k = 6; k <= 9; k++) g.set(x, F + k, z, "white_terracotta");
    }
  }
}

// Rooftop water tank: 3 x 3 steel tank on the deck, capped with concrete.
for (let x = 6; x <= 8; x++) {
  for (let z = 4; z <= 6; z++) {
    if (!has(x, z)) continue;
    g.set(x, F + 11, z, "iron_block");
    g.set(x, F + 12, z, "iron_block");
    g.set(x, F + 13, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
