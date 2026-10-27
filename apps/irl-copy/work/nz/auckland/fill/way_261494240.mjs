// The Powerstation, Auckland: a five-storey early-20th-century brick power station, read from the lidar record
// (roof about 20 blocks above the lowest ground, flat, a 5-storey core on a 4-storey podium). Brick walls with cream
// render string courses and cornices, stone-brick foundations, glass panes between brick piers, and one chimney.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494240.cells.json", "utf8"));
const W = 45, H = 33, D = 40;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const PODIUM = 16, TOWER = 20;
const k = (x, z) => x + "," + z;

// footprint cells; the lidar roof of 20 is the tower core, the 17 to 19 shoulders and the 12 to 17 wings become one podium tier
const FOOT = new Map();
for (const [x, z, ground, roof] of cells) FOOT.set(k(x, z), { x, z, g: ground, core: roof >= TOWER });
const at = (x, z) => FOOT.get(k(x, z));

// distance inside the core from the podium (or the outside): the tower is set back two cells from the podium edge
const dist = new Map(), q = [];
for (const c of FOOT.values()) {
  if (!c.core) { dist.set(k(c.x, c.z), 0); q.push(c); }
  else if (DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) { dist.set(k(c.x, c.z), 1); q.push(c); }
}
for (let i = 0; i < q.length; i++) {
  const c = q[i], d0 = dist.get(k(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const n = at(c.x + dx, c.z + dz);
    if (n && n.core && !dist.has(k(n.x, n.z))) { dist.set(k(n.x, n.z), d0 + 1); q.push(n); }
  }
}
for (const c of FOOT.values()) c.top = c.core && (dist.get(k(c.x, c.z)) ?? 99) >= 3 ? TOWER : PODIUM;

// exposed faces: an outward direction with no footprint cell, or a neighbour standing lower
for (const c of FOOT.values()) {
  c.faces = DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.top < c.top; });
  c.perim = c.faces.length > 0;
  c.edge = DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz));
  c.face = c.faces[0];
}

// windows: in each bay of three columns along a face, the first column is a brick pier; glass in the two rows
// between the floor line and the header course
const bayIndex = (c) => (c.face[0] !== 0 ? c.z : c.x);
const glassAt = (c, y) => c && c.perim && c.face && (y % 4 === 1 || y % 4 === 2) && bayIndex(c) % 3 !== 0;
const sameFace = (a, b) => a && b && a.face && b.face && a.face[0] === b.face[0] && a.face[1] === b.face[1];
function paneState(c, y) {
  const along = c.face[0] !== 0 ? [[0, -1], [0, 1]] : [[1, 0], [-1, 0]];
  const link = ([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return sameFace(n, c) && glassAt(n, y) ? "true" : "false"; };
  if (c.face[0] !== 0) return { north: link(along[0]), south: link(along[1]), east: "false", west: "false" };
  return { east: link(along[0]), west: link(along[1]), north: "false", south: "false" };
}

const g = new Voxels([W, H, D]);
for (const c of FOOT.values()) {
  const G = c.g, T = c.top;
  for (let y = 0; y < G; y++) g.set(c.x, y, c.z, "stone_bricks");            // foundation, from y 0 to the ground
  if (!c.perim) {                                                             // interior: floor slabs and air between
    for (let y = G; y < T; y++) if (y === G || y === T - 1 || y % 4 === 0) g.set(c.x, y, c.z, "smooth_stone");
    continue;
  }
  for (let y = G; y < T; y++) {
    if (y === G) g.set(c.x, y, c.z, "smooth_stone");                          // base course
    else if (y === T - 1) g.set(c.x, y, c.z, "smooth_quartz");                // cornice
    else if (y % 4 === 0) g.set(c.x, y, c.z, "smooth_quartz");                // storey line
    else if (y % 4 === 3) g.set(c.x, y, c.z, "bricks");                       // header
    else if (glassAt(c, y)) g.set(c.x, y, c.z, "glass_pane", paneState(c, y));
    else g.set(c.x, y, c.z, "bricks");
  }
  if (c.edge && T === PODIUM) {                                               // podium parapet, linked along the edge
    const conn = (dx, dz) => { const n = at(c.x + dx, c.z + dz); return n && n.edge && n.top === PODIUM ? "low" : "none"; };
    g.set(c.x, T, c.z, "stone_brick_wall", { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), up: "true", waterlogged: "false" });
  }
}

// the entrance: the middle of the west face, with a lintel and a canopy ledge over the door
const west = [...FOOT.values()].filter((c) => c.edge && c.faces.some(([dx, dz]) => dx === -1 && dz === 0 && !at(c.x - 1, c.z)));
west.sort((a, b) => a.z - b.z);
const door = west[Math.floor(west.length / 2)];
for (const c of west) {
  if (Math.abs(c.z - door.z) > 2) continue;
  g.set(c.x, c.g + 2, c.z, "smooth_quartz");
  g.set(c.x, c.g + 3, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
const doorState = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
g.set(door.x, door.g, door.z, "dark_oak_door", doorState("lower"));
g.set(door.x, door.g + 1, door.z, "dark_oak_door", doorState("upper"));

// warm lanterns in some windows: standing on the floor slab just inside the glass, the air gap kept
for (const c of FOOT.values()) {
  if (!c.perim || !c.face || bayIndex(c) % 3 !== 1) continue;
  for (let y = c.g + 1; y < c.top; y++) {
    const s = y >> 2;
    if (y % 4 !== 1 || !glassAt(c, y) || s < 1 || (bayIndex(c) + s) % 2 !== 0) continue;
    const inner = at(c.x - c.face[0], c.z - c.face[1]);
    if (inner && !inner.perim && y - 1 >= inner.g) g.set(inner.x, y, inner.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// one chimney on the tower roof: a 3 x 3 stack standing on the tower's deck, the tallest thing in the model
const isTower = (x, z) => { const c = at(x, z); return c && c.top === TOWER && (dist.get(k(x, z)) ?? 0) >= 3; };
const towerCells = [...FOOT.values()].filter((c) => c.top === TOWER && (dist.get(k(c.x, c.z)) ?? 0) >= 3);
const mx = towerCells.reduce((s, c) => s + c.x, 0) / towerCells.length, mz = towerCells.reduce((s, c) => s + c.z, 0) / towerCells.length;
let best = null;
for (const c of towerCells) {
  const ok = [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => isTower(c.x + dx, c.z + dz)));
  const d = Math.hypot(c.x - mx, c.z - mz);
  if (ok && (!best || d < best.d)) best = { x: c.x, z: c.z, d };
}
if (best) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (let y = TOWER; y < TOWER + 10; y++) {
      const block = y === 24 || y === 28 ? "smooth_quartz" : y === TOWER + 9 ? "smooth_quartz" : "bricks";
      g.set(best.x + dx, y, best.z + dz, block);
    }
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494240.nbt";
const info = g.save(out);
console.log(JSON.stringify({ footprint: FOOT.size, tower: towerCells.length, chimney: best, door: [door.x, door.z], ...info }));
