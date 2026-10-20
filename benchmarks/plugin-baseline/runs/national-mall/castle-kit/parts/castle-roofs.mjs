// Plot 0 Smithsonian Castle roofs, spires, battlements, flagpole, glow, lamps, uplights, lawns, path, parterre.
// Runs after the castle shell (the roof tool needs the walls). Gable roofs go on the masses with the roof tool; every
// tower the roofs must not touch is a keep box. Spires, battlements and finials are hand-placed by the vocabulary.
import { B, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  slateRoof, slateSpire, battlements, flagpole, lampPost, uplight, parterre, CASTLE_TOWERS, CASTLE_FLAGPOLE,
} from "../vocab.mjs";

// every tower shaft as a keep box: no gable roof writes into a tower
// plus the shell's own cells that sit in a roof's path: the wing's east-face corbel at x7 (in the west range's gable end),
// and the tower bands on z11 under the range's eave; the roof leaves them as the shell built them
const KEEP = [
  ...Object.values(CASTLE_TOWERS).map((t) => ({ from: [t.x0, 0, t.z0], to: [t.x1, 27, t.z1] })),
  { from: [7, 8, 9], to: [7, 8, 13] }, { from: [47, 8, 9], to: [47, 8, 13] },   // wing corbels at x7 and x47
  { from: [9, 11, 11], to: [13, 11, 11] }, { from: [14, 11, 11], to: [14, 11, 11] },   // tower bands on z11
  { from: [52, 11, 5], to: [52, 11, 5] }, { from: [52, 11, 9], to: [52, 11, 9] },    // T7 band cells
  { from: [1, 9, 7], to: [6, 11, 7] }, { from: [1, 9, 15], to: [6, 11, 15] },          // wing gable triangles (shell's)
  { from: [48, 9, 6], to: [54, 12, 6] }, { from: [48, 9, 16], to: [54, 12, 16] },      // east wing gable triangles
];

// a gable on one mass: the roof tool, the slate family's palette (one block, no texture pass), every tower kept clear.
// overhang is per side: 1 where the eave hangs free, 0 where the roof's end meets a neighbouring mass (the gable
// ends die into the towers and ranges, the wall's job)
function gable(g, rect, y, ridgeAxis, overhang) {
  const spec = slateRoof({
    family: "castle", style: "gable", ridgeAxis, keep: KEEP, texture: false,
    material: "deepslate_tiles", verge: "deepslate_tiles", overhang,
    edges: { fascia: false, soffit: false },   // the roof tool's default fascia and soffit are spruce: off-palette
  });
  const { style, ...o } = spec;
  return roof(g, rect, style, { ...o, y });
}

// a finial stands on its spire's bottom-slab cap: under a lightning rod, that slab becomes a full block (no half-block air)
function footRods(g, rects) {
  for (const [x0, z0, x1, z1] of rects) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = 10; y <= 20; y++) {
    if (g.blockAt(x, y, z) === "minecraft:lightning_rod" && /_slab$/.test(g.blockAt(x, y - 1, z))) g.set(x, y - 1, z, "deepslate_tiles");
  }
}

// a spire's band course (proud 1, one row under its eave) can stand over a ridge or roof bottom slab: that slab becomes a full block
function footBands(g, rects) {
  for (const [x0, z0, x1, z1] of rects) for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) for (let y = 10; y <= 20; y++) {
    if (g.blockAt(x, y, z) === "minecraft:polished_granite_slab" && /_slab$/.test(g.blockAt(x, y - 1, z))) g.set(x, y - 1, z, "deepslate_tiles");
  }
}

// a hand-placed cell: only into air (a lamp, a finial, a trim block), never over the shell
function put(g, x, y, z, block, state) { if (g.inBounds(x, y, z) && g.isAir(x, y, z)) g.set(x, y, z, block, state); }

