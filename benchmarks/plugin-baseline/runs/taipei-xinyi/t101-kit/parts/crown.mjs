// P3 Crown and spire (plot 2): foot floor y0, observatory y1..11, deck y12 with rail y13, pinnacle tiers P1..P3
// y13..80 with ledges at 35/57/80, cap y81..92, spire y93..175, aircraft lights. Plot-local numbers (x and z 0..75,
// y as plan.md) are placed at world x + 277; the vocab helpers that take grid coordinates get world boxes via wb().
import { capStep, ledgeSlab, spireSection, aircraftLight, deckRail } from "../vocab.mjs";

const OX = 277;
const SPIRE = { x: 37, z: 37 };
const PINNACLE_FLOORS = new Set([19, 27, 34, 42, 49, 56, 64, 71, 79]);

// grid coordinates of a plot-local rect
const wb = (b) => ({ x0: b.x0 + OX, z0: b.z0, x1: b.x1 + OX, z1: b.z1 });

// one block at plot-local [x, y, z]; into air only unless over
function put(g, x, y, z, block, state, over = false) {
  const wx = x + OX;
  if (!g.inBounds(wx, y, z)) return false;
  if (!over && !g.isAir(wx, y, z)) return false;
  g.set(wx, y, z, block, state);
  return true;
}

