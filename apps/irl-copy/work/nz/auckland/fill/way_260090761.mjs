// Way 260090761: a 1970s brick-and-concrete mixed-use block on the Eden Terrace / CBD fringe. Four storeys over a
// glazed shopfront (stone-brick plinth, dark-oak fascia canopy, glazed ground floor); a 19-block podium, a 5-storey
// tower on the north-west corner (lidar 25) stepped down by a setback tier (lidar 23). Brick walls with pale storey
// lines, brick piers on a 3-block bay, light-blue glass; warm glowstone behind some panes. Hollow: floor slabs at every
// storey line, light-grey columns on a 6-block grid, air between. Everything stands on the 2-block foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_260090761.cells.json`, "utf8"));

const X = 35, Y = 37, Z = 66;
const FLOORS = [2, 6, 10, 14, 18, 22];     // storey lines: floor slabs at y = 2 + 4k
const FOUNDATION = 2;                       // solid from y 0 under every cell (fills the slope; the plinth sits on it)
const GLASS = "light_blue_stained_glass_pane";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const id = (x, z) => x + ":" + z;
const lidar = new Map();
for (const [x, z, g, r] of cells) lidar.set(id(x, z), { g, r });
const inF = (x, z) => lidar.has(id(x, z));
const xMin = Math.min(...cells.map(c => c[0])), xMax = Math.max(...cells.map(c => c[0]));
const zMin = Math.min(...cells.map(c => c[1])), zMax = Math.max(...cells.map(c => c[1]));

// 1. Roof: 3x3 median of the lidar roof over footprint neighbours, quantised to three flat tiers.
//    D is the deck level (the top course); the roof top sits at D + 1 (the lidar value).
const tier = new Map();
for (const [x, z] of cells) {
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inF(x + dx, z + dz)) vals.push(lidar.get(id(x + dx, z + dz)).r);
  vals.sort((a, b) => a - b);
  const s = vals[vals.length >> 1];
  tier.set(id(x, z), s >= 24 ? 24 : s >= 22 ? 22 : 18);
}
const D = (x, z) => tier.get(id(x, z));
// a cell is solid at height y when it is in the footprint and y is at or below its tier's deck
const solidAt = (x, y, z) => inF(x, z) && y <= D(x, z);
const outsAt = (x, y, z) => DIRS.filter(([dx, dz]) => !solidAt(x + dx, y, z + dz));

