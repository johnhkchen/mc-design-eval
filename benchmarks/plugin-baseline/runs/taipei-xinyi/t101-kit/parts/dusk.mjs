// P6 Dusk lighting (all plots): lit offices (litClump) on the pedestal, mall, segment and pinnacle glass; standing lanterns
// on every sky-open walkable top (decks, ledges, step sills, observatory deck, cap); the aircraft-light check on the spire.
// Writes go only into air, so every earlier part's block stays as built.
import { litClump, aircraftLight, LANTERN, SITE } from "../vocab.mjs";
import { carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FACES = ["north", "south", "east", "west"];
const LIT = /froglight/;
const SLAB = /slab/;

// Grid x of each plot's origin (plan.md: plot 1 +197, plot 2 +277; plot 0 is the grid's own x).
const P1 = 197, P2 = 277;

// A lantern needs a full top face under it: decks and ledges count; glass, bars, leaves, fittings, the lit-office
// froglights (set in the glass wall) and slabs (a bottom slab leaves half a block of air) do not.
const NOT_SUPPORT = /glass|pane|bars|lantern|chain|rod|torch|carpet|leaves|sign|rail|sea_lantern|froglight|slab/;

function solid(g, x, y, z) {
  return g.inBounds(x, y, z) && !g.isAir(x, y, z) && !NOT_SUPPORT.test(g.blockAt(x, y, z));
}

// True when nothing stands above (x, y, z) to the top of the grid: a roof or a floor above means the top is inside.
function skyOpen(g, x, y, z) {
  for (let yy = y + 1; yy < SITE[1]; yy++) if (!g.isAir(x, yy, z)) return false;
  return true;
}

// Standing lanterns on every sky-open walkable top in a region: air at (x, y, z), a solid block below, nothing above.
// Spaced every `every` cells on the absolute grid. skip(x, y, z) keeps cells clear for another part.
function lightTops(g, { x0, x1, z0, z1, y0, y1 }, every, skip = () => false) {
  let n = 0;
  for (let x = x0; x <= x1; x++) {
    if (x % every !== 0) continue;
    for (let z = z0; z <= z1; z++) {
      if (z % every !== 0) continue;
      for (let y = y0; y <= y1; y++) {
        if (!g.isAir(x, y, z) || !solid(g, x, y - 1, z) || skip(x, y, z)) continue;
        if (!skyOpen(g, x, y, z)) continue;
        g.set(x, y, z, LANTERN, { hanging: "false" });
        n++;
      }
    }
  }
  return n;
}

// the segment's bands [inset, first y, last y] (parts/segment.mjs)
const SEG_BANDS = [[7, 0, 5], [6, 6, 11], [5, 12, 17], [4, 18, 23], [3, 24, 29], [2, 30, 35], [1, 36, 41], [0, 42, 45]];
const TOWER_GLASS = new Set(["minecraft:cyan_stained_glass", "minecraft:light_blue_stained_glass"]);
const BACKING = "minecraft:gray_concrete";

// inside the double-sawtooth plan of box shrunk by k, and not on its wall ring
function inNotched(b, k, x, z) {
  const x0 = b.x0 + k, z0 = b.z0 + k, x1 = b.x1 - k, z1 = b.z1 - k;
  if (x < x0 || x > x1 || z < z0 || z > z1) return false;
  return ![[x - x0, z - z0], [x1 - x, z - z0], [x - x0, z1 - z], [x1 - x, z1 - z]].some(([a, c]) => (a < 2 && c < 4) || (a < 4 && c < 2));
}
const interior = (b, k, x, z) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => inNotched(b, k, x + dx, z + dz));

// A dark backing behind the tower glass: every air cell 4-adjacent to a glass cell and inside the band's plan (not on its
// ring) becomes gray_concrete, so the cyan glass reads dark green-blue instead of showing the hollow. Lit windows and
// light strips already fill their inside cells, so they stay lit.
function backing(g, insetAt, b, y0, y1) {
  let n = 0;
  for (let y = y0; y <= y1; y++) {
    const k = insetAt(y);
    for (let x = b.x0; x <= b.x1; x++) for (let z = b.z0; z <= b.z1; z++) {
      if (!TOWER_GLASS.has(g.blockAt(x, y, z))) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (!g.isAir(nx, y, nz) || !interior(b, k, nx, nz)) continue;
        g.set(nx, y, nz, BACKING);
        n++;
      }
    }
  }
  return n;
}

