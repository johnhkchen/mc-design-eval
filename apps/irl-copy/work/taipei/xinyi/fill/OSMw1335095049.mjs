import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1335095049";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 6 x 12, roof about 7 blocks above lowest ground.
// Low-rise 1990s commercial shophouse: white tiled walls, light grey
// pilasters and storey bands, glass shopfront, parapet and rooftop plant.
const W = 6, H = 19, D = 12;
const v = new Voxels([W, H, D]);

const gr = new Map();
for (const [x, z, gy] of cells) gr.set(`${x},${z}`, gy);
const has = (x, z) => gr.has(`${x},${z}`);
const xs = cells.map((c) => c[0]);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const midX = Math.floor((minX + maxX) / 2);

const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }; // on east/west faces
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }; // on north/south faces

for (const [x, z, gy] of cells) {
  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const sideX = !has(x - 1, z) || !has(x + 1, z);
  const boundary = front || back || sideX;
  const corner = sideX && (front || back);

  // Foundation fill up to this cell's ground, then floor at ground level.
  for (let y = 0; y < gy; y++) v.set(x, y, z, "stone");
  v.set(x, gy, z, boundary ? "smooth_stone" : "smooth_stone");

  // Roof deck sits on the walls; wall top = deck - 1.
  const deck = Math.max(6, gy + 5);

  if (boundary) {
    for (let y = gy + 1; y <= deck - 1; y++) {
      if (corner) {
        v.set(x, y, z, "light_gray_concrete");
        continue;
      }
      if (y === gy + 4) {
        // Storey line / fascia band
        v.set(x, y, z, "light_gray_concrete");
        continue;
      }
      if (front) {
        if (y <= gy + 3) {
          if (x === midX) {
            if (y === gy + 1) {
              v.set(x, y, z, "dark_oak_door", {
                facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
              });
            } else if (y === gy + 2) {
              v.set(x, y, z, "dark_oak_door", {
                facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
              });
            } else {
              v.set(x, y, z, "glass");
            }
          } else {
            v.set(x, y, z, "glass");
          }
        } else {
          // Upper transom row on the street face
          v.set(x, y, z, x % 2 === 1 ? "glass_pane" : "white_concrete", x % 2 === 1 ? paneZ : undefined);
        }
        continue;
      }
      // Side or back faces: alternating window bays
      const winBay = sideX ? (z % 2 === 1) : (x % 2 === 1);
      if (winBay) {
        v.set(x, y, z, "glass_pane", sideX ? paneX : paneZ);
      } else {
        v.set(x, y, z, "white_concrete");
      }
    }

    // Parapet on the roof edge
    v.set(x, deck + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Roof deck over every footprint cell
  v.set(x, deck, z, "smooth_stone");

  if (!boundary) {
    // Hanging lanterns under the roof deck inside the building
    if ((x + z) % 3 === 0) {
      v.set(x, deck - 1, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
    // Rooftop AC plant on two plinths
    if ((x === 2 && z === 3) || (x === 3 && z === 8)) {
      v.set(x, deck + 1, z, "light_gray_concrete");
      v.set(x, deck + 2, z, "iron_block");
    }
  }
}

v.save(`${DIR}/${ID}.nbt`);
