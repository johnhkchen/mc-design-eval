// Dynasty Gardens: a 1990s-2000s mid-rise apartment block, eleven storeys over a stone plinth, the kind of concrete-frame
// block with cream plaster and tinted glazing that went up around Eden Terrace and Newton in that period. Decided from
// the record: a 34 x 39 footprint, the lidar roof about 47 blocks over most of the plan (about 40 m), with the lidar's
// edge noise smoothed by a 3x3 median and snapped to 4-block storey lines. Storeys are 4 blocks: a light-concrete floor
// band, three rows of glazing between white piers, and a parapet with a cornice on the roof. The plinth is solid stone
// (foundation to the cell's ground, then to a base course at y 3); the entrance is a recessed lobby cut into the
// plinth on the south face, with a glass shopfront either side of the door and the storey-one slab as its canopy. A
// lift core stands on the roof with a lantern on top. Warm light shows in about one window in five, a glowstone set
// one block behind the glass. Nothing hangs: every column runs from its own ground up, and each storey's slab sits on
// the storey below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162320044.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162320044.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([34, 60, 39]);

const PLINTH = "stone_bricks";
const BASE = "polished_andesite";      // base course, the top of the plinth
const SLAB = "light_gray_concrete";    // floor bands, storey lines, the roof deck, cornice
const WALL = "white_concrete";         // piers, parapet, lift core
const GLASS = "light_blue_stained_glass";
const LIGHT = "glowstone";
const DOOR = "dark_oak_door";

// deterministic pseudo-random in [0, 1) so the same build repeats
const H = (a, b, c) => {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, ground, roof] of cells) raw.set(key(x, z), { g: ground, r: roof });
const inF = (x, z) => raw.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outDirs = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const ring = (x, z) => outDirs(x, z).length > 0;

// roof tier per column: the 5x5 median of the lidar roof (the stepped edge noise out), snapped to a storey line and
// held at 40 or higher, so the parapet runs as two clean tiers (44 and 48) instead of a ragged sawtooth
const top = new Map();
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = raw.get(key(x + dx, z + dz)); if (n) near.push(n.r); }
  near.sort((a, b) => a - b);
  top.set(k, Math.max(40, 4 * Math.round(near[(near.length - 1) >> 1] / 4)));
}
const T = (x, z) => top.get(key(x, z));

// the entrance: the south-facing ring cell furthest toward +z, nearest the middle of the plan
const cx = 16.5;
let entrance = null;
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  if (!outDirs(x, z).some(([dx, dz]) => dx === 0 && dz === 1)) continue;
  if (!entrance || z > entrance[1] || (z === entrance[1] && Math.abs(x - cx) < Math.abs(entrance[0] - cx))) entrance = [x, z];
}
const lobby = new Set();          // cells cut out of the plinth for the lobby (y 0..3)
const shop = new Set();           // ground-floor glass beside the door, at y 0..1
if (entrance) {
  const [ex, ez] = entrance;
  for (const dx of [-1, 0, 1]) {
    if (inF(ex + dx, ez)) { if (dx) shop.add(key(ex + dx, ez)); }
    if (inF(ex + dx, ez - 1)) lobby.add(key(ex + dx, ez - 1));
  }
  lobby.add(key(ex, ez));
}

// --- plinth: solid stone from y 0 to the storey-one floor (4), so every column stands on its own ground -----------
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < 4; y++) {
    if (lobby.has(k)) continue;
    if (y === 3) { g.set(x, y, z, ring(x, z) ? BASE : PLINTH); continue; }
    g.set(x, y, z, PLINTH);
  }
}

// the shopfront glass beside the door (its lintel above is the plinth course at y 2)
for (const k of shop) { const [x, z] = k.split(",").map(Number); g.set(x, 0, z, GLASS); g.set(x, 1, z, GLASS); }

// the lobby: a door at the entrance cell, and a lintel of stone above it
if (entrance) {
  const [ex, ez] = entrance;
  g.set(ex, 0, ez, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, 1, ez, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(ex, 2, ez, PLINTH);
  g.set(ex, 3, ez, BASE);
  for (const dx of [-1, 1]) if (inF(ex + dx, ez)) { g.set(ex + dx, 2, ez, PLINTH); g.set(ex + dx, 3, ez, BASE); }
}

// --- floors: one slab per storey line across the whole plan (the band is the storey line; it is the floor below) ---
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  for (let s = 4; s <= T(x, z); s += 4) g.set(x, s, z, SLAB);
}

// --- facade: piers and glazing on the outer ring, storey by storey -------------------------------------------------
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  if (!ring(x, z)) continue;
  const od = outDirs(x, z);
  const faceZ = od.some(([, dz]) => dz !== 0), faceX = od.some(([dx]) => dx !== 0);
  const [ox, oz] = od[0];
  const top_ = T(x, z);
  for (let s = 4; s < top_; s += 4) {
    const storey = s / 4;                       // 1 = the ground storey
    const pier = (faceZ && faceX) || (faceZ && x % 3 === 0) || (faceX && !faceZ && z % 3 === 0);
    for (let y = s + 1; y <= s + 3; y++) {
      if (storey === 1) {                       // shopfront: glass with the plinth's piers
        if (pier) g.set(x, y, z, BASE); else g.set(x, y, z, GLASS);
      } else if (pier) {
        g.set(x, y, z, WALL);
      } else {
        g.set(x, y, z, GLASS);
        // warm light behind about one window in five, one block in from the glass, not on the lobby
        if (H(x, s, z) < 0.2 && y === s + 2) {
          const ix = x - ox, iz = z - oz;
          if (inF(ix, iz) && !ring(ix, iz)) g.set(ix, y, iz, LIGHT);
        }
      }
    }
  }
  // parapet: a cornice band and a white coping on the roof edge
  g.set(x, top_ + 1, z, SLAB);
  g.set(x, top_ + 2, z, WALL);
}

// --- roof: a lift core in the middle of the roof, with a lantern on top -----------------------------------------------
const roofCells = [...raw.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => T(x, z) >= 48);
if (roofCells.length) {
  const mx = Math.round(roofCells.reduce((a, [x]) => a + x, 0) / roofCells.length);
  const mz = Math.round(roofCells.reduce((a, [, z]) => a + z, 0) / roofCells.length);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = mx + dx, z = mz + dz;
    if (!inF(x, z) || T(x, z) < 48) continue;
    for (let y = 49; y <= 51; y++) g.set(x, y, z, WALL);
    if (dx === 0 && dz === 0) g.set(x, 52, z, "lantern", { hanging: "false" });
  }
}

const info = g.save(OUT);
console.log(`saved ${OUT}: ${info.blocks} blocks, palette ${info.palette}, entrance ${entrance}, roof tiers ${[...new Set([...top.values()])].sort((a, b) => a - b)}`);
