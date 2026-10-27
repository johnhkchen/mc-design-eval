// Way 28787499: a 1930s stripped-Classical office block, four storeys over a basalt plinth, on the footprint
// the lidar gave. Plaster walls with quartz piers, glass bays, a string course per storey, a coping and parapet,
// a recessed-looking door surround at the middle of the street face, lit bays behind the glass, and a roof plant room.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_28787499.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

// The lidar roof (0..16 above y 0) smoothed into four flat tiers: one, two, three and four storeys.
const tier = (r) => (r >= 13 ? 16 : r >= 9 ? 12 : r >= 5 ? 8 : 4);
const cellAt = new Map();
for (const [x, z, b, r] of cells) cellAt.set(`${x},${z}`, { x, z, b, H: tier(r) });
const at = (x, z) => cellAt.get(`${x},${z}`) ?? null;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];                                      // north, south, west, east
const NAME = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

// The sides of a column that face air at height y: outside the footprint, or above a lower neighbour's roof.
const open = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y >= n.H; });

// A window pane whose wall runs along x (north or south face) or along z (east or west face).
const pane = (id, alongX) => ({ id, st: alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }, win: true });

// The street-face skin of one exposed course: ground floor shopfront, upper storeys with piers and glazed bays.
function facade(c, y, dirs) {
  const alongX = dirs.some(([, dz]) => dz !== 0);
  const u = alongX ? c.x : c.z;
  const pier = dirs.length > 1 || u % 3 === 0;
  if (y < 4) {
    if (y === c.b || y === 3) return { id: "polished_andesite", st: null };   // plinth course and fascia
    if (pier) return { id: "quartz_pillar", st: { axis: "y" } };              // light pilasters carry the shopfront
    return pane("glass_pane", alongX);
  }
  const row = y % 4;
  if (row === 0) return { id: "polished_andesite", st: null };          // string course
  if (row === 3) return { id: "smooth_quartz", st: null };             // spandrel under the next sill
  if (pier) return { id: "quartz_pillar", st: { axis: "y" } };
  return pane("light_blue_stained_glass_pane", alongX);
}

// What a column holds at height y: foundation, walls, floor slabs and roof; null is air.
function blockAt(c, y) {
  if (y < c.b) return { id: "stone_bricks", st: null };                // foundation down to the lowest ground
  if (y === c.H) return open(c, y).length ? { id: "smooth_quartz", st: null } : null;      // parapet
  if (y === c.H - 1) return { id: open(c, y).length ? "polished_andesite" : "gray_concrete", st: null };
  const dirs = open(c, y);
  if (dirs.length) return facade(c, y, dirs);
  if (y === c.b || (y > 0 && y % 4 === 0)) return { id: "smooth_stone", st: null };     // floor slab, air above
  return null;
}

const Y = 29;
const g = new Voxels([39, Y, 41]);
const lights = [];
for (const c of cellAt.values()) for (let y = 0; y <= c.H; y++) {
  const k = blockAt(c, y);
  if (!k) continue;
  g.set(c.x, y, c.z, k.id, k.st);
  // a lit bay: the lowest window row, with a light standing on the floor just inside
  const dirs = open(c, y), lowRow = y === c.b + 1 || (y >= 4 && y % 4 === 1);
  const lit = (c.x * 7 + c.z * 13 + y * 5) % 4;
  if (k.win && lowRow && dirs.length === 1 && (y < 4 ? lit !== 0 : lit === 0))     // shops lit most bays; upper floors some
    lights.push({ x: c.x - dirs[0][0], y, z: c.z - dirs[0][1], ground: y < 4 });
}
for (const { x, y, z, ground } of lights) {
  if (g.get(x, y, z) || !g.get(x, y - 1, z)) continue;                // only in air, standing on a floor
  if (ground) g.set(x, y, z, "glowstone"); else g.set(x, y, z, "lantern", { hanging: "false" });
}

// The entrance: the middle plain wall cell of the top-tier face with the most street frontage.
const all = [...cellAt.values()];
const faces = DIRS.map((d) => all.filter((c) => c.H >= 12 && open(c, c.b + 1).length === 1 && same(open(c, c.b + 1)[0], d)));
const best = DIRS.findIndex((d) => faces[DIRS.indexOf(d)].length === Math.max(...faces.map((f) => f.length)));
const dir = DIRS[best], run = faces[best].sort((a, b) => (dir[0] ? a.z - b.z : a.x - b.x));
const door = run[Math.floor(run.length / 2)], facing = NAME[dir.join(",")];
const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
g.set(door.x, door.b + 1, door.z, "dark_oak_door", doorState("lower"));
g.set(door.x, door.b + 2, door.z, "dark_oak_door", doorState("upper"));

// Roof plant room: a 5 x 5 box with glazed faces on the tallest tier, stood on the roof, nearest the middle of the block.
let plant = null;
for (const c of all.filter((c) => c.H === 16)) {
  let ok = true;
  for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2; dz++) { const n = at(c.x + dx, c.z + dz); if (!n || n.H !== 16) { ok = false; break; } }
  if (!ok) continue;
  const d = Math.hypot(c.x - 19, c.z - 20);
  if (!plant || d < plant.d) plant = { x: c.x, z: c.z, d };
}
if (plant) {
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const x = plant.x + dx, z = plant.z + dz, rim = Math.max(Math.abs(dx), Math.abs(dz)) === 2;
    g.set(x, 19, z, "gray_concrete");                                          // roof slab
    if (!rim) continue;
    for (let y = 16; y <= 18; y++) {
      const mid = y === 17 && (dx === 0 || dz === 0);
      if (mid) g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      else g.set(x, y, z, "smooth_quartz");
    }
  }
}

g.save(`${DIR}/way_28787499.nbt`);
console.log(`way 28787499: ${g.count()} blocks, ${g.palette.length - 1} palette entries, door at ${door.x},${door.z} facing ${facing}, plant room ${plant ? "placed" : "none"}`);
