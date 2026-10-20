// Part 5, roofs, gardens and lighting (plan.md ROOFS table; elements 2, 3, 15, 18, 20, 21, 23). The shell left the
// garden and ledge tops (22 and 26) AIR at the deck y, with the edge parapets and copings in place; this part plants
// those open cells, lays the roof gardens, lights every smooth_stone deck, and puts vents on the A roof.
import { roof_garden, lamp_post } from "../vocab.mjs";

// kit x/z extent of each plot (plot 1 and 2 offsets: x 88 and 146)
const SITE = [[0, 83, 0, 54], [88, 141, 0, 18], [146, 199, 0, 18]];

// smooth_stone decks the shell builds (plan.md ROOFS): T1 141, PH 147, T2-T4, A 6, B/B' 35, IN/IS 28, W 33, W2 36, plot PH 30
const DECK_Y = [141, 147, 131, 104, 58, 35, 6, 28, 33, 36, 30];

// roof gardens on the open 26 tops, kit [x0, z0, x1, z1] (each stays on its supported setback cells)
const GARDENS = [
  [62, 2, 81, 17],                     // GN, International Building North
  [62, 38, 81, 43],                    // GS, Palazzo d'Italia (its x 58..61 strips are too narrow for a garden: gravel)
  [122, 2, 139, 16],                   // GB, British Empire Building (plot 1 local 34..51)
  [180, 2, 197, 16],                   // GB, La Maison Francaise (plot 2 local 34..51)
];

const name = (c) => (c ? c.block.replace(/^minecraft:/, "") : "air");
const air = (g, x, y, z) => name(g.get(x, y, z)) === "air";
const inBox = (x, z, [x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// a small vent: two full smooth_stone blocks along x with an iron-bar grille on top (plan: smooth_stone stairs; not in
// the palette). Full blocks, not bottom slabs: the grille at y+1 would otherwise hang half a block over air.
function vent(g, x, y, z) {
  g.set(x, y, z, "smooth_stone");
  g.set(x + 1, y, z, "smooth_stone");
  g.set(x, y + 1, z, "iron_bars", { east: "true", west: "true" });
  g.set(x + 1, y + 1, z, "iron_bars", { east: "true", west: "true" });
}

export function build(g) {
  // 1. the open tops the shell left air: a cell with air at its top y and solid below is a planted roof
  const open22 = [], open26 = [];
  for (const [x0, x1, z0, z1] of SITE)
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++) {
        if (air(g, x, 22, z) && !air(g, x, 21, z)) open22.push([x, z]);
        if (air(g, x, 26, z) && !air(g, x, 25, z)) open26.push([x, z]);
      }

  // 2. ledges (22): grass, a hedge on the row inside the coping, a lamp post every 6 along that row
  for (const [x, z] of open22) {
    const hedge = DIRS.some(([dx, dz]) => !air(g, x + dx, 22, z + dz));
    g.set(x, 22, z, "grass_block");
    // the shell closes some air at 22 over with its own floor or ceiling at 23 (tower interiors): only open sky gets a hedge
    if (!hedge || !air(g, x, 23, z)) continue;
    if ((x + z) % 6 === 0 && air(g, x, 24, z) && air(g, x, 25, z)) lamp_post(g, x, 23, z);
    else g.set(x, 23, z, "azalea_leaves", { persistent: "true" });
  }

  // 3. open 26 tops outside the gardens: plot 0 setback gravel, plot 1/2 strips grass
  for (const [x, z] of open26) {
    if (GARDENS.some((b) => inBox(x, z, b))) continue;
    g.set(x, 26, z, x < 84 ? "gravel" : "grass_block");
  }

  // 4. roof gardens (lawns, hedges, paths, beds, trees, lamps)
  GARDENS.forEach((b, i) => roof_garden(g, b, 26, i + 1));

  // 5. light every smooth_stone deck: a flush froglight on a 6-cell lattice, plus one wherever a deck cell has none
  //    within 3 on its own course (so each deck cell stands within ~9 light: never a dark deck)
  const decks = [];
  for (const [x0, x1, z0, z1] of SITE)
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++)
        for (const Y of DECK_Y)
          if (name(g.get(x, Y, z)) === "smooth_stone" && air(g, x, Y + 1, z)) decks.push([x, Y, z]);
  const lit = new Set(), lights = [];
  const key = (x, y, z) => `${x},${y},${z}`;
  for (const [x, y, z] of decks)
    if (x % 6 === 1 && z % 6 === 1) { lights.push([x, y, z]); lit.add(key(x, y, z)); }
  for (const [x, y, z] of decks) {
    let near = false;
    for (let dx = -3; dx <= 3 && !near; dx++)
      for (let dz = -3; dz <= 3 && !near; dz++) if (lit.has(key(x + dx, y, z + dz))) near = true;
    if (!near) { lights.push([x, y, z]); lit.add(key(x, y, z)); }
  }
  // deck_light would sit flush IN the deck, but runParts locks the shell's deck cells, so every flush light is refused:
  // a lantern stands on each deck cell instead (plan lists it under lamps; it lights the deck without replacing it)
  for (const [x, y, z] of lights) g.set(x, y + 1, z, "lantern", { hanging: "false" });

  // 6. the A roof (plot 0 shop block on 51st Street): two vents on its deck
  vent(g, 10, 7, 2);
  vent(g, 16, 7, 5);
}
