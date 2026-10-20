import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Taipei commercial/office block, c. 1980s-90s: 5 storeys of 5 blocks,
// white tiled piers, grey sill/lintel bands, glass window strips, a stone plinth,
// a shopfront ground storey with a centre entrance, a cornice, and roof plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1076147140";
const W = 29, D = 14, H = 38;
const ROOF = 25;   // top block of the parapet (roof at y 25, total height 26)
const ENTRY_X = 14;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const base = Math.min(...raw.map(c => c[2]));
const ground = new Map();
const k = (x, z) => `${x},${z}`;
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(k(x, z), Math.min(gr - base, ROOF - 2));
}
const has = (x, z) => ground.has(k(x, z));
const gnd = (x, z) => ground.get(k(x, z));

// Outward normal of a perimeter cell; null for interior cells.
function outward(x, z) {
  if (!has(x - 1, z)) return [-1, 0];
  if (!has(x + 1, z)) return [1, 0];
  if (!has(x, z - 1)) return [0, -1];
  if (!has(x, z + 1)) return [0, 1];
  return null;
}

const hash = (x, y, z) => ((x * 7 + y * 13 + z * 31) % 5 + 5) % 5;

const g = new Voxels([W, H, D]);

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const o = outward(x, z);
  const isFront = o && o[0] === 0 && o[1] === 1;

  // Foundation under the cell, up to its ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    const r = y % 5;
    const kStorey = Math.floor(y / 5);

    if (!o) {
      // Interior: floor slabs and roof deck only; air otherwise (no interiors).
      if (y === gr) g.set(x, y, z, "light_gray_concrete");
      else if (r === 0) g.set(x, y, z, y === ROOF ? "gray_concrete" : "light_gray_concrete");
      continue;
    }

    // Entrance: centre door on the front (south) face at ground level.
    if (isFront && x === ENTRY_X && kStorey === 0 && y <= gr + 1) {
      const half = y === gr ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    // Plinth course at the ground line.
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }

    // Coping at the parapet.
    if (y === ROOF) { g.set(x, y, z, "smooth_stone"); continue; }

    // Shopfront canopy on the front ground storey.
    if (isFront && kStorey === 0 && r === 4 && x >= 11 && x <= 17) {
      g.set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
      continue;
    }

    // Floor line at the bottom of each storey.
    if (r === 0) { g.set(x, y, z, "gray_concrete"); continue; }

    // Cornice above the top storey.
    if (y === ROOF - 1) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Lintel band.
    if (r === 4) { g.set(x, y, z, "white_concrete"); continue; }

    // Window zone r = 1..3.
    const along = o[0] !== 0 ? z : x;
    const isPier = along % 3 !== 1;
    if (isPier) { g.set(x, y, z, "white_concrete"); continue; }

    if (r === 1) { g.set(x, y, z, "gray_concrete"); continue; } // sill
    const glass = kStorey === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
    g.set(x, y, z, glass);

    // Warm light behind some panes, in the interior air just inside.
    if (r === 2 && y > gr && hash(x, y, z) === 0) {
      const ix = x - o[0], iz = z - o[1];
      if (has(ix, iz) && outward(ix, iz) === null) g.set(ix, y, iz, "glowstone");
    }
  }
}

// Roof plant: cooling box, water tank on a plinth, and a lightning rod.
const roofBox = (x0, x1, z0, z1, ids) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!has(x, z) || gnd(x, z) > ROOF) continue;
    for (const [y, id, props] of ids) g.set(x, y, z, id, props);
  }
};
roofBox(15, 19, 3, 4, [[ROOF + 1, "light_gray_concrete"]]);
roofBox(4, 6, 4, 6, [
  [ROOF + 1, "iron_block"],
  [ROOF + 2, "iron_block"],
  [ROOF + 3, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }],
]);
if (has(21, 6)) {
  for (let y = ROOF + 1; y <= ROOF + 3; y++) g.set(21, y, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
