import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey low-rise commercial block (Xinyi-style white-tiled concrete mid-century shophouse):
// stone plinth, glazed shopfront, two upper storeys of white concrete piers and blue glass,
// cornice, parapet, and a rooftop plant enclosure. Roof sits ~11 blocks above the cell ground.
const W = 15, H = 23, D = 16;
const ID = "OSMw539950887";
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/${ID}.cells.json`, "utf8"));

const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map(cells.map(([x, z, y]) => [key(x, z), y]));
const has = (x, z) => ground.has(key(x, z));
const gy = (x, z) => ground.get(key(x, z));

// A cell is on the perimeter if any side neighbour lies outside the footprint.
const isEdge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (y < 0 || y > H - 1) return;
  if (x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Door position: middle of the z=0 (front) edge, if it exists.
const doorX = Math.floor(W / 2);
const doorCell = has(doorX, 0) ? { x: doorX, z: 0 } : null;

for (const [x, z, base] of cells) {
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Ground-floor slab / interior floors (solid so nothing floats).
  put(x, base, z, edge ? "stone_bricks" : "smooth_stone");

  for (let k = 1; k <= 11; k++) {
    const y = base + k;
    if (y > H - 1) break;

    if (!edge) {
      // Interior: only floor slabs and roof, air in between (no interiors).
      if (k === 5) put(x, y, z, "smooth_stone");
      if (k === 10) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Perimeter walls, by storey course.
    if (k >= 1 && k <= 3) {
      // Shopfront: glazed, with white concrete mullions every 3 cells.
      const isDoor = doorCell && x === doorCell.x && z === doorCell.z;
      if (isDoor && k === 1) {
        put(x, y, z, "dark_oak_door", {
          facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (isDoor && k === 2) {
        put(x, y, z, "dark_oak_door", {
          facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (isDoor && k === 3) {
        // Canopy over the entrance.
        put(x, y, z, "white_concrete");
      } else if (x % 3 === 0) {
        put(x, y, z, "white_concrete");
      } else if (k === 2 && (x + 2 * z) % 7 === 0) {
        put(x, y, z, "glowstone"); // warm lit shop interior
      } else {
        put(x, y, z, "glass_pane");
      }
    } else if (k === 4) {
      put(x, y, z, "white_concrete"); // lintel beam
    } else if (k === 5 || k === 9) {
      put(x, y, z, "white_concrete"); // spandrels
    } else if (k >= 6 && k <= 8) {
      // Upper storeys: blue glass bays between white piers.
      if (x % 3 === 0) {
        put(x, y, z, "white_concrete");
      } else if (k === 7 && (x + z) % 5 === 0) {
        put(x, y, z, "glowstone"); // warm lit window
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
      }
    } else if (k === 10) {
      put(x, y, z, "stone_brick_slab", { type: "bottom" }); // cornice
    } else if (k === 11) {
      put(x, y, z, "white_concrete"); // parapet
    }
  }
}

// Rooftop plant enclosure on interior roof cells (stands on the roof slab).
for (const [x, z, base] of cells) {
  if (isEdge(x, z)) continue;
  if (x < 4 || x > 10 || z < 5 || z > 10) continue;
  if ((x + z) % 2 !== 0 && x !== 7) continue;
  for (let k = 11; k <= 12; k++) {
    if (base + k > H - 1) break;
    put(x, base + k, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${ID}.nbt`);
