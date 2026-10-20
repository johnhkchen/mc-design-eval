import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 德基名廈: 1990s-era Taipei mid-rise office/retail block. Podium of two storeys,
// a seven-storey shaft, two setbacks, and a roof plant room. Roof at y 59.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw525276549";
const W = 23, H = 71, D = 33;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cellList = cells.map(([x, z]) => [x, z]);
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);

const keyOf = (x, z) => `${x},${z}`;
const parse = (k) => k.split(",").map(Number);
const has = (x, z) => G.has(keyOf(x, z));
const ground = (x, z) => G.get(keyOf(x, z)) ?? 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Cells whose Chebyshev neighbourhood of radius k lies entirely inside the footprint.
function insetSet(k) {
  const S = new Set();
  for (const [x, z] of cellList) {
    let ok = true;
    for (let dx = -k; dx <= k && ok; dx++)
      for (let dz = -k; dz <= k && ok; dz++)
        if (!has(x + dx, z + dz)) ok = false;
    if (ok) S.add(keyOf(x, z));
  }
  return S;
}

const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function isRing(S, x, z) {
  return !DIRS4.every(([dx, dz]) => S.has(keyOf(x + dx, z + dz)));
}
function missingCount(S, x, z) {
  return DIRS4.filter(([dx, dz]) => !S.has(keyOf(x + dx, z + dz))).length;
}

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z] of cellList) {
  const gr = ground(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

const S0 = insetSet(0); // full footprint
const S1 = insetSet(3); // first setback
const S2 = insetSet(6); // crown
const S3 = insetSet(9); // roof plant

// Storey tier. Storeys run on 5-block pitch from y0 (y0 is a multiple of 5).
// Ring cells carry the facade: spandrels at rows 0 and 4, piers and glass in rows 1-3.
// Interior cells are an air gap with a floor slab at row 0.
function tier(S, y0, y1, role) {
  for (const k of S) {
    const [x, z] = parse(k);
    const gc = ground(x, z);
    const ring = isRing(S, x, z);
    for (let y = Math.max(y0, gc); y < y1; y++) {
      const rel = (y - y0) % 5;
      if (rel === 0) {
        if (role === "podium" && y === 0) put(x, y, z, ring ? "polished_andesite" : "smooth_stone");
        else if (ring) put(x, y, z, "white_concrete");
        else put(x, y, z, "smooth_quartz");
      } else if (rel === 4) {
        if (ring) put(x, y, z, "white_concrete");
      } else if (ring) {
        const corner = missingCount(S, x, z) >= 2;
        const pier = corner || (x + z) % 3 === 0;
        if (pier) {
          put(x, y, z, role === "podium" ? "polished_andesite" : "white_concrete");
        } else {
          put(x, y, z, "light_blue_stained_glass");
          // Warm light behind some panes, in the air gap on the inside.
          if ((x * 5 + z * 3 + y) % 11 === 0) {
            for (const [dx, dz] of DIRS4) {
              const nx = x + dx, nz = z + dz;
              if (S.has(keyOf(nx, nz)) && !isRing(S, nx, nz)) {
                put(nx, y, nz, "glowstone");
                break;
              }
            }
          }
        }
      }
    }
  }
}

// Setback terrace: lower-tier roof left open by the tier above, with a parapet on its ring.
function terrace(Shi, Slo, y) {
  for (const k of Slo) {
    const [x, z] = parse(k);
    if (!Shi.has(k)) put(x, y, z, "smooth_stone");
    if (isRing(Slo, x, z)) put(x, y + 1, z, "white_concrete");
  }
}

// 2. Podium (storeys 0-1), shaft (2-6), setbacks at 45 and 55.
tier(S0, 0, 10, "podium");
tier(S0, 10, 45, "shaft");
terrace(S1, S0, 45);
tier(S1, 45, 55, "shaft");
terrace(S2, S1, 55);
tier(S2, 55, 59, "shaft");

// 3. Crown cap at 59, parapet at 60, roof plant at 60-63 with a lightning rod.
for (const k of S2) {
  const [x, z] = parse(k);
  put(x, 59, z, "smooth_stone");
  if (isRing(S2, x, z)) put(x, 60, z, "white_concrete");
}
for (const k of S3) {
  const [x, z] = parse(k);
  for (let y = 60; y <= 62; y++) put(x, y, z, "smooth_quartz");
  put(x, 63, z, "stone_bricks");
}
{
  const xs = cellList.map(([x]) => x), zs = cellList.map(([, z]) => z);
  const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
  const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
  put(cx, 64, cz, "lightning_rod", { facing: "up", powered: "false" });
}

// 4. Entrance on the north face (minimum z), centred. Door, hanging lantern under the spandrel.
{
  const zs = cellList.map(([, z]) => z);
  const xs = cellList.map(([x]) => x);
  const minZ = Math.min(...zs);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const doorCells = cellList.filter(([, z]) => z === minZ);
  doorCells.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  const [dx, dz] = doorCells[0];
  const gr = ground(dx, dz);
  put(dx, gr + 1, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, gr + 2, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx, gr + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
