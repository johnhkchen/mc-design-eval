// Plot 2 (I-house) round 2, all inside x 24..35. Fire IN the end-wall line (25,3,12 opening east / 34,3,12 opening west),
// flue in the wall line straight up, outer masonry in the plot's side column (x 24 / 35, z 11..13) plus brick at the wall-line
// cells z 11 and 13; the flue's room side is an open spruce trapdoor lying flat against it (no breast), brick from the roof up.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const D = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/millkit2";
const g = load(`${D}/v3.nbt`), v1 = load(`${D}/v1.nbt`);
const TOP = 18, ROOFY = 15;
const CHIM = /^(minecraft:)?(bricks|brick_slab|brick_stairs|deepslate_bricks|hay_block|campfire|furnace|stone_bricks)$/;
const ends = [
  { wall: 25, out: 24, room: 26, open: "east" },
  { wall: 34, out: 35, room: 33, open: "west" },
];
for (const e of ends) {
  // 1. restore the rooms: the old breast column (and stove) goes, v1's roof tiles come back
  for (let y = 1; y <= 21; y++) for (let z = 11; z <= 13; z++) {
    const cur = g.get(e.room, y, z), o = v1.get(e.room, y, z);
    if (cur && CHIM.test(cur.block)) { if (o && !CHIM.test(o.block)) g.set(e.room, y, z, o.block, o.state); else g.set(e.room, y, z, "air"); }
    else if (!cur && o && !CHIM.test(o.block)) g.set(e.room, y, z, o.block, o.state);
  }
  // 2. the stack: side column and the wall-line cells at z 11 / 13 as brick, ground to the top; nothing above
  for (let y = 1; y <= 21; y++) for (const x of [e.out, e.wall]) for (const z of [11, 13]) g.set(x, y, z, y <= TOP ? "bricks" : "air");
  for (let y = 1; y <= 21; y++) { g.set(e.out, y, 12, y <= TOP ? "bricks" : "air"); g.set(e.wall, y, 12, y <= TOP ? "bricks" : "air"); }
  // 3. fire, hay, lintel, flue with thin spruce trapdoors on the room side below the roof
  chimney(g, { at: [e.wall, 3, 12], open: e.open, top: TOP, material: "bricks", thin: "spruce", roofY: ROOFY });
  // above the roof the room side is the stack's own brick, not a trapdoor
  for (let y = ROOFY; y <= TOP; y++) g.set(e.room, y, 12, "bricks");
}
g.save(`${D}/chimney/plot2-r2.nbt`);
console.log("saved");
