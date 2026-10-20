// Both plots' lights and grounds: porte-cochère canopies (plot 0 T-N / T-S), deck lights and planters on every roof
// and terrace, lit windows on the south and east faces of both towers, the west slab ramp on plot 0, and the shop-name
// plaques on the Breeze fascia. Everything writes only into air (earlier parts are locked), so the order is safe.
// Plot 0 coordinates are the site's (plot x0 = 0); plot 1 goes through onPlot1 on the same view.
// Decks: vocab's terraceDeck lays a bottom slab, and a glass_pane rail on it leaves half a block of air (fit flags it),
// so this part lays its own deck as full smooth_stone with the same 6x6 light grid (sea_lantern flush in the deck).
import { litWindows, canopyPier, planter, slabRamp, plaqueFascia } from "../vocab.mjs";
import { onPlot1 } from "../vocab/base.mjs";

export function build(g) {
  plotZero(g);
  plotOne(onPlot1(g));
}

// The Breeze fascia's banner letters are light_gray_wall_banner, which the palette lacks. The nearest palette block is
// light_gray_concrete (same dye, same cell, one cell proud), so this view writes that in every letter cell instead.
function letterBlocks(g) {
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => {
        if (/_wall_banner$/.test(block)) target.set(x, y, z, "light_gray_concrete");
        else target.set(x, y, z, block, state, nbt);
        return view;
      };
      const v = target[prop];
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return view;
}

// A roof terrace on the layer y (the roof's top + 1): smooth_stone deck, a glass_pane rail one high on the box's edges,
// and a sea_lantern flush in the deck every 6x6 (offset 3 from the box corner). Writes only into air.
// origin: the corner the 6x6 light grid counts from (the mass's corner, unless a part's own grid says otherwise).
function terrace(g, box, y, origin = box) {
  const put = (x, yy, z, block, state) => { if (g.isAir(x, yy, z)) g.set(x, yy, z, block, state); };
  const lit = (x, z) => (x - origin.x0) % 6 === 3 && (z - origin.z0) % 6 === 3;
  const edge = (x, z) => x === box.x0 || x === box.x1 || z === box.z0 || z === box.z1;
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
    put(x, y, z, lit(x, z) ? "sea_lantern" : "smooth_stone");
  }
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
    if (!edge(x, z)) continue;
    const side = (dx, dz) => (x + dx >= box.x0 && x + dx <= box.x1 && z + dz >= box.z0 && z + dz <= box.z1 && edge(x + dx, z + dz) ? "true" : "false");
    put(x, y + 1, z, "glass_pane", { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0) });
  }
}

// ---- plot 0: Taipei Nan Shan Plaza ------------------------------------------------------------------------------------
function plotZero(g) {
  // Porte-cochère canopies: 4 round quartz piers each under the T-N (z 0..5) and T-S (z 78..83) canopies, slab y11..12.
  for (const z of [2, 80]) {
    for (const x of [170, 175, 180, 185, 211, 214, 217, 220]) canopyPier(g, [x, 4, z], 7);
  }

  // Roof terraces and deck lights (deck layer = the roof's top + 1, as plan.md's deck heights).
  // P-A terraces: west strip x0..5 and south strip z72..83, deck y19.
  terrace(g, { x0: 0, x1: 5, z0: 16, z1: 83 }, 19);
  terrace(g, { x0: 6, x1: 101, z0: 72, z1: 83 }, 19);
  // P-B terraces: north strip z12..23 and east strip x84..101, deck y33.
  terrace(g, { x0: 6, x1: 101, z0: 12, z1: 23 }, 33);
  terrace(g, { x0: 84, x1: 101, z0: 24, z1: 71 }, 33);
  // P-C top roof, deck y46 (the mechanical box and the coping are already in place and skipped).
  terrace(g, { x0: 0, x1: 83, z0: 24, z1: 79 }, 46);
  // T-L lobby roof terrace y18: four strips round the shaft (the shaft footprint is open to the sky above y18).
  terrace(g, { x0: 156, x1: 239, z0: 6, z1: 11 }, 18);
  terrace(g, { x0: 156, x1: 239, z0: 72, z1: 77 }, 18);
  terrace(g, { x0: 156, x1: 165, z0: 12, z1: 71 }, 18);
  // The lobby's own grid (x 156 + 6k + 3, z 6 + 6k + 3) is the one plan.md's shell leaves air for the lights.
  terrace(g, { x0: 230, x1: 239, z0: 12, z1: 71 }, 18, { x0: 156, z0: 6 });

  // Planters on the terraces: 2x2 soil replacing the deck, azalea and oak leaves on top, every 8 along the edge.
  for (let z = 20; z <= 76; z += 8) planter(g, [1, 19, z], { over: ["smooth_stone"] });
  for (let z = 14; z <= 66; z += 8) planter(g, [85, 33, z], { over: ["smooth_stone"] });
  for (let x = 12; x <= 84; x += 12) planter(g, [x, 19, 75], { over: ["smooth_stone"] });

  // Lit windows on the Nan Shan shaft, boxed to the glass plane so each light sits one cell behind it: south and east
  // densest, north and west lighter.
  const shaft = { x0: 167, x1: 228, y0: 19, y1: 345, z0: 13, z1: 74 };
  litWindows(g, "south", 2, shaft, { seed: 11 });
  litWindows(g, "east", 2, shaft, { seed: 12 });
  litWindows(g, "north", 1, shaft, { seed: 13 });
  litWindows(g, "west", 1, shaft, { seed: 14 });

  // Shop names on the Breeze fascia (y8 band, banners at y7 as the helper expects), the south face (z83).
  plaqueFascia(letterBlocks(g), "BREEZE", [24, 7, 83], "south");
  plaqueFascia(letterBlocks(g), "NAN SHAN", [48, 7, 83], "south");

  // West-edge slab ramp: ground 1 up to the street floor 4 (walking layers 2 to 4), 3 wide, into the shop doors at x0.
  try {
    slabRamp(g, [11, 1, 60], [0, 3, 60], 3);
  } catch (e) {
    console.warn(`lights-grounds: west ramp not built: ${e.message}`);
  }
}

// ---- plot 1: Taipei Sky Tower -----------------------------------------------------------------------------------------
function plotOne(g) {
  // Rooftop garden on the Sky podium (slab y40, deck layer y41) on the footprint's full-width rows.
  terrace(g, { x0: 12, x1: 44, z0: 3, z1: 47 }, 41);
  terrace(g, { x0: 3, x1: 53, z0: 12, z1: 47 }, 41);
  // Waist-link terrace (roof y30, deck layer y31).
  terrace(g, { x0: 9, x1: 47, z0: 51, z1: 65 }, 31);
  for (let x = 6; x <= 48; x += 8) planter(g, [x, 41, 6], { over: ["smooth_stone"] });
  for (let x = 6; x <= 48; x += 8) planter(g, [x, 41, 44], { over: ["smooth_stone"] });

  // Lit windows on the tower shaft, boxed to the glass plane (plot-local x 1..55, z 66..121 at the outer ribs).
  const shaft = { x0: 1, x1: 54, y0: 15, y1: 343, z0: 66, z1: 120 };
  litWindows(g, "south", 2, shaft, { seed: 21 });
  litWindows(g, "east", 2, shaft, { seed: 22 });
  litWindows(g, "north", 1, shaft, { seed: 23 });
  const podium = { x0: 0, x1: 55, y0: 1, y1: 40, z0: 0, z1: 49 };
  litWindows(g, "south", 1, podium, { seed: 24 });
  litWindows(g, "east", 1, podium, { seed: 25 });
}
