// 1616 18th St NW, Dupont Circle: a 1920s red-brick apartment block with limestone trim, a 3-storey body, a 5x4 tower
// with a 3x2 penthouse core, and a one-storey wing. Storeys are 3 blocks (window pair + string course), so the 13-block
// body reads as three upper floors over a stone base; the tower's top storey is the penthouse.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC71779.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

// Lidar roof heights smoothed into flat tiers: wing (<=4) at 3, body at 13, tower at 15, penthouse core at 18.
const TOWER = (x, z) => x >= 4 && x <= 8 && z >= 8 && z <= 11;
const CORE = (x, z) => x >= 5 && x <= 7 && z >= 9 && z <= 10;
const col = new Map();
for (const [x, z, g, r] of cells) {
  const top = r <= 4 ? 3 : TOWER(x, z) ? (CORE(x, z) ? 18 : 15) : 13;
  col.set(`${x},${z}`, { g, r: top });
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const solid = (x, y, z) => { const c = col.get(`${x},${z}`); return !!c && y < c.r; };
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

const FLOORS = new Set([1, 5, 8, 11, 14]);               // floor slabs; 1 is the stone base, the rest string courses outside
const WINDOW_ROWS = new Set([2, 3, 6, 7, 9, 10, 12, 13, 15, 16]);

const out = new Map(), windows = [];
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => out.has(`${x},${y},${z}`);

for (const [k, { g, r }] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < r; y++) {
    if (y < g) { put(x, y, z, "stone"); continue; }                 // foundation under the ground
    const ex = exposed(x, y, z);
    if (y === r - 1) { put(x, y, z, ex.length ? "calcite" : "stone"); continue; }   // cornice and roof
    if (FLOORS.has(y)) { put(x, y, z, !ex.length ? "stone" : y === 1 ? "stone_bricks" : "calcite"); continue; }
    if (!ex.length) continue;                                       // interior air
    if (y === 0 || y === 4 || ex.length >= 2) { put(x, y, z, "stone_bricks"); continue; }   // plinth, lintel, quoins
    const [dx, dz] = ex[0];
    const c = dx ? z : x;                                           // position along the wall
    if (WINDOW_ROWS.has(y) && (c % 4 === 1 || c % 4 === 2)) {
      const state = dx
        ? { north: "true", south: "true", east: "false", west: "false" }
        : { east: "true", west: "true", north: "false", south: "false" };
      put(x, y, z, "glass_pane", state);
      windows.push({ x, y, z, dx, dz });
      continue;
    }
    put(x, y, z, "bricks");
  }
}

// Entrance on the south face: stone jambs, dark oak door, wood lintel.
for (let x = 6; x <= 8; x++) {
  put(x, 2, 15, "stone_bricks"); put(x, 3, 15, "stone_bricks");
  put(x, 4, 15, "dark_oak_slab", { type: "bottom" });
}
put(7, 2, 15, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(7, 3, 15, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// Warm light behind some panes: glowstone and shroomlight in the air cell just inside the glass.
let lit = 0;
for (const w of windows) {
  if ((w.x + 3 * w.z + 7 * w.y) % 8 !== 0) continue;
  const ix = w.x - w.dx, iz = w.z - w.dz;
  if (!col.has(`${ix},${iz}`) || has(ix, w.y, iz)) continue;
  put(ix, w.y, iz, lit++ % 2 ? "shroomlight" : "glowstone");
}

// Roof plant: two iron units and a brick flue on the body roof; a green roof with azaleas on the wing.
put(5, 13, 1, "iron_block"); put(6, 13, 1, "iron_block");
put(10, 13, 2, "bricks"); put(10, 14, 2, "bricks");
for (const [x, z] of [[12, 5], [12, 6], [13, 6], [12, 7], [12, 8]]) put(x, 3, z, "moss_block");
put(12, 4, 6, "flowering_azalea"); put(12, 4, 8, "flowering_azalea");

const g = new Voxels([14, 26, 16]);
for (const [k, b] of out) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const { blocks, palette } = g.save(`${DIR}/DC71779.nbt`);
console.log(`DC71779.nbt: ${blocks} blocks, ${palette} palette entries, ${lit} lit windows`);