export function build(g) {
  // ---- gable roofs on the masses (plan ROOFS table) ----
  gable(g, [14, 8, 40, 14], 10, "x", { north: 1, south: 1, east: 0, west: 0 });   // main building, ridge along x at z11
  gable(g, [7, 8, 13, 14], 7, "x", { north: 1, south: 1, east: 0, west: 0 });     // west range
  gable(g, [41, 8, 47, 14], 7, "x", { north: 1, south: 1, east: 0, west: 0 });    // east range
  gable(g, [1, 7, 6, 15], 9, "z", { north: 1, south: 1, east: 0, west: 1 });      // west wing (chapel), ridge along z at x3..4
  gable(g, [48, 6, 54, 16], 9, "z", { north: 1, south: 1, east: 1, west: 0 });    // east wing, ridge along z at x51

  // ---- spires on the shaft tops (plan: T4, T5, T6 cone, T7, T8, T9); the finial sits one above the spire ----
  slateSpire(g, [12, 7, 15, 10], 13, 4);   // T4 spire y13..16, finial y17
  slateSpire(g, [9, 8, 11, 10], 13, 3);    // T5 spire y13..15, finial y16
  slateSpire(g, [2, 6, 4, 8], 11, 4);      // T6 NW chapel turret, cone y11..14, finial y15
  slateSpire(g, [52, 6, 54, 8], 13, 4);    // T7 East wing NE tower, spire y13..16, finial y17
  slateSpire(g, [25, 13, 28, 16], 12, 4);  // T8 South Tower (octagon), spire y12..15, finial y16
  slateSpire(g, [25, 17, 28, 20], 14, 4);  // T9 Campanile, spire y14..17, finial y18
  footRods(g, [[12, 7, 15, 10], [9, 8, 11, 10], [2, 6, 4, 8], [52, 6, 54, 8], [25, 13, 28, 16], [25, 17, 28, 20]]);
  footBands(g, [[12, 7, 15, 10], [9, 8, 11, 10], [2, 6, 4, 8], [52, 6, 54, 8], [25, 13, 28, 16], [25, 17, 28, 20]]);

  // ---- battlements and parapets (T1, T2 crenel; T3 ring) ----
  battlements(g, [22, 2, 31, 8], 15, "crenel");   // T1 North Tower parapet y15, merlons y16
  for (let x = 28; x <= 30; x++) for (let z = 5; z <= 7; z++) put(g, x, 18, z, "red_nether_bricks");   // T2 deck: the flagpole's footing
  for (let x = 24; x <= 29; x++) for (let z = 4; z <= 7; z++) put(g, x, 15, z, "deepslate_tile_slab", { type: "bottom" });   // T1 deck y15  battlements(g, [27, 4, 31, 8], 18, "crenel");   // T2 Flag Tower parapet y18, merlons y19
  battlements(g, [39, 7, 42, 10], 15, "ring");    // T3 East octagon ornate parapet
  flagpole(g, CASTLE_FLAGPOLE.x, CASTLE_FLAGPOLE.y0, CASTLE_FLAGPOLE.z, CASTLE_FLAGPOLE.y1 - CASTLE_FLAGPOLE.y0 + 1);

  // ---- pinnacle buttress-turrets: wall cap y11, lightning rod y12 ----
  for (const x of [14, 15, 40]) {
    put(g, x, 11, 15, "red_nether_brick_wall");
    put(g, x, 12, 15, "lightning_rod", { facing: "up" });
  }

  // ---- porch lanterns: granite bracket on the wall, lantern hung under it ----
  for (const x of [24, 29]) {
    put(g, x, 3, 1, "polished_granite");
    put(g, x, 2, 1, ...B.lantern(true));
  }

  // ---- lamp posts on the north lawn (z3) ----
  for (const x of [8, 20, 34, 46]) lampPost(g, x, 0, 3);

  // ---- uplights: ochre froglight flush at y0, two cells out from each north and south wall, every 6 cells ----
  for (let x = 3; x <= 51; x += 6) { uplight(g, x, 6); uplight(g, x, 17); }

  // ---- path into the landing: smooth stone x25..28 z0 at y0 ----
  for (let x = 25; x <= 28; x++) put(g, x, 0, 0, "smooth_stone");

  // ---- south lawn flower beds ----
  parterre(g, 16, 17, 22, 19, { y: 0, over: ["grass_block"] });
  parterre(g, 31, 17, 37, 19, { y: 0, over: ["grass_block"] });
}
