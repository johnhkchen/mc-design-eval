import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1341557088";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 9, H = 19, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
// Roof top surface sits ~7 blocks above lowest ground: cap/deck block at minG+6.
const roofTop = minG + 6;

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const paneProps = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const front = z === 8;
  const alongX = z === 0 || z === 8;
  const corner = (x === 0 || x === 8) && (z === 0 || z === 8);
  const idx = alongX ? x : z;

  for (let y = gr; y <= roofTop; y++) {
    const rel = y - gr;

    if (!perim) {
      // Interior: floor slabs per storey, roof deck, air between, a few warm lights.
      if (y === roofTop || rel === 0 || rel === 3) {
        put(x, y, z, "smooth_stone");
      } else if (rel === 4 && x % 4 === 2 && z % 4 === 2) {
        put(x, y, z, "shroomlight");
      }
      continue;
    }

    // Perimeter.
    if (y === roofTop) {
      put(x, y, z, "stone_bricks"); // parapet cap
      continue;
    }
    if (corner) {
      put(x, y, z, rel === 0 ? "stone_bricks" : (rel === 3 ? "smooth_stone" : "white_concrete"));
      continue;
    }
    if (rel === 0) {
      put(x, y, z, "stone_bricks"); // base course
      continue;
    }
    if (rel === 3) {
      // Storey line; on the street front it doubles as a dark awning over the shopfronts.
      if (front && idx >= 1 && idx <= 7) put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      else put(x, y, z, "smooth_stone");
      continue;
    }

    const odd = idx >= 1 && idx <= 7 && idx % 2 === 1;

    if (rel === 1 || rel === 2) {
      // Ground storey: shopfront on the street front, windows elsewhere.
      if (front && idx === 4) {
        const half = rel === 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      } else if (front && idx >= 1 && idx <= 7) {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(alongX));
      } else if (odd) {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(alongX));
      } else {
        put(x, y, z, "white_concrete");
      }
      continue;
    }

    if (rel === 4 || rel === 5) {
      // Upper storey: window bays between solid mullions.
      if (odd) put(x, y, z, "light_blue_stained_glass_pane", paneProps(alongX));
      else put(x, y, z, "white_concrete");
      continue;
    }
  }

  // Roof plant: small penthouse block on the central cells.
  if (x >= 3 && x <= 5 && z >= 3 && z <= 5) {
    put(x, roofTop + 1, z, "light_gray_concrete");
    if (x === 4 && z === 4) put(x, roofTop + 2, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
