// Tests for vocab/h3.mjs: each helper built in a small walled room the size of the smallest space plan.md puts it in,
// then checked for placed blocks and states, a refusal on a second run (air only), and walkReport "ok" on the room.
// Run: node vocab/test-h3.mjs   (exit 1 if any check fails)
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { walkReport } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/rooms.mjs";
import * as h from "./h3.mjs";

// A walled room over a floor at y=fy: floor block everywhere, walls ring around the box at y=fy+1..fy+3, roof over the box
// at fy+4 (optional). box = [x0, z0, x1, z1] with x0 >= 2 and z0 >= 2 so there is a cell outside to enter from.
function walledRoom(box, { fy = 1, floor = "smooth_stone", roof = true } = {}) {
  const [x0, z0, x1, z1] = box;
  const g = new Grid([x1 + 3, fy + 6, z1 + 3]);
  for (let x = 0; x < g.size[0]; x++) for (let z = 0; z < g.size[2]; z++) g.set(x, fy, z, floor);
  for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
    const ring = x === x0 - 1 || x === x1 + 1 || z === z0 - 1 || z === z1 + 1;
    for (let y = fy + 1; y <= fy + 3; y++) if (ring) g.set(x, y, z, "white_concrete");
    if (roof && !ring) g.set(x, fy + 4, z, "spruce_planks");
  }
  return g;
}

const room = (name, box, fy = 1) => ({ name, box: [box[0], fy + 1, box[1], box[2], fy + 3, box[3]] });

let failures = 0;
function test(name, fn) {
  try {
    const notes = fn() ?? [];
    console.log(`PASS ${name}${notes.length ? `  (${notes.join("; ")})` : ""}`);
  } catch (e) {
    failures++;
    console.log(`FAIL ${name}: ${e.message}`);
  }
}

const bare = (b) => String(b).replace(/^minecraft:/, "");
function expectCell(g, [x, y, z], block, state = {}) {
  const c = g.get(x, y, z);
  if (!c) throw new Error(`no block at ${x},${y},${z} (wanted ${block})`);
  if (bare(c.block) !== block) throw new Error(`at ${x},${y},${z} wanted ${block}, got ${bare(c.block)}`);
  for (const [k, v] of Object.entries(state)) {
    if (c.state?.[k] !== String(v)) throw new Error(`at ${x},${y},${z} ${block} wanted ${k}=${v}, got ${c.state?.[k]}`);
  }
}
function expectAir(g, [x, y, z]) {
  if (!g.isAir(x, y, z)) throw new Error(`lane cell ${x},${y},${z} is not clear (${bare(g.blockAt(x, y, z))})`);
}
function expectWalk(g, rooms, entrance) {
  const r = walkReport(g, { rooms, entrance });
  const bad = r.rooms.filter((x) => x.verdict !== "ok");
  if (bad.length) throw new Error(bad.map((x) => `${x.name}: ${x.verdict} (${x.reached}/${x.standable})`).join(", "));
  return r.rooms.map((x) => `${x.name} ${x.reached}/${x.standable} reached`);
}
function expectRefused(out, n) {
  if (out.placed !== 0 || out.refused.length !== n) throw new Error(`wanted placed 0 refused ${n}, got placed ${out.placed} refused ${out.refused.length}`);
}

// ---- post: the corner post of a 3x3 bay (house corners, plan.md form line 4) --------------------------------------
test("post: corner post in a 3x3 bay", () => {
  const g = walledRoom([2, 2, 4, 4]);
  const out = h.post(g, 2, 2);
  if (out.placed !== 3) throw new Error(`placed ${out.placed}`);
  for (const y of [2, 3, 4]) expectCell(g, [2, y, 2], "dark_oak_log", { axis: "y" });
  expectRefused(h.post(g, 2, 2), 3);
  return expectWalk(g, [room("bay", [2, 2, 4, 4])], [4, 2, 4]);
});

// ---- orange_entry: 5-wide gallery front, door in the north wall (plan.md: door at x=19, z=9) ---------------------
test("orange_entry: door, panels and transom in a 3x3 niche", () => {
  const g = walledRoom([17, 2, 21, 4]);
  for (let x = 18; x <= 20; x++) for (let y = 2; y <= 4; y++) g.unset(x, y, 1);   // the shell leaves the niche as air
  const out = h.orange_entry(g, 19, 1, "north");
  if (out.placed !== 9) throw new Error(`placed ${out.placed}, refused ${JSON.stringify(out.refused)}`);
  expectCell(g, [19, 2, 1], "acacia_door", { facing: "north", half: "lower", open: "false" });
  expectCell(g, [19, 3, 1], "acacia_door", { facing: "north", half: "upper" });
  expectCell(g, [19, 4, 1], "orange_concrete");
  for (const x of [18, 20]) for (const y of [2, 3, 4]) expectCell(g, [x, y, 1], "orange_concrete");
  expectRefused(h.orange_entry(g, 19, 1, "north"), 9);
  return expectWalk(g, [room("gallery", [17, 2, 21, 4])], [19, 2, 0]);
});

