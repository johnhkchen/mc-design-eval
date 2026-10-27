import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1970s concrete-frame office block on a falling site: a 4-storey datum (floor lines at y 6, 10, 14, 18, 22, 26),
// a 2-storey podium on the north edge (lidar roof 11), a taller core on the west (lidar 27) and the main roof at 23.
// Facades: light-grey piers, grey mullions, blue glass panes, white floor-line bands, a polished base course,
// foundation to each cell's ground, the downhill side showing its extra lower storey.
const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_401588397.cells.json`, "utf8"));

const FLOORS = [6, 10, 14, 18, 22, 26];
const TIERS = [10, 14, 18, 22, 26];          // roof top index per tier; lidar roof R sits at top index R-1, snapped to a floor line

// lidar roof per cell, snapped to the nearest tier; then a 3x3 median over footprint neighbours removes the
// single-cell spikes (isolated 27s and dips) so each tier is a clean flat mass
const snap = (R) => { let T = TIERS[0]; for (const t of TIERS) if (Math.abs(t - (R - 1)) < Math.abs(T - (R - 1))) T = t; return T; };
const raw = new Map(cells.map(([x, z, g, R]) => [`${x},${z}`, { x, z, g, T: snap(R) }]));
const at = new Map();
for (const [k, c] of raw) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = raw.get(`${c.x + dx},${c.z + dz}`); if (n) near.push(n.T);
  }
  near.sort((a, b) => a - b);
  at.set(k, { x: c.x, z: c.z, g: c.g, T: near[Math.floor(near.length / 2)] });
}
const cell = (x, z) => at.get(`${x},${z}`);
const inside = (x, y, z) => { const c = cell(x, z); return !!c && y >= c.g && y <= c.T; };
const SIDES = [["E", 1, 0], ["W", -1, 0], ["N", 0, -1], ["S", 0, 1]];
const exposed = (x, z, y) => SIDES.filter(([, dx, dz]) => !inside(x + dx, y, z + dz)).map(([s]) => s);
const OUT = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };

const v = new Voxels([37, 40, 27]);
const put = (x, y, z, b, st) => v.set(x, y, z, b, st);
const windows = [];

for (const { x, z, g, T } of at.values()) {
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");          // foundation up to the cell's ground
  for (let y = g; y <= T; y++) {
    const faces = exposed(x, z, y);
    if (y === T) {                                                     // roof deck, cornice on the edge, parapet above
      put(x, y, z, faces.length ? "smooth_stone" : "gray_concrete");
      if (faces.length) put(x, y + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (!faces.length) { if (FLOORS.includes(y)) put(x, y, z, "smooth_stone"); continue; }   // interior floor slab, air elsewhere
    const corner = faces.some((f) => f === "E" || f === "W") && faces.some((f) => f === "N" || f === "S");
    const face = faces[0];
    const ew = face === "E" || face === "W";
    const u = ew ? z : x;                                             // position along the face
    const header = ((y - 6) % 4 + 4) % 4 === 3;                       // top course of each storey
    if (y === 6 || y === g) put(x, y, z, "polished_andesite");        // base course at grade
    else if (FLOORS.includes(y)) put(x, y, z, "white_concrete");      // storey lines
    else if (header || corner || u % 4 === 0) put(x, y, z, "light_gray_concrete");   // piers and bands
    else if (u % 4 === 2) put(x, y, z, "gray_concrete");              // mullion frames
    else {
      put(x, y, z, "light_blue_stained_glass_pane",
        { north: String(ew), south: String(ew), east: String(!ew), west: String(!ew), waterlogged: "false" });
      windows.push({ x, y, z, face });
    }
  }
}

// warm light behind some panes, on the storey floor (sits on the floor slab)
for (const w of windows) {
  if ((w.y - 6) % 4 !== 1 || (w.x + w.z + w.y) % 5 !== 0) continue;
  const [dx, dz] = OUT[w.face], ix = w.x - dx, iz = w.z - dz;
  if (inside(ix, w.y, iz) && !exposed(ix, iz, w.y).length) put(ix, w.y, iz, "glowstone");
}

// street entrance on the east face, at the lowest ground (downhill side), recessed under a lintel
const east = [...at.values()].filter((c) => !cell(c.x + 1, c.z));
const midZ = east.reduce((s, c) => s + c.z, 0) / east.length;
const door = east.reduce((best, c) => {
  if (!best) return c;
  if (c.g !== best.g) return c.g < best.g ? c : best;
  return Math.abs(c.z - midZ) < Math.abs(best.z - midZ) ? c : best;
}, null);
const dz = { facing: "east", hinge: "left", open: "false", powered: "false" };
put(door.x, door.g + 1, door.z, "iron_door", { ...dz, half: "lower" });
put(door.x, door.g + 2, door.z, "iron_door", { ...dz, half: "upper" });
put(door.x, door.g + 3, door.z, "light_gray_concrete");

// roof plant: a solid 5 x 3 box, two high, on the main roof (tier 22), away from the tower
let plant = null;
for (const c of at.values()) {
  if (plant) break;
  const rect = [];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) rect.push([c.x + i, c.z + j]);
  if (rect.every(([x, z]) => cell(x, z) && cell(x, z).T === 22)) plant = rect;
}
if (plant) {
  for (const [x, z] of plant) {
    put(x, 23, z, "light_gray_concrete");
    put(x, 24, z, "light_gray_concrete");
    put(x, 25, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

const stats = v.save(`${HERE}/way_401588397.nbt`);
console.log(`built: ${cells.length} footprint cells, door at (${door.x}, ${door.g + 1}, ${door.z}), plant ${plant ? "placed" : "none"}`, stats);
