// A three-storey inter-war brick commercial block (c. 1925-35) on the Mt Eden / Eden Terrace slope: a basalt base course
// and fascia, red brick piers and spandrels, cream render string courses, sash-window bays in iron-framed glass, a
// shopfront and recessed door at street level, and a plant-room parapet. Roof tiers come from the lidar, median-smoothed:
// 10 = a two-and-a-half storey wing, 12 = the main body, 13 = a one-block core with a chimney. Absolute storey lines
// (floors at 0, 4, 8; string courses at 4 and 8) mean the downhill side shows its extra storey over the foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_948317531.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_948317531.nbt`;

const key = (x, y, z) => `${x},${y},${z}`;
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { x, z, g, r });
const cell = (x, z) => fp.get(`${x},${z}`);
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const WIN_ROWS = new Set([1, 2, 5, 6, 9, 10]);

// Roof tiers: a 3x3 median of the lidar roof heights, then three flat tiers.
for (const c of fp.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell(c.x + dx, c.z + dz); if (n) near.push(n.r); }
  near.sort((a, b) => a - b);
  const m = near[Math.floor(near.length / 2)];
  c.T = m <= 10 ? 10 : m <= 12 ? 12 : 13;
}
// Exposure: outward faces (no footprint cell beyond) and step faces (a lower tier beside a higher one).
for (const c of fp.values()) {
  c.ex = DIRS.filter(([, dx, dz]) => !cell(c.x + dx, c.z + dz));
  c.st = DIRS.filter(([, dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return n && n.T < c.T; });
  c.env = c.ex.length > 0 || c.st.length > 0;
}
// A window sits in an outward-facing wall cell (the primary face: north/south first) with no step above it. Where the
// cell behind is inside the building it is air; on the stair-stepped edge it is solid, so the glass sets in a reveal.
for (const c of fp.values()) {
  c.win = c.ex.length > 0 && c.st.length === 0;
  if (!c.win) continue;
  const [, dx, dz] = c.ex[0];
  c.along = dx !== 0 ? c.z : c.x;   // position along the face
  c.win = c.along % 3 !== 0;        // every third cell is a brick pier
  const inward = cell(c.x - dx, c.z - dz);
  c.inward = inward && !inward.env ? inward : null;
  // a pane needs a wall beside it on the face, or it stands as a thin post
  const wallBeside = (x, z) => { const n = cell(x, z); return !!n && n.env; };
  c.glazed = dx !== 0 ? wallBeside(c.x, c.z - 1) || wallBeside(c.x, c.z + 1) : wallBeside(c.x - 1, c.z) || wallBeside(c.x + 1, c.z);
}

const g = new Voxels([21, 26, 22]);
const placed = new Map();   // "x,y,z" -> block name, for connections and support checks
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); placed.set(key(x, y, z), block); };

const rowMat = (y, T) => {
  if (y === 0 || y === 3) return "stone_bricks";                 // base course, fascia
  if (y === 4 || y === 8) return "white_concrete";                 // render string courses
  if (y === 7 || y === T - 1) return "smooth_stone";               // lintels, cornice
  return "bricks";
};

// Entrance: the street-level window cell on the north face nearest the middle of the face, with a hood over it.
let door = null;
for (const c of fp.values()) {
  if (!c.win || c.g !== 0 || c.T !== 12 || !c.ex.some(([name]) => name === "north")) continue;
  const score = Math.abs(c.along - 10);
  if (!door || score < door.score) door = { c, score };
}
const doorCell = door?.c;

