// Queen's Arcade Building (Queen Street, Auckland CBD): a 1920s-30s brick commercial block on a stone base.
// Massing from the lidar roof record, snapped to four clean tiers (12 two-storey, 24 five-storey wings, 28 six-storey
// main block, 36/40 setback tower on the north-west corner), with a walk-through arcade at the open ground cells.
// Each footprint cell is a column: foundation to its ground, then ground shopfronts, storeys of 4 blocks on floor slabs,
// a parapet and cap; interiors are air with a floor slab per storey and a roof deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_24009980.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const [W, H, D] = [27, 52, 35];
const g = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;

// the four faces: `along` is the axis the face runs along
const DIRS = [
  { name: "north", dx: 0, dz: -1, along: "x" },
  { name: "south", dx: 0, dz: 1, along: "x" },
  { name: "east", dx: 1, dz: 0, along: "z" },
  { name: "west", dx: -1, dz: 0, along: "z" },
];

// Snap the lidar roof to tiers: 0 = open arcade (roof at 1), else the column's top
const tierOf = (r) => (r <= 3 ? 0 : r <= 16 ? 12 : r <= 26 ? 24 : r <= 32 ? 28 : r <= 34 ? 36 : 40);
const raw = new Map();
for (const [x, z, gr, r] of cells) raw.set(key(x, z), { x, z, g: gr, r });

// Noise out: each building cell takes the most common non-open tier in its 3x3 (ties go higher, so the tower keeps its rim)
const info = new Map();
for (const c of raw.values()) {
  if (c.r <= 3) { info.set(key(c.x, c.z), { x: c.x, z: c.z, g: c.g, t: 0 }); continue; }
  const counts = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raw.get(key(c.x + dx, c.z + dz)); if (!n || n.r <= 3) continue;
    const t = tierOf(n.r); counts.set(t, (counts.get(t) || 0) + 1);
  }
  const t = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  info.set(key(c.x, c.z), { x: c.x, z: c.z, g: c.g, t });
}
// The tower: one 4 x 4 block on the north-west corner (the lidar's 33-39 spots that are not that corner drop to the podium),
// with a 2 x 2 crown stepping up from its middle. Lone tall cells would otherwise read as stray chimneys.
for (const c of info.values()) {
  if (!c.t) continue;
  const inTower = c.x >= 7 && c.x <= 10 && c.z >= 2 && c.z <= 5;
  const crown = c.x >= 8 && c.x <= 9 && c.z >= 3 && c.z <= 4;
  c.t = inTower ? (crown ? 40 : 36) : c.t >= 36 ? 28 : c.t;
}
const nbOf = (c, d) => info.get(key(c.x + d.dx, c.z + d.dz));
// a face at row y is exposed if the cell beyond it is outside the footprint, open, or its column stops below y
const exposedAt = (c, d, y) => { const n = nbOf(c, d); return !n || n.t === 0 || y >= n.t; };
const exDirs = (c, y) => DIRS.filter((d) => exposedAt(c, d, y));
const inward = (c, d) => info.get(key(c.x - d.dx, c.z - d.dz));

// Entrances: on the two faces with the most shopfront cells, the window cell nearest the middle of the face
const doors = new Map();   // key -> dir
const canopy = new Set();  // keys of the door cell and its neighbours along the face
{
  const groups = new Map();
  for (const c of info.values()) {
    if (!c.t) continue;
    const ex = exDirs(c, c.g + 1);
    if (ex.length !== 1) continue;
    const d = ex[0];
    if (c[d.along] % 3 === 0) continue;   // a pier, not a window
    if (!groups.has(d.name)) groups.set(d.name, []);
    groups.get(d.name).push(c);
  }
  const ranked = [...groups.values()].sort((a, b) => b.length - a.length).slice(0, 2);
  for (const cs of ranked) {
    const dir = DIRS.find((q) => groups.get(q.name) === cs);
    cs.sort((a, b) => a[dir.along] - b[dir.along]);
    const door = cs[Math.floor(cs.length / 2)];
    doors.set(key(door.x, door.z), dir);
    for (const off of [-1, 0, 1]) {
      const sx = dir.along === "x" ? door.x + off : door.x, sz = dir.along === "z" ? door.z + off : door.z;
      const n = info.get(key(sx, sz));
      if (n && n.t > door.g + 3 && exposedAt(n, dir, door.g + 3)) canopy.add(key(sx, sz));
    }
  }
}

