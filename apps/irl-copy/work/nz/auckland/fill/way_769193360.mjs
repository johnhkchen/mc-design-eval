// way 769193360: a two-storey Edwardian brick-and-plaster commercial block (Auckland, c. 1910-20) on a sloping site.
// Red brick walls on a stone plinth, cream plaster string courses, lintels and cornice, a timber shopfront on the
// ground floor, and a stepped massing from the lidar roof rounded to 4-block storey lines: a 3-storey corner bay
// (north-west), the 2-storey body, and a single-storey east wing. The interior is a sealed shell (solid roof, floor
// slabs, air between), and every window has air behind its pane, some with a warm lamp just inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769193360.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769193360.nbt";
const W = 29, H = 24, D = 23;

const FOUND = "stone_bricks", BRICK = "bricks", CREAM = "smooth_quartz", TIMBER = "dark_oak_planks";
const ROOF = "smooth_stone", FLOOR = "smooth_stone", GLASS = "glass_pane", UNIT = "light_gray_concrete";
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// Each footprint cell: its ground g, and its top T (the lidar roof rounded to a 4-block storey line, at least 3 above g).
// The lidar roof is noisy cell to cell, so each roof is the median of its footprint neighbours (3 x 3) first.
const lidar = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const cell = new Map();
for (const [x, z, g] of cells) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = lidar.get(`${x + dx},${z + dz}`); if (n) near.push(n.r); }
  near.sort((a, b) => a - b);
  const roof = near[near.length >> 1];
  cell.set(`${x},${z}`, { x, z, g, T: Math.max(4 * Math.round(roof / 4), g + 3) });
}
const get = (x, z) => cell.get(`${x},${z}`);
// Tiers are flat: a cell whose top stands out from its neighbours (fewer than 2 of its 4 neighbours share it) takes
// the commonest top around it, so no lone spikes are left from the lidar.
for (const c of [...cell.values()]) {
  const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => get(c.x + dx, c.z + dz)).filter(Boolean);
  if (side.filter((n) => n.T === c.T).length >= 2) continue;
  const around = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = get(c.x + dx, c.z + dz); if (n && n !== c) around.set(n.T, (around.get(n.T) ?? 0) + 1); }
  const [top] = [...around].sort((a, b) => b[1] - a[1])[0] ?? [c.T];
  c.T = Math.max(top, c.g + 3);
}

// A wall cell is on the footprint's edge or steps down to a lower neighbour (its face above that is exterior).
for (const c of cell.values()) c.wall = DIRS.some(([dx, dz]) => { const n = get(c.x + dx, c.z + dz); return !n || n.T < c.T; });
for (const c of cell.values()) {
  // exterior storey lines: 4, 8, ... strictly above the ground and below the roof
  c.strings = [];
  for (let y = 4; y < c.T - 1; y += 4) if (y > c.g) c.strings.push(y);
  // interior floor slabs: the ground floor, the roof, and each line with at least 3 air rows above the one before
  c.floors = new Set([c.g, c.T - 1]);
  let last = c.g;
  for (const y of c.strings) if (y - last >= 3) { c.floors.add(y); last = y; }
}
// Interior air: inside the footprint, not a wall, between its ground and its roof, and not on a floor slab.
const airAt = (c, y) => !!c && !c.wall && y > c.g && y < c.T - 1 && !c.floors.has(y);
// The interior cell behind a wall cell at height y, if it is air there (so a window has an air gap behind it).
const behind = (c, y) => { for (const [dx, dz] of DIRS) { const n = get(c.x - dx, c.z - dz); if (airAt(n, y)) return n; } return null; };
// Wall cells step down toward the exterior: the cells that face a lower or missing neighbour along x or z.
const exposedX = (c) => { const e = get(c.x + 1, c.z), w = get(c.x - 1, c.z); return !e || e.T < c.T || !w || w.T < c.T; };
const exposedZ = (c) => { const s = get(c.x, c.z + 1), n = get(c.x, c.z - 1); return !s || s.T < c.T || !n || n.T < c.T; };
// The facade rhythm runs along the wall: x on north and south faces, z on east and west (corners follow x).
const bayIndex = (c) => (exposedZ(c) && !exposedX(c) ? c.z : c.x);
const outward = (c) => (DIRS.find(([dx, dz]) => { const n = get(c.x + dx, c.z + dz); return !n || n.T < c.T; }) ?? DIRS[2])[2];

// Entrance: a south-edge wall cell with air behind its two lowest storey rows and a neighbour either side.
let door = null;
for (const c of [...cell.values()].sort((a, b) => Math.abs(a.x - 10) - Math.abs(b.x - 10))) {
  if (door || !c.wall || get(c.x, c.z + 1) || c.T < c.g + 4 || c.x < 4 || c.x > 24) continue;
  const inn = get(c.x, c.z - 1);
  if (airAt(inn, c.g + 1) && airAt(inn, c.g + 2) && get(c.x - 1, c.z) && get(c.x + 1, c.z)) door = c;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, st) => g.set(x, y, z, b, st);
const stats = { glass: 0, lamps: 0, floors: 0 };

for (const c of cell.values()) {
  const { x, z, g: gr, T } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);            // foundation up to this cell's ground
  for (let y = gr; y < T; y++) {
    if (!c.wall) { if (c.floors.has(y)) put(x, y, z, y === T - 1 ? ROOF : FLOOR); continue; }
    if (y === gr || y === T - 1 || c.strings.includes(y)) { put(x, y, z, y === gr ? FOUND : CREAM); continue; }
    // the band between two storey lines: window rows (glass, brick piers) and a lintel row on top
    const bounds = [c.g, ...c.strings, c.T - 1];
    const i = bounds.findIndex((b, k) => y > b && y < bounds[k + 1]);
    const s = bounds[i] + 1, L = bounds[i + 1] - s, r = y - s, first = i === 0;
    if (r === L - 1) { put(x, y, z, first ? TIMBER : BRICK); continue; }   // shopfront fascia, else a brick soldier course
    const pier = bayIndex(c) % 3 === 0;
    const back = r < 2 ? behind(c, y) : null;
    if (r < 2 && !pier && back) {
      put(x, y, z, GLASS); stats.glass++;
      // some panes get a warm lamp just inside, standing on the floor below
      if (r === 0 && back.floors.has(y - 1) && (x * 5 + z * 3 + y * 7) % 4 === 0) {
        if ((x + z) % 2) put(back.x, y, back.z, "glowstone"); else put(back.x, y, back.z, "lantern", { hanging: "false", waterlogged: "false" });
        stats.lamps++;
      }
    } else put(x, y, z, first && pier ? TIMBER : BRICK);
  }
  if (c.wall) put(x, T, z, CREAM, { type: "bottom", waterlogged: "false" });       // parapet coping
}

// The entrance: a dark oak door in the south wall with timber jambs and a hood over it, and its open front to the outside.
if (door) {
  const { x, z, g: gr } = door, face = outward(door);
  for (const dx of [-1, 0, 1]) for (let y = gr + 1; y <= gr + 3; y++) put(x + dx, y, z, TIMBER);
  put(x, gr + 1, z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) put(x + dx, gr + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant on the roof of the taller parts: a few light-grey units standing on the roof slab.
for (const c of cell.values()) if (!c.wall && c.T >= 8 && c.x % 4 === 2 && c.z % 4 === 2) put(c.x, c.T, c.z, UNIT);

const res = g.save(OUT);
console.log(JSON.stringify({ ...res, door: door && { x: door.x, z: door.z, g: door.g, face: outward(door) }, ...stats }));
