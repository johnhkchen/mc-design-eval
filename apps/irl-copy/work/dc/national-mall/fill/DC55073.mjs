// 333 E St SW (Hotel-Large): a 1960s-70s modernist hotel block on the Southwest Federal Center side of the Mall.
// Pale precast concrete bands, tinted glass strip windows with mullions, a granite base, a flat roof with plant.
// The lidar roof is smoothed to four clean tiers: court 1, lobby 2, wing 4, main block 17 (8 storeys of 2 blocks,
// about 4.8 m each), and the central core 19 (its 18s are noise). Every tier stands on the solid row below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55073.cells.json`, "utf8"));

const tier = (roof) => (roof <= 1 ? 1 : roof === 2 ? 2 : roof <= 4 ? 4 : roof <= 17 ? 17 : 19);
const top = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, tier(roof)]));
const H = (x, z) => top.get(`${x},${z}`) ?? 0;          // outside the footprint: nothing, top 0

const FACES = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 }, { name: "west", dx: -1, dz: 0 },
];
// Faces of a cell at row y that show outside: the neighbour is outside the footprint or lower, and y is above its roof.
const exposed = (x, z, y, h) => FACES.filter((f) => { const n = H(x + f.dx, z + f.dz); return n < h && n <= y && y <= h - 2; });
const stepFaces = (x, z, h) => FACES.filter((f) => H(x + f.dx, z + f.dz) < h);
// A lower neighbour's roof is the floor under the step: that row is solid across the cell, so the wall above stands on it.
const onStep = (x, z, y, h) => FACES.some((f) => { const n = H(x + f.dx, z + f.dz); return n > 0 && n < h && n - 1 === y; });

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);
const windows = [];

// 1. Shell: every storey a solid floor, the outside rows glazed in strips, the roof capped.
for (const [x, z] of cells) {
  const h = H(x, z);
  for (let y = 0; y < h; y++) {
    if (y === h - 1) {
      if (h === 1) put(x, y, z, "smooth_stone");                                    // court paving
      else put(x, y, z, stepFaces(x, z, h).length ? "stone_bricks" : "smooth_stone"); // parapet on the edge, roof inside
      continue;
    }
    const faces = exposed(x, z, y, h);
    if (faces.length) {
      if (y === 0) put(x, y, z, "polished_andesite");                                // base course
      else if (y % 2 === 0) put(x, y, z, "white_concrete");                         // spandrel / storey line
      else if (faces.length > 1) put(x, y, z, "light_gray_concrete");              // corner mullion
      else if ((faces[0].dz !== 0 ? x : z) % 3 === 0) put(x, y, z, "light_gray_concrete"); // mullion every 3
      else { put(x, y, z, "light_blue_stained_glass_pane"); windows.push([x, y, z, faces[0]]); }
    } else if (y % 2 === 0 || y === h - 2 || onStep(x, z, y, h)) {
      put(x, y, z, "white_concrete");                                               // floor slab / ceiling / step floor
    }
  }
}

// 2. Entrance: a dark oak door in the main block's south face (nearest the middle), a granite lintel over it.
const [dx, dz] = cells.filter(([x, z]) => H(x, z) === 17 && H(x, z + 1) === 0)
  .sort((a, b) => Math.abs(a[0] - 7) - Math.abs(b[0] - 7))[0];
put(dx, 1, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx, 2, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const ox of [-1, 0, 1]) if (H(dx + ox, dz) === 17) put(dx + ox, 3, dz, "polished_andesite");

// 3. Penthouse on the central core: a glazed 3 x 3 box with a stone roof, standing on the core's roof.
const core = [];
for (let x = 6; x <= 8; x++) for (let z = 10; z <= 12; z++) if (H(x, z) === 19) core.push([x, z]);
if (core.length === 9) for (const [x, z] of core) {
  const corner = (x !== 7) && (z !== 11);
  if (corner) put(x, 19, z, "white_concrete");
  else if (!(x === 7 && z === 11)) put(x, 19, z, "light_blue_stained_glass_pane");
  put(x, 20, z, "stone_bricks");
}

// 4. Roof plant on the main block: iron units with a lantern on some, kept off the edges.
for (const [x, z] of cells) {
  if (H(x, z) !== 17 || !FACES.every((f) => H(x + f.dx, z + f.dz) >= 17)) continue;
  if (x % 4 === 2 && z % 6 === 3) {
    put(x, 17, z, "iron_block");
    if (z % 12 === 3) put(x, 18, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 5. Warm light: some windows show a glowstone just behind the glass, on the floor slab.
for (const [x, y, z, f] of windows) {
  const ix = x - f.dx, iz = z - f.dz;
  if (H(ix, iz) > y && !at(ix, y, iz) && at(ix, y - 1, iz) && (x + z + y) % 13 === 0)
    put(ix, y, iz, "glowstone");
}

// 6. Glass pane connections: a pane joins the neighbour in each direction that is a solid block or pane (not a door).
const joins = (x, y, z) => { const b = at(x, y, z)?.block; return !!b && !b.includes("door") && b !== "lantern"; };
for (const [key, p] of plan) {
  if (p.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  p.state = Object.fromEntries([
    ...FACES.map((f) => [f.name, String(joins(x + f.dx, y, z + f.dz))]),
    ["waterlogged", "false"],
  ]);
}

// Write the structure.
const v = new Voxels([15, 31, 32]);
for (const [key, p] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  v.set(x, y, z, p.block, p.state);
}
const out = v.save(`${DIR}/DC55073.nbt`);
console.log(`DC55073.nbt: ${out.blocks} blocks, ${out.palette} palette entries, ${windows.length} window cells, door at x${dx} z${dz}`);
