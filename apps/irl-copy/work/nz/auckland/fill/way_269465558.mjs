// Way 269465558, Auckland (Mt Eden / Eden Terrace edge): a 1960s-70s four-storey concrete office block over
// shopfronts. Pale concrete frame with ribbon-and-pier glazing (blue-tinted panes, concrete spandrels, stone ledges),
// a dark stone base and shopfront on the street, a recessed entrance on the north (uphill) street front, a stepped
// roof that follows the lidar (median-smoothed, quantised to 4-block storeys), a parapet, and rooftop plant rooms.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465558.cells.json", "utf8"));
const X = 54, Y = 29, Z = 40;
const g = new Voxels([X, Y, Z]);

const k2 = (x, z) => `${x},${z}`;
const GROUND = new Map(), RAW = new Map();
for (const [x, z, gr, r] of cells) { GROUND.set(k2(x, z), gr); RAW.set(k2(x, z), r); }

// lidar noise: 3x3 median of the roof heights over footprint neighbours, then quantise to 4-block tiers
const LINES = [4, 8, 12, 16];      // storey lines (absolute y)
const C = new Map();                // cell -> { g: ground, T: top of its volume }
for (const [key, gr] of GROUND) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const kk = k2(x + dx, z + dz); if (RAW.has(kk)) vals.push(RAW.get(kk)); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  const tier = Math.max(4, Math.round(med / 4) * 4);
  const nextLine = (Math.floor(gr / 4) + 1) * 4;
  C.set(key, { g: gr, T: Math.max(tier, nextLine) });
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cellOf = (x, z) => C.get(k2(x, z));
const inV = (x, y, z) => { const c = cellOf(x, z); return !!c && y >= c.g && y < c.T; };
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !inV(x + dx, y, z + dz));

// storey lines of one column: its ground, then each absolute storey line at least 3 above it and below its top
const linesOf = (c) => [c.g, ...LINES.filter((L) => L - c.g >= 3 && L > c.g && L < c.T)];
const isLine = (c, y) => linesOf(c).includes(y);

const PANE = (ew) => ew
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

const lights = [];
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// 1. foundations: solid stone from y 0 up to each cell's ground
for (const [key, c] of C) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone_bricks");
}

// 2. volume: facade rows by storey band, flat floor slabs and roof, air inside
for (const [key, c] of C) {
  const [x, z] = key.split(",").map(Number);
  const lines = linesOf(c);
  for (let y = c.g; y < c.T; y++) {
    const ex = exposed(x, y, z);
    if (ex.length === 0) {
      if (y === c.T - 1) g.set(x, y, z, "smooth_stone");              // roof covering
      else if (isLine(c, y)) g.set(x, y, z, "smooth_stone");          // floor slab
      continue;                                                       // air gap behind the glass
    }
    // facade: which band is this row in?
    const k = lines.filter((L) => L <= y).pop();
    const hi = lines.find((L) => L > y) ?? c.T;
    const ground = k === c.g;
    const [dx, dz] = ex[0];
    const u = dx !== 0 ? z : x;                          // position along the face
    const corner = ex.length > 1;
    const pier = corner || u % 4 === 0;
    const ew = dz !== 0;                                 // face runs along x: panes connect east-west
    let block = null, state;
    if (y === c.g) block = "stone_bricks";                                   // base course
    else if (ground) {
      if (y === hi - 1) block = "polished_andesite";                         // shopfront fascia
      else if (pier) block = "polished_andesite";
      else { block = "light_blue_stained_glass_pane"; state = PANE(ew); }
    } else {
      if (y === k) block = "smooth_stone";                                   // storey ledge
      else if (y === hi - 1) block = "light_gray_concrete";                  // spandrel
      else if (pier) block = "white_concrete";
      else { block = "light_blue_stained_glass_pane"; state = PANE(ew); }
    }
    g.set(x, y, z, block, state);
    // a warm light in the air gap behind some panes (the inward cell is always air interior)
    const ix = x - dx, iz = z - dz;
    if (block.endsWith("pane") && inV(ix, y, iz) && exposed(ix, y, iz).length === 0 && !isLine(cellOf(ix, iz), y)
        && y !== cellOf(ix, iz).T - 1 && hash(x, y, z) % (ground ? 5 : 7) === 0) lights.push([ix, y, iz]);
  }
}
for (const [x, y, z] of lights) g.set(x, y, z, "glowstone");

// 3. parapet on every column edge that stands above a neighbour (or the footprint edge)
for (const [key, c] of C) {
  const [x, z] = key.split(",").map(Number);
  const edge = DIRS.some(([dx, dz]) => { const n = cellOf(x + dx, z + dz); return !n || n.T < c.T; });
  if (edge && c.T < Y) g.set(x, c.T, z, "white_concrete");
}

// 4. recessed entrance on the north (uphill) street front: a two-bay notch, door, pane and a hanging lantern
const EX = [8, 9];
const northG = cellOf(EX[0], 0).g;
const fascia = (() => { const c = cellOf(EX[0], 0); const l = linesOf(c); const hi = l.find((L) => L > northG + 1) ?? c.T; return hi - 1; })();
for (const x of EX) for (let y = northG + 1; y < fascia; y++) g.set(x, y, 0, "air");
g.set(EX[0], northG + 1, 0, "iron_door", DOOR("lower"));
g.set(EX[0], northG + 2, 0, "iron_door", DOOR("upper"));
for (let y = northG + 1; y < fascia; y++) g.set(EX[1], y, 0, "light_blue_stained_glass_pane", PANE(true));
if (northG + 3 < fascia) g.set(EX[0], northG + 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 5. rooftop plant rooms: two 4x3 boxes on the highest roof, clear of the parapet
const top = Math.max(...[...C.values()].map((c) => c.T));
const roofOk = (x, z) => { const c = cellOf(x, z); return !!c && c.T === top; };
const boxes = [];
const fits = (x0, z0) => {
  for (let x = x0 - 1; x <= x0 + 4; x++) for (let z = z0 - 1; z <= z0 + 3; z++) if (!roofOk(x, z)) return false;
  return !boxes.some(([bx, bz]) => Math.abs(bx - x0) < 7 && Math.abs(bz - z0) < 6);
};
for (let x0 = 2; x0 < X - 6 && boxes.length < 2; x0++) for (let z0 = 2; z0 < Z - 5 && boxes.length < 2; z0++) {
  if (fits(x0, z0)) boxes.push([x0, z0]);
}
for (const [x0, z0] of boxes) {
  const y0 = top, y1 = top + 2;
  for (let x = x0; x <= x0 + 3; x++) for (let z = z0; z <= z0 + 2; z++) for (let y = y0; y <= y1; y++) {
    const wall = x === x0 || x === x0 + 3 || z === z0 || z === z0 + 2;
    if (y === y1) g.set(x, y, z, "smooth_stone");
    else if (!wall) g.set(x, y, z, "air");
    else if (z === z0 + 2 && x > x0 && x < x0 + 3 && y < y1) g.set(x, y, z, "light_blue_stained_glass_pane", PANE(true));
    else g.set(x, y, z, "white_concrete");
  }
  g.set(x0 + 1, y0, z0 + 1, "glowstone");
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465558.nbt");
console.log(JSON.stringify({ ...stats, cells: C.size, lights: lights.length, boxes }));