const v = new Voxels([X, Y, Z]);
const paneState = (out) => (out[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// Facade of one exposed wall cell above the foundation. k = height inside its storey: 0 storey line, 1-2 window
// band, 3 spandrel; the ground floor is a shopfront (glass, fascia at k 3).
function facade(x, y, z, outs) {
  const F0 = FLOORS.filter(f => f <= y).pop(), k = y - F0;
  const [ox] = outs[0];
  const along = ox !== 0 ? z - zMin : x - xMin;
  const pier = outs.length > 1 || along % 3 === 0;   // corners and a pier every third cell
  if (F0 === FOUNDATION) {
    if (k === 0) return v.set(x, y, z, "stone_bricks");
    if (k === 3) return v.set(x, y, z, "smooth_quartz");
    return pier ? v.set(x, y, z, "stone_bricks") : v.set(x, y, z, GLASS, paneState(outs[0]));
  }
  if (k === 0) return v.set(x, y, z, "smooth_quartz");
  if (k === 3) return v.set(x, y, z, "bricks");
  return pier ? v.set(x, y, z, "bricks") : v.set(x, y, z, GLASS, paneState(outs[0]));
}

// 2. Shell and slabs, column by column, from the foundation to each cell's deck.
for (const [x, z] of cells) {
  const d = D(x, z);
  for (let y = 0; y <= d; y++) {
    const outs = outsAt(x, y, z);
    if (y < FOUNDATION) { v.set(x, y, z, "cobblestone"); continue; }
    if (y === d) { v.set(x, y, z, outs.length ? "smooth_quartz" : "gray_concrete"); continue; }   // deck; cornice on the edge
    if (FLOORS.includes(y)) {
      v.set(x, y, z, outs.length ? (y === FOUNDATION ? "stone_bricks" : "smooth_quartz") : "stone");
      continue;
    }
    if (outs.length) facade(x, y, z, outs);
  }
}

// 3. Columns on a 6-block grid through the interior (they carry the floor slabs), where the cell is interior at every height.
for (const [x, z] of cells) {
  if ((x - xMin) % 6 !== 3 || (z - zMin) % 6 !== 3) continue;
  if (outsAt(x, FOUNDATION, z).length) continue;
  for (let y = FOUNDATION + 1; y < D(x, z); y++) if (!outsAt(x, y, z).length && !FLOORS.includes(y)) v.set(x, y, z, "light_gray_concrete");
}

// 4. Entrance on the north face: a dark-oak door near the middle of the frontage, under a dark-oak canopy at y 5.
const oz = (outs) => outs.length === 1 && outs[0][1] === -1;
const mid = (xMin + xMax) / 2;
let door = null;
for (const [x, z] of cells) {
  if (z !== zMin || !oz(outsAt(x, 3, z))) continue;
  if (!door || Math.abs(x - mid) < Math.abs(door[0] - mid)) door = [x, z];
}
if (door) {
  const [dx, dz] = door;
  v.set(dx, 3, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(dx, 4, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const cx of [dx - 1, dx, dx + 1]) if (inF(cx, dz) && outsAt(cx, 5, dz).length) v.set(cx, 5, dz, "dark_oak_planks");
}

// 5. Warm light behind a share of the glass (glowstone in the air gap just inside the pane).
let lights = 0;
for (const [x, z] of cells) for (let y = 3; y <= D(x, z); y++) {
  const outs = outsAt(x, y, z);
  if (outs.length !== 1 || FLOORS.includes(y) || y === D(x, z)) continue;
  const g = v.get(x, y, z);
  if (!g || g.block !== "minecraft:" + GLASS || (x * 7 + z * 5 + y * 3) % 9 !== 0) continue;
  const [dx, dz] = outs[0], ix = x - dx, iz = z - dz;
  if (inF(ix, iz) && v.val(ix, y, iz) === 0) { v.set(ix, y, iz, "glowstone"); lights++; }
}

// 6. Roof plant: a 6 x 4 plant room on the podium roof and a 3 x 3 one on the tower roof, standing on the decks.
function plant(depth, w, h, top, centre) {
  let best = null;
  for (let x0 = xMin; x0 <= xMax - w + 1; x0++) for (let z0 = zMin; z0 <= zMax - h + 1; z0++) {
    let ok = true;
    for (let x = x0; x < x0 + w && ok; x++) for (let z = z0; z < z0 + h && ok; z++)
      ok = inF(x, z) && D(x, z) === depth && !outsAt(x, depth, z).length;
    if (!ok) continue;
    const dist = Math.hypot(x0 + w / 2 - centre[0], z0 + h / 2 - centre[1]);
    if (!best || dist < best.dist) best = { x0, z0, dist };
  }
  if (!best) return 0;
  for (let x = best.x0; x < best.x0 + w; x++) for (let z = best.z0; z < best.z0 + h; z++)
    for (let y = depth + 1; y <= depth + top; y++) v.set(x, y, z, "light_gray_concrete");
  return 1;
}
const plantN = plant(18, 6, 4, 2, [mid, (zMin + zMax) / 2]) + plant(24, 3, 3, 2, [xMin + 4, zMin + 8]);

// 7. Check: every solid reaches the foundation through solid neighbours (nothing floats).
const seen = new Uint8Array(X * Y * Z), q = [];
const ix = (x, y, z) => (z * Y + y) * X + x;
for (const [x, z] of cells) if (v.val(x, 0, z)) { seen[ix(x, 0, z)] = 1; q.push([x, 0, z]); }
for (let h = 0; h < q.length; h++) {
  const [x, y, z] = q[h];
  for (const [a, b, c] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = x + a, ny = y + b, nz = z + c;
    if (nx < 0 || ny < 0 || nz < 0 || nx >= X || ny >= Y || nz >= Z || seen[ix(nx, ny, nz)] || !v.val(nx, ny, nz)) continue;
    seen[ix(nx, ny, nz)] = 1; q.push([nx, ny, nz]);
  }
}
let floating = 0;
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) if (v.val(x, y, z) && !seen[ix(x, y, z)]) floating++;

const out = `${DIR}/way_260090761.nbt`;
const res = v.save(out);
console.log(JSON.stringify({ blocks: res.blocks, palette: res.palette, glowstone: lights, roofPlants: plantN, door: !!door, floating, file: out }));
