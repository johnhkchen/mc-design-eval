// Part 5: windows and doors (glazier and joiner). Only the window sills are set here: the sills sit outside the wall
// face, on cells no earlier part built. The openings themselves are air the masonry shell placed, and runParts locks
// every cell an earlier part wrote (air included), so the panes, doors, mullions, pavilion infill and lunettes that
// belong in them are refused and are not written here. Glazing needs the shell to leave its openings unwritten.
const isAir = (g, x, y, z) => /air$/.test(g.blockAt(x, y, z));
const SILL = { type: "top", waterlogged: "false" };

export function build(g) {
  const refused = [];
  // put: write one block into air only; anything solid there is refused (and reported), never overwritten
  const put = (x, y, z, block, state) => {
    if (isAir(g, x, y, z)) g.set(x, y, z, block, state);
    else refused.push([x, y, z]);
  };

  // ---- land front: sills of the upper arched windows (4 wide under each bay, y14, one cell proud at z2)
  for (const x0 of [0, 40, 48, 56, 64, 72]) {
    for (let x = x0 + 2; x <= x0 + 5; x++) put(x, 14, 2, "smooth_quartz_slab", SILL);
  }

  // ---- bay side (z 78): sills of the tall arched windows on the wing bays (y3, one cell proud at z79)
  for (const x0 of [0, 40, 48, 56]) {
    for (let x = x0 + 2; x <= x0 + 5; x++) put(x, 3, 79, "smooth_quartz_slab", SILL);
  }

  if (refused.length) console.log(`fittings: ${refused.length} cells already built, left as they are`);
}
