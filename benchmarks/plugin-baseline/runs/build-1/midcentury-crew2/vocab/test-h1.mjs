// Tests for vocab/h1.mjs. Each helper is built in a walled test room the size of the smallest space plan.md uses it in,
// then checked for the blocks it placed and for a walkable room (walkReport verdict "ok").
// Run: node vocab/test-h1.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { walkReport } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/rooms.mjs";
import * as h1 from "./h1.mjs";

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const short = (block) => block.replace(/^minecraft:/, "");
const at = (g, x, y, z) => short(g.blockAt(x, y, z));
const newLot = (size = [40, 10, 40]) => new Grid(size);

// A walled test room. inner = [x0, z0, x1, z1]. floorY=1 is a house floor (standing y=2..4, ceiling y=5);
// floorY=0 is ground-level (the ground is the floor, walls y=1..3, no ceiling unless asked).
// The whole lot gets smooth_stone ground at y=0 so the outside is walkable. open(x, y, z) leaves a cell as air
// (a door, or a cell the helper under test fills); noFloor and ceilingSkip leave footprint cells clear.
function room(g, inner, o = {}) {
  const { floorY = 1, ceiling = true, open = () => false, noFloor = () => false, ceilingSkip = () => false, ground = () => true } = o;
  const [x0, z0, x1, z1] = inner;
  for (let x = 0; x < 40; x++) for (let z = 0; z < 40; z++) if (ground(x, z)) g.set(x, 0, z, "smooth_stone");
  if (floorY === 1) {
    for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
      if (!noFloor(x, z)) g.set(x, 1, z, "smooth_stone");
    }
  }
  const ring = (x, z) => x === x0 - 1 || x === x1 + 1 || z === z0 - 1 || z === z1 + 1;
  for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
    if (!ring(x, z)) continue;
    for (let y = floorY + 1; y <= floorY + 3; y++) if (!open(x, y, z)) g.set(x, y, z, "white_concrete");
  }
  if (ceiling) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (!ceilingSkip(x, z)) g.set(x, floorY + 4, z, "spruce_planks");
    }
  }
}

// Walkable: every standable cell of each room reached from the entrance (verdict "ok").
function assertWalk(g, rooms, entrance) {
  const r = walkReport(g, { rooms, entrance });
  assert.ok(r.start > 0, `entrance ${entrance} does not stand`);
  const bad = r.rooms.filter((x) => x.verdict !== "ok");
  assert.deepEqual(bad, [], `room not walkable: ${JSON.stringify(bad)}`);
}

