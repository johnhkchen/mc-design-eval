// DC66025: a 1960s Southwest Washington office (300 7th St SW, Urban Renewal era), read from the lidar record. A four-storey
// core (14 blocks to its parapet) stepped down by a one-block setback ring to 10, two-storey wings at 7 and single-storey
// edges at 4. Buff precast piers (smooth quartz), light concrete spandrels at each floor line, a polished granite base
// course and light blue glass in each bay, with a stone parapet. The main entrance is on the street (north) face: a
// bronze-doored door at grade under a stone hood, with a glass transom and shopfront glass either side.
//
// Storeys sit on an absolute 3-block rhythm (base y1, floor lines y4 y7 y10, parapet on the top course), so every tier
// stands on the one below it. Each column is solid from y0 up to its tier (the foundation). Shell cells (plan edge, or
// a face above a lower neighbour) carry the facade; the next cell in is a two-deep void behind the glass at window rows
// (air, with a floor slab and ceiling per storey), and a few voids hold a warm glowstone or shroomlight. Deeper cells are
// solid. Glass panes connect to whatever stands beside them, so the bays read as a continuous grid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66025.cells.json`, "utf8"));
const [W, D] = [35, 22];

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Tiers from the lidar roof: a 12-14 core (14 inside, a 10 setback ring at its edge), 6-7 wings at 7, the rest at 4.
const core = (x, z) => inside(x, z) && byXZ.get(key(x, z)).r >= 11;
const coreDepth = new Map();
{
  let frontier = [];
  for (const [k, { r }] of byXZ) {
    const [x, z] = k.split(",").map(Number);
    if (r >= 11 && STEPS.some(([dx, dz]) => !core(x + dx, z + dz))) { coreDepth.set(k, 1); frontier.push([x, z]); }
  }
  for (let d = 1; frontier.length; d++) {
    const next = [];
    for (const [x, z] of frontier) for (const [dx, dz] of STEPS) {
      const k = key(x + dx, z + dz); if (!core(x + dx, z + dz) || coreDepth.has(k)) continue;
      coreDepth.set(k, d + 1); next.push([x + dx, z + dz]);
    }
    frontier = next;
  }
}
const H = new Map();
for (const [k, { r }] of byXZ) H.set(k, r >= 11 ? (coreDepth.get(k) >= 2 ? 14 : 10) : r >= 6 ? 7 : 4);
const height = (x, z) => (inside(x, z) ? H.get(key(x, z)) : -1);

// Plan depth: 1 = a cell with an open (outside) side, 2 = one step in, and so on.
const depth = new Map();
{
  let frontier = [];
  for (const [k] of byXZ) {
    const [x, z] = k.split(",").map(Number);
    if (STEPS.some(([dx, dz]) => !inside(x + dx, z + dz))) { depth.set(k, 1); frontier.push([x, z]); }
  }
  for (let d = 1; frontier.length; d++) {
    const next = [];
    for (const [x, z] of frontier) for (const [dx, dz] of STEPS) {
      const k = key(x + dx, z + dz); if (!inside(x + dx, z + dz) || depth.has(k)) continue;
      depth.set(k, d + 1); next.push([x + dx, z + dz]);
    }
    frontier = next;
  }
}

// The street face: the open north side with the most cells; the middle one of its cells is the entrance.
const northRuns = new Map();
for (const [k] of byXZ) {
  const [x, z] = k.split(",").map(Number);
  if (!inside(x, z - 1) && height(x, z) >= 7) northRuns.set(z, [...(northRuns.get(z) ?? []), x]);
}
const [entZ, entXs] = [...northRuns].sort((a, b) => b[1].length - a[1].length)[0];
const cx = entXs.sort((a, b) => a - b)[Math.floor(entXs.length / 2)];

// A facade is a shell cell at height y: an open side, or a side above a lower neighbour. Piers fall every third cell
// along the face (x on the N/S faces, z on the E/W faces).
function exposure(x, y, z) {
  const h = height(x, z); if (y >= h) return null;
  const out = [];
  for (const [d, dx, dz] of DIRS) { const nh = height(x + dx, z + dz); if (nh < h && nh <= y) out.push(d); }
  return out.length ? out : null;
}
const isPier = (x, z, face) => { const p = face === "N" || face === "S" ? x : z; return ((p % 3) + 3) % 3 === 0; };

