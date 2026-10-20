// Part "west front and towers": two square towers (x0..10, z3..13 and z27..37) to y43 with belfries, louvres, a bell
// and a side portal and lancet on each west face; the centre west front (x4..10, z14..26) with the main portal, the
// rose-window opening and the stepped great gable; wide slab steps and two lamp posts on Fifth Avenue.
// Holes are left as air where an opening goes; the vocabulary helpers then dress them (they only write into air).
import {
  marble_wall, plinth, lancet, louvre_opening, portal_arch, rose_window, slab_ramp, lamp_post, ROSE_CENTRE,
} from "../vocab.mjs";

const inBox = (b, x, y, z) => x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5];

// Marble over the box, cell by cell, except cells inside a hole box (left air) or outside `keep`.
function mass(g, box, holes = [], keep = () => true) {
  const [x0, y0, z0, x1, y1, z1] = box;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
    if (!keep(x, z) || holes.some((h) => inBox(h, x, y, z))) continue;
    marble_wall(g, [x, y, z, x, y, z]);
  }
}

// One tower. m maps the north tower's z to this tower's (identity for north, z -> 40 - z for the south tower);
// outFace is the compass name of the face at m(3), the street-side z face.
function tower(g, m, outFace) {
  const inFace = outFace === "north" ? "south" : "north";
  const box = (x0, y0, za, x1, y1, zb) => {
    const p = m(za), q = m(zb);
    return [x0, y0, Math.min(p, q), x1, y1, Math.max(p, q)];
  };
  const zOut = m(3), zIn = m(13);
  const cx = 5, zc = m(8);

  plinth(g, [[0, 0, Math.min(m(3), m(13))], [10, 2, Math.max(m(3), m(13))]]);

  // holes for the stage-1 side portal (west face), the stage-3 lancets and the street-face lancet
  const holes = [
    box(0, 3, 7, 2, 11, 9),     // west side portal, z 7..9
    box(0, 23, 7, 2, 30, 9),    // west stage-3 lancet
    box(4, 23, 3, 6, 30, 5),    // street-face stage-3 lancet
  ];
  mass(g, box(0, 3, 3, 10, 30, 13), holes);

  // belfry y31..41: a one-cell ring of walls with the louvre openings left as air; floor is y30 (solid above)
  const louvres = [
    box(0, 32, 5, 1, 41, 6), box(0, 32, 10, 1, 41, 11),   // west face, two 2-wide openings
    box(9, 32, 5, 10, 41, 6), box(9, 32, 10, 10, 41, 11), // east face
    box(2, 32, 3, 3, 41, 3), box(7, 32, 3, 8, 41, 3),     // street-face (z outFace) openings
    box(2, 32, 13, 3, 41, 13), box(7, 32, 13, 8, 41, 13), // inner face
  ];
  mass(g, box(0, 31, 3, 10, 41, 13), louvres, (x, z) => x === 0 || x === 10 || z === m(3) || z === m(13));
  mass(g, box(0, 42, 3, 10, 43, 13), []);          // ceiling of the belfry (bell hangs from it) and the tower top

  // bell hung from the ceiling at the belfry centre
  g.set(cx, 41, zc, "bell", { facing: "north", attachment: "ceiling" });

  // dressing: louvres on the four belfry faces, the lancet and portal on the west and street faces
  louvre_opening(g, 5, 32, 39, "west", 0);
  louvre_opening(g, 10, 32, 39, "west", 0);
  louvre_opening(g, 5, 32, 39, "east", 10);
  louvre_opening(g, 10, 32, 39, "east", 10);
  louvre_opening(g, 2, 32, 39, outFace, zOut);
  louvre_opening(g, 7, 32, 39, outFace, zOut);
  louvre_opening(g, 2, 32, 39, inFace, zIn);
  louvre_opening(g, 7, 32, 39, inFace, zIn);
  portal_arch(g, [0, 3, zc], "west", 2, 3, 7);
  lancet(g, box(0, 23, 7, 2, 30, 9), "west", 0, zc, 23, 29, 3);
  lancet(g, box(4, 23, 3, 6, 30, 5), outFace, zOut, 5, 23, 29, 3);
}

