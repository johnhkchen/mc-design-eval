import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// International Trade Building (國際世貿大樓), Taipei. Podium-free glazed slab tower,
// 13 storeys of about 5 blocks, roof at y 64, cornice parapet, rooftop plant room.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE93-0110-13F.cells.json`, "utf8"));

const W = 23, H = 76, D = 35;
const g = new Voxels([W, H, D]);

const ROOF = 64;      // roof slab layer
const BODY_TOP = 63;  // last body layer below the roof slab

// Footprint lookup: key "x,z" -> ground height
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// number of orthogonal neighbours missing from the footprint
const missing = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz)).length;
const isExterior = (x, z) => missing(x, z) > 0;
const isCorner = (x, z) => missing(x, z) >= 2;

// Chebyshev depth: largest r such that the (2r+1) square around the cell is all footprint
function depth(x, z) {
  let r = 0;
  while (true) {
    let ok = true;
    for (let dx = -(r + 1); dx <= r + 1 && ok; dx++)
      for (let dz = -(r + 1); dz <= r + 1 && ok; dz++)
        if (!has(x + dx, z + dz)) ok = false;
    if (!ok) return r;
    r++;
    if (r > 40) return r;
  }
}

const isGlass = (x, z, y) => {
  if (!isExterior(x, z)) return false;
  const gr = ground(x, z);
  if (y < gr || y > BODY_TOP) return false;
  const r = y % 5;
  if (r === 0 || r === 4) return false;
  if (isCorner(x, z) || (x + z) % 3 === 0) return false;
  return true;
};

// Footprint extents for entrance placement
const minZ = Math.min(...cells.map(([, z]) => z));
const entranceXs = cells
  .filter(([x, z]) => z === minZ && isExterior(x, z))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const cxE = entranceXs[Math.floor(entranceXs.length / 2)];

// ---- 1. Foundations and tower body ----
for (const [x, z] of cells) {
  const gr = ground(x, z);
  const ex = isExterior(x, z);
  const dp = depth(x, z);

  // foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "gray_concrete");

  for (let y = gr; y <= BODY_TOP; y++) {
    let b = null;
    if (!ex) {
      // interior: floor slabs each storey; solid core where depth >= 3
      if (dp >= 3 || y % 5 === 0) b = "light_gray_concrete";
    } else if (y === gr) {
      b = "smooth_stone";                      // base course
    } else if (y % 5 === 0) {
      b = "light_gray_concrete";               // floor slab line
    } else if (y % 5 === 4) {
      b = "white_concrete";                    // spandrel
    } else if (isCorner(x, z) || (x + z) % 3 === 0) {
      b = "white_concrete";                    // mullion
    } else {
      b = "light_blue_stained_glass";          // glazing
    }
    if (b) g.set(x, y, z, b);
  }

  // roof slab over the whole footprint
  g.set(x, ROOF, z, "light_gray_concrete");

  // cornice parapet on exterior
  if (ex) g.set(x, ROOF + 1, z, "white_concrete");

  // rooftop plant room on the deep core
  if (dp >= 5) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) g.set(x, y, z, "white_concrete");
    g.set(x, ROOF + 4, z, "light_gray_concrete");
  }
}

// ---- 2. Warm lights behind some glazing (inside the air gap) ----
for (const [x, z] of cells) {
  if (!isExterior(x, z)) continue;
  const gr = ground(x, z);
  for (let y = gr + 5; y <= BODY_TOP; y++) {
    if (!isGlass(x, z, y)) continue;
    if ((x * 5 + z * 3 + y) % 13 !== 0) continue;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (has(nx, nz) && !isExterior(nx, nz) && depth(nx, nz) === 1) {
        g.set(nx, y, nz, "glowstone");
        break;
      }
    }
  }
}

// ---- 3. Main entrance on the minZ face, with canopy ----
for (const [x, z] of cells) {
  if (z !== minZ || !isExterior(x, z)) continue;
  const gr = ground(x, z);
  if (Math.abs(x - cxE) > 2) continue;
  for (let y = gr; y <= gr + 2; y++) g.set(x, y, z, "tinted_glass");
}
{
  const gr = ground(cxE, minZ);
  if (gr !== undefined) {
    g.set(cxE, gr, minZ, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(cxE, gr + 1, minZ, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}
for (const [x, z] of cells) {
  if (z > minZ + 1) continue;
  if (Math.abs(x - cxE) > 3) continue;
  const gr = ground(x, z);
  if (gr === undefined) continue;
  g.set(x, gr + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// ---- 4. Antenna on the deepest roof cell ----
{
  let best = null, bestDp = -1;
  for (const [x, z] of cells) {
    const dp = depth(x, z);
    if (dp > bestDp) { bestDp = dp; best = [x, z]; }
  }
  if (best) {
    for (let y = ROOF + 5; y <= ROOF + 8; y++) g.set(best[0], y, best[1], "lightning_rod");
  }
}

g.save(`${DIR}/TPE93-0110-13F.nbt`);