// Roof plant: a mechanical room two blocks high on the tower's roof.
const plant = new Set();
for (const [k] of byXZ) {
  const [x, z] = k.split(",").map(Number);
  if (H.get(k) === 14 && depth.get(k) >= 3 && x >= 11 && x <= 18 && z >= 7 && z <= 12) plant.add(k);
}

// What stands at (x, y, z): a block name ("pane" for a glass pane, joined below), or null for air (nothing, or a void
// behind the glass). Kinds never recurse into one another, so a pane's neighbours and a void's lamp can both be asked.
function kind(x, y, z) {
  if (!inside(x, z) || y < 0) return null;
  const h = height(x, z);
  if (y >= h) return y < h + 2 && plant.has(key(x, z)) ? "light_gray_concrete" : null;
  const r = y >= 1 ? (y - 1) % 3 : -1;     // 0 = floor line, 1 and 2 = window rows
  const top = y === h - 1;
  const face = exposure(x, y, z);
  if (face) {
    const f = face[0];
    // The street face: the entrance on the north side, at grade, under a stone hood.
    if (f === "N" && z === entZ && Math.abs(x - cx) <= 2) {
      if (y === 1) return x === cx ? "iron_door:lower" : "polished_granite";
      if (y === 2) return x === cx ? "iron_door:upper" : Math.abs(x - cx) === 1 ? "pane" : null;
      if (y === 3 && Math.abs(x - cx) <= 1) return "light_blue_stained_glass";
      if (y === 4 && Math.abs(x - cx) <= 2) return "smooth_quartz";
    }
    if (y <= 1) return "polished_granite";
    if (top) return "smooth_quartz";
    if (isPier(x, z, f)) return "smooth_quartz";
    return r === 0 ? "light_gray_concrete" : "pane";
  }
  // Interior: the roof, the void behind the glass, or solid.
  if (top) return "smooth_stone";
  if (depth.get(key(x, z)) === 2 && y >= 2 && r !== 0) return lampHere(x, y, z) ? ((x + z) % 2 ? "glowstone" : "shroomlight") : null;
  return "stone";
}

// A warm light in a few void cells whose outer side is a glass bay (the plan-edge cell it looks through is never a void).
function lampHere(x, y, z) {
  if ((x * 7 + z * 5 + y * 3) % 17 !== 0) return false;
  return DIRS.some(([, dx, dz]) => depth.get(key(x + dx, z + dz)) === 1 && kind(x + dx, y, z + dz) === "pane");
}

// A block with its state: a pane joins whatever stands beside it on the same row.
function cellAt(x, y, z) {
  const k = kind(x, y, z); if (!k) return null;
  if (k === "pane") {
    const s = { waterlogged: "false" };
    for (const [d, dx, dz] of DIRS) s[{ N: "north", S: "south", W: "west", E: "east" }[d]] = kind(x + dx, y, z + dz) ? "true" : "false";
    return { block: "light_blue_stained_glass_pane", state: s };
  }
  if (k.startsWith("iron_door")) {
    return { block: "iron_door", state: { facing: "north", half: k.split(":")[1], hinge: "left", open: "false", powered: "false" } };
  }
  return { block: k };
}

const g = new Voxels([W, 26, D]);
for (const [k] of byXZ) {
  const [x, z] = k.split(",").map(Number);
  const top = Math.max(H.get(k), plant.has(k) ? 16 : 0);
  for (let y = 0; y < top; y++) {
    const c = cellAt(x, y, z);
    if (c) g.set(x, y, z, c.block, c.state);
  }
}
const info = g.save(`${DIR}/DC66025.nbt`);
const tiers = {};
for (const [, h] of H) tiers[h] = (tiers[h] ?? 0) + 1;
console.log(JSON.stringify({ cells: byXZ.size, entrance: { x: cx, z: entZ }, tiers, ...info }));
