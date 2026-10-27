// Elim Christian Centre - City, from the footprint record. Decided here: a concrete-framed church and community hall of
// the 1970s-80s: cream-rendered walls (smooth quartz) on a 4-block storey grid that follows the ground, ribbon-glazed bays
// (2 wide, 2 high, quartz piers between), polished-andesite base course and storey lines, a cornice and gravel-grey flat
// roofs stepping 13 -> 15 -> 16 blocks, plant boxes on the low wing, a glazed core tower on the highest tier carrying an
// iron cross, and a recessed entrance under a stone canopy. Warm glowstone and shroomlight sit in some windows for dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const SIZE = [61, 29, 56];
const cells = JSON.parse(readFileSync(`${DIR}/way_291058287.cells.json`, "utf8"));

const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const foot = new Set(), gRaw = new Map(), rRaw = new Map();
for (const [x, z, gd, roofH] of cells) { foot.add(k2(x, z)); gRaw.set(k2(x, z), gd); rRaw.set(k2(x, z), roofH); }
const inFoot = (x, z) => foot.has(k2(x, z));

// Lidar to clean massing: ground and roof are 5x5 means (noise out); the roof snaps to three flat tiers
const avg = (m, x, z) => { let s = 0, n = 0; for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const v = m.get(k2(x + dx, z + dz)); if (v !== undefined) { s += v; n++; } } return s / n; };
const GROUND = new Map(), ROOF = new Map();
for (const k of foot) {
  const [x, z] = k.split(",").map(Number);
  GROUND.set(k, Math.round(avg(gRaw, x, z)));
  const r = avg(rRaw, x, z);
  ROOF.set(k, r < 13.6 ? 13 : r < 15.5 ? 15 : 16);
}
const gnd = (x, z) => GROUND.get(k2(x, z)), roof = (x, z) => ROOF.get(k2(x, z));

// Tower: the largest square of tier-16 cells around the core's centroid; it stands on the core's roof cap
const core = [...ROOF].filter(([, t]) => t === 16).map(([k]) => k.split(",").map(Number));
const cx = Math.round(core.reduce((s, p) => s + p[0], 0) / core.length), cz = Math.round(core.reduce((s, p) => s + p[1], 0) / core.length);
let TR = 0;
for (let r = 4; r >= 2 && !TR; r--) {
  let ok = true;
  for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (!inFoot(cx + dx, cz + dz) || roof(cx + dx, cz + dz) !== 16) ok = false;
  if (ok) TR = r;
}
const TOP = 23, TBASE = 16;       // tower: floors at 16 and 20, cap at 23, the cross above
const inTower = (x, z) => TR > 0 && Math.abs(x - cx) <= TR && Math.abs(z - cz) <= TR;

// a cell is part of the building at height y if its column reaches there (the tower's column runs to its cap)
const occupied = (x, y, z) => inFoot(x, z) && (inTower(x, z) ? y <= TOP : y <= roof(x, z) - 1);

// what a cell holds at height y: foundation below ground; a floor slab every 4 blocks from the cell's own ground (the
// tower's from 16); walls between; a roof cap on top
const kindAt = (x, y, z) => {
  if (inTower(x, z) && y > 15) { if (y > TOP) return null; return y === TOP ? "cap" : (y - TBASE) % 4 === 0 ? "floor" : "wall"; }
  const gd = gnd(x, z), r = roof(x, z);
  if (y < gd) return "found";
  if (y === r - 1) return "cap";
  if (y > r - 1) return null;
  return (y - gd) % 4 === 0 ? "floor" : "wall";
};

const FACES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exterior = (x, y, z) => FACES.find(([dx, dz]) => !occupied(x + dx, y, z + dz));
const hash = (x, y, z) => ((x * 73 + y * 151 + z * 37) * 2654435761 >>> 0) % 100;

// a wall cell on an exposed face: cornice at the top, a 2-high glazed band in bays of 2 with quartz piers, else quartz
const wallBlock = (x, y, z, [dx]) => {
  const T = inTower(x, z) && y > 15;
  if (y === (T ? TOP - 1 : roof(x, z) - 2)) return "polished_andesite";
  const off = (y - (T ? TBASE : gnd(x, z))) % 4;
  const u = dx !== 0 ? z : x;                       // along an east/west face the bays run in z, else in x
  if ((off === 1 || off === 2) && (u % 4 === 1 || u % 4 === 2)) {
    const h = hash(x, y, z);
    return h % 11 === 0 ? "glowstone" : h % 37 === 1 ? "shroomlight" : "light_blue_stained_glass_pane";
  }
  return "smooth_quartz";
};

