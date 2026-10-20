import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name on file. Decided from the lidar height (roof ~26 blocks above the lowest ground)
// as a 1970s-80s Taipei mid-rise commercial/residential block: five storeys of ~5 blocks,
// cream tiled wall (smooth quartz) with light-grey band courses, tinted ribbon windows with
// mullions, a shopfront ground floor with a dark fascia, a cornice and parapet, a roof with
// AC plant and a small penthouse, and an antenna.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011444";
const W = 21, H = 38, D = 19;
const ROOF = 25;          // roof slab level
const PARAPET = 26;       // parapet course on the perimeter
const CORNICE = 24;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = Array.isArray(raw) ? raw : Object.values(raw);

const key = (x, z) => `${x},${z}`;
let minG = Infinity;
for (const [, , v] of rows) minG = Math.min(minG, v);

const foot = new Map();
const cellList = [];
for (const [x, z, v] of rows) {
  const gc = Math.max(0, Math.min(20, v - minG));
  foot.set(key(x, z), gc);
  cellList.push([x, z, gc]);
}

const inF = (x, z) => foot.has(key(x, z));
const gOf = (x, z) => foot.get(key(x, z));

const DIRS = {
  E: { dx: 1, dz: 0, facing: "east" },
  W: { dx: -1, dz: 0, facing: "west" },
  S: { dx: 0, dz: 1, facing: "south" },
  N: { dx: 0, dz: -1, facing: "north" },
};

// Outward faces of a perimeter cell (neighbour missing from the footprint).
function faces(x, z) {
  const out = [];
  for (const [name, d] of Object.entries(DIRS)) {
    if (!inF(x + d.dx, z + d.dz)) out.push(name);
  }
  return out;
}

// Pane connections for a window on a given face (pane runs along the facade).
function paneProps(f) {
  if (f === "E" || f === "W") {
    return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  }
  return { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// 1. Foundation, floor slabs and roof slab, per footprint cell.
for (const [x, z, gc] of cellList) {
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
  put(x, gc, z, "light_gray_concrete");
  for (let k = 1; k <= 4; k++) {
    if (5 * k > gc) put(x, 5 * k, z, "light_gray_concrete");
  }
  put(x, ROOF, z, "light_gray_concrete");
}

// 2. Perimeter walls: plinth, band courses, quartz tile, cornice and parapet.
for (const [x, z, gc] of cellList) {
  const f = faces(x, z);
  if (f.length === 0) continue;
  for (let y = gc; y < ROOF; y++) {
    if (y === 0) put(x, y, z, "gray_concrete");
    else if (y % 5 === 0) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "smooth_quartz");
  }
  put(x, CORNICE, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  put(x, PARAPET, z, "smooth_quartz");
}

// 3. Windows on single-face wall cells. Corners and mullions stay solid.
const glowSpots = [];
for (const [x, z, gc] of cellList) {
  const f = faces(x, z);
  if (f.length !== 1) continue;
  const face = f[0];
  const d = DIRS[face];
  const along = (face === "E" || face === "W") ? z : x;
  const mullion = along % 3 === 0;

  // Ground floor: fascia band always, shopfront glass on bays.
  if (gc <= 3) put(x, 3, z, "gray_concrete");
  if (!mullion) {
    if (1 >= gc) put(x, 1, z, "glass");
    if (2 >= gc) put(x, 2, z, "glass");
  }

  // Upper storeys: tinted ribbon windows.
  for (let k = 1; k <= 4; k++) {
    if (mullion) continue;
    for (let y = 5 * k + 1; y <= 5 * k + 3; y++) {
      if (y < gc) continue;
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
    }
    // Warm light behind some windows, standing on the floor slab inside.
    if ((along + k) % 4 === 0) {
      const ix = x - d.dx, iz = z - d.dz;
      if (inF(ix, iz) && faces(ix, iz).length === 0 && gOf(ix, iz) <= 5 * k) {
        glowSpots.push([ix, 5 * k + 1, iz]);
      }
    }
  }
}
for (const [x, y, z] of glowSpots) put(x, y, z, "glowstone");

// 4. Entrance: a dark oak door on the south facade if there is one, else any single-face wall.
{
  const cand = [];
  for (const [x, z, gc] of cellList) {
    const f = faces(x, z);
    if (f.length !== 1) continue;
    const along = (f[0] === "E" || f[0] === "W") ? z : x;
    cand.push({ x, z, gc, face: f[0], mullion: along % 3 === 0, mid: Math.abs(x - W / 2) });
  }
  const pool = cand.filter((c) => !c.mullion);
  const preferS = (arr) => {
    const s = arr.filter((c) => c.face === "S");
    return s.length ? s : arr;
  };
  const list = preferS(pool.length ? pool : cand).sort((a, b) => a.mid - b.mid);
  if (list.length) {
    const e = list[0];
    const dBase = e.gc + 1;
    const props = { facing: DIRS[e.face].facing, hinge: "left", open: "false", powered: "false" };
    put(e.x, dBase, e.z, "dark_oak_door", { ...props, half: "lower" });
    put(e.x, dBase + 1, e.z, "dark_oak_door", { ...props, half: "upper" });
  }
}

// 5. Roof: a centred penthouse, AC plant, and an antenna.
let sx = 0, sz = 0;
for (const [x, z] of [...foot.keys()].map((k) => k.split(",").map(Number))) { sx += x; sz += z; }
const n = foot.size;
const cx0 = Math.round(sx / n), cz0 = Math.round(sz / n);
let cx = cx0, cz = cz0, best = Infinity;
for (const [x, z] of cellList.map(([a, b]) => [a, b])) {
  const dd = Math.abs(x - cx0) + Math.abs(z - cz0);
  if (dd < best) { best = dd; cx = x; cz = z; }
}

const inPenthouse = (x, z) => Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2;

for (const [x, z] of cellList.map(([a, b]) => [a, b])) {
  if (!inPenthouse(x, z)) continue;
  const ring = Math.max(Math.abs(x - cx), Math.abs(z - cz)) === 2;
  for (let y = PARAPET; y <= 28; y++) {
    if (!ring) put(x, y, z, "light_gray_concrete");
    else if (y === 27) put(x, y, z, "light_blue_stained_glass");
    else put(x, y, z, "smooth_quartz");
  }
  put(x, 29, z, "smooth_quartz");
}

for (const [x, z, gc] of cellList) {
  if (inPenthouse(x, z)) continue;
  if (faces(x, z).length !== 0) continue;
  if ((x * 3 + z * 5) % 11 !== 0) continue;
  put(x, PARAPET, z, "iron_block");
  put(x, PARAPET + 1, z, "iron_block");
}

for (let y = 30; y <= 34; y++) {
  put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
