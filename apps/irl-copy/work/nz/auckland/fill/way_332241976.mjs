import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Saint Benedict's Parish Hall, Mt Eden. Reading of the record: a 1920s-30s brick-and-render parish hall. Red brick piers,
// cream render stringcourses and lintels, clear glass in a grid, a stone base, a flat roof with a parapet, and a
// belfry tower on the high ridge. The lidar roof is 16-18 on the ridge (four storeys of 4) and 12-14 on the wing (three).
// The street front is z = 0, where the ground is lowest: a pair of doors sit on the ground floor there.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241976.cells.json", "utf8"));

const W = 17, H = 31, D = 19;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inF = (x, z) => foot.has(key(x, z));

// Flat tiers instead of the lidar's noise: a 4-storey block with its roof at 16 (parapet to 18), and a 3-storey wing with its roof at 12.
const topOf = (x, z) => (foot.get(key(x, z)).roof >= 15 ? 16 : 12);
const outsideDirs = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
// Walls stand on the outside edge and wherever one tier steps against another.
const isRing = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz) || topOf(x + dx, z + dz) !== topOf(x, z));

const g = new Voxels([W, H, D]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const panes = [];   // { x, y, z, axis: "z" | "x" } for each glass pane, so the connections can be set after

// 1. Foundation under each cell, a floor slab per storey inside, and the roof on every cell at its tier's top.
for (const [x, z, ground] of cells) {
  const top = topOf(x, z), ring = isRing(x, z);
  for (let y = 0; y < ground; y++) set(x, y, z, "stone_bricks");
  if (!ring) for (const k of [0, 4, 8, 12]) if (k >= ground && k < top) set(x, k, z, "smooth_stone");
  set(x, top, z, "smooth_stone");
}

// 2. The walls: from the foundation up to the roof, with a base course, cream stringcourses and lintels at each storey line,
//    brick piers every third cell, and glass between them. Corners are cream.
const glowAt = [];
for (const [x, z, ground] of cells) {
  if (!isRing(x, z)) continue;
  const top = topOf(x, z), outs = outsideDirs(x, z), corner = outs.length >= 2;
  for (let y = ground; y < top; y++) {
    if (y === 0) { set(x, y, z, "stone_bricks"); continue; }
    if (y % 4 === 0 || y % 4 === 3) { set(x, y, z, "smooth_quartz"); continue; }
    if (corner) { set(x, y, z, "smooth_quartz"); continue; }
    if (outs.length === 0) { set(x, y, z, "bricks"); continue; }
    const [dx, dz] = outs[0];
    const j = dx !== 0 ? z : x;
    if (j % 3 === 0) { set(x, y, z, "bricks"); continue; }
    set(x, y, z, "glass_pane");
    panes.push({ x, y, z, axis: dx !== 0 ? "x" : "z" });
    if ((j + y) % 7 === 0) glowAt.push({ x: x - dx, y, z: z - dz });   // a warm lamp just inside some windows
  }
  if (outs.length) {
    // The outside edge's coping: a cream course on the roof line, and a parapet on the ridge.
    set(x, top, z, "smooth_quartz");
    if (top === 16) { set(x, 17, z, "bricks"); set(x, 18, z, "stone_brick_slab", { type: "bottom" }); }
    else set(x, 13, z, "stone_brick_slab", { type: "bottom" });
  }
}

// The two front doors, under a cream lintel at the front of the ground floor.
for (const x of [2, 3]) {
  const hinge = x === 2 ? "left" : "right";
  set(x, 1, 0, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  set(x, 2, 0, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}

// Warm lights behind the glass (inside only, never through the wall).
for (const { x, y, z } of glowAt) if (inF(x, z) && !isRing(x, z)) set(x, y, z, "glowstone");

// 3. A belfry on the ridge, 4 by 4: cream floor and ceiling, brick corners, open arches on each face, a cap, a pinnacle.
for (let x = 7; x <= 10; x++) for (let z = 7; z <= 10; z++) {
  const edge = x === 7 || x === 10 || z === 7 || z === 10;
  const corner = (x === 7 || x === 10) && (z === 7 || z === 10);
  set(x, 17, z, "smooth_quartz");
  set(x, 21, z, "smooth_quartz");
  set(x, 22, z, "stone_bricks");
  if (edge) for (let y = 18; y <= 20; y++) if (corner) set(x, y, z, "bricks");
}
set(8, 20, 8, "lantern", { hanging: "true", waterlogged: "false" });
for (const [x, z] of [[8, 8], [9, 8], [8, 9], [9, 9]]) set(x, 23, z, "copper_block");
set(8, 24, 8, "lantern", { hanging: "false", waterlogged: "false" });

// Roof plant: two air-handling units on the ridge roof.
for (const [x, z] of [[9, 13], [10, 13], [9, 14], [10, 14]]) set(x, 17, z, "iron_block");

// The panes connect across their own wall face only, to the blocks beside them.
for (const { x, y, z, axis } of panes) {
  const on = (dx, dz) => (g.get(x + dx, y, z + dz) ? "true" : "false");
  const st = axis === "z"
    ? { north: "false", south: "false", east: on(1, 0), west: on(-1, 0) }
    : { north: on(0, -1), south: on(0, 1), east: "false", west: "false" };
  set(x, y, z, "glass_pane", { ...st, waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241976.nbt";
const stats = g.save(out);
console.log(`saved ${out}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
