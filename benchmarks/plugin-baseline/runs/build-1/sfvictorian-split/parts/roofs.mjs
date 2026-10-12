// P3 roof deck and rooflines (plan.md PARTS 3; elements 9 courses, 10, 18, 19). The shell (P1) already holds the party walls
// to y18 and the gravel deck at y17, so this part adds the bay lid, the cornice courses, the front false-front parapet with
// coping and pediment, finials, the rear parapet and cornice, the chimney stack and the skylight curb. Writes go only into
// air: the party-wall parapets are brick already, and the skylight stays open for P4's glass.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE, BODY, TRIM, BRICK, BRICK_FAMILY, STONE_FAMILY, cornice, pediment, finial } from "../vocab.mjs";

const span = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export function build(g) {
  const air = (x, y, z) => /air$/.test(g.blockAt(x, y, z));
  const put = (x, y, z, block, state) => { if (air(x, y, z)) g.set(x, y, z, block, state); };

  // bay lid: a flat stone deck over the three bay rows at y17, under the bay's wrapping cornice (plan ROOFS)
  for (const [z, x0, x1] of [[4, 3, 6], [5, 2, 7], [6, 1, 8]]) {
    for (const x of span(x0, x1)) put(x, SITE.deckY, z, ...B.slab("stone", "bottom"));
  }

  // cornice courses at y17 (elements 9): the main line at z6 with a corner at x0 and the bay ring with its returns
  cornice(g, [
    { x: 0, z: 6, corner: true },
    ...span(9, 15).map((x) => ({ x, z: 6 })),
    { x: 2, z: 3, corner: true },
    ...span(3, 6).map((x) => ({ x, z: 3 })),
    { x: 7, z: 3, corner: true },
    { x: 1, z: 4, facing: "east" },
    { x: 8, z: 4, facing: "west" },
    { x: 0, z: 5, facing: "east" },
    { x: 9, z: 5, facing: "west" },
  ]);

  // false-front parapet at y18 over x1..14 (the party-wall ends are brick already), cream coping on top at y19
  for (const x of span(1, 14)) put(x, SITE.parapetY, SITE.frontZ, BODY);
  for (const x of span(1, 14)) {
    if (x >= SITE.pediment.x0 && x <= SITE.pediment.x1) continue;
    put(x, SITE.pediment.y, SITE.frontZ, ...B.slab(TRIM, "bottom"));
  }

  // centre pediment (x6..9, y19) and the ball finials on the parapet corners
  pediment(g);
  finial(g, SITE.partyW);
  finial(g, SITE.partyE);

  // rear parapet at y18 over the rear wall, with a plain one-proud cream cornice at y17 on z31
  for (const x of span(1, 14)) put(x, SITE.parapetY, SITE.rearZ, BODY);
  cornice(g, span(1, 14).map((x) => ({ x, z: SITE.rearZ + 1, facing: "north" })));

  // chimney stack on the west party wall: bricks x0..2 z12..13 at y18..19, stone cap at y20, two flue pots at y21
  const c = SITE.chimney;
  for (const x of span(c.x0, c.x1)) for (const z of span(c.z0, c.z1)) for (const y of span(c.y0, c.y1)) put(x, y, z, BRICK);
  for (const x of span(c.x0, c.x1)) for (const z of span(c.z0, c.z1)) put(x, c.capY, z, ...B.slab(STONE_FAMILY, "top"));
  put(1, c.capY + 1, 12, ...B.wall(BRICK_FAMILY));
  put(1, c.capY + 1, 13, ...B.wall(BRICK_FAMILY));

  // skylight curb: a ring of cream bottom slabs at y18 around the deck opening (the glass is P4's)
  const s = SITE.skylight;
  for (const x of span(s.x0 - 1, s.x1 + 1)) for (const z of span(s.z0 - 1, s.z1 + 1)) {
    const inside = x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1;
    if (!inside) put(x, s.y + 1, z, ...B.slab(TRIM, "bottom"));
  }
}
