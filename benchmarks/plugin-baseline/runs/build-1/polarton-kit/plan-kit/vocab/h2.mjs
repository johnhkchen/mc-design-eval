// Vocabulary, batch 2 (plan.md VOCABULARY): ringFence, wagonDoor, louvre, ventSlot, belfry, slatCrib, cart,
// tobaccoTier, jobSite. Each helper plans its cells from its arguments, then writes only the planned cells that are
// air (wagonDoor's leaves and lintel may also replace the wall boards under { replaceWall: true }). It returns
// { placed, skipped }, skipped being the "x,y,z" cells that were already taken.
import { DIRS, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const bare = (b) => (b ?? "air").replace(/^minecraft:/, "");
const AIRY = /air$/;
// what a fence does not join to (any other block with a face counts as full)
const NOT_FULL = /air$|trapdoor|lantern|chain|ladder|door|slab|stairs|torch|bell|lectern|composter|table|leaves|pane|bars|sign|bed|campfire|banner/;
const FENCEISH = /_fence(_gate)?$/;
const WALL_MAT = /_planks$|_log$|_wood$|^cobblestone$|_concrete$|bricks$|calcite/;

const cell = (x, y, z, pair, extra = {}) => ({ p: [x, y, z], pair, ...extra });
const fencePost = (block, x, y, z) => cell(x, y, z, [block, {}], { fence: true });
const alongStep = (facing) => (facing === "north" || facing === "south" ? [1, 0] : [0, 1]);
const axisOf = (facing) => (facing === "north" || facing === "south" ? "x" : "z");
// cell on a wall: u along it from the origin, v up, f out in front of it (1 = the cell outside the wall)
const wallCell = (origin, facing) => (u, v, f = 0) => {
  const [ax, az] = alongStep(facing), [ox, , oz] = DIRS[facing];
  return [origin[0] + u * ax + f * ox, origin[1] + v, origin[2] + u * az + f * oz];
};

// fence connections: to each fence or gate beside it, and to any full block; air and trim blocks do not connect
function finish(plan, g) {
  const names = new Map(plan.map((c) => [c.p.join(","), bare(c.pair[0])]));
  for (const c of plan) {
    if (!c.fence) continue;
    const [x, y, z] = c.p, st = { waterlogged: "false" };
    for (const [d, dx, dz] of [["north", 0, -1], ["east", 1, 0], ["south", 0, 1], ["west", -1, 0]]) {
      const key = [x + dx, y, z + dz];
      const name = names.get(key.join(",")) ?? bare(g.get(...key)?.block);
      st[d] = String(FENCEISH.test(name) || (!AIRY.test(name) && !NOT_FULL.test(name)));
    }
    c.pair = [c.pair[0], st];
  }
  return plan;
}

function place(g, plan, { replaceWall = false } = {}) {
  finish(plan, g);
  const res = { placed: 0, skipped: [] };
  for (const c of plan) {
    const [x, y, z] = c.p, [block, state, nbt] = c.pair;
    const inGrid = g.inBounds(x, y, z);
    const free = inGrid && (g.isAir(x, y, z) || (replaceWall && c.wall && WALL_MAT.test(bare(g.get(x, y, z)?.block))));
    if (free) { g.set(x, y, z, block, state, nbt); res.placed++; } else res.skipped.push(`${x},${y},${z}`);
  }
  return res;
}

/** Plot i's ring: spruce_fence y1 round x 12i / 12i+11 and z 5 / z 18, a 2-wide closed gate on the front (z 5),
 *  and a lantern post at each front corner (fence y1..3, standing lantern y4). Only on the ring. */
export function ringFence(g, i) {
  const x0 = 12 * i, cells = new Map(), put = (c) => cells.set(c.p.join(","), c);
  for (let z = 5; z <= 18; z++) for (const x of [x0, x0 + 11]) put(fencePost("spruce_fence", x, 1, z));
  for (let x = x0 + 1; x <= x0 + 10; x++) for (const z of [5, 18]) put(fencePost("spruce_fence", x, 1, z));
  for (const x of [x0 + 5, x0 + 6]) put(cell(x, 1, 5, ["spruce_fence_gate", { facing: "north", in_wall: "false", open: "false", powered: "false" }]));
  for (const x of [x0, x0 + 11]) {
    for (let y = 1; y <= 3; y++) put(fencePost("spruce_fence", x, y, 5));
    put(cell(x, 4, 5, B.lantern(false)));
  }
  return place(g, [...cells.values()]);
}

/** Folded board doors of the gin's wagon bay. (x, y, z) = the clear opening's low corner on the wall (u = 0, bottom
 *  row); facing = the way the wall looks. Lintel y5 across the jambs, and spruce_trapdoor leaves at u -2..-1 and 4..5
 *  (y1..4) lying flat on the wall. The clear opening itself is left as it is. */
export function wagonDoor(g, x, y, z, facing, { replaceWall = false } = {}) {
  const at = wallCell([x, y, z], facing), plan = [];
  for (let u = -1; u <= 4; u++) plan.push(cell(...at(u, 4), B.log("stripped_spruce", axisOf(facing)), { wall: true }));
  for (const u of [-2, -1, 4, 5]) for (let v = 0; v <= 3; v++) plan.push(cell(...at(u, v), B.trapdoor("spruce", facing, "bottom", true), { wall: true }));
  return place(g, plan, { replaceWall });
}

/** w open spruce_trapdoors in a row across a wall plane, from (x, y, z) along the wall (x for a north/south wall,
 *  z for east/west). face = the way the wall looks. */
export function louvre(g, x, y, z, face, w) {
  const [dx, dz] = alongStep(face), plan = [];
  for (let i = 0; i < w; i++) plan.push(cell(x + i * dx, y, z + i * dz, B.trapdoor("spruce", face, "bottom", true)));
  return place(g, plan);
}

/** A column of open spruce_trapdoors, y3..9, in the wall plane at (x, z); face = the way the wall looks. */
export function ventSlot(g, x, z, face) {
  const plan = [];
  for (let y = 3; y <= 9; y++) plan.push(cell(x, y, z, B.trapdoor("spruce", face, "bottom", true)));
  return place(g, plan);
}

/** Open belfry on a 4 x 4 tower at x0..x0+3, z0..z0+3, storey y0..y0+1: calcite corner posts, 2-wide openings on
 *  every face (louvres in the lower course), and the bell hung from the deck above at its centre. */
export function belfry(g, x0, y0, z0) {
  const plan = [], post = B.block("calcite"), louvre = (f) => B.trapdoor("spruce", f, "bottom", true);
  for (const y of [y0, y0 + 1]) for (const [x, z] of [[x0, z0], [x0 + 3, z0], [x0, z0 + 3], [x0 + 3, z0 + 3]]) plan.push(cell(x, y, z, post));
  for (const d of [1, 2]) {
    plan.push(cell(x0 + d, y0, z0, louvre("north")), cell(x0 + d, y0, z0 + 3, louvre("south")));
    plan.push(cell(x0, y0, z0 + d, louvre("west")), cell(x0 + 3, y0, z0 + d, louvre("east")));
  }
  plan.push(cell(x0 + 1, y0 + 1, z0 + 1, ["bell", { attachment: "ceiling", facing: "north" }]));
  return place(g, plan);
}

/** Corn crib on piers, 3 wide x 8 long from (x0, z0): cobblestone piers y1 with air between, oak floor y2, stripped
 *  oak corner posts and bamboo slats on all four faces y3..7. The front hatch is left for the openings part. */
export function slatCrib(g, x0, z0) {
  const plan = [];
  for (const [x, z] of [[x0, z0], [x0 + 2, z0], [x0, z0 + 3], [x0 + 2, z0 + 3], [x0, z0 + 7], [x0 + 2, z0 + 7]]) plan.push(cell(x, 1, z, B.block("cobblestone")));
  for (let x = x0; x <= x0 + 2; x++) for (let z = z0; z <= z0 + 7; z++) plan.push(cell(x, 2, z, B.block("oak_planks")));
  for (let y = 3; y <= 7; y++) {
    for (const x of [x0, x0 + 2]) for (let z = z0; z <= z0 + 7; z++) {
      plan.push(z === z0 || z === z0 + 7 ? cell(x, y, z, B.log("stripped_oak", "y")) : fencePost("bamboo_fence", x, y, z));
    }
    for (const z of [z0, z0 + 7]) plan.push(fencePost("bamboo_fence", x0 + 1, y, z));
  }
  return place(g, plan);
}

/** Cart in a shed: bed of 8 oak_trapdoors (2 wide x 4 long) at (x0, y, z0), wheels upright on the bed's middle
 *  row, and two fence shafts out at the front. facing = the way the cart points (north/south: long axis z). */
export function cart(g, x0, y, z0, facing) {
  const lengthZ = facing === "north" || facing === "south", fwd = facing === "south" || facing === "east" ? 1 : -1;
  const at = (u, w, dy = 0) => (lengthZ ? [x0 + w, y + dy, z0 + u] : [x0 + u, y + dy, z0 + w]);
  const shaft = (fwd > 0 ? 3 : 0) + fwd, plan = [];
  for (let u = 0; u <= 3; u++) for (let w = 0; w <= 1; w++) plan.push(cell(...at(u, w), B.trapdoor("oak", "north", "top", false)));
  for (let w = 0; w <= 1; w++) {
    plan.push(cell(...at(1, w, 1), B.trapdoor("spruce", lengthZ ? "east" : "south", "bottom", true)));
    plan.push(fencePost("spruce_fence", ...at(shaft, w, 1)));
  }
  return place(g, plan);
}

/** Tobacco tiers in a barn: stripped_spruce_log poles along x (x0..x0+3) at each tier height, on rows z0, z0+2, z0+4,
 *  with persistent oak_leaves hung in the air under each pole (x0+1, x0+2). */
export function tobaccoTier(g, x0, z0, tiers = [5, 7, 9]) {
  const plan = [], leaves = ["oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" }];
  for (const y of tiers) for (const z of [z0, z0 + 2, z0 + 4]) {
    for (let x = x0; x <= x0 + 3; x++) plan.push(cell(x, y, z, B.log("stripped_spruce", "x")));
    for (const x of [x0 + 1, x0 + 2]) plan.push(cell(x, y - 1, z, leaves));
  }
  return place(g, plan);
}

/** One job-site block at (x, y, z). facing: the way the block faces (and the lane in front of it). room: the
 *  room box [x0, y0, z0, x1, y1, z1] from rooms.json it must fit in. The 2-high column in front of it stays clear. */
export function jobSite(g, block, [x, y, z], { facing = "north", room = null } = {}) {
  const [dx, , dz] = DIRS[facing], key = `${x},${y},${z}`;
  const air = (x, y, z) => g.inBounds(x, y, z) && g.isAir(x, y, z);
  const inRoom = !room || (x >= room[0] && y >= room[1] && z >= room[2] && x <= room[3] && y <= room[4] && z <= room[5]);
  const why = !inRoom ? "outside its room" : !air(x, y, z) ? "cell taken" : !air(x + dx, y, z + dz) || !air(x + dx, y + 1, z + dz) ? "lane blocked" : null;
  if (why) return { placed: 0, skipped: [key], reason: why };
  const state = block === "lectern" ? { facing } : block === "composter" ? { level: "0" } : {};
  g.set(x, y, z, block, state);
  return { placed: 1, skipped: [] };
}
