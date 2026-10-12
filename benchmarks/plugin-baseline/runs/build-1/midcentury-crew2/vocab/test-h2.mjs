// Tests for vocab/h2.mjs. Each helper is built in a small walled room the size of the smallest space plan.md puts it
// in, then checked three ways: the cells it placed are the ones it should be (counts and specific cells), every state on
// every block is one `mcd states` lists for that block, and the room is still walkable (walkReport verdict "ok").
// Run: node vocab/test-h2.mjs   (exit 1 if any check fails)
import { execFileSync } from "node:child_process";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { walkReport } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/rooms.mjs";
import * as h2 from "./h2.mjs";

const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";
let failures = 0;
const check = (ok, what) => { if (!ok) { failures++; console.log(`    FAIL: ${what}`); } };
const at = (g, x, y, z) => g.blockAt(x, y, z).replace("minecraft:", "");
const stateOf = (g, x, y, z) => g.get(x, y, z)?.state ?? {};

// A test room: ground (`base`) across the whole grid, and a walled rectangle around the interior [x0,z0,x1,z1] at
// y = standY..standY+2 with `openings` (cells) left as air. Any layer between the ground and standY in the wall is a
// sill of the ground block, so a doorway always has a floor under it. Interior cells above the ground are air, as a shell leaves them.
function testRoom({ size = [40, 9, 40], base = 0, standY = base + 1, interior, openings = [], ground = "smooth_stone" }) {
  const g = new Grid(size);
  for (let x = 0; x < size[0]; x++) for (let z = 0; z < size[2]; z++) g.set(x, base, z, ground);
  const [x0, z0, x1, z1] = interior;
  const open = (x, y, z) => openings.some(([ox, oy, oz]) => ox === x && oy === y && oz === z);
  for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
    if (x > x0 - 1 && x < x1 + 1 && z > z0 - 1 && z < z1 + 1) continue;
    for (let y = base + 1; y < standY; y++) if (!open(x, y, z)) g.set(x, y, z, ground);
    for (let y = standY; y <= standY + 2; y++) if (!open(x, y, z)) g.set(x, y, z, "white_concrete");
  }
  return g;
}

// Every state on every block must be one `mcd states` lists. Waterlogged and powered are stored by the game but
// left out of the `mcd states` list, so they are not checked against it.
const stateCache = new Map();
const UNLISTED = new Set(["waterlogged", "powered"]);
function validStates(block) {
  if (!stateCache.has(block)) stateCache.set(block, JSON.parse(execFileSync("node", [MCD, "states", block], { encoding: "utf8" })).properties);
  return stateCache.get(block);
}
function checkStates(g, name) {
  for (const c of g) {
    const props = validStates(c.block.replace("minecraft:", ""));
    for (const [k, v] of Object.entries(c.state ?? {})) {
      if (UNLISTED.has(k)) continue;
      check(props[k]?.includes(v), `${name}: ${c.block} ${k}=${v} is not a valid state`);
    }
  }
}

