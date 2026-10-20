// Seven Ferry Building helpers from plan.md's VOCABULARY: archWindow, pilasterPair, quoinCorner, bell, flag, truss, stall.
// Each takes its position (and facing, where it has one) as arguments and writes only inside the footprint it owns, and
// only into air: a cell outside the footprint, or one already built, is refused and reported in `refused`, never thrown.
// `overwrite: true` lifts the air rule (for masonry the caller means to replace). Block ids are plan.md's PALETTE, checked
// for 1.21.1 with `mcd blocks --version 1.21.1 --check`.
import { B, trussPlan } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// A writer for one footprint, the inclusive box [x0, y0, z0, x1, y1, z1]: put() writes a cell when it lies in the box and
// is air (or overwrite is set), and refuses it otherwise.
function writer(g, box, { overwrite = false } = {}) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const cells = [], refused = [];
  const put = (x, y, z, block, state, nbt) => {
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
    if (!inside || (!overwrite && !g.isAir(x, y, z))) return void refused.push([x, y, z, block, inside ? "not air" : "outside footprint"]);
    g.set(x, y, z, block, state, nbt);
    cells.push([x, y, z, block]);
  };
  return { put, result: () => ({ cells, refused }) };
}

const within = (box, room) => box.every((v, i) => (i < 3 ? v >= room[i] : v <= room[i]));

/** Two quartz_pillar columns at x and x+1 on the plane z: a polished_andesite base at y0, quartz_bricks cap at y1
 *  (the entrance pavilion's pilasters: y0 1, y1 28). */
export function pilasterPair(g, x, z, { y0 = 1, y1 = 28, overwrite = false } = {}) {
  const wr = writer(g, [x, y0, z, x + 1, y1, z], { overwrite });
  for (const px of [x, x + 1]) {
    wr.put(px, y0, z, "polished_andesite");
    for (let y = y0 + 1; y < y1; y++) wr.put(px, y, z, "quartz_pillar", { axis: "y" });
    wr.put(px, y1, z, "quartz_bricks");
  }
  return wr.result();
}

/** Quoins on the 2x2 corner at (x, z) to (x+1, z+1), courses y0..y1. Each course is the corner's L of quartz_bricks: the
 *  2-long stone and the 1-long stone of plan.md meet at the corner cell, and in a 2x2 corner both orders take the same
 *  three cells, so every course is the same set of blocks. */
export function quoinCorner(g, x, z, y0, y1, { overwrite = false } = {}) {
  const wr = writer(g, [x, y0, z, x + 1, y1, z + 1], { overwrite });
  for (let y = y0; y <= y1; y++) {
    wr.put(x, y, z, "quartz_bricks");
    wr.put(x + 1, y, z, "quartz_bricks");
    wr.put(x, y, z + 1, "quartz_bricks");
  }
  return wr.result();
}

/** An arched window cut in the wall plane z, facing `face` (north or south: the way the sill and head project to the
 *  street). w by h glazed cells from (x0, y0), a crown row of w-2 panes at y0+h, smooth_quartz stair voussoirs at the crown's
 *  ends, and a smooth_quartz_slab sill (top half) at y0-1, one cell proud of the wall. */
export function archWindow(g, { x0, y0, z, w, h, face, overwrite = false } = {}) {
  if (face !== "north" && face !== "south") throw new Error(`archWindow: face must be north or south, got ${face}`);
  const out = face === "north" ? -1 : 1;
  const x1 = x0 + w - 1, top = y0 + h;
  const wr = writer(g, [x0, y0 - 1, Math.min(z, z + out), x1, top, Math.max(z, z + out)], { overwrite });
  for (let x = x0; x <= x1; x++) wr.put(x, y0 - 1, z + out, ...B.slab("smooth_quartz", "top"));
  const pane = { north: "false", east: "true", south: "false", west: "true" };   // a row of panes joins east and west
  for (let y = y0; y < top; y++) for (let x = x0; x <= x1; x++) wr.put(x, y, z, "gray_stained_glass_pane", pane);
  for (let x = x0 + 1; x < x1; x++) wr.put(x, top, z, "gray_stained_glass_pane", pane);
  wr.put(x0, top, z, ...B.stairs("smooth_quartz", "east", "top"));
  wr.put(x1, top, z, ...B.stairs("smooth_quartz", "west", "top"));
  return wr.result();
}

