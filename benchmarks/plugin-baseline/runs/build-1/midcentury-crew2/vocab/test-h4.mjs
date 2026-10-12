// Tests for vocab/h4.mjs. Each helper is built at its real house coordinates (plan.md's ROOMS and SITE) inside a test room
// the size of the smallest space plan.md puts it in: walls with the shell's openings left as air, a floor, a sentinel
// block where it must not write. Checks: the blocks and states it placed, that it wrote only what it counted as placed,
// and that walkReport says the room is "ok" (walkable from its entrance). Run: node vocab/test-h4.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { walkReport } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/rooms.mjs";
import * as h4 from "./h4.mjs";

const SIZE = [34, 9, 34];
let passed = 0, failed = 0;
const ok = (name, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "ok  " : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
};
const run = (name, fn) => {
  console.log(name);
  try { fn(); } catch (e) { failed++; console.log(`  FAIL threw: ${e.message}`); }
};

// block id and the given state values of the cell at (x, y, z)
const is = (g, x, y, z, block, state = {}) => {
  const c = g.get(x, y, z);
  return !!c && c.block === `minecraft:${block}` && Object.entries(state).every(([k, v]) => c.state?.[k] === String(v));
};
const air = (g, x, y, z) => g.isAir(x, y, z);
const cube = (x0, y0, z0, x1, y1, z1) => {
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) cells.push([x, y, z]);
  return cells;
};

// A test room. box = the interior air [x0,y0,z0,x1,y1,z1]. Indoors: a floor one block below, stone walls and a roof
// around it. Outdoors: a ground layer one block around the box. openings: cells left as air (the shell's openings).
// setup(g) runs last, before the helper, to place sentinels or pit floors.
function makeRoom({ box, indoor = true, openings = [], ground = "dirt", setup }) {
  const g = new Grid(SIZE);
  const [x0, y0, z0, x1, y1, z1] = box;
  if (indoor) {
    g.fill([x0, y0 - 1, z0], [x1, y0 - 1, z1], "smooth_stone");
    for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
      if (x === x0 - 1 || x === x1 + 1 || z === z0 - 1 || z === z1 + 1) g.fill([x, y0, z], [x, y1, z], "stone_bricks");
    }
    g.fill([x0 - 1, y1 + 1, z0 - 1], [x1 + 1, y1 + 1, z1 + 1], "stone_bricks");
  } else {
    g.fill([x0 - 1, y0 - 1, z0 - 1], [x1 + 1, y0 - 1, z1 + 1], ground);
  }
  for (const [x, y, z] of openings) g.unset(x, y, z);
  setup?.(g);
  return g;
}

// Walkable from the entrance: the room's verdict is "ok" and the entrance itself stands in the flood.
function walkable(g, name, box, entrance) {
  const r = walkReport(g, { rooms: [{ name, box }], entrance });
  const room = r.rooms[0];
  ok(`${name}: entrance stands`, r.reached(...entrance));
  ok(`${name}: walkable`, room.verdict === "ok", `${room.reached}/${room.standable} floor cells reached, ${room.verdict}`);
}

// Runs a helper and checks that the grid grew by exactly the cells it reported as placed (nothing else written).
function built(g, fn) {
  const before = g.cells.size;
  const r = fn();
  ok("writes only what it counts as placed", g.cells.size - before === r.placed, `placed ${r.placed}, skipped ${r.skipped}`);
  return r;
}

// ---- glass_bay: master bedroom, the full-height glass on the east wall --------------------------------------------
run("glass_bay: master bedroom east wall (x=31, z 21..23, y 2..4)", () => {
  const MASTER = [23, 2, 22, 30, 4, 24];
  const g = makeRoom({
    box: MASTER,
    openings: [...cube(31, 2, 21, 31, 4, 23), ...cube(22, 2, 23, 22, 3, 23)],
    setup: (g) => g.set(31, 3, 22, "stone"),                                 // sentinel: must not be replaced
  });
  const r = built(g, () => h4.glass_bay(g, 21, 23, 31, 2, 4, { along: "z" }));
  ok("8 glass panes placed, sentinel left", r.placed === 8 && r.skipped === 1, `placed ${r.placed}, skipped ${r.skipped}`);
  ok("glass at (31,2,21) and (31,4,23)", is(g, 31, 2, 21, "glass_pane") && is(g, 31, 4, 23, "glass_pane"));
  ok("sentinel stone kept at (31,3,22)", is(g, 31, 3, 22, "stone"));
  walkable(g, "master bedroom", MASTER, [23, 2, 23]);
});

