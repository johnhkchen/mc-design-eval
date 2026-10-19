// DC81261: 909 New Jersey Ave SE, Washington DC 20003 (Capitol Hill South, residential multifamily). Read as a 1920s
// red-brick walk-up apartment block: a four-storey brick block with stone string courses and lintels, a cornice and a
// parapet round its roof, a one-storey brick wing on the west, a penthouse storey on the tall block (the lidar's 19),
// and a stoop with a canopy on the entrance. Lidar roof heights are median-smoothed (3x3 over the footprint) and
// snapped to three storey tiers of 4 blocks (3 of room + 1 course): 4 (one storey), 17 (four storeys + cornice) and
// 19 (four storeys + penthouse). Every column is solid from y 0 up to its tier, so nothing floats; the floors are
// full-footprint slabs, the rooms are air behind the glass, and the walls are the cells with an open side.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81261.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81261.nbt";
const [W, H, D] = [22, 31, 31];

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const inBox = (x, z) => x >= 0 && x < W && z >= 0 && z < D;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Palette: red brick walls, pale stone trim, glass in the bays, dark oak doors, warm lamps behind some glass.
const BRICK = "bricks", STONE = "stone_bricks", SLAB = "smooth_stone", GLASS = "glass_pane";
const PARAPET = "stone_brick_wall", DOOR = "dark_oak_door", LANTERN = "lantern", LAMP = "glowstone";
const STAIR = "stone_brick_stairs", ROOF_UNIT = "light_gray_concrete";

// Smoothed roof: the median of the 3x3 around each footprint cell, then snapped to a storey tier.
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = F.get(key(x + dx, z + dz)); if (n) v.push(n.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = (h) => (h <= 5 ? 4 : h <= 9 ? 8 : h <= 15 ? 12 : h <= 17 ? 17 : 19);
const T = new Map();
for (const c of F.values()) T.set(key(c.x, c.z), tier(median(c.x, c.z)));
const top = (x, z) => T.get(key(x, z)) ?? 0;      // outside the footprint is 0: an open side

// A storey level y of a cell is a wall where a side is open: outside the footprint, or lower than this level.
const openDirs = (x, y, z) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) <= y);
const perimeter = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));
const interiorTop = (x, z, t) => top(x, z) === t && DIRS.every(([dx, dz]) => top(x + dx, z + dz) >= t);

const g = new Voxels([W, H, D]);

// Columns: solid foundation below each cell's ground, then per storey a string course (r0), two rows of window
// band (r1, r2) and a lintel course (r3); the top course is the cornice on the open sides and the roof elsewhere.
for (const c of F.values()) {
  const { x, z } = c, t = top(x, z);
  for (let y = 0; y < t; y++) {
    if (y < c.g) { g.set(x, y, z, STONE); continue; }
    const open = openDirs(x, y, z);
    if (y === t - 1) { g.set(x, y, z, open.length ? STONE : SLAB); continue; }
    const r = y % 4, k = Math.floor(y / 4);
    if (!open.length) { if (r === 0 || r === 3) g.set(x, y, z, SLAB); continue; }   // interior: floor and ceiling slabs, air between
    if (r === 0 || r === 3) { g.set(x, y, z, STONE); continue; }
    // A wall: corners are piers, and on a face the bays run along it: two glass cells, then a brick pier.
    const alongZ = open.some(([, dz]) => dz !== 0), alongX = open.some(([dx]) => dx !== 0);
    if (alongZ && alongX) { g.set(x, y, z, BRICK); continue; }
    const along = alongZ ? x : z;
    if (along % 3 === 0) { g.set(x, y, z, BRICK); continue; }
    g.set(x, y, z, GLASS);
    // Warm light behind some first-row panes: a glowstone in the room behind the glass (on the floor slab).
    if (r === 1 && (x * 5 + z * 11 + k * 3) % 7 === 0) {
      const [ox, oz] = open[0], ix = x - ox, iz = z - oz;
      if (inF(ix, iz) && !openDirs(ix, y, iz).length) g.set(ix, y, iz, LAMP);
    }
  }
  if (t >= 8 && perimeter(x, z)) g.set(x, t, z, PARAPET);      // a parapet on the roof edge of the taller blocks
}

