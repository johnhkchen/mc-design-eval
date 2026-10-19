// 45 West 54th Street, 1948 multi-family elevator building: a 12-storey brick apartment house in Midtown, the
// Multiple Dwelling Law type of the 1940s (flat roof, parapet, no setback tower). Footprint 21 x 21 (x across the
// front, low z = north = the 54th Street frontage, where the lidar is lowest and the street wall sits lower).
// Massing: the lidar roof is read as two flat tiers, 37 blocks (the main slab, about 12 storeys) and 28 blocks (the
// street-front wall and the two lower wings), a 3-block storey (band, then two rows of window). Lidar gaps (roof 0-3
// with built neighbours) are filled from their neighbours. Facade: red brick piers, smooth stone floor bands and a
// cornice, recessed window openings (glass one block in, an air gap behind, a floor band under each window), warm
// glow behind some panes. The entrance is in the north wall with a granite surround, a door and a canopy. Roof: a
// parapet and coping, a bulkhead and a water tower on steel legs. No interiors: the core is solid brick.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034787.cells.json`, "utf8"));
const X = 21, Y = 49, Z = 21;

const raw = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const key = (x, z) => `${x},${z}`;
const inFoot = (x, z) => raw.has(key(x, z));
const groundAt = (x, z) => raw.get(key(x, z)).ground;

// Lidar smoothing: a near-zero roof cell with at least four built neighbours is noise (dark tar, a missed return),
// so it takes their median; the rest of the near-zero cells stay open ground.
const lidarRoof = (x, z) => (inFoot(x, z) ? raw.get(key(x, z)).roof : 0);
const smoothRoof = new Map();
for (const [k, { roof }] of raw) {
  const [x, z] = k.split(",").map(Number);
  if (roof > 3) { smoothRoof.set(k, roof); continue; }
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dz) continue;
    const r = lidarRoof(x + dx, z + dz); if (r > 3) near.push(r);
  }
  if (near.length >= 4) { near.sort((a, b) => a - b); smoothRoof.set(k, near[near.length >> 1]); }
}

// Two flat tiers: 37 for the main slab, 28 for the street-front wall and the lower wings (nearest tier wins).
const TIERS = [28, 37];
const tierOf = (v) => (Math.abs(v - TIERS[0]) < Math.abs(v - TIERS[1]) ? TIERS[0] : TIERS[1]);
const top = new Map();
for (const [k, v] of smoothRoof) top.set(k, tierOf(v));
const topAt = (x, z) => (top.get(key(x, z)) ?? 0);
const built = (x, z) => topAt(x, z) > 0;
const solid = (x, y, z) => x >= 0 && z >= 0 && x < X && z < Z && built(x, z) && y < topAt(x, z);

const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const lit = (x, y, z) => (x * 7 + y * 5 + z * 3) % 13 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
const maxTop = Math.max(...top.values());

