// Part "shell east (plots 4-7)": the walls, floors, partitions and gable infill of Cornell (4), Stanford (5),
// Winona (6) and Craftsman (7). Writes only into cells no earlier part has set (g.get undefined), and never into an
// opening: plan.md OPENINGS and the RESERVED stair holes, hearth mouths and flues stay air for later parts.
// Roofs, porches, fittings and chimneys are other parts; the gable triangles here are the wall's job (plan.md).

const key = (x, y, z) => `${x},${y},${z}`;
// inclusive range a..b
const R = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// add every cell of xs x ys x zs to the set of openings that stay air
function cut(holes, xs, ys, zs) {
  for (const x of xs) for (const y of ys) for (const z of zs) holes.add(key(x, y, z));
}

// write a block into air only: an opening, or a cell an earlier part has set, is left alone
function put(g, holes, x, y, z, block, state) {
  if (holes.has(key(x, y, z)) || g.get(x, y, z)) return;
  g.set(x, y, z, block, state);
}

// fill xs x ys x zs with one block (air-only, see put)
function fill(g, holes, xs, ys, zs, block, state) {
  for (const x of xs) for (const y of ys) for (const z of zs) put(g, holes, x, y, z, block, state);
}

// the outer ring of a house box x0..x1, z0..z1 at the rows ys: pick(x, y, z, corner) gives [block, state] or null
function ring(g, holes, { x0, x1, z0, z1, ys }, pick) {
  for (const y of ys) for (const x of R(x0, x1)) for (const z of R(z0, z1)) {
    if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    const b = pick(x, y, z, corner);
    if (b) put(g, holes, x, y, z, b[0], b[1]);
  }
}

// a gable triangle on a face: fixed is the wall plane (z for a north/south face, x for an east/west one), a0..a1 the
// run of the wall, wallTop the top row of the wall. Each cell in from the edge rises one more row (45 degrees).
// A gable cell is laid only on something: the cell below it is wall or an earlier gable cell, so a window's head
// never leaves a floating or orphan block above it.
function gable(g, holes, { axis, fixed, a0, a1, wallTop, block }) {
  const at = (b, y) => (axis === "z" ? [b, y, fixed] : [fixed, y, b]);
  for (const b of R(a0, a1)) {
    const d = Math.min(b - a0, a1 - b);
    let below = true;
    for (let y = wallTop + 1; y <= wallTop + d; y++) {
      const [x, , z] = at(b, y);
      const [bx, , bz] = at(b, y - 1);
      const supported = below || g.get(bx, y - 1, bz);
      if (!supported || holes.has(key(x, y, z))) { below = false; continue; }
      put(g, holes, x, y, z, block);
      below = true;
    }
  }
}

// Cornell (plot 4): two-storey cube, x 67..77, z 13..21; interior x 68..76, z 14..20. Walls y2..9: two full floors of wall (the
// upper storey's windows y6..7 with a wall course y8..9 above them under the eave), the low hip starts at y10 (roofs.mjs)
function cornell(g) {
  const h = new Set();
  const FLOOR = "oak_planks", PART = "spruce_planks";
  // openings: north row (both floors; the door and sidelights share the ground row), west and east pairs, south pairs
  cut(h, [68, 69, 71, 72, 73, 75, 76], [2, 3, 6, 7], [13]);
  cut(h, [67], [2, 3, 6, 7], [14, 15, 19, 20]);
  cut(h, [77], [2, 3, 6, 7], [14, 15, 19, 20]);
  cut(h, [77], [1, 2], [17]);                       // hearth mouth (chimney() cuts it too)
  cut(h, [69, 70, 72, 74, 75], [2, 3], [21]);
  cut(h, [69, 70, 74, 75], [6, 7], [21]);
  cut(h, [68], [5], [15, 16, 17]);                  // stair hole, floor y5 (plan RESERVED)
  cut(h, [72], [2, 3, 6, 7], [18]);                 // hall doorway through the partition

  fill(g, h, R(68, 76), [1, 5], R(14, 20), FLOOR);
  ring(g, h, { x0: 67, x1: 77, z0: 13, z1: 21, ys: R(1, 9) }, (x, y, z, corner) => {
    if (y === 1) return ["bricks"];
    if (corner || y === 5) return ["smooth_quartz"];
    return ["cyan_terracotta"];
  });
  fill(g, h, R(68, 76), [9], R(14, 20), PART);      // the ceiling of the upper storey (the lanterns hang from it)
  fill(g, h, R(69, 76), [2, 3, 4], [18], PART);     // partitions: living/parlour from dining/kitchen
  fill(g, h, R(69, 76), [6, 7, 8], [18], PART);
}