// A grid view that shifts every y by dy, so the deep pool (y=-2) can be written in world coordinates.
function shifted(g, dy) {
  const w = new Proxy(g, {
    get(t, p) {
      if (p === "set") return (x, y, z, ...r) => { t.set(x, y + dy, z, ...r); return w; };
      if (p === "isAir") return (x, y, z) => t.isAir(x, y + dy, z);
      if (p === "blockAt") return (x, y, z) => t.blockAt(x, y + dy, z);
      const v = Reflect.get(t, p);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
  return w;
}

test("stucco_wall fills air, skips a filled cell, room stays walkable", () => {
  const g = newLot();
  // street wall z=8 is air at y=2..4 for the helper; the room is x 10..17, z 9..13
  room(g, [10, 9, 17, 13], { open: (x, y, z) => (z === 8 && x >= 10 && x <= 17 && y >= 2 && y <= 4) || (x === 13 && z === 14 && y <= 3 && y >= 2) });
  g.set(11, 3, 8, "smooth_stone");
  const r = h1.stucco_wall(g, 10, 8, 17, 8);
  assert.equal(r.placed, 23);
  assert.deepEqual(r.skipped, [[11, 3, 8, "white_concrete"]]);
  assert.equal(at(g, 10, 2, 8), "white_concrete");
  assert.equal(at(g, 17, 4, 8), "white_concrete");
  assert.equal(at(g, 11, 3, 8), "smooth_stone");
  assertWalk(g, [{ name: "front room", box: [10, 2, 9, 17, 4, 13] }], [13, 1, 15]);
});

test("slider_gap glazes y=4 only and leaves the gap open", () => {
  const g = newLot();
  // master bedroom is x 23..30, z 22..24; south wall z=25 is air over the sliders at x 26..27
  room(g, [23, 22, 30, 24], {
    open: (x, y, z) => (z === 21 && x === 23 && (y === 2 || y === 3)) || (z === 25 && (x === 26 || x === 27) && y >= 2 && y <= 4),
  });
  const r = h1.slider_gap(g, 26, 25);
  assert.equal(r.placed, 2);
  assert.deepEqual(r.skipped, []);
  for (const x of [26, 27]) {
    assert.equal(at(g, x, 4, 25), "glass_pane");
    assert.equal(at(g, x, 2, 25), "air");
    assert.equal(at(g, x, 3, 25), "air");
  }
  assertWalk(g, [{ name: "master bedroom", box: [23, 2, 22, 30, 4, 24] }], [23, 1, 20]);
});

test("roof_band lays slabs on the band, skips the atrium and chimney holes", () => {
  const g = newLot();
  // the whole house interior is the smallest space the roof bands span (x 9..32)
  room(g, [10, 8, 31, 25], { open: (x, y, z) => z === 7 && x === 19 && (y === 2 || y === 3) });
  const eave = h1.roof_band(g, 6, 7, 6, "bottom");
  assert.equal(eave.placed, 48);
  assert.equal(g.get(9, 6, 6).state.type, "bottom");
  const ridge = h1.roof_band(g, 12, 17, 6, "top");
  assert.equal(ridge.placed, 24 * 6 - 5 * 6);            // atrium hole x 17..21 z 12..17 is skipped
  assert.equal(at(g, 19, 6, 14), "air");
  assert.equal(g.get(9, 6, 12).state.type, "top");
  const chim = h1.roof_band(g, 21, 22, 6, "bottom");
  assert.equal(chim.placed, 24 * 2 - 2 * 2);             // chimney hole x 20..21 z 21..22
  assert.equal(at(g, 20, 6, 21), "air");
  assertWalk(g, [{ name: "house", box: [10, 2, 8, 31, 4, 25] }], [19, 1, 6]);
});

test("breeze_screen is a checkerboard: white where x+y is even, air elsewhere", () => {
  const g = newLot();
  // carport bay: the ground is the floor, the screen closes its south side at z=21
  room(g, [1, 7, 9, 20], { floorY: 0, ceiling: false, open: (x, y, z) => z === 21 && y >= 1 && y <= 3 });
  const r = h1.breeze_screen(g, 1, 9, 1, 4, 21);
  assert.equal(r.placed, 18);                            // 9 columns x 4 rows, half of them
  for (let x = 1; x <= 9; x++) for (let y = 1; y <= 4; y++) {
    assert.equal(at(g, x, y, 21), (x + y) % 2 === 0 ? "white_concrete" : "air");
  }
  assertWalk(g, [{ name: "carport", box: [1, 1, 7, 9, 3, 20] }], [5, 1, 10]);
});

test("palm builds trunk and crown, persistent leaves, skips a filled crown cell", () => {
  const g = newLot();
  // front yard: the palm stands at (12, 3) in a 5x5 bed; (11, 6, 3) is already filled (a roof block)
  room(g, [10, 1, 14, 5], { floorY: 0, ceiling: false, open: (x, y, z) => z === 3 && x === 9 && (y === 1 || y === 2) });
  g.set(11, 6, 3, "spruce_planks");
  const r = h1.palm(g, 12, 3);
  assert.equal(r.placed, 7 + 8 + 12 - 1);                 // trunk 7, y=7 ring 8, y=6 crown 12, minus the filled cell
  assert.deepEqual(r.skipped, [[11, 6, 3, "jungle_leaves"]]);
  for (let y = 1; y <= 7; y++) assert.equal(at(g, 12, y, 3), "jungle_log");
  assert.equal(g.get(12, 7, 2).state.persistent, "true");
  assertWalk(g, [{ name: "front yard", box: [10, 1, 1, 14, 3, 5] }], [8, 1, 3]);
});

test("kidney_pool: floor, liner, water and coping on open deck; coping skipped on paved deck", () => {
  // the RESERVED footprint from plan.md (kidney pool, water y=-1..0, floor y=-2)
  const ROWS = { 29: [[14, 17], [20, 21]], 30: [[13, 22]], 31: [[13, 22]], 32: [[14, 21]] };
  const cells = Object.entries(ROWS).flatMap(([z, spans]) => spans.flatMap(([a, b]) => range(a, b).map((x) => [x, +z])));
  const inPool = (x, z) => cells.some(([a, b]) => a === x && b === z);
  const deck = new Set();
  for (const [x, z] of cells) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!inPool(x + dx, z + dz)) deck.add(`${x + dx},${z + dz}`);
  }
  const rim = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inPool(x + dx, z + dz));
  const rimCount = cells.filter(([x, z]) => rim(x, z)).length;
  assert.equal(cells.length, 34);

  // open ground: the pool and coping place in full
  const open = newLot([40, 9, 40]);
  const sOpen = shifted(open, 2);
  const a = h1.kidney_pool(sOpen, cells);
  assert.equal(a.placed, 3 * cells.length + deck.size);
  assert.deepEqual(a.skipped, []);
  for (const [x, z] of cells) {
    assert.equal(at(open, x, -2 + 2, z), "light_blue_concrete");
    assert.equal(at(open, x, -1 + 2, z), rim(x, z) ? "light_blue_concrete" : "water");
    assert.equal(at(open, x, 0 + 2, z), "water");
  }
  assert.equal(rimCount < cells.length, true);
  for (const k of deck) {
    const [x, z] = k.split(",").map(Number);
    assert.equal(at(open, x, 2, z), "smooth_quartz_slab");
    assert.equal(open.get(x, 2, z).state.type, "bottom");
  }

  // paved deck (the real build): the deck is smooth_stone at y=0, so coping is skipped and reported
  const paved = newLot([40, 9, 40]);
  const sPaved = shifted(paved, 2);
  room(sPaved, [11, 29, 24, 33], {
    floorY: 0, ceiling: false, ground: (x, z) => !inPool(x, z),
    open: (x, y, z) => z === 28 && x === 12 && (y === 1 || y === 2),
  });
  const b = h1.kidney_pool(sPaved, cells);
  assert.equal(b.placed, 3 * cells.length);
  assert.equal(b.skipped.length, deck.size);
  assert.ok(b.skipped.every(([, y, , block]) => y === 0 && block === "smooth_quartz_slab"));
  assertWalk(paved, [{ name: "pool deck", box: [11, 3, 29, 24, 5, 33] }], [12, 3, 27]);
});