/** A ceiling bell at (x, y, z), hung from a polished_deepslate column at y+1..y+3 (the belfry's bell column: y 77 and
 *  78..80). facing: the way the bell faces. */
export function bell(g, x, y, z, { facing = "north", overwrite = false } = {}) {
  const wr = writer(g, [x, y, z, x, y + 3, z], { overwrite });
  for (let dy = 1; dy <= 3; dy++) wr.put(x, y + dy, z, "polished_deepslate");
  wr.put(x, y, z, "bell", { attachment: "ceiling", facing });
  return wr.result();
}

/** The flagpole at x, z: end_rod at y, iron_bars to y+3, and a 2x2 of wool on the east at x+1..x+2 (top row y+3, bottom
 *  row y+2). wool: [top-left, top-right, bottom-left, bottom-right]. plan.md names the three wools but not their layout;
 *  the default is white and red over blue and white. */
export function flag(g, x, y, z, { wool = ["white_wool", "red_wool", "blue_wool", "white_wool"], overwrite = false } = {}) {
  const wr = writer(g, [x, y, z, x + 2, y + 3, z], { overwrite });
  wr.put(x, y, z, "end_rod", { facing: "up" });
  for (let dy = 1; dy <= 3; dy++) wr.put(x, y + dy, z, "iron_bars", { north: "false", south: "false", west: "false", east: dy >= 2 ? "true" : "false" });
  wr.put(x + 1, y + 3, z, wool[0]);
  wr.put(x + 2, y + 3, z, wool[1]);
  wr.put(x + 1, y + 2, z, wool[2]);
  wr.put(x + 2, y + 2, z, wool[3]);
  return wr.result();
}

/** One nave truss in the plane x, drawn by the trusses tool (trussPlan, the same simulation as `mcd trusses`) under the
 *  finished roof. z0, z1: the walls it spans (the nave's inside is z0+1..z1-1; nave z14 and z64); y: the eave course
 *  (the first air row above the wall). Returns `dropped`, the truss blocks the planner put in other columns, and the report.
 *  Build the roof before calling it: the truss measures the roof it finds. */
export function truss(g, x, { y = 27, z0 = 14, z1 = 64, material = "stripped_spruce_log", overwrite = false } = {}) {
  // a rect four wide so the planner has a span to work with; only the column at x is kept
  const { blocks, reports } = trussPlan(g, { footprint: [[x - 2, z0, x + 1, z1]], y, ridgeAxis: "x", material });
  const wr = writer(g, [x, y, z0 + 1, x, g.size[1] - 1, z1 - 1], { overwrite });
  let dropped = 0;
  for (const [bx, by, bz, block, state] of blocks) {
    if (bx !== x) { dropped++; continue; }
    wr.put(bx, by, bz, block, state);
  }
  return { ...wr.result(), dropped, report: reports[0]?.text ?? "no truss fits here" };
}

/** A market stall: three barrels in a row along x at (x..x+2, y, z) with a spruce_slab counter on top at y+1. The floor
 *  is the nave's stand course (y 1). room: the box the stall must fit inside (rooms.json); refused outside it. */
export function stall(g, x, z, { y = 1, room, overwrite = false } = {}) {
  const box = [x, y, z, x + 2, y + 1, z];
  if (room && !within(box, room)) return { cells: [], refused: [[x, y, z, "stall", "outside room"]] };
  const wr = writer(g, box, { overwrite });
  for (let i = 0; i < 3; i++) {
    wr.put(x + i, y, z, "barrel", { facing: "up", open: "false" });
    wr.put(x + i, y + 1, z, ...B.slab("spruce", "bottom"));
  }
  return wr.result();
}
