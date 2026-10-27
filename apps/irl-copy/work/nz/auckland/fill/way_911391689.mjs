// Way 911391689, Mt Eden / Newton edge: a 1930s stripped-classical brick block (red brick, painted-stone bands and
// cornice, dark-oak shopfront fascia) on a falling site (ground 6 on the uphill west, 0 on the downhill east).
// The lidar roof is ~12 blocks (3 storeys) over most of the footprint, 16 (4 storeys) along the east strip, 8 at the
// west wings. The 71-block spikes sit on one-cell lines along the footprint edge: a neighbour's wall in the DSM, not
// this building's mass, so they are dropped and refilled from the cells around before the massing is read.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_911391689.cells.json`, "utf8"));
const X = 33, Y = 84, Z = 34;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// F[z][x] = { g: ground, r: lidar roof above y 0 }
const F = Array.from({ length: Z }, () => Array(X).fill(null));
for (const [x, z, g, r] of cells) F[z][x] = { g, r };
const inF = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && F[z][x] !== null;
const bnd = (x, z) => NB.some(([dx, dz]) => !inF(x + dx, z + dz));       // a facade cell: some side is outside the footprint
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const eachCell = (fn) => { for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (F[z][x]) fn(x, z); };

// 1. roof: spikes over 20 are dropped, then refilled from the valid cells around them
let S = F.map((row) => row.map((c) => (c && c.r <= 20 ? c.r : null)));
const around = (x, z, A) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, zz = z + dz; if (inF(xx, zz) && A[zz][xx] !== null) v.push(A[zz][xx]);
  }
  return v.length ? median(v) : null;
};
for (let pass = 0; pass < 60; pass++) {
  let open = false; const next = S.map((r) => r.slice());
  eachCell((x, z) => { if (S[z][x] === null) { const v = around(x, z, S); if (v === null) open = true; else next[z][x] = v; } });
  S = next; if (!open) break;
}
// 2. flat tiers: the 3x3 median of the cleaned roof, rounded to a 4-block storey, never below ground + 2 and never
// above 4 storeys (the 20-block strip on the southwest tip is a 1-2 cell sliver that reads as stray fins)
const TOP = Array.from({ length: Z }, () => Array(X).fill(0));
eachCell((x, z) => {
  const v = []; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) v.push(S[z + dz][x + dx]);
  const g = F[z][x].g;
  TOP[z][x] = Math.min(16, Math.max(4 * Math.round(median(v) / 4), 4 * Math.ceil((g + 2) / 4)));
});

// Materials
const FOUND = "stone_bricks", BASE = "stone_bricks", FLOOR = "smooth_stone", BAND = "smooth_quartz", WALL = "bricks";
const GLASS = "glass_pane", FASCIA = "dark_oak_planks", CORNICE = "smooth_quartz", PARAPET = "bricks", COPING = "smooth_quartz_slab";
const DECK = "smooth_stone", CANOPY = "dark_oak_slab";

const g = new Voxels([X, Y, Z]);
const isWin = (x, z) => (x + z) % 4 !== 0;                               // piers every 4th cell, glass between
const outward = (x, z) => (!inF(x + 1, z) ? "east" : !inF(x - 1, z) ? "west" : !inF(x, z + 1) ? "south" : "north");

