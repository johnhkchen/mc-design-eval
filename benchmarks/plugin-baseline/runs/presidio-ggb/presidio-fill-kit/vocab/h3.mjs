// SPDX-License-Identifier: AGPL-3.0-or-later
// Presidio fill kit, vocabulary helpers (plan.md VOCABULARY, items 3, 6, 8, 9, 12, 15, 18, 21): window, porch_posts,
// pyramid_cap, arch, chimney_for, gun_pit, lamp_post. Each takes its position (and facing) as arguments and writes only
// inside the footprint it is given. Writes go only into air, so an earlier part's cells are refused and reported,
// never overwritten, except where a helper says so: chimney_for ({ over }) and gun_pit (its own pit cut).
// Every helper returns { placed, refused: [[x, y, z, block]] }.
import { OPPOSITE, chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const result = () => ({ placed: 0, refused: [] });
const isAir = (g, x, y, z) => /air$/.test(g.blockAt(x, y, z));
const FENCE = { north: "false", east: "false", south: "false", west: "false" };

function put(g, out, x, y, z, block, state, over = false) {
  if (!g.inBounds(x, y, z) || (!over && !isAir(g, x, y, z))) {
    out.refused.push([x, y, z, block]);
    return;
  }
  g.set(x, y, z, block, state);
  out.placed++;
}

/**
 * A window: one glass pane in the opening at [x, y, z] on the wall's `face` (north, south, east, west). Its side
 * connections are set from what stands beside it now (a solid or a pane connects). thick: 2 gives a quartz sill in the
 * cell under the pane, where that cell is air (a 1-thick wall gets none).
 */
export function window(g, [x, y, z], face, { thick = 1 } = {}) {
  const out = result();
  const state = { ...FENCE };
  const side = (dx, dz) => String(!isAir(g, x + dx, y, z + dz));
  if (face === "north" || face === "south") {
    state.east = side(1, 0);
    state.west = side(-1, 0);
  } else if (face === "east" || face === "west") {
    state.north = side(0, -1);
    state.south = side(0, 1);
  } else {
    throw new Error(`window: face must be north, south, east or west (got ${face})`);
  }
  put(g, out, x, y, z, "glass_pane", state);
  if (thick === 2) put(g, out, x, y - 1, z, "smooth_quartz_slab", { type: "bottom" });
  return out;
}

/**
 * Porch columns: xs at z, from y0 to y1 (birch_fence or quartz_pillar). deck (optional): a floor box at deck.y
 * ({ x0, x1, z0, z1, y, block = "spruce_planks" }), air cells only.
 */
export function porch_posts(g, { xs, z, y0, y1, block = "birch_fence", deck }) {
  const out = result();
  const state = block.endsWith("_fence") ? FENCE : block === "quartz_pillar" ? { axis: "y" } : undefined;
  for (const x of xs) for (let y = y0; y <= y1; y++) put(g, out, x, y, z, block, state);
  if (deck) {
    const { x0, x1, z0, z1, y, block: floor = "spruce_planks" } = deck;
    for (let x = x0; x <= x1; x++) for (let zz = z0; zz <= z1; zz++) put(g, out, x, y, zz, floor);
  }
  return out;
}

/**
 * A pyramid cap on the box x0..x1 by z0..z1 (at least 3 x 3): a ring of deepslate_tile_stairs at y, each facing in
 * (the west/east edges face in along x, the north/south edges along z), deepslate_tiles inside the ring at y, and a
 * bottom deepslate_tile_slab on the inner cells at y + 1.
 */
export function pyramid_cap(g, { x0, z0, x1, z1, y }) {
  if (x1 - x0 < 2 || z1 - z0 < 2) throw new Error("pyramid_cap: the box must be at least 3 x 3");
  const out = result();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (edge) {
      const facing = x === x0 ? "east" : x === x1 ? "west" : z === z0 ? "south" : "north";
      put(g, out, x, y, z, "deepslate_tile_stairs", { facing, half: "bottom", shape: "straight" });
    } else {
      put(g, out, x, y, z, "deepslate_tiles");
      put(g, out, x, y + 1, z, "deepslate_tile_slab", { type: "bottom" });
    }
  }
  return out;
}

