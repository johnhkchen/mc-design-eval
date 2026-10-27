// 99 Queen Street as a late-1970s concrete-framed office tower on a stone plinth, the Queen Street kind: a shopfront storey
// under a fascia, a four-block storey rhythm of blue glass between white concrete piers, and a stepped crown (a podium,
// then setbacks) up to a roof about 60 blocks above the lowest ground, with a plant box. The lidar's noisy roofs snap to
// flat tiers (12, 24, 44, 48, 52, 60), and each tier sits inside the one below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861509.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([45, 72, 34]);

const k = (x, z) => `${x},${z}`;
const xz = (c) => c.split(",").map(Number);
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const nbrs = (c) => { const [x, z] = xz(c); return Object.values(DIRS).map(([dx, dz]) => k(x + dx, z + dz)); };
const outward = (s, c) => { const [x, z] = xz(c); return Object.keys(DIRS).filter((d) => !s.has(k(x + DIRS[d][0], z + DIRS[d][1]))); };
const both = (a, b) => new Set([...a].filter((c) => b.has(c)));
const erode = (s, d) => { let t = s; for (let i = 0; i < d; i++) t = new Set([...t].filter((c) => nbrs(c).every((n) => t.has(n)))); return t; };

const ground = new Map(cells.map(([x, z, gr]) => [k(x, z), gr]));
const F = new Set(ground.keys());                                                   // the footprint
const snap = (r) => (r < 14 ? 12 : r < 40 ? 24 : r < 46 ? 44 : r < 50 ? 48 : r < 56 ? 52 : 60);
const H = new Map(cells.map(([x, z, , r]) => [k(x, z), snap(r)]));
const atLeast = (h) => new Set([...F].filter((c) => H.get(c) >= h));

// Tiers, each inside the one below: the podium covers the taller part of the footprint, then the tower steps in.
const sets = [F, atLeast(24)];
sets.push(both(erode(atLeast(44), 1), sets[1]));
sets.push(both(erode(atLeast(48), 2), sets[2]));
sets.push(both(erode(atLeast(52), 2), sets[3]));
sets.push(both(erode(atLeast(60), 2), sets[4]));
const LEVELS = [[8, 12], [12, 24], [24, 44], [44, 48], [48, 52], [52, 60]];   // storey lines every 4 from y 8
const TIERS = sets.map((s, i) => ({ s, lo: LEVELS[i][0], hi: LEVELS[i][1] }));

const PIER = "white_concrete", GLASS = "light_blue_stained_glass_pane", SHOP = "glass_pane";
const CORNICE = "stone_bricks", ROOF = "light_gray_concrete", BAND = "light_gray_concrete", HEAD = "white_concrete";
const pier = (out, x, z) => out.length > 1 || (out[0] === "N" || out[0] === "S" ? x % 3 === 0 : z % 3 === 0);
const pane = (out) => {   // a pane joins its neighbours along the face it sits on
  const ns = out[0] === "N" || out[0] === "S";
  return { north: String(!ns), south: String(!ns), east: String(ns), west: String(ns), waterlogged: "false" };
};

// Ground storey: a foundation from y 0 up to each cell's ground, a floor on it, and on the street front a plinth,
// a shopfront of glass and stone piers, and a fascia under the first slab.
for (const [key, gr] of ground) {
  const [x, z] = xz(key), out = outward(F, key);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (!out.length) { g.set(x, gr, z, "polished_andesite"); continue; }
  g.set(x, gr, z, "stone_bricks");
  g.set(x, 7, z, "polished_andesite");
  for (let y = gr + 1; y < 7; y++) {
    if (pier(out, x, z)) g.set(x, y, z, "stone_bricks");
    else g.set(x, y, z, SHOP, pane(out));
  }
}

// Storeys above: a slab on each storey line, two rows of glass (or piers) and a head band. Interiors are air behind the glass.
for (const { s, lo, hi } of TIERS) {
  for (const key of s) {
    const [x, z] = xz(key), out = outward(s, key);
    for (let y = lo; y < hi; y++) {
      if (y === hi - 1) { g.set(x, y, z, out.length ? CORNICE : ROOF); continue; }   // cornice or roof deck
      if (y === lo) { g.set(x, y, z, BAND); continue; }                               // floor slab (spandrel on the face)
      if (!out.length) continue;
      if (y % 4 === 3) { g.set(x, y, z, HEAD); continue; }
      if (pier(out, x, z)) g.set(x, y, z, PIER);
      else g.set(x, y, z, GLASS, pane(out));
    }
  }
}

