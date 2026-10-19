// 15 West 51st Street, the Time Warner Building: a 1947 postwar Midtown office block (NYC individual landmark). Read from
// the lidar as four clean tiers, not cell by cell: a 9-block (three-storey) base, a 36-block (twelve-storey) block, a
// 72-block (24-storey) shoulder and a 117-block (39-storey) shaft with a mechanical penthouse. Plant sits on the lower
// roofs. Walls are pale limestone piers between steel-framed glass bays, grey spandrels at every floor line and a smooth
// cornice at each roof edge. The ground storey is a shopfront with a granite base course and a canopied entrance on the
// north frontage. Glass bays have a one-block air gap behind them, a floor slab per storey and no interiors; a few bays
// have glowstone in the gap. Open court cells are paved at ground level.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034512.cells.json`, "utf8"));
const X = 75, Y = 130, Z = 54;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const ground = (x, z) => cell.get(`${x},${z}`).ground;

// Lidar roof height -> clean tier (block top). 0 = open court, paved at ground level.
const tierOf = (roof) => (roof <= 1 ? 0 : roof <= 5 ? 3 : roof <= 10 ? 9 : roof <= 20 ? 12 : roof <= 30 ? 24 : roof <= 50 ? 36 : roof <= 90 ? 72 : 117);
// The lidar spurs: a column at tier 24 or more with at most one neighbour at its level or higher is a stray lidar
// column on a one-block ledge. It drops to its tallest neighbour, so every tier stands on the tier beside it.
const TIER = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, tierOf(roof)]));
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];
for (let pass = 0; pass < 2; pass++) {
  const next = new Map(TIER);
  for (const [k, t] of TIER) {
    if (t < 24) continue;
    const [x, z] = k.split(",").map(Number);
    const nbs = NB.map(([dx, dz]) => TIER.get(`${x + dx},${z + dz}`) ?? 0);
    if (nbs.filter((n) => n >= t).length <= 1) next.set(k, Math.max(...nbs));
  }
  TIER.clear(); for (const [k, t] of next) TIER.set(k, t);
}
const top = (x, z) => TIER.get(`${x},${z}`) ?? 0;

const BLOCK = {
  foundation: "polished_granite", base: "polished_granite", stone: "calcite", spandrel: "light_gray_concrete",
  glass: "cyan_stained_glass", cornice: "smooth_quartz", roof: "gray_concrete", paving: "smooth_stone",
  core: "polished_andesite", slab: "light_gray_concrete", plant: "light_gray_concrete", plantCap: "smooth_quartz",
};
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // N = low z (the north frontage)
const key = (x, y, z) => `${x},${y},${z}`;

// A wall at height y faces neighbour (dx, dz) when that neighbour is outside the footprint or stands lower there.
// A neighbour's foundation below y counts as the wall, so it is not a face.
const exposed = (x, y, z, dx, dz) => {
  const nx = x + dx, nz = z + dz;
  if (!inFoot(nx, nz)) return true;
  if (y < ground(nx, nz)) return false;
  return y >= top(nx, nz);
};
const faceOf = (x, y, z) => Object.keys(DIRS).find((d) => exposed(x, y, z, ...DIRS[d])) ?? null;

// Facade: cornice at the roof edge, granite base course, shopfront glass with granite piers in the ground storey, grey
// spandrels at each floor line, then glass bays between limestone piers every third block.
const facade = (x, y, z, d, t) => {
  const u = d === "N" || d === "S" ? x : z;
  if (y === t - 1) return BLOCK.cornice;
  if (y === 0) return BLOCK.base;
  if (y < 3) return u % 3 === 0 ? BLOCK.base : BLOCK.glass;
  if (y % 3 === 0) return BLOCK.spandrel;
  return u % 3 === 0 ? BLOCK.stone : BLOCK.glass;
};

// Pass A: the outward walls of every building cell.
const FACE = new Map();
for (const [x, z, gn, roof] of cells) {
  const t = top(x, z);
  if (!t) continue;
  for (let y = gn; y < t; y++) {
    const d = faceOf(x, y, z);
    if (d) FACE.set(key(x, y, z), { d, block: facade(x, y, z, d, t) });
  }
}

// Pass B: the air gap behind each glass bay. Some gaps hold glowstone (warm light), chosen deterministically.
const BEHIND = new Map();
for (const [k, { d, block }] of FACE) {
  if (block !== BLOCK.glass) continue;
  const [x, y, z] = k.split(",").map(Number);
  const [dx, dz] = DIRS[d];
  const ix = x - dx, iz = z - dz;
  if (!inFoot(ix, iz) || FACE.has(key(ix, y, iz))) continue;
  if (y < ground(ix, iz) || y >= top(ix, iz) - 1) continue;
  const u = d === "N" || d === "S" ? x : z;
  const lit = y % 3 === 1 && (u * 5 + y * 7 + (d === "N" || d === "S" ? z : x) * 3) % 11 === 0;
  BEHIND.set(key(ix, y, iz), lit ? "glowstone" : null);
}