/**
 * An arch in a north or south wall: upside-down stairs of `material` (its _stairs form) across the opening x0..x1 at
 * head row y, facing the given face (outward, per plan.md); full `material` blocks as the jambs at x0-1 and x1+1 on
 * the same row. z is the wall's row. Air only.
 */
export function arch(g, [x0, x1, y, z], face, material) {
  if (face !== "north" && face !== "south") throw new Error(`arch: face must be north or south (got ${face})`);
  const out = result();
  for (let x = x0; x <= x1; x++) put(g, out, x, y, z, `${material}_stairs`, { facing: face, half: "top", shape: "straight" });
  put(g, out, x0 - 1, y, z, material);
  put(g, out, x1 + 1, y, z, material);
  return out;
}

// plan.md's chimney table: wall = the mouth (a wall cell at floor level), out = the way the fire lies from the wall
// (plan.md's "into"), top = the flue's last course.
const CHIMNEYS = {
  "0": { wall: [5, 1, 3], out: "east", top: 8 },
  "4w": { wall: [30, 1, 7], out: "west", top: 9 },
  "4e": { wall: [41, 1, 7], out: "east", top: 9 },
  "6w": { wall: [66, 1, 4], out: "west", top: 8 },
  "6e": { wall: [73, 1, 4], out: "east", top: 8 },
};

/**
 * The chimney for one plot's table entry ("0", "4w", "4e", "6w", "6e"), built by the library's chimney(). Its cells are
 * computed first and each is written only where it is air, so an earlier part's ground or wall is refused and reported
 * (the hay under the fire sits in the ground course, so it is refused). over: true overwrites what is there.
 * Footprint: the fire cell's 3 x 3 column from y0 to the top.
 */
export function chimney_for(g, plot, { over = false } = {}) {
  const c = CHIMNEYS[plot];
  if (!c) throw new Error(`chimney_for: unknown plot ${plot} (use ${Object.keys(CHIMNEYS).join(", ")})`);
  const calls = [];
  const probe = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (...args) => calls.push(args);
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  chimney(probe, { wall: c.wall, into: OPPOSITE[c.out], top: c.top, material: "bricks" });
  const out = result();
  const free = calls.map(([x, y, z]) => g.inBounds(x, y, z) && (over || isAir(g, x, y, z)));
  calls.forEach(([x, y, z, block, state, nbt], i) => {
    if (free[i]) { g.set(x, y, z, block, state, nbt); out.placed++; }
    else out.refused.push([x, y, z, block]);
  });
  return out;
}

/**
 * A gun pit at x0..x0+5 by z0..z0+5 (plan.md, Battery detail): the circle cut from the deck (air at y3; the corner
 * cells keep the deck), and inside it at y2 a 4 x 4 ring without its corners: the 2 x 2 centre is polished_blackstone
 * (the pivot), the rest iron_block. The pit owns its box and overwrites only that: it is the cut.
 */
export function gun_pit(g, x0, z0) {
  const out = result();
  for (let dz = 0; dz <= 5; dz++) for (let dx = 0; dx <= 5; dx++) {
    const trimmed = dz === 0 || dz === 5 ? dx >= 1 && dx <= 4 : true;
    if (trimmed) put(g, out, x0 + dx, 3, z0 + dz, "air", undefined, true);
  }
  for (let ix = 1; ix <= 4; ix++) for (let iz = 1; iz <= 4; iz++) {
    const corner = (ix === 1 || ix === 4) && (iz === 1 || iz === 4);
    if (corner) continue;
    const centre = (ix === 2 || ix === 3) && (iz === 2 || iz === 3);
    put(g, out, x0 + ix, 2, z0 + iz, centre ? "polished_blackstone" : "iron_block", undefined, true);
  }
  return out;
}

/**
 * A lamp on a post at [x, y, z]: a fence post with a standing lantern on its top (at y + 1). Only fence posts: a
 * standing lantern will not stay on iron_bars.
 */
export function lamp_post(g, [x, y, z], { post = "birch_fence" } = {}) {
  if (!post.endsWith("_fence")) throw new Error(`lamp_post: a standing lantern needs a fence post (${post} won't hold one)`);
  const out = result();
  put(g, out, x, y, z, post, FENCE);
  put(g, out, x, y + 1, z, "lantern", { hanging: "false" });
  return out;
}
