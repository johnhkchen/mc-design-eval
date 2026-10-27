// Symonds Centre, Auckland: a 1970s concrete-and-tinted-glass office tower on a two-storey shopfront podium.
// Massing from the lidar roof, median-smoothed and quantised to four flat tiers (tops at y 8, 28, 44, 60: a storey is 4 blocks).
// Every column is solid from y 0 (foundation, then floor slabs at each storey and at each tier's top), so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_433829247.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_433829247.nbt";
const SIZE = [68, 75, 80];

const WIN = "light_blue_stained_glass_pane", SPAN = "white_concrete", SLAB = "light_gray_concrete", BASE = "polished_andesite";
const MULL = "gray_concrete", SHOP_POST = "dark_oak_planks", FOUND = "stone_bricks";
const FULL = new Set([SPAN, SLAB, BASE, MULL, SHOP_POST, FOUND, "iron_block", "glowstone"]);
const TIERS = [8, 28, 44, 60];
const TIER = (r) => (r < 14 ? 8 : r < 42 ? 28 : r < 56 ? 44 : 60);
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// footprint: cell key -> { x, z, ground, roof }
const k2 = (x, z) => `${x},${z}`;
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(k2(x, z), { x, z, ground, roof });

// tier top per cell: 5x5 median of the lidar roof over footprint cells, then quantised
const T = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const n = F.get(k2(c.x + dx, c.z + dz)); if (n) vals.push(n.roof);
  }
  vals.sort((a, b) => a - b);
  T.set(k2(c.x, c.z), TIER(vals[vals.length >> 1]));
}
const top = (x, z) => T.get(k2(x, z));                  // undefined outside the footprint
const inF = (x, z) => T.has(k2(x, z));
// air beside the voxel at y: outside the footprint, or the neighbour's tier stops below y
const open = (x, z, y, [dx, dz]) => { const n = top(x + dx, z + dz); return n === undefined || y >= n; };
const exposed = (x, z, y) => DIRS.filter((d) => open(x, z, y, d));
const isFloorLevel = (y, t) => y === 0 || y % 4 === 0 || TIERS.some((tk) => tk - 1 === y && tk <= t);

const plan = new Map();                                 // "x,y,z" -> { x, y, z, block, state }
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { x, y, z, block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

// shell material by height: plinth, spandrel bands on each storey line, glass between, mullions every 3 blocks
const shellBlock = (x, y, z, faces) => {
  if (y === 0) return BASE;
  if (y % 4 === 0 || y % 4 === 3) return SPAN;
  const xf = faces.find((d) => d[0] !== 0), zf = faces.find((d) => d[1] !== 0);
  const post = y < 4 ? SHOP_POST : MULL;
  if (xf && zf) return post;                            // corner post
  if (xf) return z % 3 === 0 ? post : WIN;              // x-facing face: along z
  return x % 3 === 0 ? post : WIN;                      // z-facing face: along x
};

// columns: foundation to the lidar ground, the walls on exposed faces, floor slabs and tier caps inside
for (const c of F.values()) {
  const t = top(c.x, c.z);
  for (let y = 0; y < t; y++) {
    if (y < c.ground) { put(c.x, y, c.z, FOUND); continue; }
    const faces = exposed(c.x, c.z, y);
    if (faces.length) { put(c.x, y, c.z, shellBlock(c.x, y, c.z, faces), null); continue; }
    if (isFloorLevel(y, t)) put(c.x, y, c.z, SLAB);
  }
}

// cornice on every exposed roof rim
for (const c of F.values()) {
  const t = top(c.x, c.z);
  if (exposed(c.x, c.z, t - 1).length) put(c.x, t, c.z, SLAB);
}

// rooftop plant on the podium: scattered air-handling units standing on the roof slab
for (const c of F.values()) {
  const t = top(c.x, c.z);
  if (t === 8 && !exposed(c.x, c.z, 7).length && (c.x + c.z) % 7 === 0) put(c.x, 8, c.z, "iron_block");
}

// the tower's penthouse: a glazed plant room on a slab, with a roof and a lightning rod
const inPent = (x, z) => x >= 27 && x <= 41 && z >= 34 && z <= 48 && top(x, z) === 60;
for (const c of F.values()) {
  if (!inPent(c.x, c.z)) continue;
  const edge = c.x === 27 || c.x === 41 || c.z === 34 || c.z === 48;
  put(c.x, 60, c.z, SLAB);
  if (edge) { put(c.x, 61, c.z, SPAN); put(c.x, 62, c.z, WIN); }
  put(c.x, 63, c.z, SLAB);
}
if (inPent(34, 41)) put(34, 64, 41, "lightning_rod", { facing: "up", powered: "false" });

// the entrance: a door in the podium's front (the north-most run of podium edge), glass either side, a hanging lantern inside
const doorFace = (x, z) => exposed(x, z, 1).some((d) => d[0] === 0 && d[1] === -1);
const cands = [...F.values()].filter((c) => top(c.x, c.z) === 8 && doorFace(c.x, c.z) && c.ground === 0).sort((a, b) => a.x - b.x);
const door = cands[cands.length >> 1];
if (door) {
  const st = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(door.x, 1, door.z, "dark_oak_door", st("lower"));
  put(door.x, 2, door.z, "dark_oak_door", st("upper"));
  if (inF(door.x, door.z + 1)) put(door.x, 3, door.z + 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// warm light: a glowstone on the room side of about one window in eleven, standing on the storey slab
for (const v of [...plan.values()]) {
  if (v.block !== WIN || v.y % 4 !== 1) continue;
  if ((v.x * 31 + v.y * 17 + v.z * 13) % 11 !== 0) continue;
  const out = exposed(v.x, v.z, v.y)[0];
  if (!out) continue;
  const ix = v.x - out[0], iz = v.z - out[1];
  if (!inF(ix, iz) || at(ix, v.y, iz)) continue;
  put(ix, v.y, iz, "glowstone");
}

// glass panes connect to their neighbours like the real thing: to glass, to solid blocks, not to air or doors
const connects = (x, y, z) => { const n = at(x, y, z); return !!n && (n.block === WIN || FULL.has(n.block)); };
for (const v of plan.values()) {
  if (v.block !== WIN) continue;
  const state = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  if (connects(v.x, v.y, v.z - 1)) state.north = "true";
  if (connects(v.x, v.y, v.z + 1)) state.south = "true";
  if (connects(v.x + 1, v.y, v.z)) state.east = "true";
  if (connects(v.x - 1, v.y, v.z)) state.west = "true";
  v.state = state;
}

// every block above y 0 must be carried: it stands on a block below, or on a plate (floor, spandrel course) that does, spanning
// across the same level from a wall. Doors' upper halves, hanging lanterns and the rod are carried by what they are fixed to.
const carried = new Set();
const queue = [];
for (const v of plan.values()) {
  const fixed = v.y === 0 || v.block === "lantern" || v.block === "lightning_rod" || (v.block === "dark_oak_door" && v.state.half === "upper");
  if (fixed || at(v.x, v.y - 1, v.z)) { carried.add(v); queue.push(v); }
}
for (let i = 0; i < queue.length; i++) {
  const v = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = at(v.x + dx, v.y, v.z + dz);
    if (n && !carried.has(n)) { carried.add(n); queue.push(n); }
  }
}
const floating = plan.size - carried.size;

const g = new Voxels(SIZE);
for (const v of plan.values()) g.set(v.x, v.y, v.z, v.block, v.state ?? undefined);
const saved = g.save(OUT);
console.log(JSON.stringify({ footprint: F.size, floating, ...saved }));
