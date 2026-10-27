// Auckland, way 162320318: a 1970s concrete-frame office block over a basalt plinth, 8 storeys of 4 blocks (floor lines
// at y = 4k) with a lower 5-storey-or-so wing and a stepped core, under a flat roof with a parapet. The lidar roof is
// read as the massing: each cell's roof is median-smoothed over 5 x 5 footprint cells, then snapped to a floor line
// (4 blocks), so the 31-block mode becomes an 8-storey slab and the 36-to-38 cluster a 9-storey core. Columns stand on
// solid ground-up fill, so nothing floats; the downhill side (ground 0) shows its extra storeys above the plinth.
// Facade: an exposed wall is any side open to the outside OR to a neighbour whose roof is lower (a setback face). Its
// rows are a string course at each floor line, piers of white concrete every 3 blocks as the frame, cyan tinted glass
// panes between them (state set to connect to adjacent panes), and a spandrel above each window row. The ground storey
// is a shopfront of glass with a stone base and a fascia. Warm glowstone sits behind some lower-row windows on the
// slab. The entrance is the lowest-ground edge cell nearest the footprint centre: a recessed dark-oak door under a dark
// oak hood (the hood is inset, since a canopy can't project past the footprint). Interiors are air with one slab per
// storey. Roof: gray concrete covering, a white parapet on the footprint edge, and stone-brick plant boxes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162320318.cells.json", "utf8"));
const X = 60, Y = 51, Z = 56;
const FLOOR = 4, MAX_TOP = 40;
const PLINTH = "polished_andesite", STRING = "light_gray_concrete", PIER = "white_concrete", SPANDREL = "white_concrete";
const PANE = "cyan_stained_glass_pane", SHOP = "glass", FASCIA = "smooth_stone", ROOF = "gray_concrete", PARAPET = "white_concrete";
const LIGHT = "glowstone", DOOR = "dark_oak_door", HOOD = "dark_oak_slab", PLANT = "stone_bricks";

const g = new Voxels([X, Y, Z]);
const key = (x, z) => `${x},${z}`;
const C = new Map(cells.map(([x, z, gr, rf]) => [key(x, z), { x, z, gr, rf }]));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const nb = (c, d) => C.get(key(c.x + DIRS[d][0], c.z + DIRS[d][1]));

// massing: roof median-smoothed over the footprint's 5 x 5 neighbourhood, then snapped to floor lines
for (const c of C.values()) {
  c.floorStart = Math.ceil(c.gr / FLOOR) * FLOOR;
  const vs = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = C.get(key(c.x + dx, c.z + dz)); if (n) vs.push(n.rf); }
  vs.sort((a, b) => a - b);
  c.T = Math.min(MAX_TOP, Math.max(c.floorStart + FLOOR, Math.round(vs[vs.length >> 1] / FLOOR) * FLOOR));
}

// the sides of a cell open at height y: outside the footprint, or a neighbour whose top is at or below y
const openDirs = (c, y) => Object.keys(DIRS).filter(d => { const n = nb(c, d); return !n || n.T <= y; });
const edgeDirs = (c) => Object.keys(DIRS).filter(d => !nb(c, d));

// the entrance: the lowest-ground footprint edge, nearest the footprint centre
const edges = [...C.values()].filter(c => edgeDirs(c).length);
const minG = Math.min(...edges.map(c => c.gr));
const cx0 = 30, cz0 = 28;
const door = edges.filter(c => c.gr === minG).sort((a, b) => Math.hypot(a.x - cx0, a.z - cz0) - Math.hypot(b.x - cx0, b.z - cz0))[0];
const doorFacing = edgeDirs(door)[0];

