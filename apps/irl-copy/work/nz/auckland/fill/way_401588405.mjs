// Footprint way 401588405, Mt Eden / Eden Terrace edge: a 1970s concrete office block, seven storeys over a
// shopfront ground floor, a lower wing on the west side, a setback core, and a corner stair tower. The lidar roof
// is smoothed into four flat tiers (24 wing, 30 main, 34 setback, 38 stair tower); each column stands solid from
// its foundation up, so every tier sits on the one below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_401588405.cells.json`, "utf8"));
const g = new Voxels([30, 52, 32]);

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const at = (x, z) => cell.get(key(x, z));
const DIRS = [
  { dx: 1, dz: 0, face: "east" }, { dx: -1, dz: 0, face: "west" },
  { dx: 0, dz: 1, face: "south" }, { dx: 0, dz: -1, face: "north" },
];

// cells from the outline (outline = 1): setbacks step in from the edge
const dist = new Map();
let frontier = [];
for (const c of cell.values()) {
  if (DIRS.some(d => !at(c.x + d.dx, c.z + d.dz))) { dist.set(key(c.x, c.z), 1); frontier.push(c); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const { dx, dz } of DIRS) {
    const n = at(c.x + dx, c.z + dz);
    if (n && !dist.has(key(n.x, n.z))) { dist.set(key(n.x, n.z), d + 1); next.push(n); }
  }
  frontier = next;
}

// lidar roof -> flat tiers (top of the massing, exclusive)
const top = new Map();
for (const c of cell.values()) {
  const d = dist.get(key(c.x, c.z));
  const t = c.roof >= 36 ? 38 : c.roof >= 31 && d >= 2 ? 34 : c.roof <= 26 ? 24 : 30;
  top.set(key(c.x, c.z), t);
}
const T = (x, z) => (at(x, z) ? top.get(key(x, z)) : 0);
const outline = c => DIRS.some(d => !at(c.x + d.dx, c.z + d.dz));
// the faces of this cell that look onto air at height y (outside the footprint, or over a shorter neighbour)
const exposed = (c, y) => DIRS.filter(d => T(c.x + d.dx, c.z + d.dz) <= y);

// entrance: the outline's northmost run, the cell nearest its middle
const north = [...cell.values()].filter(c => !at(c.x, c.z - 1));
const minZ = Math.min(...north.map(c => c.z));
const row = north.filter(c => c.z === minZ);
const midX = (Math.min(...row.map(c => c.x)) + Math.max(...row.map(c => c.x))) / 2;
const door = row.sort((a, b) => Math.abs(a.x - midX) - Math.abs(b.x - midX))[0];

function wallAt(c, y, d) {
  const { x, z } = c;
  if (y === c.ground) return g.set(x, y, z, "stone_bricks");             // base course
  if (y % 4 === 0) return g.set(x, y, z, "gray_concrete");              // storey spandrel
  if (y % 4 === 3) return g.set(x, y, z, "white_concrete");             // head band
  const along = d.dx !== 0 ? z : x;                                      // bay position along the face
  const shopfront = y < c.ground + 4;
  if (shopfront ? along % 4 === 0 : along % 2 === 0) return g.set(x, y, z, "white_concrete");   // frames/mullions
  const ew = d.dx !== 0;                                                  // pane runs along the face
  return g.set(x, y, z, "cyan_stained_glass_pane", {
    north: String(ew), south: String(ew), east: String(!ew), west: String(!ew), waterlogged: "false",
  });
}

for (const c of cell.values()) {
  const t = top.get(key(c.x, c.z));
  for (let y = 0; y < c.ground; y++) g.set(c.x, y, c.z, "stone");       // foundation up to the lidar ground
  for (let y = c.ground; y <= t - 2; y++) {
    const ex = exposed(c, y);
    if (ex.length) wallAt(c, y, ex[0]);
    else if (y === c.ground || y % 4 === 0) g.set(c.x, y, c.z, "smooth_stone");   // floor slab per storey
  }
  g.set(c.x, t - 1, c.z, "light_gray_concrete");                       // roof deck
  if (outline(c)) g.set(c.x, t, c.z, "white_concrete");                 // parapet
}

// warm light behind some windows: glowstone on the floor slab inside, air between it and the glass
for (const c of cell.values()) {
  const t = top.get(key(c.x, c.z));
  for (let y = c.ground + 1; y <= t - 2; y++) {
    if (y % 4 !== 1 || (c.x * 5 + c.z * 3 + y) % 9 !== 0) continue;
    for (const d of exposed(c, y)) {
      const inner = at(c.x - d.dx, c.z - d.dz);
      if (!inner || exposed(inner, y).length) continue;
      g.set(inner.x, y, inner.z, "glowstone");
      break;
    }
  }
}

// roof plant: 2x2 boxes on the main roof, well inside the outline
for (const c of cell.values()) {
  if (c.x % 7 !== 3 || c.z % 7 !== 3 || top.get(key(c.x, c.z)) !== 30 || dist.get(key(c.x, c.z)) < 3) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    for (const y of [30, 31]) g.set(c.x + dx, y, c.z + dz, "light_gray_concrete");
  }
}

// the stair tower's crown light
const crown = [...cell.values()].find(c => top.get(key(c.x, c.z)) === 38 && !outline(c))
  ?? [...cell.values()].find(c => top.get(key(c.x, c.z)) === 38);
g.set(crown.x, 38, crown.z, "lantern", { hanging: "false", waterlogged: "false" });

// entrance: dark oak door in the shopfront, a canopy band over the door bay
const face = DIRS.find(d => d.dz === -1);
g.set(door.x, door.ground + 1, door.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(door.x, door.ground + 2, door.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dx of [-1, 0, 1]) {
  const c = at(door.x + dx, door.z);
  if (c && exposed(c, door.ground + 3).includes(face)) g.set(c.x, door.ground + 3, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const stats = g.save(`${DIR}/way_401588405.nbt`);
console.log(JSON.stringify({ cells: cells.length, tops: Object.fromEntries([24, 30, 34, 38].map(t => [t, [...top.values()].filter(v => v === t).length])), ...stats }));
