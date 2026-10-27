// 47 Saint Paul Street Accommodation (Grafton, Auckland): a 1990s-2000s concrete-frame student block, eight storeys
// on a plinth with a ninth-storey core on the west side. Pale concrete piers and storey lines, blue glazing in bays,
// a dark roof membrane, a cornice and parapet per tier, plant on the core and a lintel canopy over the entrance.
// Storey lines sit on a 4-block grid from y 9 (the ground-floor slab), so each tier's roof lands on a slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020933.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([32, 55, 25]);

// lidar roof heights smoothed into three flat tiers: the core (42), the main block (38), the low wings (34)
const tier = (r) => (r >= 40 ? 42 : r >= 36 ? 38 : 34);
const F = new Map();
for (const [x, z, G, r] of cells) F.set(`${x},${z}`, { x, z, G, R: tier(r) });
const list = [...F.values()];
const at = (x, z) => F.get(`${x},${z}`);
const DIRS = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const SLAB0 = 9;                                    // ground-floor slab: storey lines at 9, 13, 17 ... 33, 37, 41

// faces of cell c that are outside the building at height y (outside the footprint, or the neighbour's roof is below y)
const open = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.R <= y; }).map((d) => d[2]);
// the cell's own edge at its roof line: the parapet and cornice only stand where the roof meets air or a lower tier
const roofEdge = (c) => DIRS.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.R < c.R; });

// what a perimeter (exposed) or interior cell holds at height y; "FACADE" marks a bay that takes glass or a pier
function layer(c, y) {
  const exposed = open(c, y).length > 0;
  if (y === c.R - 1) return exposed ? "light_gray_concrete" : "gray_concrete";       // cornice / roof membrane
  if (y >= SLAB0 && (y - SLAB0) % 4 === 0) return exposed ? "light_gray_concrete" : "gray_concrete";  // floor slab
  if (!exposed) return null;                                                          // air: the gap behind the glass
  if (y < 6) return "stone_bricks";                                                    // base course on the plinth
  if (y < SLAB0) return y === 8 ? "smooth_quartz" : "FACADE";                        // lobby: glass with a header
  return (y - SLAB0) % 4 === 3 ? "light_gray_concrete" : "FACADE";                    // spandrel under each slab
}

// entrance: the north-most exposed cell, nearest the middle of that run
const north = list.filter((c) => !at(c.x, c.z - 1));
const minZ = Math.min(...north.map((c) => c.z));
const row = north.filter((c) => c.z === minZ);
const midX = row.map((c) => c.x).sort((a, b) => a - b)[Math.floor(row.length / 2)];
const door = row.reduce((a, c) => (Math.abs(c.x - midX) < Math.abs(a.x - midX) ? c : a));
const isDoorCell = (c, y) => c.x === door.x && c.z === door.z && (y === door.G || y === door.G + 1);
const lobby = (c, y) => y >= 6 && y <= 7 && c.z === door.z && Math.abs(c.x - door.x) <= 1;

const glass = new Map();     // key x,y,z -> the facade axis: "x" runs along a north/south wall, "z" along an east/west wall

// foundation and the building's own layers
for (const c of list) {
  for (let y = 0; y < c.G; y++) g.set(c.x, y, c.z, "stone");
  for (let y = c.G; y < c.R; y++) {
    if (isDoorCell(c, y)) continue;
    const L = lobby(c, y) && open(c, y).length ? "FACADE_GLASS" : layer(c, y);
    if (L === null) continue;
    if (L === "FACADE" || L === "FACADE_GLASS") {
      const ex = open(c, y);
      const u = ex.includes("N") || ex.includes("S") ? c.x : c.z;
      const bayGlass = L === "FACADE_GLASS" || u % 3 !== 0;
      if (bayGlass) { glass.set(`${c.x},${y},${c.z}`, ex.includes("N") || ex.includes("S") ? "x" : "z"); }
      else g.set(c.x, y, c.z, "smooth_quartz");
    } else g.set(c.x, y, c.z, L);
  }
  if (roofEdge(c)) g.set(c.x, c.R, c.z, "smooth_quartz");                             // parapet on the roof's edge
}

// glazing: panes connect to the neighbouring panes on the same wall
for (const [k, axis] of glass) {
  const [x, y, z] = k.split(",").map(Number);
  const has = (dx, dz) => glass.get(`${x + dx},${y},${z + dz}`) === axis;
  const pane = axis === "x"
    ? { north: "false", south: "false", east: String(has(1, 0)), west: String(has(-1, 0)) }
    : { north: String(has(0, -1)), south: String(has(0, 1)), east: "false", west: "false" };
  g.set(x, y, z, "light_blue_stained_glass_pane", { ...pane, waterlogged: "false" });
}

// warm light behind some upper-floor windows: a glowstone in the air gap, one per few bays
for (const [k] of glass) {
  const [x, y, z] = k.split(",").map(Number);
  if (y < 10 || (y - SLAB0) % 4 !== 1 || (x * 31 + z * 17 + y * 7) % 9 !== 0) continue;
  const c = at(x, z); const [dx, dz] = INWARD[open(c, y)[0]] || [0, 0];
  const b = at(x + dx, z + dz);
  if (b && layer(b, y) === null) g.set(x + dx, y, z + dz, "glowstone");
}

// the entrance: a door on the plinth, a dark lintel band over it, and a lobby light inside
g.set(door.x, door.G, door.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(door.x, door.G + 1, door.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dx of [-1, 0, 1]) {
  const n = at(door.x + dx, door.z);
  if (n && n.R > 8) g.set(n.x, 8, n.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}
const inside = at(door.x, door.z + 1);
if (inside && inside.R > 8) g.set(inside.x, door.G + 2, inside.z, "glowstone");

// roof: air-conditioning plant on the main tier, a plant room and mast on the core
const flat = (x, z, R) => { const c = at(x, z); return c && c.R === R; };
for (const c of list) {
  if (c.R !== 38) continue;
  if (c.x % 7 === 3 && c.z % 7 === 3 && [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => flat(c.x + dx, c.z + dz, 38))) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(c.x + dx, 38, c.z + dz, "iron_block");
  }
}
const coreCells = list.filter((c) => c.R === 42);
const inset = (c) => [-2, -1, 0, 1, 2].every((dx) => [-2, -1, 0, 1, 2].every((dz) => flat(c.x + dx, c.z + dz, 42)));
const plant = coreCells.filter(inset);
for (const c of plant) for (let y = 42; y <= 43; y++) g.set(c.x, y, c.z, "light_gray_concrete");
if (plant.length) {
  const cx = Math.round(plant.reduce((s, c) => s + c.x, 0) / plant.length);
  const cz = Math.round(plant.reduce((s, c) => s + c.z, 0) / plant.length);
  const hit = plant.reduce((a, c) => (Math.hypot(c.x - cx, c.z - cz) < Math.hypot(a.x - cx, a.z - cz) ? c : a));
  for (let y = 44; y <= 46; y++) g.set(hit.x, y, hit.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const info = g.save(`${DIR}/way_293020933.nbt`);
console.log(JSON.stringify({ footprint: list.length, door: [door.x, door.G, door.z], ...info }));
