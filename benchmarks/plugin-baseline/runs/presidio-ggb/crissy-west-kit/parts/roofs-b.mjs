// Part "roofs plots 4-9 and cupola": roofs O, S, C (its pediment on C1), OCC, G, B, B1 and the lean-tos, then the
// cupola. Red clay-tile roofs (palette red-tile) on the roof tool; the flat and shed bits by hand. Every roof is laid
// into air above the walls the shells built (nothing here replaces a wall).
import { leanTo, cupola } from "../vocab.mjs";
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ROOF = { mix: [["bricks", 1]], eave: "bricks", ridge: "bricks", verge: "quartz_block" };
// edges off: the roof tool's fascia and soffit sit at y(eave)-1, which is the wall's top course (the shells own it), so
// they were refused; the eave itself is the wall top + 1 and needs no edge board. Trim stays quartz for the verges.
const EDGES = { edges: false, trim: "quartz_block" };
const EDGE = "brick_stairs";
const WHITE = "white_concrete";

export function build(g) {
  // O: the small office (plot 4), hip, ridge along x at y8; no overhang on the north plot edge, and none east or west:
  // those eaves would hang over the storehouse yard (x97) and the bike shop wall (x108), outside plot 4
  roof(g, [98, 0, 107, 9], "hip", {
    y: 5, pitch: 45, ridgeAxis: "x", material: ROOF,
    overhang: { north: 0, south: 1, east: 0, west: 0 }, ...EDGES,
  });

  // S: the bike shop (plot 5), gable along x, ridge z4 at y7; the gable ends are the white walls
  roof(g, [108, 1, 117, 7], "gable", {
    y: 6, pitch: 0.5, ridgeAxis: "x", material: ROOF, gable: WHITE,
    overhang: { north: 1, south: 1, east: 0, west: 0 }, ...EDGES,
  });

  // C: the coast guard main block (plot 6), hip with its ridge along x, y7; the cupola sits on the ridge (cells kept)
  roof(g, [121, 4, 130, 9], "hip", {
    y: 5, pitch: 45, ridgeAxis: "x", material: ROOF,
    overhang: { north: 0, south: 1, east: 1, west: 0 }, ...EDGES,
    keep: [{ from: [125, 7, 6], to: [126, 10, 7] }],
  });
  // C1: the front pavilion, a gable facing north with a quartz pediment on its north face
  roof(g, [125, 0, 128, 3], "gable", {
    y: 5, pitch: 45, ridgeAxis: "z", material: ROOF, gable: "quartz_block",
    overhang: { north: 0, south: 0, east: 1, west: 1 }, ...EDGES,
    pediment: { face: "north", width: 3, pitch: 45, tympanum: "quartz_block", cornice: "quartz_block" },
  });
  // C2 entry porch: flat quartz deck at y3 over x123..124 z2..3; a full block, not a slab, because C1's west eave
  // overhang (brick stairs at y4, x124) sits on it and a bottom slab would leave half a block of air under them
  for (let z = 2; z <= 3; z++) for (let x = 123; x <= 124; x++) g.set(x, 3, z, ...B.block("quartz_block"));
  // C3 west bay and C4 rear kitchen: one-slope lean-tos at y3
  leanTo(g, [119, 6, 120, 7], 3, "west", EDGE, EDGE);
  leanTo(g, [123, 10, 128, 11], 3, "south", EDGE, EDGE);

  // OCC: the ocean climate centre (plot 7), cross-plan hip over the union, both arms' ridges meeting at y7
  roof(g, [[134, 0, 137, 7], [132, 2, 139, 5]], "hip", {
    y: 5, pitch: 45, material: ROOF,
    overhang: 0, ...EDGES,
  });

  // G: the garage (plot 8), gable along z, ridge x143..144 at y5; garage door on the north (plot edge, no overhang)
  roof(g, [142, 0, 145, 5], "gable", {
    y: 4, pitch: 1, ridgeAxis: "z", material: ROOF, gable: WHITE,
    overhang: { north: 0, south: 1, east: 1, west: 1 }, ...EDGES,
  });
  // G1 east shop, G2 back, G3 west: lean-tos at y3; G4 bin: slab roof at y3
  leanTo(g, [146, 2, 147, 7], 3, "east", EDGE, EDGE);
  leanTo(g, [144, 6, 145, 7], 3, "south", EDGE, EDGE);
  leanTo(g, [140, 2, 141, 3], 3, "west", EDGE, EDGE);
  for (let x = 146; x <= 147; x++) g.set(x, 3, 8, ...B.slab("brick", "bottom"));

  // B: the 1890 boathouse (plot 9), steep gable along z, ridge x152..153 at y5; the big door faces north (no overhang)
  roof(g, [151, 2, 154, 5], "gable", {
    y: 3, pitch: 2, ridgeAxis: "z", material: ROOF, gable: WHITE,
    overhang: { north: 0, south: 1, east: 1, west: 1 }, ...EDGES,
  });
  // B1 door bay: small gable along z over the big door on the north, its ridge at y4
  roof(g, [153, 0, 154, 1], "gable", {
    y: 3, pitch: 1, ridgeAxis: "z", material: ROOF, gable: WHITE,
    overhang: 0, ...EDGES,
  });
  // B lean-tos: east slab, west and south slopes at y3
  for (let z = 2; z <= 3; z++) g.set(155, 3, z, ...B.slab("brick", "bottom"));
  leanTo(g, [149, 4, 150, 5], 3, "west", EDGE, EDGE);
  leanTo(g, [151, 6, 152, 7], 3, "south", EDGE, EDGE);

  // shop side bay (plot 5, x118 z4..5): slab roof at y4
  for (let z = 4; z <= 5; z++) g.set(118, 4, z, ...B.slab("brick", "bottom"));

  // the cupola last, on C's ridge
  cupola(g, [125, 6], 7);
  // the rod's cap cell is a full block, not a bottom slab: a rod on a bottom slab floats half a block
  g.set(125, 9, 6, ...B.block("dark_prismarine"));
}
