// The AA Centre (OSM way 24252781), Auckland CBD: a concrete-framed office tower on a stepped plinth, with lower wings
// to the north-east and west. Massing follows the lidar roof per cell (3x3 median, snapped to 4-block storeys) so each
// tier stands on the one below. The envelope is a one-cell skin: white storey lines, gray piers, tinted glass panes,
// with a one-cell air gap behind the glass (lit in some windows) and a solid core behind that. Ground floor: a
// polished-andesite base course, shopfront glazing and a recessed entrance under a stone canopy. Roof: setback
// terraces on the wings, a plant room and AC units on the tower top, a parapet round every tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24252781.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24252781.nbt";

const X = 89, Y = 101, Z = 62;
const g = new Voxels([X, Y, Z]);

// --- footprint and per-cell massing ---------------------------------------------------------------------------------
const raw = new Map();                                       // "x,z" -> { g, r }
for (const [x, z, ground, roof] of cells) raw.set(`${x},${z}`, { g: ground, r: roof });
const inFoot = (x, z) => raw.has(`${x},${z}`);

const cell = new Map();                                      // "x,z" -> { x, z, g, P, T, d }
for (const [key, c] of raw) {
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = raw.get(`${x + dx},${z + dz}`); if (n) near.push(n.r); }
  near.sort((a, b) => a - b);
  const rs = near[(near.length - 1) >> 1];                   // the 3x3 median of the lidar roof
  const P = 4 * Math.ceil(Math.max(c.g, 1) / 4);             // the ground floor's base: the storey line at or above the ground
  const T = Math.min(88, Math.max(P + 4, 4 * Math.round(rs / 4)));   // the roof, on a storey line, at least one storey
  cell.set(key, { x, z, g: c.g, P, T, d: 0 });
}
const nb = (x, z) => cell.get(`${x},${z}`) ?? null;
// a lone lidar spike (a cell 12+ blocks above every neighbour) is noise, not a mast: cap it just above its neighbours
for (const c of cell.values()) {
  const nT = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => nb(c.x + dx, c.z + dz)).filter(Boolean).map((n) => n.T);
  if (nT.length && c.T - Math.max(...nT) >= 12) c.T = Math.max(c.P + 4, Math.max(...nT) + 4);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const exterior = (c) => DIRS.filter(([dx, dz]) => !inFoot(c.x + dx, c.z + dz));

// plan depth: 1 on the footprint's outline, 2 behind it (the air gap behind the glass), 3+ the solid core
let frontier = [];
for (const c of cell.values()) if (exterior(c).length) { c.d = 1; frontier.push(c); }
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of DIRS) { const n = nb(c.x + dx, c.z + dz); if (n && !n.d) { n.d = d + 1; next.push(n); } }
  frontier = next;
}

// the sides of a cell that face open air at height y: outside the footprint, or a neighbour whose roof is below y
const openSides = (c, y) => DIRS.filter(([dx, dz]) => { const n = nb(c.x + dx, c.z + dz); return !n || y >= n.T; });

