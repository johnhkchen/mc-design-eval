// TVNZ Television Centre, Auckland (OSM way 23904469). Read from the LINZ lidar record: a low studio hall (roof about
// 7 blocks, windowless) on the west and south, a 4-storey office wing in the middle, a 7-storey block on the east and a
// 12-13 storey tower at the far north-east corner. Storeys are 4 blocks; roof heights are the lidar's median-smoothed
// and rounded to whole storeys, then mode-filtered so each tier is one flat slab. Floors sit on storey lines (y = 4s),
// so every tier stands on the one below. Downhill sides run solid stone down to the ground (the foundation).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23904469.cells.json`, "utf8"));
const SIZE = [147, 64, 114];

// The footprint: key "x,z" -> { x, z, g (ground), n (storeys), R (roof deck row) }
const F = new Map();
const at = (x, z) => F.get(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

for (const [x, z, g] of cells) F.set(`${x},${z}`, { x, z, g, key: `${x},${z}` });

// 1. roof per cell: median of a 5 x 5 window of the lidar roofs (noise), in whole storeys
const ROOF = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
for (const c of F.values()) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const r = ROOF.get(`${c.x + dx},${c.z + dz}`); if (r !== undefined) v.push(r);
  }
  v.sort((a, b) => a - b);
  c.n = Math.max(2, Math.round(v[v.length >> 1] / 4));
}

// 2. mode filter (two passes, own cell weighted up): tiers become flat blocks, not lidar stipple
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const c of F.values()) {
    const counts = new Map();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const m = at(c.x + dx, c.z + dz); if (!m) continue;
      const w = dx === 0 && dz === 0 ? 1.5 : 1;
      counts.set(m.n, (counts.get(m.n) ?? 0) + w);
    }
    let best = c.n, bc = -1;
    for (const [n, k] of counts) if (k > bc) { best = n; bc = k; }
    next.set(c.key, best);
  }
  for (const [k, n] of next) F.get(k).n = n;
}

// 3. every cell reaches at least two storeys above its ground; the roof deck is row 4n
for (const c of F.values()) {
  c.n = Math.max(c.n, Math.ceil(c.g / 4) + 1);
  c.R = 4 * c.n;
  c.hall = c.R <= 8;               // the studio hall: windowless concrete with louvres
}

// A face of a cell is exposed at row y when its neighbour is off the footprint or its roof sits lower than y.
const faces = (c, y) => NB.filter(([dx, dz]) => { const m = at(c.x + dx, c.z + dz); return !m || m.R < y; });
// A roof edge: a neighbour off the footprint or lower than this cell's roof, so its parapet shows on that side.
const rimAt = (c) => NB.some(([dx, dz]) => { const m = at(c.x + dx, c.z + dz); return !m || m.R < c.R; });
// Glazing sits in bays of three along each facade; the mullions are every third cell along the wall.
const tangent = (c, d) => (d[0] !== 0 ? c.z : c.x);
const isMullion = (c, d) => tangent(c, d) % 3 === 0;
const hash = (x, z, s) => (Math.imul(x, 73856093) ^ Math.imul(z, 19349663) ^ Math.imul(s, 83492791)) >>> 0;

// 4. entrance: the north edge, a cell at ground 0 or 1 nearest x = 40 (the lobby, two doors, glass either side)
const northEdge = [...F.values()].filter((c) => !at(c.x, c.z - 1) && c.g <= 1);
northEdge.sort((a, b) => Math.abs(a.x - 40) - Math.abs(b.x - 40));
const entrance = northEdge[0];
const doorXs = entrance ? [entrance.x, entrance.x + 1] : [];
const doorZ = entrance ? entrance.z : -1;

// 5. build
const g = new Voxels(SIZE);
let roofTop = { R: -1 };
for (const c of F.values()) if (c.R > roofTop.R) roofTop = c;
const counts = { glass: 0, lit: 0, door: 0, equip: 0 };

for (const c of F.values()) {
  const { x, z, g: gr, R, hall } = c;
  // foundation: solid from y 0 up to the cell's own ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= R + 1; y++) {
    if (y === R + 1) {                       // parapet on the exposed edges of the roof
      if (rimAt(c)) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === R) { g.set(x, y, z, "smooth_stone"); continue; }   // roof deck
    const s = y >> 2, k = y & 3;
    if (k === 0) { g.set(x, y, z, y === 0 ? "stone_bricks" : "smooth_stone"); continue; }   // base course / storey line
    const fs = faces(c, y);
    if (!fs.length) {                        // interior: an air gap, lit now and then behind the glass
      if (k === 1 && y > gr) {
        const glassNb = NB.map(([dx, dz]) => at(x + dx, z + dz)).find((m) => m && !m.hall && m.R >= y && faces(m, y).length
          && !isMullion(m, faces(m, y)[0]) && y > m.g && m.key !== c.key);
        if (glassNb && hash(x, z, s) % 6 === 0) {
          g.set(x, y, z, hash(x, z, s) % 12 === 0 ? "glowstone" : "lantern", hash(x, z, s) % 12 === 0 ? undefined : { hanging: "false", waterlogged: "false" });
          counts.lit++;
        }
      }
      continue;
    }
    const d = fs[0];
    if (hall) {
      g.set(x, y, z, k === 3 ? "light_gray_concrete" : (tangent(c, d) % 6 === 0 ? "polished_andesite" : "light_gray_concrete"));
      continue;
    }
    if (k === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }    // lintel / spandrel
    if (s === 0 && doorXs.length && z === doorZ && d[1] === -1 && doorXs.includes(x) && (k === 1 || k === 2)) {
      g.set(x, y, z, "iron_door", { facing: "north", half: k === 1 ? "lower" : "upper", hinge: x === doorXs[0] ? "left" : "right", open: "false", powered: "false" });
      counts.door++; continue;
    }
    if (isMullion(c, d)) g.set(x, y, z, "gray_concrete");
    else { g.set(x, y, z, "light_blue_stained_glass"); counts.glass++; }
  }
}

// 6. roof plant: a few iron boxes on the upper enclosed roofs, and the mast with its red aviation light on the tallest tower
for (const c of F.values()) {
  if (rimAt(c) || c.hall || c.R < 16 || hash(c.x, c.z, 99) % 37 !== 0) continue;
  g.set(c.x, c.R + 1, c.z, "iron_block"); counts.equip++;
}
for (let y = roofTop.R + 1; y <= roofTop.R + 5; y++) g.set(roofTop.x, y, roofTop.z, "iron_bars");
g.set(roofTop.x, roofTop.R + 6, roofTop.z, "redstone_lamp", { lit: "true" });

const out = g.save(`${DIR}/way_23904469.nbt`);
const tiers = {};
for (const c of F.values()) tiers[c.R] = (tiers[c.R] ?? 0) + 1;
console.log(JSON.stringify({ cells: F.size, roofTiers: tiers, ...counts, entrance: entrance ? [entrance.x, entrance.z] : null, saved: out }));
