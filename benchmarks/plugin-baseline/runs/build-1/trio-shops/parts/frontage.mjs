// Part 5: frontage. The street face of the three houses above the shopfronts: piers on the wall lines, the sandstone
// string course and cornice, the flats' windows with sills and lintels, the Juliet balcony, the lobby doors, the
// shop signs (banner letters on the fascia, awning, hanging sign), and a product stand on each shop pier.
// Everything goes into air only (runParts refuses the rest), so the shopfront clear strip (z 6..7, y 2..4) stays empty.
import { pier, window_bay, lobby_door, awning, product_panel, shop_name, hanging_shop_sign, juliet_balcony, cornice_run } from "../vocab.mjs";
import { CUT_SANDSTONE } from "../vocab.mjs";

// per house: a = low-x wall (window bays are symmetric about a+6), s0 = shop's low-x edge, x0..x1 = the house's width,
// door = lobby front door, shopPier = the shop/lobby pier that carries the product stand (the lamp posts stand on the
// other piers at x 13 and 25, so the product goes on the shop/lobby pier)
const HOUSES = [
  { name: "H1", a: 25, s0: 25, x0: 25, x1: 37, door: 35, shopPier: 33, piers: [[25, 5], [33, 5], [37, 1]],
    word: "BOOKS", colour: "blue", awningMat: "dark_prismarine", product: "bookshelf", height: 3 },
  { name: "H2", a: 13, s0: 13, x0: 13, x1: 25, door: 23, shopPier: 21, piers: [[13, 5], [21, 5], [25, 5]],
    word: "FLORA", colour: "green", awningMat: "waxed_oxidized_cut_copper", product: "potted_azalea_bush", height: 1 },
  { name: "H3", a: 1, s0: 5, x0: 1, x1: 13, door: 3, shopPier: 5, piers: [[1, 1], [5, 5], [13, 5]],
    word: "TOOLS", colour: "red", awningMat: "red_nether_brick", product: "anvil", height: 1 },
];

// a pedestal of cut sandstone from the kerb up to y 4 under a product, at (x, z 5); only into air
function pedestal(g, x, z = 5) {
  for (let y = 2; y <= 4; y++) if (g.isAir(x, y, z)) g.set(x, y, z, CUT_SANDSTONE);
}

export function build(g) {
  for (const h of HOUSES) {
    // piers on the wall lines: end piers full height, party and shop piers from the bracket at y 5
    for (const [x, y0] of h.piers) pier(g, x, y0, 17, { bracket: y0 === 5 });

    // the flats: three windows per storey, glass one cell in (z 8), sills below, lintels above
    const a = h.a;
    window_bay(g, a + 2, a + 3, 10, 11, 7, 1);
    window_bay(g, a + 9, a + 10, 10, 11, 7, 1);
    window_bay(g, a + 5, a + 7, 9, 11, 7, 1);
    window_bay(g, a + 2, a + 3, 15, 16, 7, 1);
    window_bay(g, a + 5, a + 7, 15, 16, 7, 1);
    window_bay(g, a + 9, a + 10, 15, 16, 7, 1);
    window_bay(g, a + 5, a + 7, 21, 22, 7, 1); // attic: the roof may already fill the gable; skipped cells are reported

    // the Juliet balcony on the centre French window (skips the pier cells on the shop side)
    juliet_balcony(g, a);

    // string course over the fascia and lobby at y 8, main cornice at y 18 with dentils at y 17
    cornice_run(g, 8, h.x0, h.x1);
    cornice_run(g, 18, h.x0, h.x1, { dentils: true });

    // lobby front door bay
    lobby_door(g, h.door);

    // the shop: awning, name in banner letters, hanging sign mid-shop, product stand on the shop pier
    awning(g, h.s0, h.awningMat);
    shop_name(g, h.s0, h.word, h.colour);
    hanging_shop_sign(g, h.s0 + 4, h.word);
    pedestal(g, h.shopPier);
    product_panel(g, h.shopPier, h.product, { y0: 5, y1: h.height === 3 ? 7 : 5 });
  }
}
