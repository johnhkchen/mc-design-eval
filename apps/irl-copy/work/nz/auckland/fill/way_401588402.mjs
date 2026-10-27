// Cargen Flats, Mt Eden / Eden Terrace: a 1970s reinforced-concrete flats block, six to seven storeys over a
// stepped massing (wing 4, mid 6-7, core 7 + plant). White concrete piers and spandrels, storey lines in light grey,
// tinted glazing in pier-framed bays, a base course, a dark-oak entrance, lanterns behind some windows, plant boxes on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588402.cells.json", "utf8"));
const X = 37, Y = 44, Z = 38;
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588402.nbt";

const key = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// footprint, ground and roof per cell; the roof is median-smoothed over the 3x3 neighbourhood, then snapped to flat tiers
const ground = new Map(), roofRaw = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); roofRaw.set(key(x, z), r); }
const inside = (x, z) => roofRaw.has(key(x, z));
const tierOf = (r) => (r <= 16 ? 16 : r <= 21 ? 20 : r <= 26 ? 24 : r <= 28 ? 28 : r <= 30 ? 30 : 32);
// two median passes: one leaves the tier edges serrated, two make them flat
const medianPass = (src) => {
  const dst = new Map();
  for (const [x, z] of cells.map(([x, z]) => [x, z])) {
    const vals = [];
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const k = key(x + dx, z + dz); if (src.has(k)) vals.push(src.get(k)); }
    vals.sort((a, b) => a - b);
    dst.set(key(x, z), vals[vals.length >> 1]);
  }
  return dst;
};
const roofSmooth = medianPass(medianPass(roofRaw));
const top = new Map();                                    // tier top per cell: the column is solid from 0 to top-1
for (const [x, z] of cells.map(([x, z]) => [x, z])) top.set(key(x, z), tierOf(roofSmooth.get(key(x, z))));
const Tof = (x, z) => top.get(key(x, z)) ?? 0;

// a block at y is on the outer shell when a side neighbour is outside the footprint or stands lower than y
const exposed = (x, y, z) => DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || Tof(x + dx, z + dz) <= y);
const isSlab = (y) => y % 4 === 2;                        // storey floors at y = 2, 6, 10, ...

const put = new Map();                                    // "x,y,z" -> { x, y, z, block, state }
const set = (x, y, z, block, state) => put.set(`${x},${y},${z}`, { x, y, z, block, state });
const glass = new Set();
const pier = (x, z) => (x + z) % 3 === 2;

// foundation: solid from y 0 up to the ground course under every cell
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  set(x, 0, z, "stone_bricks"); set(x, 1, z, "stone_bricks");
}

// the body of each column, bottom to top
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const T = Tof(x, z);
  for (let y = 2; y < T; y++) {
    if (y === T - 1) { set(x, y, z, "light_gray_concrete"); continue; }   // cornice / roof deck, the top course everywhere
    if (!exposed(x, y, z)) { if (isSlab(y)) set(x, y, z, "light_gray_concrete"); continue; }   // interior: floor slabs only, air between
    // the facade: base course, storey lines, spandrels, and window bays framed by piers
    const r = (y - 2) % 4;
    if (y === 2) { set(x, y, z, "polished_andesite"); continue; }
    if (r === 0) { set(x, y, z, "light_gray_concrete"); continue; }
    const ground1 = y <= 5;
    if (!ground1 && r === 1) { set(x, y, z, "white_concrete"); continue; }   // upper spandrel
    if (ground1 && y === 5) { set(x, y, z, "light_gray_concrete"); continue; } // shopfront lintel
    if (pier(x, z)) set(x, y, z, "white_concrete");
    else { set(x, y, z, "light_blue_stained_glass_pane"); glass.add(`${x},${y},${z}`); }
  }
}

// entrance: the longest run of street-facing shell cells at ground level; a dark-oak door in the middle, polished jambs
const runs = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (Tof(x, z) < 6) continue;
  for (const [dx, dz] of DIRS) if (!inside(x + dx, z + dz)) {
    const k = FACING[`${dx},${dz}`];
    if (!runs.has(k)) runs.set(k, []);
    runs.get(k).push([x, z, dx, dz]);
  }
}
let door = null;
{
  let best = null;
  for (const [face, list] of runs) if (!best || list.length > best[1].length) best = [face, list];
  const list = best[1].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const [x, z, dx, dz] = list[Math.floor(list.length / 2)];
  door = { x, z, face: best[0] };
  for (const [jx, jz] of [[x - dz, z - dx], [x + dz, z + dx]]) {   // the cells either side along the same wall
    if (inside(jx, jz) && Tof(jx, jz) > 5) for (const y of [3, 4, 5]) set(jx, y, jz, "polished_andesite");
  }
  set(x, 3, z, "dark_oak_door", { facing: door.face, half: "lower", hinge: "left", open: "false", powered: "false" });
  set(x, 4, z, "dark_oak_door", { facing: door.face, half: "upper", hinge: "left", open: "false", powered: "false" });
  set(x, 5, z, "polished_andesite");
  glass.delete(`${x},3,${z}`); glass.delete(`${x},4,${z}`);
}

// warm light behind some windows: a lantern on the floor just inside, one per few bays
for (const k of [...glass]) {
  const [x, y, z] = k.split(",").map(Number);
  const L = y - ((y - 2) % 4);                             // storey floor under this row
  const lightRow = y === 3 ? 3 : (y === L + 2 ? L + 1 : -1);
  if (lightRow < 0 || (x * 7 + z * 3 + y) % 9 !== 0) continue;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz) || Tof(nx, nz) <= lightRow || exposed(nx, lightRow, nz)) continue;
    if (put.has(`${nx},${lightRow},${nz}`)) continue;
    set(nx, lightRow, nz, "lantern", { hanging: "false", waterlogged: "false" });
    break;
  }
}

// roof: plant boxes on the core, a few planted corners on the low wing
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const T = Tof(x, z);
  if (T === 32 && (x * 5 + z * 3) % 17 === 0) set(x, 32, z, "iron_block");
  if (T === 16 && (x * 3 + z * 7) % 11 === 0) set(x, 16, z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
}

// glass panes: connect to any neighbouring block in the plane of the wall
const has = (x, y, z) => put.has(`${x},${y},${z}`);
const out = new Voxels([X, Y, Z]);
for (const e of put.values()) {
  if (glass.has(`${e.x},${e.y},${e.z}`)) {
    const { x, y, z } = e;
    out.set(x, y, z, "light_blue_stained_glass_pane", {
      east: String(has(x + 1, y, z)), west: String(has(x - 1, y, z)),
      north: String(has(x, y, z - 1)), south: String(has(x, y, z + 1)), waterlogged: "false",
    });
  } else out.set(e.x, e.y, e.z, e.block, e.state);
}

const stats = out.save(OUT);
const tiers = {}; for (const t of top.values()) tiers[t] = (tiers[t] ?? 0) + 1;
console.log(JSON.stringify({ file: OUT, tiers, glass: glass.size, door, ...stats }));
