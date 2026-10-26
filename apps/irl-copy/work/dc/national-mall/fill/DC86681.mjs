// 1120 Vermont Ave NW: a 1960s-70s Commercial-Office-Large in pale stone with blue-glass window bands.
// Seven storeys on a 3-block storey grid (absolute y: spandrel lines at 3, 6, 9 ...), a 5-storey wing and a
// 6-storey shoulder stepping down to a 7-storey core, a shopfront base on the street, a portal entrance on the
// north front, lit windows at the lower pane row, and a penthouse on the core roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86681.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86681.nbt";

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { x, z, g, r });
const has = (x, z) => cell.has(key(x, z));
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E (outward directions)
const FACE = ["north", "south", "west", "east"];

// depth in cells from the outside edge: 0 = exterior wall cell, 1 = the cell behind it, ...
const dist = new Map();
let frontier = [];
for (const c of cell.values()) {
  if (NB.some(([dx, dz]) => !has(c.x + dx, c.z + dz))) { dist.set(key(c.x, c.z), 0); frontier.push(c); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of NB) {
    const k = key(c.x + dx, c.z + dz);
    if (has(c.x + dx, c.z + dz) && !dist.has(k)) { dist.set(k, d); next.push(cell.get(k)); }
  }
  frontier = next;
}

// massing tiers from the lidar roof, smoothed: 21 = core tower, 18 = mid block and the core's shoulder, 15 = low wings
for (const c of cell.values()) {
  const d = dist.get(key(c.x, c.z));
  let T = c.r >= 20 ? 21 : c.r >= 16 ? 18 : 15;
  if (T === 21 && d < 2) T = 18;
  c.T = T; c.d = d;
}

const W = [36, 33, 30];
const g = new Voxels(W);
const pane = (face) => {
  const ew = face === "north" || face === "south";   // a pane in a north/south wall runs east-west
  return { north: ew ? "false" : "true", south: ew ? "false" : "true", east: ew ? "true" : "false", west: ew ? "true" : "false" };
};

// 1. the solid: foundations, base course, floor slabs, decks under the setbacks, roof caps, and the skin
for (const c of cell.values()) {
  const { x, z, g: gy, T, d } = c;
  const exposed = NB.map(([dx, dz], i) => (!has(x + dx, z + dz) ? i : -1)).filter((i) => i >= 0);
  const corner = exposed.length >= 2;
  const face = exposed.length ? FACE[exposed[0]] : null;
  const u = face === "north" || face === "south" ? x : z;   // position along the face, for the bay rhythm

  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");            // foundation to the lowest ground
  g.set(x, gy, z, "polished_andesite");                                    // base course, the floor of storey 0
  for (let y = gy + 1; y < T; y++) {
    if (d > 0) {                                                           // interior: floor slabs, roof cap, air between
      if (y === T - 1) g.set(x, y, z, "gray_concrete");
      else if (y % 3 === 0 || y === 14 || y === 17) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    // exterior wall cell
    let b;
    if (y === T - 1) b = "polished_andesite";                              // cornice
    else if (corner) b = "smooth_quartz";                                   // corner piers
    else if (y <= 2) b = u % 3 === 0 ? "smooth_quartz" : "cyan_stained_glass_pane";   // shopfront
    else if (y % 3 === 0) b = "smooth_quartz";                              // spandrel line
    else if (y === 14 || y === 17) b = "polished_andesite";                 // string course over the setbacks
    else b = u % 3 === 0 ? "smooth_quartz" : "cyan_stained_glass_pane";     // window band: pier, pane, pane
    if (b === "cyan_stained_glass_pane") g.set(x, y, z, b, pane(face));
    else g.set(x, y, z, b);
  }
}

// 2. the portal on the north front: jambs, a lintel, two shop panes, and the door
const portalRow = (x) => cell.get(key(x, 0));
for (let x = 25; x <= 29; x++) {
  const c = portalRow(x);
  if (!c) continue;
  for (let y = c.g + 1; y <= c.g + 3; y++) g.set(x, y, 0, "smooth_quartz");
  g.set(x, c.g + 3, 0, "smooth_quartz");
  g.set(x, 4, 0, "smooth_quartz");                                         // lintel over the entrance
}
for (const x of [26, 28]) g.set(x, 2, 0, "cyan_stained_glass_pane", pane("north"));
g.set(27, 2, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(27, 3, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// 3. warm light behind some lower panes: the air gap behind each glass bay, lit one in several
for (const c of cell.values()) {
  if (c.d !== 0 || c.T < 6) continue;
  const exposed = NB.map(([dx, dz], i) => (!has(c.x + dx, c.z + dz) ? i : -1)).filter((i) => i >= 0);
  if (exposed.length !== 1) continue;                                      // flat walls only, not corners
  const [dx, dz] = NB[exposed[0]];
  const u = dx === 0 ? c.x : c.z;
  for (let y = 4; y < c.T - 1; y += 3) {                                   // the lower pane row of each upper storey
    if (u % 3 === 0) continue;                                             // a pier, not a pane
    const h = (Math.imul(c.x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(c.z, 83492791)) >>> 0;
    if (h % 15 !== 0) continue;
    const ix = c.x - dx, iz = c.z - dz;
    if (!has(ix, iz) || dist.get(key(ix, iz)) < 1) continue;
    g.set(ix, y, iz, h % 45 === 0 ? "shroomlight" : "glowstone");
  }
}

// 4. penthouse on the core roof: a 7 x 4 box of plant rooms with a flat roof, set in the tower's interior
const core = (x, z) => has(x, z) && cell.get(key(x, z)).T === 21 && dist.get(key(x, z)) >= 3;
let best = null;
for (let x0 = 0; x0 < 36; x0++) for (let z0 = 0; z0 < 30; z0++) {
  let ok = true, sx = 0, sz = 0;
  for (let x = x0; x < x0 + 7 && ok; x++) for (let z = z0; z < z0 + 4; z++) { if (!core(x, z)) { ok = false; break; } }
  if (!ok) continue;
  const cx = x0 + 3, cz = z0 + 1.5;
  const score = Math.abs(cx - 17) + Math.abs(cz - 14);
  if (!best || score < best.score) best = { x0, z0, score };
}
if (best) {
  const { x0, z0 } = best;
  for (let x = x0; x < x0 + 7; x++) for (let z = z0; z < z0 + 4; z++) {
    const edge = x === x0 || x === x0 + 6 || z === z0 || z === z0 + 3;
    for (let y = 21; y <= 22; y++) if (edge) g.set(x, y, z, "smooth_quartz");
    g.set(x, 23, z, "polished_andesite");
  }
  for (let x = x0 + 1; x < x0 + 6; x++) g.set(x, 22, z0, "iron_bars");       // louvred front
  for (let x = x0 + 1; x < x0 + 6; x++) g.set(x, 22, z0 + 3, "iron_bars");
}

const stats = g.save(OUT);
console.log(JSON.stringify({ cells: cells.length, ...stats, penthouse: best }));
