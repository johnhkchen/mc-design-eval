// Shell B (plots 4-7): plot 4 farmhouse shell, plot 5 barn crib walls + stalls + loft, plot 6 pavilion posts and
// plates, bread-oven plinth/vault and water tank, plot 7 company duplex shell. Openings and reserved cells stay AIR.
import { pier_line, clapboard_wall, bread_oven, water_tank, cornice, hay_stack, rng } from "../vocab.mjs";

export function build(g) {
  const rand = rng(41);
  const put = (x, y, z, b, st) => (st ? g.set(x, y, z, b, st) : g.set(x, y, z, b));
  const fill = (x0, y0, z0, x1, y1, z1, b, st) => {
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) put(x, y, z, b, st);
  };
  const inb = (o, x, y, z) => x >= o[0] && x <= o[3] && y >= o[1] && y <= o[4] && z >= o[2] && z <= o[5];
  // A wall box filled by blk(x, y, z) -> [block, state?]; opens = boxes left as air.
  const wl = (x0, y0, z0, x1, y1, z1, blk, opens = []) => {
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (opens.some((o) => inb(o, x, y, z))) continue;
      const [b, st] = blk(x, y, z);
      put(x, y, z, b, st);
    }
  };
  const solid = (b) => () => [b];
  const mossy = (b, m) => () => [rand() < 0.1 ? m : b];

  // ================= PLOT 4 gable-front-and-wing x49..58 =================
  {
    const W = "cyan_terracotta", T = "stripped_birch_log", F = "jungle_planks", P = "cobblestone";
    // piers round the L of the gable block (x53..58, z9..16) and the wing (x49..53, z12..16)
    pier_line(g, 53, 9, 58, 9, P, "oak_fence", { facing: "north" });
    pier_line(g, 58, 9, 58, 16, P, "oak_fence", { facing: "east" });
    pier_line(g, 49, 16, 58, 16, P, "oak_fence", { facing: "south" });
    pier_line(g, 49, 12, 49, 16, P, "oak_fence", { facing: "west" });
    pier_line(g, 49, 12, 53, 12, P, "oak_fence", { facing: "north" });
    pier_line(g, 53, 9, 53, 11, P, "oak_fence", { facing: "west" });
    // foundation footing y2 (cobble ring) then the ground floor (jungle planks)
    fill(53, 2, 9, 58, 2, 16, P);
    fill(49, 2, 12, 52, 2, 16, P);
    // porch deck in the angle (FLOORS: porch y2 / y3): without it the steps lead nowhere and the whole plot is cut off
    fill(49, 2, 9, 52, 2, 11, "dark_oak_planks");
    fill(54, 2, 10, 57, 2, 15, F);
    fill(50, 2, 13, 52, 2, 15, F);
    // walls: gable block y3..8 (knee course y8), wing y3..6, boards with corner boards and head plates
    const gOpen = [
      [54, 4, 9, 54, 5, 9], [57, 4, 9, 57, 5, 9],
      [55, 3, 16, 55, 4, 16], [57, 4, 16, 57, 5, 16],
      [58, 4, 11, 58, 5, 11], [58, 4, 14, 58, 5, 14],
      [53, 3, 10, 53, 4, 10],
    ];
    clapboard_wall(g, [53, 3, 9, 58, 8, 9], W, T, T, { openings: gOpen });
    clapboard_wall(g, [53, 3, 16, 58, 8, 16], W, T, T, { openings: gOpen });
    clapboard_wall(g, [58, 3, 9, 58, 8, 16], W, T, T, { openings: gOpen });
    clapboard_wall(g, [53, 3, 9, 53, 8, 16], W, T, T, { openings: gOpen });
    clapboard_wall(g, [49, 3, 12, 53, 6, 12], W, T, T, { openings: [[51, 3, 12, 51, 4, 12], [50, 4, 12, 50, 5, 12]] });
    clapboard_wall(g, [49, 3, 16, 52, 6, 16], W, T, T, { openings: [[51, 3, 16, 51, 3, 16]] });
    clapboard_wall(g, [49, 3, 12, 49, 6, 16], W, T, T, { openings: [[49, 4, 14, 49, 5, 14]] });
    // partition z13 across the gable block's ground floor (door x56)
    wl(55, 3, 13, 57, 6, 13, solid(W), [[56, 3, 13, 56, 4, 13]]);
    // front gable triangle z9 (attic pair x55..56 y9..10 and vent y11 stay air)
    for (const [x, y] of [[53, 9], [54, 9], [57, 9], [58, 9], [54, 10], [57, 10]]) put(x, y, 9, W);
    // back gable triangle z16 (full)
    for (let y = 9; y <= 11; y++) for (let x = 53 + (y - 9); x <= 58 - (y - 9); x++) put(x, y, 16, W);
    // wing west gable (x49, the ridge along x at z14): vent z14 y8 stays air
    for (let z = 12; z <= 16; z++) put(49, 7, z, W);
    for (const z of [13, 15]) put(49, 8, z, W);
    put(49, 9, 14, W);
    // attic floor (stair hole x54 z11..15 is the stair joiner's)
    fill(55, 7, 10, 57, 7, 15, F);
    put(54, 7, 10, F);
  }

  // ================= PLOT 5 mule barn x61..70 =================
  {
    const B = "stripped_dark_oak_log", Bt = "stripped_spruce_log", fl = "packed_mud";
    fill(61, 0, 9, 68, 0, 15, fl);
    // plinth round the walls, open at the two big doors
    for (let x = 61; x <= 68; x++) for (const z of [9, 15]) if (!(z === 9 && (x === 64 || x === 65)) && !(z === 15 && (x === 64 || x === 65))) put(x, 1, z, "cobblestone");
    for (let z = 10; z <= 14; z++) for (const x of [61, 68]) put(x, 1, z, "cobblestone");
    // walls y2..5: board-and-batten field, corner and gable battens, head plate y5
    const batten = (x, y, z) => {
      if (y === 5) return [Bt, { axis: "x" }];
      if ((z === 9 || z === 15) && (x === 61 || x === 68 || x === 63 || x === 66)) return [Bt, { axis: "y" }];
      if ((x === 61 || x === 68) && (z === 9 || z === 15)) return [Bt, { axis: "y" }];
      return [B, { axis: "y" }];
    };
    wl(61, 2, 9, 68, 5, 9, batten, [[64, 2, 9, 65, 3, 9]]);
    wl(61, 2, 15, 68, 5, 15, batten, [[64, 2, 15, 65, 2, 15]]);
    wl(61, 2, 10, 61, 5, 14, batten, [[61, 3, 11, 61, 3, 11], [61, 3, 13, 61, 3, 13]]);
    wl(68, 2, 10, 68, 5, 14, batten, [[68, 3, 11, 68, 3, 11]]);
    // beam over the front big doors
    for (const x of [64, 65]) put(x, 4, 9, Bt, { axis: "x" });
    // loft walls x61 / x68 at y6..7 (the eave line)
    wl(61, 6, 9, 61, 7, 15, solid(B));
    wl(68, 6, 9, 68, 7, 15, solid(B));
    // gambrel gables z9 (loft door x64..65 y8..9 stays air) and z15
    const tri = [[6, 61, 68], [7, 62, 67], [8, 62, 67], [9, 63, 66], [10, 64, 65], [11, 64, 65]];
    for (const [y, xa, xb] of tri) for (let x = xa; x <= xb; x++) {
      if (!(y >= 8 && y <= 9 && (x === 64 || x === 65))) put(x, y, 9, B, { axis: "y" });
      put(x, y, 15, B, { axis: "y" });
    }
    // loft floor y6 with the ladder hole (62,6,14); the hay drop over the aisle (64..65, 6, 12) is a shut hatch, so the
    // loft floor reads across the centre (the stair joiner's ladder is in the hole)
    wl(62, 6, 10, 67, 6, 14, solid("spruce_planks"), [[62, 6, 14, 62, 6, 14], [64, 6, 12, 65, 6, 12]]);
    for (const x of [64, 65]) put(x, 6, 12, "spruce_trapdoor", { facing: "north", half: "top", open: "false", powered: "false" });
    hay_stack(g, [62, 7, 10, 63, 8, 13]);
    hay_stack(g, [66, 7, 10, 67, 8, 14]);
    // stalls: partitions at z12 (x62..63, x66..67), aisle fronts with gates, hay racks at the heads
    fill(62, 1, 12, 63, 2, 12, "spruce_fence");
    fill(66, 1, 12, 67, 2, 12, "spruce_fence");
    for (const x of [63, 66]) {
      put(x, 1, 10, "spruce_fence");
      put(x, 1, 14, "spruce_fence");
    }
    put(63, 1, 11, "spruce_fence_gate", { facing: "east", open: "false" });
    put(63, 1, 13, "spruce_fence_gate", { facing: "east", open: "false" });
    put(66, 1, 11, "spruce_fence_gate", { facing: "west", open: "false" });
    put(66, 1, 13, "spruce_fence_gate", { facing: "west", open: "false" });
    put(62, 1, 10, "hay_block", { axis: "y" });
    put(67, 1, 10, "hay_block", { axis: "y" });
    put(67, 1, 14, "hay_block", { axis: "y" });
    // lean-to posts (east of the barn; the roof and wagon are the roofs and grounds parts)
    for (const z of [9, 12, 15]) for (let y = 1; y <= 3; y++) put(70, y, z, Bt, { axis: "y" });
  }

  // ================= PLOT 6 pavilion, oven and tank =================
  {
    const O = "stripped_oak_log";
    fill(74, 0, 7, 81, 0, 11, "dark_oak_planks");
    for (const [x, z] of [[74, 7], [81, 7], [74, 9], [81, 9], [74, 11], [81, 11]])
      for (let y = 1; y <= 4; y++) put(x, y, z, O, { axis: "y" });
    for (const z of [7, 11]) for (let x = 74; x <= 81; x++) put(x, 4, z, O, { axis: "x" });
    for (const x of [74, 81]) for (let z = 7; z <= 11; z++) put(x, 4, z, O, { axis: "z" });
    // oven apron (stone, working side) and the brick bread oven
    fill(73, 0, 13, 77, 0, 13, "stone");
    bread_oven(g, 73, 14, 1);
    // the flue through the vault at y4 is walled with full bricks, not the crown's slabs: the stack carries it up
    for (const [x, z] of [[74, 16], [76, 16], [75, 15], [75, 17]]) put(x, 4, z, "bricks");
    // the tank's water core (x80..81 z15..16, y6..7) is not a palette block: full water cauldrons go in first, so
    // water_tank (which writes only into air) leaves those cells alone instead of writing water
    for (let y = 6; y <= 7; y++) for (let z = 15; z <= 16; z++) for (let x = 80; x <= 81; x++)
      put(x, y, z, "water_cauldron", { level: "3" });
    // water tank on legs, and the post its ladder climbs
    water_tank(g, 79, 14, { y: 1 });
    for (let y = 1; y <= 4; y++) put(79, y, 16, "stripped_spruce_log", { axis: "y" });
  }

  // ================= PLOT 7 company duplex x85..94 =================
  {
    const W = "bricks", S = "stone_bricks", F = "jungle_planks", L = "stone_brick_slab";
    const D = "dark_oak_planks";
    // foundation, water-table ring at y2, ground and upper floors
    fill(85, 1, 9, 94, 1, 16, W);
    fill(85, 2, 9, 94, 2, 16, S);
    fill(86, 2, 10, 88, 2, 15, F);
    fill(91, 2, 10, 93, 2, 15, F);
    fill(89, 2, 9, 90, 2, 16, W);
    // porch decks: lower y2 and gallery y7 over z7..8, then the piers (overwrite the gallery deck cells)
    fill(85, 2, 7, 94, 2, 8, D);
    fill(85, 7, 7, 94, 7, 8, D);
    for (const x of [85, 89, 90, 94]) for (let y = 3; y <= 11; y++) for (const z of [7]) put(x, y, z, W);
    // walls y3..11, belt y7, party wall full height x89..90
    const belt = (x, y, z) => (y === 7 ? [S] : [W]);
    const frontOpen = [
      [88, 3, 9, 88, 5, 9], [91, 3, 9, 91, 5, 9], [86, 4, 9, 87, 5, 9], [92, 4, 9, 93, 5, 9],
      [88, 8, 9, 88, 9, 9], [91, 8, 9, 91, 9, 9], [86, 9, 9, 87, 10, 9], [92, 9, 9, 93, 10, 9],
    ];
    wl(85, 3, 9, 94, 11, 9, belt, frontOpen);
    wl(85, 3, 16, 94, 11, 16, belt, [[87, 3, 16, 87, 3, 16], [92, 3, 16, 92, 3, 16]]);
    const sideOpen = [[85, 4, 11, 85, 5, 11], [85, 4, 14, 85, 5, 14], [85, 9, 11, 85, 10, 11], [85, 9, 14, 85, 10, 14]];
    wl(85, 3, 9, 85, 11, 16, belt, sideOpen);
    wl(94, 3, 9, 94, 11, 16, belt, sideOpen.map(([a, b, c, d, e, f]) => [a + 9, b, c, d + 9, e, f]));
    wl(89, 3, 10, 90, 11, 16, () => [W]);
    // lintels: stone-brick top slabs over each opening
    for (const x of [86, 87, 88, 91, 92, 93]) put(x, 6, 9, L, { type: "top" });
    for (const x of [88, 91]) put(x, 10, 9, L, { type: "top" });
    for (const x of [86, 87, 92, 93]) put(x, 11, 9, L, { type: "top" });
    for (const x of [85, 94]) for (const z of [11, 14]) {
      put(x, 6, z, L, { type: "top" });
      put(x, 11, z, L, { type: "top" });
    }
    // partitions z13 (x86..87 and x92..93), doors at x86 and x93, both storeys
    wl(86, 3, 13, 87, 6, 13, solid(W), [[86, 3, 13, 86, 4, 13]]);
    wl(92, 3, 13, 93, 6, 13, solid(W), [[93, 3, 13, 93, 4, 13]]);
    wl(86, 8, 13, 87, 11, 13, solid(W), [[86, 8, 13, 86, 9, 13]]);
    wl(92, 8, 13, 93, 11, 13, solid(W), [[93, 8, 13, 93, 9, 13]]);
    // upper floor y7 (the stair holes x88 / x91 z11..15 belong to the flights)
    fill(86, 7, 10, 87, 7, 15, F);
    fill(92, 7, 10, 93, 7, 15, F);
    put(88, 7, 10, F);
    put(91, 7, 10, F);
    // cornice under the front eave (back stacks keep z17..18 clear)
    cornice(g, 85, 94, 8, 11, { out: "north", material: "stone_brick" });
  }
}
