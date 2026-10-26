// DC67548: a 1930s stripped-classical federal office block. A granite base course, calcite walls with string courses at
// every floor, glazed bays between calcite piers, a monumental iron door in the north notch, and three stepped tiers
// (9 / 15 / 17 blocks, from the lidar) with a copper-capped penthouse set back on the tower. Interiors are air, with a
// floor slab per storey. Lights sit in some windows, just behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC67548.cells.json", "utf8"));

const fp = new Set(cells.map(([x, z]) => x + "," + z));
const inFP = (x, z) => fp.has(x + "," + z);

// Tiers from the lidar roof heights: the low north wing (z 0-4) at 9, the main mass at 15, and the south tower
// (x 2-7, z 10-25, lidar 16-17) at 17, with a penthouse (x 3-6, z 12-23) set back on it to 19.
const tower = (x, z) => x >= 2 && x <= 7 && z >= 10 && z <= 25;
const pent = (x, z) => x >= 3 && x <= 6 && z >= 12 && z <= 23;
const baseTop = (x, z) => (tower(x, z) ? 17 : z <= 4 ? 9 : 15);
const topOf = (x, z) => (pent(x, z) ? 19 : baseTop(x, z));

// Storey rhythm: solid floor rows at 1 (base slab), 4, 7, 10, 13, 16; two window rows between each pair.
const SLABS = new Set([1, 4, 7, 10, 13, 16]);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d]; const nx = x + dx, nz = z + dz;
  return !inFP(nx, nz) || y >= topOf(nx, nz);
});
const key = (x, y, z) => `${x},${y},${z}`;
const M = new Map();
const put = (x, y, z, block, state, face) => M.set(key(x, y, z), { block, state, face });

for (const [x, z] of cells) {
  const top = baseTop(x, z);
  if (pent(x, z)) { put(x, 17, z, "calcite"); put(x, 18, z, "oxidized_copper"); }
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, z, y);
    const isTop = y === top - 1;
    if (y === 0) { put(x, y, z, "granite"); continue; }                                  // foundation, solid under every cell
    if (y === 1) { put(x, y, z, ex.length ? "polished_granite" : "stone"); continue; }    // base course and ground slab
    if (SLABS.has(y)) {                                                                  // floor slab, string course, roof
      if (ex.length) put(x, y, z, isTop ? "smooth_quartz" : "calcite");
      else put(x, y, z, isTop ? "smooth_stone" : "stone");
      continue;
    }
    if (!ex.length) continue;                                                            // window row, interior: air
    if (isTop) { put(x, y, z, "smooth_quartz"); continue; }                              // parapet coping
    if (x === 12 && z === 1 && (y === 2 || y === 3)) {                                   // the entrance, set in the north notch
      put(x, y, z, "iron_door", { facing: "north", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const along = ex[0] === "north" || ex[0] === "south" ? x : z;
    if (ex.length > 1 || along % 3 === 0) put(x, y, z, "calcite");                       // corners and piers
    else put(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" }, ex[0]);
  }
}

// Roof plant on the two roofs: copper boxes standing on the roof surface.
for (const [x, y, z] of [[6, 8, 2], [18, 8, 2], [4, 14, 7], [11, 14, 8], [17, 14, 7], [21, 14, 9]]) put(x, y, z, "oxidized_copper");

// Glass panes connect to the walls beside them along their own face; warm lights stand just behind some windows,
// on the floor slab, where the glass shows them from outside.
const WALL = new Set(["glass_pane", "calcite", "smooth_quartz"]);
const BOTTOM_ROWS = new Set([2, 5, 8, 11, 14]);
for (const [k, v] of [...M]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const along = v.face === "north" || v.face === "south" ? ["east", "west"] : ["north", "south"];
  for (const d of along) {
    const [dx, dz] = DIRS[d];
    const n = M.get(key(x + dx, y, z + dz));
    v.state[d] = n && WALL.has(n.block) ? "true" : "false";
  }
  const [ox, oz] = DIRS[v.face];
  const inside = key(x - ox, y, z - oz);
  if (BOTTOM_ROWS.has(y) && !M.has(inside) && (x * 7 + z * 5 + y) % 5 === 0) put(x - ox, y, z - oz, "glowstone");
}

const g = new Voxels([24, 29, 28]);
for (const [k, v] of M) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC67548.nbt");
console.log(out);
