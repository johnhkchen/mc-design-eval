import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 270737192, Mt Eden / Eden Terrace: a 1960s-70s reinforced-concrete office and shop block. White concrete panels,
// light string courses on absolute storey lines, ribbon glazing in dark frames, a shopfront band, a street door, a
// parapet with a cap, and plant on the roof. The lidar roof is smoothed into three flat tiers (10, 14, 18) stepping
// down to the wings. Hollow inside: a floor plate per storey and air behind the glass, no rooms.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_270737192.cells.json`, "utf8"));
const SIZE = [40, 31, 39];
const FLOORS = new Set([2, 6, 10, 14]);       // storey lines (absolute y): a floor plate and a string course on each
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const WALL = "white_concrete", MULLION = "gray_concrete", GLASS = "light_blue_stained_glass_pane";

// massing: each cell's roof from the lidar, smoothed to a tier, and never under its own ground + 3 blocks
const tierOf = (r) => (r <= 12 ? 10 : r <= 15 ? 14 : 18);
const col = new Map();
for (const [x, z, g, r] of cells) {
  let t = tierOf(r);
  if (t < g + 3) t = g + 3 <= 14 ? 14 : 18;
  col.set(`${x},${z}`, { g, t });
}
const colAt = (x, z) => col.get(`${x},${z}`);
// a neighbouring column has matter at height y if y is under its top (foundation below its ground, building above)
const covered = (x, z, y) => { const c = colAt(x, z); return !!c && y < c.t; };
// what a footprint block at y is: foundation, roof or wall shell, floor plate, or interior air
function kindAt(x, z, y) {
  const c = colAt(x, z);
  if (!c || y >= c.t) return null;
  if (y < c.g) return "found";
  if (y === c.t - 1) return "roof";
  if (!DIRS.every(([dx, dz]) => covered(x + dx, z + dz, y))) return "wall";
  return y === c.g || FLOORS.has(y) ? "slab" : "air";
}

const B = new Map();                          // "x,y,z" -> { block, state, face, along }
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state, face, along) => B.set(key(x, y, z), { block, state, face, along });

