// Masonry shell: plinth, walls, party walls, quoins, string course, pilasters, canted bay bodies, floors.
// Openings, stair wells, chimney stacks and bay decks (y=12) are left unwritten (air) for later parts.
import { BRICKS, SMOOTH_SANDSTONE, CUT_SANDSTONE, SMOOTH_QUARTZ, STONE_BRICKS, SPRUCE_PLANKS, DARK_OAK_PLANKS } from "../vocab.mjs";

const mir = (x) => 30 - x;
const inR = (v, a, b) => v >= a && v <= b;

// Openings as [x0,x1,y0,y1] per face, A's side; C is mirrored, B listed apart.
const A_FRONT = [[5,5,3,5],[7,10,3,6],[7,10,8,11],[5,5,8,10],[5,5,13,15],[8,9,13,15]];
const A_BACK = [[5,5,3,4],[8,9,3,5],[5,5,8,10],[8,9,8,10],[5,5,13,15],[8,9,13,15]];
const B_FRONT = [[15,15,3,5],[13,13,3,5],[17,17,3,5],[15,15,8,10],[13,13,8,10],[17,17,8,10],
  [13,13,13,15],[15,15,13,15],[17,17,13,15],[13,13,18,20],[15,15,18,20],[17,17,18,20]];
const B_BACK = [[15,15,3,4],[13,13,3,5],[17,17,3,5],[13,13,8,10],[15,15,8,10],[17,17,8,10],
  [13,13,13,15],[15,15,13,15],[17,17,13,15],[13,13,18,20],[15,15,18,20],[17,17,18,20]];
const inBoxes = (list, x, y) => list.some(([a, b, c, d]) => inR(x, a, b) && inR(y, c, d));
const mirrored = (list) => list.map(([a, b, c, d]) => [mir(b), mir(a), c, d]);
const C_FRONT = mirrored(A_FRONT), C_BACK = mirrored(A_BACK);

function isOpening(x, y, z) {
  if (z === 12) return inBoxes(A_FRONT, x, y) || inBoxes(B_FRONT, x, y) || inBoxes(C_FRONT, x, y);
  if (z === 24) return inBoxes(A_BACK, x, y) || inBoxes(B_BACK, x, y) || inBoxes(C_BACK, x, y);
  if (x === 3 || x === 27) return (z === 15 || z === 21) && (inR(y, 3, 5) || inR(y, 8, 10) || inR(y, 13, 15));
  if ((x === 11 || x === 19) && y >= 19 && y <= 20) return z === 15 || z === 21;
  return false;
}
const inStack = (x, z) => inR(z, 18, 19) && (inR(x, 10, 12) || inR(x, 18, 20));

export function build(g) {
  const put = (x, y, z, b) => { if (!inStack(x, z)) g.set(x, y, z, b); };

  // ---- walls
  for (let x = 3; x <= 27; x++) for (let z = 12; z <= 24; z++) {
    const wall = x === 3 || x === 27 || x === 11 || x === 19 || z === 12 || z === 24;
    if (!wall) continue;
    const party = x === 11 || x === 19;
    const H = inR(x, 11, 19) ? 22 : 17;
    for (let y = 1; y <= H; y++) {
      if (isOpening(x, y, z)) continue;
      const isB = inR(x, 12, 18) || (party && y >= 18);
      let b;
      if (y <= 2) b = STONE_BRICKS;
      else if (party && z === 12) b = CUT_SANDSTONE;                        // party-wall pilaster
      else if (y === 7 && (z === 12 || x === 3 || x === 27)) b = inR(x, 12, 18) && z === 12 ? SMOOTH_QUARTZ : CUT_SANDSTONE; // string course
      else if (!isB && y <= 16 && (z === 12 || x === 3 || x === 27) && quoin(x, y, z)) b = SMOOTH_SANDSTONE;
      else b = isB ? SMOOTH_SANDSTONE : BRICKS;
      put(x, y, z, b);
    }
  }

  // ---- interiors: footing at y1, floors at y2, 7, 12, 17 (wells and stacks left open)
  // A and C wells run through floors 7 and 12 only; B's also through 17. The attic hatch at x=4 / x=26, z=23 stays open
  // at y=17 so the attic ladder (stairs part, from the second floor up) climbs through it.
  const wells = { A: [9, 10], B: [12, 13], C: [20, 21] };
  const wellFloors = { A: [7, 12], B: [7, 12, 17], C: [7, 12] };
  for (const [h, x0, x1, wood] of [["A", 4, 10, SPRUCE_PLANKS], ["B", 12, 18, DARK_OAK_PLANKS], ["C", 20, 26, SPRUCE_PLANKS]]) {
    for (let x = x0; x <= x1; x++) for (let z = 13; z <= 23; z++) {
      put(x, 1, z, STONE_BRICKS);
      for (const y of [2, 7, 12, 17]) {
        if (y > 2 && wellFloors[h].includes(y) && inR(x, ...wells[h]) && z >= 20) continue;
        if (y === 17 && z === 23 && (x === 4 || x === 26)) continue;
        put(x, y, z, wood);
      }
    }
  }

  // ---- canted bays: A x7..10, C x20..23 (mirror)
  for (const bx of [7, 20]) {
    const wallCells = [[bx + 1, 10], [bx + 2, 10], [bx, 11], [bx + 3, 11]];
    const roomCells = [[bx + 1, 10], [bx + 2, 10], [bx + 1, 11], [bx + 2, 11]];
    for (const [x, z] of wallCells) for (let y = 1; y <= 11; y++) {
      if (inR(y, 3, 5) || inR(y, 8, 10)) continue; // window openings
      g.set(x, y, z, y <= 2 ? SMOOTH_SANDSTONE : y === 7 ? CUT_SANDSTONE : SMOOTH_SANDSTONE);
    }
    for (const [x, z] of roomCells) {
      g.set(x, 1, z, STONE_BRICKS);
      g.set(x, 2, z, SPRUCE_PLANKS);
      g.set(x, 7, z, SPRUCE_PLANKS);
    }
    // the cant cells x7/x10 at z=11 need floor-level support at y=2 on the room side: already sandstone
  }
}

// Quoins on the west corner (x=3) and, mirrored, the east corner (x=27): courses of three, front long (x3..4), side long (z12..13), front short.
function quoin(x, y, z) {
  const cx = x <= 15 ? x : 30 - x;       // distance from the nearest corner, as a west-corner x
  const course = (y - 3) % 3;            // 0 front long, 1 side long, 2 both short
  if (cx === 3 && z === 12) return true;
  if (course === 0 && z === 12 && cx === 4) return true;
  if (course === 1 && cx === 3 && z === 13) return true;
  return false;
}
