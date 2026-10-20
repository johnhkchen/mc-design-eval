import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456410";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 15 x 16, 2 storeys (5-block storeys) plus parapet, roof surface at y 11.
const W = 15, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const ground = new Map();
let low = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < low) low = gr;
}
const has = (x, z) => ground.has(`${x},${z}`);

// Facade: 2-storey commercial/office block, 1980s concrete frame.
// Ground storey: shopfront glass with white concrete piers and a canopy over a central entrance.
// Upper storey: window ribbons with mullions. Cornice at y 10, parapet to y 12.
for (const [x, z, gr] of cells) {
  const G = gr - low;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= G; y++) put(x, y, z, "stone_bricks");

  const nsOpen = !has(x, z - 1) || !has(x, z + 1);
  const ewOpen = !has(x - 1, z) || !has(x + 1, z);

  if (!nsOpen && !ewOpen) {
    // Interior: floor slabs per storey and roof deck; air otherwise (no interiors).
    for (const y of [5, 11]) if (y > G) put(x, y, z, "smooth_quartz");
    if (x % 5 === 2 && z % 5 === 2) {
      // Roof plant room with a bottom slab cap.
      put(x, 12, z, "light_gray_concrete");
      put(x, 13, z, "smooth_stone_slab", { type: "bottom" });
    }
    continue;
  }

  // Edge cell: facade.
  const corner = nsOpen && ewOpen;
  const idx = nsOpen && !ewOpen ? x : ewOpen && !nsOpen ? z : x + z;
  const front = nsOpen && !has(x, z + 1);
  const inX = !has(x - 1, z) ? 1 : !has(x + 1, z) ? -1 : 0;
  const inZ = !has(x, z - 1) ? 1 : !has(x, z + 1) ? -1 : 0;

  for (let y = G + 1; y <= 12; y++) {
    if (y === 4) {
      put(x, y, z, "smooth_stone");
    } else if (y === 5) {
      put(x, y, z, "white_concrete");
    } else if (y === 10) {
      put(x, y, z, "smooth_stone");
    } else if (y === 11 || y === 12) {
      put(x, y, z, "white_concrete");
    } else if (y <= 3) {
      // Ground-storey shopfront.
      const pier = corner || (front ? idx % 4 === 0 : idx % 3 === 0);
      put(x, y, z, pier ? "white_concrete" : "glass");
    } else {
      // Upper storey window ribbon (y 6..9).
      const pier = corner || idx % 3 === 0;
      put(x, y, z, pier ? "white_concrete" : "glass");
      if (!pier && y === 7 && idx % 6 === 1 && has(x + inX, z + inZ)) {
        put(x + inX, 7, z + inZ, "glowstone");
      }
    }
  }

  if (front && !corner) {
    // Entrance: door and canopy at centre, lanterns under the canopy.
    if (idx === 7 && G + 2 <= 3) {
      put(x, G + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, G + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    if (idx >= 5 && idx <= 9) {
      put(x, 4, z, "stone_brick_slab", { type: "top" });
    }
    if ((idx === 5 || idx === 9) && G + 3 <= 3) {
      put(x, 3, z, "lantern", { hanging: "true" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
