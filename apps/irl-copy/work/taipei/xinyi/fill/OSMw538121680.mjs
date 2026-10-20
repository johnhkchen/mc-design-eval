import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey mid-century commercial block in Xinyi: white tiled concrete,
// light-grey pilasters, blue-green glazing, shopfront on the street (north) face,
// quartz cornice and a parapet, with a roof plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121680";
const W = 11, H = 23, D = 19;
const ROOF = 10;    // roof deck level (cornice on the perimeter)
const PARAPET = 11; // parapet level on the perimeter

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.min(Math.round(gr), 12)));
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const inWindowBand = (y) => (y >= 1 && y <= 3) || (y >= 6 && y <= 8);

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!has(x, z)) continue;
    const gr = G(x, z);

    // Foundation: solid from y 0 up to the cell's ground.
    for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

    const fN = !has(x, z - 1); // north = street face (z = 0 side)
    const fS = !has(x, z + 1);
    const fW = !has(x - 1, z);
    const fE = !has(x + 1, z);
    const faces = [fN, fS, fW, fE].filter(Boolean).length;
    const perim = faces > 0;
    const alongNS = fN || fS;
    const a = alongNS ? x : z;
    const amax = alongNS ? W - 1 : D - 1;

    for (let y = gr; y <= PARAPET; y++) {
      if (!perim) {
        // Interior: floor slabs at each storey line and the roof deck. Air elsewhere.
        if (y === gr || y === 5 || y === ROOF) put(x, y, z, "light_gray_concrete");
        continue;
      }

      let id;
      if (y === gr) id = "polished_andesite";          // base course
      else if (y === 5) id = "light_gray_concrete";    // storey line
      else if (y === ROOF) id = "smooth_quartz";       // cornice
      else if (y === PARAPET) id = "white_concrete";   // parapet
      else if (inWindowBand(y)) {
        const single = faces === 1;
        const glass = single && a % 2 === 0 && a >= 2 && a <= amax - 2;
        if (glass) id = "light_blue_stained_glass";
        else id = fN && faces === 1 ? "light_gray_concrete" : "white_concrete";
      } else id = "white_concrete";

      put(x, y, z, id);
    }
  }
}

// Street entrance on the north face at x = 5, with a dark oak door.
if (has(5, 0)) {
  const gr = G(5, 0);
  if (gr + 2 <= 3) {
    put(5, gr + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(5, gr + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  // Shopfront awning over the entrance bay (sits on the glazing below).
  for (let x = 3; x <= 7; x++) {
    if (has(x, 0) && G(x, 0) <= 4) put(x, 4, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
}

// Warm lights behind the glazing in the interior air gaps.
const lights = [
  [2, 2, "glowstone"], [6, 2, "glowstone"],
  [4, 7, "shroomlight"], [8, 7, "shroomlight"],
];
for (const [x, y, id] of lights) {
  if (has(x, 1) && G(x, 1) < y) put(x, y, 1, id);
}

// Roof plant box (3 x 3, two blocks high) with a slab cap, sitting on the roof deck.
for (let x = 3; x <= 5; x++) {
  for (let z = 8; z <= 10; z++) {
    if (!has(x, z) || G(x, z) > ROOF) continue;
    put(x, PARAPET, z, "light_gray_concrete");
    put(x, PARAPET + 1, z, "light_gray_concrete");
    put(x, PARAPET + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
