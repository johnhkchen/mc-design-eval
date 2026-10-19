// DC70207: Hubert H. Humphrey Building (HHS), 200 Independence Ave SW, as a 1.21.1 module.
// A 1977 federal office block: a precast shell (white spandrel bands, light-grey mullion piers, bronze-tinted glass
// panes in a 3-bay grid) on a polished-andesite base, with a recessed entrance on the north face.
// The lidar roof is smoothed (3x3 median over the footprint) and snapped to three tiers: 12 (the outer wings, 3 storeys),
// 16 (the main body, 4 storeys) and 17 (the central core, one block of plant above the 16). Storeys are 4 blocks: a
// spandrel band at y 4, 8 and 12, window rows between them and a cornice on the top row.
// Skin cells (the exposed ring) are solid from y 0 up to their tier. Interior cells are air apart from a base at y 0, a
// floor slab at each storey line and a roof slab at the top, so every slab hangs off the skin ring and nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70207.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70207.nbt";
const SIZE = [43, 29, 42];

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
// x runs east, z runs south, so z 0 is the north edge of the footprint.
const DIRS = [
  { dx: 1, dz: 0, out: "east" }, { dx: -1, dz: 0, out: "west" },
  { dx: 0, dz: 1, out: "south" }, { dx: 0, dz: -1, out: "north" },
];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and the stray low cells drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Three tiers: the outer wings (12), the main body (16) and the central core (17).
const tierOf = (s) => (s <= 13 ? 12 : s <= 16 ? 16 : 17);
const T = (x, z) => tierOf(smooth.get(key(x, z)));

// A cell is skin where a side is open to the air or drops to a lower tier.
const exposure = (x, z) => DIRS.filter(({ dx, dz }) => !inF(x + dx, z + dz) || T(x + dx, z + dz) < T(x, z));

const BANDS = [4, 8, 12];
const rowOf = (y, t) => (y === 0 ? "base" : y === t - 1 ? "cornice" : BANDS.includes(y) ? "band" : "glass");

// The plan: "x,y,z" -> { block, state, kind }. kind says how a neighbouring pane connects: "pane" and "full" do, "lamp" and "door" do not.
const plan = new Map();
const put = (x, y, z, block, state, kind = "full") => plan.set(`${x},${y},${z}`, { block, state, kind });
const ENTRY_Z = 0, ENTRY_X = [18, 22];   // the recessed-looking entrance: piers at 18 and 22, glass at 19 and 21, door at 20

for (const c of F.values()) {
  const { x, z } = c, t = T(x, z);
  const exposed = exposure(x, z);
  const skin = exposed.length > 0;
  const corner = exposed.some((d) => d.dx !== 0) && exposed.some((d) => d.dz !== 0);
  const face = exposed.find((d) => !inF(x + d.dx, z + d.dz)) ?? exposed[0];
  const bay = face && (face.dz !== 0 ? x : z);     // the coordinate that runs along the face

  for (let y = 0; y < t; y++) {
    if (!skin) {
      if (y === 0) put(x, y, z, "polished_andesite");
      else if (y === t - 1) put(x, y, z, t === 17 ? "light_gray_concrete" : "gray_concrete");   // the core roof is a solid plant room
      else if (BANDS.includes(y)) put(x, y, z, "light_gray_concrete");
      continue;
    }
    const row = rowOf(y, t);
    if (row === "base") { put(x, y, z, "polished_andesite"); continue; }
    if (row === "band") { put(x, y, z, "white_concrete"); continue; }
    if (row === "cornice") { put(x, y, z, "light_gray_concrete"); continue; }

    // Window rows: a pier every third bay, glass panes between. The entrance sits on the north face of the 12 wing.
    if (!corner && z === ENTRY_Z && face.out === "north" && x >= ENTRY_X[0] && x <= ENTRY_X[1] && y <= 3) {
      if (x === 20 && y <= 2) put(x, y, z, "iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }, "door");
      else if (x === 20) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }, "lamp");
      else if (x === ENTRY_X[0] || x === ENTRY_X[1]) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "brown_stained_glass_pane", null, "pane");
      continue;
    }
    if (corner || bay % 3 === 0) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "brown_stained_glass_pane", null, "pane");
  }
}

// Roof equipment: small plant boxes on the wing roofs, set well inside so they stand on the roof slab.
for (const c of F.values()) {
  const { x, z } = c;
  if (T(x, z) !== 12 || (x % 7 !== 4) || (z % 7 !== 4)) continue;
  const cell = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (cell.every(([a, b]) => inF(a, b) && T(a, b) === 12 && exposure(a, b).length === 0)) {
    for (const [a, b] of cell) put(a, 12, b, "smooth_stone");
  }
}

// Warm light: glowstone on the storey-2 and storey-3 sills, just inside a few window bays.
for (const c of F.values()) {
  const { x, z } = c, t = T(x, z);
  const exposed = exposure(x, z);
  if (exposed.length === 0 || exposed.some((d) => d.dx !== 0) && exposed.some((d) => d.dz !== 0)) continue;
  const face = exposed.find((d) => !inF(x + d.dx, z + d.dz)) ?? exposed[0];
  const bay = face.dz !== 0 ? x : z;
  if (bay % 3 === 0) continue;
  for (const y of [5, 9]) {
    if (y >= t || ((bay * 3 + z + y) % 4 !== 0)) continue;
    const xi = x - face.dx, zi = z - face.dz;
    if (!inF(xi, zi) || exposure(xi, zi).length > 0 || T(xi, zi) <= y) continue;
    put(xi, y, zi, "glowstone", null, "lamp");
  }
}

// Panes join the glass and the piers around them, so the window grid reads as a grid, not as posts.
const connects = (x, y, z) => { const p = plan.get(`${x},${y},${z}`); return !!p && (p.kind === "pane" || p.kind === "full"); };
for (const [k, p] of plan) {
  if (p.kind !== "pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  p.state = {
    north: String(connects(x, y, z - 1)), south: String(connects(x, y, z + 1)),
    east: String(connects(x + 1, y, z)), west: String(connects(x - 1, y, z)), waterlogged: "false",
  };
}

const g = new Voxels(SIZE);
for (const [k, p] of plan) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, p.block, p.state ?? undefined); }
const info = g.save(OUT);
const tiers = {};
for (const c of F.values()) tiers[T(c.x, c.z)] = (tiers[T(c.x, c.z)] ?? 0) + 1;
console.log(JSON.stringify({ cells: F.size, tiers, ...info }));
