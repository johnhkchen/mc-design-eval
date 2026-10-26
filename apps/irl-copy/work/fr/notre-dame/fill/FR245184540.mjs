// FR245184540: a Haussmann-era residential block on the Île de la Cité's left-bank edge. Plinth of rusticated stone,
// rez-de-chaussée plus four storeys of cream limestone in 5-block bands, a cornice, and a slate mansard with a flat top.
// Massing follows the lidar roof per cell: the mansard is inset by each cell's depth from the edge, lower wings stop at
// their own flat cap, and the foundation runs from y 0 up to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184540.cells.json`, "utf8"));

const STONE = "stone_bricks", BASE = "chiseled_stone_bricks", WALL = "calcite", COURSE = "smooth_quartz";
const FLOOR = "smooth_stone", SLATE = "deepslate_tiles", GLASS = "glass_pane", CHIMNEY = "bricks";
const BANDS = [5, 10, 15, 20];
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };
const DOOR_LIGHT = "shroomlight", LAMP = "glowstone";

// The lidar's roof heights step down in noisy ramps at the edges (16, 17, 19, 22, 25, 26, 27, 28): snap each to the
// nearest clean tier (a one-storey wing, a cornice-level wing, the mansard top) so the lower wings read as flat tiers.
const TIERS = [5, 19, 26, 29];
const snap = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) ? t : best));

const key = (x, z) => `${x},${z}`;
const byKey = new Map();
for (const [x, z, g, r] of cells) byKey.set(key(x, z), { x, z, g, r: snap(r) });
const at = (x, z) => byKey.get(key(x, z));

// depth: 0 on the outer ring (a side is open to outside), then one step inward per block (4-neighbour BFS)
const depth = new Map();
const queue = [];
for (const c of byKey.values()) {
  if (DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) { depth.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const n = at(c.x + dx, c.z + dz);
    if (n && !depth.has(key(n.x, n.z))) { depth.set(key(n.x, n.z), d + 1); queue.push(n); }
  }
}
const D = (c) => depth.get(key(c.x, c.z));
const exposed = (c) => DIRS.filter(([dx, dz]) => !at(c.x + dx, c.z + dz));

// The facade bay index runs along the wall: x on north/south faces, z on east/west faces.
const bayIndex = (c, [dx]) => (dx === 0 ? c.x : c.z);
const isCorner = (exp) => exp.some(([dx]) => dx) && exp.some(([, dz]) => dz);

// The street front: a plain bay on a north or south face, lowest ground first, nearest the middle of the block.
let door = null;
for (const c of byKey.values()) {
  if (D(c) !== 0) continue;
  const exp = exposed(c);
  if (isCorner(exp) || !exp.some(([, dz]) => dz) || exp.some(([dx]) => dx)) continue;
  const [dx, dz] = exp[0];
  if (bayIndex(c, [dx, dz]) % 3 !== 1) continue;
  const score = c.g * 100 + Math.abs(c.x - 14);
  if (!door || score < door.score) door = { c, score, facing: FACING[`${dx},${dz}`], out: [dx, dz] };
}
const doorKey = key(door.c.x, door.c.z);

// Chimney stacks on the flat top of the mansard, two spots well inside the roof.
const chimneyKeys = new Set();
for (const target of [[9, 9], [21, 14]]) {
  let best = null;
  for (const c of byKey.values()) {
    if (c.r < 29 || D(c) < 4) continue;
    const dist = Math.abs(c.x - target[0]) + Math.abs(c.z - target[1]);
    if (!best || dist < best.dist) best = { c, dist };
  }
  if (best) chimneyKeys.add(key(best.c.x, best.c.z));
}

const g = new Voxels([30, 45, 26]);

// the block a cell carries at height y, or null for air
function blockAt(c, y, ring, exp) {
  const isDoor = key(c.x, c.z) === doorKey;
  if (isDoor && (y === door.c.g + 1 || y === door.c.g + 2)) {
    return { b: "dark_oak_door", s: { facing: door.facing, half: y === door.c.g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (isDoor && y === door.c.g + 3) return { b: COURSE };
  if (y < 5) {
    if (y === 4 && ring) return { b: BASE };
    return { b: STONE };
  }
  if (c.r < 25 && y === c.r - 1) return { b: STONE };   // a low wing's flat cap
  if (y === 25 && c.r >= 26) return { b: ring ? COURSE : FLOOR };
  if (y >= 25) {
    // mansard: each row is inset one block from the edge above the cornice
    if (y <= c.r - 1 && D(c) >= y - 25) return { b: SLATE };
    return null;
  }
  const base = Math.floor(y / 5) * 5, k = y - base;
  if (k === 0) return ring ? { b: COURSE } : (D(c) >= 1 ? { b: FLOOR } : null);
  if (!ring) return null;
  if (k === 4) return { b: WALL };
  const bay = exp.length && !isCorner(exp) && exp.some(([, dz]) => dz) && !exp.some(([dx]) => dx) ? bayIndex(c, exp[0]) : null;
  const windowBay = bay !== null && bay % 3 === 1 && !isDoor;
  if (windowBay && !(c.r < 25 && y >= c.r - 1)) return { b: GLASS };
  return { b: WALL };
}

for (const c of byKey.values()) {
  const ring = D(c) === 0, exp = exposed(c);
  const flatStop = c.r - 1;
  for (let y = 0; y < c.r; y++) {
    const cap = y === flatStop;
    if (cap && c.r < 25) { g.set(c.x, y, c.z, STONE); continue; }
    const block = blockAt(c, y, ring, exp);
    if (block) g.set(c.x, y, c.z, block.b, block.s);
  }
  if (chimneyKeys.has(key(c.x, c.z))) {
    for (const y of [29, 30]) g.set(c.x, y, c.z, CHIMNEY);
    g.set(c.x, 31, c.z, "smooth_stone");
  }
}

// Window reveal lights: a warm light in the room behind some of the panes (one in four or so), and the panes
// connect to the walls beside them.
for (const c of byKey.values()) {
  if (D(c) !== 0) continue;
  const exp = exposed(c);
  if (isCorner(exp) || !exp.some(([, dz]) => dz) || exp.some(([dx]) => dx)) continue;
  const [dx, dz] = exp[0];
  for (const base of BANDS) {
    const y = base + 2;
    if (base + 1 > c.r - 2) continue;
    const isWindow = bayIndex(c, exp[0]) % 3 === 1 && key(c.x, c.z) !== doorKey;
    if (!isWindow) continue;
    const inX = c.x - dx, inZ = c.z - dz;
    const inner = at(inX, inZ);
    if (inner && D(inner) >= 1 && ((c.x * 7 + c.z * 13 + base) % 4 === 0)) {
      g.set(inner.x, y, inner.z, (c.x + base) % 8 === 0 ? DOOR_LIGHT : LAMP);
    }
  }
}
for (const c of byKey.values()) {
  const ring = D(c) === 0;
  if (!ring) continue;
  for (const base of BANDS) for (const y of [base + 1, base + 2, base + 3]) {
    const b = g.get(c.x, y, c.z);
    if (!b || b.block !== GLASS) continue;
    const state = {};
    for (const [name, [dx, dz]] of [["north", [0, -1]], ["south", [0, 1]], ["east", [1, 0]], ["west", [-1, 0]]]) {
      const n = g.get(c.x + dx, y, c.z + dz);
      state[name] = n ? "true" : "false";
    }
    g.set(c.x, y, c.z, GLASS, { ...state, waterlogged: "false" });
  }
}

const out = `${DIR}/FR245184540.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, palette ${palette}`);
