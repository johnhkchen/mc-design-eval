// 579 Fifth Avenue, 1954 commercial and office block: an L-plan slab (41 x 27 box, north tower on the east side and a
// lower south wing), 17 storeys on the tower, stepping down by lidar tier to a 10-storey wing and a one-storey pavilion.
// Mid-century curtain wall: pale limestone corners and coping, light-grey spandrels at every storey line, blue-green
// glass in aluminium-look mullions, a granite plinth and clear shopfronts on the ground storey. The entrance is a recessed
// bay on the west (avenue) face, under a stone canopy, with a double door and hanging lanterns. Walls are one cell thick
// with air behind the glass and a floor slab per storey; no interiors. Warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035408.cells.json`, "utf8"));
const X = 41, Y = 56, Z = 27;

// Wall tops, all multiples of 3 so every tier is whole storeys. Each cell's lidar roof snaps to its nearest tier.
const TIERS = [3, 15, 30, 42, 48, 51];
const snap = (r) => TIERS.reduce((a, b) => (Math.abs(b - r) < Math.abs(a - r) ? b : a));
const top = new Map();
for (const [x, z, , roof] of cells) top.set(`${x},${z}`, snap(Math.max(roof, 1)));
const T = (x, z) => top.get(`${x},${z}`) ?? -1;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
// A face is exposed where the neighbour is off the footprint or has no solid at this height (its lid sits at its top).
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const tn = T(x + dx, z + dz); return tn < 0 || y > tn; });
const isCorner = (ex) => ex.length >= 2 && ex.some(([a]) => a !== 0) && ex.some(([, b]) => b !== 0);

const M = {
  plinth: "polished_granite", stone: "quartz_block", cornice: "smooth_stone", slab: "light_gray_concrete",
  glass: "light_blue_stained_glass", clear: "glass", frame: "iron_block", roof: "gray_concrete", light: "glowstone",
};

const g = new Voxels([X, Y, Z]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const door = (x, y, z, half, hinge) => set(x, y, z, "iron_door", { facing: "west", half, hinge, open: "false", powered: "false" });

// Entrance: a recessed bay on the west face, z 19..22. Air at x 0 (y 1-2), glass vestibule at x 1, double door at z 20-21.
const bay = (x, y, z) => x <= 1 && z >= 19 && z <= 22 && (y === 1 || y === 2);

for (const [key, t] of top) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y <= t; y++) {
    if (y === 0) { set(x, 0, z, M.plinth); continue; }                    // granite plinth on every footprint cell
    if (x === 0 && z >= 19 && z <= 22 && y === 3) { set(x, y, z, M.cornice); continue; }   // canopy over the bay
    if (bay(x, y, z)) {
      if (x === 1) {
        if (z === 20 || z === 21) door(x, y, z, y === 1 ? "lower" : "upper", z === 20 ? "left" : "right");
        else set(x, y, z, M.clear);
      }
      if (x === 0 && (z === 19 || z === 22) && y === 2) set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;                                                          // x 0 in the bay stays air (the recess)
    }
    const ex = exposed(x, z, y);
    if (y === t) { set(x, y, z, ex.length ? M.stone : M.roof); continue; }  // lid: coping on the edge, tar roof inside
    if (y % 3 === 0) { set(x, y, z, isCorner(ex) ? M.stone : M.slab); continue; }   // floor slab / spandrel line
    if (!ex.length) continue;                                            // interior: air gap, no interior
    if (isCorner(ex)) { set(x, y, z, M.stone); continue; }               // limestone corner piers
    const [dx, dz] = ex[0];
    const idx = dx !== 0 ? z : x;                                        // position along the exposed face
    if (y === t - 1) { set(x, y, z, M.cornice); continue; }              // cornice band under the coping
    if (y < 3) {                                                         // ground storey: shopfront
      set(x, y, z, idx % 4 === 0 ? M.plinth : M.clear);
      continue;
    }
    if (idx % 3 === 0) { set(x, y, z, M.frame); continue; }              // aluminium mullion
    set(x, y, z, M.glass);
    // Warm light one cell inside some panes (air behind the glass otherwise).
    if ((x * 7 + y * 13 + z * 5) % 6 === 0) {
      const ix = x - dx, iz = z - dz;
      if (T(ix, iz) > y && !exposed(ix, iz, y).length && !bay(ix, y, iz)) set(ix, y, iz, M.light);
    }
  }
}

// A rooftop box (mechanical penthouse) on the tallest tier, and a smaller plant box on the 48 tier: walls, a glass band,
// a lid. Each is placed only where every cell of the box shares the tier, so it stands on the lid below.
const fits = (x0, x1, z0, z1, t) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (T(x, z) !== t) return false; return true; };
const box = (x0, x1, z0, z1, y0, walls, band) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (edge) { set(x, y0, z, walls); set(x, y0 + 2, z, walls); set(x, y0 + 1, z, band); }
    set(x, y0 + 3, z, M.roof);
  }
};
if (fits(31, 37, 3, 9, 51)) box(31, 37, 3, 9, 52, M.slab, M.glass);
let plant = null;
for (let x0 = 2; x0 <= 30 && !plant; x0++) for (let z0 = 17; z0 <= 22 && !plant; z0++) if (fits(x0, x0 + 3, z0, z0 + 3, 48)) plant = [x0, z0];
if (plant) box(plant[0], plant[0] + 3, plant[1], plant[1] + 3, 49, M.frame, M.frame);

const out = g.save(`${DIR}/NYC1035408.nbt`);
console.log(JSON.stringify({ ...out, plant, cells: cells.length }));
