// Vocabulary helpers from plan.md (VOCABULARY), second set. Every helper takes plot-local coordinates, writes only
// into air (over: true lets it replace what is there, still only inside its own footprint), and returns
// { placed, skipped: [[x,y,z]...] } so the caller sees what was refused. Nothing is written below its footprint.
import { B, bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const report = () => ({ placed: 0, skipped: [] });
const outward = (face) => (face === "east" ? 1 : -1);

// One cell: [block, state] into air (or over the block there when over is set). Out of the grid counts as refused.
function put(g, r, [x, y, z], [block, state], over = false) {
  if (!g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) { r.skipped.push([x, y, z]); return false; }
  g.set(x, y, z, block, state);
  r.placed++;
  return true;
}

// Both halves of a door or none: a door never half-writes.
function putPair(g, r, cells, over = false) {
  if (!over && cells.some(([c]) => !g.inBounds(...c) || !g.isAir(...c))) { cells.forEach(([c]) => r.skipped.push(c)); return false; }
  cells.forEach(([c, b]) => put(g, r, c, b, over));
  return true;
}

/** Awning canopy over a shopfront run: dark_oak_slab (top) over x0..x1, z0..z1 at y; a bracket at x0, y-1 on each
 *  pier's two z (piers = the pier start z values, default every 9 from z0). The bracket's back faces the wall: into. */
export function awning_run(g, { x0, x1, y = 9, z0, z1, piers, into = "east", over = false }) {
  const r = report();
  const starts = piers ?? Array.from({ length: Math.floor((z1 - z0) / 9) + 1 }, (_, k) => z0 + 9 * k);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(g, r, [x, y, z], B.slab("dark_oak", "top"), over);
  for (const p of starts) for (const z of [p, p + 1]) if (z >= z0 && z <= z1) put(g, r, [x0, y - 1, z], B.stairs("dark_oak", into, "top"), over);
  return r;
}

/** Window box under an upper window: spruce_slab (top) at [x, y, z..z+width-1], one potted flower standing on each
 *  slab at y+1 (flower: an id or a list, cycled). A pot is placed only where the slab is there to stand on. */
export function window_box(g, { x, z, y = 11, width = 2, flower = "potted_poppy", over = false }) {
  const r = report(), pots = [flower].flat();
  for (let i = 0; i < width; i++) {
    put(g, r, [x, y, z + i], B.slab("spruce", "top"), over);
    if (!g.isAir(x, y, z + i)) put(g, r, [x, y + 1, z + i], [pots[i % pots.length]], over);
  }
  return r;
}

/** Name board on the wall plane x: mat fills y0..y1 x z0..z1, then `text` in banner letters hung in front of it,
 *  on the side face says (face: the way the board looks; the letters sit at x -/+ 1). Letter count in r.letters. */
export function shop_board(g, { x, y0, y1, z0, z1, mat = "dark_oak_planks", text, letter = "black", base = "white", face = "west", over = false }) {
  const r = report();
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(g, r, [x, y, z], [mat], over);
  r.letters = bannerWord(g, String(text).toUpperCase(), {
    center: [x + outward(face), y0 + Math.floor((y1 - y0) / 2), Math.floor((z0 + z1) / 2)], face, letter, base,
  });
  return r;
}

/** Hanging lantern under an awning slab at [x, y, z]: it needs a block above (y+1), else nothing is written.
 *  chain: a chain (id `chain`, 1.21.1 name) hangs from the block above at y and the lantern hangs from the chain. */
export function awning_lantern(g, { x = 0, y = 8, z, chain = false, over = false }) {
  const r = report();
  if (g.isAir(x, y + 1, z)) { r.skipped.push([x, y, z]); return r; }
  if (chain) {
    put(g, r, [x, y, z], ["chain", { axis: "y", waterlogged: "false" }], over);
    put(g, r, [x, y - 1, z], B.lantern(true), over);
  } else {
    put(g, r, [x, y, z], B.lantern(true), over);
  }
  return r;
}

/** Arched upper window on the wall plane x, 3 wide at z..z+2 (glass is the glazier's): sill slab top proud of the
 *  wall at y0-1; brick voussoirs (half top) at the head row y1 in the outer cells, facing away from the centre;
 *  cut_sandstone keystone over the centre at y1+1. The opening rows y0..y1 are left as they are. */
export function arch_window(g, { x, z, y0, y1, face = "east", over = false }) {
  const r = report();
  for (let i = 0; i < 3; i++) put(g, r, [x + outward(face), y0 - 1, z + i], B.slab("smooth_sandstone", "top"), over);
  put(g, r, [x, y1, z], B.stairs("brick", "north", "top"), over);
  put(g, r, [x, y1, z + 2], B.stairs("brick", "south", "top"), over);
  put(g, r, [x, y1 + 1, z + 1], ["cut_sandstone"], over);
  return r;
}

/** Solid 2x2 brick chimney, first row y0 (the row above the deck): bricks to y0+height-1, a deepslate_bricks band two
 *  rows below the top, a stone_brick_slab cap (bottom) on top. deck: the deck's y; when given, the stack is footed down
 *  to it (air cells only, nothing is written at the deck itself). */
export function brick_stack(g, { x, z, y0, height = 6, deck, over = false }) {
  const r = report();
  const column = (y) => [[x, y, z], [x + 1, y, z], [x, y, z + 1], [x + 1, y, z + 1]];
  const top = y0 + height - 1, band = top - 2;
  for (let y = (deck ?? y0 - 1) + 1; y < y0; y++) for (const c of column(y)) put(g, r, c, ["bricks"], over);
  for (let y = y0; y <= top; y++) for (const c of column(y)) put(g, r, c, [y === band ? "deepslate_bricks" : "bricks"], over);
  for (const c of column(top + 1)) put(g, r, c, B.slab("stone_brick", "bottom"), over);
  return r;
}

/** Half step at a door: bottom stone_brick_slab at [x, y, z..z+width-1], y = the paving row + 1 (the walk side is x).
 *  The two rows above it stay clear: nothing is written there. */
export function door_step(g, { x, z, y, width = 2, over = false }) {
  const r = report();
  for (let i = 0; i < width; i++) put(g, r, [x, y, z + i], B.slab("stone_brick", "bottom"), over);
  return r;
}

/** Butterworth pavilion doorway on the wall plane x, 4 wide at z..z+3 (door row y): a double dark_oak door at z+1..z+2
 *  (y, y+1; hinges outside), a glass transom above it at y+2..y+3, and a smooth_sandstone_stairs voussoir pair at
 *  z and z+3 over the cut_sandstone keystone at z+1..z+2, rows y+4..y+5. Facing = the way the front looks (face). */
export function pavilion_door(g, { x, z, y = 9, face = "east", over = false }) {
  const r = report();
  putPair(g, r, [[[x, y, z + 1], B.door("dark_oak", face, "lower", "left")], [[x, y + 1, z + 1], B.door("dark_oak", face, "upper", "left")]], over);
  putPair(g, r, [[[x, y, z + 2], B.door("dark_oak", face, "lower", "right")], [[x, y + 1, z + 2], B.door("dark_oak", face, "upper", "right")]], over);
  for (const row of [y + 2, y + 3]) {
    put(g, r, [x, row, z + 1], ["glass_pane", { north: "false", south: "true", east: "false", west: "false", waterlogged: "false" }], over);
    put(g, r, [x, row, z + 2], ["glass_pane", { north: "true", south: "false", east: "false", west: "false", waterlogged: "false" }], over);
  }
  for (const row of [y + 4, y + 5]) {
    put(g, r, [x, row, z], B.stairs("smooth_sandstone", "north", "top"), over);
    put(g, r, [x, row, z + 3], B.stairs("smooth_sandstone", "south", "top"), over);
    put(g, r, [x, row, z + 1], ["cut_sandstone"], over);
    put(g, r, [x, row, z + 2], ["cut_sandstone"], over);
  }
  return r;
}