// The room's inner air box must still let a player walk through it (the walk may start from the grid edge outside).
function checkWalk(g, name, box) {
  const r = walkReport(g, { rooms: [{ name, box }] });
  check(r.rooms[0].verdict === "ok", `${name}: walk verdict ${r.rooms[0].verdict} (${r.rooms[0].reached}/${r.rooms[0].standable} reached)`);
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("header_course", () => {
  // north wall of a 5-wide room; beam lines x=10, 13, 16 are skipped, so x=11, 12, 14, 15 get planks
  const g = testRoom({ base: 1, standY: 2, interior: [11, 9, 15, 13], openings: [[13, 2, 14], [13, 3, 14]] });
  const t = h2.header_course(g, 10, 16, 8, 8);
  check(t.placed === 4 && t.skipped.length === 0, `placed ${t.placed}, skipped ${t.skipped.length}`);
  for (const x of [11, 12, 14, 15]) check(at(g, x, 5, 8) === "dark_oak_planks", `plank at x=${x}`);
  for (const x of [10, 13, 16]) check(at(g, x, 5, 8) === "air", `beam line x=${x} left for the roof logs`);
  checkStates(g, "header_course");
  checkWalk(g, "header_course", [11, 2, 9, 15, 2, 13]);
});

test("clerestory", () => {
  // the north wall of the living room, x=21..31: the strip is the top course (y=4), x=22..30 at z=8
  const openings = [];
  for (let x = 22; x <= 30; x++) openings.push([x, 4, 8]);
  openings.push([26, 2, 14], [26, 3, 14]);
  const g = testRoom({ base: 1, standY: 2, interior: [21, 9, 31, 13], openings });
  const t = h2.clerestory(g);
  check(t.placed === 9 && t.skipped.length === 0, `placed ${t.placed}, skipped ${t.skipped.length}`);
  for (const x of [22, 23, 24, 26, 27, 29, 30]) check(at(g, x, 4, 8) === "glass_pane", `glass at x=${x}`);
  for (const x of [25, 28]) {
    check(at(g, x, 4, 8) === "dark_oak_log" && stateOf(g, x, 4, 8).axis === "y", `mullion log at x=${x}`);
  }
  checkStates(g, "clerestory");
  checkWalk(g, "clerestory", [21, 2, 9, 31, 2, 13]);
});

test("fascia_ring", () => {
  // the atrium (17..21 x 12..17) inside its ring walls, under the main roof: roof_band slabs first, then the fascia
  const g = testRoom({ base: 1, standY: 2, interior: [17, 12, 21, 17], openings: [[19, 2, 11], [19, 3, 11]] });
  for (let x = 9; x <= 32; x++) for (let z = 6; z <= 27; z++) {
    if (x >= 17 && x <= 21 && z >= 12 && z <= 17) continue;           // atrium hole
    if (x >= 20 && x <= 21 && z >= 21 && z <= 22) continue;           // chimney hole
    const band = h2.ROOF_BANDS.find((b) => z >= b.z0 && z <= b.z1);
    g.set(x, band.y, z, "smooth_stone_slab", { type: band.half, waterlogged: "false" });
  }
  const t = h2.fascia_ring(g);
  // outer ring: 24 + 24 on z=6 and z=27, 20 + 20 on x=9 and x=32; atrium rim: 7x8 box less the 5x6 hole = 26
  check(t.placed === 114 && t.skipped.length === 0, `placed ${t.placed}, skipped ${t.skipped.length}`);
  check(at(g, 9, 6, 6) === "dark_oak_slab" && stateOf(g, 9, 6, 6).type === "bottom", "outer corner, band A bottom");
  check(at(g, 32, 6, 27) === "dark_oak_slab" && stateOf(g, 32, 6, 27).type === "bottom", "outer corner, far end");
  check(at(g, 16, 6, 11) === "dark_oak_slab" && stateOf(g, 16, 6, 11).type === "top", "atrium rim, band B top");
  check(at(g, 22, 7, 15) === "dark_oak_slab" && stateOf(g, 22, 7, 15).type === "bottom", "atrium rim, band C bottom");
  check(at(g, 12, 6, 8) === "smooth_stone_slab", "interior roof left as roof_band wrote it");
  check(at(g, 19, 7, 15) === "air", "atrium hole stays open");
  checkStates(g, "fascia_ring");
  checkWalk(g, "fascia_ring", [17, 2, 12, 21, 2, 17]);
});

test("joint_row", () => {
  // air-only: no ground at y=0, so every cell is air and gets concrete
  const bare = new Grid([12, 3, 12]);
  const t0 = h2.joint_row(bare, 4, 2, 9);
  check(t0.placed === 8 && at(bare, 5, 0, 4) === "light_gray_concrete", `bare placed ${t0.placed}`);
  // a driveway with paving under it: air-only refuses, `over` replaces the paving it names
  const g = testRoom({ base: 0, standY: 1, interior: [2, 2, 9, 7], openings: [[5, 1, 1], [5, 2, 1]] });
  const refused = h2.joint_row(g, 4, 2, 9);
  check(refused.placed === 0 && refused.skipped.length === 8, `air-only over paving: placed ${refused.placed}`);
  const t = h2.joint_row(g, 4, 2, 9, { over: "smooth_stone" });
  check(t.placed === 8 && t.skipped.length === 0, `over paving: placed ${t.placed}`);
  for (let x = 2; x <= 9; x++) check(at(g, x, 0, 4) === "light_gray_concrete", `joint at x=${x}`);
  checkStates(g, "joint_row");
  checkWalk(g, "joint_row", [2, 1, 2, 9, 1, 7]);
});

test("saguaro", () => {
  // the cactus cluster on the gravel bed, x=23..29 z=2..4, on sand
  const g = testRoom({ base: 0, standY: 1, ground: "sand", interior: [23, 2, 29, 4], openings: [[22, 1, 3], [22, 2, 3]] });
  const t1 = h2.saguaro(g, 26, 3, 3);
  const t2 = h2.saguaro(g, 24, 2, 2);
  check(t1.placed === 5 && t2.placed === 2, `placed ${t1.placed} + ${t2.placed}`);
  check(at(g, 26, 1, 3) === "cactus" && at(g, 26, 3, 3) === "cactus", "trunk");
  check(at(g, 25, 2, 3) === "cactus" && at(g, 25, 3, 3) === "cactus", "arm at x-1, y=2..3");
  check(at(g, 25, 1, 3) === "air", "no arm below y=2");
  check(at(g, 26, 0, 3) === "sand", "sand under the cactus is not rewritten");
  let threw = false;
  try { h2.saguaro(g, 27, 2, 4); } catch { threw = true; }
  check(threw, "height 4 is refused");
  checkStates(g, "saguaro");
  checkWalk(g, "saguaro", [23, 1, 2, 29, 1, 4]);
});

test("lounger", () => {
  // the patio, z=26..28, on the smooth_stone deck at y=0
  const g = testRoom({ base: 0, standY: 1, interior: [10, 26, 13, 28], openings: [[9, 1, 27], [9, 2, 27]] });
  const t = h2.lounger(g, 11, 27, "x");
  const t2 = h2.lounger(g, 13, 26, "z");
  check(t.placed === 2 && t2.placed === 2, `placed ${t.placed} + ${t2.placed}`);
  check(at(g, 11, 1, 27) === "smooth_quartz_slab" && stateOf(g, 11, 1, 27).type === "bottom", "foot slab");
  check(at(g, 12, 1, 27) === "smooth_quartz_stairs" && stateOf(g, 12, 1, 27).facing === "east", "head stairs, back at the head end");
  check(at(g, 13, 1, 27) === "smooth_quartz_stairs" && stateOf(g, 13, 1, 27).facing === "south", "axis z head, back at the head end");
  let threw = false;
  try { h2.lounger(g, 11, 26, "y"); } catch { threw = true; }
  check(threw, "axis y is refused");
  checkStates(g, "lounger");
  checkWalk(g, "lounger", [10, 1, 26, 13, 1, 28]);
});

test("terrazzo_floor", () => {
  // the dining room floor, 5x5 at y=1 over the ground, the standing row at y=2
  const box = [11, 1, 14, 15, 1, 18];
  const g = testRoom({ base: 0, standY: 2, interior: [11, 14, 15, 18], openings: [[13, 2, 13], [13, 3, 13]] });
  const t = h2.terrazzo_floor(g, box, { seed: 7 });
  check(t.placed === 25 && t.skipped.length === 0, `placed ${t.placed}`);
  const kinds = new Set();
  for (let x = 11; x <= 15; x++) for (let z = 14; z <= 18; z++) kinds.add(at(g, x, 1, z));
  check([...kinds].every((b) => ["smooth_stone", "light_gray_concrete", "white_concrete"].includes(b)), `kinds ${[...kinds]}`);
  const again = testRoom({ base: 0, standY: 2, interior: [11, 14, 15, 18], openings: [[13, 2, 13], [13, 3, 13]] });
  h2.terrazzo_floor(again, box, { seed: 7 });
  let same = true;
  for (let x = 11; x <= 15; x++) for (let z = 14; z <= 18; z++) same &&= at(g, x, 1, z) === at(again, x, 1, z);
  check(same, "same seed gives the same floor");
  checkStates(g, "terrazzo_floor");
  checkWalk(g, "terrazzo_floor", [11, 2, 14, 15, 2, 18]);
});

test("sideboard", () => {
  // the dining room's west wall under the window: 3 cells along z at x=11, z=14..16, facing east
  const g = testRoom({ base: 1, standY: 2, interior: [11, 14, 15, 18], openings: [[13, 2, 19], [13, 3, 19]] });
  const t = h2.sideboard(g, 11, 14, 3, "z", "east");
  check(t.placed === 7 && t.skipped.length === 0, `placed ${t.placed}`);
  for (const z of [14, 15, 16]) {
    check(at(g, 11, 2, z) === "birch_trapdoor" && stateOf(g, 11, 2, z).facing === "east", `cabinet front z=${z}`);
    check(at(g, 11, 3, z) === "birch_slab" && stateOf(g, 11, 3, z).type === "top", `top slab z=${z}`);
  }
  check(at(g, 11, 4, 15) === "potted_cactus", "pot on the middle cell");
  checkStates(g, "sideboard");
  checkWalk(g, "sideboard", [11, 2, 14, 15, 2, 18]);
});

test("dining_set", () => {
  // the dining room (11..15 x 14..18), table on x=12..13 z=14..16, a beam over the lantern at x=13 (y=5)
  const g = testRoom({ base: 1, standY: 2, interior: [11, 14, 15, 18], openings: [[13, 2, 19], [13, 3, 19]] });
  for (let z = 14; z <= 18; z++) g.set(13, 5, z, "dark_oak_log", { axis: "z" });
  const t = h2.dining_set(g, 12, 14);
  check(t.placed === 17 && t.skipped.length === 0, `placed ${t.placed}, skipped ${t.skipped.length}`);
  check(at(g, 12, 2, 14) === "spruce_fence" && at(g, 13, 2, 16) === "spruce_fence", "four fence legs");
  check(at(g, 12, 3, 15) === "spruce_slab" && stateOf(g, 12, 3, 15).type === "bottom", "table top");
  check(at(g, 11, 2, 15) === "birch_stairs" && stateOf(g, 11, 2, 15).facing === "west", "west chair, back on the west");
  check(at(g, 14, 2, 15) === "birch_stairs" && stateOf(g, 14, 2, 15).facing === "east", "east chair, back on the east");
  check(at(g, 13, 4, 15) === "lantern" && stateOf(g, 13, 4, 15).hanging === "true", "pendant lantern under the beam");
  const nobeam = testRoom({ base: 1, standY: 2, interior: [11, 14, 15, 18], openings: [[13, 2, 19], [13, 3, 19]] });
  const t2 = h2.dining_set(nobeam, 12, 14);
  check(t2.skipped.some((s) => s[3].startsWith("lantern")) && at(nobeam, 13, 4, 15) === "air", "no beam, no pendant");
  checkStates(g, "dining_set");
  checkWalk(g, "dining_set", [11, 2, 14, 15, 2, 18]);
});

test("bath_fit", () => {
  // bath 1, 2x3 at x=26..27 z=14..16, door on the west wall at z=15
  const g = testRoom({ base: 1, standY: 2, interior: [26, 14, 27, 16], openings: [[25, 2, 15], [25, 3, 15]] });
  const t = h2.bath_fit(g, 26, 14);
  check(t.placed === 4 && t.skipped.length === 0, `placed ${t.placed}`);
  check(at(g, 26, 2, 14) === "smooth_quartz_stairs" && stateOf(g, 26, 2, 14).facing === "north", "tub, back to the wall");
  check(at(g, 26, 2, 16) === "cauldron", "basin");
  check(at(g, 27, 2, 16) === "smooth_quartz_stairs" && stateOf(g, 27, 2, 16).facing === "south", "WC");
  check(at(g, 27, 2, 15) === "air", "lane left clear");
  const blocked = testRoom({ base: 1, standY: 2, interior: [26, 14, 27, 16], openings: [[25, 2, 15], [25, 3, 15]] });
  blocked.set(26, 2, 16, "white_concrete");
  const t2 = h2.bath_fit(blocked, 26, 14);
  check(t2.placed === 3 && t2.skipped.length === 1 && t2.skipped[0][3] === "white_concrete", "refuses a cell already built");
  checkStates(g, "bath_fit");
  checkWalk(g, "bath_fit", [26, 2, 14, 27, 2, 16]);
});

for (const [name, fn] of tests) {
  const before = failures;
  try { fn(); } catch (e) { failures++; console.log(`    FAIL: ${name} threw: ${e.message}`); }
  console.log(`${failures === before ? "PASS" : "FAIL"} ${name}`);
}
console.log(failures === 0 ? `all ${tests.length} helpers passed` : `${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
