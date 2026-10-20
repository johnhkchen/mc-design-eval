// P2 Butterworth masonry shell (plan.md PARTS 2): the main block's 2-thick brick walls from the ground up to y35, a
// plinth course at the base, the interior floors (LL y3, ground storey by segment, F2 y18, F3 y24, F4 y30), the pavilion's
// walls, the red_nether_bricks back band at y35, and every opening (windows, shopfronts, doorways) left as air.
// The east cornice zone x115 is not touched (the facade part builds it). Grid coordinates = plan coordinates.
import { BRICKS, STONE_BRICKS, RED_NETHER_BRICKS, CUT_SANDSTONE, SMOOTH_SANDSTONE, SHROOMLIGHT, groundAt } from "../vocab.mjs";

const WINDOW_FRAME = "white_concrete"; // white sash rail across the tall back and end windows

// Plot 1 footprint: 40 rows of 4 blocks (z 4r..4r+3), char c = x 64+4c..64+4c+3. '#' = build here.
const FP = [
  ".....########.",
  ...Array(12).fill("#############."),
  ...Array(8).fill(".############."),
  ...Array(6).fill("#############."),
  ...Array(8).fill(".############."),
  ...Array(3).fill(".#############"),
  ".############.",
  "......#.......", // rear stub (x88..91 z156..159): ground only, not built
];
const X0 = 64;
const WALL_TOP = 35; // the parapet and roof (flat deck y36) are built by later parts
const WIN_Y = [20, 21, 22, 26, 27, 28, 29, 31, 32, 33, 34]; // F2, F3, F4 window rows (F3/F4 arches built by the facade)
// Back and end windows: tall rows (LL, ground, F2, F3, F4), each with a lintel over it and a storey band at y17, y24, y30.
const WROWS = [[4, 7], [12, 15], [19, 22], [25, 28], [31, 34]];
const WEST_Y = WROWS.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i));
const BANDS = [17, 24, 30];

const inFP = (x, z) => FP[Math.floor(z / 4)]?.[Math.floor((x - X0) / 4)] === "#";
// The main block: footprint cells west of the east wall line (x115 is the facade layer, the pavilion is apart) and
// south of the stub.
const inR = (x, z) => x <= 114 && z <= 155 && x >= X0 && inFP(x, z);
const inPav = (x, z) => x >= 116 && x <= 117 && z >= 140 && z <= 151;

// Ring depth: 1 and 2 are the two layers of the exterior wall (distance from outside the main block); deeper = interior.
const depth = new Map();
const key = (x, z) => `${x},${z}`;
{
  let frontier = [];
  for (let x = X0; x <= 114; x++)
    for (let z = 0; z <= 155; z++)
      if (inR(x, z) && (!inR(x + 1, z) || !inR(x - 1, z) || !inR(x, z + 1) || !inR(x, z - 1))) {
        depth.set(key(x, z), 1);
        frontier.push([x, z]);
      }
  const next = [];
  for (const [x, z] of frontier)
    for (const [nx, nz] of [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]])
      if (inR(nx, nz) && !depth.has(key(nx, nz))) {
        depth.set(key(nx, nz), 2);
        next.push([nx, nz]);
      }
}
const ringDepth = (x, z) => depth.get(key(x, z)) ?? 0;

// West face of each row (the back wall: x64 where the footprint reaches it, else x68 or x84 on the north-west rows).
const westFace = new Map();
for (let z = 0; z <= 155; z++) {
  for (let x = X0; x <= 114; x++)
    if (inR(x, z)) {
      westFace.set(z, x);
      break;
    }
}
const onWest = (x, z) => westFace.has(z) && x - westFace.get(z) <= 1;

// Ground-storey floor by segment (plan FLOORS).
const groundFloor = (z) => (z <= 35 ? 11 : z <= 83 ? 10 : z <= 139 ? 9 : 8);

// Pier positions on the main front: z0..1, 11..12, 23..24, ... 131..132, 138..139. Shopfronts sit between them, to z137.
const eastPier = (z) =>
  z <= 1 || z >= 138 || (z >= 11 && z <= 132 && ((z - 11) % 12 === 0 || (z - 11) % 12 === 1));
