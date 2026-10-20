import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456420";
const W = 19, H = 23, D = 21;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : raw.cells;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint lookup
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const inside = (x, z) => G.has(key(x, z));

// Levels: B = base (lowest ground, y 0 reference), two storeys of 5, cornice R, parapet P
const B = Math.min(...cells.map((c) => c[2]));
const R = B + 10;      // roof / cornice course
const P = B + 11;      // parapet top (~11 above lowest ground)

// Entrance: middle of the north-facing (min z) edge
const northEdge = cells
  .filter(([x, z]) => !inside(x, z - 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = northEdge.length ? northEdge[Math.floor(northEdge.length / 2)] : null;
const doorZ = doorX === null ? null : cells.find(([x, z]) => x === doorX && !inside(x, z - 1))[1];

// Roof plant positions (interior only)
const plant = (x, z) =>
  (x >= 4 && x <= 5 && z >= 5 && z <= 6) || (x >= 12 && x <= 13 && z >= 13 && z <= 14);

for (const [x, z, gr] of cells) {
  const faces = [];
  if (!inside(x, z - 1)) faces.push("north");
  if (!inside(x, z + 1)) faces.push("south");
  if (!inside(x - 1, z)) faces.push("west");
  if (!inside(x + 1, z)) faces.push("east");
  const perim = faces.length > 0;
  const corner = faces.length > 1;

  // Foundation under every cell, so nothing floats on the slope
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  for (let y = Math.max(gr, 0); y <= P && y < H; y++) {
    const rel = y - B;

    if (!perim) {
      // Interior: floor slabs and roof, air gap between (no interior fit-out)
      if (y === B || y === B + 5) put(x, y, z, "smooth_stone");
      if (y === R) put(x, y, z, "smooth_stone");
      if (y === B + 2 && (x * 2 + z) % 7 === 0) put(x, y, z, "shroomlight");
      if (y === B + 7 && (x + z * 3) % 7 === 2) put(x, y, z, "glowstone");
      if (y === P && plant(x, z)) put(x, y, z, "iron_block");
      continue;
    }

    // Perimeter facade
    if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }          // plinth
    if (y === R) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; } // cornice
    if (y === P) { put(x, y, z, "stone_brick_wall"); continue; }        // parapet

    const isDoorCol = doorX !== null && x === doorX && z === doorZ;

    // Door and lantern at entrance
    if (isDoorCol && (rel === 1 || rel === 2)) {
      const half = rel === 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoorCol && rel === 3) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    const mullion = corner || (x + z) % 3 === 0;
    if (rel === 4 || rel === 9) { put(x, y, z, "polished_andesite"); continue; } // lintel / sill
    if (rel === 5) { put(x, y, z, "smooth_quartz"); continue; }                  // storey line

    const opening = (rel >= 1 && rel <= 3) || (rel >= 6 && rel <= 8);
    if (opening) {
      if (mullion) put(x, y, z, "polished_andesite");
      else put(x, y, z, "light_blue_stained_glass");
      continue;
    }
    put(x, y, z, "smooth_quartz");
  }
}

// Rooftop HVAC plant
for (const [x, z] of cells) {
  if (plant(x, z) && !(!inside(x, z - 1) || !inside(x, z + 1) || !inside(x - 1, z) || !inside(x + 1, z))) {
    put(x, P, z, "iron_block");
    put(x, P + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
