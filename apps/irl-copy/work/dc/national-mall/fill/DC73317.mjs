// DC73317: a Federal-era (c. 1930s) limestone office block on the Mall's south edge, its core stepping up to 13 blocks
// over 10-11 wings. Walls are calcite with smooth-quartz trim (string courses, lintels, quoins, piers), a polished
// andesite plinth, a chiseled-quartz cornice, glass panes in three-bay groups, and a double bronze-style door in a
// quartz surround on the front (the longest exposed face). Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC73317.cells.json", "utf8"));
const X = 20, Z = 10, Y = 25;

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, , r] of cells) raw.set(key(x, z), r);
const inFP = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && raw.has(key(x, z));
const NB8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// Lidar roof: bad returns (the 2s at x 1, z 6..7) take the median of their footprint neighbours; then a 3x3 mean
// is rounded to whole tiers and held between 10 and 13 so every tier is flat.
const fixed = new Map();
for (const [k, r] of raw) {
  const [x, z] = k.split(",").map(Number);
  if (r >= 9) { fixed.set(k, r); continue; }
  const n = NB8.map(([dx, dz]) => raw.get(key(x + dx, z + dz))).filter((v) => v !== undefined && v >= 9).sort((a, b) => a - b);
  fixed.set(k, n[Math.floor(n.length / 2)]);
}
const tier = new Map();
for (const [k] of fixed) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const v = fixed.get(key(x + dx, z + dz)); if (v !== undefined) vals.push(v); }
  tier.set(k, Math.min(13, Math.max(10, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length))));
}
const R = (x, z) => tier.get(key(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OUT = { N: "north", S: "south", W: "west", E: "east" };
// the directions in which a cell's side is open to air at height y: no footprint cell beside it, or one whose roof is below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d]; const nx = x + dx, nz = z + dz;
  return !inFP(nx, nz) || R(nx, nz) <= y;
});

// the front is the side with the longest open face at the first storey
const faceLen = Object.fromEntries(Object.keys(DIRS).map((d) => [d, 0]));
for (const k of tier.keys()) { const [x, z] = k.split(",").map(Number); for (const d of exposed(x, z, 5)) faceLen[d]++; }
const front = Object.keys(faceLen).reduce((a, b) => (faceLen[b] > faceLen[a] ? b : a));
const along = (d, x, z) => (d === "N" || d === "S" ? x : z);
// each face's first along-face index, so the window rhythm starts at its corner
const uMin = {};
for (const k of tier.keys()) { const [x, z] = k.split(",").map(Number); for (const d of exposed(x, z, 5)) uMin[d] = Math.min(uMin[d] ?? 99, along(d, x, z)); }

// the entrance: the middle two cells of the front face's ground floor, a double door with a quartz surround
const frontCells = [...tier.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => exposed(x, z, 3).includes(front));
frontCells.sort((a, b) => along(front, a[0], a[1]) - along(front, b[0], b[1]));
const mid = Math.floor(frontCells.length / 2);
const doorPair = [frontCells[mid - 1], frontCells[mid]];
const doorU = doorPair.map(([x, z]) => along(front, x, z));
const isDoor = (x, z) => doorPair.some(([dx, dz]) => dx === x && dz === z);
const isSurround = (x, z) => frontCells.some(([fx, fz]) => along(front, fx, fz) === doorU[0] - 1 || along(front, fx, fz) === doorU[1] + 1)
  && exposed(x, z, 3).includes(front);

// storey bands by absolute height: plinth, string courses at the floors (1, 5, 9), windows between them, lintels above
const BAND = { 0: "plinth", 1: "string", 2: "win", 3: "win", 4: "lintel", 5: "string", 6: "win", 7: "win", 8: "lintel",
  9: "string", 10: "win", 11: "win", 12: "lintel" };
const FLOORS = [1, 5, 9];

const g = new Voxels([X, Y, Z]);
const lights = [];
const paneState = (d) => (d === "N" || d === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const k of tier.keys()) {
  const [x, z] = k.split(",").map(Number);
  const top = R(x, z);
  for (let y = 0; y < top; y++) {
    const E = exposed(x, z, y);
    const isTop = y === top - 1;
    if (isTop) { g.set(x, y, z, E.length ? "chiseled_quartz_block" : "stone"); continue; }
    if (!E.length) {
      if (y === 0) g.set(x, y, z, "stone");                       // foundation under the floor
      else if (FLOORS.includes(y)) g.set(x, y, z, "smooth_stone"); // a slab per storey
      continue;
    }
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }
    if (E.length >= 2 && !(E.includes(front) && (isDoor(x, z) || isSurround(x, z)))) { g.set(x, y, z, "smooth_quartz"); continue; }   // quoins and notches
    const d = E.includes(front) ? front : E[0], band = BAND[y];
    if (d === front && isDoor(x, z) && (y === 2 || y === 3)) {
      const i = doorPair.findIndex(([dx, dz]) => dx === x && dz === z);
      g.set(x, y, z, "iron_door", { facing: OUT[d], half: y === 2 ? "lower" : "upper", hinge: i === 0 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (d === front && isSurround(x, z) && y <= 4) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (band === "plinth") { g.set(x, y, z, "polished_andesite"); continue; }
    if (band === "win") {
      const u = along(d, x, z) - uMin[d];
      if (u % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }   // a pier every three cells
      g.set(x, y, z, "glass_pane", paneState(d));
      // a warm light behind some panes, on the room side
      const [dx, dz] = DIRS[d]; const ix = x - dx, iz = z - dz;
      if (inFP(ix, iz) && R(ix, iz) > y && (u + y) % 6 === 1 && y !== 3) lights.push([ix, y, iz, "glowstone"]);
      continue;
    }
    g.set(x, y, z, "smooth_quartz");                                    // string courses and lintels
  }
}

for (const [x, y, z, b] of lights) if (!g.get(x, y, z)) g.set(x, y, z, b);

// roof plant: two small plant boxes on the core's deck
for (const [x, z] of [[8, 3], [9, 3], [8, 4], [9, 4], [11, 5], [12, 5]]) {
  if (inFP(x, z) && R(x, z) === 13 && !exposed(x, z, 12).length) for (let y = 13; y <= 14; y++) g.set(x, y, z, "stone_bricks");
}

console.log("door", g.get(doorPair[0][0], 2, doorPair[0][1]), g.get(doorPair[1][0], 3, doorPair[1][1]));
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC73317.nbt";
console.log({ front, faceLen, door: doorPair, lights: lights.length, ...g.save(out) });
