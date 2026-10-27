// Way 160088626: a 1980s concrete-framed office block on the slope below Maungawhau, Eden Terrace side.
// Eight storeys at the edges, a nine-storey wing, and a ten-storey core, each step set back one ring in from the last.
// Lidar roof heights are smoothed into those three tiers (35, 39, 43). Floors sit on a datum of 3 blocks, one storey
// every 4 blocks, so the downhill side shows its extra storeys and the uphill side is buried in the earth below the
// ground floor. Every footprint column is solid from y 0 up to its roof: a stone foundation, an andesite plinth, then
// the storey bands (floor line, two window rows, sill). Behind each window is a one-block air gap, with a floor slab
// above and below it; some gaps hold a glowstone. The entrance is on the lowest north edge, with a stoop and a canopy.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_160088626.cells.json`, "utf8"));
const SIZE = [39, 56, 43];
const DATUM = 3;                                  // ground-floor slab level; storeys are 4 blocks above it
const DV = { north: [0, -1], east: [1, 0], south: [0, 1], west: [-1, 0] };

// Each footprint cell is a column: g = its ground (foundation below it), t = its tier top, r = the lidar roof.
const key = (x, z) => `${x},${z}`;
const col = new Map();
for (const [x, z, g, r] of cells) col.set(key(x, z), { x, z, g, r, t: 0 });
const at = (x, z) => col.get(key(x, z));

// Tiers: lidar roof -> 35 / 39 / 43, then two passes of a 3x3 majority vote so the tiers come out flat.
const tierOf = (r) => (r >= 40 ? 43 : r >= 38 ? 39 : 35);
for (const c of col.values()) c.t = tierOf(c.r);
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const c of col.values()) {
    const votes = new Map([[c.t, 2]]);            // its own tier counts double, so a lone cell keeps its tier
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const n = at(c.x + dx, c.z + dz);
      if (n && (dx || dz)) votes.set(n.t, (votes.get(n.t) || 0) + 1);
    }
    let best = c.t, bestN = -1;
    for (const [t, n] of votes) if (n > bestN) { best = t; bestN = n; }
    next.set(key(c.x, c.z), best);
  }
  for (const c of col.values()) c.t = next.get(key(c.x, c.z));
}

// The sides a column at height y faces open air: no neighbour in the footprint, or a neighbour roofed below y.
const exposedDirs = (c, y) => Object.keys(DV).filter((d) => {
  const n = at(c.x + DV[d][0], c.z + DV[d][1]);
  return !n || n.t <= y;
});
const along = (c, d) => (d === "north" || d === "south" ? c.x : c.z);   // position along a wall, for mullions
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;   // deterministic variety
const isWindowRow = (y) => y >= DATUM && [1, 2].includes((y - DATUM) % 4);
const isMullion = (c, d) => along(c, d) % 3 === 0;

// The entrance: the lowest north-facing (else east-facing) edge cell with ground 2 blocks or less.
const entry = [...col.values()]
  .filter((c) => c.g <= 2 && exposedDirs(c, 4).some((d) => d === "north" || d === "east"))
  .sort((a, b) => a.z - b.z || Math.abs(a.x - 19) - Math.abs(b.x - 19))[0];
const entryDir = entry && exposedDirs(entry, 4).find((d) => d === "north" || d === "east");
const isEntry = (c) => !!entry && (entryDir === "north" ? c.z === entry.z : c.x === entry.x) &&
  Math.abs(along(c, entryDir) - along(entry, entryDir)) <= 1 && exposedDirs(c, 4).includes(entryDir);

// Air gaps behind window glass: the inner cell of each glazed window cell, when that inner cell is enclosed.
const gap = new Set();
for (const c of col.values()) {
  for (let y = Math.max(c.g, DATUM); y < c.t; y++) {
    if (!isWindowRow(y)) continue;
    const dirs = exposedDirs(c, y);
    if (!dirs.length || isMullion(c, dirs[0]) || (isEntry(c) && y <= 5)) continue;
    const [dx, dz] = DV[dirs[0]];
    const inner = at(c.x - dx, c.z - dz);
    if (inner && inner.g <= y && inner.t > y && !exposedDirs(inner, y).length) gap.add(`${inner.x},${inner.z},${y}`);
  }
}