// wall cells of the plan of rect b with a corner notch: "single" = 2x2 cut, "corner" = 1 cell cut
function wallCells(b, notch) {
  const cut = (a, c) => (notch === "single" ? a < 2 && c < 2 : notch === "corner" ? a < 1 && c < 1 : false);
  const corner = (x, z) => [[x - b.x0, z - b.z0], [b.x1 - x, z - b.z0], [x - b.x0, b.z1 - z], [b.x1 - x, b.z1 - z]];
  const inPlan = (x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && !corner(x, z).some(([a, c]) => cut(a, c));
  const out = [];
  for (let x = b.x0; x <= b.x1; x++) for (let z = b.z0; z <= b.z1; z++) {
    if (inPlan(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inPlan(x + dx, z + dz))) out.push([x, z]);
  }
  return out;
}

// the cell one step inside the wall at [x, z] of rect b (for sea lanterns behind the glass)
function inward(x, z, b) {
  if (z === b.z0) return [x, z + 1];
  if (z === b.z1) return [x, z - 1];
  if (x === b.x0) return [x + 1, z];
  return [x - 1, z];
}

// the two cells either side of each corner notch: the light strips (ochre_froglight on the nose)
function noses(b) {
  return [[b.x0 + 1, b.z0], [b.x0, b.z0 + 1], [b.x1 - 1, b.z0], [b.x1, b.z0 + 1],
    [b.x0 + 1, b.z1], [b.x0, b.z1 - 1], [b.x1 - 1, b.z1], [b.x1, b.z1 - 1]];
}

// the wall of a glass band: y0..y1 on rect b. kind "obs" (observatory) or "pin" (pinnacle, floors from PINNACLE_FLOORS).
// lit: y courses with a sea lantern one cell inside every other wall cell.
function glassBand(g, b, y0, y1, { notch, kind, lit = [] }) {
  const walls = wallCells(b, notch);
  const wallSet = new Set(walls.map(([x, z]) => `${x},${z}`));
  const nose = new Set(noses(b).filter(([x, z]) => wallSet.has(`${x},${z}`)).map(([x, z]) => `${x},${z}`));
  walls.forEach(([x, z], i) => {
    for (let y = y0; y <= y1; y++) {
      const onNS = z === b.z0 || z === b.z1;
      let block = ["light_blue_stained_glass"];
      if (kind === "pin" && PINNACLE_FLOORS.has(y)) block = ["dark_prismarine"];
      else if (kind === "obs" && y === 1) block = ["dark_prismarine"];
      else if ((onNS ? x : z) % 4 === 1) block = ["light_gray_concrete"];
      else if (nose.has(`${x},${z}`)) block = ["ochre_froglight", { axis: "y" }];
      else if (kind === "pin" && PINNACLE_FLOORS.has(y + 1)) block = ["cyan_stained_glass"];
      put(g, x, y, z, ...block);
      if (lit.includes(y) && (i % 2 === 0)) {
        const [ix, iz] = inward(x, z, b);
        put(g, ix, y, iz, "sea_lantern");
      }
    }
  });
}

// a step course: the new ring of rect b and the ring below it (y = yb-1 and yb) as dark prismarine, closing the soffit
function stepCourse(g, b, yb) {
  for (const [x, z] of wallCells(b, "corner")) {
    put(g, x, yb - 1, z, "dark_prismarine");
    put(g, x, yb, z, "dark_prismarine");
  }
}

export function build(g) {
  // foot floor y0: 62 square (7..68) on the eighth segment's ledge, flush lanterns on the ring at inset 1
  ledgeSlab(g, { box: wb({ x0: 7, z0: 7, x1: 68, z1: 68 }), y: 0, top: "light_gray_concrete", lanternRing: 1, every: 5 });

  // observatory y1..11, 52 square (12..63), single 2x2 corner notch: base course, glass, lit band, fascia
  const obs = { x0: 12, z0: 12, x1: 63, z1: 63 };
  glassBand(g, obs, 1, 10, { notch: "single", kind: "obs", lit: [3, 7, 10] });
  for (const [x, z] of wallCells(obs, "single")) put(g, x, 11, z, "smooth_quartz");

  // observatory deck y12 (smooth_stone, flush lanterns on the perimeter every 4) and rail y13
  ledgeSlab(g, { box: wb(obs), y: 12, top: "smooth_stone", lanternRing: 0, every: 4 });
  deckRail(g, wb(obs), 13);

  // pinnacle: three tiers of bands, each with its step course, ledges at y35, y57, y80
  const tiers = [
    [{ b: { x0: 25, z0: 25, x1: 50, z1: 50 }, y0: 13, y1: 19 }, { b: { x0: 24, z0: 24, x1: 51, z1: 51 }, y0: 20, y1: 27 },
      { b: { x0: 23, z0: 23, x1: 52, z1: 52 }, y0: 28, y1: 34 }],
    [{ b: { x0: 26, z0: 26, x1: 49, z1: 49 }, y0: 36, y1: 42 }, { b: { x0: 25, z0: 25, x1: 50, z1: 50 }, y0: 43, y1: 49 },
      { b: { x0: 24, z0: 24, x1: 51, z1: 51 }, y0: 50, y1: 56 }],
    [{ b: { x0: 27, z0: 27, x1: 48, z1: 48 }, y0: 58, y1: 64 }, { b: { x0: 26, z0: 26, x1: 49, z1: 49 }, y0: 65, y1: 71 },
      { b: { x0: 25, z0: 25, x1: 50, z1: 50 }, y0: 72, y1: 79 }],
  ];
  const ledges = [
    { box: { x0: 23, z0: 23, x1: 52, z1: 52 }, y: 35 },
    { box: { x0: 24, z0: 24, x1: 51, z1: 51 }, y: 57 },
    { box: { x0: 25, z0: 25, x1: 50, z1: 50 }, y: 80 },
  ];
  tiers.forEach((tier, t) => {
    tier.forEach((band, i) => {
      if (i > 0) stepCourse(g, band.b, band.y0);
      glassBand(g, band.b, band.y0, band.y1, { notch: "corner", kind: "pin", lit: [band.y0 + 2, band.y0 + 5] });
    });
    ledgeSlab(g, { box: wb(ledges[t].box), y: ledges[t].y, top: "smooth_quartz", lanternRing: 0, every: 4 });
  });

  // cap y81..92: stepped solid, smooth_quartz / iron_block / light_gray_concrete, lit band y83
  capStep(g, [
    { x0: 28 + OX, z0: 28, x1: 47 + OX, z1: 47, y0: 81, y1: 84, block: "smooth_quartz" },
    { x0: 30 + OX, z0: 30, x1: 45 + OX, z1: 45, y0: 85, y1: 88, block: "iron_block" },
    { x0: 32 + OX, z0: 32, x1: 43 + OX, z1: 43, y0: 89, y1: 92, block: "light_gray_concrete" },
  ]);
  for (let x = 28; x <= 47; x++) for (let z = 28; z <= 47; z++) {
    if (x === 28 || x === 47 || z === 28 || z === 47) put(g, x, 83, z, "sea_lantern", undefined, true);
  }
  // red lights over a sea lantern at each cap corner
  for (const [x, z] of [[32, 32], [43, 32], [32, 43], [43, 43]]) {
    put(g, x, 92, z, "sea_lantern", undefined, true);
    put(g, x, 93, z, "red_stained_glass");
  }

  // spire: 2x2 iron block y93..122, then one cell wide to the tip at y175
  const sx = SPIRE.x + OX, sz = SPIRE.z;
  spireSection(g, { x: sx, z: sz, y0: 93, y1: 122, kind: "iron_block", size: 2 });
  spireSection(g, { x: sx, z: sz, y0: 123, y1: 150, kind: "light_gray_concrete" });
  spireSection(g, { x: sx, z: sz, y0: 151, y1: 170, kind: "iron_bars" });
  spireSection(g, { x: sx, z: sz, y0: 171, y1: 174, kind: "end_rod" });
  spireSection(g, { x: sx, z: sz, y0: 175, y1: 175, kind: "lightning_rod" });

  // aircraft lights: 2x2 at y100 and y115, 1x1 at y140 and y160, and on the end rod at y171
  aircraftLight(g, [sx, 100, sz], "2x2", { over: true });
  aircraftLight(g, [sx, 115, sz], "2x2", { over: true });
  aircraftLight(g, [sx, 140, sz], "1x1", { over: true });
  aircraftLight(g, [sx, 160, sz], "1x1", { over: true });
  aircraftLight(g, [sx, 171, sz], "1x1", { over: true, centre: null });
}
