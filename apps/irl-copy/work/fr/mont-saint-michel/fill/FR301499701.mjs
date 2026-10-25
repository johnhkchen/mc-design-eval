import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499701";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 29, H = 33, D = 22;
const g = new Voxels([W, H, D]);

// Palette: 1938 commercial block, render walls, granite-like base, slate roof
const WALL = "calcite";
const BASE = "stone_bricks";
const SLATE = "deepslate_tiles";
const CORE = "stone_bricks";
const GLASS = "glass_pane";
const TRIM = "stone_bricks";

// Bounds-checked setter
function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const map = new Map();
for (const c of cells) {
  const x = c[0], z = c[1];
  let gy = Math.max(0, Math.min(H - 2, Math.round(c[2])));
  let top = Math.max(gy + 1, Math.min(H - 1, Math.round(c[3]) - 1));
  map.set(`${x},${z}`, { x, z, g: gy, top });
}
const has = (x, z) => map.has(`${x},${z}`);
const isPerim = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));

let maxZ = 0;
for (const c of map.values()) maxZ = Math.max(maxZ, c.z);

for (const c of map.values()) {
  const { x, z, g: gy, top } = c;
  const perim = isPerim(x, z);

  // Foundation up to the ground line
  for (let y = 0; y < gy; y++) put(x, y, z, "stone");

  // Ground floor slab
  put(x, gy, z, TRIM);

  if (perim) {
    for (let y = gy + 1; y < top; y++) {
      const o = y - gy;
      const storey = Math.floor(o / 5);
      const inS = o % 5;
      if (inS === 0) { put(x, y, z, BASE); continue; }

      if (storey === 0) {
        // Entrance on the south face
        if (z === maxZ && x === 14) {
          if (o === 1) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (o === 2) put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, WALL);
          continue;
        }
        // Shopfront glazing with stone mullions
        if (inS >= 1 && inS <= 3) {
          if (x % 3 === 0) put(x, y, z, TRIM);
          else put(x, y, z, GLASS);
          continue;
        }
      }

      // Upper storeys: window grid
      if (inS >= 1 && inS <= 3 && (x + z) % 3 === 1) put(x, y, z, GLASS);
      else put(x, y, z, WALL);
    }
    // Cornice / parapet cap
    put(x, top, z, BASE);
  } else {
    // Interior: solid core so every block is supported
    for (let y = gy + 1; y < top; y++) put(x, y, z, CORE);
    put(x, top, z, SLATE);
  }
}

// Warm lights: lanterns on the inner side of some upper windows, placed in
// a solid-filled neighbour would replace stone, so put a glowstone block
// in the wall line behind glass instead (lit window reading from street)
for (const c of map.values()) {
  if (!isPerim(c.x, c.z)) continue;
  for (let s = 1; s <= 2; s++) {
    const yl = c.g + 5 * s + 2;
    if (yl >= c.top) continue;
    if ((c.x * 7 + c.z * 3 + s) % 5 !== 0) continue;
    if ((c.x + c.z) % 3 !== 1) continue;
    put(c.x, yl, c.z, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
