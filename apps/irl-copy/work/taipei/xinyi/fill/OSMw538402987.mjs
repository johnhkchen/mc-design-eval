import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi low-rise commercial block, c. 1990s: two storeys of reinforced concrete,
// white tiled piers, tinted glazing, stone bands, flat roof with a parapet and a
// small plant room. Roof sits 11 blocks above the lowest ground.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402987";
const W = 25, H = 23, D = 18;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(gr))));
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["east", 1, 0],
  ["west", -1, 0],
];
const exposedOf = (x, z) => DIRS.filter(([, dx, dz]) => !inFp(x + dx, z + dz));

// Per-cell metadata
const meta = new Map();
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposedOf(x, z);
  const hasNS = ex.some(([n]) => n === "north" || n === "south");
  const hasEW = ex.some(([n]) => n === "east" || n === "west");
  const corner = ex.length >= 2 && hasNS && hasEW;
  const u = hasNS ? x : z;
  meta.set(key, {
    x, z, g: gAt(x, z), ex,
    boundary: ex.length > 0,
    corner,
    u,
    pier: corner || u % 3 === 0,
  });
}

// Entrance: prefer a non-corner north-facing wall cell nearest the middle of the frontage
let door = null;
{
  let best = Infinity;
  for (const m of meta.values()) {
    if (!m.boundary || m.corner) continue;
    const northFace = m.ex.some(([n]) => n === "north");
    const score = Math.abs(m.x - 12) + (northFace ? 0 : 100);
    if (score < best) { best = score; door = m; }
  }
}

// 1. Foundations, floors, walls
for (const m of meta.values()) {
  const { x, z, g: gr } = m;

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone");

  if (!m.boundary) {
    // interior floor slabs and roof deck, air between
    set(x, gr + 0, z, "smooth_stone");
    set(x, gr + 5, z, "smooth_stone");
    set(x, gr + 10, z, "gray_concrete");
    continue;
  }

  // Exterior wall, rows relative to this cell's ground
  const r = (k) => gr + k;
  set(x, r(0), z, "polished_andesite");              // plinth / base course

  if (door && m === door) {
    const facing = m.ex[0][0];
    const doorProps = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
    set(x, r(1), z, "dark_oak_door", doorProps("lower"));
    set(x, r(2), z, "dark_oak_door", doorProps("upper"));
    set(x, r(3), z, "stone_bricks");                  // canopy lintel over entrance
  } else if (m.pier) {
    set(x, r(1), z, "white_concrete");
    set(x, r(2), z, "white_concrete");
    set(x, r(3), z, "white_concrete");
  } else {
    set(x, r(1), z, "smooth_stone");                  // shopfront sill
    set(x, r(2), z, "light_blue_stained_glass");
    set(x, r(3), z, "light_blue_stained_glass");
  }
  set(x, r(4), z, "white_concrete");                  // ground-floor lintel / spandrel
  set(x, r(5), z, "smooth_stone");                    // storey band

  if (m.pier) {
    set(x, r(6), z, "white_concrete");
    set(x, r(7), z, "white_concrete");
    set(x, r(8), z, "white_concrete");
  } else {
    set(x, r(6), z, "smooth_stone");                  // upper sill
    set(x, r(7), z, "light_blue_stained_glass");
    set(x, r(8), z, "light_blue_stained_glass");
  }
  set(x, r(9), z, "white_concrete");                  // spandrel
  set(x, r(10), z, "smooth_stone");                   // cornice
  set(x, r(11), z, "white_concrete");                 // parapet
}

// Interior floors/roof deck for cells on the boundary are already covered by the wall column
// (the wall cell is solid). Roof deck interior at r10 for all interior cells is set above.

// 2. Warm lights standing just inside selected windows (behind the glass)
for (const m of meta.values()) {
  if (!m.boundary || m.pier || m.corner || m.ex.length !== 1) continue;
  if (m.u % 6 !== 4) continue;
  const [, dx, dz] = m.ex[0];
  const ix = m.x - dx, iz = m.z - dz;
  if (!inFp(ix, iz)) continue;
  const im = meta.get(`${ix},${iz}`);
  if (!im || im.boundary) continue;
  set(ix, im.g + 1, iz, "glowstone");                 // ground floor, behind shopfront glass
  set(ix, im.g + 6, iz, "glowstone");                 // upper floor, behind window glass
}

// 3. Rooftop plant room, 3x3 footprint, only on interior cells
{
  const cx = 12, cz = 9;
  const ring = [];
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const k = `${cx + dx},${cz + dz}`;
    const m = meta.get(k);
    if (!m || m.boundary) { ok = false; break; }
    ring.push(m);
  }
  if (ok) {
    for (const m of ring) {
      set(m.x, m.g + 11, m.z, "stone_bricks");
      set(m.x, m.g + 12, m.z, "stone_bricks");
    }
    const c = meta.get(`${cx},${cz}`);
    set(c.x, c.g + 13, c.z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
