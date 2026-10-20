import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Taiwanese shophouse, c. 1980s: two storeys of white tiled concrete over a
// shopfront ground floor, dark fascia, quartz cornice, parapet and rooftop plant.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541458740.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541458740.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 20, H = 23, D = 8;
const g = new Voxels([W, H, D]);

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => foot.has(`${x},${z}`);
const isEdge = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Door position: centre of the north (z = 0) front, found from the cells.
const frontCells = cells.filter(([x, z]) => z === 0 && inF(x, z));
const doorX = frontCells.length
  ? frontCells.map(c => c[0]).sort((a, b) => a - b)[Math.floor(frontCells.length / 2)]
  : -1;

for (const [x, z, gr] of cells) {
  const base = gr;
  const edge = isEdge(x, z);
  const frontExposed = !inF(x, z - 1) || !inF(x, z + 1);
  // Bay index runs along whichever facade is exposed; ends use z.
  const bay = frontExposed ? x : z;

  // Foundation and base course.
  for (let y = 0; y < base; y++) put(x, y, z, "stone");
  put(x, base, z, edge ? "stone_bricks" : "stone");

  // Floor slabs: ground-to-first at base+5, first-to-roof at base+10.
  if (!edge) {
    put(x, base + 5, z, "light_gray_concrete");
    put(x, base + 10, z, "gray_concrete");
    // Warm light just behind a window on the first floor.
    if (frontExposed && z === 1 && bay % 6 === 2 && bay % 3 !== 0) {
      put(x, base + 7, z, "glowstone");
    }
  }

  // Rooftop plant box on a few interior cells.
  if (!edge && x >= 4 && x <= 6 && z >= 3 && z <= 4) {
    put(x, base + 11, z, "light_gray_concrete");
    put(x, base + 12, z, "smooth_stone");
  }

  if (!edge) continue;

  // Perimeter walls, base+1 .. base+11.
  for (let y = base + 1; y <= base + 11; y++) put(x, y, z, "white_concrete");

  // Ground floor shopfront.
  const isDoor = frontExposed && z === 0 && x === doorX;
  if (isDoor) {
    put(x, base + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, base + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, base + 3, z, "smooth_quartz");
  } else {
    for (let y = base + 1; y <= base + 3; y++) {
      put(x, y, z, bay % 4 === 0 ? "polished_andesite" : "glass_pane");
    }
  }
  // Fascia and cornice.
  put(x, base + 4, z, "dark_oak_planks");
  put(x, base + 5, z, "smooth_quartz");

  // Second floor: piers every third bay, windows with sills and heads.
  const pier2 = bay % 3 === 0;
  put(x, base + 6, z, pier2 ? "white_concrete" : "light_gray_concrete");
  put(x, base + 7, z, pier2 ? "white_concrete" : "glass_pane");
  put(x, base + 8, z, pier2 ? "white_concrete" : "glass_pane");
  put(x, base + 9, z, pier2 ? "white_concrete" : "light_gray_concrete");

  // Roof cornice and parapet cap.
  put(x, base + 10, z, "smooth_quartz");
  put(x, base + 11, z, "smooth_quartz");
}

g.save(OUT);
