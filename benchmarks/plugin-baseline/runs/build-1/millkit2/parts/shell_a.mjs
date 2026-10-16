// Part: Shell A plots 0-3: piers, decks, walls, floors, partitions, stair flights, openings left as air.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { pier_line, clapboard_wall, log_crib_wall, stair_run, rng } from "../vocab.mjs";

const inBox = (b, x, y, z) => x >= b[0] && y >= b[1] && z >= b[2] && x <= b[3] && y <= b[4] && z <= b[5];

// Floor slab of planks at y over x0..x1, z0..z1, leaving the `skip` boxes (x0,z0,x1,z1) as air.
function floor(g, y, x0, z0, x1, z1, skip = [], block = "spruce_planks") {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (skip.some(([a, b, c, d]) => x >= a && z >= b && x <= c && z <= d)) continue;
    if (g.isAir(x, y, z)) g.set(x, y, z, block, {});
  }
}

// Plain wall run (partition) over box, minus open boxes.
function partition(g, [x0, y0, z0, x1, y1, z1], block, open = []) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    if (open.some((o) => inBox(o, x, y, z))) continue;
    if (g.isAir(x, y, z)) g.set(x, y, z, block, {});
  }
}

// A ring of log plate at y round box's footprint, along the run, skipping openings.
function plateRing(g, [x0, z0, x1, z1], y, log, open) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x !== x0 && x !== x1 && z !== z0 && z !== z1) continue;
    if (open.some((o) => inBox(o, x, y, z)) || !g.isAir(x, y, z)) continue;
    g.set(x, y, z, log, { axis: (z === z0 || z === z1) ? "x" : "z" });
  }
}

