// DC63802: a Federal Triangle-style Neoclassical office block, L-shaped on its footprint. A granite base, four storeys
// of window bays over calcite piers and smooth-quartz string courses, a parapet, and a stepped penthouse on the
// lidar's tallest cells (roof 10). A shell with floor slabs and air behind the glass; no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
// [x, z, ground, roof] per footprint cell
const cells = JSON.parse(readFileSync(`${DIR}/DC63802.cells.json`, "utf8"));
const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);

// a side of a footprint cell is exposed when the neighbour on that side is not in the footprint
const SIDES = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const exposed = (x, z) => Object.keys(SIDES).filter((n) => !inF(x + SIDES[n][0], z + SIDES[n][1]));

// every block, keyed "x,y,z", so the panes can be wired to their neighbours before the volume is written
const B = new Map();
const set = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => B.has(`${x},${y},${z}`);

// rows: 0 granite base; 1,3,5,7 window rows (glass in the bays, calcite piers); 2,4,6 string courses (smooth quartz
// outside, smooth stone floor slabs inside); 8 parapet outside, roof slab inside. Penthouse on y 9.
for (const [key, { roof }] of F) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, z);
  const ring = ex.length > 0;

  set(x, 0, z, ring ? "polished_granite" : "stone_bricks");
  for (let y = 1; y <= 7; y++) {
    if (y % 2 === 0) set(x, y, z, ring ? "smooth_quartz" : "smooth_stone");
    else if (ring) {
      // a bay is a glass cell whose every exposed side has an odd along-wall index; corners and the rest are piers
      const bay = ex.every((n) => ((n === "N" || n === "S" ? x : z) % 2) === 1);
      set(x, y, z, bay ? "glass_pane" : "calcite");
    }
  }
  set(x, 8, z, ring ? "stone_brick_wall" : "smooth_stone");

  // penthouse: a 4 x 2 pavilion on the roof-10 cells; calcite pillars at its ends, glass between
  if (roof >= 10) {
    const pent =[...F.entries()].filter(([, v]) => v.roof >= 10).map(([k]) => +k.split(",")[0]);
    const minX = Math.min(...pent), maxX = Math.max(...pent);
    set(x, 9, z, x === minX || x === maxX ? "quartz_pillar" : "glass_pane");
  }
}

// entrance on the north face, centred on the 11-wide front: a two-high door flanked by quartz columns, with a canopy
// ledge over the head
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
set(5, 1, 0, "dark_oak_door", { ...door, half: "lower" });
set(5, 2, 0, "dark_oak_door", { ...door, half: "upper" });
set(4, 1, 0, "quartz_pillar");
set(6, 1, 0, "quartz_pillar");
for (const x of [4, 5, 6]) set(x, 3, 0, "stone_brick_slab", { type: "bottom" });

// roof plant on the flat roof, standing on the roof slab
set(2, 9, 2, "light_gray_concrete");
set(3, 9, 2, "light_gray_concrete");

// warm lights set back in the air gaps behind the glass (never in a floor slab)
set(1, 1, 1, "glowstone");
set(9, 1, 1, "glowstone");
set(3, 3, 1, "shroomlight");
set(7, 5, 1, "shroomlight");
set(5, 7, 1, "lantern", { hanging: "false", waterlogged: "false" });

// panes connect to whatever stands beside them in the same row
const SIDE_KEYS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const [key, v] of [...B.entries()]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const st = Object.fromEntries(Object.entries(SIDE_KEYS).map(([side, [dx, dz]]) => [side, has(x + dx, y, z + dz) ? "true" : "false"]));
  B.set(key, { block: "glass_pane", state: st });
}

const g = new Voxels([11, 22, 6]);
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/DC63802.nbt`);
console.log(JSON.stringify(out));
