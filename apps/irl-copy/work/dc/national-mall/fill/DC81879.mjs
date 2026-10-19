// DC81879: vacant brick commercial block at 853 New Jersey Ave SE, DC 20003 (Capitol South), as a 1.21.1 module.
// The footprint is an 18 x 39 cell lot whose lidar roof is a stepped massing in the north half (roof 3-6 blocks,
// about 1-4 storeys at 0.42 blocks/m) and a low or open yard to the south (roof 0-1). Lidar roof heights are smoothed
// (3x3 median over the footprint) and snapped to tiers: 0 = open paved yard, 2 = one-storey shed, 4 = two storeys,
// 6 = three storeys. Each storey is 2 blocks: a stone floor line, a window band, and the next floor line on top, so
// each tier stands on the one below. Every column is solid from y 0 up to its tier: nothing floats.
// Read as a 1920s-50s brick commercial/warehouse infill: brick walls on a stone plinth, stone string courses and a
// stone cornice, boarded-up shopfront (vacant), glass panes in brick piers, a dark oak door, and a few lit windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81879.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81879.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed roof: mean of the footprint cells in the 5x5 around each cell, rounded. A wide window drowns the lidar's
// single-cell spikes, so the tiers form clean blocks instead of stray towers.
const smooth = new Map();
for (const c of F.values()) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const q = F.get(key(c.x + dx, c.z + dz)); if (q) { sum += q.r; n++; }
  }
  smooth.set(key(c.x, c.z), Math.round(sum / n));
}
// Tiers: 0 = open yard (one paved course), 2 = one-storey shed, 4 = two storeys, 6 = three storeys.
const tier = (h) => (h <= 0 ? 0 : h <= 2 ? 2 : h <= 4 ? 4 : 6);

// Palette
const BASE = "stone_bricks";      // plinth, floor lines (string courses), cornice and window heads
const BRICK = "bricks";           // the walls and the brick piers between bays
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";     // interior floor slabs and roof membrane
const BOARD = "spruce_planks";    // boarded ground-floor shopfront (vacant)
const PARAPET = "stone_brick_wall";
const DOOR = "dark_oak_door";
const YARD = "gravel";            // open lot to the south
const LAMP = "glowstone";
const AC = "iron_block";

const Y = 8;
const g = new Voxels([18, Y, 39]);
const glass = [];                  // pane positions, for their connections once the walls are up

const outside = (x, z, dx, dz) => !inF(x + dx, z + dz);
const shell = (x, z) => DIRS.some(([dx, dz]) => outside(x, z, dx, dz));
const northFace = (x, z) => outside(x, z, 0, -1);   // the street side: the north (z-min) face

// Tier for each cell, and the entrance: the middle north-facing cell of a storeyed (tier >= 4) run.
const T = new Map();
for (const c of F.values()) T.set(key(c.x, c.z), tier(smooth.get(key(c.x, c.z))));
const northRun = [...F.values()].filter((c) => northFace(c.x, c.z) && T.get(key(c.x, c.z)) >= 4).sort((a, b) => a.x - b.x);
const doorCell = northRun.length ? northRun[northRun.length >> 1] : null;

for (const c of F.values()) {
  const t = T.get(key(c.x, c.z));
  const b = shell(c.x, c.z);
  // Open yard: one paved course on the ground.
  if (t === 0) { g.set(c.x, 0, c.z, YARD); continue; }

  for (let y = 0; y < t; y++) {
    const top = y === t - 1;
    const floorLine = y % 2 === 0;               // 0, 2, 4: plinth and storey lines
    if (!b) {                                    // interior: floor slabs at storey lines, air in the rooms
      if (floorLine || top) g.set(c.x, y, c.z, FLOOR);
      continue;
    }
    if (top) { g.set(c.x, y, c.z, t >= 4 ? PARAPET : BASE); continue; }   // cornice, parapet on the taller blocks
    if (floorLine) { g.set(c.x, y, c.z, BASE); continue; }                // string course or plinth
    // Window band (y 1, 3, 5): the ground band is the shopfront on the street face; above it, glass in brick piers.
    if (y === 1 && northFace(c.x, c.z)) {
      if (doorCell && c.x === doorCell.x && c.z === doorCell.z) {
        g.set(c.x, 1, c.z, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (c.x % 4 === 1 && c.x > 0) {
        g.set(c.x, 1, c.z, BRICK);                                       // brick pier between shop bays
      } else {
        g.set(c.x, 1, c.z, BOARD);                                       // boarded-up shop window
      }
      continue;
    }
    if (c.x % 3 === 0) { g.set(c.x, y, c.z, BRICK); continue; }          // brick pier
    g.set(c.x, y, c.z, GLASS); glass.push([c.x, y, c.z]);
  }

  // Ground floor of the door: the lower half and the stone plinth around it.
  if (doorCell && c.x === doorCell.x && c.z === doorCell.z) {
    g.set(c.x, 0, c.z, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  }
  // Roof plant on the three-storey blocks: an air unit on every fifth tall-block cell, standing on the membrane.
  if (t === 6 && !b && (c.x * 3 + c.z) % 5 === 0) g.set(c.x, 6, c.z, AC);
}

// Lit windows: warm glowstone just inside a few panes on the upper storeys (a rooftop-level light, not an interior).
for (const [x, y, z] of glass) {
  if (y !== 3 || (x * 7 + z * 5) % 9 !== 0) continue;
  const inside = DIRS.find(([dx, dz]) => inF(x + dx, z + dz) && !shell(x + dx, z + dz) && g.get(x + dx, y, z + dz) === null);
  if (inside) g.set(x + inside[0], y, z + inside[1], LAMP);
}

// Pane connections: a pane joins a neighbouring pane or pier in its wall, so the bands read as continuous glazing.
for (const [x, y, z] of glass) {
  const has = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  g.set(x, y, z, GLASS, {
    north: String(has(0, -1)), south: String(has(0, 1)), east: String(has(1, 0)), west: String(has(-1, 0)), waterlogged: "false",
  });
}

const stats = g.save(OUT);
console.log(`DC81879: ${cells.length} cells, ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
