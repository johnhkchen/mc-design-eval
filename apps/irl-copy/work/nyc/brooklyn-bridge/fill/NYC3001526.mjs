import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001526.cells.json`, "utf8"));

const W = 11, H = 22, D = 4;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map(([x, z, gr, rf]) => [key(x, z), { gr, rf }]));
const has = (x, z) => cellMap.has(key(x, z));

// Flat roof tier: median lidar roof height, lifted clear of the highest ground.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const gMax = Math.max(...cells.map(c => Math.round(c[2])));
const T = Math.min(H - 1, Math.max(Math.round(medianRoof), gMax + 7, 8));

// Street side = cells missing a neighbour in z. Door sits on the street cell nearest x=5.
const frontCells = cells.filter(([x, z]) => !has(x, z - 1) || !has(x, z + 1));
const doorCell = frontCells.reduce((best, c) =>
  (best === null || Math.abs(c[0] - 5) < Math.abs(best[0] - 5)) ? c : best, null);
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

// Brownstone-ish walls, limestone-ish trim.
const WALL = "terracotta";
const TRIM = "stone_bricks";
const CAP = "smooth_stone";

// Street-facing piers: frame the window groups (1-3, 5-6, 8-9), with edge piers.
const PIERS = new Set([0, 4, 7, 10]);
const LIT = new Set([2, 9]);

for (const [x, z, grRaw] of cells) {
  const gr = Math.min(Math.max(Math.round(grRaw), 0), T - 7);
  const ext = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const front = !has(x, z - 1) || !has(x, z + 1);
  const sideEdge = !has(x - 1, z) || !has(x + 1, z);
  const outward = !has(x, z - 1) ? "north" : "south";
  const zIn = !has(x, z - 1) ? z + 1 : z - 1;
  const isDoorCell = front && key(x, z) === doorKey;

  // Foundation to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, TRIM);

  for (let y = gr; y <= T - 3; y++) {
    const r = y - gr;

    // Storey string courses (base course at r=0).
    if (r % 3 === 0) {
      g.set(x, y, z, ext ? TRIM : WALL);
      continue;
    }
    if (!ext) {
      g.set(x, y, z, WALL);
      continue;
    }

    const isPier = front && PIERS.has(x);
    const frontWindow = front && !isPier;
    const sideWindow = !front && sideEdge && (z === 1 || z === 2);

    // Door: lower and upper leaves, framed by piers at x=4 and x=6 via the window group logic.
    if (isDoorCell && (r === 1 || r === 2)) {
      g.set(x, y, z, "oak_door", {
        facing: outward,
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      g.set(x, y, zIn, "air");
      continue;
    }

    if (frontWindow && (r === 1 || r === 2)) {
      g.set(x, y, z, "glass_pane");
      // Air gap behind the glass; a few windows glow.
      g.set(x, y, zIn, LIT.has(x) && r === 1 ? "glowstone" : "air");
      continue;
    }

    if (sideWindow && (r === 1 || r === 2)) {
      g.set(x, y, z, "glass_pane");
      continue;
    }

    g.set(x, y, z, WALL);
  }

  // Cornice: projecting course, then coping slab on the flat roof.
  g.set(x, T - 2, z, ext ? TRIM : WALL);
  g.set(x, T - 1, z, ext ? "smooth_stone_slab" : CAP,
    ext ? { type: "top", waterlogged: "false" } : undefined);
}

g.save(`${DIR}/NYC3001526.nbt`);
