// 1666 Connecticut Ave NW, Dupont Circle: a 1960s-70s office block in buff-red brick and tinted glass, a granite base,
// smooth-stone storey bands, a 3-block shopfront on the ground floor, and a taller core (roof 14) over lower wings (roof 11).
// Storeys are 2 blocks (a window row over a band); the lidar roof heights make the massing, every storey is a full
// slab over the footprint, and the interior is air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72934.cells.json", "utf8"));
const H = 26;

const foot = new Map();                                    // "x,z" -> { g: ground, r: roof top }
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, r });
const at = (x, z) => foot.get(`${x},${z}`);
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

const SLAB_ROWS = new Set([4, 6, 8, 10, 12]);             // storey bands across the whole footprint
const WINDOW_ROWS = new Set([5, 7, 9, 11]);               // upper window rows
const SHOP_ROWS = new Set([2, 3]);                        // ground-floor shopfront

// a face cell is exposed at height y when the outside, or a lower neighbour's roof, is open to it
const exposed = (x, z, y) => DIRS.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.r <= y; });

const put = new Map();                                    // "x,y,z" -> { block, state }
const k3 = (x, y, z) => `${x},${y},${z}`;
const set = (x, y, z, block, state) => put.set(k3(x, y, z), { block, state });
const glass = "light_blue_stained_glass_pane", pier = "bricks";

for (const [key, { r }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const top = r - 1;
  for (let y = 0; y < r; y++) {
    const ext = exposed(x, z, y);
    if (y === top) set(x, y, z, ext ? "stone_bricks" : "gray_concrete");          // cornice on the face, membrane inside
    else if (y === 0) set(x, y, z, "stone_bricks");                                // foundation / plinth, nothing floats
    else if (y === 1) set(x, y, z, "polished_granite");                            // base course
    else if (SLAB_ROWS.has(y)) set(x, y, z, "smooth_stone");                       // storey bands over the whole plate
    else if (SHOP_ROWS.has(y) || WINDOW_ROWS.has(y)) {
      if (ext) {
        // piers on a fixed 3-block module along each face, so the panes run as bays and not as a checkerboard
        const along = at(x, z - 1) === undefined || at(x, z + 1) === undefined ? x : z;
        if (along % 3 === 0) set(x, y, z, pier);
        else set(x, y, z, glass);
      }
    }
  }
}

// entrance: the south edge cell nearest the middle of the footprint, flanked by granite jambs and two lanterns
const zMax = Math.max(...cells.map(([, z]) => z));
const doorX = cells.filter(([, z]) => z === zMax).map(([x]) => x).sort((a, b) => Math.abs(a - 8) - Math.abs(b - 8))[0];
const dz = zMax;
for (const dxs of [-1, 1]) for (const y of [2, 3]) set(doorX + dxs, y, dz, "polished_granite");
set(doorX, 2, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
set(doorX, 3, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dxs of [-1, 1]) set(doorX + dxs, 3, dz, "lantern", { hanging: "true", waterlogged: "false" });

// penthouse: a 2x2 mechanical box on the wing roof, interior to the plan so it stands on the roof membrane
let penthouse = null;
for (const [key, { r }] of foot) {
  if (r !== 11 || penthouse) continue;
  const [x, z] = key.split(",").map(Number);
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (quad.every(([qx, qz]) => at(qx, qz)?.r === 11 && DIRS.every(([ddx, ddz]) => at(qx + ddx, qz + ddz)))) penthouse = quad;
}
if (penthouse) for (const [qx, qz] of penthouse) for (const y of [11, 12]) set(qx, y, qz, "stone_bricks");

// warm light: glowstone and shroomlight just inside some panes, so the glass glows at dusk
let n = 0;
for (const [k, v] of [...put]) {
  if (v.block !== glass) continue;
  const [x, y, z] = k.split(",").map(Number);
  if ((x * 7 + y * 3 + z) % 4 !== 0) continue;
  for (const [ddx, ddz] of DIRS) {
    const nx = x + ddx, nz = z + ddz;
    if (!at(nx, nz) || exposed(nx, nz, y) || put.has(k3(nx, y, nz))) continue;
    set(nx, y, nz, n++ % 2 ? "shroomlight" : "glowstone");
    break;
  }
}

// panes connect to their neighbours in the same row, so the glazing reads as one frame and not as loose posts
for (const [k, v] of put) {
  if (v.block !== glass) continue;
  const [x, y, z] = k.split(",").map(Number);
  const state = { waterlogged: "false" };
  for (const [ddx, ddz, side] of DIRS) {
    const nb = put.get(k3(x + ddx, y, z + ddz));
    state[side] = nb && (nb.block === glass || nb.block === pier) ? "true" : "false";
  }
  v.state = state;
}

const g = new Voxels([17, H, 17]);
for (const [k, { block, state }] of put) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72934.nbt");
console.log(JSON.stringify({ ...out, door: [doorX, dz], penthouse: !!penthouse, lights: n }));