test("hung_lantern hangs from a block above; refuses when nothing is above", () => {
  const g = newLot();
  // gallery: x 16..22, z 10 (one row deep); the ceiling is at y=5, but the (16, 5, 10) cell is left unfilled
  room(g, [16, 10, 22, 10], { open: (x, y, z) => z === 9 && x === 19 && (y === 2 || y === 3), ceilingSkip: (x) => x === 16 });
  const ok = h1.hung_lantern(g, 19, 10);
  assert.equal(ok.placed, 1);
  assert.equal(g.get(19, 4, 10).state.hanging, "true");
  assert.equal(g.get(19, 4, 10).block, "minecraft:lantern");
  const none = h1.hung_lantern(g, 16, 10);
  assert.equal(none.placed, 0);
  assert.equal(at(g, 16, 4, 10), "air");
  assert.match(none.reason, /hang/);
  assertWalk(g, [{ name: "gallery", box: [16, 2, 10, 22, 4, 10] }], [19, 1, 8]);
});

test("egg_chair: seat facing the sitter, open trapdoor back and sides, front lane clear", () => {
  const g = newLot();
  // living room x 11..21, z 19..24; the chair faces north (the atrium) with its back to the south
  room(g, [11, 19, 21, 24], { open: (x, y, z) => z === 18 && x === 15 && (y === 2 || y === 3) });
  const r = h1.egg_chair(g, 18, 22, "north");
  assert.equal(r.placed, 5);
  assert.equal(g.get(18, 2, 22).block, "minecraft:smooth_red_sandstone_stairs");
  assert.equal(g.get(18, 2, 22).state.facing, "south");   // solid back toward the chair's back
  for (const y of [2, 3]) {
    assert.equal(g.get(18, y, 23).block, "minecraft:iron_trapdoor");
    assert.equal(g.get(18, y, 23).state.open, "true");
    assert.equal(g.get(18, y, 23).state.facing, "north");
  }
  assert.equal(g.get(17, 2, 22).state.facing, "east");
  assert.equal(g.get(19, 2, 22).state.facing, "west");
  assert.equal(at(g, 18, 2, 21), "air");
  assert.equal(at(g, 18, 2, 20), "air");
  assertWalk(g, [{ name: "living", box: [11, 2, 19, 21, 4, 24] }], [15, 1, 17]);
});

