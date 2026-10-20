import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial-office podium of the late-1990s/2000s Xinyi type: a two-storey
// base in light grey and white concrete, stone-bricked plinth, a storefront
// band, aluminium-framed blue glass, a grey cornice, a white parapet, and
// roof plant. Wall, window and roof levels follow each cell's own ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1335095050";
const W = 96, H = 23, D = 47;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => x + "," + z;
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(9, Math.round(gr))));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

const pane = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const ROOF = 10;   // roof slab level (absolute y)
const PARAPET = 11;

// 1. Foundations, floor slabs, storey slab, roof slab
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const b = gAt(x, z);
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");
  put(x, b, z, "light_gray_concrete");                  // ground floor slab
  if (b < 5) put(x, 5, z, "light_gray_concrete");       // upper floor slab
  put(x, ROOF, z, "smooth_stone");                      // roof deck
}

// 2. Perimeter walls, shopfront, storey bands, cornice, parapet
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  if (!isPerim(x, z)) continue;
  const b = gAt(x, z);
  const f = faces(x, z);
  const primary = f[0];
  const alongX = primary === "N" || primary === "S";
  const pos = alongX ? x - minX : z - minZ;

  for (let y = b; y <= 9; y++) {
    if (y === b) { put(x, y, z, "stone_bricks"); continue; }
    if (y === 4 || y === 5 || y === 9) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y < 4) {                       // ground floor shopfront
      if (pos % 8 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", pane(alongX));
      continue;
    }
    // upper storey (rows 6..8): framed glass with piers
    if (pos % 4 === 0) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", pane(alongX));
  }

  put(x, ROOF, z, "light_gray_concrete");              // cornice
  put(x, PARAPET, z, "white_concrete");                // parapet
}

// 3. Main entrance on the north face, centred on the face
{
  const northCells = cells
    .map(([x, z, gr]) => [x, z, gr])
    .filter(([x, z]) => faces(x, z).includes("N"));
  if (northCells.length) {
    northCells.sort((a, b) => a[0] - b[0]);
    const [dx, dz, dg] = northCells[Math.floor(northCells.length / 2)];
    const b = Math.max(0, Math.min(9, Math.round(dg)));
    put(dx, b + 1, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(dx, b + 2, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(dx, b + 3, dz, "light_gray_concrete");
  }
}

// 4. Warm light behind upper-storey glass, inside the envelope
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  if (!isPerim(x, z)) continue;
  const f = faces(x, z);
  const primary = f[0];
  const alongX = primary === "N" || primary === "S";
  const pos = alongX ? x - minX : z - minZ;
  if (pos % 8 !== 2) continue;
  const [ix, iz] = INWARD[primary];
  const cx = x + ix, cz = z + iz;
  if (has(cx, cz) && !isPerim(cx, cz)) put(cx, 7, cz, "glowstone");
}

// 5. Roof plant: a screened AC block and lightning rods on the interior roof
const cx = Math.round((minX + maxX) / 2), cz = Math.round((minZ + maxZ) / 2);
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  if (isPerim(x, z)) continue;
  if (x >= cx - 10 && x <= cx - 4 && z >= cz - 6 && z <= cz - 2) {
    put(x, PARAPET, z, "light_gray_concrete");
    put(x, PARAPET + 1, z, (x + z) % 2 ? "white_concrete" : "light_gray_concrete");
  }
}
for (const [x, z] of [[cx + 6, cz + 3], [cx + 12, cz - 3]]) {
  if (has(x, z) && !isPerim(x, z)) {
    for (let y = PARAPET; y <= PARAPET + 2; y++) {
      put(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
