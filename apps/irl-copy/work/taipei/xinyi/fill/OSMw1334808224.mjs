import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1334808224.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1334808224.nbt";

const W = 5, H = 19, D = 5;
const g = new Voxels([W, H, D]);

const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// Safe setter: ignores anything outside the volume.
function S(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const GROUND_MIN = Math.min(...cells.map((c) => c[2]));
// Single storey, about 7 blocks (~5 m) to the roof surface from the lowest ground.
const ROOF_BASE = GROUND_MIN + 7;

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Roof level for this cell: shared roof line, but never lower than a usable storey.
  const Rc = Math.max(ROOF_BASE, gr + 5);

  // Foundation from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  const front = z === 0;
  const back = z === 4;
  const left = x === 0;
  const right = x === 4;
  const perim = front || back || left || right;

  if (!perim) {
    // Interior: floor slab, open air (no interior), roof deck at Rc-1.
    S(x, gr, z, "smooth_stone");
    S(x, Rc - 1, z, "smooth_stone");
    // Roof plant: two air-conditioning housings.
    if ((x === 1 && z === 1) || (x === 3 && z === 3)) {
      S(x, Rc, z, "iron_block");
    }
    // Warm light behind the glass on the ground storey.
    if ((x === 1 && z === 1) || (x === 3 && z === 3)) {
      S(x, gr + 2, z, "glowstone");
    }
    continue;
  }

  // Perimeter: plinth, wall body, cornice, parapet.
  S(x, gr, z, "polished_andesite");
  for (let y = gr + 1; y <= Rc - 3; y++) S(x, y, z, "white_concrete");
  S(x, Rc - 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  S(x, Rc - 1, z, "smooth_stone");

  // Street front (z = 0): shopfront with entrance, awning band above.
  if (front) {
    if (x === 0 || x === 4) {
      // Pillars stay as concrete.
    } else if (x === 2) {
      // Entrance door, transom glass above is replaced by the awning band.
      S(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      S(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      S(x, gr + 3, z, "red_concrete");
    } else {
      // Shop glazing with frames at the base, red awning band above.
      S(x, gr + 1, z, "glass_pane", PANE_EW);
      S(x, gr + 2, z, "glass_pane", PANE_EW);
      S(x, gr + 3, z, "red_concrete");
    }
  }

  // Side and rear walls: window grid with concrete mullions.
  const sideWindowRow = (left || right) && z >= 1 && z <= 3;
  const rearWindowRow = back && x >= 1 && x <= 3;
  if (sideWindowRow || rearWindowRow) {
    const mullion = sideWindowRow ? z === 2 : x === 2;
    const props = sideWindowRow ? PANE_NS : PANE_EW;
    for (const y of [gr + 2, gr + 3]) {
      if (mullion) S(x, y, z, "white_concrete");
      else S(x, y, z, "glass_pane", props);
    }
  }
}

g.save(OUT);
