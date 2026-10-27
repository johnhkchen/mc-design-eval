// Way 711259643, Auckland (Mt Eden side of the CBD): a two-storey red-brick Edwardian commercial block with a shopfront
// on the ground floor, sash-style window grids in cream terracotta dressings, and a set-back attic tier on the north-east
// core. Massing comes from the lidar roof heights, quantised into three clean tiers (1, 2 and 2 1/2 storeys + parapet).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_711259643.cells.json`, "utf8"));

// The footprint: "x,z" -> { ground, roof }. Index 2 is the cell's ground, index 3 the lidar roof height above y 0.
const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const key = (x, y, z) => `${x},${y},${z}`;

// Storey tiers: 1 storey (top at y 4), 2 storeys (top at y 8), 2 storeys + attic and parapet (top at y 11).
const rawTier = (roof) => (roof <= 5 ? 4 : roof <= 9 ? 8 : 11);
// One majority pass over each cell's 3x3 neighbourhood flattens lidar noise into flat tiers; ties keep the cell's own tier.
const T = new Map();
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  const count = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(`${x + dx},${z + dz}`); if (n) count.set(rawTier(n.roof), (count.get(rawTier(n.roof)) ?? 0) + 1);
  }
  let best = rawTier(c.roof), bc = count.get(best) ?? 0;
  for (const [t, n] of count) if (n > bc) { best = t; bc = n; }
  T.set(k, best);
}
const top = (x, z) => T.get(`${x},${z}`) ?? 0;          // solid from y 0 up to (not including) top
const solid = (x, z, y) => y >= 0 && y < top(x, z);
// The four side neighbours: dx, dz, and the face name (the direction the neighbour lies in, i.e. outward for the cell).
const SIDES = [{ dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: 1, dz: 0 }, { dx: -1, dz: 0 }];
const exposed = (x, z, y) => SIDES.filter(({ dx, dz }) => !solid(x + dx, z + dz, y));

// Window rows by storey: the shopfront (1-2), the upper storey (5-6) and the attic (9, the 11-tier only).
const isShopRow = (y) => y === 1 || y === 2;
const isWindowRow = (y, t) => isShopRow(y) || ((y === 5 || y === 6) && t >= 8) || (y === 9 && t === 11);
const glazed = (x, z, y) => (isShopRow(y) ? (x + z) % 3 !== 0 : (x + z) % 3 === 1);
const DOOR = { x: 11, z: 22 };                          // the south-facing shop door, on the wall that faces the street

// Pass 1: an air gap one cell deep behind each window (inside the building), some lit by a glowstone on its floor.
const gap = new Set(), glow = new Set();
for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number), t = top(x, z);
  for (let y = 0; y < t; y++) {
    if (!isWindowRow(y, t) || !glazed(x, z, y) || (x === DOOR.x && z === DOOR.z)) continue;
    const faces = exposed(x, z, y); if (!faces.length) continue;
    const { dx, dz } = faces[0], ix = x - dx, iz = z - dz;   // the cell inward of the glass
    if (!solid(ix, iz, y) || exposed(ix, iz, y).length) continue;   // only a true interior cell gets a gap
    gap.add(key(ix, y, iz));
    const lowest = y === 1 || y === 5 || y === 9;
    if (lowest && (x * 5 + z * 3 + y) % 3 === 0) glow.add(key(ix, y, iz));
  }
}

const g = new Voxels([16, 23, 23]);
// A pane joins the wall it sits in: on a north or south face it runs east-west, on an east or west face north-south.
const wallPane = (faces) => {
  const eastWest = faces.some(({ dz }) => dz !== 0);
  return { north: String(!eastWest), south: String(!eastWest), east: String(eastWest), west: String(eastWest), waterlogged: "false" };
};

// Pass 2: the shell, column by column. Each column is solid from y 0 up to its tier's top, so nothing floats.
for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number), t = top(x, z);
  for (let y = 0; y < t; y++) {
    const faces = exposed(x, z, y);
    if (!faces.length) {                                 // interior: infill, the floor slab, the roof, or the gap
      if (glow.has(key(x, y, z))) g.set(x, y, z, "glowstone");
      else if (gap.has(key(x, y, z))) continue;
      else if (y === t - 1) g.set(x, y, z, "deepslate_tiles");
      else if (y === 4 || y === 8) g.set(x, y, z, "smooth_stone");
      else g.set(x, y, z, "stone");
      continue;
    }
    // exterior shell
    if (x === DOOR.x && z === DOOR.z && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (x === DOOR.x && z === DOOR.z && y === 3) { g.set(x, y, z, "dark_oak_planks"); continue; }   // the hood over the door
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                  // base course
    if (y === t - 1) { g.set(x, y, z, "smooth_stone"); continue; }             // parapet cap
    if (faces.length >= 2 && y > 0) { g.set(x, y, z, "white_terracotta"); continue; }   // quoins at the corners
    if (y === 3 || y === 4 || y === 7 || y === 8) { g.set(x, y, z, "white_terracotta"); continue; }  // lintel and storey strings
    if (isWindowRow(y, t) && glazed(x, z, y)) {
      g.set(x, y, z, "glass_pane", wallPane(faces));
      continue;
    }
    g.set(x, y, z, isShopRow(y) ? "dark_oak_planks" : "bricks");               // piers and walls
  }
}

// Pass 3: roof equipment on the attic roof (the parapet cap is at y 10, so these stand at y 11).
const onAttic = (x0, z0, w, d) => { for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) if (top(x, z) !== 11) return false; return true; };
if (onAttic(4, 14, 2, 2)) for (let x = 4; x < 6; x++) for (let z = 14; z < 16; z++) g.set(x, 11, z, "light_gray_concrete");   // condenser
if (onAttic(9, 13, 2, 2)) for (let x = 9; x < 11; x++) for (let z = 13; z < 15; z++) for (let y = 11; y < 13; y++) g.set(x, y, z, "stone_bricks");   // lift overrun

const counts = g.save(`${DIR}/way_711259643.nbt`);
const tiers = [4, 8, 11].map((t) => `${t}:${[...T.values()].filter((v) => v === t).length}`).join(" ");
console.log(`way_711259643: ${cells.length} cells, tiers ${tiers}, ${counts.blocks} blocks, ${counts.palette} palette`);
