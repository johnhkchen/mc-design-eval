import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE94-0129-7F: 2005 Xinyi office/retail block, 7 storeys of 5 blocks, stepped
// podium with two setbacks, light-blue glass curtain wall in white frames.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0129-7F";
const W = 35, H = 47, D = 27;
const STOREY = 5;
const FLOORS = 7;
const ROOF_Y = 1 + STOREY * FLOORS; // 36: roof slab, about 35 above the lowest ground

const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";
const SPANDREL_TOWER = "gray_concrete";
const SPANDREL_PODIUM = "smooth_quartz";
const FLOOR_SLAB = "smooth_quartz";
const BASE_COURSE = "polished_granite";
const FOUNDATION = "stone_bricks";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = (set, x, z) => set.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Footprint and per-cell ground
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.round(gr)));
}
const gAt = (x, z) => ground.get(key(x, z));

const list = [];
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  list.push({ x, z, gr });
}
let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity;
for (const c of list) {
  minx = Math.min(minx, c.x); maxx = Math.max(maxx, c.x);
  minz = Math.min(minz, c.z); maxz = Math.max(maxz, c.z);
}
const cx = Math.round((minx + maxx) / 2);
const cz = Math.round((minz + maxz) / 2);

// Tiers: full podium for storeys 0-1, setback by 2 for storeys 2-3, by 5 for storeys 4-6
const F = new Set(ground.keys());
const inset = (n) => new Set(
  list
    .filter((c) => c.x - minx >= n && maxx - c.x >= n && c.z - minz >= n && maxz - c.z >= n)
    .map((c) => key(c.x, c.z))
);
const TIER = [F, F, inset(2), inset(2), inset(5), inset(5), inset(5)];
const tier = (k) => (k < 0 ? new Set() : TIER[k]);

const isEdge = (set, x, z) =>
  !has(set, x - 1, z) || !has(set, x + 1, z) || !has(set, x, z - 1) || !has(set, x, z + 1);

const lvl = (k) => 1 + STOREY * k;

// Levels at which a slab sits on this cell (storey floors and the roof)
function slabLevels(x, z, gr) {
  const out = [];
  for (let k = 0; k < FLOORS; k++) {
    const inT = has(tier(k), x, z);
    const inP = k > 0 && has(tier(k - 1), x, z);
    if (gr < lvl(k) && (inT || inP)) out.push(lvl(k));
  }
  if (has(tier(FLOORS - 1), x, z) && gr < ROOF_Y) out.push(ROOF_Y);
  return out;
}

// 1. Foundations: solid from y 0 up to the first slab of each cell
for (const c of list) {
  const lv = slabLevels(c.x, c.z, c.gr);
  const top = lv.length ? lv[0] : c.gr + 1;
  for (let y = 0; y < top; y++) put(c.x, y, c.z, FOUNDATION);
}

// 1b. Plinth: where the ground sits above y 1, the first storey starts higher up.
// Give the exposed band on the perimeter a shopfront-style base instead of a blank wall.
for (const c of list) {
  const lv = slabLevels(c.x, c.z, c.gr);
  if (!lv.length) continue;
  const L = lv[0];
  if (L - 1 <= c.gr) continue;
  const edgeZ = !has(F, c.x, c.z - 1) || !has(F, c.x, c.z + 1);
  const edgeX = !has(F, c.x - 1, c.z) || !has(F, c.x + 1, c.z);
  if (!edgeX && !edgeZ) continue;
  const frame = (edgeX && edgeZ) || (edgeZ ? c.x % 3 === 0 : c.z % 3 === 0);
  for (let y = c.gr + 1; y < L; y++) {
    let id = FOUNDATION;
    if (y === L - 1) id = BASE_COURSE;
    else if (y >= L - 3) id = frame ? FRAME : GLASS;
    put(c.x, y, c.z, id);
  }
}

