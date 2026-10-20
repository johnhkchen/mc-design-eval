// Lights and grounds (P6): lit office windows on the built strips, floodlights at the foot of the crown and the stage
// house walls, the paved courts and light well with kerbs, and lamp stubs along the streets.
// Runs last, so every strip, deck and sidewalk course the earlier parts laid is already in the grid. Everything here
// writes into air (lamps, floodlights, lit backing) or re-surfaces the ground course (kerbs, paved courts).
import { floodlight, sidewalk, lamp_stub, PLOT1_RAISED_FROM, PLOT2_RAISED_FROM, PLOT1 } from "../vocab.mjs";

const GLASS_STRIP = /(^|:)gray_stained_glass$/;
const GLASS = /(^|:)(gray_stained_glass|glass)$/;
const AIR = /(^|:)air$/;
const LIT_CHANCE = 0.08;   // a cluster starts on about 1 cell in 12; clusters average 4 cells, so about 25% of strip glass
const OUTWARD = { west: [-1, 0, 0], east: [1, 0, 0], north: [0, 0, -1], south: [0, 0, 1] };

// Light a share of one strip face. face: the way the wall looks out. planes: candidate coordinates of the glass
// plane (the one with most strip glass wins). along: [lo, hi] along the face. [ylo, yhi]: rows.
// The strip is recessed one behind the face plane, so the cell in front of each glass cell is air (the shell leaves
// it open) and the cell behind is solid limestone: the lit backing goes in front, a shroomlight in the recess.
function litFace(g, rand, face, planes, along, [ylo, yhi]) {
  const alongX = face === "north" || face === "south";
  const cell = (plane, s, y) => (alongX ? [s, y, plane] : [plane, y, s]);
  const [ox, , oz] = OUTWARD[face];
  let plane = null, best = 0;
  for (const c of planes) {
    let n = 0;
    for (let y = ylo; y <= yhi; y++) for (let s = along[0]; s <= along[1]; s++) {
      if (GLASS_STRIP.test(g.blockAt(...cell(c, s, y)))) n++;
    }
    if (n > best) { best = n; plane = c; }
  }
  if (plane == null) return 0;
  let lit = 0;
  for (let y = ylo; y <= yhi; y++) {
    const isGlass = (s) => GLASS.test(g.blockAt(...cell(plane, s, y)));
    const frontFree = (s) => { const [x, yy, z] = cell(plane, s, y); return AIR.test(g.blockAt(x + ox, yy, z + oz) ?? "air"); };
    let s = along[0];
    while (s <= along[1]) {
      if (isGlass(s) && rand() < LIT_CHANCE) {
        let run = 0;
        while (s + run <= along[1] && run < 6 && isGlass(s + run) && frontFree(s + run)) run++;
        if (run >= 2) {
          const n = 2 + Math.floor(rand() * (run - 1));   // 2..run
          for (let i = 0; i < n; i++) {
            const [x, yy, z] = cell(plane, s + i, y);
            g.set(x + ox, yy, z + oz, "shroomlight");
            lit++;
          }
          s += n + 1;
          continue;
        }
      }
      s++;
    }
  }
  return lit;
}

// Walking level on a site cell: plot 1 east of PLOT1_RAISED_FROM and plot 2 east of PLOT2_RAISED_FROM stand on ground 1.
function walkY(x) {
  const raised = (x >= PLOT1_RAISED_FROM && x <= PLOT1.x1) || x >= PLOT2_RAISED_FROM;
  return raised ? 2 : 1;
}

export function build(g) {
  // Lit office windows are NOT placed yet: the tower shell has written air into every recess cell in front of the strip
  // glass and solid limestone behind it, so runParts refuses any lamp there (254 refusals). They need the shell to leave
  // the lit-backing cell unwritten (plan RESERVED). litFace() below is ready for that. Its calls, once it can place:
  //   plot 0: west planes 2..5, z 10..45, y 11..99; south planes 46..49, x 6..27, y 11..97; north planes 4..9, x 6..27,
  //           y 11..95; east planes 26..29, z 10..45, y 11..99
  //   plot 2: south planes 44..51, x 107..150, y 8..60; north planes 1..10, x 107..150, y 8..50; east planes 146..150,
  //           z 10..45, y 12..60

  // ---- floodlights: standing sea lanterns on the deck at the foot of each higher wall ----
  // plot 0 crown (deck 103, the crown wall x6..23 z14..39)
  floodlight(g, { deckY: 103, axis: "x", at: 13, from: 6, to: 23, every: 4 });
  floodlight(g, { deckY: 103, axis: "x", at: 40, from: 6, to: 23, every: 4 });
  floodlight(g, { deckY: 103, axis: "z", at: 5, from: 14, to: 39, every: 4 });
  floodlight(g, { deckY: 103, axis: "z", at: 24, from: 14, to: 39, every: 4 });
  // plot 1 stage house (H-D x88..97 z16..39, deck 31 under it)
  floodlight(g, { deckY: 31, axis: "x", at: 15, from: 88, to: 97, every: 3 });
  // plot 2 east crown (E-H x145..150 z14..43, tower deck 62)
  floodlight(g, { deckY: 62, axis: "x", at: 13, from: 145, to: 150, every: 2 });
  floodlight(g, { deckY: 62, axis: "x", at: 44, from: 145, to: 150, every: 2 });
  floodlight(g, { deckY: 62, axis: "z", at: 144, from: 14, to: 43, every: 4 });

  // ---- grounds: paved courts and light well with a kerb on the outer ring, and the alley ----
  sidewalk(g, [0, 50, 33, 53], { y: 0, replace: true });       // plot 0 50th St sidewalk under the marquee
  sidewalk(g, [30, 20, 33, 53], { y: 0, replace: true });      // plot 0 service court, east side
  sidewalk(g, [38, 24, 39, 54], { y: 0, replace: true });      // plot 1 alley
  sidewalk(g, [117, 38, 126, 39], { y: 0, replace: true });    // plot 2 light well (on the ground course)

  // ---- lamp stubs: one every 8 along the kerb, on walking level; never on a door, a shop or a court ----
  for (let z = 4; z <= 52; z += 8) lamp_stub(g, 0, z, { y: 1 });            // Sixth Ave kerb, plot 0
  for (const x of [8, 16, 24]) lamp_stub(g, x, 53, { y: 1 });              // 50th St under the plot 0 marquee
  for (const x of [44, 52, 60, 68, 76, 84, 96]) lamp_stub(g, x, 53, { y: walkY(x) });  // 50th St, plot 1
  // No plot 2 lamps on 50th St: the east shell carves the shopfront storey at z53 (x107..154, y2..5) as shop interior,
  // so every walking cell on that row is a shop, and the lamps there were refused. Plot 2's kerb has no room for a stub.
}