const g = new Voxels([X, Y, Z]);

// Pass C: solid foundations, paved courts, walls, and the interior: a roof covering, a floor slab per storey, the air gap
// behind glass, and a solid core everywhere else.
for (const [x, z, gn, roof] of cells) {
  for (let y = 0; y < gn; y++) g.set(x, y, z, BLOCK.foundation);
  const t = top(x, z);
  if (!t) { g.set(x, gn, z, BLOCK.paving); continue; }
  for (let y = gn; y < t; y++) {
    const k = key(x, y, z);
    if (FACE.has(k)) { g.set(x, y, z, FACE.get(k).block); continue; }
    if (y === t - 1) { g.set(x, y, z, BLOCK.roof); continue; }
    if (y % 3 === 0) { g.set(x, y, z, BLOCK.slab); continue; }
    if (BEHIND.has(k)) { const lit = BEHIND.get(k); if (lit) g.set(x, y, z, lit); continue; }
    g.set(x, y, z, BLOCK.core);
  }
}

// Roof plant on the lower roofs: a small two-block box on a few interior roof cells.
for (const [x, z, , roof] of cells) {
  const t = top(x, z);
  if ((t !== 36 && t !== 72) || FACE.has(key(x, t - 1, z))) continue;
  if (x % 7 !== 3 || z % 7 !== 3) continue;
  g.set(x, t, z, BLOCK.plant); g.set(x, t + 1, z, BLOCK.plantCap);
}

// The mechanical penthouse on the shaft: a 13 x 9 room, one storey, a glass band with an air gap and a roof cornice.
const shaft = cells.filter(([x, z, , roof]) => top(x, z) === 117).map(([x, z]) => [x, z]);
const xs = shaft.map(([x]) => x), zs = shaft.map(([, z]) => z);
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2), cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
for (let x = cx - 6; x <= cx + 6; x++) for (let z = cz - 4; z <= cz + 4; z++) {
  if (top(x, z) !== 117) continue;
  const edge = Math.abs(x - cx) === 6 || Math.abs(z - cz) === 4;
  g.set(x, 117, z, BLOCK.slab);
  if (edge) {
    g.set(x, 117, z, BLOCK.stone);
    g.set(x, 118, z, (x - cx) % 3 === 0 || (z - cz) % 3 === 0 ? BLOCK.stone : BLOCK.glass);
    g.set(x, 119, z, BLOCK.cornice);
  } else {
    g.set(x, 119, z, BLOCK.cornice);
  }
}

// The entrance: the longest run of base-tier cells on the north frontage. Glass vestibule flanks, granite piers,
// a dark oak door in the wall with an air vestibule behind, and a canopy over the door.
let best = { len: 0, start: 0 }, run = 0;
for (let x = 0; x <= X; x++) {
  const ok = x < X && inFoot(x, 0) && top(x, 0) === 9 && inFoot(x, 1) && top(x, 1) >= 9;
  if (ok) { run++; if (run > best.len) best = { len: run, start: x - run + 1 }; } else run = 0;
}
const e = best.start + Math.floor(best.len / 2);
const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(e - 2, 1, 0, BLOCK.base); g.set(e - 2, 2, 0, BLOCK.base);
g.set(e + 2, 1, 0, BLOCK.base); g.set(e + 2, 2, 0, BLOCK.base);
for (const dx of [-1, 1]) {
  g.set(e + dx, 1, 0, BLOCK.glass); g.set(e + dx, 2, 0, BLOCK.glass);
  g.set(e + dx, 1, 1, BLOCK.base); g.set(e + dx, 2, 1, BLOCK.base);   // canopy posts
}
g.set(e, 1, 0, "dark_oak_door", { ...door, half: "lower" });
g.set(e, 2, 0, "dark_oak_door", { ...door, half: "upper" });
g.set(e, 1, 1, "air"); g.set(e, 2, 1, "air");
for (let dx = -1; dx <= 1; dx++) for (let z = 0; z <= 1; z++) g.set(e + dx, 3, z, "smooth_stone");

console.log({ entrance: [e, 0], shaft: { cx, cz }, blocks: g.count(), palette: g.palette.length, glowing: [...BEHIND.values()].filter(Boolean).length });
g.save(`${DIR}/NYC1034512.nbt`);
