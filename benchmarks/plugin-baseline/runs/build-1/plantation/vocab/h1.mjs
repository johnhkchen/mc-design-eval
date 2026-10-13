// H1 helpers from plan.md VOCABULARY: colossalColumn, fanlitDoor, hearth, stoop, driveStrip, lampPost, greenhouse, dock.
//
// Every helper takes its position (and facing, where it has one) as arguments; nothing is fixed to a spot.
// Writes go only into AIR. A cell that already holds a block, or lies outside the grid, is left alone and returned
// as [x, y, z, block], so the caller can report it. Pass `over: GROUND_BLOCKS` only where the grounds part has laid
// ground that this helper is meant to replace. Fence and pane sides are read from the grid when the helper finishes,
// so lay the neighbours first. Leaves are persistent=true.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export const GROUND_BLOCKS = ["grass_block", "dirt", "coarse_dirt", "podzol", "moss_block", "gravel", "dirt_path", "sand", "water"];

const bare = (id) => id.replace(/^minecraft:/, "");

// One writer per helper call. set() returns true when it wrote; refusals and out-of-grid cells are collected, never thrown.
function writer(g, over = []) {
  const placed = [], refused = [];
  const set = (x, y, z, block, state, nbt) => {
    if (!g.inBounds(x, y, z) || (!g.isAir(x, y, z) && !over.includes(bare(g.blockAt(x, y, z))))) {
      refused.push([x, y, z, block]);
      return false;
    }
    g.set(x, y, z, block, state, nbt);
    placed.push([x, y, z, block]);
    return true;
  };
  return { set, placed, refused };
}

// Fence and pane sides: a side is open to a neighbour of the same block or to any plain solid block.
const NOT_SOLID = /(stairs|slab|door|trapdoor|fence|wall|pane|lantern|chain|campfire|ladder|torch|sign|flower|pot|vine|carpet|(^|_)bed|bars|water|lily|banner|candle)/;
const SIDES = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
function link(g, x, y, z, block) {
  const state = {};
  for (const [side, [dx, dz]] of Object.entries(SIDES)) {
    const id = bare(g.blockAt(x + dx, y, z + dz));
    state[side] = String(id === block || (id !== "air" && !NOT_SOLID.test(id)));
  }
  g.set(x, y, z, block, state);
}
function finish(g, w) {
  for (const [x, y, z, block] of w.placed) if (block === "glass_pane" || block.endsWith("_fence")) link(g, x, y, z, block);
  return w.refused;
}

/**
 * Colossal column: 2x2 at (x..x+1, z..z+1). `base` is the smooth_quartz plinth row (plan y4); the shaft runs
 * base+1..base+11 (quartz_pillar), the chiseled capital sits at base+12. Upside-down quartz_stairs volutes at the
 * capital row, lip pointing out: on the z-1 and z+2 sides by default; `volutes` adds "west"/"east" for end columns.
 * Footprint: x-1..x+2, z-1..z+2, rows base..base+12.
 */
export function colossalColumn(g, x, z, { base = 4, volutes = ["north", "south"], over = [] } = {}) {
  const w = writer(g, over), top = base + 12;
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    w.set(x + dx, base, z + dz, "smooth_quartz");
    for (let y = base + 1; y < top; y++) w.set(x + dx, y, z + dz, ...B.pillar("quartz_pillar", "y"));
    w.set(x + dx, top, z + dz, "chiseled_quartz_block");
  }
  const cell = {
    north: (i) => [x + i, top, z - 1],
    south: (i) => [x + i, top, z + 2],
    west: (i) => [x - 1, top, z + i],
    east: (i) => [x + 2, top, z + i],
  };
  for (const side of volutes) for (const i of [0, 1]) {
    const [vx, vy, vz] = cell[side](i);
    w.set(vx, vy, vz, ...B.stairs("quartz", OPPOSITE[side], "top"));
  }
  return w.refused;
}

/**
 * Double front door in a wall running along x, the opening's left surround post at x0 and its wall plane at z.
 * `facing` is the way the doors open onto (north or south). `height` is the opening: 6 on the ground floor (rows
 * y0..y0+5), 5 on the upper (plan OPENINGS). Posts, sidelights and transom are quartz_pillar and glass_pane; leaves are
 * dark_oak_door (both halves, hinges mirrored); lintel row smooth_quartz with a chiseled centre; a proud cap of
 * upside-down quartz_stairs one cell out from the wall on the lintel row.
 * Footprint: x0-1..x0+6, rows y0..y0+height-1, z and the cap row.
 */
