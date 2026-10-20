// Part "residences": plots 1 and 2 (Archbishop's residence, Rectory): shells, quoins, slate gable roofs, chimneys, windows, gardens.
// Plot-local coordinates (plan.md); each helper below shifts them by the plot's site x (PLOT_X). The shell is hollow
// (interior carved to air, walls marble), windows are carved as air before house_window writes glass into them, and the
// roofs go last so the chimney stacks (placed before) pass through them. Only air is written by the vocab helpers.
import { PLOT_X, marble_wall, house_window, gable_roof_x, gable_roof_z } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const P = [null, PLOT_X[1], PLOT_X[2]];

// plot-local box [x0,y0,z0,x1,y1,z1] -> site box
const sb = (n, [x0, y0, z0, x1, y1, z1]) => [P[n] + x0, y0, z0, P[n] + x1, y1, z1];
const marble = (g, n, b) => marble_wall(g, sb(n, b));
const air = (g, n, b) => { const [a, c, d, e, f, h] = sb(n, b); g.fill([a, c, d], [e, f, h], "air"); };
const set = (g, n, x, y, z, [block, state]) => g.set(P[n] + x, y, z, block, state);
const fillBlock = (g, n, b, block, state) => { const [a, c, d, e, f, h] = sb(n, b); for (let x = a; x <= e; x++) for (let y = c; y <= f; y++) for (let z = d; z <= h; z++) g.set(x, y, z, block, state); };

// a 2-wide window in the wall plane: carve its cells plus the head row, then let house_window write panes, sill and head
function windowAt(g, n, x, y, z, pointed, face) {
  if (face === "east" || face === "west") air(g, n, [x, y, z, x, y + 2, z + 1]);
  else air(g, n, [x, y, z, x + 1, y + 2, z]);
  house_window(g, P[n] + x, y, z, pointed, face);
}

// a 2x2 chimney stack from y 0 to top-1, a deepslate_bricks band at y band, a polished diorite cap at y top
function stack(g, n, [x0, z0, x1, z1], top, band) {
  marble(g, n, [x0, 0, z0, x1, top - 1, z1]);
  fillBlock(g, n, [x0, band, z0, x1, band, z1], "deepslate_bricks");
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) set(g, n, x, top, z, B.slab("polished_diorite", "bottom"));
}

// the Archbishop's residence, plot 1 (x 0..18, z 0..14; front north on 51st St; top 30)
function residence1(g) {
  const n = 1;
  // walled garden on the cathedral side: walls on x 0 and z 9, coping at y 3
  marble(g, n, [0, 0, 0, 0, 2, 9]);
  marble(g, n, [1, 0, 9, 3, 2, 9]);
  for (let z = 0; z <= 9; z++) set(g, n, 0, 3, z, B.slab("polished_diorite", "bottom"));
  for (let x = 1; x <= 3; x++) set(g, n, x, 3, 9, B.slab("polished_diorite", "bottom"));
  // main block: solid marble shell, hollow inside (x 5..16, y 1..12, z 2..8)
  marble(g, n, [4, 0, 1, 17, 13, 9]);
  air(g, n, [5, 1, 2, 16, 12, 8]);
  // rear wing: x 6..16, z 10..14
  marble(g, n, [6, 0, 10, 16, 13, 14]);
  air(g, n, [7, 1, 10, 15, 12, 13]);
  // north cross-gable bay (one cell proud) and east cross-gable bay on Madison
  marble(g, n, [9, 0, 0, 13, 13, 0]);
  marble(g, n, [18, 0, 3, 18, 13, 7]);
  // chimneys: west stack in the garden against x 4, wing stack against the wing's east wall x 16
  stack(g, n, [2, 4, 3, 5], 22, 18);
  stack(g, n, [17, 11, 18, 12], 22, 18);
  // entrance: bay passage at z 0, bottom slabs as the half step, dark oak door in the main wall line z 1
  for (let x = 10; x <= 12; x++) set(g, n, x, 0, 0, B.slab("polished_andesite", "bottom"));
  air(g, n, [11, 1, 0, 11, 2, 0]);
  air(g, n, [11, 1, 1, 11, 2, 1]);
  set(g, n, 11, 1, 1, B.door("dark_oak", "north", "lower", "left"));
  set(g, n, 11, 2, 1, B.door("dark_oak", "north", "upper", "left"));
  // garden lawn (grass at y 0) and two shrubs, clear of the west stack
  for (let x = 1; x <= 3; x++) for (let z = 0; z <= 8; z++) {
    if (x >= 2 && z >= 4 && z <= 5) continue;
    set(g, n, x, 0, z, ["grass_block", undefined]);
  }
  g.set(P[n] + 1, 1, 2, "oak_leaves", { persistent: "true" });
  g.set(P[n] + 2, 1, 7, "oak_leaves", { persistent: "true" });
  // windows: north face z 1 (x 5, x 15), east wall x 17 and west wall x 4 (z 2), wing east x 16 (z 12), wing south z 14
  for (const y of [2, 6, 10]) {
    const top = y === 10;
    windowAt(g, n, 5, y, 1, top, "north");
    windowAt(g, n, 15, y, 1, top, "north");
    windowAt(g, n, 17, y, 2, top, "east");
    windowAt(g, n, 4, y, 2, top, "west");
    windowAt(g, n, 16, y, 12, top, "east");
  }
  for (const y of [2, 6]) {
    windowAt(g, n, 8, y, 14, false, "south");
    windowAt(g, n, 12, y, 14, false, "south");
  }
  // roofs last: the main gable (ridge along x) and the wing gable (ridge along z); the stacks pass through
  gable_roof_x(g, [[P[n] + 3, 0, 0], [P[n] + 18, 0, 10]], 14, 19);
  gable_roof_z(g, [P[n] + 5, 10, P[n] + 17, 14], 14, 20);
}

