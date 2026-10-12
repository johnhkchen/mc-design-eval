// Calls every vocab/h3.mjs helper once on a small grid and checks the blocks, states, footprints and skips they produce.
// Run: node test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h3.mjs";

const g = new Grid([20, 8, 20]);
g.fill([0, 0, 0], [19, 0, 19], "grass_block");
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

call("saddleNotch", [1, 2, 1, 1, 2, 1], () => H.saddleNotch(g, 1, 2, 1, "x"));
expectBlock(1, 2, 1, "spruce_log", { axis: "x" });
const again = call("saddleNotch over log", [1, 2, 1, 1, 2, 1], () => H.saddleNotch(g, 1, 2, 1, "z"));
ok(again.skipped.length === 1 && g.get(1, 2, 1).state.axis === "x", "saddleNotch overwrote a non-air cell");

call("doorPair", [5, 2, 1, 5, 3, 1], () => H.doorPair(g, 5, 2, 1, "north", "left"));
expectBlock(5, 2, 1, "spruce_door", { facing: "north", half: "lower", hinge: "left", open: "false" });
expectBlock(5, 3, 1, "spruce_door", { facing: "north", half: "upper", hinge: "left" });

call("millPost", [9, 1, 1, 9, 5, 1], () => H.millPost(g, 9, 1));
expectBlock(9, 1, 1, "stripped_spruce_log", { axis: "y" });
expectBlock(9, 5, 1, "stripped_spruce_log", { axis: "y" });

const bay = call("boardBay", [1, 1, 5, 8, 3, 5], () => H.boardBay(g, 1, 8, 5, 1, 3, { doorway: [3, 1, 5, 4, 2, 5] }));
expectBlock(2, 1, 5, "spruce_planks");
expectBlock(3, 1, 5, "air");
expectBlock(4, 2, 5, "air");
expectBlock(3, 3, 5, "spruce_planks");
ok(bay.placed === 20, `boardBay placed ${bay.placed}, want 20`);

call("lumberStack", [11, 1, 1, 13, 4, 6], () => H.lumberStack(g, 11, 1));
expectBlock(11, 1, 1, "stripped_spruce_wood", { axis: "x" });
expectBlock(12, 2, 3, "birch_planks");
expectBlock(11, 3, 2, "stripped_spruce_wood", { axis: "x" });
expectBlock(13, 4, 6, "birch_planks");

call("boilerFirebox", [16, 1, 2, 16, 1, 3], () => H.boilerFirebox(g, 16, 2));
expectBlock(16, 1, 2, "blast_furnace", { facing: "west", lit: "true" });
expectBlock(16, 1, 3, "furnace", { facing: "west", lit: "true" });

const st = call("stump", [15, 1, 8, 17, 2, 10], () => H.stump(g, 16, 9, 2));
expectBlock(16, 1, 9, "spruce_log", { axis: "y" });
expectBlock(16, 2, 9, "spruce_log", { axis: "y" });
expectBlock(17, 1, 9, "fern");
expectBlock(16, 0, 9, "grass_block");
ok(st.placed === 3, `stump placed ${st.placed}, want 3`);

call("pathRun", [1, 0, 12, 8, 0, 13], () => H.pathRun(g, 1, 12, 8, 12, 1));
expectBlock(4, 0, 12, "dirt_path");
expectBlock(4, 0, 13, "grass_block");
expectBlock(1, 0, 13, "dirt_path");

g.set(4, 0, 15, "stone");
const run = call("pathRun over stone", [1, 0, 15, 8, 0, 16], () => H.pathRun(g, 1, 15, 8, 15, 1));
expectBlock(4, 0, 15, "stone");
ok(run.skipped.length === 1, `pathRun skipped ${run.skipped.length}, want 1 (the stone)`);

const throws = (fn) => { try { fn(); return false; } catch { return true; } };
ok(throws(() => H.saddleNotch(g, 0, 0, 0, "x")), "saddleNotch accepted y = 0");
ok(throws(() => H.saddleNotch(g, 0, 2, 0, "y")), "saddleNotch accepted axis y");
ok(throws(() => H.doorPair(g, 0, 2, 0, "up", "left")), "doorPair accepted facing up");

if (fails.length) {
  console.log(fails.join("\n"));
  console.log(`FAIL: ${fails.length} of ${checks} checks`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${checks} checks, 8 helpers`);
}