// The block at a column's height y as [name, state] (null = air).
function blockAt(c, y) {
  if (y < c.g) return ["stone"];                  // foundation, from y 0 up to the ground
  if (y < DATUM) return ["andesite"];             // base course
  const r = (y - DATUM) % 4;                      // 0 floor line, 1-2 window rows, 3 sill and spandrel
  if (gap.has(`${c.x},${c.z},${y}`)) return r === 1 && hash(c.x, y, c.z) % 7 === 0 ? ["glowstone"] : null;
  if (isEntry(c)) {
    if (y === DATUM) return ["stone_brick_stairs", { facing: entryDir, half: "bottom", shape: "straight", waterlogged: "false" }];
    if (y === 4 || y === 5) return along(c, entryDir) === along(entry, entryDir) ? ["light_blue_stained_glass"] : ["iron_block"];
    if (y === 6) return ["iron_block"];           // canopy line
  }
  const dirs = exposedDirs(c, y);
  if (!dirs.length) return ["light_gray_concrete"]; // interior floor slab and ceiling
  if (r === 0) return ["light_gray_concrete"];    // floor line
  if (r === 3) return ["white_concrete"];         // sill and spandrel
  if (isMullion(c, dirs[0])) return ["gray_concrete"];
  return hash(c.x, y, c.z) % 5 === 0 ? ["gray_stained_glass"] : ["light_blue_stained_glass"];
}

// The tower's plant room: the core cells at least one ring in from the tower's edge, as a solid box to y 46.
const tower = [...col.values()].filter((c) => c.t === 43);
const cx = tower.reduce((s, c) => s + c.x, 0) / tower.length;
const cz = tower.reduce((s, c) => s + c.z, 0) / tower.length;
const isPlantRoom = (c) => c.t === 43 && Math.abs(c.x - cx) <= 4 && Math.abs(c.z - cz) <= 4 &&
  Object.values(DV).every(([dx, dz]) => at(c.x + dx, c.z + dz)?.t === 43);

const g3 = new Voxels(SIZE);
for (const c of col.values()) {
  for (let y = 0; y < c.t; y++) {
    const b = blockAt(c, y);
    if (b) g3.set(c.x, y, c.z, b[0], b[1]);
  }
  // the roof: a parapet on the open edge, planters and paving across the top, the plant room on the tower
  if (isPlantRoom(c)) {
    for (let y = 43; y <= 45; y++) g3.set(c.x, y, c.z, "light_gray_concrete");
    g3.set(c.x, 46, c.z, "stone_bricks");
    continue;
  }
  const edge = Object.values(DV).some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.t < c.t; });
  if (edge) g3.set(c.x, c.t, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // coping, no posts
  else if (hash(c.x, c.t, c.z) % 4 === 0) g3.set(c.x, c.t, c.z, "moss_block");
  else g3.set(c.x, c.t, c.z, "smooth_stone");
}

// Self-check: every air cell inside a column is a window gap. Each gap's run of air (two rows, or more side by side)
// sits between solid floor and sill above and below, and its sides are solid or other gaps, never the outside.
const solid = (x, y, z) => { const c = at(x, z); return !!c && y >= 0 && y < c.t && !!blockAt(c, y); };
const air = (x, y, z) => !solid(x, y, z) && gap.has(`${x},${z},${y}`);
let open = 0;
for (const c of col.values()) for (let y = 0; y < c.t; y++) {
  if (solid(c.x, y, c.z)) continue;
  if (!air(c.x, y, c.z)) { open++; continue; }
  let lo = y, hi = y;
  while (air(c.x, lo - 1, c.z)) lo--;
  while (air(c.x, hi + 1, c.z)) hi++;
  if (!solid(c.x, lo - 1, c.z) || !solid(c.x, hi + 1, c.z)) open++;
  for (let yy = lo; yy <= hi; yy++) for (const [dx, dz] of Object.values(DV)) {
    const n = at(c.x + dx, c.z + dz);
    if (!n || (!solid(c.x + dx, yy, c.z + dz) && !air(c.x + dx, yy, c.z + dz))) open++;
  }
}
console.log(`columns ${col.size}, tower ${tower.length} cells, entrance ${entry ? `${entry.x},${entry.z} facing ${entryDir}` : "none"}, air gaps ${gap.size}, open or unsupported air ${open}`);
console.log(g3.save(`${DIR}/way_160088626.nbt`));