for (let y = 0; y < maxTop + 2; y++) {
  // Depth of each solid cell in this layer: 0 = on the outside, 1 = one in, 2 = two in ...
  const depth = new Map();
  let frontier = [];
  for (const k of top.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!solid(x, y, z)) continue;
    const exposed = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !solid(x + dx, y, z + dz));
    if (exposed) { depth.set(k, 0); frontier.push([x, z]); }
  }
  for (let d = 0; frontier.length; d++) {
    const next = [];
    for (const [x, z] of frontier) for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx, nz = z + dz, nk = key(nx, nz);
      if (!solid(nx, y, nz) || depth.has(nk)) continue;
      depth.set(nk, d + 1); next.push([nx, nz]);
    }
    frontier = next;
  }
  const D = (x, z) => depth.get(key(x, z));

  // Facade faces: which outward directions a perimeter cell looks out of at this height.
  const facesOf = (x, z) => Object.entries(OUT).filter(([, [dx, dz]]) => !solid(x + dx, y, z + dz)).map(([f]) => f);

  // Recessed windows: a perimeter cell on a single face (not a corner, not a pier column) is an opening (air); the
  // glass sits one block in, with an air gap behind it (glowstone or shroomlight in some), closed top and bottom by
  // the floor bands. Piers are every third column, so the windows read as a grid.
  const open = new Set(), glass = new Map();
  if (y >= 1 && y % 3 !== 0) {
    for (const k of depth.keys()) {
      const [x, z] = k.split(",").map(Number);
      if (D(x, z) !== 0) continue;
      const faces = facesOf(x, z);
      if (faces.length !== 1) continue;
      const f = faces[0], [ox, oz] = OUT[f], [ix, iz] = [-ox, -oz];
      const u = f === "N" || f === "S" ? x : z;
      if (u % 3 === 0) continue;
      const c1 = [x + ix, z + iz], c2 = [x + 2 * ix, z + 2 * iz];
      if (!solid(...c1, y) || D(...c1) !== 1 || !solid(...c2, y) || D(...c2) !== 2) continue;
      open.add(k);
      const pane = f === "N" || f === "S" ? NS : EW;
      glass.set(key(...c1), { pane, lamp: null });
      const lampable = y % 3 === 1 && lit(...c2, y);
      glass.get(key(...c1)).lamp = lampable ? ((x + z) % 2 ? "shroomlight" : "glowstone") : null;
      glass.set(key(...c2), { air: true, lamp: glass.get(key(...c1)).lamp });
    }
  }

  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    if (!inFoot(x, z)) continue;
    const k = key(x, z), gr = groundAt(x, z), t = topAt(x, z);
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }            // foundation: from y 0 up to the cell's ground
    if (!built(x, z)) { if (y === gr) g.set(x, y, z, "smooth_stone"); continue; }   // open ground: paving
    if (y >= t) {                                                       // parapet and coping on the roof edge
      const rim = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => topAt(x + dx, z + dz) < t);
      if (rim && y === t) g.set(x, y, z, "bricks");
      if (rim && y === t + 1) g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    const d = D(x, z) ?? 0;
    if (y === t - 1) { g.set(x, y, z, d === 0 ? "smooth_stone" : "gray_concrete"); continue; }   // cornice and roof
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }       // the base course
    if (y % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }      // floor band and sill
    if (open.has(k)) continue;                                          // window opening: air
    const w = glass.get(k);
    if (w?.pane) { g.set(x, y, z, "glass_pane", w.pane); continue; }   // the glass, one block in
    if (w?.air) { if (w.lamp && y % 3 === 1) g.set(x, y, z, w.lamp); continue; }   // the air gap behind it
    g.set(x, y, z, "bricks");
  }
}

// Entrance: a granite surround in the north wall, the door in the middle bay, a lintel, and a canopy over it.
g.set(10, 0, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(10, 1, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(10, 2, 0, "polished_granite");
g.set(10, 0, 1, "air"); g.set(10, 1, 1, "air");
for (let x = 8; x <= 12; x++) for (let z = 0; z <= 1; z++) g.set(x, 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

// Roof: a bulkhead for the stair and elevator on the main slab, and a water tower on four steel legs.
for (let x = 6; x <= 10; x++) for (let z = 14; z <= 17; z++) {
  for (let y = 37; y <= 40; y++) g.set(x, y, z, "bricks");
  g.set(x, 41, z, "smooth_stone");
}
for (const [x, z] of [[12, 9], [14, 9], [12, 11], [14, 11]]) for (let y = 37; y <= 41; y++) g.set(x, y, z, "iron_bars");
for (let x = 12; x <= 14; x++) for (let z = 9; z <= 11; z++) {
  for (let y = 42; y <= 44; y++) g.set(x, y, z, "spruce_planks");
  g.set(x, 45, z, "spruce_slab", { type: "top", waterlogged: "false" });
}

const saved = g.save(`${DIR}/NYC1034787.nbt`);
console.log(JSON.stringify(saved));
