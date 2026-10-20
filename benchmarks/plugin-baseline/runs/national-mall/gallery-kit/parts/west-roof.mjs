// Part 2, West roofs, porticos, dome (plan.md PARTS 2): the flat decks and skylights of the spine, pavilions and central
// block, the two Ionic porticos (columns, architrave, cornice, steps, pediments), the drum, the stepped copper dome and
// the oculus lantern. The porticos' temple roofs come from roof.json, which runParts lays right after the shell.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { slabSteps, pediment, domeRing, oculusLantern, skylightStrip, groundAt } from "../vocab.mjs";

// One block into the cell if it is in bounds and air. Returns 1 if written, else 0 (nothing earlier is overwritten).
function put(g, x, y, z, entry) {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return 0;
  const [block, state] = typeof entry === "string" ? [entry] : entry;
  g.set(x, y, z, block, state);
  return 1;
}

// Half-widths of the filled circle rows, by distance dz from the centre row (plan.md circle rows; as h2.mjs).
const CIRCLE = {
  8: [8, 8, 8, 7, 7, 6, 5, 4, 2],
  7: [7, 7, 7, 6, 6, 5, 4, 2],
  6: [6, 6, 6, 5, 4, 3, 2],
};

// Is (x, z) inside the filled circle of radius r about (cx, cz)?
const inDisc = (cx, cz, r, x, z) => {
  const rows = CIRCLE[r];
  return Math.abs(z - cz) < rows.length && Math.abs(x - cx) <= rows[Math.abs(z - cz)];
};

// Every cell of the box x0..x1 by z0..z1 for which keep(x, z) holds.
function eachCell([x0, z0, x1, z1], keep, fn) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (keep(x, z)) fn(x, z);
}

const DRUM = { x: 50, z: 19 };
const inDrum = (x, z) => inDisc(DRUM.x, DRUM.z, 7, x, z);
const inHole = (x, z) => inDisc(DRUM.x, DRUM.z, 6, x, z);
const inDrumRing = (x, z) => inDrum(x, z) && !inHole(x, z);

// One Ionic column at (x, z), y 4..10: a full smooth_quartz base (the shaft must not stand on a bottom slab), a quartz
// shaft y 5..9 and a top-slab capital at y 10, so the architrave at y 11 sits on it flush.
function ionicColumn(g, x, z) {
  put(g, x, 4, z, "smooth_quartz");
  for (let y = 5; y <= 9; y++) put(g, x, y, z, B.pillar("quartz_pillar", "y"));
  put(g, x, 10, z, B.slab("smooth_quartz", "top"));
}

// Ionic porticos (plan W6): eight columns on the front row, return columns at the ends, architrave and cornice, both
// fronts. The pediment (W7) is the gable over each front; the temple roof from roof.json is the roof behind it.
function portico(g, front, zFront, zReturn, zGable) {
  const cols = [43, 45, 47, 49, 51, 53, 55, 57];
  for (const x of cols) ionicColumn(g, x, zFront);
  for (const x of [43, 57]) ionicColumn(g, x, zReturn);
  const inward = front === "north" ? "south" : "north";
  for (let x = 42; x <= 58; x++) {
    put(g, x, 11, zFront, "smooth_quartz");
    put(g, x, 12, zFront, B.stairs("smooth_quartz", inward, "top"));
  }
  pediment(g, front, 42, 58, zGable, 13);
}

// Half-step footing: solid polished granite from the ground up to just under each step, so no step floats.
function footSteps(g, rows) {
  for (const { x0, x1, z, y } of rows) {
    for (let x = x0; x <= x1; x++) {
      const ground = groundAt(x, z) ?? 0;
      for (let fy = ground + 1; fy < y; fy++) put(g, x, fy, z, "polished_granite");
    }
  }
}

