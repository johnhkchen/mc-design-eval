// PART 1 house shell and ground (plan.md PARTS 1, FORM, FLOORS, ROOMS, OPENINGS).
// Writes only into air (put / fill), so every cell an opening needs stays air for the later parts: the entry niche and
// door cells, the clerestory, the windows and the sliders, the south glass wall, the atrium ring body, the doorways, the
// pit, the atrium and the chimney. The ground (dirt y=0, pit floor y=0) is not owned by earlier parts, so it is set directly.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BEAM_LINES, HOUSE, ATRIUM, CHIMNEY, PIT } from "../vocab/base.mjs";
import { stucco_wall, header_course, terrazzo_floor } from "../vocab.mjs";

// one cell into air only; returns 1 if placed
function put(g, x, y, z, name) {
  if (!g.isAir(x, y, z)) return 0;
  g.set(x, y, z, ...B.block(name));
  return 1;
}

// inclusive box a..b into air only; returns the number placed
function fill(g, [x0, y0, z0], [x1, y1, z1], name) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) n += put(g, x, y, z, name);
  return n;
}

const { x0: hx0, x1: hx1, z0: hz0, z1: hz1 } = HOUSE; // 10, 31, 8, 25
const isBeam = (x) => BEAM_LINES.includes(x);
const inAtrium = (x, z) => x >= ATRIUM.x0 && x <= ATRIUM.x1 && z >= ATRIUM.z0 && z <= ATRIUM.z1;
const inChimney = (x, z) => x >= CHIMNEY.x0 && x <= CHIMNEY.x1 && z >= CHIMNEY.z0 && z <= CHIMNEY.z1;

// the atrium ring: glass ring on x=16, x=22, z=11, z=18 (body left as air for part 4)
const RING = { x0: ATRIUM.x0 - 1, x1: ATRIUM.x1 + 1, z0: ATRIUM.z0 - 1, z1: ATRIUM.z1 + 1 };
function ringCells(fn) {
  for (let x = RING.x0; x <= RING.x1; x++) { fn(x, RING.z0); fn(x, RING.z1); }
  for (let z = RING.z0; z <= RING.z1; z++) { fn(RING.x0, z); fn(RING.x1, z); }
}

export function build(g) {
  // bedding (y=-1) is not written: the grid has no y<0, and build.mjs drops it. Dirt y=0 is already laid over the lot.
  pit(g);
  reveals(g);
  base(g);
  walls(g);
  partitions(g);
  ceiling(g);
  floors(g);
}

// the conversation pit floor: smooth_quartz at y=0 (no slab at y=1 there)
function pit(g) {
  for (let x = PIT.x0; x <= PIT.x1; x++) for (let z = PIT.z0; z <= PIT.z1; z++) g.set(x, 0, z, ...B.block("smooth_quartz"));
}

// entry reveals (plan FACADES, vocab orange_entry): smooth_stone at x=17, white_concrete at x=21, the niche at z=8 and the door wall at z=9
function reveals(g) {
  for (const z of [8, 9]) {
    fill(g, [17, 1, z], [17, 4, z], "smooth_stone");
    fill(g, [21, 1, z], [21, 4, z], "white_concrete");
  }
}

// smooth_stone base (slab edge) at y=1 round the perimeter, and the glass ring's base
function base(g) {
  for (let x = hx0; x <= hx1; x++) { put(g, x, 1, hz0, "smooth_stone"); put(g, x, 1, hz1, "smooth_stone"); }
  for (let z = hz0; z <= hz1; z++) { put(g, hx0, 1, z, "smooth_stone"); put(g, hx1, 1, z, "smooth_stone"); }
  ringCells((x, z) => put(g, x, 1, z, "smooth_stone"));
}

// white stucco body y=2..4 on the north and west/east walls, with the openings left as air; the south wall is all glass
// (left air for part 4); the four house corners are left air for part 4's posts; dark_oak_planks header y=5 except beam lines
function walls(g) {
  // north, street face (z=8): x=11..16 blank stucco; the entry niche x=18..20 is air; x=22..30 has the clerestory row
  // at y=4 left air and blank stucco below it
  stucco_wall(g, 11, hz0, 16, hz0, 2, 4);
  stucco_wall(g, 22, hz0, 30, hz0, 2, 3);
  // west, kitchen and dining (x=10): utility door z=10 y=2..3, dining window z=14..16 y=3..4
  stucco_wall(g, hx0, 9, hx0, 9, 2, 4);
  stucco_wall(g, hx0, 10, hx0, 10, 4, 4);
  stucco_wall(g, hx0, 11, hx0, 13, 2, 4);
  stucco_wall(g, hx0, 14, hx0, 16, 2, 2);
  stucco_wall(g, hx0, 17, hx0, 24, 2, 4);
  // east (x=31): bedroom 1 window z=10..12 y=3..4, bath clerestory z=15..16 y=4, master glass z=21..23 full height
  stucco_wall(g, hx1, 9, hx1, 9, 2, 4);
  stucco_wall(g, hx1, 10, hx1, 12, 2, 2);
  stucco_wall(g, hx1, 13, hx1, 14, 2, 4);
  stucco_wall(g, hx1, 15, hx1, 16, 2, 3);
  stucco_wall(g, hx1, 17, hx1, 20, 2, 4);
  stucco_wall(g, hx1, 24, hx1, 24, 2, 4);
  // atrium ring: body air (glass and posts come from part 4); header y=5 on its north and south runs (the x=16 and x=22 runs are beam logs)
  header_course(g, hx0, hz0, hx1, hz0, 5);
  header_course(g, hx0, hz1, hx1, hz1, 5);
  header_course(g, 16, 11, 22, 11, 5);
  header_course(g, 16, 18, 22, 18, 5);
}

