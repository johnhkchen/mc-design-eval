import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw370145090.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw370145090.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 40, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground value
const F = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  F.set(x + "," + z, gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => F.has(x + "," + z);
const baseOf = (x, z) => F.get(x + "," + z) - minG;

// Outward normals for a footprint cell (direction of each missing neighbour)
function outs(x, z) {
  const o = [];
  if (!has(x + 1, z)) o.push([1, 0]);
  if (!has(x - 1, z)) o.push([-1, 0]);
  if (!has(x, z + 1)) o.push([0, 1]);
  if (!has(x, z - 1)) o.push([0, -1]);
  return o;
}

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Wall material for an edge cell at height y
function wallId(x, z, y, gb, o) {
  const corner = o.length > 1;
  if (y === gb) return "stone_bricks";                 // base course
  if (corner) return "polished_andesite";              // full-height corner columns
  if (y === 4) return "smooth_quartz";                 // ground-storey lintel band
  if (y === 9) return "smooth_quartz";                 // upper-storey head band
  const pier = (x + z) % 4 === 0;                      // vertical piers on a 4-block rhythm
  if (pier) return "white_concrete";
  return "light_blue_stained_glass";
}

// Rooftop core setback: stands on the roof deck at y=10, rises to y=13
const inCore = (x, z) => x >= 13 && x <= 26 && z >= 6 && z <= 12;

for (const [x, z] of [...F.keys()].map(k => k.split(",").map(Number))) {
  const gb = baseOf(x, z);
  const o = outs(x, z);
  const edge = o.length > 0;
  const front = o.length === 1 && o[0][0] === 0 && o[0][1] === 1; // south-facing front
  const entranceZone = front && x >= 16 && x <= 22;

  // Foundation fill from y0 to this cell's ground
  for (let y = 0; y < gb; y++) put(x, y, z, "stone_bricks");

  // Floor at ground level
  put(x, gb, z, edge ? "stone_bricks" : "smooth_stone");

  // Storey floor slab at y=5
  if (gb < 5) put(x, 5, z, edge ? "smooth_quartz" : "smooth_stone");

  // Roof deck / cornice at y=10
  if (gb < 10) put(x, 10, z, edge ? "smooth_quartz" : "gray_concrete");

  // Parapet ring
  if (edge && gb < 11) put(x, 11, z, o.length > 1 ? "polished_andesite" : "white_concrete");

  // Rooftop core setback (stair and lift core, stands on the roof deck)
  if (!edge && gb < 10 && inCore(x, z)) {
    put(x, 11, z, "smooth_quartz");
    put(x, 12, z, "light_blue_stained_glass");
    put(x, 13, z, "smooth_quartz");
  }

  if (edge) {
    for (let y = gb + 1; y <= 9; y++) {
      if (y === 5 || y === 10) continue;

      if (entranceZone) {
        if (x === 19 && y === gb + 1) {
          put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (x === 19 && y === gb + 2) {
          put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (x === 16 || x === 22) { put(x, y, z, "polished_andesite"); continue; } // entrance pilasters
        if (y === 4) { put(x, y, z, "polished_andesite"); continue; }              // entrance lintel
        if (y === 9) { put(x, y, z, "smooth_quartz"); continue; }
        if (y <= 3 || y === 6 || y === 7 || y === 8) { put(x, y, z, "light_blue_stained_glass"); continue; }
      }

      put(x, y, z, wallId(x, z, y, gb, o));
    }

    // Warm light behind some windows (sea lanterns on the interior floor)
    const [dx, dz] = o[0];
    const ix = x - dx, iz = z - dz;
    if (o.length === 1 && has(ix, iz) && outs(ix, iz).length === 0 && !entranceZone) {
      const k = (x + z) % 6;
      if (k === 3 && gb + 1 <= 3 && (x + z) % 4 !== 0) put(ix, gb + 1, iz, "sea_lantern");
      if (k === 1 && 6 > gb && (x + z) % 4 !== 0) put(ix, 6, iz, "sea_lantern");
    }
  }

  // Lobby lantern just inside the entrance
  if (entranceZone && x === 19 && z === 17 && has(19, 17) && gb + 1 <= 4) {
    put(19, gb + 1, 17, "lantern");
  }

  // Roof plant boxes on the interior roof deck, outside the core
  if (!edge && gb < 10 && !inCore(x, z) && x % 7 === 3 && z % 6 === 2) {
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
  }
}

g.save(OUT);