// ---- beam_line: beams along the 24-cell house length over the wall line x=10 (plan.md form line 3) ----------------
test("beam_line: beam along z over the wall line, 24 cells", () => {
  const g = walledRoom([11, 5, 15, 28], { roof: false });
  const out = h.beam_line(g, 10, 5, 28);
  if (out.placed !== 24) throw new Error(`placed ${out.placed}`);
  expectCell(g, [10, 5, 5], "dark_oak_log", { axis: "z" });
  expectCell(g, [10, 5, 28], "dark_oak_log", { axis: "z" });
  expectRefused(h.beam_line(g, 10, 5, 28), 24);
  return expectWalk(g, [room("living", [11, 5, 15, 28])], [11, 2, 5]);
});

// ---- stepping_pad: a 3-wide landing on the path (plan.md site line 11: pads at y=0 across x=18..20) -----------------
test("stepping_pad: 3 pads at y=0 across a path, ground under the rest", () => {
  // ground dirt at y=0 everywhere except the pad row z=4, which the ground part leaves as air (see summary)
  const g = new Grid([9, 5, 9]);
  for (let x = 0; x < 9; x++) for (let z = 0; z < 9; z++) if (!(z === 4 && x >= 3 && x <= 5)) g.set(x, 0, z, "dirt");
  const out = h.stepping_pad(g, 3, 5, 4);
  if (out.placed !== 3) throw new Error(`placed ${out.placed}`);
  for (const x of [3, 4, 5]) expectCell(g, [x, 0, 4], "smooth_stone");
  // over the dirt row the helper refuses (air only), and says so
  const onDirt = h.stepping_pad(g, 3, 5, 3);
  expectRefused(onDirt, 3);
  return expectWalk(g, [room("landing", [3, 3, 5, 5], 0)], [4, 1, 3]);
});

// ---- barrel_cactus: a cactus in a 5x5 sand yard, sand laid by the ground part (plan.md garden line 21) ------------
test("barrel_cactus: two cells of cactus on sand at y=1..2", () => {
  const g = walledRoom([2, 2, 6, 6], { fy: 0, floor: "sand", roof: false });
  const out = h.barrel_cactus(g, 4, 4);
  if (out.placed !== 2) throw new Error(`placed ${out.placed}`);
  expectCell(g, [4, 1, 4], "cactus");
  expectCell(g, [4, 2, 4], "cactus");
  expectCell(g, [4, 0, 4], "sand");                  // the helper leaves the sand alone
  expectRefused(h.barrel_cactus(g, 4, 4), 2);
  return expectWalk(g, [room("yard", [2, 2, 6, 6], 0)], [2, 1, 2]);
});

// ---- patio_table: 3-deep patio (z 26..28), table along x; and a 5-deep bay for the table along z ------------------
test("patio_table: axis x in the 3-deep patio, chairs east and west", () => {
  const g = walledRoom([10, 26, 17, 28], { fy: 0, roof: false });
  const out = h.patio_table(g, 12, 27, "x", 1);
  if (out.placed !== 4) throw new Error(`placed ${out.placed}`);
  expectCell(g, [12, 1, 27], "dark_oak_fence");
  expectCell(g, [12, 2, 27], "smooth_quartz_slab", { type: "bottom" });
  expectCell(g, [11, 1, 27], "smooth_quartz_stairs", { facing: "west", half: "bottom" });
  expectCell(g, [13, 1, 27], "smooth_quartz_stairs", { facing: "east", half: "bottom" });
  expectAir(g, [12, 1, 26]);
  expectAir(g, [12, 1, 28]);
  return expectWalk(g, [room("patio", [10, 26, 17, 28], 0)], [10, 1, 26]);
});
test("patio_table: axis z in a 5-deep bay, chairs north and south", () => {
  const g = walledRoom([10, 24, 17, 28], { fy: 0, roof: false });
  const out = h.patio_table(g, 14, 26, "z", 1);
  if (out.placed !== 4) throw new Error(`placed ${out.placed}`);
  expectCell(g, [14, 1, 25], "smooth_quartz_stairs", { facing: "north" });
  expectCell(g, [14, 1, 27], "smooth_quartz_stairs", { facing: "south" });
  expectAir(g, [13, 1, 26]);
  expectAir(g, [15, 1, 26]);
  return expectWalk(g, [room("bay", [10, 24, 17, 28], 0)], [10, 1, 24]);
});