run("glass_bay: along x (x 13..16 at z=8, y 3..4)", () => {
  const g = makeRoom({ box: [11, 2, 9, 21, 4, 24], openings: cube(13, 3, 8, 16, 4, 8) });
  const r = built(g, () => h4.glass_bay(g, 13, 16, 8, 3, 4));
  ok("8 panes placed along x", r.placed === 8 && r.skipped === 0 && is(g, 16, 4, 8, "glass_pane") && is(g, 12, 3, 8, "stone_bricks"));
});

// ---- ledgestone_wall: freestanding north feature wall, outside the house --------------------------------------
run("ledgestone_wall: feature wall x 11..17 at z=7, y 1..4, cap y=5", () => {
  const SITE = [9, 1, 1, 18, 4, 9];
  const g = makeRoom({ box: SITE, indoor: false, ground: "sand", setup: (g) => g.set(12, 2, 7, "stone") });
  const r = built(g, () => h4.ledgestone_wall(g, 11, 17, 7, 1, 4, 7));
  ok("27 stone cells + 5 caps placed, sentinel left", r.placed === 32 && r.skipped === 1, `placed ${r.placed}, skipped ${r.skipped}`);
  let packed = 0;
  for (let x = 11; x <= 17; x++) for (let y = 1; y <= 4; y++) if (is(g, x, y, 7, "packed_mud")) packed++;
  ok("about 25% packed_mud (3..12 of 28 cells)", packed >= 3 && packed <= 12, `${packed} of 28`);
  ok("caps on x=11,12,14,15,17 (mud_brick_slab bottom)", [11, 12, 14, 15, 17].every((x) => is(g, x, 5, 7, "mud_brick_slab", { type: "bottom" })));
  ok("no cap over the beam lines x=13, 16", air(g, 13, 5, 7) && air(g, 16, 5, 7));
  ok("sentinel stone kept at (12,2,7)", is(g, 12, 2, 7, "stone"));
  walkable(g, "front walk (ledgestone)", SITE, [9, 1, 1]);
});

// ---- carport: flat deck on posts, beside the house's west wall ----------------------------------------------------
run("carport: deck x 0..9 z 7..21 on posts x=1, beams y=4, fascia y=5", () => {
  const SITE = [1, 1, 7, 9, 4, 21];
  const g = makeRoom({ box: SITE, indoor: false, ground: "dirt", setup: (g) => g.set(5, 5, 10, "stone") });
  const r = built(g, () => h4.carport(g, 0, 7, 9, 21));
  ok("188 placed, deck sentinel left", r.placed === 188 && r.skipped === 1, `placed ${r.placed}, skipped ${r.skipped}`);
  ok("posts at (1, 1..3, z) for z=8,14,20", [8, 14, 20].every((z) => is(g, 1, 2, z, "dark_oak_log", { axis: "y" })));
  ok("beam along x at (5,4,14), axis x", is(g, 5, 4, 14, "dark_oak_log", { axis: "x" }));
  ok("deck slab bottom at (9,5,10)", is(g, 9, 5, 10, "smooth_stone_slab", { type: "bottom" }));
  ok("fascia dark_oak_slab on x=0, z=7 and z=21", is(g, 0, 5, 10, "dark_oak_slab", { type: "bottom" }) && is(g, 5, 5, 7, "dark_oak_slab", { type: "bottom" }) && is(g, 5, 5, 21, "dark_oak_slab", { type: "bottom" }));
  ok("no floor written (ground at y=0 kept)", is(g, 5, 0, 10, "dirt"));
  walkable(g, "carport", SITE, [9, 1, 7]);

  const g2 = makeRoom({ box: SITE, indoor: false, ground: "dirt" });
  h4.carport(g2, 0, 7, 9, 21, { floor: true });
  ok("floor: true lays smooth_stone over the ground at y=0", is(g2, 5, 0, 10, "smooth_stone"));
});