const shopZ = (z) => z <= 137 && !eastPier(z);

// Upper bays: bay k (k 0..25) has its window at z 6k+1..6k+3; bays 23 and 25 stay brick (the pavilion's flanks).
const bayWindowZ = (z) => {
  const k = Math.floor(z / 6);
  return k <= 25 && k !== 23 && k !== 25 && z >= 6 * k + 1 && z <= 6 * k + 3;
};

// Openings on the east (main) face, cells x113..114.
const eastOpen = (y, z) => {
  if (shopZ(z) && y >= groundFloor(z) + 1 && y <= 15) return true;
  if (z >= 144 && z <= 147 && y >= 9 && y <= 12) return true; // pavilion doorway, through the main wall
  if (z >= 143 && z <= 148 && WIN_Y.includes(y)) return true; // pavilion windows
  return bayWindowZ(z) && WIN_Y.includes(y);
};

// Openings on the back (west) face, its two layers.
const westOpen = (y, z) => {
  if (z >= 89 && z <= 102 && y <= 8) return z >= 90 && z <= 101 && y >= 3 && y <= 7; // Kells pub front (LL)
  return westWinZ(z) && WEST_Y.includes(y); // LL / ground / F2-F4 windows, 2 wide every 4
};
const westWinZ = (z) => z >= 3 && z <= 152 && (z % 4 === 1 || z % 4 === 2);

// Openings on the north and south ends: 3-wide windows every 6 along x, every storey.
const endWinX = (x) => x >= 66 && x <= 110 && (x - 64) % 6 >= 2 && (x - 64) % 6 <= 4;
const endOpen = (x, y) => endWinX(x) && WEST_Y.includes(y);
const northFace = new Map(), southFace = new Map();
for (let x = X0; x <= 114; x++)
  for (let z = 0; z <= 155; z++)
    if (inR(x, z)) {
      if (!northFace.has(x)) northFace.set(x, z);
      southFace.set(x, z);
    }
const onNorth = (x, z) => northFace.has(x) && z - northFace.get(x) <= 1;
const onSouth = (x, z) => southFace.has(x) && southFace.get(x) - z <= 1;

function openAt(x, y, z) {
  if (x >= 113) return eastOpen(y, z);
  if (onWest(x, z) && westOpen(y, z)) return true;
  if ((onNorth(x, z) || onSouth(x, z)) && endOpen(x, y) && y > (groundAt(x, z) ?? 0) + 1) return true;
  return false;
}

// The pavilion (x116..117, z140..151): doorway z144..147 y9..12, windows z143..148 at the upper rows.
const pavOpen = (y, z) =>
  (z >= 144 && z <= 147 && y >= 9 && y <= 12) || (z >= 143 && z <= 148 && WIN_Y.includes(y));

export function build(g) {
  // The main block: exterior walls (2 thick) from the ground up, interior floors on top of footings.
  for (let x = X0; x <= 114; x++)
    for (let z = 0; z <= 155; z++) {
      if (!inR(x, z)) continue;
      const gy = groundAt(x, z) ?? 0;
      const d = ringDepth(x, z);
      if (d === 0) {
        // Interior: footing from the ground up to the first floor above it, then each floor slab as a layer.
        const floors = [3, groundFloor(z), 18, 24, 30].sort((a, b) => a - b);
        let footed = false;
        for (const f of floors) {
          if (f <= gy) continue;
          if (!footed) {
            for (let y = gy + 1; y <= f; y++) g.set(x, y, z, STONE_BRICKS);
            footed = true;
          } else g.set(x, f, z, STONE_BRICKS);
        }
        continue;
      }
      for (let y = gy; y <= WALL_TOP; y++) {
        if (openAt(x, y, z)) continue;
        const outer = d === 1 && x < 113;
        if (y <= gy + 1) g.set(x, y, z, STONE_BRICKS); // plinth course at the base
        else if (y === WALL_TOP && (outer || onWest(x, z))) g.set(x, y, z, CUT_SANDSTONE); // cornice frieze (back and ends)
        else if (outer && BANDS.includes(y)) g.set(x, y, z, CUT_SANDSTONE); // storey bands
        else if (d === 1 && x === 114 && y === 17) g.set(x, y, z, CUT_SANDSTONE); // east belt course
        else g.set(x, y, z, BRICKS);
      }
    }

  glazeBackAndEnds(g);

  // The pavilion: a solid 2-wide wall from the ground to the roof level, with its openings.
  for (let x = 116; x <= 117; x++)
    for (let z = 140; z <= 151; z++) {
      const gy = groundAt(x, z) ?? 0;
      for (let y = gy; y <= WALL_TOP; y++) {
        if (pavOpen(y, z)) continue;
        if (y <= gy + 1) g.set(x, y, z, STONE_BRICKS);
        else g.set(x, y, z, BRICKS);
      }
    }
}