// deterministic pseudo-random in [0, 1) so the same build repeats
const H = (a, b, c) => {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const paneState = (dx, dz) => (dz !== 0
  ? { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" }
  : { north: "true", east: "false", south: "true", west: "false", waterlogged: "false" });

// the entrance: a plan-outline cell on the lowest ground, nearest the footprint's middle
let sx = 0, sz = 0, sn = 0;
for (const c of cell.values()) { sx += c.x; sz += c.z; sn++; }
const mx = sx / sn, mz = sz / sn;
const minG = Math.min(...[...cell.values()].filter((c) => c.d === 1 && exterior(c).length === 1).map((c) => c.g));
let entry = null, best = Infinity;
for (const c of cell.values()) {
  if (c.d !== 1 || exterior(c).length !== 1 || c.g !== minG) continue;
  const dist = Math.hypot(c.x - mx, c.z - mz);
  if (dist < best) { best = dist; entry = c; }
}
const entryKey = entry ? `${entry.x},${entry.z}` : null;

// --- the main pass: one column per footprint cell -------------------------------------------------------------------
const lamps = [];                                            // lamps set after the walls, so they land in the air gap
for (const c of cell.values()) {
  const { x, z, g: ground, P, T, d } = c;
  for (let y = 0; y < T; y++) {
    if (y < ground) { g.set(x, y, z, "stone"); continue; }                 // the foundation, down to the ground
    if (y < P) { g.set(x, y, z, "polished_andesite"); continue; }          // the plinth course up to the ground floor
    const rel = (y - P) % 4;                                               // 0 slab, 1 and 2 the window band, 3 the head
    const ground_storey = y < P + 4;
    const sides = openSides(c, y);

    if (!sides.length) {                                                   // interior: floors and the core, with the air gap
      if (d === 2 && (rel === 1 || rel === 2)) continue;                    // air behind the glass
      g.set(x, y, z, y === T - 1 ? "smooth_stone" : "light_gray_concrete");
      continue;
    }

    // the envelope
    if (key(c) === entryKey) {                                             // the recessed entrance and its canopy
      const facing = DIR_NAME[`${-exterior(c)[0][0]},${-exterior(c)[0][1]}`];
      if (rel === 1) { g.set(x, y, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 2) { g.set(x, y, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 3) { g.set(x, y, z, "stone_bricks"); continue; }
    }
    if (rel === 0 || rel === 3) {
      g.set(x, y, z, rel === 0 && ground_storey ? "polished_andesite" : "white_concrete");
      continue;
    }
    if (sides.length > 1) { g.set(x, y, z, "white_concrete"); continue; }   // a corner pier
    const [dx, dz] = sides[0];
    const idx = dz !== 0 ? x : z;                                          // position along the wall
    if (d !== 1) { g.set(x, y, z, "light_gray_concrete"); continue; }       // a step face against a lower roof: a spandrel panel
    if (idx % 3 === 0) { g.set(x, y, z, "gray_concrete"); continue; }        // a pier between the panes
    g.set(x, y, z, "light_blue_stained_glass_pane", paneState(dx, dz));
    // a lit window: the lamp stands on the floor of the air gap behind the pane
    if (rel === 1 && H(x, y, z) < 0.14) lamps.push({ x: x - dx, y, z: z - dz, h: H(z, y, x) });
  }
  // setback roofs of the wings: pavers and planting, where no taller neighbour rises beside them
  if (d >= 2 && T <= 24 && DIRS.every(([dx, dz]) => { const n = nb(x + dx, z + dz); return !n || n.T <= T; })) {
    g.set(x, T, z, H(x, z, 7) > 0.45 ? "grass_block" : "stone_bricks");
  }
  // a parapet round each tier's outline
  if (d === 1) g.set(x, T, z, "white_concrete");
}

// the tower top: an AC plant room in the middle, AC units across the rest of the roof
for (const c of cell.values()) {
  if (c.T !== 88 || c.d < 3) continue;
  if (c.x >= 34 && c.x <= 50 && c.z >= 22 && c.z <= 36) {
    for (let y = 88; y <= 91; y++) g.set(c.x, y, c.z, "light_gray_concrete");
  } else if ((c.x * 7 + c.z * 3) % 11 === 0) {
    g.set(c.x, 88, c.z, "iron_block");
  }
}

// the lamps, last: a glowstone, a lantern or a shroomlight in some of the air gaps
for (const l of lamps) {
  const pc = nb(Math.floor(l.x), Math.floor(l.z));
  if (!pc || pc.d !== 2 || openSides(pc, l.y).length) continue;
  if (l.h < 0.5) g.set(l.x, l.y, l.z, "glowstone");
  else if (l.h < 0.8) g.set(l.x, l.y, l.z, "lantern", { hanging: "false", waterlogged: "false" });
  else g.set(l.x, l.y, l.z, "shroomlight");
}

function key(c) { return `${c.x},${c.z}`; }

const r = g.save(OUT);
console.log(`way_24252781: ${r.blocks} blocks, ${r.palette} palette entries -> ${OUT}`);