// ---- car_50s: parked on the driveway, nose to the street ----------------------------------------------------------
run("car_50s: x 3..5, z 1..7, nose north", () => {
  const BAY = [1, 1, 1, 8, 4, 8];
  const g = makeRoom({ box: BAY, indoor: false, ground: "dirt", setup: (g) => g.set(4, 1, 4, "stone") });
  const r = built(g, () => h4.car_50s(g, 3, 1));
  ok("31 placed, body sentinel left", r.placed === 31 && r.skipped === 1, `placed ${r.placed}, skipped ${r.skipped}`);
  ok("nose: yellow headlamps at (3,1,1) and (5,1,1), iron bumper (4,1,1)", is(g, 3, 1, 1, "yellow_concrete") && is(g, 5, 1, 1, "yellow_concrete") && is(g, 4, 1, 1, "iron_block"));
  ok("tyres black at (3,1,2), (5,1,2), (3,1,6), (5,1,6)", is(g, 3, 1, 2, "black_concrete") && is(g, 5, 1, 2, "black_concrete") && is(g, 3, 1, 6, "black_concrete") && is(g, 5, 1, 6, "black_concrete"));
  ok("tail lamps red at (3,1,7), (5,1,7)", is(g, 3, 1, 7, "red_concrete") && is(g, 5, 1, 7, "red_concrete"));
  ok("glass windscreen (3,2,3) and roof strip (4,2,4) white", is(g, 3, 2, 3, "glass_pane") && is(g, 4, 2, 4, "white_concrete"));
  ok("tail fins white at (3,2,7), (5,2,7)", is(g, 3, 2, 7, "white_concrete") && is(g, 5, 2, 7, "white_concrete"));
  ok("sentinel body kept at (4,1,4)", is(g, 4, 1, 4, "stone"));
  walkable(g, "driveway", BAY, [1, 1, 8]);

  const g2 = makeRoom({ box: [1, 1, 1, 8, 4, 8], indoor: false, ground: "dirt" });
  const r2 = h4.car_50s(g2, 1, 1, "east");
  ok("facing east: 32 placed, nose at x=7", r2.placed === 32 && is(g2, 7, 1, 1, "yellow_concrete") && is(g2, 7, 1, 2, "iron_block") && is(g2, 7, 1, 3, "yellow_concrete"));
});

// ---- mailbox: head of the driveway -------------------------------------------------------------------------------
run("mailbox: fence post at (9,1,1), smoker box at (9,2,1)", () => {
  const SITE = [7, 1, 1, 11, 4, 4];
  const g = makeRoom({ box: SITE, indoor: false, ground: "sand", setup: (g) => g.set(9, 1, 1, "stone") });
  const r = built(g, () => h4.mailbox(g, 9, 1));
  ok("smoker placed, post sentinel left", r.placed === 1 && r.skipped === 1);
  ok("smoker at (9,2,1) facing east, not lit", is(g, 9, 2, 1, "smoker", { facing: "east", lit: "false" }));
  walkable(g, "front walk (mailbox)", SITE, [7, 1, 1]);
});

// ---- garden_lamp: flanking the entry path --------------------------------------------------------------------------
run("garden_lamp: fence post y=1..2, lantern y=3 (standing)", () => {
  const YARD = [14, 1, 3, 24, 4, 7];
  const g = makeRoom({ box: YARD, indoor: false, ground: "sand", setup: (g) => g.set(21, 3, 5, "stone") });
  const r1 = built(g, () => h4.garden_lamp(g, 17, 5));
  const r2 = built(g, () => h4.garden_lamp(g, 21, 5));
  ok("first lamp: 3 placed; second: sentinel at its lantern", r1.placed === 3 && r2.placed === 2 && r2.skipped === 1);
  ok("lantern hanging=false at (17,3,5)", is(g, 17, 3, 5, "lantern", { hanging: "false" }));
  ok("fence at (17,1,5) and (17,2,5)", is(g, 17, 1, 5, "dark_oak_fence") && is(g, 17, 2, 5, "dark_oak_fence"));
  walkable(g, "yard (garden lamps)", YARD, [14, 1, 3]);
});

// ---- sofa_low: low orange sofa in the living room, away from the pit -----------------------------------------------
run("sofa_low: living room, x 18..21 z 19..20, facing south", () => {
  const LIVING = [11, 2, 19, 21, 4, 24];
  const g = makeRoom({
    box: LIVING,
    openings: [...cube(22, 2, 19, 22, 3, 20)],                              // the doorway to the corridor
    setup: (g) => g.set(19, 2, 19, "stone"),                                // sentinel in the backrest
  });
  const r = built(g, () => h4.sofa_low(g, 18, 19, 4, "x", "south"));
  ok("7 placed, backrest sentinel left", r.placed === 7 && r.skipped === 1, `placed ${r.placed}, skipped ${r.skipped}`);
  ok("seats: stairs at (19,2,20), (20,2,20) facing north (back to the backrest)", is(g, 19, 2, 20, "smooth_red_sandstone_stairs", { facing: "north", half: "bottom" }) && is(g, 20, 2, 20, "smooth_red_sandstone_stairs", { facing: "north" }));
  ok("arms at (18,2,20) facing west, (21,2,20) facing east", is(g, 18, 2, 20, "smooth_red_sandstone_stairs", { facing: "west" }) && is(g, 21, 2, 20, "smooth_red_sandstone_stairs", { facing: "east" }));
  ok("backrest iron_trapdoor open at (21,2,19)", is(g, 21, 2, 19, "iron_trapdoor", { open: "true", half: "bottom" }));
  ok("bad facing for the axis throws", (() => { try { h4.sofa_low(makeRoom({ box: LIVING }), 18, 19, 4, "x", "east"); return false; } catch { return true; } })());
  walkable(g, "living", LIVING, [11, 2, 22]);
});

