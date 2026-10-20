import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const raw = JSON.parse(readFileSync(`${DIR}/NYC3001522.cells.json`, "utf8"));
const rows = (Array.isArray(raw) ? raw : (raw.cells ?? [])).map(c =>
  Array.isArray(c) ? c : [c.x, c.z, c.ground ?? c.g ?? 0, c.roof ?? c.r ?? 8]
);

const W = 10, H = 20, D = 5;
const g = new Voxels([W, H, D]);

const BRICK = "bricks";
const BASE = "stone_bricks";
const BAND = "smooth_stone";
const FOUND = "stone_bricks";
const TRIM = "stone_brick_stairs";

const occ = new Set(rows.map(([x, z]) => `${x},${z}`));
const has = (x, z) => occ.has(`${x},${z}`);

const maxX = Math.max(...rows.map(r => r[0]));
const doorX = 4;

// One flat roof level for the whole block (most common lidar value, smoothed)
const roofCounts = new Map();
for (const r of rows) {
  const v = Math.round(r[3]);
  roofCounts.set(v, (roofCounts.get(v) ?? 0) + 1);
}
const roofLevel = [...roofCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const stairsN = { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" };

for (const [x, z, gr0] of rows) {
  const gr = Math.max(0, Math.min(H - 6, Math.round(gr0)));
  const roof = Math.max(gr + 6, Math.min(H - 1, roofLevel));

  // Foundation to the lowest ground under this cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const frontExp = !has(x, z - 1);
  const backExp = !has(x, z + 1);
  const leftExp = !has(x - 1, z);
  const rightExp = !has(x + 1, z);
  const edge = frontExp || backExp || leftExp || rightExp;
  const faceFB = frontExp || backExp;

  for (let y = gr; y < roof; y++) {
    const rel = y - gr;
    const top = y === roof - 1;

    // Base course at street level
    if (rel === 0) { g.set(x, y, z, BASE); continue; }

    // Parapet / cornice
    if (top) { g.set(x, y, z, edge ? TRIM : BASE, edge ? stairsN : undefined); continue; }

    // Stone floor lines (storey bands) on every cell: also serve as floor slabs
    if (rel % 2 === 0) { g.set(x, y, z, BAND); continue; }

    // Window rows
    if (!edge) continue; // air gap, no interiors

    // Entrance: door at street face, lintel stone above it
    if (frontExp && z === 0 && x === doorX) {
      if (rel === 1) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 2) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    }
    if (frontExp && z === 0 && x === doorX && rel === 3) { g.set(x, y, z, BASE); continue; }

    // Window bays on front and back faces: odd columns, brick piers between
    if (faceFB && x % 2 === 1 && x < maxX) {
      // sparse warm light on the upper floors only
      if (rel >= 5 && (x === 3 || x === 7) && frontExp) g.set(x, y, z, "glowstone");
      else g.set(x, y, z, "glass_pane", paneNS);
      continue;
    }

    g.set(x, y, z, BRICK);
  }
}

g.save(`${DIR}/NYC3001522.nbt`);