// The great rose (diameter 9) in the disc x4..6: a polished diorite rim one cell proud of the glass (x4), the glass at x5
// (blue petals, red and purple rings, yellow at the hub's edge) with thin diorite wall tracery on the 8 spokes near the
// hub, an ochre froglight behind every glass cell (x6); marble fills the disc's corners outside the rim.
function rose(g, [cx, cy, cz]) {
  const put = (x, y, z, b, st) => { if (g.isAir(x, y, z)) g.set(x, y, z, b, st); };
  for (let dy = -4; dy <= 4; dy++)
    for (let dz = -4; dz <= 4; dz++) {
      const y = cy + dy, z = cz + dz, r = Math.hypot(dy, dz);
      if (r > 4.6) { for (let x = cx; x <= cx + 2; x++) put(x, y, z, (dy * 3 + dz) % 2 ? "calcite" : "polished_diorite"); continue; }
      if (r > 3.7) { put(cx, y, z, "polished_diorite"); put(cx + 1, y, z, "polished_diorite"); put(cx + 2, y, z, "calcite"); continue; }
      if (r < 0.5) { put(cx + 1, y, z, "polished_diorite"); put(cx + 2, y, z, "ochre_froglight"); continue; }
      const spoke = dy === 0 || dz === 0 || Math.abs(dy) === Math.abs(dz);
      if (spoke && r < 2.5) { put(cx + 1, y, z, "diorite_wall", { up: "true" }); put(cx + 2, y, z, "ochre_froglight"); continue; }
      const glass = r < 1.6 ? "yellow_stained_glass" : r < 2.6 ? "red_stained_glass" : spoke ? "purple_stained_glass" : "blue_stained_glass";
      put(cx + 1, y, z, glass); put(cx + 2, y, z, "ochre_froglight");
    }
}

// The main portal's outer order, one proud of the front at x3: polished diorite colonnettes at z17 and z23 (y3..12), and
// over them a crocketed gable (wimperg) rising from y13 to its apex at (3, 18, 20), quartz stairs on the rake, end rod tip.
function wimperg(g) {
  const put = (x, y, z, b, st) => { if (g.isAir(x, y, z)) g.set(x, y, z, b, st); };
  for (const z of [17, 23]) for (let y = 3; y <= 12; y++) put(3, y, z, "polished_diorite");
  for (let z = 17; z <= 23; z++) {
    const top = 13 + (3 - Math.abs(z - 20));
    for (let y = 13; y < top; y++) put(3, y, z, (y + z) % 3 ? "calcite" : "polished_diorite");
    if (z === 20) { put(3, top, z, "polished_diorite"); put(3, top + 1, z, "smooth_quartz_slab"); put(3, top + 2, z, "end_rod", { facing: "up" }); }
    else put(3, top, z, "smooth_quartz_stairs", { facing: z < 20 ? "south" : "north", half: "bottom", shape: "straight", waterlogged: "false" });
  }
  // the order's arch under the gable: upside-down stairs springing from the colonnettes
  put(3, 12, 18, "polished_diorite_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
  put(3, 12, 22, "polished_diorite_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });
  for (const z of [19, 20, 21]) put(3, 13, z, "polished_diorite");
}

// Centre west front (x4..10, z14..26): the main portal, the rose-window opening, the stepped great gable.
function centre(g) {
  plinth(g, [[4, 0, 14], [10, 2, 26]]);
  mass(g, [4, 3, 14, 10, 33, 26], [
    [4, 3, 18, 6, 13, 22],    // main portal (z 18..22, y 3..13 incl. its head)
    [4, 22, 16, 6, 30, 24],   // rose window disc
  ]);
  portal_arch(g, [4, 3, 20], "west", 2, 5, 9);
  rose(g, ROSE_CENTRE);
  wimperg(g);
  // great gable: x4..6, 45-degree, from y34 at z14 and z26 up to apex y41 at z20
  for (let z = 14; z <= 26; z++) mass(g, [4, 34, z, 6, 41 - Math.abs(z - 20), z]);
}

export function build(g) {
  tower(g, (z) => z, "north");
  tower(g, (z) => 40 - z, "south");
  centre(g);

  // the steps: slab x0 then full blocks x1..3 at y2, all across z14..26 (the church floor is y3)
  slab_ramp(g, [[0, 2, 14], [3, 2, 26]], { x: 0, z: 14, y: 2, dir: "east", width: 13, run: 3 });
  // lamp posts on the first full step at x1 (a post on the x0 bottom slab would hang over air), at z 14 and 26
  lamp_post(g, 1, 3, 14);
  lamp_post(g, 1, 3, 26);
}
