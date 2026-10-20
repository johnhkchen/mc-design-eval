// NMAH shell and facade (plan.md plot 1): a hollow pink-beige box on a smooth stone plinth, panel-and-slot walls on all
// four faces (the south front recessed under its overhang), the cornice band, a flat roof deck with the atrium opening,
// the clerestory penthouse with its skylight, and the north loading strip and terraces. Openings stay air for later parts.
import { carve, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { corniceBand, penthouse, glassFront } from "../vocab.mjs";

// plan.md: main box walls x122..182 z2..26 (rows y1..8), plinth y0 over x121..183 z1..27.
const X0 = 122, X1 = 182, Z0 = 2, Z1 = 26;
const ATRIUM = { x0: 146, x1: 158, z0: 11, z1: 17 };
const RECESS = { x0: 142, x1: 162 };          // south entrance recess (glass at z24, air at z25..26 for y1..5)
const DOORS = { x0: 150, x1: 154 };           // north doors (z2) and south doors (glass front), y1..2

export function build(g) {
  // Plinth course, the terrace edge.
  g.fill([121, 0, 1], [183, 0, 27], "smooth_stone");

  // Main box: solid walls, then the hollow interior carved out, then the roof deck over it.
  g.fill([X0, 1, Z0], [X1, 8, Z1], "white_terracotta");
  carve(g, [X0 + 1, 1, Z0 + 1], [X1 - 1, 8, Z1 - 1]);
  g.fill([X0, 9, Z0], [X1, 9, Z1], "smooth_stone");
  carve(g, [ATRIUM.x0, 9, ATRIUM.z0], [ATRIUM.x1, 9, ATRIUM.z1]);   // atrium open from the ground to the skylight

  // Openings in the shell: north doors, west doors, the south recess (y1..6 open to the glass and soffit).
  carve(g, [DOORS.x0, 1, Z0], [DOORS.x1, 2, Z0]);
  carve(g, [X0, 1, 15], [X0, 2, 17]);
  carve(g, [RECESS.x0, 1, Z1], [RECESS.x1, 5, Z1]);
  carve(g, [RECESS.x0, 1, Z1 - 1], [RECESS.x1, 5, Z1 - 1]);
  carve(g, [RECESS.x0, 6, Z1], [RECESS.x1, 6, Z1]);     // soffit row y6 is laid by glassFront below

  // Panel-and-slot faces. A slot is air in the face (y1..7) with a gray pane one cell inside and, on every other
  // slot, an ochre froglight two cells inside at y4.
  // inX/inZ: the step from the face into the building; light: the froglight's step from the face.
  const slot = (x, z, inX, inZ, idx) => {
    for (let y = 1; y <= 7; y++) {
      g.set(x, y, z, "air");
      g.set(x + inX, y, z + inZ, "gray_stained_glass_pane");
    }
    if (idx % 2 === 0) g.set(x + 2 * inX, 1, z + 2 * inZ, "ochre_froglight");
  };
  // West (x = X0) and east (x = X1) faces: slots at z 6, 10, 14, 18, 22 (centre z 14).
  [6, 10, 14, 18, 22].forEach((z, i) => {
    slot(X0, z, 1, 0, i);
    slot(X1, z, -1, 0, i + 1);
  });
  // South face (z = Z1): slots on the 152 rhythm, not inside the recess.
  let si = 0;
  for (let x = 128; x <= 176; x += 4) {
    if (x >= RECESS.x0 - 1 && x <= RECESS.x1 + 1) continue;
    slot(x, Z1, 0, -1, si++);
  }
  // North face (z = Z0): the same rhythm; the doors are already carved above.
  let ni = 0;
  for (let x = 128; x <= 176; x += 4) {
    if (x >= DOORS.x0 && x <= DOORS.x1) continue;
    slot(x, Z0, 0, 1, ni++);
  }

  // South entrance: recessed glass, mullions, doors left as air, the soffit at y6 and its froglights.
  glassFront(g, RECESS.x0, RECESS.x1, 24, {});

  // Cornice band (y8 slab underside, y9 terracotta), projecting one cell over the walls.
  corniceBand(g, { x0: X0, x1: X1, z0: Z0, z1: Z1 }, 8);

  // Clerestory penthouse on the deck, with the skylight over the atrium.
  penthouse(g, { x0: 140, x1: 164, z0: 8, z1: 20, y: 10, height: 2, skylight: [ATRIUM.x0, ATRIUM.x1, ATRIUM.z0, ATRIUM.z1] });

  // Atrium light: froglights along its floor edge, glowing up through the skylight.
  for (const x of [ATRIUM.x0, 150, 154, ATRIUM.x1]) {
    g.set(x, 1, ATRIUM.z0, "ochre_froglight");
    g.set(x, 1, ATRIUM.z1, "ochre_froglight");
  }
  g.set(ATRIUM.x0, 1, 14, "ochre_froglight");
  g.set(ATRIUM.x1, 1, 14, "ochre_froglight");

  // North loading strip: a thin low wall at z0, flat top y5.
  g.fill([165, 0, 0], [183, 4, 0], "smooth_stone");
  g.fill([165, 5, 0], [183, 5, 0], "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Terraces: the south step (z28) and the west entrance slab.
  g.fill([121, 0, 28], [162, 0, 28], "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  g.fill([119, 0, 15], [120, 0, 18], "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}