export function build(g) {
  const r = rng(7);
  // ---------------- plot 0: dogtrot ----------------
  pier_line(g, 1, 7, 10, 15, "cobblestone");
  for (let x = 1; x <= 10; x++) for (const z of [7, 15]) if (g.get?.(x, 1, z)?.[0] === "cobblestone" && r() < 0.1) g.set(x, 1, z, "mossy_cobblestone", {});
  floor(g, 2, 1, 7, 10, 15);
  log_crib_wall(g, [1, 3, 9, 4, 6, 15], "oak_log", { keep: [[2, 4, 9, 2, 5, 9], [4, 3, 12, 4, 4, 12]] });
  log_crib_wall(g, [7, 3, 9, 10, 6, 15], "oak_log", { keep: [[9, 4, 9, 9, 5, 9], [9, 4, 15, 9, 5, 15], [7, 3, 12, 7, 4, 12]] });
  for (const z of [9, 15]) for (const x of [5, 6]) g.set(x, 6, z, "stripped_oak_log", { axis: "x" });

  // ---------------- plot 1: camelback ----------------
  pier_line(g, 15, 7, 20, 17, "bricks", { skirt: "acacia_fence" });
  floor(g, 2, 15, 7, 20, 17);
  const o1 = [
    [17, 3, 9, 18, 4, 9], [16, 4, 9, 16, 5, 9], [19, 4, 9, 19, 5, 9],       // front door, windows
    [15, 4, 11, 15, 5, 11], [20, 4, 11, 20, 5, 11], [15, 4, 16, 15, 5, 16], [20, 4, 16, 20, 5, 16],
    [20, 9, 14, 20, 10, 14], [20, 9, 16, 20, 10, 16], [15, 9, 16, 15, 10, 16],
    [17, 10, 13, 18, 10, 13], [17, 3, 13, 17, 4, 13], [19, 3, 13, 19, 8, 13], // north window, kitchen door, stair (headroom to its landing at y8)
    [17, 4, 17, 18, 5, 17], [17, 9, 17, 18, 10, 17],
  ];
  clapboard_wall(g, [15, 3, 9, 20, 6, 13], "acacia_planks", "stripped_pale_oak_log", { open: o1 });
  clapboard_wall(g, [15, 3, 13, 20, 11, 17], "acacia_planks", "stripped_pale_oak_log", { open: o1 });
  plateRing(g, [15, 13, 20, 17], 6, "stripped_pale_oak_log", o1);
  floor(g, 7, 15, 13, 20, 17, [[19, 13, 19, 15]]);

  // ---------------- plot 2: I-house ----------------
  pier_line(g, 25, 7, 34, 16, "bricks");
  for (let x = 25; x <= 34; x++) if (g.isAir(x, 1, 7)) g.set(x, 1, 7, "bricks", {});
  const chim2 = [[25, 12, 25, 12], [34, 12, 34, 12]];
  floor(g, 2, 25, 7, 34, 16, chim2);
  const o2 = [
    [27, 4, 9, 27, 5, 9], [32, 4, 9, 32, 5, 9], [27, 9, 9, 27, 10, 9], [32, 9, 9, 32, 10, 9],
    [29, 3, 9, 30, 5, 9], [29, 8, 9, 30, 9, 9],
    ...[25, 34].flatMap((x) => [10, 14].flatMap((z) => [[x, 4, z, x, 5, z], [x, 9, z, x, 10, z]])),
    [25, 3, 12, 25, 11, 12], [34, 3, 12, 34, 11, 12],
    [29, 3, 16, 29, 4, 16], [27, 4, 16, 27, 5, 16], [32, 4, 16, 32, 5, 16], [27, 9, 16, 27, 10, 16], [32, 9, 16, 32, 10, 16],
  ];
  clapboard_wall(g, [25, 3, 9, 34, 11, 16], "white_terracotta", "stripped_pale_oak_log", { open: o2 });
  for (const x of [25, 34]) for (const z of [9, 16]) for (let y = 3; y <= 11; y++) g.set(x, y, z, "smooth_quartz", {});
  plateRing(g, [25, 9, 34, 16], 6, "stripped_pale_oak_log", o2);
  floor(g, 7, 25, 7, 34, 16, [...chim2, [30, 10, 30, 14], [25, 7, 34, 8]].slice(0, 3), "spruce_planks");
  // partitions x28, x31 on both storeys. The stair flight takes x30 at z10..13, so the east door (x31) is reached from
  // the stair's foot at x30 z14 and sits at z14; the west door (x28) stays at z11, reached from x29.
  for (const x of [28, 31]) for (const [y0, y1] of [[3, 6], [8, 11]]) {
    const dz = x === 31 ? 14 : 11;
    partition(g, [x, y0, 10, x, y1, 15], "pale_oak_planks", [[x, y0, dz, x, y0 + 1, dz]]);
  }

  // ---------------- plot 3: pyramid cottage ----------------
  pier_line(g, 37, 7, 46, 17, "bricks", { skirt: "dark_oak_fence" });
  floor(g, 2, 37, 7, 46, 17, [[41, 11, 42, 14]]);
  const o3 = [
    [41, 3, 9, 42, 4, 9], [39, 4, 9, 39, 5, 9], [44, 4, 9, 44, 5, 9],
    ...[37, 46].flatMap((x) => [11, 15].map((z) => [x, 4, z, x, 5, z])),
    [41, 3, 17, 41, 4, 17], [39, 4, 17, 39, 5, 17], [44, 4, 17, 44, 5, 17],
  ];
  clapboard_wall(g, [37, 3, 9, 46, 6, 17], "pale_oak_planks", "stripped_dark_oak_log", { open: o3 });
  partition(g, [38, 3, 13, 40, 6, 13], "pale_oak_planks", [[39, 3, 13, 39, 4, 13]]);
  partition(g, [43, 3, 13, 45, 6, 13], "pale_oak_planks", [[44, 3, 13, 44, 4, 13]]);

  // ---------------- porch decks (all four), gallery deck of the I-house ----------------
  for (const [a, b] of [[1, 10], [15, 20], [25, 34], [37, 46]]) floor(g, 2, a, 7, b, 8);
  floor(g, 7, 25, 7, 34, 8);

  // ---------------- stair flights ----------------
  console.log("stairs1", JSON.stringify(stair_run(g, [19, 3, 11], "south", 7, "spruce").notes));
  console.log("stairs2", JSON.stringify(stair_run(g, [30, 3, 10], "south", 7, "spruce").notes));
}