// white_concrete partitions y=2..4 (plan ROOMS): doorways left as air at y=2..3 (or y=2..4 where ROOMS says so)
function partitions(g) {
  stucco_wall(g, 25, 13, 30, 13, 2, 4); // bedroom 1 south wall, z=13
  stucco_wall(g, 25, 9, 25, 9, 2, 4); // x=25 corridor wall, doorways at z=10 (bed 1), z=15 (bath 1), z=19 (bed 2)
  stucco_wall(g, 25, 10, 25, 10, 4, 4);
  stucco_wall(g, 25, 11, 25, 12, 2, 4);
  stucco_wall(g, 25, 14, 25, 14, 2, 4);
  stucco_wall(g, 25, 15, 25, 15, 4, 4);
  stucco_wall(g, 25, 16, 25, 18, 2, 4);
  stucco_wall(g, 25, 19, 25, 19, 4, 4);
  stucco_wall(g, 25, 20, 25, 21, 2, 4);
  stucco_wall(g, 26, 17, 28, 17, 2, 4); // z=17, bath 2 door at x=29 (y=2..3 air)
  stucco_wall(g, 29, 17, 29, 17, 4, 4);
  stucco_wall(g, 30, 17, 30, 17, 2, 4);
  stucco_wall(g, 28, 14, 28, 16, 2, 4); // bath 1 / bath 2 divider
  stucco_wall(g, 25, 21, 30, 21, 2, 4); // master bedroom north wall (open to the corridor at x=23..24)
  stucco_wall(g, 22, 21, 22, 24, 2, 4); // corridor / living east wall, living doorway at z=19..20 left air
}

// spruce ceiling y=5 over the bedroom and living/kitchen runs (z=9..13 and z=20..24); the vault z=14..19 stays open
function ceiling(g) {
  for (const [za, zb] of [[9, 13], [20, 24]]) for (let x = 11; x <= 30; x++) for (let z = za; z <= zb; z++) {
    if (isBeam(x) || inAtrium(x, z) || inChimney(x, z)) continue;
    put(g, x, 5, z, "spruce_planks");
  }
}

// floors at y=1 (plan FLOORS): terrazzo in the public rooms, spruce in the bedrooms, smooth_quartz in the baths.
// Each terrazzo box is a clean rectangle that misses the pit, the atrium and the chimney, so the boxes are listed by hand.
function floors(g) {
  const terrazzo = [
    [11, 1, 9, 15, 1, 13], // kitchen
    [16, 1, 9, 24, 1, 10], // gallery, entry gallery and the corridor's south end
    [23, 1, 11, 24, 1, 21], // corridor
    [11, 1, 14, 15, 1, 18], // dining
    [11, 1, 19, 12, 1, 24], // living, west strip
    [13, 1, 19, 22, 1, 19], // living, north row and the doorway cell at x=22
    [18, 1, 20, 19, 1, 24], // living, beside the pit
    [20, 1, 20, 21, 1, 20], // living, north of the chimney
    [20, 1, 23, 21, 1, 24], // living, south of the chimney
    [13, 1, 24, 17, 1, 24], // living, south of the pit
    [22, 1, 20, 22, 1, 24], // living doorway and the x=22 partition floor
    [25, 1, 9, 25, 1, 24], // under the x=25 partition
    [26, 1, 13, 30, 1, 13], // under the z=13 partition
    [26, 1, 17, 30, 1, 17], // under the z=17 partition
    [26, 1, 21, 30, 1, 21], // under the z=21 partition
    [28, 1, 14, 28, 1, 16], // under the bath divider
  ];
  terrazzo.forEach((box, i) => terrazzo_floor(g, box, i + 1));
  fill(g, [26, 1, 9], [30, 1, 12], "spruce_planks"); // bedroom 1
  fill(g, [26, 1, 18], [30, 1, 20], "spruce_planks"); // bedroom 2
  fill(g, [23, 1, 22], [30, 1, 24], "spruce_planks"); // master bedroom
  fill(g, [26, 1, 14], [27, 1, 16], "smooth_quartz"); // bath 1
  fill(g, [29, 1, 14], [30, 1, 16], "smooth_quartz"); // bath 2
}
