// Plot 1 Arts & Industries roofs, caps, lantern, glow, door lanterns.
// The roofs are laid here with the roof tool's API (roof, from the build library) so each one has its own footprint
// and eave course; roof.json is not used. Walls come from the A&I shell (part 3); every write here is into air.
import { roof, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { lanternCap, glowCell, slateSpire } from "../vocab.mjs";

// Grey slate: stone brick stairs and slabs, 1 in 4 andesite stairs (plan.md ROOFS, A&I row)
// (no andesite in the mix: the tool writes the full andesite block at the valleys, which is off-palette)
const SLATE = { mix: [["stone_bricks", 1]], ridge: "stone_brick_slab", eave: "stone_bricks", verge: "stone_bricks" };
const NO_EDGES = { edges: false };   // no fascia trapdoors or soffit slabs: they are spruce, off this palette

// The rotunda occupies the crossing: no nave or hip roof may write inside it (its drum and pyramid close it)
const ROTUNDA_KEEP = [{ from: [74, 0, 13], to: [88, 40, 27] }];

// The eight entrance towers stand where the nave roofs pass at the nave ends: their shafts (y1..15) and caps are the
// walls there, so no roof slope may write into them (the shell owns those cells)
const TOWER_KEEP = [
  { from: [77, 0, 0], to: [78, 17, 1] }, { from: [84, 0, 0], to: [85, 17, 1] },
  { from: [77, 0, 40], to: [78, 17, 41] }, { from: [84, 0, 40], to: [85, 17, 41] },
  { from: [61, 0, 16], to: [62, 17, 17] }, { from: [61, 0, 23], to: [62, 17, 24] },
  { from: [100, 0, 16], to: [101, 17, 17] }, { from: [100, 0, 23], to: [101, 17, 24] },
];

// The four entrance diamonds (the shell's yellow and light blue rings, radius 2 on the gable triangle at y13) sit on the
// verge line where the gable slopes pass: the diamond is the finish there, so the verge stairs stop at its edge
const DIAMOND_KEEP = [
  { from: [79, 11, 0], to: [83, 15, 0] }, { from: [79, 11, 41], to: [83, 15, 41] },
  { from: [61, 11, 18], to: [61, 15, 22] }, { from: [101, 11, 18], to: [101, 15, 22] },
];

// The corner pavilions' walls top out at y7 (the shell's ring): the quadrant hips' eave course stops at those walls.
// Keeps only the ring at y7, the four sides of each 5 x 5 pavilion, not its inside.
const PAVILION_RINGS = [[61, 0, 65, 4], [97, 0, 101, 4], [61, 37, 65, 41], [97, 37, 101, 41]];
const PAVILION_KEEP = PAVILION_RINGS.flatMap(([x0, z0, x1, z1]) => [
  { from: [x0, 7, z0], to: [x1, 7, z0] }, { from: [x0, 7, z1], to: [x1, 7, z1] },
  { from: [x0, 7, z0], to: [x0, 7, z1] }, { from: [x1, 7, z0], to: [x1, 7, z1] },
]);

// The drum's walls (octagon x76..86 z15..25, chamfer 3, y11..14) are the shell's: the rotunda skirt's hip stops at their
// ring cells, one column each. The octagon test is the shell's (ai-shell octCells), so the ring matches its cells.
const drumIn = (x, z) => {
  if (x < 76 || x > 86 || z < 15 || z > 25) return false;
  const a = x - 76, b = 86 - x, c = z - 15, d = 25 - z;
  return a + c >= 3 && b + c >= 3 && a + d >= 3 && b + d >= 3;
};
const DRUM_KEEP = [];
for (let x = 76; x <= 86; x++) for (let z = 15; z <= 25; z++) {
  if (drumIn(x, z) && (!drumIn(x - 1, z) || !drumIn(x + 1, z) || !drumIn(x, z - 1) || !drumIn(x, z + 1)))
    DRUM_KEEP.push({ from: [x, 11, z], to: [x, 14, z] });
}


export function build(g) {
  // ---- nave gables: N-S nave x77..85 z0..41 and E-W nave x61..101 z16..24, eave y11, ridge y15 ----------------------
  // one gable call over the union of the two wings: each wing's ridge follows its long side, the crossing is the valley
  // the N and S verges take no overhang: at z = -1 the roof tool would grow the grid and shift every cell +1 in z, so
  // the shell's cells (locked to their earlier coordinates) would no longer match what the roof writes
  roof(g, [[77, 0, 85, 41], [61, 16, 101, 24]], "gable", {
    y: 11, pitch: 1, overhang: { north: 0, south: 0, east: 1, west: 1 }, material: SLATE, keep: [...ROTUNDA_KEEP, ...TOWER_KEEP, ...DIAMOND_KEEP], verge: "stone_bricks", ridge: "slab", ...NO_EDGES,
  });

  // ---- quadrant hips over the body square, eave y7, one course: overhang only on the outer sides -----------------
  const quads = [
    { r: [62, 2, 76, 15], o: { north: 1, west: 1, east: 0, south: 0 } },   // NW
    { r: [86, 2, 100, 15], o: { north: 1, east: 1, west: 0, south: 0 } },  // NE
    { r: [62, 25, 76, 39], o: { south: 1, west: 1, east: 0, north: 0 } },  // SW
    { r: [86, 25, 100, 39], o: { south: 1, east: 1, west: 0, north: 0 } }, // SE
  ];
  for (const { r, o } of quads) {
    roof(g, r, "hip", { y: 7, pitch: "half", maxHeight: 1, overhang: o, material: SLATE, keep: [...ROTUNDA_KEEP, ...PAVILION_KEEP], ...NO_EDGES });
  }

  // ---- rotunda skirt (y11, shallow ring round the drum) and octagonal pyramid on the drum (y15..18) ------------------
  // the skirt is the rotunda footprint's hip at one course; the drum's own walls (y11..14) refuse its inner cells
  roof(g, [74, 13, 88, 27], "hip", { y: 11, pitch: "half", maxHeight: 1, overhang: 1, material: SLATE, keep: DRUM_KEEP, ...NO_EDGES });
  // drum octagon (chamfer 3 on 11x11) as a union of three rects, so the hip roof closes it as an octagonal pyramid
  roof(g, [[76, 18, 86, 22], [78, 15, 84, 25], [77, 16, 85, 24]], "hip", {
    y: 15, pitch: 1, maxHeight: 4, overhang: 0, material: SLATE, ...NO_EDGES,
  });

  // ---- lantern box x80..82 z19..21, y19..22 (glass, shroomlight core, slab cap, lightning rod) ------------------------
  // a 3x3 stone brick pad at y18 carries the lantern (the drum's pyramid tops out in the centre cell at most)
  for (let x = 80; x <= 82; x++) for (let z = 19; z <= 21; z++) if (!g.get(x, 18, z)) g.set(x, 18, z, "minecraft:stone_bricks");
  lanternCap(g, 81, 19, 20);

  // ---- tower caps: entrance towers (2x2, shaft top y15, cap y16..17, finial y18) and corner pavilions (5x5, y8..10) ----
  const entranceTowers = [
    [77, 0, 78, 1], [84, 0, 85, 1], [77, 40, 78, 41], [84, 40, 85, 41],   // N and S ends of the N-S nave
    [61, 16, 62, 17], [61, 23, 62, 24], [100, 16, 101, 17], [100, 23, 101, 24], // W and E ends of the E-W nave
  ];
  // grey slate caps, no polished granite band (the A&I palette has neither deepslate nor granite)
  const CAP = { material: "stone_brick", band: false };
  for (const r of entranceTowers) slateSpire(g, r, 16, 2, CAP);
  const pavilions = [[61, 0, 65, 4], [97, 0, 101, 4], [61, 37, 65, 41], [97, 37, 101, 41]];
  for (const r of pavilions) slateSpire(g, r, 8, 3, CAP);

  // ---- glow: shroomlight behind each big arched entrance window (y5..9, centre y7) and every third body window --------
  glowCell(g, 81, 7, 1);      // N entrance pavilion, behind the arch (z0 face)
  glowCell(g, 81, 7, 40);     // S entrance pavilion (wall plane z41)
  glowCell(g, 62, 7, 20);     // W entrance pavilion (wall plane x61)
  glowCell(g, 100, 7, 20);    // E entrance pavilion (wall plane x101)
  for (const x of [64, 73, 95]) {          // N and S body windows (arched y2..4, glow centre y3, one cell inside)
    glowCell(g, x, 3, 3);
    glowCell(g, x, 3, 38);
  }
  for (const z of [6, 28]) {               // W and E body windows
    glowCell(g, 63, 3, z);
    glowCell(g, 99, 3, z);
  }

  // ---- door lanterns: one each side of every entrance door, at y3, in the nave one cell inside the jamb. The shell owns
  // the gable face and its jambs (the yellow band at y3 is the shell's), so a lantern cannot stand in them. Each one stands
  // on a polished andesite post from the ground (y1, y2): the post is written cell by cell, since lampPost's wall state
  // does not fit a full block.
  const doorLanterns = [
    [79, 1], [83, 1], [79, 40], [83, 40],   // N and S naves
    [62, 18], [62, 22], [100, 18], [100, 22], // W and E naves
  ];
  for (const [x, z] of doorLanterns) {
    g.set(x, 1, z, "minecraft:polished_andesite");
    g.set(x, 2, z, "minecraft:polished_andesite");
    g.set(x, 3, z, ...B.lantern(false));
  }

  // ---- valleys: where the nave gables meet the rotunda skirt, the roof tool leaves bottom slabs at y11 under the stair
  // course at y12. Each such slab becomes a full stone brick block (the skirt's footprint itself is skipped).
  for (let x = 73; x <= 89; x++) for (let z = 12; z <= 28; z++) {
    if (x >= 74 && x <= 88 && z >= 13 && z <= 27) continue;
    if (/_slab$/.test(g.blockAt(x, 11, z))) g.set(x, 11, z, "minecraft:stone_bricks");
  }
}
