// Part 2 (tower): the clock tower shaft x16..30 z1..15, built up from the pavilion deck (y 31) to the dome.
// Shaft walls are 1 thick round a 12 x 12 interior (x18..29 z2..14; x17 is the inner wall that carries the stairs
// part's ladder at x18 z8). Clock room y57..69 (floor y56, ceiling y70); cornice y70..71; belfry 1 y72..81; belfry 2
// y82..89; lantern y90..95; dome y96..99. Dial discs, bell and flag belong to the clock-lights part; walls stay solid
// where the dials sit (their glowstone goes in the wall cell behind each dial). Writes go into air only: the stairs
// part's ladder and the shell's blocks are left as they are.
import { quoinCorner, slit, belfryStage, dome, cornice, clockFace } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SQ = "smooth_quartz";

export function build(g) {
  const air = (x, y, z) => /air$/.test(g.blockAt(x, y, z));
  // one cell, into air only
  const put = (x, y, z, block, state) => { if (air(x, y, z)) g.set(x, y, z, block, state); };
  // a box, into air only; spec = [block, state] pair from B.* (or a plain block id)
  const fill = (x0, y0, z0, x1, y1, z1, block, state) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(x, y, z, block, state);
  };

  // ---- v2: the four clock faces (centre y63, radius 4: an 11-wide round dial, black bezel, hour marks and hands at
  // 10:10), laid before the shaft walls so the glowstone panel behind each dial takes its place in the wall. The
  // clockmaker's part can't write them later: the wall cells are the tower's.
  for (const [center, face] of [[[23, 63, 0], "north"], [[23, 63, 16], "south"], [[15, 63, 8], "west"], [[31, 63, 8], "east"]]) {
    const r = clockFace(g, { center, face, radius: 4 });
    if (r.refused?.length) console.log(`  clock ${face}: ${r.refused.length} cells refused`);
  }
  // twelve dark hour marks one in from the bezel (every 30 degrees, radius 4), and the bezel closed at 12/3/6/9 where
  // the library leaves white notches: the dial reads as a ringed face with marks. The set is symmetric, so the same
  // offsets serve every face.
  const marks = [[0, 4], [2, 3], [3, 2], [4, 0], [3, -2], [2, -3], [0, -4], [-2, -3], [-3, -2], [-4, 0], [-3, 2], [-2, 3],
    [0, 5], [5, 0], [0, -5], [-5, 0]];
  for (const [u, v] of marks) {
    for (const [x, z] of [[23 + u, 0], [23 + u, 16], [15, 8 + u], [31, 8 + u]]) {
      if (/white_concrete/.test(g.blockAt(x, 63 + v, z))) g.set(x, 63 + v, z, "black_concrete");
    }
  }

  // ---- rusticated corners (y 39..69), quoins first so the walls fill round them
  quoinCorner(g, 16, 1, 39, 69);
  quoinCorner(g, 29, 1, 39, 69);
  quoinCorner(g, 16, 14, 39, 69);
  quoinCorner(g, 29, 14, 39, 69);

  // ---- shaft walls (smooth quartz), y 31..69: the perimeter, the inner west wall x17
  // The shell leaves y31 as air over the whole pavilion, and runParts locks that air: the shaft starts at y32.
  fill(16, 32, 1, 30, 69, 1, SQ);                    // north face z1
  fill(16, 32, 15, 30, 69, 15, SQ);                  // south face z15
  fill(16, 32, 2, 16, 69, 14, SQ);                   // west face x16
  fill(30, 32, 2, 30, 69, 14, SQ);                   // east face x30
  fill(17, 32, 2, 17, 69, 14, SQ);                   // inner west wall x17 (the ladder's wall)
  fill(16, 27, 15, 30, 31, 15, SQ);                  // the keep: the south face reaches down past the deck

  // ---- decks inside the shaft: the floor of the first room (stands y 33), the clock room's floor and ceiling
  fill(18, 32, 2, 29, 32, 14, SQ);
  fill(18, 56, 2, 29, 56, 14, SQ);                   // floor of the clock room (the ladder's hole stays open)
  fill(16, 70, 1, 30, 70, 15, SQ);                   // ceiling of the clock room, deck course
  fill(16, 71, 1, 30, 71, 15, B.slab(SQ, "top")[0], B.slab(SQ, "top")[1]);

  // ---- cornice (projects 1 beyond the shaft) at y70..71, the string course under the clock at y56
  cornice(g, { x0: 15, x1: 31, y: 70, z: 0, face: "north" });
  cornice(g, { x0: 15, x1: 31, y: 70, z: 16, face: "south" });
  cornice(g, { x0: 1, x1: 15, y: 70, z: 15, face: "west" });
  cornice(g, { x0: 1, x1: 15, y: 70, z: 31, face: "east" });
  const hang = (x, y, z, facing) => put(x, y, z, ...B.stairs("quartz", facing, "top"));
  for (let x = 15; x <= 31; x++) { hang(x, 56, 0, "south"); hang(x, 56, 16, "north"); }
  for (let z = 1; z <= 15; z++) { hang(15, 56, z, "east"); hang(31, 56, z, "west"); }

  // ---- the four rounds of slits (y 44..50): N/S at x 20, 23, 26; E/W at z 6, 9, 12
  for (const x of [20, 23, 26]) {
    slit(g, x, 44, 50, "north", { at: 1, over: true });
    slit(g, x, 44, 50, "south", { at: 15, over: true });
  }
  for (const z of [6, 9, 12]) {
    slit(g, z, 44, 50, "west", { at: 16, over: true });
    slit(g, z, 44, 50, "east", { at: 30, over: true });
  }

  // ---- belfry 1 (y 72..81): 13 x 13, three arches a face, columns at x 21, 25 and z 6, 10. Its deck (y 81, the
  // cornice course) is laid first, so belfry 2 stands on it; the belfry stage leaves its interior unwritten.
  fill(17, 81, 2, 29, 81, 14, SQ);
  belfryStage(g, { box: [17, 72, 2, 29, 81, 14], colsAt: [21, 25, 6, 10] });

  // ---- belfry 2 (y 82..89): 9 x 9, two arches a face, columns at x 23 and z 8; its deck is y 89
  belfryStage(g, { box: [19, 82, 4, 27, 89, 12], colsAt: [23, 8] });
  fill(19, 89, 4, 27, 89, 12, SQ);

  // ---- lantern (y 90..95): 5 x 5 floor, corner posts, open between them, lintel, cornice ring
  fill(21, 90, 6, 25, 90, 10, SQ);
  for (const [x, z] of [[21, 6], [25, 6], [21, 10], [25, 10]]) {
    for (let y = 91; y <= 93; y++) put(x, y, z, ...B.pillar("quartz_pillar", "y"));
  }
  fill(21, 94, 6, 25, 94, 10, SQ);                   // lintel
  fill(21, 95, 6, 25, 95, 10, SQ);                   // soffit under the dome
  for (let x = 20; x <= 26; x++) { hang(x, 95, 5, "south"); hang(x, 95, 11, "north"); }
  for (let z = 6; z <= 10; z++) { hang(20, 95, z, "east"); hang(26, 95, z, "west"); }

  // ---- dome (y 96..99) on the lantern
  dome(g, { x0: 21, z0: 6, y: 96 });
}