const panes = [];
for (const c of C.values()) {
  for (let y = 0; y < c.T; y++) {
    if (y < c.floorStart) {                                                       // basalt plinth, piered on the street-facing edge
      const edge = edgeDirs(c)[0], u = edge === "N" || edge === "S" ? c.x : c.z;
      g.set(c.x, y, c.z, edge && u % 3 === 0 ? PIER : PLINTH); continue;
    }
    const dirs = openDirs(c, y), wall = dirs.length > 0;
    const k = y % FLOOR, ground = y < c.floorStart + FLOOR;
    if (y === c.T - 1) { g.set(c.x, y, c.z, wall ? STRING : ROOF); continue; }   // cornice on the walls, roof covering inside
    if (!wall) { if (k === 0) g.set(c.x, y, c.z, STRING); continue; }            // interior: a slab per storey, air between
    const u = dirs[0] === "N" || dirs[0] === "S" ? c.x : c.z;
    if (k === 0) { g.set(c.x, y, c.z, ground ? PLINTH : STRING); continue; }      // base course / floor line
    if (ground && k === 3) { g.set(c.x, y, c.z, FASCIA); continue; }
    if (u % 3 === 0) { g.set(c.x, y, c.z, PIER); continue; }                      // the frame
    if (k === 3) { g.set(c.x, y, c.z, SPANDREL); continue; }
    if (ground) { g.set(c.x, y, c.z, SHOP); continue; }                            // shopfront glass
    g.set(c.x, y, c.z, PANE); panes.push([c.x, y, c.z]);
  }
  // parapet on the footprint edge, one block above the roof
  if (edgeDirs(c).length) g.set(c.x, c.T, c.z, PARAPET);
}

// the entrance: a recessed door (two blocks) under a hood across its three wall cells
const dfs = door.floorStart;
g.set(door.x, dfs + 1, door.z, DOOR, { facing: doorFacing === "N" ? "north" : doorFacing === "S" ? "south" : doorFacing === "E" ? "east" : "west", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(door.x, dfs + 2, door.z, DOOR, { facing: doorFacing === "N" ? "north" : doorFacing === "S" ? "south" : doorFacing === "E" ? "east" : "west", half: "upper", hinge: "left", open: "false", powered: "false" });
const along = doorFacing === "N" || doorFacing === "S" ? ["x", "z"] : ["z", "x"];
for (const o of [-1, 0, 1]) {
  const hx = along[0] === "x" ? door.x + o : door.x, hz = along[0] === "z" ? door.z + o : door.z;
  if (C.has(key(hx, hz))) g.set(hx, dfs + 3, hz, HOOD, { type: "bottom" });
}

// window panes connect to their neighbouring panes, and warm glowstone stands behind some lower-row windows
const paneSet = new Set(panes.map(p => p.join(",")));
const has = (x, y, z) => paneSet.has(`${x},${y},${z}`);
for (const [x, y, z] of panes) {
  g.set(x, y, z, PANE, { north: String(has(x, y, z - 1)), south: String(has(x, y, z + 1)), west: String(has(x - 1, y, z)), east: String(has(x + 1, y, z)) });
}
for (const [x, y, z] of panes) {
  if (y % FLOOR !== 1 || (x * 3 + z * 5 + y) % 4 !== 0) continue;
  const c = C.get(key(x, z)), d = openDirs(c, y)[0];
  if (!d) continue;
  const ic = C.get(key(x - DIRS[d][0], z - DIRS[d][1]));
  if (!ic || ic.T <= y + 1 || openDirs(ic, y).length) continue;
  g.set(ic.x, y, ic.z, LIGHT);
}

// roof plant: 1-cell stone-brick boxes two high on the interior of the roof
for (const c of C.values()) {
  if (c.T < 28 || (c.x % 8 !== 3 && c.x % 8 !== 4) || (c.z % 8 !== 3 && c.z % 8 !== 4)) continue;
  if (openDirs(c, c.T - 1).length) continue;
  g.set(c.x, c.T, c.z, PLANT); g.set(c.x, c.T + 1, c.z, PLANT);
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162320318.nbt");
console.log(`way_162320318: ${out.blocks} blocks, palette ${out.palette}, door ${door.x},${door.z} facing ${doorFacing}`);
