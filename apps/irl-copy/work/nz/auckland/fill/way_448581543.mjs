import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_448581543.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..15, z 0..27

// A 1930s stripped-classical office-and-apartment block on an inner-city street (Mt Eden / Eden Terrace): cream plaster
// (smooth_quartz) banded by stone_bricks string courses, a dark polished-andesite shopfront at street level, pier-and-window
// bays on a 3-block grid, deepslate roof tiles behind a stone cornice, and a lift overrun on the 5-storey core.
// Hollow: a 1-block facade ring, a floor slab per storey, air behind the glass, warm lights in some windows.

const W = 16, D = 28, H = 33;
const g = new Voxels([W, H, D]);
const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof }]));
const cellAt = (x, z) => at.get(`${x},${z}`);

// Smooth the lidar roof over the 3x3 neighbourhood, then quantise to whole storeys (4 blocks): 17-19 read as 4 storeys
// with a parapet above, 19-20 as the 5-storey core. Every cell gets a flat top, so tiers step cleanly.
for (const c of at.values()) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const o = cellAt(c.x + dx, c.z + dz); if (o) { sum += o.roof; n++; } }
  c.rs = sum / n;
  c.storeys = Math.max(2, Math.floor((c.rs + 1) / 4));
  c.top = Math.max(c.storeys * 4, Math.round(c.rs));          // exclusive top; a parapet rises above the last storey
}

// Faces of a cell that look out: off the footprint, or onto a neighbour that stops lower (a setback). [dx, dz, axis of the normal]
const DIRS = [[0, -1, "z"], [0, 1, "z"], [-1, 0, "x"], [1, 0, "x"]];
for (const c of at.values()) {
  c.faces = DIRS.filter(([dx, dz]) => { const o = cellAt(c.x + dx, c.z + dz); return !o || o.top < c.top; });
  c.ring = c.faces.length > 0;
  c.corner = new Set(c.faces.map((f) => f[2])).size > 1;
  if (c.ring) c.along = c.faces[0][2] === "z" ? c.x : c.z;     // the coordinate that runs along the facade, for the bay grid
}

// Glass pane connected along the wall it sits in (a wall along x connects east-west, a wall along z connects north-south).
const pane = (axis) => ({ east: axis === "z" ? "true" : "false", west: axis === "z" ? "true" : "false",
  north: axis === "x" ? "true" : "false", south: axis === "x" ? "true" : "false", waterlogged: "false" });

// The street entrance: the north corner cell of the footprint's lowest row.
const ENTRANCE = { x: 7, z: 0 };

// The facade: one ring block per exposed cell and layer. Storey = 4 layers: string course, two glass rows, spandrel.
function ringBlock(c, y) {
  const k = Math.floor(y / 4), s = y % 4, ground = k === 0;
  if (y === c.top - 1) return ["stone_bricks"];                           // cornice cap
  if (y >= c.storeys * 4) return ["smooth_quartz"];                        // parapet
  if (s === 0) return ["stone_bricks"];                                    // string course (plinth at ground)
  if (s === 3) return ground ? ["stone_bricks"] : ["smooth_quartz"];       // lintel / spandrel
  if (c.corner || c.along % 3 === 0) return [ground ? "polished_andesite" : "quartz_pillar"];  // pier
  return ["glass_pane", pane(c.faces[0][2])];                              // window
}

// Interior: a floor slab per storey (sits on the ring), air between, a roof deck on top.
function interiorBlock(c, y) {
  if (y === c.ground) return "smooth_stone";
  if (y === c.top - 1) return "deepslate_tiles";                          // roof tiles
  if (y >= c.storeys * 4) return "smooth_quartz";                          // parapet deck
  if (y % 4 === 0) return "smooth_stone";                                  // floor slab
  return null;
}

// Pass 1: the foundation fill (y 0 to the cell's ground), then the shell: ring facade or interior slabs and roof.
for (const c of at.values()) {
  for (let y = 0; y < c.ground; y++) g.set(c.x, y, c.z, "stone_bricks");
  for (let y = c.ground; y < c.top; y++) {
    const b = c.ring ? ringBlock(c, y) : [interiorBlock(c, y)];
    if (b[0]) g.set(c.x, y, c.z, b[0], b[1]);
  }
}

// Pass 2: warm lights behind some ground-floor and first-floor windows, on the floor slab of the room behind the glass.
for (const c of at.values()) {
  if (!c.ring || c.corner) continue;
  for (const k of [0, 1, 2, 3, 4]) {
    const y = k * 4 + 1;
    if (y >= c.top - 1 || y < c.ground || c.x === ENTRANCE.x && c.z === ENTRANCE.z) continue;
    if ((c.x + c.z + k) % 3 !== 0 || c.along % 3 === 0) continue;
    const [dx, dz] = c.faces[0], o = cellAt(c.x - dx, c.z - dz);
    if (!o || o.ring || y <= o.ground || y >= o.top - 1) continue;
    g.set(o.x, y, o.z, k === 0 ? "shroomlight" : "glowstone");
  }
}

// Pass 3: the entrance door in the north face of the street corner, two blocks tall, on the ground-storey plinth.
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(ENTRANCE.x, 1, ENTRANCE.z, "dark_oak_door", doorState("lower"));
g.set(ENTRANCE.x, 2, ENTRANCE.z, "dark_oak_door", doorState("upper"));

// Pass 4: a lift overrun on the 5-storey core: the 3x3 block of cells nearest the middle that all stand at the top tier.
let best = null;
for (const c of at.values()) {
  let ok = true;
  for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) { const o = cellAt(c.x + dx, c.z + dz); ok = !!o && o.top === 20; }
  if (!ok) continue;
  const d = Math.hypot(c.x - 7.5, c.z - 13.5);
  if (!best || d < best.d) best = { c, d };
}
if (best) {
  const { x: cx, z: cz } = best.c, base = 20;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const x = cx + dx, z = cz + dz;
    for (let y = base; y < base + 3; y++) {
      if (dx === 0 && dz === 0) continue;                                   // hollow centre
      const mid = (dx === 0) !== (dz === 0);                                // middle of a face: a window
      if (mid && y === base + 1) g.set(x, y, z, "glass_pane", dx === 0 ? pane("z") : pane("x"));
      else g.set(x, y, z, "smooth_quartz");
    }
    g.set(x, base + 3, z, "stone_bricks");
  }
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_448581543.nbt");
console.log(JSON.stringify({ cells: at.size, ...out, overrun: best ? [best.c.x, best.c.z] : null }));
