// Armory roof dressing (owner's comment), laid after every part on the finished roof: the roof tool's parapet is the
// wall's top course carried up (bricks), so its lower course is turned back to calcite to leave one brick band under
// the quartz coping; the bare smooth_stone deck becomes a lighter polished_diorite field with grey seams every 8; and a
// few planter boxes (azaleas, a lantern each) and rooftop vents/plant units stand on the deck, clear of the monitors.
const AX0 = 0, AX1 = 123, AZ0 = 4, AZ1 = 143, DECK = 28;
const SLAB = { type: "bottom", waterlogged: "false" };
const is = (g, x, y, z, name) => g.blockAt(x, y, z) === `minecraft:${name}`;
const inMonitor = (x, z) => [[28, 39], [68, 79]].some(([a, b]) => x >= a - 1 && x <= b + 1) && z >= 43 && z <= 124;

function deckFree(g, x0, z0, x1, z1) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (inMonitor(x, z) || !is(g, x, DECK, z, "smooth_stone_slab") && !is(g, x, DECK, z, "polished_diorite_slab")) return false;
    if (!g.isAir(x, DECK + 1, z)) return false;
  }
  return true;
}

// planter: spruce_planks rim with a spruce_slab lip, grass soil, azaleas, and a lantern on the soil at one end
function planter(g, x0, z0, x1, z1) {
  if (!deckFree(g, x0, z0, x1, z1)) return false;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const rim = x === x0 || x === x1 || z === z0 || z === z1;
    g.set(x, DECK, z, rim ? "spruce_planks" : "grass_block");
    if (rim) g.set(x, DECK + 1, z, "spruce_slab", SLAB);
    else g.set(x, DECK + 1, z, (x + z) % 3 === 0 ? "flowering_azalea" : (x + z) % 3 === 1 ? "azalea" : "short_grass");
  }
  g.set(x0 + 1, DECK + 1, z0 + 1, "lantern", { hanging: "false", waterlogged: "false" });
  return true;
}

// rooftop plant unit: a light_gray_concrete box 3x2, 2 high, with an iron_trapdoor grille on top and a pipe vent beside
function vent(g, x0, z0) {
  if (!deckFree(g, x0, z0, x0 + 3, z0 + 1)) return false;
  for (let x = x0; x <= x0 + 2; x++) for (let z = z0; z <= z0 + 1; z++) {
    g.set(x, DECK, z, "light_gray_concrete");
    g.set(x, DECK + 1, z, "light_gray_concrete");
    g.set(x, DECK + 2, z, "iron_trapdoor", { facing: "north", half: "bottom", open: "false", powered: "false", waterlogged: "false" });
  }
  g.set(x0 + 3, DECK, z0, "polished_andesite");
  g.set(x0 + 3, DECK + 1, z0, "andesite_wall", { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" });
  g.set(x0 + 3, DECK + 2, z0, "polished_andesite_slab", SLAB);
  return true;
}

export function build(g) {
  let parapet = 0, deck = 0, planters = 0, vents = 0;
  for (let x = AX0; x <= AX1; x++) for (let z = AZ0; z <= AZ1; z++) {
    if (is(g, x, DECK, z, "bricks") && is(g, x, DECK + 1, z, "bricks")) { g.set(x, DECK, z, "calcite"); parapet++; }
    if (is(g, x, DECK, z, "smooth_stone_slab")) {
      const seam = x % 8 === 0 || z % 8 === 0;
      if (!seam) { g.set(x, DECK, z, "polished_diorite_slab", SLAB); deck++; }
    }
  }
  const P = [[8, 10, 13, 12], [44, 10, 49, 12], [58, 22, 63, 24], [88, 10, 93, 12], [46, 50, 51, 52], [54, 80, 59, 82],
    [46, 112, 51, 114], [10, 60, 12, 66], [10, 100, 12, 106], [93, 70, 95, 76], [93, 110, 95, 116], [20, 136, 25, 138], [96, 136, 101, 138]];
  for (const p of P) if (planter(g, ...p)) planters++;
  const V = [[22, 22], [74, 18], [84, 26], [55, 64], [55, 98], [14, 84], [92, 92], [60, 134]];
  for (const v of V) if (vent(g, ...v)) vents++;
  console.log(`roof dressing: parapet ${parapet} calcite, deck ${deck} light cells, ${planters} planters, ${vents} vents`);
}
