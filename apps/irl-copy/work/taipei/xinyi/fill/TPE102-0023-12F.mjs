import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE102-0023-12F";
const W = 30, H = 71, D = 34;
const STOREYS = 12;
const STOREY_H = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const gb = (x, z) => ground.get(`${x},${z}`);

// depth = shortest run of footprint cells to the edge in any cardinal direction
const depthMap = new Map();
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  let best = Infinity;
  for (const [dx, dz] of DIRS) {
    let n = 0, cx = x, cz = z;
    while (inFp(cx, cz)) { n++; cx += dx; cz += dz; }
    best = Math.min(best, n);
  }
  depthMap.set(`${x},${z}`, best);
}
const depth = (x, z) => depthMap.get(`${x},${z}`) ?? 0;

// which faces of a footprint cell are exposed to outside air
const exposed = (x, z) => ({
  xf: !inFp(x + 1, z) || !inFp(x - 1, z),
  zf: !inFp(x, z + 1) || !inFp(x, z - 1),
});

// setbacks: full plate to storey 7, 2-cell setback for storeys 8-9, 4-cell for 10-11
const md = s => (s < 8 ? 1 : s < 10 ? 3 : 5);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!inFp(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// mullion on a facade cell: corners always, otherwise every third bay on each face
function isMullion(x, z) {
  const { xf, zf } = exposed(x, z);
  if (xf && zf) return true;
  if (xf) return z % 3 === 0;
  if (zf) return x % 3 === 0;
  return false;
}

// ---- 1. foundation: solid from y 0 up to each cell's ground -----------------
for (const [x, z, B] of cells) {
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");
}

// ---- 2. floor slabs per storey (cells in current or previous tier) ----------
for (let s = 0; s < STOREYS; s++) {
  const lim = Math.min(md(s), s > 0 ? md(s - 1) : 1);
  for (const [x, z, B] of cells) {
    if (depth(x, z) >= lim) put(x, B + STOREY_H * s, z, "light_gray_concrete");
  }
}

// ---- 3. facades: ring of each tier -------------------------------------------
const entranceMid = Math.floor((minX + maxX) / 2);
const inEntranceZone = (x, z, s) =>
  s === 0 && z === minZ && x >= entranceMid - 4 && x <= entranceMid + 4;

for (let s = 0; s < STOREYS; s++) {
  for (const [x, z, B] of cells) {
    if (depth(x, z) !== md(s)) continue;
    const y0 = B + STOREY_H * s;
    const mull = isMullion(x, z);
    const ent = inEntranceZone(x, z, s);

    for (let r = 1; r <= 4; r++) {
      if (s === 11 && r === 4) continue;              // roof cap handles this course
      const y = y0 + r;
      if (ent) {
        const edgeCol = x === entranceMid - 4 || x === entranceMid + 4;
        if (r === 1 || r === 2) {
          // open doorway; framed by quartz jambs at the outer columns
          if (edgeCol) put(x, y, z, "white_concrete");
          continue;
        }
        if (r === 3) { put(x, y, z, "light_gray_concrete"); continue; } // canopy band
      }
      if (s === 0 && r === 1) { put(x, y, z, "polished_andesite"); continue; } // base course
      if (r === 4) { put(x, y, z, "light_gray_concrete"); continue; }         // spandrel
      put(x, y, z, mull ? "white_concrete" : "light_blue_stained_glass");
    }

    // warm light just behind some glazed bays
    if (!ent && (x * 5 + z * 7 + s * 3) % 7 === 0) {
      let ix = x, iz = z;
      if (x === minX) ix = x + 1; else if (x === maxX) ix = x - 1;
      else if (z === minZ) iz = z + 1; else iz = z - 1;
      if (inFp(ix, iz) && depth(ix, iz) > md(s)) put(ix, y0 + 2, iz, "shroomlight");
    }
  }
}

// entrance: glass doors recessed in the opening, lantern under the canopy
{
  const B = gb(entranceMid, minZ);
  if (B !== undefined) {
    for (let x = entranceMid - 3; x <= entranceMid + 3; x++) {
      if (!inFp(x, minZ)) continue;
      if (x === entranceMid) {
        put(x, B + 1, minZ, "iron_bars");           // mullion between doors
        put(x, B + 2, minZ, "iron_bars");
      } else {
        put(x, B + 1, minZ, "light_blue_stained_glass");
        put(x, B + 2, minZ, "light_blue_stained_glass");
      }
    }
    put(entranceMid, B + 2, minZ + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// ---- 4. terrace rails on the edge of each setback ---------------------------
for (let s = 1; s < STOREYS; s++) {
  for (const [x, z, B] of cells) {
    const d = depth(x, z);
    if (d === md(s - 1) && d < md(s)) put(x, B + STOREY_H * s + 1, z, "white_concrete");
  }
}

// ---- 5. roof: cap at tier-11 level, parapet, penthouse, mast ----------------
const topY = STOREY_H * (STOREYS - 1);  // storey 11 base offset (55)
for (const [x, z, B] of cells) {
  const d = depth(x, z);
  if (d >= 5) put(x, B + topY + 4, z, "light_gray_concrete");          // roof slab (59)
  if (d === 5) put(x, B + topY + 5, z, "white_concrete");              // parapet (60)
  if (d >= 7) put(x, B + topY + 5, z, "light_gray_concrete");          // penthouse floor (60)
}
for (const [x, z, B] of cells) {
  const d = depth(x, z);
  if (d === 7) {
    for (let r = 6; r <= 8; r++) {
      const y = B + topY + r;                                           // 61..63 walls
      if (r === 8) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, isMullion(x, z) ? "white_concrete" : "light_blue_stained_glass");
    }
  }
  if (d >= 7) put(x, B + topY + 9, z, "light_gray_concrete");          // penthouse roof (64)
}
// mast on the deepest cell
{
  let best = null, bd = -1;
  for (const [x, z, B] of cells) if (depth(x, z) > bd) { bd = depth(x, z); best = [x, z, B]; }
  if (best) {
    const [x, z, B] = best;
    for (let r = 10; r <= 13; r++) put(x, B + topY + r, z, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
