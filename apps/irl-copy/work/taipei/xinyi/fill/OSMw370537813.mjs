import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw370537813.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw370537813.nbt";

// 信義富邦世紀館: late-1990s/early-2000s Taipei office tower, ~12 storeys of
// tinted blue glass in light grey concrete spandrels, granite-and-stone plinth,
// a wide glazed entrance on both long faces, and a stepped roof plant crown.
const W = 69, H = 71, D = 27;
const TOP = 59;          // roof surface, from lidar
const PITCH = 5;         // blocks per storey
const CX = 34, CZ = 13;  // centre of the footprint
const DOOR_X0 = 29, DOOR_X1 = 39;   // storefront opening width
const DOOR_MID = [34, 35];          // door leaves

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inFP = new Set(cells.map(([x, z]) => key(x, z)));
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), Math.round(gr)]));

// First floor line = highest ground under the footprint.
const B = Math.max(...cells.map(([, , gr]) => Math.round(gr)));
const LAST = B + PITCH * Math.floor((58 - B) / PITCH);   // last storey line below roof
const ZMIN = Math.min(...cells.map(([, z]) => z));
const ZMAX = Math.max(...cells.map(([, z]) => z));

const isEdge = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFP.has(key(x + dx, z + dz)));
const isPenthouse = (x, z) => Math.abs(x - CX) <= 16 && Math.abs(z - CZ) <= 6;
const isCrown = (x, z) => Math.abs(x - CX) <= 6 && Math.abs(z - CZ) <= 3;
const isEntranceFace = (x, z) =>
  (z === ZMIN || z === ZMAX) && x >= DOOR_X0 && x <= DOOR_X1 && isEdge(x, z);

// Pass 1: structure and facade for every footprint cell.
for (const [x, z] of cells) {
  const edge = isEdge(x, z);

  // Foundation and plinth: stone from y 0 up to the first floor line.
  for (let y = 0; y < B; y++) {
    const id = y >= B - 2 ? "polished_granite" : "stone_bricks";
    g.set(x, y, z, id);
  }

  // Storeys from the first floor line up to the roof.
  for (let y = B; y <= 58; y++) {
    const r = y - B;
    if (r % PITCH === 0) {
      // Floor slab / storey line, present on every cell so nothing floats.
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!edge) {
      // Interior: air gap per storey; solid roof mass in the top band.
      if (y > LAST) g.set(x, y, z, "gray_concrete");
      continue;
    }
    const mullion = (x + z) % 3 === 0;
    if (r < PITCH) {
      // Ground storey: glazed storefront, stone piers, doorway handled below.
      if (isEntranceFace(x, z)) {
        // Transom over the whole opening, stone piers at the reveals.
        if (r === 4) g.set(x, y, z, "light_blue_stained_glass");
        else if (x === DOOR_X0 || x === DOOR_X1) g.set(x, y, z, "stone_bricks");
        else g.set(x, y, z, "light_blue_stained_glass");
        continue;
      }
      g.set(x, y, z, mullion ? "stone_bricks" : "light_blue_stained_glass");
    } else {
      // Upper storeys: glass panes between grey mullions every third block.
      g.set(x, y, z, mullion ? "gray_concrete" : "light_blue_stained_glass");
    }
  }

  // Roof slab over the whole footprint.
  g.set(x, TOP, z, "light_gray_concrete");

  // Parapet coping on the outer edge, except where the crown rises.
  if (edge && !isPenthouse(x, z)) g.set(x, TOP + 1, z, "stone_brick_wall");

  // Roof plant penthouse: grey frame, glass bands, cap.
  if (isPenthouse(x, z)) {
    const frame = Math.abs(x - CX) === 16 || Math.abs(z - CZ) === 6;
    for (let y = TOP + 1; y <= TOP + 4; y++) {
      if (y === TOP + 4) g.set(x, y, z, "light_gray_concrete");
      else g.set(x, y, z, frame ? "gray_concrete" : "light_blue_stained_glass");
    }
  }

  // Crown: small stepped block with a lantern cap on the centre.
  if (isCrown(x, z) && isPenthouse(x, z)) {
    for (let y = TOP + 5; y <= TOP + 7; y++) {
      g.set(x, y, z, Math.abs(x - CX) === 6 || Math.abs(z - CZ) === 3 ? "gray_concrete" : "light_gray_concrete");
    }
    g.set(x, TOP + 8, z, "sea_lantern");
  }
}

// Canopy over each entrance: a light grey band on the storey line above the
// transom, with stone brackets at the reveals, so the doorway reads from the street.
for (const [x, z] of cells) {
  if (!isEntranceFace(x, z)) continue;
  g.set(x, B + 5, z, "light_gray_concrete");
}

// Entrance doors on both long faces (lower and upper halves).
for (const [x, z] of cells) {
  if (!isEntranceFace(x, z)) continue;
  if (!DOOR_MID.includes(x)) continue;
  const facing = z === ZMIN ? "north" : "south";
  g.set(x, B + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, B + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Pass 2: warm lights just inside some windows (behind the glass).
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  for (let y = B + 1; y <= LAST; y++) {
    const r = y - B;
    if (r % PITCH === 0 || r < PITCH) continue;
    if ((x + z) % 3 === 0) continue;               // mullion
    if ((x * 5 + y * 7) % 11 !== 0) continue;      // denser than before
    const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dz]) => [x + dx, z + dz])
      .find(([nx, nz]) => inFP.has(key(nx, nz)) && !isEdge(nx, nz));
    if (inward) g.set(inward[0], y, inward[1], "glowstone");
  }
}

// Antenna on the crown.
g.set(CX, TOP + 9, CZ, "lightning_rod");
g.set(CX, TOP + 10, CZ, "lightning_rod");

g.save(OUT);
