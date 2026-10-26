// 1425 P St NW: a 1920s-style red-brick apartment block, four storeys on a flat roof with a set-back central core.
// Massing: lidar roof heights are smoothed to two flat tiers (10 and 12 blocks); the 12-block tier is the central core.
// Shell = solid cells with a face to air; interior is carved to air except solid floor slabs and the cornice rows,
// so each window has an air gap behind it. Windows are glass 2 wide between brick piers, with calcite storey lines.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${HERE}/DC76089.cells.json`, "utf8"));   // [x, z, ground, roof]

const X = 21, Z = 13, Y = 16;
const TIER_LOW = 10, TIER_HIGH = 12;
const inCore = (x, z) => x >= 8 && x <= 12 && z >= 3 && z <= 7;

// footprint cell -> { ground, roof } with the lidar roof smoothed onto the two tiers
const foot = new Map();
for (const [x, z, ground, roof] of cells) {
  const high = roof >= TIER_HIGH || inCore(x, z);
  foot.set(`${x},${z}`, { ground, roof: high ? TIER_HIGH : TIER_LOW });
}

const S = (x, y, z) => {                       // solid massing: footprint cell, from its ground up to its roof
  const f = foot.get(`${x},${z}`);
  return !!f && y >= f.ground && y < f.roof;
};
const NB = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];          // horizontal neighbours
const NB6 = [...NB, [0, 1, 0], [0, -1, 0]];

// rows that are always solid: plinth, floor slabs, cornice rows and the core's underside
const SOLID_ROWS = new Set([0, 2, 5, 8, 9, 10]);
const LINE_ROWS = new Set([5, 8, 9, 11]);     // storey lines, cornice and parapet

const g = new Voxels([X, Y, Z]);
const glass = [];                              // [x, y, z, outward dx, dz] for the warm lights

// which face of a wall cell is outward (north = toward z 0, the P Street front)
function facadeBlock(x, y, z, dx, dz) {
  const t = dx !== 0 ? z : x;                  // coordinate running along this face
  const pier = t % 3 === 0;
  if (y === 0) return { id: "stone_bricks" };
  if (LINE_ROWS.has(y)) return { id: "calcite" };
  if (y <= 3 && dz === -1 && x >= 9 && x <= 11) return { id: "calcite" };   // entrance surround and lintel
  if (pier) return { id: "bricks" };
  if (y === 3 || y === 6) return { id: "calcite" };                        // sills: each window is a punched opening
  return { id: "glass", out: [dx, dz] };
}

for (const [key, f] of foot) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < f.roof; y++) {
    if (!S(x, y, z)) continue;
    const shell = NB6.some(([dx, dy, dz]) => !S(x + dx, y + dy, z + dz));
    if (!shell) {
      if (SOLID_ROWS.has(y)) g.set(x, y, z, "smooth_stone");   // slabs under the windows, and the core's underside
      continue;                                                  // otherwise interior: air behind the glass
    }
    const out = NB.find(([dx, , dz]) => !S(x + dx, y, z + dz));
    let b;
    if (out) b = facadeBlock(x, y, z, out[0], out[2]);
    else if (!S(x, y + 1, z)) b = { id: "smooth_stone" };      // flat roof surface
    else b = { id: "stone_bricks" };
    if (b.id === "glass") { glass.push([x, y, z, b.out[0], b.out[1]]); g.set(x, y, z, "glass"); }
    else g.set(x, y, z, b.id);
  }
}

// entrance: a dark oak door in the centre of the P Street front, flanked by calcite pilasters
g.set(10, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(10, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm lights: glowstone set in the air gap behind some windows (only where the interior cell is air)
for (const [x, y, z, dx, dz] of glass) {
  if ((x * 7 + y * 5 + z * 3) % 11 !== 0) continue;
  const bx = x - dx, bz = z - dz;
  if (S(bx, y, bz) && g.val(bx, y, bz) === 0) g.set(bx, y, bz, "glowstone");
}

// roof equipment: a small penthouse on the core's roof, two blocks high with a slab cap
for (const [x, z] of [[9, 5], [10, 5], [9, 6], [10, 6]]) {
  g.set(x, 12, z, "bricks");
  g.set(x, 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

const res = g.save(`${HERE}/DC76089.nbt`);
console.log(JSON.stringify(res));
