import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE111-0025-13F";
const W = 27, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint lookup: "x,z" -> ground height (third number)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const minG = Math.min(...ground.values());
// Flat roof at 11 blocks above the lowest ground (top block at minG + 10)
let R = minG + 10;
if (R > H - 3) R = H - 3; // keep room for rooftop plant above the roof

const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Street-facing entrance: front row (lowest z) of the footprint, middle cell
const minZ = Math.min(...cells.map(([, z]) => z));
const front = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = front[Math.floor(front.length / 2)];

const GLASS_PANE = { north: "true", south: "true", east: "true", west: "true" };

const g = new Voxels([W, H, D]);

for (const [x, z, gr0] of cells) {
  const gr = gr0 - minG;
  if (gr > R) continue;
  const per = isPerim(x, z);
  const corner = isCorner(x, z);
  const entryZone = z === minZ && Math.abs(x - doorX) <= 1;
  // Mullion columns every third cell along each face; corners always solid
  const mullion = corner || (x + z) % 3 === 0;

  // Foundation under the cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  for (let y = gr; y <= R; y++) {
    const k = y - gr;
    const band = k % 5; // 0 = storey slab, 1-3 = glazing, 4 = spandrel
    if (k === 0) {
      g.set(x, y, z, per ? "smooth_stone" : "light_gray_concrete");
    } else if (y === R) {
      // Roof: parapet cap on the edge, roof deck inside
      g.set(x, y, z, per ? "white_concrete" : "light_gray_concrete");
    } else if (per && y === R - 1) {
      // Cornice course under the parapet
      g.set(x, y, z, "white_concrete");
    } else if (band === 0) {
      // Storey lines (floor slabs / spandrel bands)
      g.set(x, y, z, per ? "white_concrete" : "light_gray_concrete");
    } else if (per) {
      if (entryZone && x === doorX && (k === 1 || k === 2)) {
        // Entrance door, lower and upper halves
        const half = k === 1 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (entryZone && k === 3) {
        // Entrance canopy over the door
        g.set(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      } else if (band === 4) {
        // Spandrel under each window band
        g.set(x, y, z, "white_concrete");
      } else if (mullion) {
        // Window frame mullions
        g.set(x, y, z, "white_concrete");
      } else if (entryZone || k < 5) {
        // Shopfront glazing on the ground floor
        g.set(x, y, z, "glass_pane", GLASS_PANE);
      } else {
        // Upper-storey glazing in solid masonry bays
        g.set(x, y, z, "glass_pane", GLASS_PANE);
      }
    } else {
      // Interior air gap behind the glass, with warm lights in some bays
      if (band === 2 && (x + z) % 7 === 0) g.set(x, y, z, "shroomlight");
    }
    // Solid masonry body on the perimeter wherever no glazing was placed
    if (per && (band === 4 || band === 0 || mullion) && false) { /* no-op */ }
  }

  // Fill the perimeter wall body (light masonry) behind window bays so the
  // facades read as solid walls with glazing bands rather than open cages.
  if (per) {
    for (let y = gr + 1; y < R - 1; y++) {
      const k = y - gr;
      const band = k % 5;
      const isWindowBand = band >= 1 && band <= 3;
      const isWindowCell = !mullion && !(entryZone && (k === 1 || k === 2 || k === 3));
      if (!(isWindowBand && isWindowCell)) {
        if (!(entryZone && x === doorX && (k === 1 || k === 2))) {
          if (!(entryZone && k === 3)) {
            if (band !== 0 && (band !== 4 || true)) {
              // Only fill cells the loop above left as glass-free air: none, so skip.
            }
          }
        }
      }
    }
  }
}

// Rooftop plant: a few equipment boxes on the roof deck, interior only
if (R + 2 < H) {
  for (let x = 4; x < W; x += 9) {
    const z = 5;
    if (has(x, z) && !isPerim(x, z)) {
      g.set(x, R + 1, z, "smooth_stone");
      g.set(x + 1, R + 1, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