test("fireplace_stack builds the Part 3 stack on its 2x2 footprint", () => {
  const g = newLot();
  // living room with the freestanding fireplace footprint (x 20..21, z 21..22) open at y=1 and y=5 for the stack
  const inStack = (x, z) => x >= 20 && x <= 21 && z >= 21 && z <= 22;
  room(g, [11, 19, 21, 24], { noFloor: inStack, ceilingSkip: inStack, open: (x, y, z) => z === 18 && x === 15 && (y === 2 || y === 3) });
  const r = h1.fireplace_stack(g, 20, 21);
  assert.equal(r.placed, 4 * (1 + 1 + 1 + 4 + 1));          // 8 per column pair: y1, y2, y3, y4..7, y8
  assert.deepEqual(r.skipped, []);
  assert.equal(at(g, 20, 2, 21), "campfire");
  assert.equal(g.get(20, 2, 21).state.lit, "true");
  assert.equal(at(g, 21, 2, 21), "mud_bricks");
  assert.equal(at(g, 21, 3, 22), "mud_bricks");
  assert.equal(at(g, 20, 7, 22), "black_concrete");
  assert.equal(at(g, 20, 8, 21), "smooth_stone_slab");
  assertWalk(g, [{ name: "living", box: [11, 2, 19, 21, 4, 24] }], [15, 1, 17]);
});

test("wardrobe: two-high planks at the back, open trapdoor fronts facing into the room", () => {
  const g = newLot();
  // bedroom 2 is x 26..30, z 18..20 (3 deep); the wardrobe takes the east wall, x 29..30, leaving x 26..28 clear
  room(g, [26, 18, 30, 20], { open: (x, y, z) => x === 25 && z === 19 && (y === 2 || y === 3) });
  const r = h1.wardrobe(g, 30, 18, 3, "z", "west");
  assert.equal(r.placed, 12);
  assert.equal(g.get(30, 2, 18).block, "minecraft:spruce_planks");
  assert.equal(g.get(30, 3, 20).block, "minecraft:spruce_planks");
  assert.equal(g.get(29, 2, 19).block, "minecraft:spruce_trapdoor");
  assert.equal(g.get(29, 2, 19).state.facing, "west");
  assert.equal(g.get(29, 2, 19).state.open, "true");
  assert.throws(() => h1.wardrobe(g, 30, 18, 3, "z", "north"), /across axis/);
  assertWalk(g, [{ name: "bedroom 2", box: [26, 2, 18, 30, 4, 20] }], [24, 1, 19]);
});
