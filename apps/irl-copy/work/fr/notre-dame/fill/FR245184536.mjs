// FR245184536: a 1600 stone residential block on the Ile de la Cite. Walls are pale Paris limestone (calcite
// piers, smooth-stone string courses, stone-brick plinth and quoins), the roof grey slate behind a stone parapet.
// The lidar roof sets three clean tiers (14 / 11 / 7 blocks); each tier is a solid stack from its own foundation,
// so nothing floats. Storeys read as window rows (2 high) over a string course (1 high), four floors plus a garret.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184536.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184536.nbt";
const W = 20, D = 16, Y = 30;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// lidar roof -> one of three flat tiers (the record's noise is smoothed into these)
const tier = (r) => (r >= 13 ? 14 : r >= 9 ? 11 : 7);

// two passes of a 3 x 3 majority over the footprint: a lone lidar cell one tier off becomes its neighbours' tier,
// so the tiers form clean blocks instead of a picket fence of spikes
const raw = new Map();
for (const [x, z, ground, roof] of cells) raw.set(`${x},${z}`, { g: ground, h: tier(roof) });
const smooth = (src) => {
  const out = new Map();
  for (const [k, c] of src) {
    const [x, z] = k.split(",").map(Number);
    const votes = new Map();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const n = src.get(`${x + dx},${z + dz}`);
      if (n) votes.set(n.h, (votes.get(n.h) ?? 0) + (dx === 0 && dz === 0 ? 1.5 : 1));
    }
    let best = c.h, bestN = votes.get(c.h) ?? 0;
    for (const [h, n] of votes) if (n > bestN) { best = h; bestN = n; }
    out.set(k, { g: c.g, h: best });
  }
  return out;
};
const fp = smooth(smooth(raw));
const at = (x, z) => fp.get(`${x},${z}`);
// a neighbouring cell is open air at height y when it is outside the footprint or its roof is below y
const airAt = (x, z, y) => { const c = at(x, z); return !c || y >= c.h; };

// per storey row: the ground floor and upper floors are two window rows over a string course; the top row is the roof
const role = (y, h) => (y === h - 1 ? "roof" : (y - 1) % 3 === 2 ? "band" : "win");

const v = new Voxels([W, Y, D]);
const FRONT_DOOR = { x: 4, z: 0 };   // the street face is z = 0 (north)

const paneNS = { north: "true", south: "true", east: "false", west: "false" };   // a pane run along x (on a z face)
const paneEW = { north: "false", south: "false", east: "true", west: "true" };   // a pane run along z (on an x face)

for (const [x, z] of [...fp.keys()].map((k) => k.split(",").map(Number))) {
  const { g: ground, h } = at(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) v.set(x, y, z, "stone_bricks");

  for (let y = ground; y < h; y++) {
    const exX = airAt(x + 1, z, y) || airAt(x - 1, z, y);
    const exZ = airAt(x, z + 1, y) || airAt(x, z - 1, y);
    const r = role(y, h);

    if (r === "roof") {
      // parapet on the perimeter, slate over the interior
      v.set(x, y, z, exX || exZ ? "stone_bricks" : "deepslate_tiles");
      continue;
    }
    if (exX || exZ) {
      // a cell exposed on both axes (the staircase edge of the footprint) reads on its street-facing z side
      if (r === "band") { v.set(x, y, z, "smooth_stone"); continue; }    // storey string course
      const u = exZ ? x : z;                                              // position along the facade
      if (u % 4 === 0 || u % 4 === 3) { v.set(x, y, z, "calcite"); continue; }   // piers
      const warm = (x * 31 + y * 17 + z * 7) % 9;
      if (warm === 0 && (x + z) % 4 === 0) { v.set(x, y, z, "shroomlight"); continue; }   // a few lit windows
      if (warm === 5 && y % 4 === 2 && x % 3 === 0) { v.set(x, y, z, "glowstone"); continue; }
      v.set(x, y, z, "glass_pane", exZ ? paneEW : paneNS);
      continue;
    }
    // interior: floor slabs at each storey line and on the ground, air between (no rooms furnished)
    if (y === ground || r === "band") v.set(x, y, z, "smooth_stone");
  }

  // a stone chimney stack on some interior cells of the top tier
  const interior = !airAt(x + 1, z, h - 1) && !airAt(x - 1, z, h - 1) && !airAt(x, z + 1, h - 1) && !airAt(x, z - 1, h - 1);
  if (h === 14 && interior && (x * 5 + z * 3) % 11 === 0) {
    v.set(x, h, z, "stone_bricks");
    v.set(x, h + 1, z, "stone_bricks");
    v.set(x, h + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// the entrance: a dark oak door in the street face, two blocks high at the ground floor
const dx = FRONT_DOOR.x, dz = FRONT_DOOR.z, dg = at(dx, dz).g;
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
v.set(dx, dg, dz, "dark_oak_door", { ...door, half: "lower" });
v.set(dx, dg + 1, dz, "dark_oak_door", { ...door, half: "upper" });

const res = v.save(OUT);
console.log(`built FR245184536: ${res.blocks} blocks, ${res.palette} palette entries -> ${OUT}`);