export function build(g) {
  // ---- lit offices: about 12% of the glass, clumped, 2 warm : 1 cool (denser on S and E) ----
  const pedestal = { x0: 96, x1: 171, y0: 2, y1: 156, z0: 108, z1: 183 };
  const mall = { x0: 0, x1: 192, y0: 3, y1: 10, z0: 0, z1: 189 };   // street-level shop windows only
  const segment = { x0: P1, x1: P1 + 75, y0: 1, y1: 45, z0: 0, z1: 75 };
  const pinnacle = { x0: P2 + 23, x1: P2 + 52, y0: 13, y1: 79, z0: 23, z1: 52 };
  // the pedestal and segment keep about 1 window in 12 lit (0.03, doubled on S and E), all warm; the rest of their glass
  // gets a dark backing below so it reads green-blue
  FACES.forEach((f, i) => {
    litClump(g, f, 61 + i, 0.03, pedestal);
    litClump(g, f, 71 + i, 0.12, mall);
    litClump(g, f, 81 + i, 0.03, segment);
    litClump(g, f, 91 + i, 0.12, pinnacle);
  });
  for (const b of [pedestal, segment]) {
    for (let x = b.x0; x <= b.x1; x++) for (let y = b.y0; y <= b.y1; y++) for (let z = b.z0; z <= b.z1; z++) {
      if (g.blockAt(x, y, z) === "minecraft:pearlescent_froglight") g.set(x, y, z, "minecraft:ochre_froglight", { axis: "y" });
    }
  }
  // a lit office set on a slab (the pedestal's step sills, the mall's plinths) would hang half a block over air: drop it
  // (dusk is the last part, so it may clear its own cells)
  let nDropped = 0;
  for (const b of [pedestal, mall, segment, pinnacle]) {
    for (let x = b.x0; x <= b.x1; x++) for (let y = b.y0 + 1; y <= b.y1; y++) for (let z = b.z0; z <= b.z1; z++) {
      if (!LIT.test(g.blockAt(x, y, z)) || !SLAB.test(g.blockAt(x, y - 1, z))) continue;
      carve(g, [x, y, z], [x, y, z]);
      nDropped++;
    }
  }
  console.log(`dusk: lit offices dropped off slabs ${nDropped}`);

  // ---- dark backing: gray_concrete in the air cell inside every tower glass cell (pedestal, segment) ----
  const nBack = backing(g, (y) => (y <= 25 ? 0 : Math.min(6, Math.floor((y - 2) / 24))), { x0: 96, z0: 108, x1: 171, z1: 183 }, 3, 154)
    + backing(g, (y) => SEG_BANDS.find(([, y0, y1]) => y >= y0 && y <= y1)[0], { x0: P1, z0: 0, x1: P1 + 75, z1: 75 }, 1, 43);
  console.log(`dusk: glass backing ${nBack}`);

  // ---- lanterns on every sky-open walkable top ----
  // Plot 0: mall decks, pedestal step sills, the mall's terraces. The pedestal roof (y 157) carries the first segment's
  // foot, so its top stays clear, and nothing is lit below y 5 (the paving and street lamps belong to grounds).
  const footZ = (x, z) => x >= 103 && x <= 164 && z >= 115 && z <= 176;
  const nPlot0 = lightTops(g, { x0: 0, x1: 192, z0: 0, z1: 205, y0: 5, y1: 156 }, 8, (x, y, z) => y === 158 && footZ(x, z));
  // Plot 1: the segment's top ledge, outer ring only: the middle 62 square stays clear for the next segment's foot.
  const nPlot1 = lightTops(g, { x0: P1, x1: P1 + 75, z0: 0, z1: 75, y0: 1, y1: 47 }, 8, (x, y, z) => {
    const lx = x - P1;
    return y === 47 && lx >= 7 && lx <= 68 && z >= 7 && z <= 68;
  });
  // Plot 2: observatory deck, pinnacle ledges, cap top (the spire itself is not air, so it is skipped by the air test).
  const nPlot2 = lightTops(g, { x0: P2, x1: P2 + 75, z0: 0, z1: 75, y0: 5, y1: 174 }, 8);

  // ---- aircraft check: the crown part places these; the air-only helpers add any cell it left out ----
  const ax = P2 + 37;
  aircraftLight(g, [ax, 100, 37], "2x2", { centre: null });
  aircraftLight(g, [ax, 115, 37], "2x2", { centre: null });
  aircraftLight(g, [ax, 140, 37], "1x1", { centre: null });
  aircraftLight(g, [ax, 160, 37], "1x1", { centre: null });
  aircraftLight(g, [ax, 171, 37], "1x1", { centre: null });

  console.log(`dusk: lanterns plot0 ${nPlot0}, plot1 ${nPlot1}, plot2 ${nPlot2}`);
}
