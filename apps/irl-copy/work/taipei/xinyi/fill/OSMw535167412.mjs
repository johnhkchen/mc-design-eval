import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-1980s Taipei mid-rise: stone-base commercial ground floor with glass shopfronts,
// five storeys of white tiled piers between tinted window bays, grey spandrels,
// a tiled parapet and a central roof penthouse.
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167412";
const W = 9, H = 38, D = 25;
const STOREY = 5;
const STOREYS = 5;

const FOUND = "stone_bricks";
const FLOOR = "light_gray_concrete";
const PIER = "white_concrete";
const TILE = "smooth_quartz";
const SPAND = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const GLASS_BLOCK = "light_blue_stained_glass";
const LIGHT = "glowstone";

const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const fp = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => fp.has(key(x, z));
const groundOf = (x, z) => fp.get(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isExt = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

// Front (street) face = minimum z. Door sits on the middle cell of that row.
const frontRow = cells.filter(([x, z]) => z === minZ && isExt(x, z)).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontRow.length ? frontRow[Math.floor(frontRow.length / 2)] : null;

const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const ext = new Set();
for (const [x, z] of cells) if (isExt(x, z)) ext.add(key(x, z));

// Pass 1: foundations, floors, facades, parapet, roof deck.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const exterior = ext.has(key(x, z));
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const corner = exterior && zFace && xFace;
  const p = zFace ? x - minX : z - minZ;
  const pMax = zFace ? maxX - minX : maxZ - minZ;
  const isPier = corner || p % 3 === 0 || p === pMax;
  const glassProps = zFace ? GLASS_EW : GLASS_NS;

  // Storey floor slabs (including the ground floor surface).
  for (let s = 0; s <= STOREYS; s++) put(x, gr + s * STOREY, z, FLOOR);

  for (let s = 0; s < STOREYS; s++) {
    const base = gr + s * STOREY;
    const isDoor = exterior && s === 0 && x === doorX && z === minZ;
    if (isDoor) {
      put(x, base + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, base + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, base + 3, z, GLASS_BLOCK);
      put(x, base + 4, z, TILE);
      continue;
    }
    if (exterior) {
      if (isPier) {
        for (let o = 1; o <= 4; o++) put(x, base + o, z, PIER);
      } else {
        put(x, base + 1, z, s === 0 ? GLASS_BLOCK : SPAND);            // shopfront glass / sill
        put(x, base + 2, z, GLASS, glassProps);
        put(x, base + 3, z, GLASS, glassProps);
        put(x, base + 4, z, s === 0 ? TILE : SPAND);                   // fascia / lintel
      }
    }
  }

  // Roof edge: parapet on exterior cells, roof deck already at gr+25.
  if (exterior) {
    put(x, gr + STOREYS * STOREY + 1, z, TILE);
  }
}

// Pass 2: warm light behind some window bays (only into interior cells).
for (const [x, z, gr] of cells) {
  if (!ext.has(key(x, z))) continue;
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  if (zFace && xFace) continue;
  const p = zFace ? x - minX : z - minZ;
  const pMax = zFace ? maxX - minX : maxZ - minZ;
  if (p % 3 === 0 || p === pMax) continue;
  let ix = x, iz = z;
  if (zFace) iz = has(x, z + 1) ? z + 1 : z - 1;
  else ix = has(x + 1, z) ? x + 1 : x - 1;
  if (!has(ix, iz) || ext.has(key(ix, iz))) continue;
  for (let s = 1; s < STOREYS; s++) {
    if ((p + s) % 3 === 1) put(ix, gr + s * STOREY + 2, iz, LIGHT);
  }
}

// Pass 3: roof penthouse, a tiled box with a glass band, centred on the roof.
for (const [x, z, gr] of cells) {
  if (x < 2 || x > 6 || z < 8 || z > 16) continue;
  if (ext.has(key(x, z))) continue;
  const roof = gr + STOREYS * STOREY;
  const edge = x === 2 || x === 6 || z === 8 || z === 16;
  if (edge) {
    put(x, roof + 1, z, TILE);
    put(x, roof + 2, z, GLASS_BLOCK);
    put(x, roof + 3, z, TILE);
  }
  put(x, roof + 4, z, FLOOR);
}

g.save(`${SRC}/${ID}.nbt`);
