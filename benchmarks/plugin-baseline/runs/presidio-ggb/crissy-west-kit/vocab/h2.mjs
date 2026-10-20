// Helpers from plan.md VOCABULARY: plinth, window, slidingDoor, porch, flag, hedge, floorLantern.
// Every helper takes its position (and facing) as arguments, writes only its own footprint, and writes only into air.
// A filled or out-of-bounds cell, or one below the helper's floor (y < 1, or y < 0 for the porch deck), is refused,
// not overwritten: the call returns { placed, refused } where refused lists [x, y, z, block] for each cell left alone.
// Three explicit exceptions, each an option: plinth({ over }) and slidingDoor's jambs (frame) replace the wall cells
// they are set in; the porch deck (deck) replaces the y0 ground under its own footprint. Nothing else touches y0.
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const out = () => ({ placed: 0, refused: [] });

// one write: air only unless over; never below minY; a refused cell is recorded with the block it was asked to take
function place(g, res, [x, y, z], [block, state, nbt], { over = false, minY = 1 } = {}) {
  const ok = g.inBounds(x, y, z) && y >= minY && (over || g.isAir(x, y, z));
  if (!ok) return res.refused.push([x, y, z, block]), false;
  g.set(x, y, z, block, state, nbt);
  res.placed++;
  return true;
}
// the wall runs along x for a north/south face and along z for an east/west face
const along = (face) => (face === "north" || face === "south" ? [1, 0, 0] : [0, 0, 1]);
const outward = (face) => {
  if (!DIRS[face]) throw new Error(`face must be north|south|east|west, got ${face}`);
  return DIRS[face];
};

const FENCE = { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" };

/** Plinth course: the y course round the rect [x0, z0, x1, z1] (inclusive), one full block of `block`.
 *  Air only unless over: the wall shell already fills y1, so the plinth replaces it with over: true. */
export function plinth(g, [x0, z0, x1, z1], block, { y = 1, over = false } = {}) {
  const res = out();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
    if (x === x0 || x === x1 || z === z0 || z === z1) place(g, res, [x, y, z], [block], { over });
  return res;
}

/** Glass window of w x h cells from [x, y, z] (the wall's first cell at its bottom-left, looking along the wall),
 *  face = the way the wall looks. Panes connect along the wall; a quartz_slab sill sits proud of the wall, outside,
 *  under the glass (y - 1). With a 1-cell wall there is no lintel course. */
export function window(g, x, y, z, face, w, h, { sill = true } = {}) {
  const res = out(), [ax, , az] = along(face), [ox, , oz] = outward(face);
  const pane = face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++)
    place(g, res, [x + ax * i, y + j, z + az * i], ["glass_pane", pane]);
  if (sill) for (let i = 0; i < w; i++)
    place(g, res, [x + ax * i + ox, y - 1, z + az * i + oz], B.slab("quartz", "top"));
  return res;
}

/** Sliding-door panel: dark_prismarine flush in the opening, the opening is w wide from [x, z] and runs from y1 to
 *  y h (inclusive). Quartz jambs stand in the wall cells either side (frame: false leaves them out). */
export function slidingDoor(g, x, z, face, w, h, { frame = true } = {}) {
  const res = out(), [ax, , az] = along(face);
  for (let i = 0; i < w; i++) for (let y = 1; y <= h; y++)
    place(g, res, [x + ax * i, y, z + az * i], ["dark_prismarine"]);
  if (frame) for (const i of [-1, w]) for (let y = 1; y <= h; y++)
    place(g, res, [x + ax * i, y, z + az * i], ["quartz_block"], { over: true });
  return res;
}

/** Porch on the front rows z0 (outer) and z1 (against the house wall), x0..x1 inclusive: birch_planks deck at y0
 *  (replaces the ground under the porch only), birch_fence posts every 3 from x0 (and at x1) on quartz_slab bases at
 *  y1 with the post at y2, a rail fence at y1 along z0 between the posts, open over the cells in open = [xa, xb],
 *  and a one-course shed roof at y3: polished_andesite_stairs facing south on z0, polished_andesite_slab on z1. */
export function porch(g, x0, x1, z0, z1, { open = null, deck = true } = {}) {
  const res = out(), isOpen = (x) => open != null && x >= open[0] && x <= open[1];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
    if (deck) place(g, res, [x, 0, z], ["birch_planks"], { over: true, minY: 0 });
  for (let x = x0; x <= x1; x++) {
    const post = (x - x0) % 3 === 0 || x === x1;
    if (post) {
      place(g, res, [x, 1, z0], B.slab("quartz", "bottom"));
      place(g, res, [x, 2, z0], ["birch_fence", FENCE]);
    } else if (!isOpen(x)) place(g, res, [x, 1, z0], ["birch_fence", FENCE]);
    place(g, res, [x, 3, z0], B.stairs("polished_andesite", "south", "bottom"));
    place(g, res, [x, 3, z1], B.slab("polished_andesite", "bottom"));
  }
  return res;
}

/** Flagpole with a two-cell US cloth: stone_brick_wall foot at y1, end_rod pole y2..top (top = 9 by default) at [x, z].
 *  The cloth is two wall banners at x + 1 (y top-1 and top), facing west, hung on a white_concrete backing at x + 2. */
export function flag(g, x, z, { top = 9 } = {}) {
  const res = out();
  place(g, res, [x, 1, z], ["stone_brick_wall", { up: "true", north: "none", east: "none", south: "none", west: "none", waterlogged: "false" }]);
  for (let y = 2; y <= top; y++) place(g, res, [x, y, z], ["end_rod", { facing: "up" }]);
  for (const y of [top - 1, top]) place(g, res, [x + 2, y, z], ["white_concrete"]);
  place(g, res, [x + 1, top - 1, z], B.banner("white", [["stripe_bottom", "red"]], { facing: "west" }));
  place(g, res, [x + 1, top, z], B.banner("white", [["square_top_left", "blue"], ["stripe_top", "red"]], { facing: "west" }));
  return res;
}

/** Hedge: persistent oak_leaves, one course at y (default 1), over the rect [x0, z0, x1, z1] (inclusive). */
export function hedge(g, [x0, z0, x1, z1], { y = 1 } = {}) {
  const res = out();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
    place(g, res, [x, y, z], ["oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" }]);
  return res;
}

/** Standing lantern on the floor at [x, y, z]: needs a solid block under it and two cells of headroom above, else it is
 *  refused whole. Lanterns are the only furniture here (plan.md ROOMS: no rooms are furnished). */
export function floorLantern(g, x, y, z) {
  const res = out();
  const floor = g.inBounds(x, y - 1, z) && !g.isAir(x, y - 1, z);
  const headroom = g.isAir(x, y + 1, z) && g.isAir(x, y + 2, z);
  if (!floor || !headroom) return res.refused.push([x, y, z, "lantern"]), res;
  place(g, res, [x, y, z], B.lantern(false));
  return res;
}