// Roof: two chimney stacks and two plant boxes on the four-storey roof; a penthouse bulkhead and a unit on the tower.
const pick = (list, n) => [0.35, 0.7].slice(0, n).map((f) => list[Math.floor(f * list.length)]).filter(Boolean);
const roof17 = [...F.values()].filter((c) => interiorTop(c.x, c.z, 17)).sort((a, b) => a.x - b.x || a.z - b.z);
const chimneys = pick(roof17, 2);
for (const c of chimneys) { g.set(c.x, 17, c.z, BRICK); g.set(c.x, 18, c.z, BRICK); g.set(c.x, 19, c.z, STONE); }
const taken = new Set(chimneys.map((c) => key(c.x, c.z)));
const units17 = roof17.filter((c) => !taken.has(key(c.x, c.z)) && interiorTop(c.x + 1, c.z, 17) && !taken.has(key(c.x + 1, c.z)));
for (const c of pick(units17, 2)) { g.set(c.x, 17, c.z, ROOF_UNIT); g.set(c.x + 1, 17, c.z, ROOF_UNIT); }

const roof19 = [...F.values()].filter((c) => interiorTop(c.x, c.z, 19));
if (roof19.length) {
  const cx = roof19.reduce((s, c) => s + c.x, 0) / roof19.length, cz = roof19.reduce((s, c) => s + c.z, 0) / roof19.length;
  const has = (x, z) => roof19.some((c) => c.x === x && c.z === z);
  const boxes = roof19.filter((c) => has(c.x + 1, c.z) && has(c.x, c.z + 1) && has(c.x + 1, c.z + 1));
  boxes.sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
  const b = boxes[0];
  if (b) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {        // stair bulkhead: brick, stone cap
    for (let y = 19; y <= 20; y++) g.set(b.x + dx, y, b.z + dz, BRICK);
    g.set(b.x + dx, 21, b.z + dz, STONE);
  }
  const unit = roof19.find((c) => !(b && c.x >= b.x && c.x <= b.x + 1 && c.z >= b.z && c.z <= b.z + 1));
  if (unit) g.set(unit.x, 19, unit.z, ROOF_UNIT);
}

// Entrance: a single open side (outward), a free porch two cells out in the box, on the main block. Dark oak door
// in the bay, a stone stoop, posts and a canopy on the porch, and a lantern hung below the canopy.
const porch = [];
for (const c of F.values()) {
  if (top(c.x, c.z) < 17) continue;
  const open = openDirs(c.x, 1, c.z);
  if (open.length !== 1) continue;
  const [dx, dz] = open[0], px = dz, pz = dx;      // along the face
  const p1 = [c.x + dx, c.z + dz], p2 = [c.x + 2 * dx, c.z + 2 * dz];
  const ok = [p1, p2, [p1[0] + px, p1[1] + pz], [p1[0] - px, p1[1] - pz]].every(([x, z]) => inBox(x, z) && !inF(x, z));
  if (ok && c.g === 0) porch.push({ c, d: [dx, dz], p: [px, pz] });
}
const mid = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const cxAll = mid([...F.values()].map((c) => c.x)), czAll = mid([...F.values()].map((c) => c.z));
porch.sort((a, b) => Math.hypot(a.c.x - cxAll, a.c.z - czAll) - Math.hypot(b.c.x - cxAll, b.c.z - czAll));
const E = porch[0];
if (E) {
  const { c, d: [dx, dz], p: [px, pz] } = E, name = FACING[`${dx},${dz}`];
  g.set(c.x, 1, c.z, DOOR, { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, 2, c.z, DOOR, { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" });
  const sx = c.x + dx, sz = c.z + dz;                                          // the stoop, in front of the door
  g.set(sx, 0, sz, STAIR, { facing: name, half: "bottom", shape: "straight", waterlogged: "false" });
  for (const s of [-1, 1]) for (let y = 0; y <= 2; y++) g.set(sx + s * px, y, sz + s * pz, STONE);   // posts
  for (const s of [-1, 0, 1]) g.set(sx + s * px, 3, sz + s * pz, STONE);                               // canopy
  g.set(sx, 2, sz, LANTERN, { hanging: "true", waterlogged: "false" });
}

// Glass panes connect to whatever is beside them, as they do in game.
for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (g.get(x, y, z)?.block !== `minecraft:${GLASS}`) continue;
  const st = {};
  for (const [name, [dx, dz]] of [["east", [1, 0]], ["west", [-1, 0]], ["south", [0, 1]], ["north", [0, -1]]]) {
    st[name] = g.get(x + dx, y, z + dz) ? "true" : "false";
  }
  st.waterlogged = "false";
  g.set(x, y, z, GLASS, st);
}

const res = g.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, ${res.palette} palette entries; entrance ${E ? key(E.c.x, E.c.z) : "none"}; chimneys ${chimneys.length}`);