for (const c of fp.values()) {
  const { x, z, g: ground, T } = c;
  for (let y = 0; y < T; y++) {
    if (y < ground) { put(x, y, z, "stone_bricks"); continue; }          // foundation under the grade
    if (!c.env) {                                                     // interior: floor slabs, roof covering, air
      if (y === 0 || y === 4 || y === 8) put(x, y, z, "smooth_stone");
      else if (y === T - 1) put(x, y, z, "stone");
      continue;
    }
    if (c === doorCell && (y === 1 || y === 2)) {
      put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (c === doorCell && y === 3) { put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (c.win && c.glazed && WIN_ROWS.has(y) && y > ground && y < T - 1) {
      put(x, y, z, "glass_pane");
      c.glassRows = c.glassRows || [];
      c.glassRows.push(y);
      continue;
    }
    put(x, y, z, rowMat(y, T));
  }
  // parapet on the outward edge of the main body and the core
  if (c.env && c.ex.length && T >= 12) put(x, T, z, "bricks");
}

// Panes connect along the face to their neighbours (panes or piers), never into the air behind.
const solid = (x, y, z) => placed.has(key(x, y, z));
for (const c of fp.values()) {
  if (!c.glassRows) continue;
  const [face] = c.ex[0];
  const along = face === "north" || face === "south" ? ["west", "east"] : ["north", "south"];
  for (const y of c.glassRows) {
    const d = { north: false, south: false, east: false, west: false };
    for (const name of along) {
      const [dx, dz] = name === "east" ? [1, 0] : name === "west" ? [-1, 0] : name === "south" ? [0, 1] : [0, -1];
      d[name] = solid(c.x + dx, y, c.z + dz);
    }
    put(c.x, y, c.z, "glass_pane", Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String(v)])));
  }
}

// Warm light behind some windows (a glowstone in the room cell behind the glass).
for (const c of fp.values()) {
  if (!c.glassRows || !c.inward) continue;
  for (const y of c.glassRows) {
    if (((c.x * 3 + c.z * 5 + y) % 7) !== 0) continue;
    put(c.inward.x, y, c.inward.z, "glowstone");
  }
}

// Roof: a plant room with a stone cap on the main roof, two rooftop units, a chimney on the core, lanterns on corners.
const mainInterior = (x, z) => { const c = cell(x, z); return c && c.T === 12 && !c.env && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => { const n = cell(x + dx, z + dz); return n && !n.env; }); };
let plant = null;
for (const c of fp.values()) {
  if (plant || !mainInterior(c.x, c.z) || !mainInterior(c.x + 1, c.z) || !mainInterior(c.x, c.z + 1) || !mainInterior(c.x + 1, c.z + 1)) continue;
  if (Math.abs(c.x - 10) > 4) continue;
  plant = c;
}
if (plant) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
  put(plant.x + dx, 12, plant.z + dz, "stone_bricks");
  put(plant.x + dx, 13, plant.z + dz, "stone_bricks");
  put(plant.x + dx, 14, plant.z + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
const units = [...fp.values()].filter((c) => mainInterior(c.x, c.z) && !(plant && Math.abs(c.x - plant.x) <= 2 && Math.abs(c.z - plant.z) <= 2));
for (const i of [Math.floor(units.length / 3), Math.floor((2 * units.length) / 3)]) if (units[i]) put(units[i].x, 12, units[i].z, "iron_block");
const core = [...fp.values()].find((c) => c.T === 13 && !c.env && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return n && !n.env; }));
if (core) {
  put(core.x, 13, core.z, "bricks");
  put(core.x, 14, core.z, "bricks");
  put(core.x, 15, core.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const c of fp.values()) {
  if (c.T === 12 && c.ex.length === 2 && (c.x + 2 * c.z) % 5 === 0) put(c.x, 13, c.z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Checks: every block rests on something (below, or beside it in the same course), and the count of blocks.
let hanging = 0;
for (const k of placed.keys()) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0) continue;
  const below = solid(x, y - 1, z);
  const beside = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => solid(x + dx, y, z + dz));
  if (!below && !beside) hanging++;
}
const stats = g.save(OUT);
const tiers = {}; for (const c of fp.values()) tiers[c.T] = (tiers[c.T] || 0) + 1;
console.log(JSON.stringify({ blocks: stats.blocks, palette: stats.palette, tiers, hanging, door: doorCell ? [doorCell.x, doorCell.z] : null, plant: plant ? [plant.x, plant.z] : null, core: core ? [core.x, core.z] : null }));
