// Lewis Eady Building, Auckland CBD: an interwar (1920s-30s) reinforced-concrete commercial block, eight storeys
// by the lidar roof (about 33 blocks above the lowest ground), on a stone podium. The ground-floor datum sits at y 8
// across the block, so the uphill side has a low plinth and the downhill side shows its basement windows. Plastered
// concrete body, terracotta spandrels, quartz piers and cornices, steel-framed glazing with bars for mullions, a
// shopfront ground floor with a fascia, two entrances with canopies, warm light behind some windows.
// Massing: each cell's roof is its lidar height rounded to whole storeys (tiers of 6, 5 and 4 storeys above the
// datum), so the tall NW tier steps down to the SE wing and every tier stands on the one below.
// Interiors are air: exterior walls, a slab per storey and a roof; the air behind the glass is the gap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861498.cells.json", "utf8"));

const F = 8;   // ground-floor datum: the podium is solid below it, and every storey stands on it
const H = 4;   // blocks per storey (about 3.3 m)
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const GLASS = "light_blue_stained_glass_pane";
const PANES = new Set([GLASS, "iron_bars"]);

const k2 = (x, z) => x + "," + z;
const k3 = (x, y, z) => x + "," + y + "," + z;

// the footprint: each cell's ground g and its roof row top (inclusive), the roof rounded to whole storeys
const ground = new Map(), top = new Map();
for (const [x, z, g, r] of cells) {
  ground.set(k2(x, z), g);
  top.set(k2(x, z), F + H * Math.max(2, Math.round((r - F) / H)));
}
const maxTop = Math.max(...top.values());
const has = (x, z) => top.has(k2(x, z));
const present = (x, y, z) => has(x, z) && y >= 0 && y <= top.get(k2(x, z));
// the horizontal sides of a cell at height y that face air (outside the footprint, or above the neighbour's roof)
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !present(x + dx, y, z + dz));
// the face a wall cell is dressed for: x-facing first at a corner, so piers run along z there
const faceOf = (dirs) => dirs.find(([dx]) => dx !== 0) ?? dirs[0];

// overrides win over the massing: doors, canopies, lit windows, the roof plant
const over = new Map();
const setOver = (x, y, z, b, s) => over.set(k3(x, y, z), { b, s });

// the block at one cell from the massing alone (no pane states yet): { b } for a block, null for air
function massing(x, y, z) {
  if (!has(x, z)) return null;
  const t = top.get(k2(x, z));
  if (y < F) {
    // podium: stone up to the datum; on the downhill side the basement windows show above the ground (rows 4 and 5)
    const dirs = exposed(x, y, z);
    if (dirs.length && (y === 4 || y === 5) && y >= ground.get(k2(x, z))) {
      const [dx] = faceOf(dirs);
      const u = dx !== 0 ? z : x;
      return { b: u % 4 === 0 ? "polished_granite" : u % 4 === 2 ? "iron_bars" : GLASS };
    }
    return { b: y < 2 ? "polished_granite" : "smooth_stone" };
  }
  if (y > t) return null;
  const dirs = exposed(x, y, z);
  if (y === t) return { b: dirs.length ? "smooth_quartz" : "light_gray_concrete" };   // roof: coping on the edge, membrane inside
  const rel = (y - F) % H, k = Math.floor((y - F) / H);
  if (rel === 0) return { b: "white_concrete" };          // floor slab
  if (!dirs.length) return null;                           // interior air behind the glass
  if (rel === 3) {                                         // spandrel row: cornice at the top, shop fascia at the ground floor
    if (y === t - 1) return { b: "smooth_quartz" };
    if (k === 0) return { b: "dark_oak_planks" };
    return { b: "terracotta" };
  }
  const [dx] = faceOf(dirs);
  const u = dx !== 0 ? z : x;
  if (u % 4 === 0) return { b: "quartz_pillar" };          // a pier every fourth cell along the face
  if (k > 0 && u % 4 === 2) return { b: "iron_bars" };     // steel mullion between two panes
  return { b: GLASS };                                     // glazing (the shopfronts are all glass between piers)
}

// what is at a cell: overrides first
const at = (x, y, z) => over.get(k3(x, y, z)) ?? massing(x, y, z);

// a pane or bar joins each in-plane neighbour that is a block, another pane or bar, but not a door
function paneState(x, y, z) {
  const s = {};
  for (const [dx, dz, name] of DIRS) {
    const nb = at(x + dx, y, z + dz);
    s[name] = nb && nb.b !== "iron_door" ? "true" : "false";
  }
  s.waterlogged = "false";
  return s;
}

