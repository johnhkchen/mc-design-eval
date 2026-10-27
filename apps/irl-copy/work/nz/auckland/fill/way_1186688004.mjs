// Visitor Centre, Mt Eden side of the CBD footprint (way 1186688004): a 2-storey main hall with a 3-storey core
// and a single-storey wing. Massing follows the lidar roof per cell, quantised to four tiers (5, 8, 10, 12 blocks)
// and median-smoothed over 3x3 so the tiers read as flat steps. Every column is solid from y 0 up to its tier;
// perimeter cells are the walls (base course, storey bands, glass and quartz-rib windows, cornice) and interior
// cells are hollow with a floor slab per storey, so each window has an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1186688004.cells.json`, "utf8"));

const X = 54, Z = 51, Y = 25;
const g = new Voxels([X, Y, Z]);
const k = (x, z) => `${x},${z}`;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];          // outward normals: north, south, west, east

// 1. quantise the lidar roofs to tiers, then 3x3 median so isolated noise cells join their neighbours
const tierOf = (r) => (r <= 5 ? 5 : r <= 8 ? 8 : r <= 10 ? 10 : 12);
const raw = new Map(cells.map(([x, z, ground, roof]) => [k(x, z), { x, z, ground, t: tierOf(roof) }]));
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const info = new Map();
for (const c of raw.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = raw.get(k(c.x + dx, c.z + dz)); if (n) vals.push(n.t);
  }
  info.set(k(c.x, c.z), { x: c.x, z: c.z, ground: c.ground, h: median(vals), exp: [], perim: false });
}
const hAt = (x, z) => info.get(k(x, z))?.h ?? 0;          // outside the footprint is 0

// 2. exposed faces: a neighbour that is outside or lower; the face shows from that neighbour's height up
for (const c of info.values()) {
  for (const [dx, dz] of DIRS) {
    const lo = hAt(c.x + dx, c.z + dz);
    if (lo < c.h) c.exp.push({ dx, dz, lo });
  }
  c.perim = c.exp.length > 0;
}

// 3. a window needs an air cell behind its pane: an interior cell on the inward side, tall enough for the row
const windowFace = (c, y) => {
  for (const e of c.exp) {
    if (y < e.lo) continue;
    const inward = info.get(k(c.x - e.dx, c.z - e.dz));
    if (!inward || inward.perim || y >= inward.h) continue;
    return e;
  }
  return null;
};

// 4. the massing and the facade, cell by cell. Storeys are 4 blocks: y%4==0 base or floor band, 1-2 windows,
//    3 lintel band; the top block of each column is the cornice (perimeter) or roof (interior).
const windows = [];
for (const c of info.values()) {
  const { x, z, h, ground } = c;
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");        // foundation to the lowest ground
  for (let y = ground; y < h; y++) {
    if (!c.perim) {
      if (y === h - 1) g.set(x, y, z, "light_gray_concrete");            // flat roof over the hollow storey
      else if (y % 4 === 0) g.set(x, y, z, "smooth_stone");              // floor slab per storey
      continue;
    }
    if (y === h - 1) { g.set(x, y, z, "stone_bricks"); continue; }      // cornice
    const off = y % 4;
    if (off === 0) { g.set(x, y, z, y === 0 ? "stone_bricks" : "smooth_stone"); continue; }
    if (off === 3) { g.set(x, y, z, "smooth_stone"); continue; }        // lintel band
    const e = windowFace(c, y);
    const along = c.exp[0].dx !== 0 ? c.z : c.x;                        // position along the wall: rib every 3rd cell
    if (e && along % 3 !== 0) {
      const wallAlongZ = e.dx !== 0;                                    // a pane joins the run of the wall it sits in
      g.set(x, y, z, "light_blue_stained_glass_pane", {
        north: wallAlongZ ? "true" : "false", south: wallAlongZ ? "true" : "false",
        east: wallAlongZ ? "false" : "true", west: wallAlongZ ? "false" : "true", waterlogged: "false",
      });
      if (y % 4 === 1) windows.push({ c, y, e });
    } else if (along % 3 === 0 || c.exp.length > 1) {
      g.set(x, y, z, "quartz_pillar", { axis: "y" });                   // vertical rib / corner
    } else {
      g.set(x, y, z, "smooth_quartz");
    }
  }
}

// 5. warm lights: a standing lantern on the interior floor behind some lower-row windows
for (const { c, y, e } of windows) {
  if ((c.x * 3 + c.z * 5) % 4 !== 0) continue;
  const inward = info.get(k(c.x - e.dx, c.z - e.dz));
  g.set(c.x - e.dx, y, c.z - e.dz, "lantern", { hanging: "false", waterlogged: "false" });
}

// 6. the entrance: the longest run of ground-level facade on any side, a 5-cell glass bay with a door in its middle
let best = null;
for (const [dx, dz] of DIRS) {
  const lines = new Map();
  for (const c of info.values()) {
    if (!c.exp.some((e) => e.dx === dx && e.dz === dz && e.lo <= 1)) continue;
    const line = dx !== 0 ? c.x : c.z, along = dx !== 0 ? c.z : c.x;
    if (!lines.has(line)) lines.set(line, []);
    lines.get(line).push(along);
  }
  for (const [line, alongs] of lines) {
    alongs.sort((a, b) => a - b);
    let s = 0;
    for (let i = 1; i <= alongs.length; i++) {
      if (i === alongs.length || alongs[i] !== alongs[i - 1] + 1) {
        const len = i - s;
        if (!best || len > best.len) best = { dx, dz, line, start: alongs[s], len };
        s = i;
      }
    }
  }
}
const door = { along: best.start + Math.floor(best.len / 2) };
const cellAt = (line, along, dx) => (dx !== 0 ? [line, along] : [along, line]);
const bayHalf = Math.floor(Math.min(5, best.len) / 2);
for (let a = door.along - bayHalf; a <= door.along + bayHalf; a++) {
  const [x, z] = cellAt(best.line, a, best.dx);
  for (const y of [1, 2]) g.set(x, y, z, "light_blue_stained_glass");
}
{
  const [x, z] = cellAt(best.line, door.along, best.dx);
  const facing = best.dx < 0 ? "west" : best.dx > 0 ? "east" : best.dz < 0 ? "north" : "south";
  g.set(x, 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// 7. roof plant on the 12-tier core: a 4 x 3 plinth on the roof, two blocks high, with a concrete cap
let plant = null;
for (const c of info.values()) {
  if (c.perim || c.h !== 12) continue;
  let ok = true;
  for (let i = 0; i < 4 && ok; i++) for (let j = 0; j < 3 && ok; j++) {
    const n = info.get(k(c.x + i, c.z + j));
    if (!n || n.perim || n.h !== 12) ok = false;
  }
  if (ok && !plant) plant = c;
}
if (plant) {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    g.set(plant.x + i, 12, plant.z + j, "light_gray_concrete");
    g.set(plant.x + i, 13, plant.z + j, "smooth_stone");
  }
}

g.save(`${DIR}/way_1186688004.nbt`);