// 3. the massing: foundation to ground, then storeys of 4 blocks to each cell's tier
const shop = (x, z) => bnd(x, z) && F[z][x].g <= 1;                      // ground-floor frontage on the downhill side
eachCell((x, z) => {
  const { g: G } = F[z][x], T = TOP[z][x], edge = bnd(x, z);
  let lowT = null;                                                       // a lower neighbour tier: this cell's face above it is a wall
  for (const [dx, dz] of NB) if (inF(x + dx, z + dz)) { const t = TOP[z + dz][x + dx]; if (t < T) lowT = lowT === null ? t : Math.min(lowT, t); }
  for (let y = 0; y < G; y++) g.set(x, y, z, FOUND);
  for (let y = G; y < T; y++) {
    if (y % 4 === 0) { g.set(x, y, z, edge ? (y === 0 ? BASE : BAND) : FLOOR); continue; }
    if (!edge && (lowT === null || y < lowT)) continue;                   // interior: air behind the floor slabs
    if (!edge) { g.set(x, y, z, WALL); continue; }                        // a tier's step face: solid brick
    if (y === T - 1) { g.set(x, y, z, CORNICE); continue; }
    if (shop(x, z) && y < 3) { if (isWin(x, z)) g.set(x, y, z, GLASS); else g.set(x, y, z, WALL); continue; }
    if (shop(x, z) && y === 3) { g.set(x, y, z, FASCIA); continue; }
    if ((y % 4 === 1 || y % 4 === 2) && isWin(x, z)) g.set(x, y, z, GLASS);
    else g.set(x, y, z, WALL);
  }
  g.set(x, T, z, DECK);                                                  // the roof deck (or the next storey's floor under a tier)
  if (edge) { g.set(x, T + 1, z, PARAPET); g.set(x, T + 2, z, COPING, { type: "bottom", waterlogged: "false" }); }
});

// 4. entrance: one dark-oak door in a pier on the downhill frontage, a shelf above it
const door = [];
eachCell((x, z) => { if (bnd(x, z) && F[z][x].g === 0 && (x + z) % 4 === 0 && TOP[z][x] >= 12) door.push([x, z]); });
door.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
if (door.length) {
  const [dx0, dz0] = door[Math.floor(door.length / 2)], face = outward(dx0, dz0);
  g.set(dx0, 1, dz0, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx0, 2, dz0, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  const along = face === "east" || face === "west" ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
  g.set(dx0, 4, dz0, CANOPY, { type: "bottom", waterlogged: "false" });
  for (const [ax, az] of along) if (bnd(dx0 + ax, dz0 + az) && inF(dx0 + ax, dz0 + az)) g.set(dx0 + ax, 4, dz0 + az, CANOPY, { type: "bottom", waterlogged: "false" });
}

// 5. warm light: glowstone and shroomlight in the air behind some upper-storey glass
eachCell((x, z) => {
  if (!bnd(x, z) || shop(x, z)) return;
  const G = F[z][x].g, T = TOP[z][x];
  for (let k = 1; 4 * k + 1 < T; k++) {
    const y = 4 * k + 1; if (y < G || !isWin(x, z)) continue;
    const inward = NB.map(([dx, dz]) => [x + dx, z + dz]).find(([xx, zz]) => inF(xx, zz) && !bnd(xx, zz));
    if (!inward) continue;
    const [ix, iz] = inward; if (g.val(ix, y, iz) !== 0) continue;
    if ((x * 5 + z * 3 + k * 7) % 10 === 0) g.set(ix, y, iz, "glowstone");
    else if ((x + 2 * z + k) % 17 === 0) g.set(ix, y, iz, "shroomlight");
  }
});

// 6. roof equipment: a solid lift-and-stair core, 3 blocks high, on the 12-block deck, near the middle
const cx0 = 16, cz0 = 17; let core = null, best = Infinity;
for (let z = 1; z < Z - 1; z++) for (let x = 1; x < X - 1; x++) {
  const ok = [-1, 0, 1].every((dz) => [-1, 0, 1].every((dx) => inF(x + dx, z + dz) && !bnd(x + dx, z + dz) && TOP[z + dz][x + dx] === 12));
  if (!ok) continue;
  const d = Math.hypot(x - cx0, z - cz0); if (d < best) { best = d; core = [x, z]; }
}
if (core) {
  const [kx, kz] = core;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    g.set(kx + dx, 13, kz + dz, WALL); g.set(kx + dx, 14, kz + dz, WALL); g.set(kx + dx, 15, kz + dz, CORNICE);
  }
}

g.save(`${DIR}/way_911391689.nbt`);
const tiers = {}; eachCell((x, z) => { tiers[TOP[z][x]] = (tiers[TOP[z][x]] || 0) + 1; });
console.log("cells", cells.length, "blocks", g.count(), "palette", g.palette.length, "tiers", JSON.stringify(tiers), "core", core, "door", door.length ? "yes" : "no");