// --- entrances: the longest runs of exposed walls on each facing, one door in the middle of the run
const runs = [];
const seen = new Set();
for (const [x, z] of cells) {
  for (const [dx, dz, name] of DIRS) {
    if (has(x + dx, z + dz) || seen.has(name + "|" + x + "|" + z)) continue;
    const along = dx !== 0 ? [0, 1] : [1, 0];
    const line = [];
    for (let i = -40; i <= 40; i++) {
      const cx = x + along[0] * i, cz = z + along[1] * i;
      if (has(cx, cz) && !has(cx + dx, cz + dz)) line.push([cx, cz]);
    }
    // the contiguous stretch of this line containing the cell
    const idx = line.findIndex(([cx, cz]) => cx === x && cz === z);
    let lo = idx, hi = idx;
    const adj = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
    while (lo > 0 && adj(line[lo - 1], line[lo])) lo--;
    while (hi < line.length - 1 && adj(line[hi], line[hi + 1])) hi++;
    const piece = line.slice(lo, hi + 1);
    for (const [cx, cz] of piece) seen.add(name + "|" + cx + "|" + cz);
    runs.push({ name, dx, dz, cells: piece });
  }
}
runs.sort((a, b) => b.cells.length - a.cells.length);
const doors = [];
for (const r of runs) {
  if (r.cells.length < 3 || doors.some((d) => d.name === r.name)) continue;
  doors.push(r);
  if (doors.length === 2) break;
}
for (const d of doors) {
  const mid = Math.floor(d.cells.length / 2);
  const [mx, mz] = d.cells[mid];
  const facing = d.name;
  const door = { facing, hinge: "left", open: "false", powered: "false" };
  setOver(mx, F + 1, mz, "iron_door", { ...door, half: "lower" });
  setOver(mx, F + 2, mz, "iron_door", { ...door, half: "upper" });
  // canopy: a shelf over the entrance bay, one cell in from the wall, carried by the fascia above
  for (const [cx, cz] of d.cells.slice(Math.max(0, mid - 1), mid + 2)) {
    const ix = cx - d.dx, iz = cz - d.dz;
    if (has(ix, iz) && !massing(ix, F + 3, iz)) setOver(ix, F + 3, iz, "smooth_quartz");
  }
}

// warm light: a glowstone in the air behind the lower pane of about one window in five (one in three at the shops)
for (const [x, z] of cells) {
  const t = top.get(k2(x, z));
  for (let y = F + 1; y < t; y++) {
    if ((y - F) % H !== 1) continue;
    const dirs = exposed(x, y, z);
    if (!dirs.length) continue;
    const [dx, dz] = faceOf(dirs);
    const ix = x - dx, iz = z - dz;
    if (over.has(k3(ix, y, iz)) || !has(ix, iz) || massing(ix, y, iz)) continue;
    const h = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
    const shop = y < F + H;
    if (shop ? h % 3 !== 0 : h % 5 !== 0) continue;
    setOver(ix, y, iz, "glowstone");
  }
}

// roof plant on the tallest tier: a solid two-row box with a coping ring, standing on the roof slab
for (let x = 6; x <= 13; x++) for (let z = 4; z <= 7; z++) {
  if (!has(x, z) || top.get(k2(x, z)) !== maxTop) continue;
  const edge = x === 6 || x === 13 || z === 4 || z === 7;
  setOver(x, maxTop + 1, z, "light_gray_concrete");
  setOver(x, maxTop + 2, z, edge ? "smooth_quartz" : "light_gray_concrete");
}

// --- build: each footprint column from the bottom to its roof, then the overrides; pane states from the neighbours
const g = new Voxels([65, maxTop + 6, 30]);
const put = (x, y, z, c) => {
  const s = c.b === "iron_bars" || c.b === GLASS ? paneState(x, y, z) : c.s;
  g.set(x, y, z, c.b, s);
};
for (const [x, z] of cells) {
  for (let y = 0; y <= top.get(k2(x, z)); y++) {
    const c = massing(x, y, z);
    if (c) put(x, y, z, c);
  }
}
for (const [key, o] of over) {
  const [x, y, z] = key.split(",").map(Number);
  put(x, y, z, o);
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861498.nbt");
console.log(JSON.stringify({ blocks: out.blocks, palette: out.palette, roofTop: maxTop, entrances: doors.map((d) => d.name) }));