// Glass, sash rails, lintels, sills, the cornice corona and the warm glows of the back and end windows. The shell leaves
// these openings as air and runParts locks that air, so they are glazed here: the outer layer stays open (the reveal),
// the pane sits in the inner layer, a cut_sandstone lintel and smooth_sandstone sill frame the outer cell.
function glazeBackAndEnds(g) {
  const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  const lit = (a, b) => ((Math.imul(a * 131 + b, 0x9e3779b1) >>> 16) % 3) !== 0;
  const windowAt = (outer, inner, glow, y0, y1, pane, seed) => {
    const [ox, oz] = outer, [ix, iz] = inner;
    for (let y = y0; y <= y1; y++) {
      if (!g.isAir(ix, y, iz) || !g.isAir(ox, y, oz)) continue;
      g.set(ix, y, iz, ...(y1 - y0 >= 3 && y === y0 + 2 ? [WINDOW_FRAME] : ["glass_pane", pane]));
    }
    if (g.isAir(ox, y1, oz) && g.blockAt(ox, y1 + 1, oz).endsWith(":bricks")) g.set(ox, y1 + 1, oz, CUT_SANDSTONE);
    if (g.isAir(ox, y0, oz) && g.blockAt(ox, y0 - 1, oz).endsWith(":bricks")) g.set(ox, y0 - 1, oz, SMOOTH_SANDSTONE);
    if (seed != null && lit(seed, y0) && g.isAir(glow[0], y1, glow[1]) && g.isAir(glow[0], y1 + 1, glow[1])) {
      g.set(glow[0], y1, glow[1], SHROOMLIGHT); // a warm glow just behind the glass, hung from a brick
      g.set(glow[0], y1 + 1, glow[1], BRICKS);
    }
  };
  for (const [y0, y1] of WROWS) {
    for (let z = 0; z <= 155; z++) {
      if (!westFace.has(z) || !westWinZ(z) || (z >= 89 && z <= 102 && y0 === 4)) continue;
      const x = westFace.get(z);
      windowAt([x, z], [x + 1, z], [x + 2, z], y0, y1, PANE_Z, z % 4 === 1 ? z : null);
    }
    for (let x = X0; x <= 112; x++) {
      if (!endWinX(x)) continue;
      const n = northFace.get(x), s = southFace.get(x);
      if (n != null) windowAt([x, n], [x, n + 1], [x, n + 2], y0, y1, PANE_X, (x - 64) % 6 === 3 ? x : null);
      if (s != null) windowAt([x, s], [x, s - 1], [x, s - 2], y0, y1, PANE_X, (x - 64) % 6 === 3 ? x + 500 : null);
    }
  }
  // The corona over the frieze: smooth_sandstone on the outer ring at the deck row (the roof's deck stops inside it).
  for (const [k, d] of depth) if (d === 1) {
    const [x, z] = k.split(",").map(Number);
    if (x < 113 && g.isAir(x, WALL_TOP + 1, z)) g.set(x, WALL_TOP + 1, z, SMOOTH_SANDSTONE);
  }
}
