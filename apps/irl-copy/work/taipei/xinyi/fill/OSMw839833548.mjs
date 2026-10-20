import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw839833548: low-rise two-storey commercial block, c. 1980s-90s Xinyi
// shophouse-style frontage: white concrete wall, light-grey concrete piers,
// tinted glass bands, a shopfront at street level, a stone cornice and a
// parapet, with rooftop condenser units. Roof sits about 11 blocks above the
// lowest ground: storey 1 = rel 0..4, storey 2 = rel 5..9, parapet = rel 10.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833548.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833548.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 22, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const minG = Math.min(...cells.map((c) => c[2]));
const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map(([x, z, gr]) => [key(x, z), gr - minG]));
const inFp = (x, z) => cellMap.has(key(x, z));

// Entrance: middle of the front (lowest z) row of the footprint.
const zMin = Math.min(...cells.map((c) => c[1]));
const frontXs = cells.filter((c) => c[1] === zMin).map((c) => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];
const doorZ = zMin;

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS_PROPS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const b = gr - minG; // this cell's ground level in build space
  const perim = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
  const corner = (!inFp(x - 1, z) || !inFp(x + 1, z)) && (!inFp(x, z - 1) || !inFp(x, z + 1));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  for (let r = 0; r <= 10; r++) {
    const y = b + r;
    if (!perim) {
      // Interior: floor slabs and roof slab only; air gap between.
      if (r === 0 || r === 5) put(x, y, z, "smooth_stone");
      else if (r === 9) put(x, y, z, "gray_concrete");
      else if (r === 10 && x % 7 === 3 && z % 6 === 2) put(x, y, z, "light_gray_concrete"); // condenser unit
      continue;
    }

    // Perimeter envelope.
    const pier = corner || (x + z) % 3 === 0;
    const isDoorCell = x === doorX && z === doorZ;
    const lit = (x * 5 + z * 3) % 11 === 0;

    if (r === 0) { put(x, y, z, "polished_andesite"); continue; }        // base course
    if (r === 5) { put(x, y, z, "smooth_stone"); continue; }             // storey line
    if (r === 9) { put(x, y, z, "smooth_stone"); continue; }             // cornice
    if (r === 10) { put(x, y, z, "white_concrete"); continue; }          // parapet cap

    if (r >= 1 && r <= 4) {
      // Storey 1: shopfront.
      if (isDoorCell) {
        if (r === 1) put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (r === 2) put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (r === 3) put(x, y, z, "light_gray_concrete");
        else put(x, y, z, "white_concrete");
      } else if (pier) {
        put(x, y, z, "light_gray_concrete");
      } else if (r === 4) {
        put(x, y, z, "white_concrete");                                   // lintel
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", GLASS_PROPS);       // shopfront glass
      }
      continue;
    }

    if (r >= 6 && r <= 8) {
      // Storey 2: window grid with occasional lit rooms.
      if (pier) {
        put(x, y, z, "light_gray_concrete");
      } else if (r === 7 && lit) {
        put(x, y, z, "glowstone");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", GLASS_PROPS);
      }
      continue;
    }
  }
}

g.save(OUT);