export function fanlitDoor(g, x0, y0, z, facing = "north", { height = 6, over = [] } = {}) {
  if (facing !== "north" && facing !== "south") throw new Error(`fanlitDoor: facing must be north or south, got ${facing}`);
  const w = writer(g, over), out = z + DIRS[facing][2], top = y0 + height - 1;
  for (const px of [x0, x0 + 5]) for (let y = y0; y < top; y++) w.set(px, y, z, ...B.pillar("quartz_pillar"));
  for (let x = x0; x <= x0 + 5; x++) w.set(x, top, z, x === x0 + 2 || x === x0 + 3 ? "chiseled_quartz_block" : "smooth_quartz");
  for (const [x, hinge] of [[x0 + 2, "left"], [x0 + 3, "right"]]) {
    w.set(x, y0, z, ...B.door("dark_oak", facing, "lower", hinge));
    w.set(x, y0 + 1, z, ...B.door("dark_oak", facing, "upper", hinge));
  }
  for (const x of [x0 + 1, x0 + 4]) for (let y = y0; y <= y0 + height - 3; y++) w.set(x, y, z, "glass_pane");
  // transom: the centre two columns, plus the sidelight columns above the sidelights (those cells are already glass)
  for (let x = x0 + 1; x <= x0 + 4; x++) for (let y = y0 + 2; y <= y0 + height - 2; y++) {
    if (x === x0 + 2 || x === x0 + 3 || y > y0 + height - 3) w.set(x, y, z, "glass_pane");
  }
  for (let x = x0 - 1; x <= x0 + 6; x++) w.set(x, top, out, ...B.stairs("quartz", OPPOSITE[facing], "top"));
  return finish(g, w);
}

/**
 * Hearth in a chimney stack face. (x, z) is the firebox cell in the stack face, `y` its floor row, `face` the way it
 * opens into the room. Smooth_stone floor, lit campfire in the box, and a lintel of upside-down brick_stairs on the
 * row above with a smooth_quartz_slab mantel on top, across the firebox and its two lateral neighbours.
 * Footprint: the three cells across the face, rows y..y+3.
 */
export function hearth(g, x, z, face, y, { over = [] } = {}) {
  const w = writer(g, over);
  const [lx, lz] = face === "east" || face === "west" ? [0, 1] : [1, 0];
  w.set(x, y, z, "smooth_stone");
  w.set(x, y + 1, z, "campfire", { facing: face, lit: "true" });
  for (const k of [-1, 0, 1]) {
    const sx = x + k * lx, sz = z + k * lz;
    w.set(sx, y + 2, sz, ...B.stairs("brick", OPPOSITE[face], "top"));
    w.set(sx, y + 3, sz, ...B.slab("smooth_quartz", "bottom"));
  }
  return w.refused;
}

/**
 * Garden-door stoop. (x, z0) is the first landing cell beside the door: a smooth_quartz landing at row y (plan y3),
 * two smooth_quartz_stairs steps going down away from the house, bricks under each. The run is `width` cells along z.
 * `facing` is the way the stoop rises, toward the door (east or west). Footprint: two cells out, rows 1..y, the run.
 */
export function stoop(g, x, z0, facing, { y = 3, width = 4, over = [] } = {}) {
  if (facing !== "east" && facing !== "west") throw new Error(`stoop: facing must be east or west, got ${facing}`);
  const w = writer(g, over), dx = DIRS[facing][0];
  for (let z = z0; z < z0 + width; z++) {
    w.set(x, y, z, "smooth_quartz");
    for (let by = 1; by < y; by++) w.set(x, by, z, "bricks");
    for (let k = 1; k <= 2 && y - k >= 1; k++) {
      w.set(x - k * dx, y - k, z, ...B.stairs("smooth_quartz", facing, "bottom"));
      for (let by = 1; by < y - k; by++) w.set(x - k * dx, by, z, "bricks");
    }
  }
  return w.refused;
}

/**
 * Gravel drive x0..x1 by z0..z1 on row y, with smooth_stone kerbs one cell out on each side (plan DRIVE, kerbs outside).
 * Footprint: x0-1..x1+1, row y, z0..z1.
 */
export function driveStrip(g, x0, z0, x1, z1, { y = 0, over = [] } = {}) {
  const w = writer(g, over);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) w.set(x, y, z, "gravel");
  for (let z = z0; z <= z1; z++) for (const x of [x0 - 1, x1 + 1]) w.set(x, y, z, "smooth_stone");
  return w.refused;
}

/**
 * Lamp post at (x, z): dark_oak_fence on rows y..y+2 with a standing lantern on top at y+3 (plan: y1..3 + lantern y4).
 * Footprint: the one column, rows y..y+3.
 */
export function lampPost(g, x, z, { y = 1, over = [] } = {}) {
  const w = writer(g, over);
  for (let k = 0; k < 3; k++) w.set(x, y + k, z, ...B.fence("dark_oak"));
  w.set(x, y + 3, z, ...B.lantern(false));
  return finish(g, w);
}

