import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001623";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 24, D = 6;
const g = new Voxels([W, H, D]);

// Footprint lookup
const M = new Map();
for (const [x, z, gr, rf] of cells) {
  M.set(`${x},${z}`, { g0: Math.max(0, Math.round(gr)), roof: Math.round(rf) });
}
const has = (x, z) => M.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Flat, era-appropriate roof line (1841 three-storey rowhouse, attic cornice).
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
let R = roofs[Math.floor(roofs.length / 2)];
R = Math.min(Math.max(R, 8), H - 4);

// Global storey lines (3 blocks per storey: floor slab + 2-block window band)
const gmin = Math.min(...[...M.values()].map(v => v.g0));
const floors = [];
for (let F = gmin; ; F += 3) {
  if (F > R - 2) break;
  floors.push(F);
}

// ---- Massing: foundation, walls, floor slabs, cornice, parapet ----
for (const [key, { g0 }] of M) {
  const [x, z] = key.split(",").map(Number);
  const top = Math.max(R, g0 + 6);
  const perim = isPerim(x, z);

  // Foundation
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  // Walls on perimeter, base course at ground
  if (perim) {
    for (let y = g0; y <= top - 2; y++) {
      g.set(x, y, z, y === g0 ? "stone_bricks" : "bricks");
    }
  }

  // Storey slabs (solid across footprint, supported by walls)
  for (const F of floors) {
    if (F >= g0 && F <= top - 2) g.set(x, F, z, "smooth_stone");
  }

  // Cornice / roof deck
  g.set(x, top - 1, z, "smooth_stone");

  // Parapet on the perimeter
  if (perim) g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- Facades: windows, piers, door, lit rooms ----
for (const [key, { g0 }] of M) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const top = Math.max(R, g0 + 6);

  const dirs = [];
  if (!has(x, z - 1)) dirs.push("N");
  if (!has(x, z + 1)) dirs.push("S");
  if (!has(x - 1, z)) dirs.push("W");
  if (!has(x + 1, z)) dirs.push("E");
  if (dirs.length !== 1) continue; // corners stay solid brick
  const face = dirs[0];

  const ns = face === "N" || face === "S";
  const idx = ns ? x : z;
  const len = ns ? W : D;
  if (idx <= 0 || idx >= len - 1) continue;

  // Inward offset for the lit room behind the glass
  const [ix, iz] = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[face];

  floors.forEach((F, s) => {
    const y1 = F + 1, y2 = F + 2;
    if (y1 < g0) return;          // below grade
    if (y2 > top - 2) return;     // keep cornice clear
    if (!has(x, z) ) return;

    // Front door on the street (north) facade, ground storey, centre bay
    if (face === "N" && idx === 6 && s === 0) {
      g.set(x, y1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, y2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      return;
    }

    // Piers between window pairs
    if (idx % 3 === 0) return;

    g.set(x, y1, z, "glass");
    g.set(x, y2, z, "glass");

    // Warm light behind some panes
    if ((idx + s) % 3 === 1) {
      const lx = x + ix, lz = z + iz;
      if (has(lx, lz) && !isPerim(lx, lz)) {
        const id = (idx + s) % 2 === 0 ? "glowstone" : "shroomlight";
        g.set(lx, y1, lz, id);
      }
    }
  });
}

// ---- Chimneys rising from the roof deck ----
for (const [cx, cz] of [[3, 2], [10, 3]]) {
  if (!has(cx, cz) || isPerim(cx, cz)) continue;
  const g0 = M.get(`${cx},${cz}`).g0;
  const top = Math.max(R, g0 + 6);
  for (let y = top; y <= top + 2; y++) g.set(cx, y, cz, "bricks");
}

g.save(`${DIR}/${ID}.nbt`);
