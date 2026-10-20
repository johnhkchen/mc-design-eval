import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1344800031.cells.json", "utf8")
);

const W = 5, H = 19, D = 9;
const g = new Voxels([W, H, D]);

// Footprint and per-cell ground heights
const ground = new Map();
let maxG = 0;
for (const [x, z, k] of cells) {
  ground.set(`${x},${z}`, k);
  if (k > maxG) maxG = k;
}
const has = (x, z) => ground.has(`${x},${z}`);

// Roof sits about 7 blocks above the lowest ground; keep it below the world top
const roofY = Math.min(Math.max(7, maxG + 5), H - 3);

const opts = (o) => o;
const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);
  const ex = x === 0 || x === W - 1;
  const ez = z === 0 || z === D - 1;
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const corner = ex && ez;
  const front = z === D - 1;
  const onXFace = ex && !ez; // side faces (x = 0 or W-1)

  // Foundation under the cell, then base course / ground floor slab
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, G, z, perim ? "smooth_stone" : "smooth_stone");

  // Storeys: ground floor G+1..G+3 (shopfront), then 4-block storeys with spandrel slabs at rel 4, 8, ...
  for (let y = G + 1; y <= roofY; y++) {
    const rel = y - G;
    const isSlab = rel % 4 === 0;
    if (y === roofY) {
      g.set(x, y, z, perim ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (!perim) {
      // Interior: floor slabs only, air gap otherwise (no interiors)
      if (isSlab) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (isSlab) {
      g.set(x, y, z, "white_concrete");
    } else if (corner) {
      g.set(x, y, z, "white_concrete");
    } else if (rel < 4) {
      // Shopfront
      if (front && x === 2 && rel <= 2) continue; // entrance, door placed below
      if (front && x >= 1 && x <= 3 && rel === 3) {
        g.set(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" }); // canopy lintel
        continue;
      }
      g.set(x, y, z, "glass");
    } else {
      // Upper window bays with framed panes, sparse warm lights
      const lit = (x * 2 + y * 3 + z * 5) % 13 === 0;
      if (lit) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", onXFace ? paneNS : paneEW);
      }
    }
  }

  // Parapet and roof equipment
  if (perim) {
    g.set(x, roofY + 1, z, "white_concrete");
  }
}

// Roof plant on an interior cell
if (has(2, 4)) g.set(2, roofY + 1, 4, "iron_block");

// Entrance door on the front (z = D-1) at x = 2, on the ground floor
const frontG = ground.get(`2,${D - 1}`);
if (frontG !== undefined) {
  g.set(2, frontG + 1, D - 1, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(2, frontG + 2, D - 1, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1344800031.nbt");