// ---- conversation_pit: sunken pit at x 13..17, z 20..23 in the living room ------------------------------------------
run("conversation_pit: rim x 13..17 z 20..23 (floor y=0 from the shell)", () => {
  const LIVING = [11, 2, 19, 21, 4, 24];
  const g = makeRoom({
    box: LIVING,
    openings: [...cube(22, 2, 19, 22, 3, 20)],
    setup: (g) => {
      for (let x = 13; x <= 17; x++) for (let z = 20; z <= 23; z++) { g.unset(x, 1, z); g.set(x, 0, z, "smooth_quartz"); }
      g.set(13, 1, 22, "stone");                                             // sentinel on the west rim
    },
  });
  const r = built(g, () => h4.conversation_pit(g, 13, 20, 17, 23));
  ok("25 placed, rim sentinel left", r.placed === 25 && r.skipped === 1, `placed ${r.placed}, skipped ${r.skipped}`);
  ok("corner quartz slabs (bottom) at (13,1,20) and (17,1,23)", is(g, 13, 1, 20, "smooth_quartz_slab", { type: "bottom" }) && is(g, 17, 1, 23, "smooth_quartz_slab", { type: "bottom" }));
  ok("rim stairs face outward: (13,1,21) west, (15,1,20) north, (15,1,23) south, (17,1,22) east", is(g, 13, 1, 21, "smooth_quartz_stairs", { facing: "west" }) && is(g, 15, 1, 20, "smooth_quartz_stairs", { facing: "north" }) && is(g, 15, 1, 23, "smooth_quartz_stairs", { facing: "south" }) && is(g, 17, 1, 22, "smooth_quartz_stairs", { facing: "east" }));
  ok("orange carpet cushion on the stair at (13,2,21)", is(g, 13, 2, 21, "orange_carpet"));
  ok("coffee table: spruce_slab bottom at (15,1,21), flower_pot at (15,2,21)", is(g, 15, 1, 21, "spruce_slab", { type: "bottom" }) && is(g, 15, 2, 21, "flower_pot"));
  ok("pit interior left open at (14,1,21)", air(g, 14, 1, 21));
  ok("pit floor y=0 not written", is(g, 14, 0, 21, "smooth_quartz"));
  walkable(g, "living (pit)", LIVING, [11, 2, 22]);
});

// ---- bed_double: bedroom 2, 5 by 3 (x 26..30, z 18..20), head to the east wall -----------------------------------
run("bed_double: bedroom 2, foot (28,19), head east, headboard (30,19)", () => {
  const BED2 = [26, 2, 18, 30, 4, 20];
  const g = makeRoom({
    box: BED2,
    openings: [...cube(25, 2, 19, 25, 3, 19), ...cube(29, 2, 17, 29, 3, 17)],  // door to the corridor, door to bath 2
    setup: (g) => g.set(30, 2, 19, "stone"),                                   // sentinel: the headboard cell
  });
  const r = built(g, () => h4.bed_double(g, 28, 19, "east", "orange"));
  ok("6 placed, headboard sentinel left", r.placed === 6 && r.skipped === 1, `placed ${r.placed}, skipped ${r.skipped}`);
  ok("foot at (28,2,19) and head at (29,2,19), orange_bed facing east", is(g, 28, 2, 19, "orange_bed", { facing: "east", part: "foot" }) && is(g, 29, 2, 19, "orange_bed", { facing: "east", part: "head" }));
  ok("nightstands: spruce_fence (29,2,18) and (29,2,20), birch_slab bottom on them at y=3", is(g, 29, 2, 18, "spruce_fence") && is(g, 29, 2, 20, "spruce_fence") && is(g, 29, 3, 18, "birch_slab", { type: "bottom" }) && is(g, 29, 3, 20, "birch_slab", { type: "bottom" }));
  walkable(g, "bedroom 2", BED2, [26, 2, 19]);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
