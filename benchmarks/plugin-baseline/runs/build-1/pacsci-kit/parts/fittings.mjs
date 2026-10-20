// Part "fittings": the doors at every opening, the glazed transom over the main entrance, the name band on the plaza face,
// lamp posts along the walks, hanging lanterns under the big halls' ceilings, and the poplar rows on the plaza.
// Every door is placed by its LEFT leaf as seen from outside (door_pair puts the second leaf one step to the right), so
// each pair covers its opening exactly. Writes only into air; refused writes are reported by runParts.
import { DIRS, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { glaze_bay, name_band, lamp_post, poplar } from "../vocab.mjs";

// A double iron door: both leaves, both halves, hinged so the pair meets in the middle. vocab's door_pair reads DIRS as
// [x, z] but DIRS is [x, y, z], so it places only one leaf on east/west-facing doors (rz is the y term, 0). This writes
// the leaves itself. (x, y, z) is the left leaf as seen from outside; the second leaf is one step along the wall in the
// direction the build library gives. All or nothing, into air only.
function door_pair(g, [x, y, z], facing) {
  const [rx, , rz] = DIRS[face.cw(face.opposite(facing))];
  const leaves = [[x, z, "left"], [x + rx, z + rz, "right"]];
  const cells = leaves.flatMap(([lx, lz]) => [[lx, y, lz], [lx, y + 1, lz]]);
  const blocked = cells.filter(([cx, cy, cz]) => !g.inBounds(cx, cy, cz) || !g.isAir(cx, cy, cz));
  if (blocked.length) return { placed: 0, refused: blocked };
  for (const [lx, lz, hinge] of leaves) {
    g.set(lx, y, lz, "iron_door", { facing, half: "lower", hinge, open: "false" });
    g.set(lx, y + 1, lz, "iron_door", { facing, half: "upper", hinge, open: "false" });
  }
  return { placed: 4, refused: [] };
}

// Doors, one entry per opening in plan.md's OPENINGS table: [left cell x, y, z, facing out].
const DOORS = [
  // main entrance, west face x40, z45..48 (two pairs)
  [40, 1, 45, "west"], [40, 1, 47, "west"],
  // B second entrance, west face x40, z30..31
  [40, 1, 30, "west"],
  // N1 north door, north face z0, x106..109 (viewer's right is -x, so the left leaf is the higher x)
  [107, 1, 0, "north"], [109, 1, 0, "north"],
  // N1 stair bay door, west face x80, z11..12
  [80, 1, 11, "west"],
  // E wing loggia doors into the halls, back wall x63
  [63, 1, 89, "west"], [63, 1, 113, "west"], [63, 1, 137, "west"],
  // S wing loggia doors, back wall z163, x14..15, 30..31, 46..47
  [15, 1, 163, "north"], [31, 1, 163, "north"], [47, 1, 163, "north"],
  // B2 loggia door, back wall z72, x49..50
  [49, 1, 72, "south"],
  // E wing east service door, east face x131, z116..117 (viewer's right is -z, so the left leaf is z117)
  [131, 1, 117, "east"],
  // promenade doors (upper floor), E x60 z101..102 & 125..126; S z160 x22..23 & 38..39
  [60, 11, 101, "west"], [60, 11, 125, "west"],
  [23, 11, 160, "north"], [39, 11, 160, "north"],
  // dome entrance through the porch, x18..21 at z54: NO doors here. The dome part carves that opening to air and runParts
  // locks it, so a pair written into it is refused. Doors for the dome entrance belong in dome.mjs (or the carve must leave
  // the door cells for this part).
];

export function build(g) {
  const refused = [];
  const note = (what, r) => {
    if (r && r.refused && r.refused.length) refused.push({ what, refused: r.refused.length });
  };

  for (const [x, y, z, facing] of DOORS) note(`door ${x},${y},${z}`, door_pair(g, [x, y, z], facing));

  // Main entrance transom: glass over the pairs, y3..5 (the opening is 3 high with the arch head to y5).
  glaze_bay(g, "west", [40, 3, 45], { w: 4, h: 3 });

  // Name band on the plaza face x40 (banners at x39), z30..53, y12 (one row of letters).
  note("name band", { refused: name_band(g, { x: 39, y: 12, z0: 30, z1: 53, face: "west" }) });

  // Lamp posts: x30 and x33 along the central walk every 8 from z80, skipping the A1 arch box (z100..109) and the
  // E-W walk crossing (z111..114); x5 along the perimeter walk.
  const postZ = [80, 88, 96, 120, 128, 136, 144, 152];
  for (const z of postZ) {
    for (const x of [30, 33]) note(`lamp post ${x},${z}`, { refused: lamp_post(g, x, z) });
  }
  for (const z of [80, 88, 96, 104, 120, 128, 136, 144, 152]) {
    note(`lamp post 5,${z}`, { refused: lamp_post(g, 5, z) });
  }

  // Hanging lanterns under the ground-floor and upper-floor ceilings of the big halls (a lantern every 8 cells along
  // each hall's centre line, only where the cell is air and the ceiling above is solid).
  const hang = (x, y, z) => {
    if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return false;
    if (!g.inBounds(x, y + 1, z) || g.isAir(x, y + 1, z)) g.set(x, y, z, "lantern", { hanging: "true" });
    else return false;
    return true;
  };
  const halls = [
    // [x0, x1, z0, z1, ceiling y of the storey (the lantern sits one under it)]
    [41, 142, 25, 50, 9], [41, 142, 25, 50, 17], // B lobby and upper exhibit floor
    [85, 130, 1, 22, 9], // N1 north hall
    [64, 130, 77, 158, 9], [61, 130, 77, 158, 17], // E wing exhibit and upper halls
    [1, 130, 164, 170, 9], // S wing halls
  ];
  for (const [x0, x1, z0, z1, y] of halls) {
    for (let x = x0 + 4; x <= x1 - 4; x += 8) {
      for (let z = z0 + 3; z <= z1 - 3; z += 8) hang(x, y, z);
    }
  }

  // Poplar rows on the plaza: a row along x0..1 every 6 cells in z, and a row along z2..3 at x40..76 every 6.
  for (let z = 4; z <= 70; z += 6) note(`poplar 1,${z}`, poplar(g, 1, z, 9));
  for (let x = 40; x <= 76; x += 6) note(`poplar ${x},2`, poplar(g, x, 2, 10));

  return refused;
}