// the Rectory, plot 2 (x 0..17, z 0..14; front south on 50th St; top 34): mirror of plot 1, north-south
function residence2(g) {
  const n = 2;
  // walled garden on the cathedral side: walls on x 0 and z 14, coping at y 4
  marble(g, n, [0, 1, 5, 0, 3, 14]);
  marble(g, n, [1, 1, 14, 3, 3, 14]);
  for (let z = 5; z <= 14; z++) set(g, n, 0, 4, z, B.slab("polished_diorite", "bottom"));
  for (let x = 1; x <= 3; x++) set(g, n, x, 4, 14, B.slab("polished_diorite", "bottom"));
  // main block x 4..16, z 5..13, hollow x 5..15, y 3..14, z 6..12 (floor block y 2)
  marble(g, n, [4, 0, 5, 16, 15, 13]);
  air(g, n, [5, 3, 6, 15, 14, 12]);
  // north wing x 4..15, z 0..4, hollow x 5..14, z 1..3
  marble(g, n, [4, 0, 0, 15, 15, 4]);
  air(g, n, [5, 3, 1, 14, 14, 3]);
  // south cross-gable bay (one cell proud, z 14) and east cross-gable bay on Madison (x 17)
  marble(g, n, [8, 0, 14, 12, 15, 14]);
  marble(g, n, [17, 0, 7, 17, 15, 11]);
  // chimneys: west stack against x 4 at z 8..9, wing stack against the wing's east wall x 15
  stack(g, n, [2, 8, 3, 9], 24, 20);
  stack(g, n, [16, 1, 17, 2], 24, 20);
  // entrance: bay passage at z 14, slab half step at y 2, dark oak door in the south wall line z 13
  for (let x = 9; x <= 11; x++) set(g, n, x, 2, 14, B.slab("polished_andesite", "bottom"));
  air(g, n, [10, 3, 14, 10, 4, 14]);
  air(g, n, [10, 3, 13, 10, 4, 13]);
  set(g, n, 10, 3, 13, B.door("dark_oak", "south", "lower", "left"));
  set(g, n, 10, 4, 13, B.door("dark_oak", "south", "upper", "left"));
  // windows: south face z 13 (x 5, x 14), east wall x 16 (z 5 and z 12), west wall x 4 (z 10)
  for (const y of [4, 8, 12]) {
    const top = y === 12;
    windowAt(g, n, 5, y, 13, top, "south");
    windowAt(g, n, 14, y, 13, top, "south");
    windowAt(g, n, 16, y, 5, top, "east");
    windowAt(g, n, 16, y, 12, top, "east");
    windowAt(g, n, 4, y, 10, top, "west");
  }
  // roofs last: main gable (ridge along x) and wing gable (ridge along z)
  gable_roof_x(g, [[P[n] + 3, 0, 4], [P[n] + 17, 0, 14]], 16, 21);
  gable_roof_z(g, [P[n] + 3, 0, P[n] + 16, 4], 16, 22);
}

// Part entry: the two residences (plots 1 and 2), each built in its own site orientation.
export function build(g) {
  residence1(g);
  residence2(g);
}
