// Front facade (P4, plan.md PARTS 4): the bay's corbels, cornice brackets and crown, the bay cap, the false-front parapet
// with coping, the pediment, the east pilaster, the porch columns and arch spring, and the window hoods and sills on the
// street face. Only cornice and trim pieces here; the shell's walls, bands and floors and the openings' glass and
// doors belong to other parts. Everything writes into air only.
import {
  corbel, bracket, corniceRun, parapet, pediment, hood, sill,
  SMOOTH_QUARTZ, SMOOTH_QUARTZ_SLAB, QUARTZ_PILLAR, WARPED_PLANKS,
} from "../vocab.mjs";

export function build(g) {
  // ---- bay corbels carrying the bay (y3, proud at z5 and the diagonals at z6) ----------------------------------------
  for (let x = 2; x <= 5; x++) corbel(g, x, 3, 5);
  corbel(g, 1, 3, 6);
  corbel(g, 6, 3, 6);

  // ---- cornice brackets (y16) in front of the frieze -----------------------------------------------------------------
  for (const x of [7, 9, 11, 13]) bracket(g, x, 16, 6);
  bracket(g, 2, 16, 4);
  bracket(g, 5, 16, 4);

  // ---- cornice (y17): solid cream one cell proud, the crown stairs one cell further out --------------------------------
  // The false front's teal backing sits behind the cornice on z7 (y17), so the cream run has something to bear on.
  g.fill([1, 17, 7], [14, 17, 7], WARPED_PLANKS);
  corniceRun(g, 7, 14, 17, 6, 5);
  // over the bay: solid z5 x1..6 with the crown on z4, and the two diagonal cells at (1,17,6), (6,17,6)
  corniceRun(g, 1, 6, 17, 5, 4);
  g.set(1, 17, 6, SMOOTH_QUARTZ);
  g.set(6, 17, 6, SMOOTH_QUARTZ);

  // ---- false-front parapet (y18) with its coping (y19) -----------------------------------------------------------------
  parapet(g, 1, 14, 18, 7, [1, 5, 10, 14], [[1, 4], [11, 14]]);

  // ---- pediment with keystone (y19..20) ----------------------------------------------------------------------------------
  pediment(g);

  // ---- east corner pilaster on the street face (x14, z6, proud one cell) -------------------------------------------------
  // y4..5 are already built by earlier parts (the sea-green base and its cream slab), so the shaft starts at y6.
  for (let y = 6; y <= 15; y++) g.set(14, y, 6, QUARTZ_PILLAR, { axis: "y" });

  // ---- bay window hoods (y8 and y12, front of the bay lights) and bay sills ------------------------------------------------
  hood(g, 3, 4, 8, 4);
  hood(g, 3, 4, 12, 4);
  sill(g, 3, 4, 5, 4);                            // main bay sill, proud at z4
  sill(g, 3, 4, 9, 4);                            // 2nd floor bay sill
  sill(g, 3, 4, 13, 4);                           // top room bay sill
  sill(g, 1, 1, 5, 5);                            // diagonal lights, proud at z5
  sill(g, 6, 6, 5, 5);
  sill(g, 1, 1, 9, 5);
  sill(g, 6, 6, 9, 5);
  sill(g, 1, 1, 13, 5);
  sill(g, 6, 6, 13, 5);

  // ---- street-face window hoods and sills (z6, proud of the wall at z7) ----------------------------------------------------
  sill(g, 8, 8, 5, 6);                            // parlour side light
  hood(g, 9, 9, 12, 6, true);                     // 2nd floor, over the x9 window
  hood(g, 12, 12, 12, 6, true);                   // 2nd floor, over the x12 window
  sill(g, 9, 9, 9, 6);
  sill(g, 12, 12, 9, 6);
  hood(g, 9, 9, 15, 6);                           // top floor
  hood(g, 12, 12, 15, 6);
  sill(g, 9, 9, 13, 6);
  sill(g, 12, 12, 13, 6);

  // ---- porch columns (x10, x13, z7 y5..7) and the arch spring (x11..12, y7, z7) are NOT written here: shell.mjs carves
  // the porch mouth to air, and runParts locks those cells against this part. Restore as column(g, 10, 5, 7, 7),
  // column(g, 13, 5, 7, 7), archSpring(g, 11, 12, 7, 7) once the shell's porch-mouth carve is dropped.
}
