import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise office block, c. 1980s-90s Taipei: four storeys of white tiled
// spandrels and tinted glass on a granite plinth, a stone cornice, a set-back
// roof penthouse with a lightning-rod mast, and a centred entrance on the south face.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109962";
const W = 21, H = 33, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Floor level of the ground storey: the highest ground under the footprint,
// so every storey sits on solid ground or podium.
const F = Math.max(...cells.map((c) => c[2]));
const R = F + 20;               // roof slab: four 5-block storeys
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (!has(x, z)) return;
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const perim = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const pin = (x, z) =>
  has(x, z) && x >= minX + 5 && x <= maxX - 5 && z >= minZ + 5 && z <= maxZ - 5;
const penPerim = (x, z) =>
  pin(x, z) && (!pin(x - 1, z) || !pin(x + 1, z) || !pin(x, z - 1) || !pin(x, z + 1));

const isCorner = (x, z) => (x === minX || x === maxX) && (z === minZ || z === maxZ);
const pier = (x, z) => x % 3 === 0 || z % 3 === 0 || isCorner(x, z);

// Entrance: the south-face perimeter cell nearest the centre line.
let ent = null;
{
  let best = Infinity;
  for (let x = minX; x <= maxX; x++) {
    if (has(x, maxZ) && Math.abs(x - cx) < best) {
      best = Math.abs(x - cx);
      ent = { x, z: maxZ };
    }
  }
}

// 1. Foundation: solid from y 0 up to the floor level under every cell.
for (const [x, z] of cells) {
  for (let y = 0; y < F; y++) put(x, y, z, "stone_bricks");
}

// 2. Floor slabs per storey and the roof slab.
for (const [x, z] of cells) {
  const edge = perim(x, z);
  for (let s = 0; s < 4; s++) {
    put(x, F + 5 * s, z, edge ? "white_concrete" : "light_gray_concrete");
  }
  put(x, R, z, "gray_concrete");
}

// 3. Storey walls, windows, lit windows and entrance.
for (let s = 0; s < 4; s++) {
  const b = F + 5 * s;
  for (const [x, z] of cells) {
    if (!perim(x, z)) continue;

    if (ent && x === ent.x && z === ent.z && s === 0) {
      const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
      put(x, b + 1, z, "iron_door", { ...door, half: "lower" });
      put(x, b + 2, z, "iron_door", { ...door, half: "upper" });
      put(x, b + 3, z, "white_concrete");
      put(x, b + 4, z, "white_concrete");
      continue;
    }

    if (pier(x, z)) {
      for (let y = b + 1; y <= b + 4; y++) put(x, y, z, "white_concrete");
      continue;
    }

    put(x, b + 1, z, s === 0 ? "polished_granite" : "white_concrete");
    put(x, b + 2, z, "light_blue_stained_glass");
    put(x, b + 3, z, "light_blue_stained_glass");
    put(x, b + 4, z, "white_concrete");

    // Warm light behind some glass: a shroomlight one cell inside.
    if ((x * 5 + z * 3 + s * 2) % 7 === 0) {
      let dx = 0, dz = 0;
      if (z === minZ) dz = 1;
      else if (z === maxZ) dz = -1;
      else if (x === minX) dx = 1;
      else if (x === maxX) dx = -1;
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !perim(ix, iz)) put(ix, b + 2, iz, "shroomlight");
    }
  }
}

// Entrance lantern on the floor inside the lobby.
if (ent && has(ent.x, maxZ - 1) && !perim(ent.x, maxZ - 1)) {
  put(ent.x, F + 1, maxZ - 1, "lantern", { hanging: "false" });
}

// 4. Cornice / parapet around the roof edge.
for (const [x, z] of cells) {
  if (!perim(x, z)) continue;
  put(x, R + 1, z, "white_concrete");
  put(x, R + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Set-back roof penthouse, glazed on four sides.
for (const [x, z] of cells) {
  if (!pin(x, z)) continue;
  if (penPerim(x, z)) {
    if (pier(x, z)) {
      for (let y = R + 1; y <= R + 4; y++) put(x, y, z, "white_concrete");
    } else {
      put(x, R + 1, z, "white_concrete");
      put(x, R + 2, z, "light_blue_stained_glass");
      put(x, R + 3, z, "light_blue_stained_glass");
      put(x, R + 4, z, "white_concrete");
    }
  }
  put(x, R + 5, z, "smooth_stone");
}

// 6. Roof plant: two low equipment blocks in the corners, clear of the penthouse.
for (const [x, z] of [[minX + 2, minZ + 2], [maxX - 2, maxZ - 2]]) {
  if (!has(x, z) || pin(x, z) || perim(x, z)) continue;
  put(x, R + 1, z, "light_gray_concrete");
  put(x, R + 2, z, "light_gray_concrete");
}

// 7. Mast on the penthouse centre, as a lightning rod.
if (pin(cx, cz)) {
  for (let y = R + 6; y <= Math.min(R + 10, H - 1); y++) {
    put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
