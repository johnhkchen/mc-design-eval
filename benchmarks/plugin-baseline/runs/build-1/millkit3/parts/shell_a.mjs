// Shell A (plots 0-3): piers, foundations, decks, floors, walls, partitions, stair flights, tower stages.
// Every opening and RESERVED cell is never written (later parts fill them).
import { pier_line, rng, ladder_run } from "../vocab.mjs";
import { flight } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const rand = rng(31);
  const put = (x, y, z, b, st) => (st ? g.set(x, y, z, b, st) : g.set(x, y, z, b));
  const fill = (x0, y0, z0, x1, y1, z1, b, st) => {
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) put(x, y, z, b, st);
  };
  const inb = (o, x, y, z) => x >= o[0] && x <= o[3] && y >= o[1] && y <= o[4] && z >= o[2] && z <= o[5];
  // A straight wall line y0..y1 (x0==x1 or z0==z1); blk(x,y,z) -> [block,state?]; opens = boxes left untouched.
  const wall = (x0, z0, x1, z1, y0, y1, blk, opens = []) => {
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (opens.some((o) => inb(o, x, y, z))) continue;
      const [b, st] = blk(x, y, z);
      put(x, y, z, b, st);
    }
  };
  const log = (b, axis) => [b, { axis }];
  // Ring of 4 walls of a box with corner boards (axis y) and head plate row(s) (axis along the wall).
  const ring = (x0, z0, x1, z1, y0, y1, field, corner, plates, opens, skip = {}) => {
    const blk = (axisOf) => (x, y, z) => {
      const corn = (x === x0 || x === x1) && (z === z0 || z === z1);
      if (corn) return log(corner, "y");
      if (plates.includes(y)) return log(corner, axisOf);
      return typeof field === "function" ? field(x, y, z) : [field];
    };
    if (!skip.n) wall(x0, z0, x1, z0, y0, y1, blk("x"), opens);
    if (!skip.s) wall(x0, z1, x1, z1, y0, y1, blk("x"), opens);
    wall(x0, z0 + 1, x0, z1 - 1, y0, y1, blk("z"), opens);
    wall(x1, z0 + 1, x1, z1 - 1, y0, y1, blk("z"), opens);
  };
  const mossy = (b, m) => () => [rand() < 0.1 ? m : b];

  // ================= PLOT 0 double shotgun x1..10 =================
  {
    const W = "light_blue_terracotta", T = "stripped_birch_log";
    // skirting between the piers is a birch fence, not an open trapdoor: a trapdoor needs a block behind it, and the
    // crawlspace under the house is air
    pier_line(g, 1, 9, 10, 9, "bricks", "birch_fence", { facing: "north" });
    pier_line(g, 1, 16, 10, 16, "bricks", "birch_fence", { facing: "south" });
    pier_line(g, 1, 9, 1, 16, "bricks", "birch_fence", { facing: "west" });
    pier_line(g, 10, 9, 10, 16, "bricks", "birch_fence", { facing: "east" });
    pier_line(g, 1, 7, 10, 7, "bricks", "birch_fence", { facing: "north" });
    fill(1, 2, 7, 10, 2, 8, "dark_oak_planks");
    fill(1, 2, 9, 10, 2, 16, "jungle_planks");
    for (const x of [2, 9]) { put(x, 1, 17, "bricks"); put(x, 2, 17, "dark_oak_slab", { type: "top" }); }
    const opens = [
      [4, 3, 9, 4, 5, 9], [7, 3, 9, 7, 5, 9], [2, 3, 9, 2, 5, 9], [9, 3, 9, 9, 5, 9],
      [5, 9, 9, 6, 9, 9],
      [1, 4, 11, 1, 5, 11], [1, 4, 15, 1, 5, 15], [10, 4, 11, 10, 5, 11], [10, 4, 15, 10, 5, 15],
      [2, 3, 16, 2, 4, 16], [9, 3, 16, 9, 4, 16],
    ];
    ring(1, 9, 10, 16, 3, 6, W, T, [6], opens);
    // front pilaster over the party wall
    fill(5, 3, 9, 6, 6, 9, T, { axis: "y" });
    // party wall full height to the ridge, x5..6 z9..16
    wall(5, 10, 6, 15, 3, 11, () => [W]);
    // gable triangles front z9 and back z16 (y7..11 narrowing)
    for (const z of [9, 16]) for (let y = 7; y <= 11; y++) {
      const k = y - 7;
      wall(1 + k, z, 10 - k, z, y, y, () => [W], opens);
    }
    // partitions z13 (doors x4, x7 y3..4 open)
    for (const [xa, xb, d] of [[2, 4, 4], [7, 9, 7]])
      wall(xa, 13, xb, 13, 3, 6, () => [W], [[d, 3, 13, d, 4, 13]]);
  }

  // ================= PLOT 1 Creole cottage x15..22 =================
  {
    const W = "cherry_planks", T = "stripped_dark_oak_log";
    fill(15, 1, 7, 22, 1, 7, "bricks");
    pier_line(g, 15, 10, 22, 10, "bricks", "dark_oak_fence", { facing: "north" });
    pier_line(g, 15, 17, 22, 17, "bricks", "dark_oak_fence", { facing: "south" });
    pier_line(g, 15, 10, 15, 17, "bricks", "dark_oak_fence", { facing: "west" });
    pier_line(g, 22, 10, 22, 17, "bricks", "dark_oak_fence", { facing: "east" });
    fill(15, 2, 7, 22, 2, 9, "dark_oak_planks");
    fill(15, 2, 10, 22, 2, 17, "jungle_planks");
    const opens = [
      [16, 3, 10, 17, 5, 10], [20, 3, 10, 21, 5, 10],
      [15, 4, 11, 15, 5, 11], [15, 4, 16, 15, 5, 16], [22, 4, 12, 22, 5, 12], [22, 4, 15, 22, 5, 15],
      [22, 9, 12, 22, 9, 12],
      [17, 4, 17, 17, 5, 17], [20, 4, 17, 20, 5, 17],
    ];
    ring(15, 10, 22, 17, 3, 6, W, T, [6], opens);
    // gable ends in the x plane: course y7.. narrows by 1 each side (ridge z12 y12)
    for (const x of [15, 22]) for (let y = 7; y <= 11; y++) {
      const k = y - 6;
      wall(x, Math.max(10, 7 + k), x, 17 - k, y, y, () => [W], opens);
    }
    // partitions: x18 (door z15), cross z14 (doors x17, x20)
    wall(18, 11, 18, 16, 3, 6, () => [W], [[18, 3, 15, 18, 4, 15]]);
    wall(16, 14, 21, 14, 3, 6, () => [W], [[17, 3, 14, 17, 4, 14], [20, 3, 14, 20, 4, 14]]);
  }

  // ================= PLOT 2 American Foursquare x27..34 =================
  {
    const W = "yellow_terracotta", T = "stripped_birch_log";
    fill(27, 1, 9, 34, 1, 16, "bricks");
    fill(27, 2, 9, 34, 2, 16, "bricks");
    fill(28, 2, 10, 33, 2, 15, "jungle_planks");
    pier_line(g, 27, 7, 34, 7, "bricks", "birch_fence", { facing: "north" });
    fill(27, 2, 7, 34, 2, 8, "dark_oak_planks");
    // upper floor y7 (stairwell hole x33 z11..14 cut by the flight)
    fill(28, 7, 10, 33, 7, 15, "jungle_planks");
    const opens = [
      [29, 3, 9, 30, 5, 9], [28, 4, 9, 28, 5, 9], [32, 4, 9, 33, 5, 9],
      [28, 9, 9, 29, 10, 9], [32, 9, 9, 33, 10, 9],
      [27, 4, 10, 27, 5, 10], [27, 4, 15, 27, 5, 15], [27, 9, 10, 27, 10, 10], [27, 9, 15, 27, 10, 15],
      [34, 4, 11, 34, 5, 11], [34, 4, 14, 34, 5, 14], [34, 9, 11, 34, 10, 11], [34, 9, 14, 34, 10, 14],
      [32, 3, 16, 32, 4, 16], [29, 4, 16, 29, 5, 16], [29, 9, 16, 29, 10, 16], [32, 9, 16, 32, 10, 16],
    ];
    const f = (x, y, z) => (y === 7 ? ["birch_slab", { type: "top" }] : [W]);
    ring(27, 9, 34, 16, 3, 11, f, T, [11], opens);
    // partitions ground: x31 z10..12 (door z11), z13 x28..31 (door x29)
    wall(31, 10, 31, 12, 3, 6, () => [W], [[31, 3, 11, 31, 4, 11]]);
    wall(28, 13, 31, 13, 3, 6, () => [W], [[29, 3, 13, 29, 4, 13]]);
    // partitions upper: x31 z10..12 (door z10), z13 x28..30 (door x29)
    wall(31, 10, 31, 12, 8, 11, () => [W], [[31, 8, 10, 31, 9, 10]]);
    wall(28, 13, 30, 13, 8, 11, () => [W], [[29, 8, 13, 29, 9, 13]]);
    flight(g, { from: [33, 3, 15], facing: "north", to: 7, material: "spruce" });
  }

  // ================= PLOT 3 Queen Anne x39..46 =================
  {
    const P = "crimson_planks", T = "stripped_birch_log";
    const stone = mossy("stone_bricks", "mossy_stone_bricks");
    // foundation y1..2 under the whole footprint (body + tower)
    for (const [x0, z0, x1, z1] of [[39, 9, 45, 16], [43, 7, 46, 10]])
      for (let y = 1; y <= 2; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) put(x, y, z, ...stone());
    fill(40, 2, 10, 44, 2, 15, "jungle_planks");
    fill(44, 2, 8, 45, 2, 9, "jungle_planks");
    // porch piers + decks
    pier_line(g, 37, 7, 42, 7, "stone_bricks", "birch_fence", { facing: "north" });
    pier_line(g, 37, 7, 37, 14, "stone_bricks", "birch_fence", { facing: "west" });
    fill(37, 2, 7, 42, 2, 8, "dark_oak_planks");
    fill(37, 2, 9, 38, 2, 14, "dark_oak_planks");
    put(44, 1, 17, "stone_bricks");
    put(44, 2, 17, "dark_oak_slab", { type: "top" });
    // upper floor y7: hall/rooms + tower room
    fill(40, 7, 10, 44, 7, 15, "jungle_planks");
    fill(44, 7, 8, 45, 7, 9, "jungle_planks");
    // fishscale upper storey: rows alternate full planks / top slab from y8
    const fish = (x, y, z) => ((y - 8) % 2 === 0 ? ["birch_planks"] : ["birch_slab", { type: "top" }]);
    const ground = (x, y, z) => (y === 7 ? [T, { axis: "x" }] : y < 7 ? [P] : fish(x, y, z));
    const bodyOpens = [
      [41, 3, 9, 42, 5, 9], [39, 4, 9, 40, 5, 9], [40, 9, 9, 41, 10, 9], [41, 13, 9, 41, 13, 9],
      [39, 4, 11, 39, 5, 11], [39, 4, 14, 39, 5, 14], [39, 9, 11, 39, 10, 11], [39, 9, 14, 39, 10, 14],
      [39, 9, 12, 39, 10, 13],
      [45, 4, 12, 45, 5, 12], [45, 4, 15, 45, 5, 15], [45, 9, 12, 45, 10, 12], [45, 9, 15, 45, 10, 15],
      [44, 3, 16, 44, 4, 16], [39, 4, 16, 39, 5, 16], [39, 9, 16, 39, 10, 16],
    ];
    const belt = (x, y, z) => (y === 7 ? [T, { axis: "x" }] : ground(x, y, z));
    // body: front z9 x39..42, west x39, back z16, east x45 z11..16
    wall(39, 9, 42, 9, 3, 11, (x, y, z) => (x === 39 ? log(T, "y") : belt(x, y, z)), bodyOpens);
    wall(39, 10, 39, 15, 3, 11, belt, bodyOpens);
    wall(39, 16, 45, 16, 3, 11, (x, y, z) => (x === 39 || x === 45 ? log(T, "y") : belt(x, y, z)), bodyOpens);
    wall(45, 11, 45, 15, 3, 11, belt, bodyOpens);
    // cross gable triangle at z9: y12 x39..42, y13 x40..41 (vent at 41,13)
    wall(39, 9, 42, 9, 12, 12, fish, bodyOpens);
    wall(40, 9, 41, 9, 13, 13, fish, bodyOpens);
    // tower (x43..46 z7..10): ground, upper, belvedere
    const tOpen = [
      [44, 4, 7, 45, 5, 7], [44, 9, 7, 45, 10, 7], [46, 4, 8, 46, 5, 9], [46, 9, 8, 46, 10, 9],
      [44, 13, 7, 45, 14, 7], [46, 13, 8, 46, 14, 9], [43, 13, 8, 43, 14, 9],
    ];
    const tower = (x, y, z) => {
      const corn = (x === 43 || x === 46) && (z === 7 || z === 10);
      if (y >= 12) {
        if (y === 12) return ["birch_planks"];
        if (corn) return log(T, "y");
        if (y === 15) return log(T, x === 43 || x === 46 ? "z" : "x");
        return ["birch_planks"];
      }
      if (corn) return log(T, "y");
      return belt(x, y, z);
    };
    wall(43, 7, 46, 7, 3, 15, tower, tOpen);
    wall(46, 8, 46, 10, 3, 15, tower, tOpen);
    wall(43, 8, 43, 9, 3, 15, tower, tOpen);
    wall(43, 10, 43, 10, 12, 15, tower, tOpen);
    // tower south wall z10: x45..46 only (x43 is its corner post, x44 is open to the hall)
    wall(45, 10, 45, 10, 3, 15, tower, tOpen);
    // belvedere south side x44 z10 above the hall roof line
    wall(44, 10, 44, 10, 13, 15, tower, tOpen);
    // belvedere floor y12 (hole at 44,12,9 for the ladder)
    fill(44, 12, 8, 45, 12, 8, "jungle_planks");
    put(45, 12, 9, "jungle_planks");
    // partitions ground: x42 z11..12, z13 x40..41; upper: x42 z11..12, z13 x40..41 + lintel over the door cell
    wall(42, 11, 42, 12, 3, 6, () => [P]);
    wall(40, 13, 41, 13, 3, 6, () => [P]);
    wall(42, 11, 42, 12, 8, 11, () => ["birch_planks"]);
    wall(40, 13, 41, 13, 8, 11, () => ["birch_planks"]);
    wall(42, 13, 42, 13, 10, 11, () => ["birch_planks"]);
    flight(g, { from: [44, 3, 15], facing: "north", to: 7, material: "dark_oak" });
    // tower room ladder y8..11 against the west wall (43,y,9), trapdoor in the belvedere floor hole
    ladder_run(g, 44, 8, 11, 9, "east", { hatch: "birch" });
  }
}