// Parapets: the exposed edge of every tier that has no tier above it.
for (let i = 0; i < TIERS.length; i++) {
  const { s, hi } = TIERS[i], above = TIERS[i + 1]?.s ?? new Set();
  for (const key of s) if (!above.has(key) && outward(s, key).length) { const [x, z] = xz(key); g.set(x, hi, z, CORNICE); }
}

// Entrance on the north face near the middle: a dark oak door in the shopfront, stone piers either side and a lintel canopy.
const door = [...F].map(xz).filter(([x, z]) =>
  [[x, z], [x - 1, z], [x + 1, z]].every(([a, b]) => F.has(k(a, b)) && outward(F, k(a, b)).includes("N")))
  .sort((a, b) => Math.abs(a[0] - 22) - Math.abs(b[0] - 22))[0];
if (door) {
  const [xd, zd] = door, gd = ground.get(k(xd, zd));
  for (const dx of [-1, 1]) for (let y = gd + 1; y <= gd + 3; y++) g.set(xd + dx, y, zd, "stone_bricks");
  g.set(xd, gd + 1, zd, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(xd, gd + 2, zd, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let dx = -1; dx <= 1; dx++) g.set(xd + dx, gd + 3, zd, "polished_andesite");
}

// Warm lights: a lantern on the floor behind some glazed bays, upstairs and in the shopfront.
for (const { s, lo } of TIERS) for (const key of s) {
  const [x, z] = xz(key), out = outward(s, key);
  if (!out.length || pier(out, x, z)) continue;
  const [dx, dz] = DIRS[out[0]], ix = x - dx, iz = z - dz;
  if (!s.has(k(ix, iz)) || outward(s, k(ix, iz)).length || (x * 7 + z * 3 + lo) % 5 !== 0) continue;
  g.set(ix, lo + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}
for (const key of F) {
  const [x, z] = xz(key), out = outward(F, key);
  if (!out.length || pier(out, x, z) || (x * 7 + z * 3) % 4 !== 0) continue;
  const [dx, dz] = DIRS[out[0]], ix = x - dx, iz = z - dz, ik = k(ix, iz);
  if (!F.has(ik) || outward(F, ik).length) continue;
  g.set(ix, ground.get(ik) + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant: a 3 x 3 plant box with a vent on the top roof, and another on the podium terrace.
const plant = (region, margin, y0, h, wall, vent) => {
  const ok = (x, z, m) => { for (let dx = -m; dx <= m; dx++) for (let dz = -m; dz <= m; dz++) if (!region.has(k(x + dx, z + dz))) return false; return true; };
  const cand = [...region].map(xz);
  const spot = cand.find(([x, z]) => ok(x, z, margin)) ?? cand.find(([x, z]) => ok(x, z, 1));
  if (!spot) return;
  const [cx, cz] = spot;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = y0; y < y0 + h; y++) g.set(cx + dx, y, cz + dz, wall);
  g.set(cx, y0 + h, cz, vent);
};
plant(TIERS[5].s, 2, 60, 2, ROOF, "iron_block");
plant(new Set([...sets[1]].filter((c) => !sets[2].has(c))), 1, 24, 2, ROOF, "iron_block");

// Nothing floats: every block above y 0 stands on a block below it, or a floor slab's neighbour carries it.
const hanging = [];
for (let y = 1; y < 72; y++) for (let z = 0; z < 34; z++) for (let x = 0; x < 45; x++) {
  if (!g.get(x, y, z) || g.get(x, y - 1, z)) continue;
  if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz))) continue;
  hanging.push([x, y, z]);
}
console.log(JSON.stringify({ blocks: g.count(), hanging: hanging.length, sample: hanging.slice(0, 8), tiers: TIERS.map((t) => [t.lo, t.hi, t.s.size]) }));
g.save(`${DIR}/way_292861509.nbt`);
