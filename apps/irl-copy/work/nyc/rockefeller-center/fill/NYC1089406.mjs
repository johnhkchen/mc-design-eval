// 6 West 52nd Street (1919, mixed residential and commercial): a six-storey-at-most Midtown brick house with a limestone
// quoin, string courses and cornice, a granite base, a shopfront with a recessed entrance on the street face, a flat tar roof
// behind a stone parapet, and a mechanical penthouse. Massing follows the lidar roof: holes filled, 3x3 median, then
// quantised to whole storeys (3 blocks). Solid masonry with one air cell behind each window and a glowstone lit in some.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1089406.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 14, Z = 27, Y = 30;
const at = (x, z) => z * X + x;
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z;
const median = (v) => v.sort((a, b) => a - b)[v.length >> 1];

// Roof: holes (0 = no lidar return) take the median of their valid neighbours, then a 3x3 median smooths the noise.
const raw = new Array(X * Z).fill(0);
for (const [x, z, , r] of cells) raw[at(x, z)] = r;
const block3 = (arr, x, z, keep) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!inside(x + dx, z + dz)) continue;
    const r = arr[at(x + dx, z + dz)];
    if (keep(r)) v.push(r);
  }
  return v;
};
const filled = raw.map((r, i) => (r > 0 ? r : median(block3(raw, i % X, Math.floor(i / X), (q) => q > 0))));
const H = new Array(X * Z);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const s = median(block3(filled, x, z, () => true));
  H[at(x, z)] = Math.min(18, Math.max(6, Math.round(s / 3) * 3));   // whole storeys
}

// Blocks, keyed by position; panes and walls get their connection states after every block is placed.
const B = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => B.set(key(x, y, z), { block, state });
const got = (x, y, z) => B.get(key(x, y, z));
const wins = [];   // perimeter glass and door cells, with the way in

const SHOP_PLANKS = [3, 5, 7, 10];
const DOOR_X = 6;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const h = H[at(x, z)];
  const per = x === 0 || z === 0 || x === X - 1 || z === Z - 1;
  const corner = (x === 0 || x === X - 1) && (z === 0 || z === Z - 1);
  const front = z === Z - 1, back = z === 0, east = x === X - 1;
  const p = front || back ? x : z;   // position along the face
  for (let y = 0; y < h; y++) {
    if (!per) { put(x, y, z, y === h - 1 ? "black_concrete" : "stone"); continue; }
    if (y === 0) put(x, y, z, "polished_granite");
    else if (y === h - 1) put(x, y, z, "smooth_stone");                         // cornice
    else if (corner) put(x, y, z, "calcite");                                  // quoins
    else if (y % 3 === 0) put(x, y, z, "calcite");                             // storey string courses
    else if (front && y < 3) {                                                 // shopfront
      if (x === DOOR_X) { put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); wins.push({ x, y, z, dx: 0, dz: -1, door: true }); }
      else if (SHOP_PLANKS.includes(x)) put(x, y, z, "dark_oak_planks");
      else { put(x, y, z, "glass_pane"); wins.push({ x, y, z, dx: 0, dz: -1 }); }
    }
    else if (p % 3 === 0) put(x, y, z, "bricks");                              // piers
    else {
      put(x, y, z, "glass_pane");
      wins.push({ x, y, z, dx: east ? -1 : front || back ? 0 : 1, dz: front ? -1 : back ? 1 : 0 });
    }
  }
  if (per) put(x, h, z, "stone_brick_wall", { up: "true" });                   // stone parapet
}
// Entrance step in the granite base, rising toward the door.
put(DOOR_X, 0, Z - 1, "polished_granite_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
// Canopy over the entrance, in the string course above the door.
for (let x = DOOR_X - 1; x <= DOOR_X + 1; x++) put(x, 3, Z - 1, "black_concrete");

// Air behind each window (one cell in), and a glowstone two cells in for some of the lit ones.
for (const w of wins) {
  const ix = w.x + w.dx, iz = w.z + w.dz;
  if (inside(ix, iz)) B.delete(key(ix, w.y, iz));
  if (w.door) continue;
  const lit = w.dz === -1 ? (w.x + w.y) % 4 === 1 : (w.z + w.y) % 5 === 2;
  const lx = w.x + 2 * w.dx, lz = w.z + 2 * w.dz;
  if (lit && inside(lx, lz) && H[at(lx, lz)] > w.y) put(lx, w.y, lz, "glowstone");   // only inside the massing, never in air
}

// Penthouse: a solid mechanical room on the roof, louvred with iron bars on its ring.
const PX0 = 4, PX1 = 7, PZ0 = 10, PZ1 = 15;
for (let z = PZ0; z <= PZ1; z++) for (let x = PX0; x <= PX1; x++) {
  const h = H[at(x, z)];
  const ring = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
  const corner = (x === PX0 || x === PX1) && (z === PZ0 || z === PZ1);
  for (let y = h; y < h + 2; y++) put(x, y, z, ring && !corner && y === h + 1 ? "iron_bars" : "bricks");
  put(x, h + 2, z, "stone_bricks");
}

// Connections: panes and bars join any neighbour that is a block; parapet walls join neighbouring walls.
const join = (x, y, z, dx, dz) => { const n = got(x + dx, y, z + dz); return n && n.block !== "minecraft:air" ? "true" : "false"; };
for (const [k, v] of B) {
  const [x, y, z] = k.split(",").map(Number);
  if (v.block === "glass_pane" || v.block === "iron_bars") {
    v.state = { east: join(x, y, z, 1, 0), west: join(x, y, z, -1, 0), north: join(x, y, z, 0, -1), south: join(x, y, z, 0, 1) };
  } else if (v.block === "stone_brick_wall") {
    const low = (dx, dz) => (got(x + dx, y, z + dz)?.block === "stone_brick_wall" ? "low" : "none");
    v.state = { up: "true", east: low(1, 0), west: low(-1, 0), north: low(0, -1), south: low(0, 1) };
  }
}

const g = new Voxels([X, Y, Z]);
for (const [k, { block, state }] of B) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state); }
const out = g.save(`${DIR}/NYC1089406.nbt`);
const tiers = {}; for (const h of H) tiers[h] = (tiers[h] || 0) + 1;
console.log(JSON.stringify({ ...out, tiers }));
