// New York Palace, 455 Madison Avenue (NYC individual landmark; commercial and office; built 1980). A 1980 tower
// (about 50 storeys, roof 150-152 blocks = about 170 m) rises from the middle of the lot over a glazed one-storey plinth
// and two landmark-era masonry wings: the 1880s palazzo's brownstone-red walls (24 blocks, eight storeys, and 30 blocks on
// the east frontage), with the courtyard-era cornices and piers. Tower: bronze-grey glass in a grid of mullions with light
// grey spandrels, one storey = 3 blocks, a crown setback at 152 with a mechanical box and a spire. The palazzo wings have
// a recessed double-door entrance on the west (Madison-side) frontage under a stone lintel, hanging lanterns, pilasters,
// shopfront glass on the ground storey, and a cut-stone parapet. Facades are real construction: the skin is glass panes
// set in piers, one air block behind each pane (a recess), warm glowstone behind some panes, and a solid floor slab at
// every storey line; no interiors. Lidar tiers are smoothed into flat massing (majority by group in a 5 x 5 window) so
// the tiers stand on solid columns, nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035462.cells.json`, "utf8"));
const X = 55, Y = 164, Z = 54;

const raw = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const foot = (x, z) => raw.has(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Lidar group per cell: 0 open court (roof 0), 1 plinth (roof 1-5), 2 palazzo wing (21-33), 3 tower (134-152).
const groupOf = (r) => (r === 0 ? 0 : r <= 5 ? 1 : r <= 33 ? 2 : 3);

// Majority vote of val(x, z) over a (2R+1)^2 window of footprint cells; the cell's own value wins ties.
const majority = (x, z, R, val) => {
  const n = new Map();
  for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
    if (!foot(x + dx, z + dz)) continue;
    const v = val(x + dx, z + dz); n.set(v, (n.get(v) || 0) + 1);
  }
  const own = val(x, z); let best = own, bn = n.get(own) || 0;
  for (const [v, c] of n) if (c > bn) { best = v; bn = c; }
  return best;
};

// Flat tiers. top = block height of the solid massing (absolute from y 0); storey lines fall on y % 3 == 0.
const tier = new Map();
for (const [k, { ground, roof }] of raw) {
  const [x, z] = k.split(",").map(Number);
  const grp = majority(x, z, 2, (a, b) => groupOf(raw.get(`${a},${b}`).roof));
  const at = (a, b) => raw.get(`${a},${b}`);
  const palazzoHigh = (a, b) => at(a, b).roof >= 29 ? 1 : 0;
  const towerCrown = (a, b) => at(a, b).roof >= 151 ? 1 : 0;
  const PAL = {
    core: "red_sandstone", spandrel: "smooth_red_sandstone", frame: "cut_red_sandstone", quoin: "chiseled_red_sandstone",
    parapet: "cut_red_sandstone", roof: "gray_concrete", glass: "glass_pane", lit: 4, parapetH: 2, base: "chiseled_red_sandstone",
    ground: "dark_oak_planks",
  };
  const PLINTH = {
    core: "stone", spandrel: "light_gray_concrete", frame: "gray_concrete", quoin: "light_gray_concrete",
    parapet: "stone_brick_slab", roof: "gray_concrete", glass: "gray_stained_glass_pane", lit: 3, parapetH: 1,
  };
  const TOWER = {
    core: "stone", spandrel: "light_gray_concrete", frame: "stone", quoin: "light_gray_concrete",
    parapet: "light_gray_concrete", roof: "gray_concrete", glass: "gray_stained_glass_pane", lit: 11, parapetH: 2,
  };
  if (grp === 0) { tier.set(k, { kind: "court", top: ground, g: ground, mats: null }); continue; }
  const g = Math.max(ground, 0);
  let kind, top, mats;
  if (grp === 1) { kind = "plinth"; top = 3; mats = PLINTH; }
  else if (grp === 2) { kind = "palazzo"; top = majority(x, z, 3, palazzoHigh) ? 30 : 24; mats = PAL; }
  else { kind = "tower"; top = majority(x, z, 3, towerCrown) ? 152 : 150; mats = TOWER; }
  tier.set(k, { kind, top: Math.max(top, g + 3), g, mats });
}
const topOf = (x, z) => (foot(x, z) ? tier.get(`${x},${z}`).top : 0);
const at = (x, z) => tier.get(`${x},${z}`);
const inS = (x, z, y) => foot(x, z) && y < topOf(x, z);

const g = new Voxels([X, Y, Z]);
const maxTop = Math.max(...[...tier.values()].map((t) => t.top));

// Storey anchoring: y % 3 == 0 is a floor line (spandrel), y % 3 == 1 and 2 are the window band.
// A window pane sits on the skin where u % 3 != 0 (u = the coordinate along that face); u % 3 == 0 is a pier.
const paneState = (nx) => (nx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });

for (let y = 0; y < maxTop; y++) {
  const S = [];
  for (const k of tier.keys()) { const [x, z] = k.split(",").map(Number); if (inS(x, z, y)) S.push([x, z]); }
  if (!S.length) continue;

  // Depth from the open air on this layer: 0 = skin, 1 = the block behind it, and so on.
  const D = new Map(), q = [];
  for (const [x, z] of S) {
    if (NB.some(([dx, dz]) => !inS(x + dx, z + dz, y))) { D.set(`${x},${z}`, 0); q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], d = D.get(`${x},${z}`);
    for (const [dx, dz] of NB) {
      const nx = x + dx, nz = z + dz, nk = `${nx},${nz}`;
      if (inS(nx, nz, y) && !D.has(nk)) { D.set(nk, d + 1); q.push([nx, nz]); }
    }
  }

  // Pass 1: each window pane on a skin cell leaves the block behind it as air (a recess), or a warm glowstone.
  const gap = new Map();
  for (const [x, z] of S) {
    const t = at(x, z);
    if (t.kind === "court" || D.get(`${x},${z}`) !== 0 || y < t.g || y % 3 === 0 || y < 1) continue;
    const outs = NB.filter(([dx, dz]) => !inS(x + dx, z + dz, y));
    if (outs.length !== 1) continue;
    const [nx, nz] = outs[0];
    const u = nx !== 0 ? z : x;
    if (u % 3 === 0) continue;
    const bx = x - nx, bz = z - nz;
    if (inS(bx, bz, y) && D.get(`${bx},${bz}`) === 1) {
      const lit = ((x * 31 + y * 17 + z * 13) % t.mats.lit) === 0;
      gap.set(`${bx},${bz}`, lit ? "glowstone" : null);
    }
  }

  // Pass 2: the block at each cell of this layer.
  for (const [x, z] of S) {
    const k = `${x},${z}`, t = at(x, z), d = D.get(k) ?? 99, top = t.top;
    if (t.kind === "court") { g.set(x, y, z, y === top - 1 ? "smooth_stone" : "stone_bricks"); continue; }
    if (y < t.g) { g.set(x, y, z, "stone_bricks"); continue; }
    const m = t.mats;
    if (gap.has(k)) { const b = gap.get(k); if (b) g.set(x, y, z, b); continue; }   // air unless lit
    const outs = NB.filter(([dx, dz]) => !inS(x + dx, z + dz, y));
    const corner = outs.length >= 2;
    if (d === 0 && y >= top - m.parapetH) { g.set(x, y, z, m.parapet); continue; }
    if (y === top - 1) { g.set(x, y, z, m.roof); continue; }
    if (d === 0) {
      if (corner || outs.length === 0) { g.set(x, y, z, m.quoin); continue; }
      const [nx, nz] = outs[0], u = nx !== 0 ? z : x, o = y % 3;
      if (t.kind === "palazzo" && y === 0) { g.set(x, y, z, m.base); continue; }
      if (o === 0) { g.set(x, y, z, m.spandrel); continue; }
      if (u % 3 === 0) { g.set(x, y, z, t.kind === "palazzo" && y < 3 ? m.ground : m.frame); continue; }
      g.set(x, y, z, m.glass, paneState(nx));
      continue;
    }
    if (d === 1 && y % 3 === 0) { g.set(x, y, z, m.spandrel); continue; }   // floor slab
    g.set(x, y, z, m.core);
  }
}

// Roof plant: chimney stacks on the palazzo roofs, mechanical boxes on the tower crown, a spire.
const interior = (x, z, dist) => {
  for (let dz = -dist; dz <= dist; dz++) for (let dx = -dist; dx <= dist; dx++) if (!foot(x + dx, z + dz)) return false;
  return true;
};
for (const [k, t] of tier) {
  const [x, z] = k.split(",").map(Number);
  if (t.kind === "palazzo" && x % 7 === 3 && z % 5 === 2 && interior(x, z, 1)) {
    for (let y = t.top; y < t.top + 3; y++) g.set(x, y, z, "bricks");
  }
  if (t.kind === "tower" && t.top === 152 && x % 6 === 1 && z % 6 === 1 && interior(x, z, 2)) {
    for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++) for (let y = 152; y < 154; y++) g.set(x + dx, y, z + dz, "light_gray_concrete");
  }
}
const crown = [...tier].filter(([, t]) => t.kind === "tower" && t.top === 152).map(([k]) => k.split(",").map(Number));
if (crown.length) {
  const cx = crown.reduce((s, [x]) => s + x, 0) / crown.length, cz = crown.reduce((s, [, z]) => s + z, 0) / crown.length;
  const [sx, sz] = crown.reduce((best, c) => (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best));
  for (let y = 152; y <= 158; y++) g.set(sx, y, sz, "iron_bars");
  g.set(sx, 159, sz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Entrance: a recessed double door on the west frontage (x 0, z 44..47, the palazzo's street face) under a stone lintel
// with hanging lanterns. The recess is three blocks tall and one block deep; the pilasters flank the doors.
const ZS = [44, 45, 46, 47];
const g0 = Math.max(...ZS.map((z) => at(0, z).g));
for (const z of ZS) for (let y = 0; y < g0; y++) g.set(0, y, z, "stone_bricks");
for (const z of ZS) for (let y = g0; y < g0 + 3; y++) g.set(0, y, z, "air");
for (const z of ZS) g.set(0, g0 + 3, z, "cut_red_sandstone");
for (const z of ZS) g.set(1, g0 + 2, z, "cut_red_sandstone");
for (const z of [44, 47]) for (let y = g0; y < g0 + 2; y++) g.set(1, y, z, "chiseled_red_sandstone");
for (const z of [44, 47]) g.set(0, g0 + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
for (const [z, hinge] of [[45, "left"], [46, "right"]]) {
  g.set(1, g0, z, "dark_oak_door", { facing: "east", half: "lower", hinge, open: "false", powered: "false" });
  g.set(1, g0 + 1, z, "dark_oak_door", { facing: "east", half: "upper", hinge, open: "false", powered: "false" });
}

const { blocks, palette } = g.save(`${DIR}/NYC1035462.nbt`);
console.log(`NYC1035462.nbt: ${blocks} blocks, ${palette} palette entries, size ${X} x ${Y} x ${Z}`);
