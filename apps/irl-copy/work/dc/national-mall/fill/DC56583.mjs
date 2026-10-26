// 2121 P St NW, Hotel-Large: an early-20th-century apartment-hotel in red brick on a stone base, five storeys of
// window bays on 2-block storey lines, a flat parapet at roof 12 and a set-back penthouse (lidar 14) on top.
// Hollow: 1-block shell, floor slab per storey, air behind the glass; the base is solid from y 0 to the ground-floor
// datum (y 2), so the downhill cells show their extra plinth and nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC56583.cells.json`, "utf8"));
const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));

const F = (x, z) => roof.has(`${x},${z}`);
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const N8 = [...N4, [1, 1], [1, -1], [-1, 1], [-1, -1]];
const DIRS = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Smoothed lidar tiers: a cell is penthouse when most of its 3x3 reads 13+ (noise out), and it steps in off the outer ring.
const high = (x, z) => F(x, z) && roof.get(`${x},${z}`) >= 13;
const ring = (x, z) => N8.some(([dx, dz]) => !F(x + dx, z + dz));
const isPent = (x, z) => {
  if (!F(x, z) || ring(x, z)) return false;
  let n = 0;
  for (const [dx, dz] of [[0, 0], ...N8]) if (high(x + dx, z + dz)) n++;
  return n >= 5;
};
const edgeExt = (x, z) => N4.filter(([dx, dz]) => !F(x + dx, z + dz));
const pentExt = (x, z) => N4.filter(([dx, dz]) => !isPent(x + dx, z + dz));

// Facade grid on the exterior faces: piers every third cell along each face, quoins at the corners, glass between.
const facadeBlock = (x, z, ext, pent) => {
  const ew = ext.some(([dx]) => dx !== 0), ns = ext.some(([, dz]) => dz !== 0);
  const along = ew ? z : x;
  if (ew && ns) return "stone_bricks";
  if (along % 3 === 0) return pent ? "stone_bricks" : "bricks";
  return "gray_stained_glass_pane";
};

const g = new Voxels([31, 26, 23]);
let penthouse = 0;

for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number);
  const ext = edgeExt(x, z), edge = ext.length > 0, pent = isPent(x, z);
  if (pent) penthouse++;

  // foundation to the ground-floor datum: a stone plinth on the outside, solid core within
  g.set(x, 0, z, edge ? "polished_andesite" : "stone");
  g.set(x, 1, z, edge ? "andesite" : "stone");

  // floor slab per storey, its face row a stone belt course on the outside (ground floor datum at y 2)
  for (const y of [2, 4, 6, 8, 10]) g.set(x, y, z, edge ? "stone_bricks" : "smooth_stone");

  // window rows of the four storeys below the penthouse; the ground floor is a glass shopfront on the street face
  for (const y of [3, 5, 7, 9]) {
    if (!edge) continue;   // interior: air behind the glass
    const block = facadeBlock(x, z, ext, false);
    const shopfront = y === 3 && z === 22 && x >= 11 && x <= 17 && block === "gray_stained_glass_pane";
    g.set(x, y, z, shopfront ? "glass" : block);
  }

  // roof: a coping slab on the parapet, a flat deck inside (top at 12)
  g.set(x, 11, z, edge ? "stone_brick_slab" : "stone", edge ? { type: "top", waterlogged: "false" } : undefined);

  if (pent) {
    // penthouse: windows at 12 (its own piers), a coping at 13 on the outer ring, deepslate roof inside (top at 14)
    const pe = pentExt(x, z), pedge = pe.length > 0;
    if (pedge) {
      g.set(x, 12, z, facadeBlock(x, z, pe, true));
      g.set(x, 13, z, "deepslate_tile_slab", { type: "top", waterlogged: "false" });
    } else {
      g.set(x, 13, z, "deepslate_tiles");
    }
  } else if (!edge && (x * 5 + z * 3) % 13 === 0) {
    // terrace roof equipment: a few AC boxes on the deck
    g.set(x, 12, z, "light_gray_concrete");
  }
}

// Entrance on the street face (z 22): dark oak door at x 14 under a stone lintel, a lobby lantern just inside.
g.set(14, 2, 22, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(14, 3, 22, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(14, 3, 21, "lantern", { hanging: "true", waterlogged: "false" });

// Warm light: glowstone and hanging lanterns just inside some windows (only where the cell behind is air, not wall).
const lit = (x, y, z) => g.get(x, y, z)?.block;
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number);
  const edge = edgeExt(x, z).length > 0, pent = isPent(x, z);
  for (const y of [3, 5, 7, 9, 12]) {
    const b = lit(x, y, z);
    if (b !== "gray_stained_glass_pane" && b !== "glass") continue;
    const ext = y === 12 ? pentExt(x, z) : edgeExt(x, z);
    if (!ext.length) continue;
    const [dx, dz] = ext[0], ix = x - dx, iz = z - dz;
    const inside = y === 12 ? isPent(ix, iz) && !pentExt(ix, iz).length : F(ix, iz) && edgeExt(ix, iz).length === 0;
    if (!inside || lit(ix, y, iz)) continue;
    const h = (x * 31 + y * 17 + z * 13) % 7;
    if (h === 0) g.set(ix, y, iz, y === 12 ? "shroomlight" : "glowstone");
    else if (h === 3 && y !== 12) g.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Glass panes connect to whatever is beside them, as they do in the world.
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (const y of [3, 5, 7, 9, 12]) {
    if (lit(x, y, z) !== "gray_stained_glass_pane") continue;
    const st = {};
    for (const [dx, dz] of N4) st[DIRS[`${dx},${dz}`]] = lit(x + dx, y, z + dz) ? "true" : "false";
    st.waterlogged = "false";
    g.set(x, y, z, "gray_stained_glass_pane", st);
  }
}

const stats = g.save(`${DIR}/DC56583.nbt`);
console.log(`cells ${cells.length}, penthouse ${penthouse}, blocks ${stats.blocks}, palette ${stats.palette}`);