// 2. Storeys: floor slabs, then facade on the edges of each tier
for (let k = 0; k < FLOORS; k++) {
  const b = lvl(k);
  const T = tier(k);
  const P = tier(k - 1);
  for (const c of list) {
    const { x, z, gr } = c;
    if (gr >= b) continue;
    const inT = has(T, x, z);
    const inP = k > 0 && has(P, x, z);
    if (!inT && !inP) continue;

    put(x, b, z, k === 0 ? BASE_COURSE : FLOOR_SLAB);
    if (!inT || !isEdge(T, x, z)) continue;

    const edgeZ = !has(T, x, z - 1) || !has(T, x, z + 1); // north or south face
    const edgeX = !has(T, x - 1, z) || !has(T, x + 1, z); // east or west face
    const corner = edgeX && edgeZ;
    const frame = corner || (edgeZ ? x % 3 === 0 : z % 3 === 0);

    if (k === 0) {
      put(x, b + 1, z, frame ? FRAME : GLASS);
      put(x, b + 2, z, frame ? FRAME : GLASS);
      put(x, b + 3, z, FRAME);
      put(x, b + 4, z, SPANDREL_PODIUM);
    } else {
      put(x, b + 1, z, frame ? FRAME : GLASS);
      put(x, b + 2, z, frame ? FRAME : GLASS);
      put(x, b + 3, z, frame ? FRAME : GLASS);
      put(x, b + 4, z, k < 2 ? SPANDREL_PODIUM : SPANDREL_TOWER);
    }

    // Warm light behind some glazing: glowstone in the room just inside the glass
    if (!frame && (x * 5 + z * 3 + k * 7) % 9 === 0) {
      let dx = 0, dz = 0;
      if (edgeZ && !edgeX) dz = !has(T, x, z - 1) ? 1 : -1;
      else if (edgeX && !edgeZ) dx = !has(T, x - 1, z) ? 1 : -1;
      const nx = x + dx, nz = z + dz;
      if ((dx || dz) && has(T, nx, nz) && !isEdge(T, nx, nz) && gAt(nx, nz) < b) {
        put(nx, b + 2, nz, "glowstone");
      }
    }
  }
}

// 3. Entrance on the front (minz) face, nearest the centre line
{
  const cands = list.filter((c) => c.z === minz && has(F, c.x, c.z));
  cands.sort((a, b) => {
    const da = Math.abs(a.x - cx) + (a.gr > 0 ? 100 : 0);
    const db = Math.abs(b.x - cx) + (b.gr > 0 ? 100 : 0);
    return da - db;
  });
  if (cands.length) {
    const e = cands[0];
    const lv = slabLevels(e.x, e.z, e.gr);
    const eb = lv.length ? lv[0] : 1;
    const facing = "south";
    put(e.x, eb + 1, e.z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(e.x, eb + 2, e.z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    // Header above the doors, spanning the entrance bay
    for (let dx = -2; dx <= 2; dx++) {
      const hx = e.x + dx;
      if (!has(F, hx, e.z)) continue;
      if (gAt(hx, e.z) >= eb + 3) continue;
      put(hx, eb + 3, e.z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// 4. Setback railings on the podium roof and the second terrace
for (const c of list) {
  const { x, z, gr } = c;
  if (gr < lvl(2) && !has(inset(2), x, z) && isEdge(F, x, z)) {
    put(x, lvl(2) + 1, z, "iron_bars");
  }
}
{
  const T3 = inset(2), T4 = inset(5);
  for (const c of list) {
    const { x, z, gr } = c;
    if (gr < lvl(4) && has(T3, x, z) && !has(T4, x, z) && isEdge(T3, x, z)) {
      put(x, lvl(4) + 1, z, "iron_bars");
    }
  }
}

// 5. Roof: slab, parapet with coping
const T6 = tier(FLOORS - 1);
for (const c of list) {
  const { x, z, gr } = c;
  if (!has(T6, x, z) || gr >= ROOF_Y) continue;
  put(x, ROOF_Y, z, FLOOR_SLAB);
  if (isEdge(T6, x, z)) {
    put(x, ROOF_Y + 1, z, FRAME);
    put(x, ROOF_Y + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 6. Roof plant room in the middle, with louvres and a lightning rod
{
  const plant = new Set();
  for (const c of list) {
    if (has(T6, c.x, c.z) && c.gr < ROOF_Y && Math.abs(c.x - cx) <= 6 && Math.abs(c.z - cz) <= 4) {
      plant.add(key(c.x, c.z));
    }
  }
  for (const c of list) {
    if (!has(plant, c.x, c.z)) continue;
    const edge = isEdge(plant, c.x, c.z);
    for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) {
      const louvre = edge && (c.x + c.z) % 2 === 0;
      put(c.x, y, c.z, louvre ? "iron_bars" : "light_gray_concrete");
    }
    put(c.x, ROOF_Y + 4, c.z, "stone_slab", { type: "bottom", waterlogged: "false" });
  }
  if (has(plant, cx, cz)) {
    for (let y = ROOF_Y + 5; y <= ROOF_Y + 8; y++) put(cx, y, cz, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
