// Engineering 402, Auckland: a five-storey concrete-frame university block (c. 1970s), built on the lidar footprint.
// Massing: the lidar roof is median-smoothed, its one-cell diagonal edge line (42 blocks, an artefact) is discarded,
// then quantised into three flat tiers (12, 16, 20) that step in as they rise. Every column stands on its own
// foundation, and each storey, deck and parapet rests on what is below it.
// Facade: white fins on a 4-block module, glazed bays in light-blue glass, light-grey spandrels, a stone plinth,
// a recessed entrance with a lintel canopy on two posts, and warm light in some windows.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_289723273.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..77, z 0..88
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_289723273.nbt";

const STOREY = 4, SPIKE = 30;                       // lidar roofs above SPIKE are the diagonal edge artefact (42), not massing
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => x + "," + z;
const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };

// ---- footprint: smoothed roof, quantised tiers, a clean majority filter over the 3x3 ----
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { x, z, g, r });
const at = (x, z) => cell.get(key(x, z));
for (const c of cell.values()) {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = at(c.x + dx, c.z + dz); if (n && n.r <= SPIKE) v.push(n.r); }
  c.s = v.length ? med(v) : c.r;
  c.t0 = c.s <= 13.5 ? 12 : c.s < 18.5 ? 16 : 20;
}
for (const c of cell.values()) {
  const cnt = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) cnt.set(n.t0, (cnt.get(n.t0) || 0) + 1); }
  let best = c.t0;
  for (const [t, n] of cnt) if (n > (cnt.get(best) || 0)) best = t;
  c.T = Math.max(best, Math.ceil((c.g + 2 * STOREY) / STOREY) * STOREY);   // at least two storeys above its ground
}

// ---- walls: a cell is wall if it touches open air or a lower tier (a setback face) ----
for (const c of cell.values()) {
  c.out = null; c.wall = false;
  for (const [dx, dz] of DIRS) if (!at(c.x + dx, c.z + dz)) { c.out = [dx, dz]; break; }
  if (c.out) c.wall = true;
  for (const [dx, dz] of DIRS) { const n = at(c.x + dx, c.z + dz); if (n && n.T < c.T) { c.wall = true; c.face ??= [dx, dz]; } }
  c.face = c.out || c.face || [0, 0];
}

const V = new Voxels([78, 55, 89]);
const S = (x, y, z, b, st) => V.set(x, y, z, b, st);

// ---- foundation, floors and deck for every column ----
for (const c of cell.values()) {
  for (let y = 0; y < c.g; y++) S(c.x, y, c.z, "stone_bricks");
  if (!c.wall) S(c.x, c.g, c.z, "smooth_stone");
  for (let y = STOREY; y < c.T - 1; y += STOREY) if (y > c.g && !c.wall) S(c.x, y, c.z, "smooth_stone");
  if (!c.wall) S(c.x, c.T - 1, c.z, "smooth_stone");     // light roof membrane: a dark deck reads as a void from the air
}

// ---- wall columns: a 4-block module, white fins on the 4-block grid, glazed bays between ----
const glassFor = (c) => {
  const st = c.face[0] !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
  return ["light_blue_stained_glass_pane", st];
};
const uOf = (c) => (c.face[0] !== 0 ? c.z : c.x);
for (const c of cell.values()) {
  if (!c.wall) continue;
  for (let y = c.g; y < c.T; y++) {
    let b = null, st;
    if (y === c.g) b = "stone_bricks";                    // plinth course
    else if (y === c.T - 1) b = "light_gray_concrete";    // cornice
    else {
      const r = y % STOREY;
      if (r === 0) b = "white_concrete";                  // string course
      else if (r === 3) b = "light_gray_concrete";        // spandrel
      else if (uOf(c) % 4 === 0) b = "white_concrete";    // fin
      else [b, st] = glassFor(c);
    }
    S(c.x, y, c.z, b, st);
  }
  S(c.x, c.T, c.z, "white_concrete");                     // parapet
}

// ---- entrance: the lowest outward-facing wall run, a glazed lobby with a canopy on two posts ----
const outward = [...cell.values()].filter((c) => c.wall && c.out);
outward.sort((a, b) => a.g - b.g || b.z - a.z || a.x - b.x);
const e = outward[0];
const ue = uOf(e), [nx, nz] = e.face;
const entranceKeys = new Set();
const run = [...cell.values()].filter((c) => c.wall && c.out && c.face[0] === nx && c.face[1] === nz && Math.abs(uOf(c) - ue) <= 1);
for (const c of run) {
  entranceKeys.add(key(c.x, c.z));
  const u = uOf(c), gy = c.g;
  if (c === e) {
    S(c.x, gy + 1, c.z, "dark_oak_door", { facing: nx ? (nx > 0 ? "east" : "west") : (nz > 0 ? "south" : "north"), half: "lower", hinge: "left", open: "false", powered: "false" });
    S(c.x, gy + 2, c.z, "dark_oak_door", { facing: nx ? (nx > 0 ? "east" : "west") : (nz > 0 ? "south" : "north"), half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    S(c.x, gy + 1, c.z, "light_blue_stained_glass");
    S(c.x, gy + 2, c.z, "light_blue_stained_glass");
  }
  S(c.x, gy + 3, c.z, "light_gray_concrete");            // lintel
  if (Math.abs(u - ue) === 1) {                           // posts and canopy one cell inside
    const ix = c.x - nx, iz = c.z - nz, inn = at(ix, iz);
    if (inn && !inn.wall) {
      S(ix, gy + 1, iz, "white_concrete"); S(ix, gy + 2, iz, "white_concrete");
      S(ix, gy + 3, iz, "light_gray_concrete");
    }
  }
}
{
  const ix = e.x - nx, iz = e.z - nz, inn = at(ix, iz);
  if (inn && !inn.wall) S(ix, e.g + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- warm light: some glazed bays have a lamp just inside the glass ----
for (const c of cell.values()) {
  if (!c.wall || !c.out) continue;
  if (uOf(c) % 4 === 0) continue;
  const ix = c.x - c.face[0], iz = c.z - c.face[1], inn = at(ix, iz);
  if (!inn || inn.wall) continue;
  for (let y = c.g + 1; y < c.T - 1; y++) {
    const r = y % STOREY; if (r !== 1 && r !== 2) continue;
    if (entranceKeys.has(key(c.x, c.z))) continue;
    const h = (c.x * 31 + c.z * 17 + y * 7) % 13;
    if (h === 0) S(ix, y, iz, "glowstone");
    else if (h === 5) S(ix, y, iz, "shroomlight");
  }
}

// ---- roof: plant rooms on the top tier, lightning rods on the corners ----
for (const c of cell.values()) {
  if (c.wall || c.T !== 20) continue;
  let inner = true;
  for (let dz = -2; dz <= 2 && inner; dz++) for (let dx = -2; dx <= 2; dx++) { const n = at(c.x + dx, c.z + dz); if (!n || n.T < 20) { inner = false; break; } }
  if (!inner) continue;
  if ((c.x % 10) >= 3 && (c.x % 10) <= 6 && (c.z % 10) >= 3 && (c.z % 10) <= 6) {
    S(c.x, c.T, c.z, "light_gray_concrete");
    S(c.x, c.T + 1, c.z, "light_gray_concrete");
  }
}

const res = V.save(OUT);
const tiers = {}; for (const c of cell.values()) tiers[c.T] = (tiers[c.T] || 0) + 1;
console.log(JSON.stringify({ cells: cell.size, tiers, entrance: { x: e.x, z: e.z, g: e.g, face: e.face }, ...res }));
