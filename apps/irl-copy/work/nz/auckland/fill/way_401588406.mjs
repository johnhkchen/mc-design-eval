// Mt Eden-side mid-rise office block, c.1970s-80s: a stone plinth, a white precast frame with tinted-glass window bays,
// seven storeys stepping down in four clean lidar tiers (30 / 27 / 24 / 17), a shopfront and a door on the north face,
// warm lights behind some glass, and a roof plant room on the top tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(`${DIR}way_401588406.cells.json`, "utf8"));
const SIZE = [38, 43, 36];

// lidar roof heights → four flat tiers, so the mass reads as stepped storeys rather than noise
const tierOf = (r) => (r >= 29 ? 30 : r >= 26 ? 27 : r >= 22 ? 24 : 17);
const col = new Map();                                   // "x,z" → { g: ground, t: tier top (roof surface y) }
for (const [x, z, g, r] of cells) col.set(`${x},${z}`, { g, t: tierOf(r) });
const at = (x, z) => col.get(`${x},${z}`);
const inEnv = (x, y, z) => { const c = at(x, z); return !!c && y >= 0 && y < c.t; };
const SIDES = [
  { d: [0, -1], facing: "north" }, { d: [0, 1], facing: "south" },
  { d: [1, 0], facing: "east" }, { d: [-1, 0], facing: "west" },
];
const exposed = (x, y, z) => SIDES.filter((s) => !inEnv(x + s.d[0], y, z + s.d[1]));
const B = (name, state) => ({ name, state });
const key = (x, y, z) => `${x},${y},${z}`;
const ov = new Map();                                    // door, hood, lights, plant room: placed over the envelope

// the envelope's own skin: a 1-block shell with an air gap behind the glass and a slab on every storey
function kindOf(x, y, z) {
  const c = at(x, z);
  if (!inEnv(x, y, z)) return null;
  if (y < c.g) return B("stone");                        // foundation under the ground
  const rel = (y - c.g) % 4;                             // 0 floor line, 1-2 glass, 3 spandrel
  const ground = y < c.g + 4;
  const walls = exposed(x, y, z);
  if (!walls.length) return rel === 0 || y === c.t - 1 ? B("light_gray_concrete") : null;
  if (y === c.t - 1) return B("smooth_stone");           // cornice / parapet
  if (y === c.g) return B("stone_bricks");               // base course
  if (rel === 0) return B("light_gray_concrete");        // storey line
  if (ground && rel === 3) return B("polished_andesite"); // shopfront fascia
  const bayIdx = walls[0].d[0] !== 0 ? z : x;            // pier every 4 blocks along the face (corners always)
  if (walls.length > 1 || bayIdx % 4 === 0 || rel === 3) return B("white_concrete");
  return ground ? B("glass_pane") : B("gray_stained_glass_pane");
}

const blockAt = (x, y, z) => ov.get(key(x, y, z)) ?? kindOf(x, y, z);

// entrance: the lowest street-level cell on the north face, nearest the middle of the block
let door = null;
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  if (!exposed(x, c.g + 1, z).some((s) => s.facing === "north")) continue;
  const score = c.g * 100 + Math.abs(x - 19);
  if (!door || score < door.score) door = { x, z, g: c.g, score };
}
const lower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
ov.set(key(door.x, door.g + 1, door.z), B("dark_oak_door", lower));
ov.set(key(door.x, door.g + 2, door.z), B("dark_oak_door", { ...lower, half: "upper" }));
for (const dx of [-1, 0, 1]) {                           // a stone hood over the door and its two neighbours
  const x = door.x + dx;
  if (dx && !exposed(x, door.g + 3, door.z).some((s) => s.facing === "north")) continue;
  ov.set(key(x, door.g + 3, door.z), B("stone_brick_slab", { type: "top", waterlogged: "false" }));
}

// warm light behind some glass: the interior cell behind a pane is air, so a lamp there shows through
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.g + 1; y < c.t - 1; y++) {
    const rel = (y - c.g) % 4;
    if (rel === 0 || rel === 3) continue;
    const walls = exposed(x, y, z);
    if (!walls.length || kindOf(x, y, z)?.name === "white_concrete") continue;
    const inward = [x - walls[0].d[0], z - walls[0].d[1]];
    const h = (x * 31 + z * 17 + y * 7) % 11;
    if (!inEnv(inward[0], y, inward[1]) || kindOf(inward[0], y, inward[1]) || ov.has(key(inward[0], y, inward[1]))) continue;
    if (y < c.g + 4 && h % 4 === 0) ov.set(key(inward[0], y, inward[1]), B("glowstone"));
    else if (y >= c.g + 4 && h === 0) ov.set(key(inward[0], y, inward[1]), B("glowstone"));
    else if (h === 5) ov.set(key(inward[0], y, inward[1]), B("shroomlight"));
  }
}

// roof plant room on the top tier: a louvred box standing on the tier-30 roof surface
const P = { x0: 15, x1: 20, z0: 14, z1: 19, y0: 30 };
for (let x = P.x0 - 1; x <= P.x1 + 1; x++) for (let z = P.z0 - 1; z <= P.z1 + 1; z++) {
  if (at(x, z)?.t !== 30) throw new Error(`plant room base not on the tier-30 roof at ${x},${z}`);
}
for (let x = P.x0; x <= P.x1; x++) for (let z = P.z0; z <= P.z1; z++) {
  const edge = x === P.x0 || x === P.x1 || z === P.z0 || z === P.z1;
  for (let y = P.y0; y < P.y0 + 3; y++) {
    if (!edge) continue;
    const louvre = y === P.y0 + 1 && (x + z) % 2 === 0;
    ov.set(key(x, y, z), B(louvre ? "iron_bars" : "light_gray_concrete"));
  }
  ov.set(key(x, P.y0 + 3, z), B("polished_andesite"));  // the lid over the box
}

const g = new Voxels(SIZE);
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (let x = 0; x < SIZE[0]; x++) for (let y = 0; y < SIZE[1]; y++) for (let z = 0; z < SIZE[2]; z++) {
  const b = blockAt(x, y, z);
  if (!b) continue;
  let state = b.state;
  if (b.name.endsWith("glass_pane")) {                  // panes join their neighbours: the bay reads as one band of glass
    state = { waterlogged: "false" };
    for (const [dir, [dx, dz]] of Object.entries(DIRS)) state[dir] = blockAt(x + dx, y, z + dz) ? "true" : "false";
  }
  g.set(x, y, z, b.name, state);
}
g.save(`${DIR}way_401588406.nbt`);
console.log("built", g.count(), "blocks; door at", door.x, door.g + 1, door.z);
