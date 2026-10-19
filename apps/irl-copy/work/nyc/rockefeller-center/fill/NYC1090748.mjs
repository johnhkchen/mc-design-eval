// NYC1090748: 34 East 51st Street, a 2013 Midtown office tower (Commercial & Office Buildings). The 51st Street
// front is the north face (z 0): a stone base of two storeys with a central entrance and a shopfront, then a blue-glass
// curtain wall on pale spandrels with stone mullions. The lot lines (x 0 and x 14) are brick party walls with stone
// pilasters and no glass. The rear (z 27) is glazed. Lidar gives a stepped massing: a 28-storey tower on the
// south-west, a 21-storey shoulder on the north-west, 16-18 storeys through the middle and an 8-storey podium along
// the north-east, with a light court where the lidar sees no roof. Each tier has a stone parapet, the tallest carry
// a mechanical penthouse, the middle roofs carry plant boxes, and the podium roof is planted. Some windows are lit.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 15, D = 28, H = 96;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1090748.cells.json`, "utf8"));

// Lidar per footprint cell: every ground is 0 here, and a cell with no roof return (0) is an open court.
const raw = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, g, r] of cells) {
  if (g !== 0) throw new Error(`ground ${g} at ${x},${z}: this lot is level`);
  raw[z][x] = r;
}

// Smooth the roof into flat tiers: each cell takes the median of its 3 x 3 building neighbours, snapped to whole storeys
// (3 blocks), then the same again so single-cell lidar steps flatten out. A lone column with fewer than three building
// neighbours is a lidar spike (a mast on a court), not a tower, so it is dropped.
const med = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const near = (A, x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const X = x + dx, Z = z + dz;
    if (X >= 0 && Z >= 0 && X < W && Z < D && A[Z][X] > 0) v.push(A[Z][X]);
  }
  return v;
};
const snap = (h) => Math.max(3, 3 * Math.round(h / 3));
const pass = (A) => Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => {
  const nb = near(A, x, z);
  return A[z][x] > 0 && nb.length >= 3 ? snap(med(nb)) : 0;
}));
const T = pass(pass(raw));   // T[z][x] = top of the column in blocks above y 0 (0 = open court or outside the lot)

const FACES = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };   // N is z - 1, the 51st Street side
const topAt = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : T[z][x]);
const exposed = (x, z, y) => Object.keys(FACES).filter((d) => topAt(x + FACES[d][0], z + FACES[d][1]) <= y);
const lotLine = (x, d) => (d === "E" || d === "W") && (x + FACES[d][0] < 0 || x + FACES[d][0] >= W);

// Which face a wall cell shows: the street front first, then a lot line (party wall), then any other exposed side.
const faceOf = (x, z, sides) => {
  if (sides.includes("N") && z === 0) return "N";
  const party = sides.find((d) => lotLine(x, d));
  return party ?? sides[0];
};

const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// The skin of one exposed wall cell: s = storey (3 blocks each), r = row in the storey (1 or 2 for glazing).
function skin(x, y, z, d, s, r) {
  const street = d === "N" && z === 0;
  const u = d === "N" || d === "S" ? x : z;
  if (street && s === 0) {                                          // ground-floor shopfront and entrance
    if (x === 7) return { b: "iron_door", s: doorState(r === 1 ? "lower" : "upper") };
    if (x === 0 || x === 4 || x === 10 || x === 14) return { b: "polished_granite" };
    if (r === 2 && (x === 6 || x === 8)) return { b: "lantern", s: { hanging: "true", waterlogged: "false" } };
    return { b: "light_blue_stained_glass_pane", glass: true };    // clear shopfront glass
  }
  if (lotLine(x, d)) return { b: u % 4 === 0 ? "stone_bricks" : "bricks" };   // party wall, pilasters every 4
  if (u % 3 === 0) return { b: s < 2 ? "polished_granite" : "polished_andesite" };   // mullion; base stone below storey 2
  return { b: "light_blue_stained_glass_pane", glass: true, u };
}