// Panes join their neighbours along the face (other facade cells), so the glazing reads as a continuous frame
function paneState(c, d, y) {
  const s = { north: "false", south: "false", east: "false", west: "false" };
  const sides = d.along === "x" ? [["east", 1, 0], ["west", -1, 0]] : [["north", 0, -1], ["south", 0, 1]];
  for (const [name, dx, dz] of sides) {
    const n = info.get(key(c.x + dx, c.z + dz));
    if (n && n.t > y && exposedAt(n, d, y)) s[name] = "true";
  }
  return s;
}

// Facade block for a perimeter cell at row y, or null. Rows: base (G), ground shopfront (G+1..G+3), fascia (G+4),
// then storeys of 4 from G+5: band row, two glazed rows, spandrel row. The top three rows are parapet, the last is the cap.
function facadeAt(c, y, ex) {
  const { x, z, g: G, t: T } = c;
  const corner = ex.length > 1;
  const d = ex[0];
  const along = corner ? 0 : c[d.along];
  if (y === G) return { b: "polished_andesite" };
  if (y === T - 1) return { b: "smooth_quartz" };
  if (y >= T - 3) return { b: corner ? "smooth_quartz" : "bricks" };
  if (y < G + 5) {
    if (y === G + 4) return { b: "smooth_quartz" };
    if (corner) return { b: "bricks" };
    if (doors.has(key(x, z)) && y <= G + 2) return { door: doors.get(key(x, z)), half: y === G + 1 ? "lower" : "upper" };
    if (canopy.has(key(x, z)) && y === G + 3) return { b: "dark_oak_slab", state: { type: "top" } };
    if (along % 3 === 0) return { b: "dark_oak_log" };
    return { pane: d, light: "lantern" };
  }
  const rel = (y - G - 5) % 4;
  if (rel === 0) return { b: "smooth_quartz" };
  if (along % 3 === 0 || rel === 3 || corner) return { b: "bricks" };
  return { pane: d, light: "shroomlight" };
}

// Build: the open arcade is paving; each column is its foundation, then its storeys
for (const c of info.values()) {
  const { x, z, g: G, t: T } = c;
  if (!T) {
    g.set(x, 0, z, "smooth_stone");
    if ((x + 2 * z) % 9 === 4) g.set(x, 1, z, "lantern");
    continue;
  }
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  for (let y = G; y < T; y++) {
    const ex = exDirs(c, y);
    if (y === T - 1 && !ex.length) { g.set(x, y, z, "stone"); continue; }
    if (!ex.length) {
      const storeyFloor = y >= G + 5 && (y - G - 5) % 4 === 0 && y < T - 3;
      if (y === G || storeyFloor) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const f = facadeAt(c, y, ex);
    if (f.door) continue;   // doors are placed below
    if (f.pane) {
      g.set(x, y, z, "glass_pane", paneState(c, f.pane, y));
      // a warm light inside, standing on the floor below, in some of the windows
      const inn = inward(c, f.pane);
      if (inn && inn.t > y && !exDirs(inn, y).length && (x * 31 + z * 17 + y) % 5 === 0) {
        const lit = f.light === "lantern" ? (y === G + 1) : (y > G + 4 && (y - G - 5) % 4 === 1);
        if (lit) g.set(inn.x, y, inn.z, f.light);
      }
    } else if (f.b) g.set(x, y, z, f.b, f.state);
  }
  // the entrance: oak door (two halves) under a short lintel over the door and its neighbours
  if (doors.has(key(x, z))) {
    const d = doors.get(key(x, z));
    const state = (half) => ({ facing: d.name, half, hinge: "left", open: "false", powered: "false" });
    g.set(x, G + 1, z, "oak_door", state("lower"));
    g.set(x, G + 2, z, "oak_door", state("upper"));
  }
  // roof plant on the six-storey roof, lit crown on the tower corners
  const exTop = exDirs(c, T - 1);
  if (T === 28 && !exTop.length && x % 6 === 3 && z % 7 === 4) g.set(x, T, z, "iron_block");
  if (T === 40 && exTop.length > 1) g.set(x, T, z, "lantern");
}

const n = g.save(`${DIR}/way_24009980.nbt`);
console.log(`way_24009980: ${cells.length} cells, ${n.blocks} blocks, ${n.palette} palette entries, doors ${doors.size}`);