// ---- panel_wall: 7-wide gallery, panelling on the north wall (plan.md ROOMS purposes, gallery) ----------------------
test("panel_wall: three columns of open trapdoors on the north wall of a 7x3 gallery", () => {
  const g = walledRoom([16, 10, 22, 12]);
  let placed = 0;
  for (const x of [17, 19, 21]) placed += h.panel_wall(g, x, 2, 4, 10, "north").placed;
  if (placed !== 9) throw new Error(`placed ${placed}`);
  expectCell(g, [17, 2, 10], "spruce_trapdoor", { facing: "north", half: "bottom", open: "true" });
  expectCell(g, [17, 3, 10], "spruce_trapdoor", { facing: "north", half: "top", open: "true" });
  expectRefused(h.panel_wall(g, 17, 2, 4, 10, "north"), 3);
  return expectWalk(g, [room("gallery", [16, 10, 22, 12])], [16, 2, 12]);
});

// ---- coffee_table: 5x4 conversation pit, floor y=0, standing y=1 (plan.md living room) ----------------------------
test("coffee_table: slab and flower pot at the pit centre", () => {
  const g = walledRoom([13, 20, 17, 23], { fy: 0, floor: "smooth_quartz", roof: false });
  const out = h.coffee_table(g, 15, 21, 1);
  if (out.placed !== 2) throw new Error(`placed ${out.placed}`);
  expectCell(g, [15, 1, 21], "spruce_slab", { type: "bottom" });
  expectCell(g, [15, 2, 21], "flower_pot");
  expectRefused(h.coffee_table(g, 15, 21, 1), 2);
  return expectWalk(g, [room("pit", [13, 20, 17, 23], 0)], [13, 1, 20]);
});

// ---- galley_kitchen: the 5x5 kitchen (plan.md ROOMS), counter on the north wall, bar on the south side -------------
test("galley_kitchen: north-wall galley, bar on row 13, kitchen opening at x=16", () => {
  const g = walledRoom([11, 9, 15, 13]);
  for (let y = 2; y <= 4; y++) for (const z of [9, 10]) g.unset(16, y, z);   // the gallery opening
  const out = h.galley_kitchen(g, 11, 15, 9, 13, "south", 2);
  if (out.placed !== 22) throw new Error(`placed ${out.placed}, refused ${JSON.stringify(out.refused)}`);
  expectCell(g, [11, 2, 9], "iron_block");
  expectCell(g, [13, 3, 9], "furnace", { facing: "south" });
  expectCell(g, [14, 3, 9], "cauldron");
  expectCell(g, [15, 3, 9], "smoker", { facing: "south" });
  expectCell(g, [12, 4, 9], "spruce_trapdoor", { facing: "north", half: "top" });
  expectCell(g, [12, 2, 13], "spruce_fence");
  expectCell(g, [13, 3, 13], "spruce_slab", { type: "bottom" });
  expectCell(g, [13, 2, 12], "birch_slab", { type: "bottom" });
  for (const z of [10, 11]) for (let x = 11; x <= 15; x++) { expectAir(g, [x, 2, z]); expectAir(g, [x, 3, z]); }
  expectRefused(h.galley_kitchen(g, 11, 15, 9, 13, "south", 2), 22);
  return expectWalk(g, [room("kitchen", [11, 9, 15, 13])], [17, 2, 10]);
});
test("galley_kitchen: south-wall galley (facing north), bar on row 9", () => {
  const g = walledRoom([11, 9, 15, 13]);
  for (let y = 2; y <= 4; y++) for (const z of [12, 13]) g.unset(16, y, z);
  const out = h.galley_kitchen(g, 11, 15, 13, 9, "north", 2);
  if (out.placed !== 22) throw new Error(`placed ${out.placed}, refused ${JSON.stringify(out.refused)}`);
  expectCell(g, [13, 3, 13], "furnace", { facing: "north" });
  expectCell(g, [13, 3, 9], "spruce_slab", { type: "bottom" });
  expectCell(g, [13, 2, 10], "birch_slab", { type: "bottom" });
  for (const z of [11, 12]) for (let x = 11; x <= 15; x++) { expectAir(g, [x, 2, z]); expectAir(g, [x, 3, z]); }
  return expectWalk(g, [room("kitchen", [11, 9, 15, 13])], [17, 2, 12]);
});

console.log(failures ? `${failures} FAILED` : "all h3 helpers passed");
process.exit(failures ? 1 : 0);
