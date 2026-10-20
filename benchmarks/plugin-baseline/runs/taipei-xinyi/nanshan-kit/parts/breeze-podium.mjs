// Plot 0 Breeze Nan Shan podium (plan.md PLOT 0 table): P-A lower gold box, P-B middle gold box, P-C top dark-glass box,
// the cantilever soffits, the roof terraces and pergola, the south kiosk P-K, the link atrium L and the covered walk W.
// Plot-local coordinates (x 0..247, z 0..89). Writes only into air: the ground (ground fill, laid first) and the
// plinth course are the only solid cells below the masses.
import {
  shopFront, goldScreen, darkGlassBox, soffit, planter, pergola, kiosk, atriumRoof, coveredWalk,
  lobbyGlass, groundTop, onFootprint, ANDESITE, STONE, STONE_SLAB, IRON, SEA_LANTERN, GLASS_LIGHT_GRAY,
  FIN, PILLAR, CANOPY_SLAB, GLASS_BLACK, CONCRETE_GRAY, GLASS_CLEAR,
} from "../vocab.mjs";

// A {x0,y0,z0,x1,y1,z1} box as the [x0,y0,z0,x1,y1,z1] array the screen helpers take.
const arr = (b) => [b.x0, b.y0, b.z0, b.x1, b.y1, b.z1];

// Fill a box with a block, writing only into air (earlier parts and the ground stay as they are).
function fillAir(g, [x0, y0, z0], [x1, y1, z1], block, pick = () => block) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    if (!g.isAir(x, y, z)) continue;
    const b = pick(x, y, z);
    if (b) { g.set(x, y, z, b); n++; }
  }
  return n;
}

// The plinth course: a mass lays its plinth from its floor down to the ground under each footprint cell.
function plinth(g, box) {
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
    const top = groundTop(0, x, z);
    if (top == null || !onFootprint(0, x, z)) continue;
    for (let y = top + 1; y <= box.y0; y++) if (g.isAir(x, y, z)) g.set(x, y, z, ANDESITE);
  }
}

export function build(g) {
  // ---- P-A: lower gold box, x 0..101, y 3..18, z 16..83 (street storey y4..8, gold screen y9..18) ----
  const A = { x0: 0, y0: 3, z0: 16, x1: 101, y1: 18, z1: 83 };
  plinth(g, A);
  const aStreet = { ...A, y0: 4, y1: 8 };
  shopFront(g, "south", aStreet, { setback: 2, pierEvery: 6, doorEvery: 12, wood: "birch" });
  shopFront(g, "west", aStreet, { setback: 2, pierEvery: 6, doorEvery: 12, wood: "birch" });
  shopFront(g, "north", aStreet, { setback: 2, pierEvery: 6, doorEvery: 12, wood: "birch" });
  // East face of P-A meets the link atrium: its storey is glazed through (clear glass, no piers).
  fillAir(g, [101, 4, 16], [101, 8, 83], GLASS_CLEAR);
  const aScreen = { ...A, y0: 9, y1: 18 };
  for (const face of ["south", "west", "north", "east"]) goldScreen(g, arr(aScreen), face, 0, { glass: GLASS_CLEAR });
  // P-A roof: solid at y18 under the upper boxes and the exposed terraces.
  fillAir(g, [A.x0, 18, A.z0], [A.x1, 18, A.z1], STONE);

  // ---- P-B: middle gold box, x 6..101, y 19..32, z 12..71 ----
  const B = { x0: 6, y0: 19, z0: 12, x1: 101, y1: 32, z1: 71 };
  // North cantilever over the entry plaza (z 12..15): soffit with downlights.
  soffit(g, { x0: B.x0, x1: B.x1, y0: 19, y1: 19, z0: 12, z1: 15 });
  // Floor of the box over P-A's roof (z 16..71).
  fillAir(g, [B.x0, 19, 16], [B.x1, 19, B.z1], STONE);
  const bScreen = { ...B, y0: 19, y1: 32 };
  for (const face of ["north", "east", "south", "west"]) goldScreen(g, arr(bScreen), face, 2, { glass: GLASS_CLEAR });
  // P-B roof at y32 (solid under the terraces and P-C).
  fillAir(g, [B.x0, 32, B.z0], [B.x1, 32, B.z1], STONE);

  // The roof terraces (decks at y19 and y33, rails above) are laid by lights-grounds: its full-block deck takes the
  // rails' footing (a bottom-slab deck left half a block of air under each rail).
  // Planters on the exposed terraces (soil on the deck, azalea above).
  for (const z of [24, 40, 56, 72]) planter(g, [2, 20, z]);
  for (const z of [30, 46, 62]) planter(g, [92, 34, z]);

  // Café pergola on the north-east terrace.
  pergola(g, { x0: 88, y0: 34, z0: 14, x1: 99, y1: 37, z1: 21 });
  // The pergola's beams stand inside its perimeter: a quartz post under each beam carries it to the deck.
  for (let x = 90; x <= 98; x += 4) for (let z = 16; z <= 20; z += 4) {
    for (const y of [34, 35]) if (g.isAir(x, y, z)) g.set(x, y, z, "quartz_pillar", { axis: "y" });
  }

  // ---- P-C: top dark-glass box, x 0..83, y 33..44 (coping y45..46), z 24..79 ----
  const C = { x0: 0, y0: 33, z0: 24, x1: 83, y1: 44, z1: 79 };
  // South cantilever (z 72..79) soffit at y33 with downlights, the rest of the floor is stone.
  soffit(g, { x0: C.x0, x1: C.x1, y0: 33, y1: 33, z0: 72, z1: 79 });
  fillAir(g, [C.x0, 33, C.z0], [C.x1, 33, 71], STONE);
  darkGlassBox(g, [C.x0, C.y0, C.z0, C.x1, C.y1, C.z1], { coping: 2, bands: [4, 8] });
  // P-C roof: a deck at y45 inside the coping, deck lights every 6x6, mechanical box on top.
  fillAir(g, [C.x0, 45, C.z0], [C.x1, 45, C.z1], STONE, (x, y, z) =>
    (x - C.x0) % 6 === 3 && (z - C.z0) % 6 === 3 ? SEA_LANTERN : STONE);
  fillAir(g, [30, 46, 40], [49, 50, 59], CONCRETE_GRAY);

  // ---- P-K: south kiosk / entry pavilion, x 18..29, y 4..10 (roof y10), z 84..89 ----
  kiosk(g, { x0: 18, y0: 4, z0: 84, x1: 29, y1: 10, z1: 89 });

  // ---- L: link atrium, x 102..155, y 4..21 (roof y22), z 24..59 ----
  lobbyGlass(g, { x0: 102, y0: 4, z0: 24, x1: 155, y1: 21, z1: 59 }, 6, IRON, {
    glass: GLASS_LIGHT_GRAY, lanternBays: 3,
  });
  atriumRoof(g, [102, 24, 155, 59], 22, {});

  // ---- W: covered walk north, x 102..107, y 4..10 (canopy y9..10), z 12..23 ----
  coveredWalk(g, { x0: 102, y0: 3, z0: 12, x1: 107, y1: 10, z1: 23 });
}
