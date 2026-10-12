// Calls every vocab/h3.mjs helper once on a small grid and checks the blocks, states and footprints they produce.
// Run: node test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h3.mjs";

const g = new Grid([44, 12, 40]);
g.fill([0, 0, 0], [43, 0, 39], "grass_block");
g.fill([0, 0, 0], [43, 0, 4], "gray_concrete_powder");      // street asphalt
g.fill([0, 0, 22], [34, 0, 33], "gray_concrete_powder");    // forecourt and parking asphalt
const fails = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); };

const expectBlock = (x, y, z, id, st = {}) => {
  const c = g.get(x, y, z);
  const got = c ? c.block.replace("minecraft:", "") : "air";
  const gs = c?.state ?? {};
  ok(got === id && Object.entries(st).every(([k, v]) => gs[k] === String(v)),
    `(${x},${y},${z}) want ${id} ${JSON.stringify(st)}, got ${got} ${JSON.stringify(gs)}`);
};
const snap = () => new Map([...g.cells.values()].map((c) => [c.pos.join(","), JSON.stringify([c.block, c.state ?? {}])]));
const changed = (before) => [...g.cells.values()]
  .filter((c) => before.get(c.pos.join(",")) !== JSON.stringify([c.block, c.state ?? {}])).map((c) => c.pos);
const within = (box, pos) => pos.every((v, i) => v >= box[i] && v <= box[i + 3]);

/** Runs one helper: everything it changed lies in `box` (its footprint), and its placed count matches the changes. */
const call = (name, box, fn) => {
  const before = snap();
  const r = fn();
  const ch = changed(before);
  const outside = ch.filter((p) => !within(box, p));
  ok(outside.length === 0, `${name} wrote outside its footprint at ${outside.map((p) => p.join(","))}`);
  ok(r.placed === ch.length, `${name} reports ${r.placed} placed, changed ${ch.length}`);
  return r;
};

call("pump_island", [13, 1, 11, 14, 2, 18], () => H.pump_island(g, 13, 11, 18));
expectBlock(13, 1, 14, "polished_andesite");
expectBlock(14, 2, 18, "yellow_concrete");
expectBlock(13, 2, 14, "air");

call("centre_dashes", [0, 0, 2, 41, 0, 2], () => H.centre_dashes(g, 0, 41));
expectBlock(0, 0, 2, "yellow_concrete");
expectBlock(3, 0, 2, "gray_concrete_powder");
expectBlock(6, 0, 2, "yellow_concrete");

call("glass_double_door", [16, 1, 24, 17, 4, 24], () => H.glass_double_door(g, 16, 24, "north"));
expectBlock(16, 1, 24, "iron_door", { facing: "north", half: "lower", hinge: "left" });
expectBlock(17, 2, 24, "iron_door", { facing: "north", half: "upper", hinge: "right" });
expectBlock(16, 3, 24, "light_blue_stained_glass_pane", { east: "true", west: "false" });
expectBlock(17, 4, 24, "light_blue_stained_glass_pane", { west: "true", east: "false" });

call("logo_panel", [25, 4, 23, 26, 6, 23], () => H.logo_panel(g, 25, 4, 23));
expectBlock(25, 5, 23, "white_concrete");
expectBlock(26, 6, 23, "red_concrete");

call("hvac_unit", [26, 9, 28, 27, 10, 29], () => H.hvac_unit(g, 26, 28));
expectBlock(26, 9, 28, "iron_block");
expectBlock(27, 10, 29, "iron_trapdoor", { half: "top", open: "false" });

call("parking_stall", [1, 0, 23, 4, 0, 26], () => H.parking_stall(g, 1, 23, 26));
expectBlock(1, 0, 23, "white_concrete");
expectBlock(4, 0, 26, "white_concrete");
expectBlock(2, 0, 24, "gray_concrete_powder");

call("ice_chest", [25, 1, 22, 27, 2, 22], () => H.ice_chest(g, 25, 22));
expectBlock(26, 1, 22, "white_concrete");
expectBlock(27, 2, 22, "smooth_quartz_slab", { type: "bottom" });

call("birch_tree", [0, 1, 8, 4, 7, 12], () => H.birch_tree(g, 2, 10));
expectBlock(2, 0, 10, "grass_block");
expectBlock(2, 5, 10, "birch_log", { axis: "y" });
expectBlock(0, 4, 8, "air");
expectBlock(2, 7, 10, "birch_leaves", { persistent: "true" });

// Writes only into air: a second pass over a finished unit places nothing.
const again = H.pump_island(g, 13, 11, 18);
ok(again.placed === 0 && again.skipped.length > 0, "pump_island wrote over finished cells");
const door2 = H.glass_double_door(g, 16, 24, "north");
ok(door2.placed === 0 && door2.skipped.length === 8, "glass_double_door did not refuse a door already in place");

if (fails.length) {
  console.log(fails.join("\n"));
  console.log(`FAIL ${fails.length} of ${checks} checks`);
  process.exit(1);
}
console.log(`PASS ${checks} checks, 8 helpers`);