// Ring of cells just outside the drum (r 7 .. 8) at layer y: upside-down quartz stairs, lip out, backs on the dome.
function cornice(g, y) {
  eachCell([DRUM.x - 9, DRUM.z - 9, DRUM.x + 9, DRUM.z + 9],
    (x, z) => inDisc(DRUM.x, DRUM.z, 8, x, z) && !inDrum(x, z), (x, z) => {
      const sides = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
      const back = sides.find(([ox, oz]) => inDrum(x + ox, z + oz));
      if (back) put(g, x, y, z, B.stairs("smooth_quartz", back[2], "top"));
    });
}

export function build(g) {
  // ---- decks -----------------------------------------------------------------------------------------------------------
  // The skylight strips first (their cells are glass at y 13), then the bottom-slab deck over the rest of the spine and
  // pavilion interiors. The central block is left to its own deck at y 16 (the rotunda is open below).
  skylightStrip(g, 2, 39, 13, 15);
  skylightStrip(g, 2, 39, 24, 26);
  skylightStrip(g, 61, 98, 13, 15);
  skylightStrip(g, 61, 98, 24, 26);
  skylightStrip(g, 11, 25, 3, 5);
  skylightStrip(g, 11, 25, 34, 36);
  skylightStrip(g, 75, 89, 3, 5);
  skylightStrip(g, 75, 89, 34, 36);

  const deck = (x, z) => put(g, x, 13, z, B.slab("smooth_stone", "bottom"));
  eachCell([2, 10, 98, 29], (x, z) => x < 40 || x > 60, deck);       // spine interior, outside the central block
  eachCell([10, 2, 26, 37], () => true, deck);                      // west pavilion interior
  eachCell([74, 2, 90, 37], () => true, deck);                      // east pavilion interior

  // Central block: bottom-slab deck at y 16 over the interior, outside the drum ring (the rotunda stays open inside r 6).
  eachCell([41, 10, 59, 29], (x, z) => !inDrum(x, z), (x, z) => put(g, x, 16, z, B.slab("smooth_stone", "bottom")));

  // ---- porticos ---------------------------------------------------------------------------------------------------------
  portico(g, "north", 4, 6, 3);
  portico(g, "south", 35, 33, 36);

  // Wide steps, both fronts (OPENINGS). Footing first, so every step has solid support under it.
  const stepsN = [
    { x0: 41, x1: 59, z: 2, y: 3, kind: "slab" },
    { x0: 41, x1: 59, z: 1, y: 2, kind: "block" },
    { x0: 41, x1: 59, z: 0, y: 2, kind: "slab" },
  ];
  const stepsS = [
    { x0: 41, x1: 59, z: 37, y: 3, kind: "block" },
    { x0: 41, x1: 59, z: 38, y: 3, kind: "slab" },
    { x0: 41, x1: 59, z: 39, y: 2, kind: "slab" },
  ];
  footSteps(g, [...stepsN, ...stepsS]);
  slabSteps(g, stepsN);
  slabSteps(g, stepsS);

  // ---- drum, cornice and dome -------------------------------------------------------------------------------------------
  // Drum: a ring of white marble (r 6..7) from the central roof up; calcite at its top course (y 20).
  eachCell([DRUM.x - 8, DRUM.z - 8, DRUM.x + 8, DRUM.z + 8], inDrumRing, (x, z) => {
    for (let y = 16; y <= 19; y++) put(g, x, y, z, "white_terracotta");
    put(g, x, 20, z, "calcite");
  });
  cornice(g, 21);

  // Stepped dome: r 7 at y 21 (copper stairs round the edge), then solid copper discs r 6, 5, 4 at y 22..24.
  domeRing(g, DRUM.x, DRUM.z, 7, 21, "weathered_cut_copper", { edge: true });
  domeRing(g, DRUM.x, DRUM.z, 6, 22, "weathered_cut_copper");
  domeRing(g, DRUM.x, DRUM.z, 5, 23, "weathered_cut_copper");
  domeRing(g, DRUM.x, DRUM.z, 4, 24, "weathered_cut_copper");
  oculusLantern(g, DRUM.x, DRUM.z, 25);
}
