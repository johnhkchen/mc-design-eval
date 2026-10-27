// Princeton Apartments, Mt Eden side of the CBD: a 1970s reinforced-concrete apartment block (white concrete frame, light
// grey slab bands and mullions, tinted glass), a 48-block terrace on the outer ring and a taller core rising to 64, a lobby
// on the south face, and a lift overrun. Storey lines sit on multiples of 4 blocks (about 3.3 m a floor).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_907192900.cells.json", "utf8"));   // [x, z, ground, roof]
const SX = 45, SY = 85, SZ = 39;
const k = (x, z) => `${x},${z}`;
const up4 = (v) => Math.ceil(v / 4) * 4;
const VEC = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const FACE = { N: "north", S: "south", E: "east", W: "west" };
const ORDER = ["S", "E", "N", "W"];   // which face wins at a corner

// 1. Smooth the lidar roof: 3x3 lower median over footprint cells, then three tiers (tower, wing, annex)
const raw = new Map(cells.map(([x, z, g, r]) => [k(x, z), { x, z, g, r }]));
const median = (a) => { a = [...a].sort((p, q) => p - q); return a[(a.length - 1) >> 1]; };
const smoothed = new Map();
for (const c of raw.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = raw.get(k(c.x + dx, c.z + dz)); if (n) near.push(n.r); }
  smoothed.set(k(c.x, c.z), median(near));
}

