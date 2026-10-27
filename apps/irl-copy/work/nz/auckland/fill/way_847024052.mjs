// A late-1970s four-storey concrete office block on the Mt Eden / Eden Terrace slope: a flat-topped slab
// (lidar roof 18 blocks above the lowest ground, smoothed to one tier with a 1-block parapet), a basalt-faced plinth
// that runs down the slope to the lowest ground, a bay of white concrete piers with tinted glass between, a
// recessed street entrance under a canopy line, and a stair/lift housing and plant on the roof. Every column stands
// on its own foundation from y 0 to its ground; floor slabs at y 7, 11, 15 and the roof at 18; the inside is air
// with a warm lamp on the floor behind a few panes. Only the footprint is built.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_847024052.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_847024052.nbt`;

const X = 40, Z = 49, Y = 31;
const ROOF = 18, PARAPET = 19, FLOOR0 = 4;           // flat roof slab at 18 (lidar median), parapet on it
const SLABS = [7, 11, 15, ROOF];                     // storey lines: the top of each 4-block storey
const BANDS = [[4, 6], [8, 10], [12, 14], [16, 17]];  // glazed rows in each storey (attic is the last, 2 rows)

// the footprint: g = lidar ground (0..4), r = roof height above y 0 (16..18, smoothed to ROOF)
const col = new Map();
for (const [x, z, g] of cells) col.set(`${x},${z}`, { x, z, g });
const at = (x, z) => col.get(`${x},${z}`);
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const FACING = { W: "west", E: "east", N: "north", S: "south" };
const outs = (c) => Object.keys(DIRS).filter((d) => !at(c.x + DIRS[d][0], c.z + DIRS[d][1]));
const rim = (c) => outs(c).length > 0;               // on the outer ring of the footprint
const inner = (c) => !rim(c);

// the street entrance: a door on the face of the highest ground (the door is 4 blocks above y 0, so it must sit
// where the street is level with the ground floor), with a canopy over it and a lantern pair at its flanks
let bay = null;
for (const c of col.values()) {
  const o = outs(c); if (o.length !== 1) continue;
  const d = o[0], t = DIRS[d][0] === 0 ? [1, 0] : [0, 1];
  const row = [-1, 0, 1].map((k) => at(c.x + t[0] * k, c.z + t[1] * k)).filter(Boolean);
  if (!bay || c.g > bay.c.g) bay = { d, c, row };
}

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const flag = { waterlogged: "false" };

// the faces: which cells of each storey are piers (every third cell along the face) and which are glass
const along = (c, outsList) => (outsList.some((d) => d === "N" || d === "S") ? c.x : c.z) + (outsList.length === 2 ? c.x + c.z : 0);

// 1 foundation and plinth: solid from 0 up to the ground floor (y 3 is the base course), every cell
for (const c of col.values()) {
  for (let y = 0; y < FLOOR0; y++) put(c.x, y, c.z, y < 3 ? "stone_bricks" : "polished_andesite");
}

// 2 floors: a full slab at each storey line, the roof slab on top
for (const c of col.values()) for (const y of SLABS) put(c.x, y, c.z, "smooth_stone");

// 3 the shell: the rim cells, storey by storey; window bays and piers, spandrels, the roof edge and parapet
for (const c of col.values()) {
  if (!rim(c)) continue;
  const o = outs(c);
  const pier = along(c, o) % 3 === 0;
  for (const [lo, hi] of BANDS) for (let y = lo; y <= hi; y++) {
    if (pier) put(c.x, y, c.z, "white_concrete");
    else put(c.x, y, c.z, "light_blue_stained_glass");
  }
  for (const y of [7, 11, 15]) put(c.x, y, c.z, pier ? "white_concrete" : "smooth_stone");
  put(c.x, ROOF, c.z, "light_gray_concrete");
  put(c.x, PARAPET, c.z, "stone_brick_slab", { type: "bottom", ...flag });
}

// 4 the entrance: doors and a shop glass transom, the flanks as shopfront with lanterns under the canopy line
if (bay) {
  const { d, c, row } = bay, fx = FACING[d];
  const hinge = "left";
  put(c.x, FLOOR0, c.z, "dark_oak_door", { facing: fx, half: "lower", hinge, open: "false", powered: "false" });
  put(c.x, FLOOR0 + 1, c.z, "dark_oak_door", { facing: fx, half: "upper", hinge, open: "false", powered: "false" });
  for (const b of row) {
    if (b === c || !rim(b)) continue;
    for (const y of [4, 5, 6]) put(b.x, y, b.z, "light_blue_stained_glass");
    put(b.x, 6, b.z, "lantern", { hanging: "true", ...flag });
  }
  put(c.x, 6, c.z, "light_blue_stained_glass");   // the transom over the door
  // canopy: the storey line over the bay in dark wood, hung out over the door
  for (const b of row) put(b.x, 7, b.z, "dark_oak_planks");
}

// 5 the lamps: a warm light on the floor behind some panes (inside the shell, air otherwise)
for (const c of col.values()) {
  if (!rim(c)) continue;
  const o = outs(c);
  if (along(c, o) % 3 === 0) continue;
  if (bay && bay.row.includes(c)) continue;
  const h = (c.x * 31 + c.z * 17) % 13;
  if (h > 2) continue;
  const [dx, dz] = DIRS[o[0]];
  const ix = c.x - dx, iz = c.z - dz;
  const ic = at(ix, iz);
  if (!ic || !inner(ic)) continue;
  const [lo, hi] = BANDS[(c.x + c.z) % BANDS.length];
  if (h === 0) put(ix, lo, iz, "glowstone");              // a lamp on the floor behind the pane
  else if (h === 1) put(ix, lo, iz, "shroomlight");
  else put(ix, hi, iz, "lantern", { hanging: "true", ...flag });  // hung from the storey line above
}

// 6 the roof: a stair and lift housing near the middle of the slab, AC plant on a grid, a low parapet
let best = null;
const cx = 20, cz = 24;
for (const c of col.values()) {
  let ok = true;
  for (let dx = 0; dx < 5 && ok; dx++) for (let dz = 0; dz < 3 && ok; dz++) {
    const n = at(c.x + dx, c.z + dz); if (!n || rim(n)) ok = false;
  }
  if (!ok) continue;
  const d = Math.abs(c.x + 2 - cx) + Math.abs(c.z + 1 - cz);
  if (!best || d < best.d) best = { c, d };
}
if (best) {
  const { x: hx, z: hz } = best.c;
  for (let dx = 0; dx < 5; dx++) for (let dz = 0; dz < 3; dz++) {
    for (let y = PARAPET; y <= PARAPET + 2; y++) put(hx + dx, y, hz + dz, "light_gray_concrete");
    put(hx + dx, PARAPET + 3, hz + dz, "smooth_stone_slab", { type: "bottom", ...flag });
  }
}
// AC units on the roof, a grid of single blocks clear of the housing and the parapet
for (const c of col.values()) {
  if (rim(c)) continue;
  if (best && c.x >= best.c.x - 1 && c.x <= best.c.x + 5 && c.z >= best.c.z - 1 && c.z <= best.c.z + 3) continue;
  if ((c.x * 3 + c.z * 5) % 23 === 0) put(c.x, PARAPET, c.z, "iron_block");
}

const r = g.save(OUT);
console.log(JSON.stringify({ out: OUT, ...r, size: [X, Y, Z], entrance: bay ? { face: bay.d, at: [bay.c.x, bay.c.z] } : null }));
