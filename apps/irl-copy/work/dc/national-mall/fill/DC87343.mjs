import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87343.cells.json`, "utf8"));

const W = 20, H = 31, D = 20;
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> { ground, roof }
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(key(x, z), { ground: gr, roof: Math.min(rf, H - 5) });
}
const has = (x, z) => map.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = Math.floor((minX + maxX) / 2);

for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  const { ground: gr, roof: top } = map.get(k);

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  if (!edge) {
    // Interior: floor slabs per storey (air gap otherwise), roof deck, rooftop plant
    for (let y = gr; y < top - 1; y++) {
      if ((y - gr) % 3 === 0) g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, top - 1, z, "gray_concrete");

    // Rooftop plant: 2x2 enclosed boxes with a slab lid, on the deck
    const bx = (x - minX) % 6, bz = (z - minZ) % 6;
    if ((bx === 2 || bx === 3) && (bz === 2 || bz === 3) && top + 2 < H && (x - minX) % 6 !== 0 && (z - minZ) % 6 !== 0) {
      g.set(x, top, z, "light_gray_concrete");
      g.set(x, top + 1, z, "light_gray_concrete");
      g.set(x, top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Perimeter: facade
  const front = z === minZ;
  const doorX = midX;

  for (let y = gr; y < top; y++) {
    const h = y - gr;
    let blk = null, props;

    if (y === top - 1) {
      blk = "smooth_stone"; // parapet
    } else if (y === top - 2 && h > 3) {
      blk = "white_concrete"; // cornice band
    } else if (h === 0) {
      blk = "polished_granite"; // base course
    } else if (front && x === doorX && (h === 1 || h === 2)) {
      // Main entrance door, two-high, flanked by piers
      blk = "oak_door";
      props = {
        facing: "north",
        half: h === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    } else if (front && h === 3 && Math.abs(x - doorX) <= 2) {
      // Entrance canopy: dark slab band over the door bay
      blk = "dark_oak_slab";
      props = { type: "top", waterlogged: "false" };
    } else if (h % 3 === 0) {
      blk = "white_concrete"; // floor line / spandrel
    } else {
      const ground = h < 3;
      // Full-height piers every fourth bay, glass between
      const pier = (x + z) % 4 === 0 || (front && Math.abs(x - doorX) === 1);
      if (pier) {
        blk = ground ? "stone_bricks" : "light_gray_concrete";
      } else {
        blk = "light_blue_stained_glass";
      }
    }

    g.set(x, y, z, blk, props);

    // Warm light behind selected glass (lantern on the interior floor slab)
    if (blk === "light_blue_stained_glass" && h % 3 === 1 && y < top - 2) {
      const dx = x === minX ? 1 : (x === maxX ? -1 : 0);
      const dz = z === minZ ? 1 : (z === maxZ ? -1 : 0);
      const ix = x + dx, iz = z + dz;
      if ((dx !== 0 || dz !== 0) && has(ix, iz) && !isEdge(ix, iz) && ((x * 5 + z * 3 + y) % 13 === 0)) {
        g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/DC87343.nbt`);
