import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403760";
const W = 36, H = 23, D = 15;
const ROOF = 11;        // roof top, measured above lowest ground
const GROUND_TOP = 4;   // ground floor occupies y gy..4
const STOREY_LINE = 5;  // floor slab / storey band
const CORNICE = 10;     // cornice band under the roof edge

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const map = new Map();
for (const [x, z, g] of cells) map.set(`${x},${z}`, Math.round(g));
const minG = Math.min(...map.values());
const has = (x, z) => map.has(`${x},${z}`);
const groundOf = (x, z) => Math.min(Math.max(map.get(`${x},${z}`) - minG, 0), CORNICE - 1);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: the street-side (south, z+1 open) cell nearest the middle of that frontage.
const frontCells = cells.filter(([x, z]) => !has(x, z + 1)).map(([x, z]) => [x, z]);
const midX = (W - 1) / 2;
let doorX = -1, doorZ = -1, best = Infinity;
for (const [x, z] of frontCells) {
  const d = Math.abs(x - midX);
  if (d < best) { best = d; doorX = x; doorZ = z; }
}

const g = new Voxels([W, H, D]);

function wallBlock(x, z, y, gy) {
  const front = !has(x, z + 1);
  const back = !has(x, z - 1);
  const alongX = front || back;
  const idx = alongX ? x : z;

  if (y === CORNICE) return { id: "smooth_stone" };
  if (y === STOREY_LINE) return { id: "quartz_block" };

  if (y <= GROUND_TOP) {
    if (front) {
      if (y === GROUND_TOP) return { id: "teal_concrete" };          // shop fascia
      if (idx % 4 === 0) return { id: "smooth_stone" };               // shopfront pillars
      if (y === gy + 2 && idx % 7 === 3) return { id: "glowstone" };  // warm shop light
      return { id: "glass" };
    }
    if (y === gy) return { id: "stone_bricks" };                      // base course
    return { id: "white_concrete" };
  }

  // upper storey, y 6..9
  if (idx % 3 === 0) return { id: "white_concrete" };                 // pilasters
  if (y === 6 || y === 9) return { id: "light_gray_concrete" };       // sill and lintel
  if (y === 7 && (x + z) % 5 === 0) return { id: "shroomlight" };     // warm window
  const props = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  return { id: "glass_pane", props };
}

for (const [x, z, _raw] of cells) {
  const gy = groundOf(x, z);
  const perim = isPerim(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // Body: from ground up to the cornice.
  for (let y = gy; y <= CORNICE; y++) {
    if (perim) {
      if (x === doorX && z === doorZ && (y === gy || y === gy + 1) && gy + 1 <= GROUND_TOP) {
        const half = y === gy ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      const b = wallBlock(x, z, y, gy);
      if (b.props) g.set(x, y, z, b.id, b.props);
      else g.set(x, y, z, b.id);
    } else {
      g.set(x, y, z, "light_gray_concrete");
    }
  }

  // Roof slab at ROOF.
  g.set(x, ROOF, z, perim ? "smooth_stone" : "gray_concrete");
}

// Roof equipment on the interior of the roof, supported by the roof slab.
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  const inUnit = (x >= 5 && x <= 8) || (x >= 27 && x <= 30);
  const midRow = z >= 5 && z <= 9;
  if (inUnit && midRow) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
    if (z === 7) g.set(x, ROOF + 3, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
