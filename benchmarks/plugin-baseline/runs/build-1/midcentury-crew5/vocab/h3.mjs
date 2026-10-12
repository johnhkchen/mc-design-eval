// Helpers from plan.md VOCABULARY (batch 3): post, orange_entry, beam_line, stepping_pad, barrel_cactus, patio_table,
// panel_wall, coffee_table, galley_kitchen. Each takes the grid first, then its position (and facing where it has
// one), then opts. Rules every helper keeps:
//   - writes only its own footprint, and only into air; opts.over: true replaces what is there;
//   - never writes the cell under it (ground, sand and floor belong to earlier parts);
//   - returns { placed, skipped }: skipped lists the cells refused as not air, so the caller can see them.
// y on furniture is the standing height (the floor's top cell): interiors use y=2, the patio y=1.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

function writer(g, { over = false } = {}) {
  const out = { placed: 0, skipped: [] };
  const open = (x, y, z) => over || g.isAir(x, y, z);
  const put = (x, y, z, block, state) => {
    if (open(x, y, z)) {
      g.set(x, y, z, block, state);
      out.placed++;
    } else out.skipped.push([x, y, z]);
  };
  // a two-cell block (a door): both halves are written or neither is
  const pair = (a, b, write) => {
    if (open(...a) && open(...b)) write();
    else out.skipped.push(a, b);
  };
  return { put, pair, out };
}

/** A dark timber post: vertical dark_oak_log from y0 to y1 at (x, z). */
export function post(g, x, z, y0 = 2, y1 = 4, opts = {}) {
  const w = writer(g, opts);
  for (let y = y0; y <= y1; y++) w.put(x, y, z, "dark_oak_log", { axis: "y" });
  return w.out;
}

/**
 * Orange front door in its recess. (x, z) is the door cell on the door wall; the panels go on x-1 and x+1, the transom
 * over the door at y=4. The door is two cells (lower and upper half) and is written whole or not at all. The reveals
 * on the wall row in front (z-1) belong to the shell and are not written here.
 */
export function orange_entry(g, x, z, facing = "north", opts = {}) {
  const w = writer(g, opts);
  for (const px of [x - 1, x + 1]) for (let y = 2; y <= 4; y++) w.put(px, y, z, "orange_concrete");
  w.put(x, 4, z, "orange_concrete");
  w.pair([x, 2, z], [x, 3, z], () => {
    w.put(x, 2, z, ...B.door("acacia", facing, "lower", "left"));
    w.put(x, 3, z, ...B.door("acacia", facing, "upper", "left"));
  });
  return w.out;
}

/** A structural beam: dark_oak_log with axis z along the row at x, from z0 to z1 at height y. */
export function beam_line(g, x, z0 = 5, z1 = 28, y = 5, opts = {}) {
  const w = writer(g, opts);
  for (let z = z0; z <= z1; z++) w.put(x, y, z, ...B.log("dark_oak", "z"));
  return w.out;
}

/** A 3x1 smooth_stone pad at ground level (y=0 by default) from x to x+2 on row z. Pads in sand: pass over: true. */
export function stepping_pad(g, x, z, y = 0, opts = {}) {
  const w = writer(g, opts);
  for (let dx = 0; dx < 3; dx++) w.put(x + dx, y, z, "smooth_stone");
  return w.out;
}

/**
 * A two-high cactus on the sand at (x, z): cactus at y and y+1 (plan: y=1 and 2). The sand under it is not written;
 * the caller's ground part owns that cell.
 */
export function barrel_cactus(g, x, z, y = 1, opts = {}) {
  const w = writer(g, opts);
  w.put(x, y, z, "cactus");
  w.put(x, y + 1, z, "cactus");
  return w.out;
}

/**
 * A patio table on one dark_oak_fence leg at (x, y, z), with a smooth_quartz_slab top at y+1 and a chair on each side
 * along axis ("x" or "z"). The chairs are smooth_quartz_stairs whose full back is on the far side, so the seat faces the
 * table. Footprint: three cells along axis, y and y+1.
 */
export function patio_table(g, x, z, axis = "x", y = 1, opts = {}) {
  const w = writer(g, opts);
  const [a, b] = axis === "z" ? [[x, z - 1, "north"], [x, z + 1, "south"]] : [[x - 1, z, "west"], [x + 1, z, "east"]];
  w.put(x, y, z, ...B.fence("dark_oak"));
  w.put(x, y + 1, z, ...B.slab("smooth_quartz", "bottom"));
  w.put(a[0], y, a[1], ...B.stairs("smooth_quartz", a[2], "bottom"));
  w.put(b[0], y, b[1], ...B.stairs("smooth_quartz", b[2], "bottom"));
  return w.out;
}

/**
 * Open spruce trapdoors standing in front of a wall, a vertical run from y0 to y1 at (x, z). facing is the side of the
 * wall they hang from (the hinge side); the halves alternate bottom and top down the run. Tile along the wall for a
 * panelled wall: the run is one column.
 */
export function panel_wall(g, x, z, y0 = 2, y1 = 4, facing = "north", opts = {}) {
  const w = writer(g, opts);
  for (let y = y0; y <= y1; y++) w.put(x, y, z, ...B.trapdoor("spruce", facing, (y - y0) % 2 === 0 ? "bottom" : "top", true));
  return w.out;
}

/**
 * A low coffee table: one spruce_slab bottom half on the floor at (x, y, z). No flower pot: a pot needs a full top face
 * under it, and a half slab has none, so the pot is left out rather than floated.
 */
export function coffee_table(g, x, z, y = 2, opts = {}) {
  const w = writer(g, opts);
  w.put(x, y, z, ...B.slab("spruce", "bottom"));
  return w.out;
}

/**
 * A galley kitchen that fills the 5x5 kitchen box: its back row (z) runs along the wall, its front is toward the room
 * (facing). Along x from the origin: an iron_block fridge (3 high), a white_concrete counter with a furnace (hob), a
 * cauldron (sink) and a smoker (oven) on top, then the counter's end cell. Spruce_trapdoor cupboards above the counter
 * at y+2. Breakfast bar on row z+3: spruce_fence legs at x+1 and x+3, a spruce_slab bottom top; birch_slab stools in
 * front of the legs on row z+4. The lanes at x and x+4 stay open between the bar and the room.
 * Footprint: x..x+4, y..y+2, z..z+4.
 */
export function galley_kitchen(g, x, z, facing = "south", y = 2, opts = {}) {
  const w = writer(g, opts);
  for (let dy = 0; dy <= 2; dy++) w.put(x, y + dy, z, "iron_block");
  for (let dx = 1; dx <= 4; dx++) w.put(x + dx, y, z, "white_concrete");
  w.put(x + 1, y + 1, z, "furnace", { facing, lit: "false" });
  w.put(x + 2, y + 1, z, "cauldron");
  w.put(x + 3, y + 1, z, "smoker", { facing, lit: "false" });
  for (let dx = 1; dx <= 4; dx++) w.put(x + dx, y + 2, z, ...B.trapdoor("spruce", facing, "top", false));
  for (const dx of [1, 3]) w.put(x + dx, y, z + 3, ...B.fence("spruce"));
  for (const dx of [1, 2, 3]) w.put(x + dx, y + 1, z + 3, ...B.slab("spruce", "bottom"));
  for (const dx of [1, 3]) w.put(x + dx, y, z + 4, ...B.slab("birch", "bottom"));
  return w.out;
}