/**
 * Glasshouse over x0..x1 by z0..z1 (plan: x4..21 z64..75), floor row y. Gravel floor; brick dwarf wall on rows y..y+1
 * round the ring, with the threshold kept under the east door; smooth_quartz posts every 3 cells on the long walls
 * (rows y+2..y+6) and glass between; glazed gable ends; a glass roof that steps up from the eaves (row y+7) to a
 * smooth_quartz ridge at y+9 on the middle two rows; rafters of smooth_quartz on the posts; a double dark_oak_door
 * on the east face (rows y+1..y+2) with a glass transom; two benches of smooth_quartz_slab.
 * Footprint: x0..x1, rows y..y+9, z0..z1.
 */
export function greenhouse(g, x0, z0, x1, z1, { y = 0, over = [] } = {}) {
  const w = writer(g, over);
  const zd = Math.floor((z0 + z1) / 2), zs = [zd, zd + 1];  // door and ridge pair (z69..70 on the plan)
  const eave = y + 7, ridge = y + 9, half = zd - z0;  // the roof climbs 2 rows over `half` cells from each eave
  const roofY = (z) => eave + Math.min(ridge - eave, Math.floor(((ridge - eave) * Math.min(z - z0, z1 - z)) / half));
  const posts = [];
  for (let x = x0; x < x1; x += 3) posts.push(x);
  posts.push(x1);
  const ring = [];
  for (let x = x0; x <= x1; x++) ring.push([x, z0], [x, z1]);
  for (let z = z0 + 1; z < z1; z++) ring.push([x0, z], [x1, z]);
  const isDoor = (x, z) => x === x1 && zs.includes(z);

  for (let x = x0 + 1; x < x1; x++) for (let z = z0 + 1; z < z1; z++) w.set(x, y, z, "gravel");
  for (const [x, z] of ring) {
    w.set(x, y, z, "bricks");
    if (!isDoor(x, z)) w.set(x, y + 1, z, "bricks");
  }
  for (const px of posts) for (const pz of [z0, z1]) for (let r = y + 2; r <= y + 6; r++) w.set(px, r, pz, "smooth_quartz");
  for (let x = x0; x <= x1; x++) if (!posts.includes(x)) {
    for (let r = y + 2; r <= y + 6; r++) {
      w.set(x, r, z0, "glass");
      w.set(x, r, z1, "glass");
    }
  }
  for (let z = z0 + 1; z < z1; z++) for (const x of [x0, x1]) for (let r = y + 2; r < roofY(z); r++) {
    if (!(isDoor(x, z) && r === y + 2)) w.set(x, r, z, "glass");
  }
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const ridgeRow = zs.includes(z);
    w.set(x, roofY(z), z, posts.includes(x) || ridgeRow ? "smooth_quartz" : "glass");
  }
  for (const [z, hinge] of [[zd, "left"], [zd + 1, "right"]]) {
    w.set(x1, y + 1, z, ...B.door("dark_oak", "east", "lower", hinge));
    w.set(x1, y + 2, z, ...B.door("dark_oak", "east", "upper", hinge));
  }
  for (let x = x0 + 1; x < x1; x++) for (const z of [z0 + 2, z1 - 2]) w.set(x, y + 1, z, "smooth_quartz_slab", { type: "bottom" });
  return w.refused;
}

/**
 * Landing dock x0..x1 by z0..z1, deck on row y. Spruce-log posts on the rows below the deck, a spruce_fence rail on
 * row y+1 along both sides and the outer end (gap at x0+3..x0+4 for the ladder), lantern posts at the outer corners.
 * Posts and ladder sit below the deck: they are refused where the grid has no room below y0.
 * Footprint: x0..x1, rows y-4..y+3, z0..z1.
 */
export function dock(g, x0, z0, x1, z1, { y = 0, over = [] } = {}) {
  const w = writer(g, over), gap = [x0 + 3, x0 + 4];
  const hole = (x, z) => z === z1 && gap.includes(x);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (!hole(x, z)) w.set(x, y, z, "spruce_planks");
  const posts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]];
  for (const pz of [z0 + 3, z0 + 7]) for (const px of [x0, x0 + 3, x0 + 4, x1]) posts.push([px, pz]);
  for (const [px, pz] of posts) for (let r = y - 4; r < y; r++) w.set(px, r, pz, ...B.log("spruce", "y"));
  for (let r = y - 3; r < y; r++) w.set(gap[0], r, z1, "ladder", { facing: "south" });
  for (let z = z0; z <= z1; z++) for (const x of [x0, x1]) w.set(x, y + 1, z, ...B.fence("spruce"));
  for (let x = x0 + 1; x < x1; x++) if (!gap.includes(x)) w.set(x, y + 1, z1, ...B.fence("spruce"));
  for (const x of [x0, x1]) {
    w.set(x, y + 2, z1, ...B.fence("spruce"));
    w.set(x, y + 3, z1, ...B.lantern(false));
  }
  return finish(g, w);
}
