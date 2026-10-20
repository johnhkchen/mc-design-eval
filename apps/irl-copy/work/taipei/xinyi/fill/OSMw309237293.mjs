// 永興商業大樓 (Yongxing Commercial Building), Xinyi, Taipei
// Read as a c.1985-1995 Taipei commercial tower: reinforced concrete frame,
// white tiled wall, tinted glazing in aluminium frames, shopfronts at street level,
// steel roof water tank and a lightning rod. About 12 storeys of 5 blocks each.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309237293";
const W = 31, H = 71, D = 25;
const ROOF = 58;      // roof deck layer (cornice on the perimeter)
const PARAPET = 59;   // parapet layer on the perimeter, roof equipment above

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, Math.max(0, Math.min(ROOF, Math.round(gr))));
}

const g = new Voxels([W, H, D]);
const set = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

const ins = (x, z) => G.has(`${x},${z}`);
const per = (x, z) => ins(x, z) && (!ins(x - 1, z) || !ins(x + 1, z) || !ins(x, z - 1) || !ins(x, z + 1));
const cor = (x, z) =>
  per(x, z) && ((!ins(x - 1, z) || !ins(x + 1, z)) && (!ins(x, z - 1) || !ins(x, z + 1)));
const hash = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

// Interior cell just behind a non-corner facade cell (for shroomlight glow).
function behind(x, z) {
  let dx = 0, dz = 0;
  if (!ins(x - 1, z)) dx = 1; else if (!ins(x + 1, z)) dx = -1;
  else if (!ins(x, z - 1)) dz = 1; else if (!ins(x, z + 1)) dz = -1;
  if (dx && dz) return null;
  const ix = x + dx, iz = z + dz;
  if (!ins(ix, iz) || per(ix, iz)) return null;
  return [ix, iz];
}

// ---- Body: foundation, base, floors, windows, cornice, parapet ----
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const isP = per(x, z);
  const isC = cor(x, z);

  // Foundation under the cell, up to its own ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) { set(x, y, z, "smooth_stone"); continue; }          // base course / floor slab
    if (y === ROOF) { set(x, y, z, isP ? "smooth_stone" : "gray_concrete"); continue; } // cornice / roof deck
    if (y % 5 === 0) { set(x, y, z, "smooth_stone"); continue; }       // storey line slab (all cells)
    if (!isP) continue;                                               // interior: air gap
    if (isC) { set(x, y, z, "white_concrete"); continue; }            // corner column

    if (y < 5) {
      // Commercial ground floor: stone fascia, glass shopfront, granite pilasters.
      if (y === 4) set(x, y, z, "stone_bricks");
      else if ((x + z) % 4 === 0) set(x, y, z, "polished_andesite");
      else set(x, y, z, "light_blue_stained_glass");
    } else if (y % 5 === 4) {
      set(x, y, z, "white_concrete");                                 // spandrel band
    } else {
      if ((x + z) % 3 === 0) {
        set(x, y, z, "light_gray_concrete");                          // aluminium mullion
      } else {
        set(x, y, z, "light_blue_stained_glass");
        const b = behind(x, z);
        if (b && hash(x, y, z) % 6 === 0) set(b[0], y, b[1], "shroomlight");
      }
    }
    if (y < 5 && !isC && (x + z) % 4 !== 0 && y !== 4) {
      const b = behind(x, z);
      if (b && hash(x, y, z) % 4 === 0) set(b[0], y, b[1], "shroomlight");
    }
  }

  if (isP) set(x, PARAPET, z, "white_concrete");                      // parapet
}

// ---- Entrance: centre of the front (min z) row ----
{
  let minZ = Infinity;
  for (const k of G.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
  const front = [...G.keys()]
    .map(k => k.split(",").map(Number))
    .filter(([, z]) => z === minZ)
    .sort((a, b) => a[0] - b[0]);
  const [mx, mz] = front[Math.floor(front.length / 2)];
  const gr = G.get(`${mx},${mz}`);
  if (gr + 2 <= ROOF) {
    set(mx, gr + 1, mz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    set(mx, gr + 2, mz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Transom above the door, lit from behind.
    set(mx, gr + 3, mz, "light_blue_stained_glass");
    const b = behind(mx, mz);
    if (b) set(b[0], gr + 3, b[1], "shroomlight");
  }
}

// ---- Roof: water tank, lightning rod, AC units ----
const xs = [...G.keys()].map(k => Number(k.split(",")[0]));
const zs = [...G.keys()].map(k => Number(k.split(",")[1]));
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
const inTank = (x, z) => Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1;

let tankOk = true;
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  if (!ins(cx + dx, cz + dz) || per(cx + dx, cz + dz)) tankOk = false;
}
if (tankOk) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (let y = PARAPET; y <= PARAPET + 3; y++) set(cx + dx, y, cz + dz, "iron_block");
    set(cx + dx, PARAPET + 4, cz + dz, "stone_slab", { type: "bottom" });
  }
}

// Lightning rod on an interior roof cell away from the tank.
{
  const tx = Math.min(...xs) + 3, tz = Math.min(...zs) + 3;
  const cands = [...G.keys()]
    .map(k => k.split(",").map(Number))
    .filter(([x, z]) => !per(x, z) && !inTank(x, z))
    .sort((a, b) => (Math.abs(a[0] - tx) + Math.abs(a[1] - tz)) - (Math.abs(b[0] - tx) + Math.abs(b[1] - tz)));
  if (cands.length) {
    const [ax, az] = cands[0];
    for (let y = PARAPET; y <= PARAPET + 7; y++) set(ax, y, az, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    var rodX = ax, rodZ = az;
  }
}

// Small condenser units scattered on the roof deck.
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (per(x, z) || inTank(x, z)) continue;
  if (typeof rodX !== "undefined" && x === rodX && z === rodZ) continue;
  if ((x * 7 + z * 3) % 13 === 0) set(x, PARAPET, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
