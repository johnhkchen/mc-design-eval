// 1285 Avenue of the Americas, the Equitable Life Assurance Society building, 1961: a dark-glass curtain-wall slab
// (the Miesian office tower of its years) on a stepped stone podium. The lidar roofs are median-smoothed over 3x3 and
// snapped to four flat tiers: 42 (the low wings), 60 and 72 (the mid wing and core) and 147 (the slab). Storeys are 3
// blocks: a spandrel course, two rows of tinted glass between iron mullions, an air gap behind the glass, a floor slab
// per storey. The base is a granite plinth with storefront glass and a double entrance on the Avenue face (east).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1023158.cells.json`, "utf8"));
const [W, D, H] = [106, 49, 159];
const TOWER = 147, MAST_TOP = 158;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Median of the 3x3 lidar roofs, then snap to the four tiers (0 = open court, no building above).
const tier = (r) => (r < 15 ? 0 : r < 52 ? 42 : r < 69 ? 60 : r < 100 ? 72 : TOWER);
const cell = new Map();
for (const c of raw.values()) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = raw.get(key(c.x + dx, c.z + dz)); if (n) v.push(n.r); }
  v.sort((a, b) => a - b);
  cell.set(key(c.x, c.z), { x: c.x, z: c.z, g: c.g, R: tier(v[v.length >> 1]) });
}
const at = (x, z) => cell.get(key(x, z));
const R = (x, z) => at(x, z)?.R ?? -1;

// Exposed faces: the cell's neighbour is outside the footprint or lower (a setback or court wall).
const exposed = (c) => DIRS.filter(([dx, dz]) => R(c.x + dx, c.z + dz) < c.R);
const perimeter = (c) => exposed(c).length > 0;
// All cells within n of (x, z) are at tier t: the cell is at least n deep inside its massing.
const deep = (x, z, n, t) => { for (let dx = -n; dx <= n; dx++) for (let dz = -n; dz <= n; dz++) if (R(x + dx, z + dz) !== t) return false; return true; };

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < H) v.set(x, y, z, block, state); };

const GLASS = "gray_stained_glass", BASE_GLASS = "black_stained_glass", MULLION = "iron_block";
const SPANDREL = "polished_andesite", FLOOR = "smooth_stone", ROOF = "gray_concrete", CORNICE = "stone_bricks";
const PLINTH = "polished_granite", FOUNDATION = "stone", EQUIP = "light_gray_concrete";
const LIGHT = "glowstone";
const ENTRANCE = [[W - 1, 23], [W - 1, 24]];   // double doors on the Avenue face (east)
const isEntrance = (x, z) => ENTRANCE.some(([ex, ez]) => ex === x && ez === z);

// Along the wall: mullions every 3 blocks on each exposed face (a corner takes both).
const mullion = (c, ex) => ex.some(([dx]) => dx !== 0) ? (c.z % 3 === 0) : (c.x % 3 === 0);
const windowAt = (c, ex) => ex.some(([dx, dz]) => (dx !== 0 ? c.z : c.x) % 3 === 0);

for (const c of cell.values()) {
  const { x, z, g, R: top } = c;
  for (let y = 0; y < g; y++) put(x, y, z, FOUNDATION);            // foundation up to the lowest ground
  if (top === 0) { put(x, g, z, FLOOR); continue; }                 // open court: paving at ground level
  const ex = exposed(c), outer = ex.length > 0;
  for (let y = 0; y < top; y++) {
    const phase = y % 3, storey0 = y < 3;
    if (y === top - 1) { put(x, y, z, outer ? CORNICE : ROOF); continue; }  // roof covering / cornice
    if (y === 0) { put(x, y, z, outer ? PLINTH : FLOOR); continue; }          // plinth or lobby floor
    if (phase === 0) { put(x, y, z, outer ? SPANDREL : FLOOR); continue; }     // spandrel / floor slab
    if (!outer) continue;                                                       // air gap behind the glass
    put(x, y, z, mullion(c, ex) ? MULLION : (storey0 ? BASE_GLASS : GLASS));
  }
  // Parapet on the outside edge of every tier.
  if (outer && top > 0 && ex.some(([dx, dz]) => R(x + dx, z + dz) === -1)) put(x, top, z, "stone_brick_wall");
}

// Entrances on the Avenue face: iron doors in the glazed base, threshold granite under them.
for (const [x, z] of ENTRANCE) {
  const hinge = z === ENTRANCE[0][1] ? "left" : "right";
  for (const half of ["lower", "upper"]) put(x, half === "lower" ? 1 : 2, z, "iron_door", { facing: "east", half, hinge, open: "false", powered: "false" });
}

// Warm lights behind some windows: a glowstone on the air side of the glass, at a deterministic pick of about one in ten.
for (const c of cell.values()) {
  if (c.R === 0 || !perimeter(c)) continue;
  const ex = exposed(c);
  for (let y = 4; y < c.R - 1; y++) {
    const phase = y % 3; if (phase === 0 || (y < 3)) continue;
    if (mullion(c, ex) || isEntrance(c.x, c.z)) continue;
    const k = Math.floor(y / 3);
    if ((c.x * 7 + c.z * 13 + k * 5) % 11 !== 0) continue;
    const [dx, dz] = [-ex[0][0], -ex[0][1]];                            // inward, away from the first exposed face
    const ic = at(c.x + dx, c.z + dz);
    if (!ic || ic.R <= y + 1 || perimeter(ic)) continue;
    put(ic.x, y, ic.z, LIGHT);
  }
}

// Roof plant on the podium tiers: 2x2 mechanical boxes, two blocks high, set in from the edge.
for (const c of cell.values()) {
  if (c.R !== 42 && c.R !== 60 && c.R !== 72) continue;
  if (c.x % 9 !== 4 || c.z % 7 !== 3) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => at(c.x + dx, c.z + dz));
  if (block.some((b) => !b || b.R !== c.R || perimeter(b))) continue;
  for (const b of block) { put(b.x, c.R, b.z, EQUIP); put(b.x, c.R + 1, b.z, EQUIP); }
}

// The slab's crown: a set-in penthouse of stone and bronze glass, a cap, and a lightning-rod mast to the box's top.
for (const c of cell.values()) {
  if (c.R !== TOWER || !deep(c.x, c.z, 3, TOWER)) continue;
  const edge = !deep(c.x, c.z, 4, TOWER);
  for (let y = TOWER; y <= TOWER + 3; y++) {
    if (y === TOWER + 3) put(c.x, y, c.z, CORNICE);
    else if (!edge) continue;
    else put(c.x, y, c.z, y === TOWER ? SPANDREL : y === TOWER + 3 ? CORNICE : (c.x % 3 === 0 || c.z % 3 === 0) ? MULLION : GLASS);
  }
  put(c.x, TOWER + 4, c.z, CORNICE);
}
const mx = 80, mz = 24;
for (let y = TOWER + 5; y <= MAST_TOP; y++) put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Nothing floats: every block must join the ground through blocks that touch.
const seen = new Set(), stack = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (v.get(x, 0, z)) { stack.push([x, 0, z]); seen.add(`${x},0,${z}`); }
while (stack.length) {
  const [x, y, z] = stack.pop();
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const n = [x + dx, y + dy, z + dz], k = n.join(",");
    if (seen.has(k) || !v.get(...n)) continue;
    seen.add(k); stack.push(n);
  }
}
const total = v.count();
console.log(`blocks ${total}, grounded ${seen.size}, floating ${total - seen.size}`);

const out = v.save(`${DIR}/NYC1023158.nbt`);
console.log(`saved ${out.blocks} blocks, palette ${out.palette}`);
