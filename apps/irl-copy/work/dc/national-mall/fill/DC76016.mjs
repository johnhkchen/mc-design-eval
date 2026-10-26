import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 24, H = 31, D = 12;
const MAX_TOP = 28; // keeps parapet (+2) inside the 31-high grid

// Materials: 1250 H St NW, a mid-century downtown office block:
// granite plinth, pale precast/quartz piers and bands, tinted glass in a grid.
const FOUND = "granite";
const PLINTH = "polished_granite";
const BAND = "smooth_quartz";
const PIER = "white_concrete";
const GLASS = "light_blue_stained_glass";
const FLOOR_IN = "light_gray_concrete";
const ROOF = "light_gray_concrete";
const PARAPET = "smooth_quartz";
const DOOR = "dark_oak_door";

const raw = JSON.parse(readFileSync(`${DIR}/DC76016.cells.json`, "utf8"));
const cellMap = new Map();
for (const [x, z, gr, roof] of raw) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    cellMap.set(`${x},${z}`, { x, z, gr: Number(gr), roof: Number(roof) });
  }
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
const isPier = (x, z) => isCorner(x, z) || ((z === 0 || z === D - 1) ? x % 3 === 0 : z % 3 === 0);
const isDoor = (x, z) => z === 0 && x === 11;
const isDoorSurround = (x, z) => z === 0 && (x === 10 || x === 12);

// Lidar roof smoothed over a 3x3 neighbourhood to remove noise
function avgRoof(x, z) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = cellMap.get(`${x + dx},${z + dz}`);
    if (c) { s += c.roof; n++; }
  }
  return n ? s / n : 0;
}

// One clean roof line for the whole building: median of the smoothed lidar roofs
const smoothed = [...cellMap.values()].map(c => avgRoof(c.x, c.z)).sort((a, b) => a - b);
const R = smoothed.length ? smoothed[Math.floor(smoothed.length / 2)] : 19;

// Per-cell massing in 4-block storeys. Every cell shares the same roof line,
// so the skyline is flat tiers with no stubs; each cell's foundation takes up its own ground.
const cols = [];
for (const c of cellMap.values()) {
  const gr = Math.min(24, Math.max(0, Math.round(c.gr)));
  let n = Math.max(1, Math.round((R - gr) / 4));
  n = Math.min(n, Math.max(1, Math.floor((MAX_TOP - gr) / 4)));
  const S = gr + 4 * n;
  cols.push({ x: c.x, z: c.z, gr, n, S, edge: isEdge(c.x, c.z) });
}

const g = new Voxels([W, H, D]);

for (const c of cols) {
  const { x, z, gr, n, S, edge } = c;

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let k = 0; k < n; k++) {
    const base = gr + 4 * k;

    // Storey floor slab (plinth course for the first storey on the perimeter)
    let floor;
    if (edge) floor = k === 0 ? PLINTH : BAND;
    else floor = FLOOR_IN;
    g.set(x, base, z, floor);

    if (edge) {
      for (let dy = 1; dy <= 3; dy++) {
        const y = base + dy;
        if (k === 0 && isDoor(x, z)) {
          if (dy === 1) { g.set(x, y, z, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
          if (dy === 2) { g.set(x, y, z, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
          g.set(x, y, z, BAND); continue; // lintel over entrance
        }
        if (k === 0 && isDoorSurround(x, z) && dy <= 2) { g.set(x, y, z, PIER); continue; }
        if (k === 0 && z === 0 && dy === 3 && (x === 10 || x === 11 || x === 12)) { g.set(x, y, z, BAND); continue; }
        g.set(x, y, z, isPier(x, z) ? PIER : GLASS);
      }

      // Warm light behind selected windows, one block inside the glass
      if (!isPier(x, z) && !isDoor(x, z)) {
        if (z === 0 && x % 6 === 2 && has(x, 1)) g.set(x, base + 2, 1, "shroomlight");
        if (z === D - 1 && x % 6 === 4 && has(x, D - 2)) g.set(x, base + 2, D - 2, "shroomlight");
        if (x === 0 && z % 6 === 3 && has(1, z)) g.set(1, base + 2, z, "shroomlight");
      }
    }
  }

  // Roof deck / cornice at the top of the stack
  g.set(x, S, z, edge ? BAND : ROOF);
  if (edge) {
    g.set(x, S + 1, z, PARAPET);
    g.set(x, S + 2, z, PARAPET);
  }
}

// Rooftop mechanical plant on the central interior cells
for (const c of cols) {
  if (c.edge) continue;
  if (c.x >= 8 && c.x <= 13 && c.z >= 4 && c.z <= 7 && c.S + 2 <= 30) {
    g.set(c.x, c.S + 1, c.z, FLOOR_IN);
    g.set(c.x, c.S + 2, c.z, "smooth_quartz");
  }
}

g.save(`${DIR}/DC76016.nbt`);
