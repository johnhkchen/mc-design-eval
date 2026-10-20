import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001604";
const W = 12, H = 25, D = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const key = (x, z) => `${x},${z}`;
const has = (x, z) => cellMap.has(key(x, z));

// Raw per-cell data.
const raw = cells.map(([x, z, gr, roof]) => ({
  x, z,
  ground: clamp(Math.round(gr), 0, H - 4),
  roof: Math.round(roof),
}));

// One storey base for the whole building: the lowest ground under it.
const baseY = Math.min(...raw.map(c => c.ground));
// One flat roof: median lidar roof, clamped to the record (~13 blocks above lowest ground).
const sorted = raw.map(c => c.roof).sort((a, b) => a - b);
const medRoof = sorted[Math.floor(sorted.length / 2)];
const rise = clamp(medRoof - baseY, 11, 15);
const topY = clamp(baseY + rise, baseY + 10, H - 1); // roof slab row (top block of building)

const cellMap = new Map();
for (const c of raw) cellMap.set(key(c.x, c.z), { ground: c.ground });

// Foundation: solid from y 0 up to each cell's own ground (follows slope).
for (const [k, c] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.ground; y++) g.set(x, y, z, "stone_bricks");
}

// Shell, with one storey grid counted from baseY.
for (const [k, c] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const faceZ = !has(x, z - 1) || !has(x, z + 1); // long street / back facades
  const faceX = !has(x - 1, z) || !has(x + 1, z); // short side walls
  const exterior = faceZ || faceX;
  const frontOnly = faceZ && !faceX;
  const sideOnly = faceX && !faceZ;

  const yStart = Math.max(c.ground, baseY);
  for (let y = yStart; y <= topY; y++) {
    const r = y - baseY;   // storey grid, common to all cells
    const topR = topY - baseY;

    // Entrances: doors on both long facades at x = 5, lower at r = 1, upper at r = 2.
    if (frontOnly && x === 5 && (r === 1 || r === 2) && r < topR) {
      g.set(x, y, z, "oak_door", {
        facing: z === 0 ? "south" : "north",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Roof slab and parapet cap.
    if (y === topY) {
      g.set(x, y, z, exterior ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // Cornice course with corbels under the parapet.
    if (y === topY - 1 && exterior) {
      g.set(x, y, z, (frontOnly && x % 2 === 1) ? "chiseled_stone_bricks" : "stone_bricks");
      continue;
    }

    // Even rows: brownstone string courses on the outside, floor slabs inside.
    if (r % 2 === 0) {
      g.set(x, y, z, exterior ? "brown_terracotta" : "smooth_stone");
      continue;
    }

    // Odd rows: window band. Interior stays air behind the glass.
    if (!exterior) {
      // Warm light just behind two front windows per storey, on the second row of the room.
      if (z === 1 && (x === 3 || x === 7) && has(x, 0) && r >= 3) {
        g.set(x, y, z, "shroomlight");
      }
      continue;
    }

    if (r === 1 && frontOnly) {
      // Ground-floor shopfront: wide glass bays except the door column.
      if (x >= 1 && x <= W - 2) g.set(x, y, z, "glass");
      else g.set(x, y, z, "bricks");
      continue;
    }

    if (frontOnly) {
      // Upper windows on odd columns, brick piers on even columns.
      if (x % 2 === 1 && x >= 1 && x <= W - 2) g.set(x, y, z, "glass_pane");
      else g.set(x, y, z, "bricks");
      continue;
    }

    if (sideOnly) {
      // Side walls: one window bay centred on the depth.
      g.set(x, y, z, z === 2 ? "glass_pane" : "bricks");
      continue;
    }

    // Corners: solid brick pier.
    g.set(x, y, z, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