for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.g; y++) put(x, y, z, "stone_bricks");
  for (let y = c.g; y < c.t; y++) {
    const kind = kindAt(x, z, y);
    if (kind === "air") continue;
    const out = DIRS.filter(([dx, dz]) => !covered(x + dx, z + dz, y));   // the faces this block shows to the outside
    if (kind === "slab") { put(x, y, z, "smooth_stone"); continue; }
    if (kind === "roof") { put(x, y, z, out.length ? "smooth_stone" : "stone"); continue; }
    // a wall runs across the face it shows: a z-facing face runs along x, so its panes sit along x
    const face = out.find(([, dz]) => dz !== 0) ?? out[0];
    const along = face[1] !== 0 ? x : z;
    const winRow = !FLOORS.has(y) && (FLOORS.has(y - 1) || FLOORS.has(y - 2)) && y < c.t - 1;
    if (y === c.g) put(x, y, z, "polished_andesite");
    else if (FLOORS.has(y)) put(x, y, z, "smooth_stone");
    else if (winRow || y === c.g + 1) {
      // glazing in bays of three panes, a dark mullion every fourth block (the shopfront row is glazed all along)
      if (along % 4 === 0) put(x, y, z, MULLION);
      else put(x, y, z, GLASS, null, face, along);
    } else put(x, y, z, WALL);
  }
  // parapet on any edge that drops away, capped with a slab
  if (DIRS.some(([dx, dz]) => !covered(x + dx, z + dz, c.t))) {
    put(x, c.t, z, WALL);
    put(x, c.t + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// street door: the lowest outward-facing cell, at the middle of the lowest run of the perimeter
const cand = [];
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (const [dx, dz] of DIRS) if (!colAt(x + dx, z + dz)) cand.push({ x, z, dx, dz, g: c.g });
}
const gMin = Math.min(...cand.map((c) => c.g));
const low = cand.filter((c) => c.g === gMin).sort((a, b) => a.x - b.x || a.z - b.z);
const E = low[Math.floor(low.length / 2)];
const doorFacing = FACING[`${E.dx},${E.dz}`];
const doorY = E.g + 1;
put(E.x, doorY, E.z, "iron_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
put(E.x, doorY + 1, E.z, "iron_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
// a flat lintel band over the door, three blocks wide along the face
const along = E.dz !== 0 ? "x" : "z";
for (const o of [-1, 0, 1]) {
  const lx = along === "x" ? E.x + o : E.x, lz = along === "z" ? E.z + o : E.z;
  if (B.has(key(lx, E.g + 3, lz))) put(lx, E.g + 3, lz, "smooth_stone");
}
// a lamp just inside the door
const inDoor = [E.x - E.dx, doorY, E.z - E.dz];
if (kindAt(...inDoor) === "air") put(...inDoor, "lantern", { hanging: "false", waterlogged: "false" });

// roof: a penthouse core (lift and stair) on the top tier, and two plant units beside it
const top = [...col].filter(([, c]) => c.t === 18).map(([k]) => k.split(",").map(Number));
const is18 = (x, z) => colAt(x, z)?.t === 18;
const cx = top.reduce((s, [x]) => s + x, 0) / top.length, cz = top.reduce((s, [, z]) => s + z, 0) / top.length;
let pent = null, pd = Infinity;
for (let x0 = 0; x0 <= 35; x0++) for (let z0 = 0; z0 <= 34; z0++) {
  let ok = true;
  for (let x = x0 - 1; x <= x0 + 4 && ok; x++) for (let z = z0 - 1; z <= z0 + 4 && ok; z++) if (!is18(x, z)) ok = false;
  if (!ok) continue;
  const d = (x0 + 2 - cx) ** 2 + (z0 + 2 - cz) ** 2;
  if (d < pd) { pd = d; pent = [x0, z0]; }
}
if (pent) {
  const [x0, z0] = pent;
  for (let x = x0; x <= x0 + 3; x++) for (let z = z0; z <= z0 + 3; z++) {
    const ring = x === x0 || x === x0 + 3 || z === z0 || z === z0 + 3;
    put(x, 18, z, WALL); put(x, 20, z, WALL);
    put(x, 19, z, ring ? "light_blue_stained_glass" : WALL);
    put(x, 21, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
  let units = 0;
  for (let x = 0; x < 40 - 1 && units < 2; x++) for (let z = 0; z < 39 - 1 && units < 2; z++) {
    const cells4 = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    const near = (x0 - 2 <= x && x <= x0 + 4 && z0 - 2 <= z && z <= z0 + 4);
    if (near || !cells4.every(([a, b]) => is18(a, b) && DIRS.every(([dx, dz]) => is18(a + dx, b + dz)))) continue;
    if (cells4.some(([a, b]) => { const c = colAt(a, b); return !c; })) continue;
    for (const [a, b] of cells4) put(a, 18, b, "iron_block");
    units++;
  }
}

// warm light: a glowstone behind about half the panes of the window rows, inside the air gap
for (const [pk, p] of [...B]) {
  if (!p.face) continue;
  const [x, y, z] = pk.split(",").map(Number);
  if ((p.along + y) % 2 !== 0) continue;
  const [ix, iz] = [x - p.face[0], z - p.face[1]];
  if (kindAt(ix, y, iz) === "air" && !B.has(key(ix, y, iz))) put(ix, y, iz, "glowstone");
}

// panes join their neighbours along the wall, so the glazing reads as one ribbon in a frame
for (const [pk, p] of B) {
  if (!p.face) continue;
  const [x, y, z] = pk.split(",").map(Number);
  const conn = (dx, dz) => B.has(key(x + dx, y, z + dz));
  p.state = p.face[1] !== 0
    ? { north: "false", east: String(conn(1, 0)), south: "false", west: String(conn(-1, 0)), waterlogged: "false" }
    : { north: String(conn(0, -1)), east: "false", south: String(conn(0, 1)), west: "false", waterlogged: "false" };
}

const g = new Voxels(SIZE);
for (const [pk, p] of B) { const [x, y, z] = pk.split(",").map(Number); g.set(x, y, z, p.block, p.state); }

const counts = {}; let floating = 0;
for (const [pk, p] of B) {
  counts[p.block] = (counts[p.block] || 0) + 1;
  const [x, y, z] = pk.split(",").map(Number);
  // a block with nothing under it must be a floor plate or roof carried by walls on the same level
  const carried = DIRS.some(([dx, dz]) => B.has(key(x + dx, y, z + dz)));
  if (y > 0 && !B.has(key(x, y - 1, z)) && !carried) floating++;
}
const top_ = Math.max(...[...B.keys()].map((k) => Number(k.split(",")[1])));
console.log(JSON.stringify({ blocks: B.size, floating, maxY: top_, door: E, penthouse: pent, counts }, null, 1));
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270737192.nbt");