const g = new Voxels(SIZE);
const M = new Map();
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= SIZE[0] || y >= SIZE[1] || z >= SIZE[2]) return;
  M.set(k3(x, y, z), { block, state });
};

for (const k of foot) {
  const [x, z] = k.split(",").map(Number);
  const top = inTower(x, z) ? TOP : roof(x, z) - 1;
  for (let y = 0; y <= top; y++) {
    const kind = kindAt(x, y, z);
    if (kind === "found") put(x, y, z, "stone_bricks");
    else if (kind === "floor") put(x, y, z, "polished_andesite");
    else if (kind === "cap") put(x, y, z, "light_gray_concrete");
    else if (kind === "wall") { const f = exterior(x, y, z); if (f) put(x, y, z, wallBlock(x, y, z, f)); }
  }
}

// Plant boxes on the low wing's roof
for (const k of foot) {
  const [x, z] = k.split(",").map(Number);
  if (roof(x, z) === 13 && [3, 4].includes(x % 10) && [3, 4].includes(z % 8)) put(x, 13, z, "gray_concrete");
}

// Entrance: an east-facing boundary cell near the middle of the front, lowest ground preferred. The door sits in the
// wall; a recessed porch one cell in is roofed by a stone canopy carried on two piers.
const entranceCands = [...foot].map((k) => k.split(",").map(Number)).filter(([x, z]) =>
  !inFoot(x + 1, z) && [[0, -1], [0, 1], [-1, -1], [-1, 0], [-1, 1]].every(([dx, dz]) => inFoot(x + dx, z + dz)));
entranceCands.sort((a, b) => (Math.abs(a[1] - 28) + 3 * gnd(a[0], a[1])) - (Math.abs(b[1] - 28) + 3 * gnd(b[0], b[1])));
const [ex, ez] = entranceCands[0];
const eg = gnd(ex, ez);
const DOOR = { facing: "east", hinge: "left", open: "false", powered: "false" };
put(ex, eg + 1, ez, "dark_oak_door", { ...DOOR, half: "lower" });
put(ex, eg + 2, ez, "dark_oak_door", { ...DOOR, half: "upper" });
for (const dz of [-1, 0, 1]) for (const dx of [0, -1]) put(ex + dx, eg + 3, ez + dz, "stone_bricks");
for (const dz of [-1, 1]) for (const y of [eg + 1, eg + 2]) put(ex - 1, y, ez + dz, "polished_andesite");

// The cross on the tower: an iron column above the cap with its arms at the third block
if (TR > 0) {
  for (let y = TOP + 1; y <= TOP + 4; y++) put(cx, y, cz, "iron_block");
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(cx + dx, TOP + 3, cz + dz, "iron_block");
}

// Panes join the glass and solid blocks beside them in their plane (doors do not join)
const joins = (x, y, z) => { const e = M.get(k3(x, y, z)); return !!e && !e.block.includes("door"); };
for (const [k, e] of M) {
  if (!e.block.endsWith("_stained_glass_pane")) continue;
  const [x, y, z] = k.split(",").map(Number);
  const s = (b) => (b ? "true" : "false");
  e.state = { north: s(joins(x, y, z - 1)), south: s(joins(x, y, z + 1)), east: s(joins(x + 1, y, z)), west: s(joins(x - 1, y, z)), waterlogged: "false" };
}

for (const [k, { block, state }] of M) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state); }

// Checks: nothing unsupported below (the cross arms and the porch canopy's centre hang off their neighbours only)
const unsupported = [];
for (const [k] of M) {
  const [x, y, z] = k.split(",").map(Number);
  if (y > 0 && !M.has(k3(x, y - 1, z))) unsupported.push([x, y, z]);
}
const counts = {};
for (const { block } of M.values()) counts[block] = (counts[block] || 0) + 1;
console.log("tower", TR > 0 ? { cx, cz, half: TR } : "none", "entrance", { ex, ez, eg }, "blocks", M.size);
console.log("unsupported", unsupported.length, JSON.stringify(unsupported.slice(0, 12)));
console.log(JSON.stringify(counts));

const res = g.save(`${DIR}/way_291058287.nbt`);
console.log("saved", res);