// Pass 1: the shell. Each column stands on the ground from y 0 to its top: a granite base course, a slab over each
// storey, a window band of glass and mullions on the exposed faces, air behind the glass, and a roof at its top.
const M = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, b, s, glass = false, face = null) => M.set(key(x, y, z), { b, s, glass, face });
const lights = [];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const t = T[z][x];
  if (!t) continue;
  for (let y = 0; y < t; y++) {
    const s = Math.floor(y / 3), r = y % 3;
    const sides = exposed(x, z, y);
    if (y === 0) { put(x, y, z, "polished_granite"); continue; }        // base course and lobby floor
    if (y === t - 1) { put(x, y, z, sides.length ? "smooth_stone" : "gray_concrete"); continue; }   // parapet or roof
    if (r === 0) {                                                     // storey line: slab, or spandrel on the outside
      if (sides.includes("N") && z === 0 && s === 1 && x >= 5 && x <= 9) put(x, y, z, "polished_granite");   // entrance canopy
      else if (!sides.length) put(x, y, z, "smooth_stone");
      else put(x, y, z, lotLine(x, faceOf(x, z, sides)) ? "smooth_stone" : s < 2 ? "polished_granite" : "light_gray_concrete");
      continue;
    }
    if (!sides.length) continue;                                       // interior: air behind the glass
    const d = faceOf(x, z, sides);
    const k = skin(x, y, z, d, s, r);
    put(x, y, z, k.b, k.s, !!k.glass, d);
    if (k.glass) {
      const ins = [x - FACES[d][0], y, z - FACES[d][1]];
      const lit = r === 1 && (x * 3 + s * 5 + z * 7) % 9 === 2;     // some windows lit, glowstone behind the glass
      if (lit && !M.has(key(...ins))) lights.push([...ins]);
    }
  }
}
for (const [x, y, z] of lights) put(x, y, z, "glowstone", null);

// Rooftop plant: boxes on the middle tiers, a penthouse on the tallest tower, planted terrace on the podium.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const t = T[z][x];
  if (!t || exposed(x, z, t - 1).length) continue;                    // only the interior of a roof
  if (t >= 81 && x >= 2 && x <= 4 && z >= 21) {
    put(x, t, z, "light_gray_concrete", null); put(x, t + 1, z, "light_gray_concrete", null);
    put(x, t + 2, z, "smooth_stone", null);
  } else if (t >= 45 && x % 4 === 1 && z % 5 === 2) {
    put(x, t, z, "polished_andesite", null); put(x, t + 1, z, "polished_andesite", null);
  } else if (t === 24 && x % 3 === 1 && z % 2 === 0) {
    put(x, t, z, "azalea", null);
  }
}

// Pass 2: glazing takes its arms from the neighbours in its own wall, so a run of panes reads as one band.
const CONNECTS = (e) => e && !["iron_door", "lantern", "glowstone"].includes(e.b);
const link = (x, y, z) => CONNECTS(M.get(key(x, y, z)));
for (const [k, e] of M) {
  if (!e.glass) continue;
  const [x, y, z] = k.split(",").map(Number);
  const alongX = e.face === "N" || e.face === "S";
  e.s = alongX
    ? { east: String(link(x + 1, y, z)), west: String(link(x - 1, y, z)), north: "false", south: "false", waterlogged: "false" }
    : { north: String(link(x, y, z - 1)), south: String(link(x, y, z + 1)), east: "false", west: "false", waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, e] of M) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, e.b, e.s ?? undefined);
}
const out = `${DIR}/NYC1090748.nbt`;
const { blocks, palette } = g.save(out);
const tallest = Math.max(...T.flat());
console.log(`NYC1090748: ${blocks} blocks, ${palette} palette entries, tallest top ${tallest}, footprint ${cells.length} cells -> ${out}`);
