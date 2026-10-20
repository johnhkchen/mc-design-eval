// Presidio fill kit, helpers group H1 (plan.md VOCABULARY 1, 4, 7, 10, 13, 16, 19, 22):
// corner_boards, door, shutter, quoins, belfry, weathered_concrete, magazine_door, cypress.
//
// Every helper takes its position as arguments. It writes only inside its own footprint, and only into air, unless
// opts.replace names the blocks it may overwrite (the wall it dresses); writing the block already there is a no-op.
// Nothing is written at y0 or below the start of its footprint. Each helper returns { placed, refused }: refused lists
// the cells it wanted but could not write, so the caller can report them.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { ns } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";

const LEAF = ["dark_oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" }];
const CONCRETE = ["andesite", "cracked_stone_bricks", "light_gray_concrete", "smooth_stone"];
const inBox = (box, x, y, z) => x >= box[0] && x <= box[3] && y >= box[1] && y <= box[4] && z >= box[2] && z <= box[5];

// The write rule. fits(): inside the footprint, in bounds, and air or a block opts.replace names. put(): one cell
// given as a [block, state] pair (from B.*) or a bare block id; a cell already holding that block is left as it is.
const fits = (g, box, [x, y, z], opts = {}) => {
  if (!inBox(box, x, y, z) || !g.inBounds(x, y, z)) return false;
  const here = g.blockAt(x, y, z);
  return g.isAir(x, y, z) || (opts.replace ?? []).some((id) => here === ns(id));
};
const put = (g, box, pos, spec, opts, out) => {
  const [block, state] = Array.isArray(spec) ? spec : [spec];
  if (g.blockAt(...pos) === ns(block) && inBox(box, ...pos)) return true;
  if (!fits(g, box, pos, opts)) { out.refused.push(pos); return false; }
  g.set(...pos, block, state);
  out.placed++;
  return true;
};
const newOut = () => ({ placed: 0, refused: [] });
const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

/** Quartz corner boards on a wall: quartz_pillar (axis y) at [x, z] from y0 to y1. */
export function corner_boards(g, [x, z], y0, y1, opts = {}) {
  const box = [x, y0, z, x, y1, z], out = newOut();
  for (const y of span(y0, y1)) put(g, box, [x, y, z], B.pillar("quartz_pillar", "y"), opts, out);
  return out;
}

/**
 * A door, both halves (lower at y, upper at y+1). [x, y, z] is the lower cell in the wall; face is the way the door
 * looks out (south = +z, facing out), type "birch" | "dark_oak" | "spruce" | "iron" (or with "_door"). double: a second
 * leaf beside it along the wall (+x for north/south, +z for east/west), hinges mirrored. All-or-nothing: if any cell
 * of the door is not air (or in opts.replace), nothing is written and every cell is refused.
 */
export function door(g, [x, y, z], face, type, { double = false, replace = [] } = {}) {
  const mat = type.replace(/_door$/, "");
  const along = face === "north" || face === "south" ? [1, 0, 0] : [0, 0, 1];
  const leaves = double ? [[x, y, z, "left"], [x + along[0], y, z + along[2], "right"]] : [[x, y, z, "left"]];
  const cells = leaves.flatMap(([lx, ly, lz, hinge]) => [[lx, ly, lz, "lower", hinge], [lx, ly + 1, lz, "upper", hinge]]);
  const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[2]);
  const box = [Math.min(...xs), y, Math.min(...zs), Math.max(...xs), y + 1, Math.max(...zs)];
  const out = newOut(), o = { replace };
  const todo = cells.map(([cx, cy, cz, half, hinge]) => ({ pos: [cx, cy, cz], spec: B.door(mat, face, half, hinge) }));
  if (!todo.every((c) => fits(g, box, c.pos, o))) { out.refused.push(...todo.map((c) => c.pos)); return out; }
  for (const c of todo) put(g, box, c.pos, c.spec, o, out);
  return out;
}

/** A window shutter: one open trapdoor lying flat on the wall, in the cell outside it. face = the way the wall looks. */
export function shutter(g, [x, y, z], face, wood = "warped", opts = {}) {
  const box = [x, y, z, x, y, z], out = newOut();
  put(g, box, [x, y, z], [`${wood.replace(/_trapdoor$/, "")}_trapdoor`, { facing: face, half: "bottom", open: "true", powered: "false", waterlogged: "false" }], opts, out);
  return out;
}

/**
 * Quoins on a corner column: [x, z] is the corner cell, ys the courses to dress (bottom to top). Alternates by course:
 * even positions in ys are smooth_quartz (the short stones), odd positions bricks. The plan's barracks corners are
 * quoins(g, [30, 9], [2, 3, 4, 5], { replace: ["bricks"] }): quartz at y2 and y4, bricks at y3 and y5.
 */
export function quoins(g, [x, z], ys, opts = {}) {
  const box = [x, Math.min(...ys), z, x, Math.max(...ys), z], out = newOut();
  ys.forEach((y, i) => put(g, box, [x, y, z], i % 2 === 0 ? "smooth_quartz" : "bricks", opts, out));
  return out;
}

