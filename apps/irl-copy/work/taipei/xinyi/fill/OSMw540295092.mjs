import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540295092";
const cells = JSON.parse(readFileSync(`${BASE}.cells.json`, "utf8"));

const W = 19, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// ground lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const roofY = minG + 11;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  const gr = ground.get(`${x},${z}`);
  if (gr === undefined || y < gr) return; // below ground is foundation
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// classify cells
const info = new Map();
for (const [x, z] of cells) {
  const mx = !has(x - 1, z) || !has(x + 1, z); // face normal along X (runs along Z)
  const mz = !has(x, z - 1) || !has(x, z + 1); // face normal along Z (runs along X)
  info.set(`${x},${z}`, {
    facade: mx || mz,
    corner: mx && mz,
    alongX: mz && !mx, // face runs along X
    alongZ: mx && !mz, // face runs along Z
    northFace: !has(x, z - 1),
  });
}
const isFacade = (x, z) => info.get(`${x},${z}`)?.facade === true;

// 1. foundation: solid from y0 to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");
}

// 2. floor slabs and roof deck over the whole footprint
const slabLevels = [minG, minG + 5, minG + 10];
for (const [x, z] of cells) {
  for (const y of slabLevels) put(x, y, z, "smooth_stone");
  put(x, roofY, z, "light_gray_concrete");
}

// 3. facade: storeys, glass bands, mullions, spandrels
const glassProps = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z] of cells) {
  const inf = info.get(`${x},${z}`);
  if (!inf.facade) continue;

  // base course
  put(x, minG, z, "polished_granite");

  for (const b of [minG, minG + 5]) {
    for (let y = b + 1; y <= b + 3; y++) {
      if (inf.corner) {
        put(x, y, z, "white_concrete");
      } else if (inf.alongX) {
        if (x % 3 === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_blue_stained_glass_pane", glassProps(true));
      } else {
        if (z % 3 === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_blue_stained_glass_pane", glassProps(false));
      }
    }
    put(x, b + 4, z, "smooth_quartz"); // spandrel
  }

  // cornice course and parapet
  put(x, minG + 10, z, "smooth_stone");
  put(x, roofY + 1, z, "white_concrete");
}

// 4. entrance on the north face: door, lintel canopy
const northXs = cells
  .filter(([x, z]) => info.get(`${x},${z}`).northFace && isFacade(x, z))
  .map(([x]) => x)
  .sort((a, b) => a - b);
if (northXs.length) {
  const x0 = northXs[Math.floor(northXs.length / 2)];
  const z0 = cells.find(([x]) => x === x0 && info.get(`${x},${minG >= 0 ? cells.find(c => c[0] === x0)[1] : 0}`)?.northFace)?.[1];
  // find the north-face z for x0
  const zN = cells.filter(([x]) => x === x0).reduce((m, c) => (c[1] < m ? c[1] : m), Infinity);
  const zd = Number.isFinite(zN) ? zN : z0;
  put(x0, minG + 1, zd, "birch_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x0, minG + 2, zd, "birch_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) {
    const xx = x0 + dx;
    if (!has(xx, zd)) continue;
    put(xx, minG + 3, zd, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 5. warm lights behind some windows (interior cell just inside the facade)
for (const [x, z] of cells) {
  const inf = info.get(`${x},${z}`);
  if (!inf.facade || inf.corner) continue;
  const onMullion = inf.alongX ? x % 3 === 0 : z % 3 === 0;
  if (onMullion) continue;
  let ix = x, iz = z;
  if (!has(x, z - 1)) iz = z + 1;
  else if (!has(x, z + 1)) iz = z - 1;
  else if (!has(x - 1, z)) ix = x + 1;
  else if (!has(x + 1, z)) ix = x - 1;
  if (!has(ix, iz) || isFacade(ix, iz)) continue;
  // ground storey: glowstone; upper storeys: shroomlight, sparse
  if ((x + z) % 3 === 0) put(ix, minG + 2, iz, "glowstone");
  if ((x * 2 + z) % 7 === 0) put(ix, minG + 7, iz, "shroomlight");
}

// 6. roof: penthouse core, mechanical units, parapet already placed
const pent = [];
for (const [x, z] of cells) {
  if (isFacade(x, z)) continue;
  if (x >= 6 && x <= 12 && z >= 7 && z <= 13) pent.push([x, z]);
}
for (const [x, z] of pent) {
  put(x, roofY + 1, z, "light_gray_concrete");
  put(x, Math.min(H - 1, roofY + 2), z, "light_gray_concrete");
}
for (const [x, z] of cells) {
  if (isFacade(x, z)) continue;
  if (x % 5 === 2 && z % 5 === 2 && !pent.some(([px, pz]) => px === x && pz === z)) {
    put(x, roofY + 1, z, "iron_block");
  }
}

g.save(`${BASE}.nbt`);
