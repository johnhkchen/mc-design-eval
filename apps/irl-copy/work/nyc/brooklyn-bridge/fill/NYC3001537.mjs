import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001537.cells.json`, "utf8"));

const W = 8, H = 20, D = 8;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cell = new Map();

// Smooth lidar noise: one flat roof tier for the whole rowhouse (median of the lidar roofs),
// clamped so the cornice and a chimney both fit inside the 20-block height.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const minG = Math.min(...cells.map(c => c[2]));
const T = Math.max(minG + 6, Math.min(16, Math.round(medRoof)));

for (const [x, z, gr] of cells) {
  // Per-cell ground, kept within a couple of blocks of the lowest ground for a clean base
  const G = Math.max(0, Math.min(T - 4, Math.round(Math.min(gr, minG + 2))));
  cell.set(key(x, z), { G });
}
const has = (x, z) => cell.has(key(x, z));

// Federal-era brick rowhouse: brick walls, stone base and cornice, stone lintels/sills,
// glass sash, one entrance on the street (south, high z) face.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { G } = cell.get(key(x, z));

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  const hasW = !has(x - 1, z);
  const hasE = !has(x + 1, z);
  const hasN = !has(x, z - 1);
  const hasS = !has(x, z + 1);
  const exterior = hasW || hasE || hasN || hasS;
  const corner = (hasW || hasE) && (hasN || hasS);

  if (!exterior) {
    // Interior: floor slabs per storey and a roof deck, otherwise air
    for (let y = G; y < T; y++) {
      const r = y - G;
      if (y === T - 1) g.set(x, y, z, "smooth_stone");
      else if (r % 2 === 0) g.set(x, y, z, "oak_planks");
    }
    continue;
  }

  const front = hasS;
  const p = (hasW || hasE) ? z : x;
  const winCol = [1, 2, 5, 6].includes(p);

  for (let y = G; y < T; y++) {
    const r = y - G;

    // Cornice course on top of the flat roof tier
    if (y === T - 1) { g.set(x, y, z, "smooth_stone"); continue; }

    // Corner quoins, plain stone all the way up
    if (corner) { g.set(x, y, z, "stone_bricks"); continue; }

    // Base course at street level
    if (r === 0) { g.set(x, y, z, "stone_bricks"); continue; }

    // Entrance on the front face, single door at column 3 (rows 1-2)
    if (front && p === 3 && (r === 1 || r === 2)) {
      g.set(x, y, z, "oak_door", {
        facing: "south",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Window openings on odd rows: glass with the lintel/sill above and below
    if (r % 2 === 1 && r < T - G - 2 && winCol && !(front && p === 3)) {
      g.set(x, y, z, "glass_pane");
      if ((x * 3 + z * 5 + r) % 4 === 0) {
        let ix = x, iz = z;
        if (hasW) ix = x + 1;
        else if (hasE) ix = x - 1;
        else if (hasN) iz = z + 1;
        else iz = z - 1;
        if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
      }
    } else if (r % 2 === 0 && winCol) {
      g.set(x, y, z, "smooth_stone");
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // Stone lintel over the entrance, with a hanging lantern beneath it
  if (front && p === 3 && G + 4 < T - 1) {
    g.set(x, G + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Chimney rising from the flat roof of an interior cell
if (has(2, 2) && T + 1 < H) {
  g.set(2, T, 2, "bricks");
  g.set(2, T + 1, 2, "bricks");
}

g.save(`${DIR}/NYC3001537.nbt`);
