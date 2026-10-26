// DC77500: a six-storey limestone federal office block (Federal Triangle manner): granite plinth, storey lines every
// 3 blocks, a two-skin envelope with glass in each window and an air gap behind it, tiers stepping down where the
// lidar drops, a stone parapet, rooftop plant and a central penthouse. Entrances on the long faces.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77500.cells.json`, "utf8"));

const W = 64, H = 30, D = 50;
const g = new Voxels([W, H, D]);

const PLINTH = "polished_granite", STONE = "smooth_stone", SKIN = "calcite", GLASS = "light_blue_stained_glass_pane", GLOW = "glowstone";
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

// ---- footprint and lidar roof, smoothed over 5x5 and quantised to storey lines (3 blocks) ----
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
const has = (x, z) => raw.has(key(x, z));

const topMap = new Map();
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const o = raw.get(key(x + dx, z + dz)); if (o) { s += o.roof; n++; }
  }
  topMap.set(k, Math.min(18, Math.max(3, 3 * Math.round(s / n / 3))));
}
const top = (x, z) => topMap.get(key(x, z));

// ---- depth of each cell inside an envelope: 1 = outer skin, 2 = inner skin, 3+ = interior ----
function envelopeDepth(inE) {
  const d = new Map(); let frontier = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!inE(x, z)) continue;
    if (N4.some(([dx, dz]) => !inE(x + dx, z + dz))) { d.set(key(x, z), 1); frontier.push([x, z]); }
  }
  for (let k = 1; frontier.length; k++) {
    const next = [];
    for (const [x, z] of frontier) for (const [dx, dz] of N4) {
      const nx = x + dx, nz = z + dz;
      if (inE(nx, nz) && !d.has(key(nx, nz))) { d.set(key(nx, nz), k + 1); next.push([nx, nz]); }
    }
    frontier = next;
  }
  return d;
}

const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// ---- plinth: granite base course, solid from y 0 up to the storey line, over every footprint cell ----
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= 2; y++) g.set(x, y, z, PLINTH);
}

// ---- body: storeys from y 3 up to each cell's top (a multiple of 3); floor/roof slabs on every 3rd row ----
for (let y = 3; y <= 18; y++) {
  const inE = (x, z) => has(x, z) && top(x, z) >= y;
  const dep = envelopeDepth(inE);
  // the outward direction of a skin cell: the way its face looks (d=1: off the envelope; d>1: the next skin in)
  const outward = (x, z, d) => N4.find(([dx, dz]) => (d === 1 ? !inE(x + dx, z + dz) : dep.get(key(x + dx, z + dz)) === d - 1));

  for (const [k] of raw) {
    const [x, z] = k.split(",").map(Number);
    if (!inE(x, z)) continue;
    const d = dep.get(key(x, z));

    if (y % 3 === 0) { g.set(x, y, z, STONE); continue; }      // floor slab, string course, roof slab

    if (d >= 3) continue;                                       // interior: air
    const dir = outward(x, z, d);
    const along = dir && dir[1] !== 0 ? x : z;                   // a north/south face runs along x, an east/west one along z
    const window = along % 4 !== 0;                              // piers every 4th cell, three-wide windows between

    if (d === 1) {
      if (window) {
        const ew = dir && dir[1] !== 0;
        g.set(x, y, z, GLASS, ew
          ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      } else g.set(x, y, z, SKIN);
    } else {                                                     // inner skin: solid behind a pier, air or glow behind glass
      if (!window) g.set(x, y, z, SKIN);
      else if (hash(x, y, z) % 6 === 0) g.set(x, y, z, GLOW);
    }
  }
}

// ---- parapet on the roof edges: a calcite wall with a stone cap, on every cell that stands at an edge ----
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const t = top(x, z);
  const edge = N4.some(([dx, dz]) => !has(x + dx, z + dz) || top(x + dx, z + dz) < t);
  if (!edge) continue;
  g.set(x, t + 1, z, SKIN);
  g.set(x, t + 2, z, STONE, { type: "bottom" });
}

// ---- entrances: two oak-framed doors (dark oak) on the long faces, a vestibule behind, a lintel over ----
const doorways = [[31, 0, "north"], [32, 0, "north"], [31, 49, "south"], [32, 49, "south"]];
for (const [x, z0, facing] of doorways) {
  const dz = z0 === 0 ? 1 : -1;
  for (let y = 1; y <= 2; y++) for (let i = 0; i < 3; i++) g.set(x, y, z0 + dz * i, "air");   // clear the plinth
  const hinge = x === 31 ? "left" : "right";
  g.set(x, 1, z0, "dark_oak_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 2, z0, "dark_oak_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
}
for (const z of [0, 49]) for (let x = 29; x <= 34; x++) g.set(x, 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

// ---- roof plant: a central penthouse of calcite on the tallest tier, stone roof over it ----
const PH = { x0: 26, x1: 37, z0: 17, z1: 32, y0: 19, y1: 21 };
let penthouse = 0;
for (let z = PH.z0; z <= PH.z1; z++) for (let x = PH.x0; x <= PH.x1; x++) if (has(x, z) && top(x, z) === 18) penthouse++;
if (penthouse === (PH.x1 - PH.x0 + 1) * (PH.z1 - PH.z0 + 1)) {
  for (let y = PH.y0; y <= PH.y1; y++) for (let z = PH.z0; z <= PH.z1; z++) for (let x = PH.x0; x <= PH.x1; x++) {
    const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    if (edge) g.set(x, y, z, SKIN);
  }
  for (let z = PH.z0; z <= PH.z1; z++) for (let x = PH.x0; x <= PH.x1; x++) g.set(x, PH.y1 + 1, z, STONE);
  // lit window band on the penthouse
  for (let x = PH.x0 + 1; x < PH.x1; x++) if (x % 3 !== 0) {
    g.set(x, 20, PH.z0, GLASS, { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    g.set(x, 20, PH.z1, GLASS, { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  }
}

// ---- rooftop plant: four iron-clad air-handling units on the top tier, clear of the penthouse and the parapet ----
for (const [ux, uz] of [[12, 10], [50, 10], [12, 38], [50, 38]]) {
  let ok = true;
  for (let z = uz; z < uz + 3; z++) for (let x = ux; x < ux + 3; x++) if (!has(x, z) || top(x, z) !== 18) ok = false;
  if (!ok) continue;
  for (let y = 19; y <= 20; y++) for (let z = uz; z < uz + 3; z++) for (let x = ux; x < ux + 3; x++) g.set(x, y, z, "iron_block");
}

const out = `${DIR}/DC77500.nbt`;
const stats = g.save(out);
console.log("saved", out, stats);
