import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 僑泰財經首府 — 1990s Taipei mid-rise office block: granite plinth, warm white
// quartz-clad piers, blue-green tinted glazing, two-storey massing with a
// stepped cornice and a single roof level (lidar: roof ~11 blocks above lowest ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650480";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 36, H = 23, D = 61;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const ground = new Map();
for (const [x, z, b] of cells) ground.set(`${x},${z}`, Math.round(b));
const has = (x, z) => ground.has(`${x},${z}`);

const maxB = Math.max(...ground.values());

// One roof level for the whole block: at least 10 above the lowest ground,
// high enough to clear the highest ground with two storeys.
let R = Math.max(10, maxB + 10);
if (R + 2 > H - 1) R = H - 3; // keep cornice and cap inside the volume

// Global storey lines every 5 blocks, counted down from the roof.
const G = [];
for (let v = R - 5; v >= 0; v -= 5) G.push(v);

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Outward direction for an edge cell (stairs face the open side = outside).
function outwardFacing(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  return "east";
}

// ---- entrance: middle of the north-most (min z) edge, two doors wide -------
const zMin = Math.min(...cells.map(([, z]) => z));
const northXs = cells.filter(([, z]) => z === zMin).map(([x]) => x).sort((a, b) => a - b);
const exMid = northXs[Math.floor(northXs.length / 2)];
const doorCells = new Set([`${exMid},${zMin}`]);
if (has(exMid + 1, zMin)) doorCells.add(`${exMid + 1},${zMin}`);

// ---- deterministic lighting ------------------------------------------------
const warm = (x, z, i) => (x * 5 + z * 7 + i * 3) % 13 === 0;

// ---- build -------------------------------------------------------------------
for (const [x, z, bRaw] of cells) {
  const b = Math.round(bRaw);
  const key = `${x},${z}`;

  // Foundation: granite-look plinth from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");

  // Floor lines for this cell: its own ground, global storey lines above it, and the roof.
  const F = [...new Set([b, R, ...G.filter((v) => v > b)])].sort((p, q) => p - q);

  // Solid floor slabs so every storey stands on the one below.
  for (const f of F) {
    if (f < R) g.set(x, f, z, "smooth_quartz");
  }

  // Roof slab.
  g.set(x, R, z, "gray_concrete");

  if (!isEdge(x, z)) continue; // interior: air above the floors

  // Facade storeys.
  const corner = isCorner(x, z);
  const pier = corner || (x + z) % 3 === 0;
  for (let i = 0; i < F.length - 1; i++) {
    const lo = F[i], hi = F[i + 1];
    for (let y = lo + 1; y <= hi - 1; y++) {
      let blk;
      if (y === lo + 1) {
        // Base course at grade, spandrel above.
        blk = i === 0 ? "polished_andesite" : "light_gray_concrete";
      } else if (y === hi - 1) {
        blk = "smooth_quartz"; // lintel band
      } else if (corner) {
        blk = "stone_bricks"; // heavier corner column
      } else if (pier) {
        blk = "smooth_quartz"; // quartz-clad pier
      } else {
        blk = "light_blue_stained_glass"; // tinted glazing
      }

      // Ground-floor entrance doors.
      if (i === 0 && doorCells.has(key) && (y === b + 1 || y === b + 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === b + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      // Stone-brick door frame beside the doors on the front row.
      if (i === 0 && z === zMin && !doorCells.has(key) && Math.abs(x - exMid) <= 2 && (y === b + 1 || y === b + 2)) {
        g.set(x, y, z, "stone_bricks");
        continue;
      }

      // Lantern hanging over the entrance.
      if (i === 0 && doorCells.has(key) && y === b + 3) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }

      g.set(x, y, z, blk);

      // Stone-brick sill under each window row.
      if (blk === "light_blue_stained_glass" && y === lo + 2) {
        // Sill row sits just under the glass band.
        g.set(x, lo + 1, z, "stone_brick_slab", { type: "top" });
      }

      // Warm interior glow behind some panes, mid-storey.
      if (blk === "light_blue_stained_glass" && y === lo + 3 && warm(x, z, i)) {
        g.set(x, y, z, "glowstone");
      }
    }
  }

  // Cornice: outward-facing quartz stairs give a lip at the roof edge.
  if (R + 1 <= H - 1) {
    g.set(x, R + 1, z, "smooth_quartz_stairs", {
      facing: outwardFacing(x, z),
      half: "bottom",
      shape: "straight",
      waterlogged: "false",
    });
  }
  // Parapet cap on top of the cornice.
  if (R + 2 <= H - 1) {
    g.set(x, R + 2, z, "smooth_quartz_slab", { type: "bottom" });
  }
}

// ---- roof equipment: small plant enclosures on the interior roof -------------
const interiorRoof = (x, z) => has(x, z) && !isEdge(x, z);
if (R + 2 <= H - 1) {
  for (const [x, z] of cells) {
    if (x % 8 !== 3 || z % 12 !== 5) continue;
    const block2 = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    if (!block2.every(([a, c]) => interiorRoof(a, c))) continue;
    for (const [a, c] of block2) {
      g.set(a, R + 1, c, "light_gray_concrete");
      g.set(a, R + 2, c, "light_gray_concrete");
    }
    g.set(x, R + 3 <= H - 1 ? R + 3 : R + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
