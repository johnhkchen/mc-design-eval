// 30 West 47th Street, 1957 commercial and office block: a stripped modern slab on a stone base, aluminium-framed
// tinted glass with pale spandrels, stepped down from a 16-storey west core to 2-storey podium cells at the south edge.
// Tiers are the lidar roof, median-filtered over 3x3 and snapped to six storey-multiple tiers, so every tier is flat.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${HERE}/NYC1034344.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 16, D = 26, H = 60;
const TIERS = [9, 21, 27, 36, 42, 48];                                             // 3, 7, 9, 12, 14, 16 storeys

const ground = new Map(), roofRaw = new Map();
for (const [x, z, g, r] of cells) { ground.set(`${x},${z}`, g); roofRaw.set(`${x},${z}`, r); }
const inFp = (x, z) => ground.has(`${x},${z}`);
const med = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) v.push(roofRaw.get(`${x + dx},${z + dz}`));
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const snap = (m) => TIERS.reduce((best, t) => (Math.abs(t - m) < Math.abs(best - m) ? t : best));
const tier = new Map();
for (const k of ground.keys()) { const [x, z] = k.split(",").map(Number); tier.set(k, snap(med(x, z))); }
const T = (x, z) => tier.get(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const ring = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
// A cell is facade if it is on the perimeter or stands taller than a neighbour (its exposed faces are a setback wall).
const setback = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => inFp(x + dx, z + dz) && T(x + dx, z + dz) < T(x, z));
const facade = (x, z) => ring(x, z) || setback(x, z);
const core = (x, z) => x >= 6 && x <= 9 && z >= 11 && z <= 14;

const STONE = "polished_andesite", FLOOR = "smooth_stone", SPANDREL = "light_gray_concrete", FRAME = "iron_block";
const GLASS = "light_blue_stained_glass", ROOF = "gray_concrete", MARQUEE = "black_concrete";
const door = (x, y, z, half) => ["iron_door", { facing: "south", half, hinge: x === 7 ? "left" : "right", open: "false", powered: "false" }];

const g = new Voxels([W, H, D]);
const lights = [];   // window top rows that may take a lantern behind them, checked once the massing is known

for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number), t = T(x, z), gr = G(x, z);
  if (facade(x, z)) {
    for (let y = 0; y < t; y++) {
      const kk = Math.floor(y / 3), r = y % 3, p = x + z;
      if (y < gr || y === 0) { g.set(x, y, z, STONE); continue; }            // foundation and base course
      if (y === t - 1) { g.set(x, y, z, STONE); continue; }                  // cornice / parapet
      if (y === 3 && z === D - 1 && x >= 6 && x <= 9) { g.set(x, y, z, MARQUEE); continue; }   // lobby canopy band
      if (kk === 0 && z === D - 1 && (x === 7 || x === 8)) {                 // lobby doors on the street front
        if (r === 1) g.set(x, y, z, ...door(x, y, z, "lower"));
        if (r === 2) g.set(x, y, z, ...door(x, y, z, "upper"));
        continue;
      }
      if (kk === 0 && z === D - 1 && x >= 6 && x <= 9 && r === 2) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      if (r === 0) { g.set(x, y, z, SPANDREL); continue; }                  // floor line
      const shop = kk === 0 && z === D - 1 && x >= 11 && x <= 14;           // shopfronts, no mullions
      if (shop) { g.set(x, y, z, "glass"); continue; }
      if (p % 3 === 0) g.set(x, y, z, FRAME); else g.set(x, y, z, GLASS);
      if (r === 2 && !shop && p % 3 !== 0 && (x * 7 + z * 3 + kk * 5) % 6 === 0) lights.push([x, y, z]);
    }
  } else {
    for (let y = 0; y < t; y++) {
      if (core(x, z)) { g.set(x, y, z, FLOOR); continue; }                   // lift and stair core, solid
      if (y === 0 || y % 3 === 0) { g.set(x, y, z, FLOOR); continue; }       // floor slab per storey
    }
    g.set(x, t - 1, z, ROOF);                                                // roof membrane
  }
  // One grouped plant room on the top tier's membrane (not scattered blocks): a 2 x 3 box with a vent on top.
  if (!facade(x, z) && t === 48 && x >= 10 && x <= 11 && z >= 10 && z <= 12) {
    g.set(x, t, z, SPANDREL);
    if (x === 10 && z === 11) g.set(x, t + 1, z, FRAME);
  }
}

// Warm light: a lantern hangs just inside the top row of a glass window, from the floor slab above it (no block floats).
for (const [x, y, z] of lights) {
  const dx = x === 0 ? 1 : x === W - 1 ? -1 : 0, dz = z === 0 ? 1 : z === D - 1 ? -1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!inFp(ix, iz) || facade(ix, iz) || core(ix, iz)) continue;
  if (y + 2 > T(ix, iz)) continue;                                          // the slab (or roof) at y+1 must be there
  g.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

const info = g.save(`${HERE}/NYC1034344.nbt`);
console.log(JSON.stringify(info));