// 2. Distance in from the outline (outer cells = 1), for a terrace ring that steps the tower in
const dist = new Map(); const queue = [];
for (const c of raw.values()) {
  const edge = Object.values(VEC).some(([dx, dz]) => !raw.has(k(c.x + dx, c.z + dz)));
  if (edge) { dist.set(k(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i]; const dc = dist.get(k(c.x, c.z));
  for (const [dx, dz] of Object.values(VEC)) {
    const n = raw.get(k(c.x + dx, c.z + dz));
    if (n && !dist.has(k(n.x, n.z))) { dist.set(k(n.x, n.z), dc + 1); queue.push(n); }
  }
}

// 3. Massing: each cell's column runs from its ground (g) to its top (T), a multiple of 4 that is at least one storey above g
const C = new Map();
for (const c of raw.values()) {
  const m = smoothed.get(k(c.x, c.z));
  const tier = m >= 36 ? "tower" : m <= 6 ? "annex" : "wing";
  const d = dist.get(k(c.x, c.z));
  const top = tier === "tower" ? (d <= 2 ? 48 : 64) : tier === "wing" ? 8 : 4;
  C.set(k(c.x, c.z), { x: c.x, z: c.z, g: c.g, T: up4(Math.max(top, c.g + 4)), d, tier });
}
const cellAt = (x, z) => C.get(k(x, z));

// A face is open to the air at height y when the cell beyond it has no building column there (outline, or a lower roof)
const openAt = (c, y, dir) => { const [dx, dz] = VEC[dir]; const n = cellAt(c.x + dx, c.z + dz); return !n || y >= n.T; };
const wallFace = (c, y) => (y < c.g || y >= c.T ? null : ORDER.find((dir) => openAt(c, y, dir)) ?? null);
const tangent = (c, dir) => (dir === "N" || dir === "S" ? c.x : c.z);
const storeyOf = (y) => Math.floor(y / 4);

// 4. The entrance: a lobby door on the south face, near the middle, on a cell that starts a storey (its door and lantern fit)
let ENTR = null;
for (const c of C.values()) {
  if (c.g % 4 > 1 || !openAt(c, c.g, "S") || c.T < c.g + 8) continue;
  const score = Math.abs(c.x - 22) + c.g;
  if (!ENTR || score < ENTR.score) ENTR = { ...c, score };
}

// 5. Roof masses that are not part of a column: a lift overrun on the core, and plant enclosures on the terrace
const roofMass = new Map();
const setRoof = (x, y, z, block, state) => roofMass.set(`${x},${y},${z}`, [block, state]);
const coreCells = [...C.values()].filter((c) => c.T === 64);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const cx = mean(coreCells.map((c) => c.x)), cz = mean(coreCells.map((c) => c.z));
const boxOk = (x0, z0, n) => { for (let z = z0; z < z0 + n; z++) for (let x = x0; x < x0 + n; x++) { const c = cellAt(x, z); if (!c || c.T !== 64 || c.d < 3) return false; } return true; };
let lift = null;
for (const c of coreCells) {
  if (!boxOk(c.x - 2, c.z - 2, 5)) continue;
  const dd = Math.hypot(c.x - cx, c.z - cz);
  if (!lift || dd < lift.dd) lift = { x: c.x, z: c.z, dd };
}
if (lift) {
  for (let z = lift.z - 2; z <= lift.z + 2; z++) for (let x = lift.x - 2; x <= lift.x + 2; x++) {
    const ex = Math.abs(x - lift.x) === 2, ez = Math.abs(z - lift.z) === 2;
    if (!ex && !ez) continue;                              // hollow inside
    for (let y = 64; y < 68; y++) {
      const mid = (x === lift.x || z === lift.z);
      const glass = mid && (y === 65 || y === 66);
      setRoof(x, y, z, glass ? "light_blue_stained_glass" : "light_gray_concrete");
    }
  }
  for (let z = lift.z - 2; z <= lift.z + 2; z++) for (let x = lift.x - 2; x <= lift.x + 2; x++) setRoof(x, 67, z, "light_gray_concrete");
}
for (const c of C.values()) {
  if (c.T !== 48 || c.d !== 2 || (c.x * 3 + c.z * 5) % 19 !== 0) continue;   // plant boxes on the terrace
  if (![[1, 0], [0, 1], [1, 1]].every(([dx, dz]) => cellAt(c.x + dx, c.z + dz)?.T === 48)) continue;
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) for (let y = 48; y < 50; y++) setRoof(c.x + dx, y, c.z + dz, "gray_concrete");
}

// 6. What a block is: foundation below the ground, then the column (roof, parapet, slabs, facade, or air behind the glass)
const lit = (w, y, dir) => {
  const p = tangent(w, dir), s = y % 4;
  return s === 1 && p % 3 !== 0 && [3, 4, 7].includes((p * 7 + storeyOf(y) * 5) % 9);   // about a third of the windows lit
};
function doorOf(c, y, dir) {
  if (!ENTR || c.x !== ENTR.x || c.z !== ENTR.z || dir !== "S") return null;
  const g = ENTR.g;
  if (y === g) return ["iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
  if (y === g + 1) return ["iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
  if (y === g + 2) return ["lantern", { hanging: "true", waterlogged: "false" }];
  return null;
}
function facade(c, y, dir) {
  const door = doorOf(c, y, dir);
  if (door) return door;
  if (ENTR && dir === "S" && c.z === ENTR.z && Math.abs(c.x - ENTR.x) === 1 && y >= ENTR.g + 1 && y <= ENTR.g + 2) return ["smooth_stone"];
  if (y === c.g) return ["stone_bricks"];                  // base course at the ground line
  const s = y % 4;
  if (s === 0) return ["light_gray_concrete"];              // floor slab band
  if (s === 3) return ["white_concrete"];                   // spandrel
  if (tangent(c, dir) % 3 === 0) return ["light_gray_concrete"];   // mullion / frame
  return ["light_blue_stained_glass"];
}
function glowBehind(c, y) {
  // air inside the building, one cell in from a window whose glass wants a warm light behind it
  for (const dir of ["S", "E", "N", "W"]) {
    const [dx, dz] = VEC[dir];
    const w = cellAt(c.x + dx, c.z + dz);
    if (w && wallFace(w, y) === dir && lit(w, y, dir)) return ["glowstone"];
  }
  return null;
}
function spec(x, y, z) {
  const rm = roofMass.get(`${x},${y},${z}`); if (rm) return rm;
  const c = cellAt(x, z); if (!c) return null;
  if (y < c.g) return ["stone_bricks"];                      // foundation: solid from y 0 up to the ground
  if (y >= c.T) {
    if (y === c.T && ["N", "S", "E", "W"].some((dir) => openAt(c, c.T - 1, dir))) return ["light_gray_concrete"];   // parapet
    return null;
  }
  if (y === c.T - 1) return ["smooth_stone"];               // roof deck
  const dir = wallFace(c, y);
  if (dir) return facade(c, y, dir);
  if (y % 4 === 0) return ["light_gray_concrete"];          // floor slab, the whole footprint
  return glowBehind(c, y);
}

// 7. Write the volume
const g = new Voxels([SX, SY, SZ]);
let placed = 0;
for (let z = 0; z < SZ; z++) for (let y = 0; y < SY; y++) for (let x = 0; x < SX; x++) {
  const s = spec(x, y, z); if (!s) continue;
  g.set(x, y, z, s[0], s[1]); placed++;
}
const out = g.save(DIR + "way_907192900.nbt");
console.log(JSON.stringify({ cells: C.size, placed, ...out, entrance: ENTR && { x: ENTR.x, z: ENTR.z, g: ENTR.g }, lift: lift && { x: lift.x, z: lift.z } }));
