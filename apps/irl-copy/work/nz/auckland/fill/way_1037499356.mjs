// Formery West: a 1970s-80s concrete-frame office tower on a stone plinth, the central city's usual grid.
// White concrete pillars every third bay, light-grey spandrels, tinted glass between, a dark awning at the street
// door. Massing is read from the lidar roof, median-smoothed and quantized to flat tiers: wings at 17/21/25, the
// tower at 77, a setback at 81, a crown at 85. Interior is air behind the glass, with floor slabs and pillar columns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const OUT = `${DIR}/way_1037499356.nbt`;
const cells = JSON.parse(readFileSync(`${DIR}/way_1037499356.cells.json`, "utf8"));
const g = new Voxels([39, 97, 34]);

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const at = (x, z) => foot.get(key(x, z));
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const DATUM = 5;          // the highest ground under the footprint: the ground floor's slab
const GROUND_TOP = 9;     // the ground storey runs y 5..8

// 1. the roof: a 3x3 median kills lidar spikes at the edges, then flat tiers (each 1 mod 4 above the datum: storey lines)
const median = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];
for (const c of foot.values()) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) near.push(n.roof); }
  const sr = median(near);
  c.top = sr >= 82 ? 85 : sr >= 79 ? 81 : sr >= 60 ? 77 : sr <= 18 ? 17 : sr <= 21 ? 21 : 25;
}

// the sides of a cell at height y that face open air: off the footprint, or past the neighbour's roof
const exposed = (c, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => { const n = at(c.x + dx, c.z + dz); return !n || y >= n.top; }).map(([f]) => f);
// interior structure: a pillar every 4 cells, so the floor slabs have something under them
const pillarCol = (c) => c.x % 4 === 0 && c.z % 4 === 0;
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // runs along x
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // runs along z
const GLASS = "gray_stained_glass_pane", TINT = "cyan_stained_glass_pane";   // dark tinted glass, so the grid reads against the white frame

// 2. the body: plinth, then per cell a column from the datum to its roof
for (const c of foot.values()) {
  for (let y = 0; y < 4; y++) g.set(c.x, y, c.z, "stone_bricks");
  g.set(c.x, 4, c.z, "smooth_stone");                          // the plinth's cap course
  for (let y = DATUM; y < c.top; y++) {
    const s = (y - DATUM) % 4, top = y === c.top - 1, faces = exposed(c, y);   // s: 0 spandrel, 1-2 glass, 3 header
    if (!faces.length) {                                       // interior: air behind the glass, slabs, pillars
      if (top) g.set(c.x, y, c.z, "gray_concrete");
      else if (pillarCol(c)) g.set(c.x, y, c.z, "white_concrete");
      else if (s === 0) g.set(c.x, y, c.z, "light_gray_concrete");
      continue;
    }
    const corner = faces.length > 1, ns = faces.includes("north") || faces.includes("south");
    const bay = (ns ? c.x : c.z) % 3 === 0;                    // the pillar bays on this face
    if (top) g.set(c.x, y, c.z, "smooth_stone");               // parapet
    else if (s === 0) g.set(c.x, y, c.z, y < GROUND_TOP ? "smooth_stone" : "light_gray_concrete");
    else if (s === 3 || corner || bay) g.set(c.x, y, c.z, "white_concrete");
    else g.set(c.x, y, c.z, (c.x + c.z * 2 + y) % 5 === 0 ? TINT : GLASS, ns ? PANE_EW : PANE_NS);
  }
}

// 3. the street door: the uphill face (ground 5, north or west), a dark awning band, two hanging lanterns
const street = [...foot.values()].filter((c) => c.ground === DATUM && exposed(c, DATUM).some((f) => f === "north" || f === "west"));
const tower = street.filter((c) => c.top >= 77);
const door = (tower.length ? tower : street)[(tower.length ? tower : street).length >> 1];
const face = exposed(door, DATUM).find((f) => f === "north" || f === "west") ?? exposed(door, DATUM)[0];
const [ax, az] = face === "north" || face === "south" ? [1, 0] : [0, 1];
const doorState = (half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
g.set(door.x, DATUM, door.z, "dark_oak_door", doorState("lower"));
g.set(door.x, DATUM + 1, door.z, "dark_oak_door", doorState("upper"));
for (let k = -2; k <= 2; k++) {
  const c = at(door.x + k * ax, door.z + k * az);
  if (!c) continue;
  g.set(c.x, 8, c.z, "black_concrete");
  if (Math.abs(k) === 1) g.set(c.x, 7, c.z, "lantern", { hanging: "true", waterlogged: "false" });
}

// 4. warm light behind some glass: a shroomlight or glowstone in the air gap just inside a single-face pane
for (const c of foot.values()) for (let y = DATUM + 1; y < c.top - 1; y++) {
  const s = (y - DATUM) % 4;
  if (s !== 1 && s !== 2) continue;
  const faces = exposed(c, y);
  if (faces.length !== 1) continue;
  const ns = faces[0] === "north" || faces[0] === "south";
  if ((ns ? c.x : c.z) % 3 === 0) continue;                  // a pillar, not a pane
  const [dx, dz] = DIRS[faces[0]];
  const inner = at(c.x - dx, c.z - dz);
  if (!inner || inner.top <= y || pillarCol(inner) || exposed(inner, y).length) continue;
  const h = (c.x * 7 + c.z * 13 + y * 3) % 23;
  if (h === 0) g.set(inner.x, y, inner.z, "shroomlight");
  else if (h === 11) g.set(inner.x, y, inner.z, "glowstone");
}

// 5. roof equipment: plant boxes on the interior of each roof (the wings, the tower top, the setback)
for (const c of foot.values()) {
  if (c.top === 85 || pillarCol(c) || exposed(c, c.top - 1).length) continue;
  if ((c.x * 5 + c.z * 3) % 17 !== 0) continue;
  g.set(c.x, c.top, c.z, "light_gray_concrete");
  g.set(c.x, c.top + 1, c.z, "smooth_stone");
}

const stats = g.save(OUT);
console.log(`saved ${OUT}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
