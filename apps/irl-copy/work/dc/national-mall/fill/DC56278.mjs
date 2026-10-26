import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1015 18th St NW: 1960s-70s Foggy Bottom office block. Precast/white concrete grid,
// tinted glass in piers, stone base and parapet, central entrance, mechanical penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC56278";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 33, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const has = (x, z) => cells.some(c => c[0] === x && c[1] === z);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// --- Massing: smooth lidar noise into one flat tower tier plus lower wings ---
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
const flatTop = Math.min(28, Math.max(6, med - 1));   // common roof line (block index)

const info = new Map();
for (const [x, z, gr, rf] of cells) {
  const gnd = Math.round(gr);
  let top = Math.round(rf) - 1;
  if (top >= flatTop - 2) {
    top = flatTop;                                      // tower tier, noise flattened
  } else {
    // genuine lower wing: quantise to storey lines (2 blocks), keep it above ground
    top = gnd + 2 * Math.max(2, Math.round((top - gnd) / 2));
    top = Math.min(top, flatTop - 2);
  }
  top = Math.max(gnd + 4, Math.min(28, top));
  info.set(key(x, z), { gnd, top });
}
const maxTop = Math.max(...[...info.values()].map(v => v.top));

const exposed = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});

// --- Entrance: north-facing exposed edge cell nearest the middle of the front ---
let doorCell = null;
{
  let best = Infinity;
  const mid = (W - 1) / 2;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    if (!exposed(x, z).n) continue;
    const d = Math.abs(x - mid);
    if (d < best) { best = d; doorCell = [x, z]; }
  }
}

const paneProps = (ns) => ns
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function facade(rel, u, ns, isDoorCell) {
  if (rel === 0) return ["polished_granite"];
  const pier = u % 3 === 0;
  if (rel === 1 || rel === 2) {
    if (isDoorCell && rel === 1) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (isDoorCell && rel === 2) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (rel === 2) return ["stone_bricks"];
    return pier ? ["polished_granite"] : ["light_blue_stained_glass_pane", paneProps(ns)];
  }
  if (rel % 2 === 0) return ["white_concrete"];
  return pier ? ["white_concrete"] : ["light_blue_stained_glass_pane", paneProps(ns)];
}

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { gnd, top } = info.get(key(x, z));
  const ex = exposed(x, z);
  const edge = ex.n || ex.s || ex.w || ex.e;
  const topRel = top - gnd;

  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  for (let rel = 0; rel < topRel; rel++) {
    const y = gnd + rel;
    if (edge) {
      const ns = ex.n || ex.s;
      const u = ns ? x : z;
      const isDoor = doorCell && x === doorCell[0] && z === doorCell[1];
      const [id, props] = facade(rel, u, ns, isDoor);
      put(x, y, z, id, props);
    } else {
      if (rel % 2 === 0) {
        put(x, y, z, "white_concrete");                 // floor slab, air above
      } else if (rel >= 1 && (x + z + rel) % 6 === 0) {
        put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }

  put(x, gnd + topRel, z, "stone_bricks");              // roof slab
  if (edge && topRel >= 2) put(x, gnd + topRel - 1, z, "stone_bricks"); // cornice
}

// --- Entrance surround and canopy ---
if (doorCell) {
  const [dx, dz] = doorCell;
  const dg = info.get(key(dx, dz)).gnd;
  // stone surround on the flanking piers at ground level
  for (const ax of [dx - 1, dx + 1]) {
    if (has(ax, dz) && exposed(ax, dz).n) {
      put(ax, dg + 1, dz, "polished_granite");
      put(ax, dg + 2, dz, "stone_bricks");
    }
  }
  // canopy: slabs over the door and its neighbours, supported by the lintel below
  for (const ax of [dx - 1, dx, dx + 1]) {
    if (has(ax, dz) && exposed(ax, dz).n) {
      put(ax, dg + 3, dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // warm lanterns flanking the entrance on the interior floor slab
  for (const ax of [dx - 1, dx + 1]) {
    if (has(ax, dz + 1)) put(ax, dg + 1, dz + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// --- Mechanical penthouse on the tower tier, set back from the perimeter ---
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { top } = info.get(key(x, z));
  if (top !== maxTop) continue;
  if (x < 2 || x > W - 3 || z < 2 || z > D - 3) continue;
  put(x, top + 1, z, "light_gray_concrete");
  put(x, top + 2, z, "light_gray_concrete");
  put(x, top + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
