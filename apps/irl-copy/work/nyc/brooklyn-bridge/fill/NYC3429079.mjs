import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${SRC}/NYC3429079.cells.json`, "utf8"));

const W = 16, H = 18, D = 8;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> { ground, roof }
const fp = new Map();
for (const [x, z, ground, roof] of cells) {
  fp.set(`${x},${z}`, {
    ground: Math.max(0, Math.round(ground)),
    roof: Math.round(roof),
  });
}
const has = (x, z) => fp.has(`${x},${z}`);

// Materials: red brick clad office block with stone bands and glazed bays
const M = {
  foundation: "stone_bricks",
  base: "stone_bricks",
  pier: "bricks",
  sill: "stone_brick_slab",
  spandrel: "smooth_stone",
  glass: "light_blue_stained_glass",
  warm: "yellow_stained_glass",
  floor: "smooth_stone",
  parapet: "smooth_stone",
  roof: "stone",
  plant: "light_gray_concrete",
  lintel: "stone_bricks",
};

for (const [x, z, ground, roof] of cells) {
  const c = fp.get(`${x},${z}`);
  const gr = c.ground;

  // Smooth lidar roof height into whole 2-block storey tiers (min 2 storeys)
  const storeys = Math.max(2, Math.round((c.roof - gr) / 2));
  const topY = Math.min(H - 3, gr + storeys * 2);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, M.foundation);

  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const exZ = exN || exS;
  const exX = exW || exE;
  const perim = exZ || exX;
  const corner = exZ && exX;

  // Position along the facade (t) for piers and bay rhythm
  let t = null;
  if (!corner) {
    if (exZ) t = x;
    else if (exX) t = z;
  }
  // Piers: corners, and every third column; glass fills the other two
  const isPier = corner || (t !== null && t % 3 === 0);
  const onFront = exS && z === D - 1;

  for (let y = gr; y < topY - 1; y++) {
    const rel = y - gr;

    if (!perim) {
      // Interior: floor slabs at storey lines, otherwise open air behind glass
      if (rel % 2 === 0) g.set(x, y, z, M.floor);
      continue;
    }

    // Entrance: two doors centred on the front face, stone surround
    if (onFront && (x === 7 || x === 8) && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half: rel === 1 ? "lower" : "upper",
        hinge: x === 7 ? "left" : "right",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (onFront && (x === 6 || x === 9) && rel === 1) {
      g.set(x, y, z, M.pier);
      continue;
    }
    if (onFront && (x === 6 || x === 7 || x === 8 || x === 9) && rel === 3) {
      g.set(x, y, z, M.lintel);
      continue;
    }

    let block;
    if (rel === 0) {
      block = M.base;                       // plinth course
    } else if (rel % 2 === 0) {
      block = M.spandrel;                   // floor line band
    } else if (isPier) {
      block = M.pier;                       // brick pier
    } else {
      block = M.glass;                      // glazed bay
      if (rel >= 3 && t !== null && (t + rel) % 9 === 1) block = M.warm;
    }

    // Shopfront on the ground storey: glass between piers
    if (rel === 1 && !isPier) block = M.glass;

    g.set(x, y, z, block);
  }

  // Parapet on perimeter, roof deck inside
  const roofY = topY - 1;
  g.set(x, roofY, z, perim ? M.parapet : M.roof);

  // Rooftop plant room, centred on the roof
  if (!perim && x >= 5 && x <= 10 && z >= 2 && z <= 5 && topY < H) {
    g.set(x, topY, z, M.plant);
  }
}

g.save(`${SRC}/NYC3429079.nbt`);