/**
 * Plot 5's espadaña belfry (plan.md VOCABULARY 13). [x, y, z] is its bottom-left cell (x52, y8, z16 in the plan); the
 * footprint is 4 wide, 3 high, 1 deep. Course y: a sill of smooth_sandstone across (the parapet course). Course y+1:
 * piers at the two ends, air between them where the bells hang. Course y+2: the cap, smooth_sandstone_slab bottom
 * across all four cells (the beam over the bells). Two bells (attachment ceiling, facing `face`) hang under the beam
 * at x+1 and x+2, y+1. Opening: opts.replace may include the parapet's smooth_sandstone so the sill and piers can
 * be written over it; the bell cells must be air.
 */
export function belfry(g, [x, y, z], { face = "south", replace = [] } = {}) {
  const box = [x, y, z, x + 3, y + 2, z], out = newOut(), o = { replace }, stone = "smooth_sandstone";
  for (const dx of span(0, 3)) put(g, box, [x + dx, y, z], stone, o, out);
  for (const dx of [0, 3]) put(g, box, [x + dx, y + 1, z], stone, o, out);
  for (const dx of span(0, 3)) put(g, box, [x + dx, y + 2, z], B.slab(stone, "bottom"), o, out);
  for (const dx of [1, 2]) put(g, box, [x + dx, y + 1, z], ["bell", { attachment: "ceiling", facing: face }], o, out);
  return out;
}

/**
 * Battery concrete (plan.md VOCABULARY 16), over the box [x0, y0, z0, x1, y1, z1]. The box's bottom course is the foot:
 * andesite with about 1 in 8 cracked_stone_bricks; the courses above are light_gray_concrete with about 1 in 6
 * smooth_stone. The pick is a hash of the position, so the same box always gives the same mix.
 */
export function weathered_concrete(g, [x0, y0, z0, x1, y1, z1], opts = {}) {
  const box = [x0, y0, z0, x1, y1, z1], out = newOut();
  const hash = (x, y, z) => (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0;
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
        const h = hash(x, y, z);
        const foot = y === Math.min(y0, y1);
        const block = foot ? (h % 8 === 0 ? "cracked_stone_bricks" : "andesite") : (h % 6 === 0 ? "smooth_stone" : "light_gray_concrete");
        put(g, box, [x, y, z], block, opts, out);
      }
  return out;
}

/**
 * Plot 7 magazine door (plan.md VOCABULARY 19). [x, y, z] is the left door cell in the rear wall (x80 or x88 at y1,
 * z21). Writes a double iron_door facing south (hinges left and right), a polished_andesite frame (jambs at x-1 and
 * x+2, lintel at y+2 over all four cells) and a terracotta rust cell on each jamb at y+1. Its footprint is the frame
 * box; the frame and door cut through the battery's concrete, so the default replace list is the battery's concrete.
 */
export function magazine_door(g, [x, y, z], { replace = CONCRETE } = {}) {
  const box = [x - 1, y, z, x + 2, y + 2, z], out = newOut(), o = { replace };
  for (const dx of [0, 1]) {
    put(g, box, [x + dx, y, z], B.door("iron", "south", "lower", dx === 0 ? "left" : "right"), o, out);
    put(g, box, [x + dx, y + 1, z], B.door("iron", "south", "upper", dx === 0 ? "left" : "right"), o, out);
  }
  for (const jx of [x - 1, x + 2]) {
    put(g, box, [jx, y, z], "polished_andesite", o, out);
    put(g, box, [jx, y + 1, z], "terracotta", o, out);
  }
  for (const dx of span(-1, 2)) put(g, box, [x + dx, y + 2, z], "polished_andesite", o, out);
  return out;
}

/**
 * A cypress: spruce_log trunk, a three-course cone of dark_oak_leaves (3x3 ring around the trunk) and a single leaf on
 * top. [x, y, z] is the trunk's bottom cell, y >= 1 (never the ground course); h is the total height, at least 4.
 * Footprint: 3 x h x 3 around the trunk. Leaves are persistent, so they never decay.
 */
export function cypress(g, [x, y, z], h, opts = {}) {
  if (h < 4) throw new Error(`cypress: h must be at least 4 (got ${h})`);
  if (y < 1) throw new Error(`cypress: base y must be 1 or more (the ground course is y0), got ${y}`);
  const box = [x - 1, y, z - 1, x + 1, y + h - 1, z + 1], out = newOut();
  for (let k = 0; k < h - 1; k++) put(g, box, [x, y + k, z], B.log("spruce", "y"), opts, out);
  for (const k of [h - 4, h - 3, h - 2])
    for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1])
      if (dx || dz) put(g, box, [x + dx, y + k, z + dz], LEAF, opts, out);
  put(g, box, [x, y + h - 1, z], LEAF, opts, out);
  return out;
}