// Stanford (plot 5): one and a half storeys, x 83..93, z 14..21; interior x 84..92, z 15..20; side gables
function stanford(g) {
  const h = new Set();
  const FLOOR = "oak_planks", PART = "spruce_planks";
  cut(h, [84, 85, 88, 91, 92], [2, 3], [14]);       // north: pairs and the door
  cut(h, [83, 93], [2, 3], [15, 16]);               // side ground pairs
  cut(h, [83, 93], [7, 8], [17, 18]);               // gable pairs
  cut(h, [85, 86, 88, 90, 91], [2, 3], [21]);       // south: pairs and back door
  cut(h, [88], R(1, 6), [18]);                      // central flue and hearth mouth in the partition
  cut(h, [88], [1], [19]);                          // the hearth grate in the floor layer in front of the fire (grounds.mjs)
  cut(h, [92], [5], [17, 18, 19]);                  // stair hole (plan RESERVED)

  fill(g, h, R(84, 92), [1, 5], R(15, 20), FLOOR);
  ring(g, h, { x0: 83, x1: 93, z0: 14, z1: 21, ys: R(1, 6) }, (x, y, z, corner) => {
    if (y === 1) return ["bricks"];
    if (corner || y === 6) return ["smooth_quartz"];
    return ["calcite"];
  });
  gable(g, h, { axis: "x", fixed: 83, a0: 14, a1: 21, wallTop: 6, block: "calcite" });
  gable(g, h, { axis: "x", fixed: 93, a0: 14, a1: 21, wallTop: 6, block: "calcite" });
  fill(g, h, R(84, 91), [2, 3, 4, 6], [18], PART);  // partition with the central flue
}

// Winona (plot 6): one storey, front gable, x 100..108, z 13..22; interior x 101..107, z 14..21
function winona(g) {
  const h = new Set();
  const FLOOR = "oak_planks", PART = "spruce_planks";
  cut(h, [101, 102, 104, 106, 107], [2, 3], [13]);  // front pairs and door
  cut(h, [103, 104, 105], [6, 7], [13]);            // gable triple
  cut(h, [100, 108], [2, 3], [15, 16, 20, 21]);     // side pairs
  cut(h, [100], [1, 2], [18]);                      // hearth mouth (west wall, the chimney moved off the east side)
  cut(h, [102, 103, 106], [2, 3], [22]);            // back pair and back door
  cut(h, [105], [2, 3], [19]);                      // doorway through the partition

  fill(g, h, R(101, 107), [1], R(14, 21), FLOOR);
  ring(g, h, { x0: 100, x1: 108, z0: 13, z1: 22, ys: R(1, 4) }, (x, y, z, corner) => {
    if (y === 1) return ["cobblestone"];
    if (corner || y === 4) return ["smooth_quartz"];
    return ["smooth_sandstone"];
  });
  gable(g, h, { axis: "z", fixed: 13, a0: 100, a1: 108, wallTop: 4, block: "smooth_sandstone" });
  gable(g, h, { axis: "z", fixed: 22, a0: 100, a1: 108, wallTop: 4, block: "smooth_sandstone" });
  fill(g, h, R(101, 107), [2, 3, 4], [19], PART);   // partition: living and kitchen from the bedroom and bunk
}

// Craftsman (plot 7): two storeys, x 114..125, z 13..21; interior x 115..124, z 14..20; front and back gables
function craftsman(g) {
  const h = new Set();
  const FLOOR = "oak_planks", PART = "spruce_planks";
  cut(h, [115, 116, 117, 119, 122, 123], [2, 3], [13]);   // front ground: triple, door, pair
  cut(h, [115, 116, 122, 123], [6, 7], [13]);             // front upper pairs
  cut(h, [119, 120], [10, 11], [13]);                     // gable pair
  cut(h, [114], [2, 3, 6, 7], [14, 15, 19, 20]);          // west pairs
  cut(h, [125], [2, 3], [14, 15, 19, 20]);                // east ground pairs
  cut(h, [125], [6, 7], [19, 20]);                        // east upper beside the stack
  cut(h, [125], [1, 2], [17]);                            // hearth mouth
  cut(h, [116, 117, 121, 122], [2, 3, 6, 7], [21]);       // back pairs
  cut(h, [119], [2, 3], [21]);                            // back door
  cut(h, [115], [5], [15, 16, 17]);                       // stair hole (plan RESERVED)
  cut(h, [120], [2, 3, 4, 6, 7, 8], [18]);                // hall doorway through the partition

  fill(g, h, R(115, 124), [1, 5], R(14, 20), FLOOR);
  ring(g, h, { x0: 114, x1: 125, z0: 13, z1: 21, ys: R(1, 8) }, (x, y, z, corner) => {
    if (y === 1) return (x + z) % 4 === 0 ? ["mossy_cobblestone"] : ["cobblestone"];
    if (corner) return ["dark_oak_planks"];
    if (y <= 4) {
      const onNorthSouth = z === 13 || z === 21;
      return ["stripped_birch_log", { axis: onNorthSouth ? "x" : "z" }];
    }
    return ["spruce_planks"];
  });
  gable(g, h, { axis: "z", fixed: 13, a0: 114, a1: 125, wallTop: 8, block: "spruce_planks" });
  gable(g, h, { axis: "z", fixed: 21, a0: 114, a1: 125, wallTop: 8, block: "spruce_planks" });
  fill(g, h, R(116, 124), [2, 3, 4, 6, 7, 8], [18], PART); // partition: living from dining and kitchen
}

export function build(g) {
  cornell(g);
  stanford(g);
  winona(g);
  craftsman(g);
}
