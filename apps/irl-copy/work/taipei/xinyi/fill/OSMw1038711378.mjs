import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no metadata. Read as a 4-storey mid-rise office/commercial block, late-20th-century Taipei:
// pale concrete piers and spandrels, blue-tinted glazing, granite base with a shopfront,
// cornice and parapet, roof plant. Roof at y 21 above lowest ground, 4 storeys of 5 blocks.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711378";
const W = 23, H = 33, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const FLOORS = [0, 5, 10, 15];   // storey floor levels (y 0 = lowest ground)
const ROOF = 21;                 // roof slab
const PARAPET = 22;              // top of parapet on facade

const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

// Directions in which the neighbour is outside the footprint (exposed faces).
function exposed(x, z) {
  return DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
}

const minG = Math.min(...ground.values());

// Door: street-level facade cell on the -z (north) edge nearest the middle.
let doorCell = null;
{
  const cands = cells
    .filter(([x, z, g]) => g === minG && exposed(x, z).some(([, dz]) => dz === -1));
  if (cands.length) {
    cands.sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
    doorCell = { x: cands[0][0], z: cands[0][1], facing: "north" };
  } else {
    const any = cells.find(([x, z, g]) => g === minG && exposed(x, z).length);
    if (any) {
      const e = exposed(any[0], any[1])[0];
      doorCell = { x: any[0], z: any[1], facing: e[2] };
    }
  }
}

const g = new Voxels([W, H, D]);

function setDoor(x, y, z, facing, half) {
  g.set(x, y, z, "dark_oak_door", {
    facing, half, hinge: "left", open: "false", powered: "false",
  });
}

// Material for a facade or interior row above the foundation.
function rowMat(x, z, gr, y, fac) {
  if (y === PARAPET) return fac ? { id: "white_concrete" } : null;
  if (y === ROOF) return { id: "gray_concrete" };
  if (!fac) {
    if (FLOORS.includes(y) || y >= 19) return { id: "white_concrete" };
    return null;
  }
  if (y === 20) return { id: "smooth_quartz" };

  const k = Math.min(3, Math.floor(y / 5));
  const rel = y - 5 * k;

  if (rel === 0) return { id: k === 0 ? "polished_granite" : "light_gray_concrete" };
  if (rel === 4) return { id: "light_gray_concrete" };

  // Entrance
  if (k === 0 && doorCell && doorCell.x === x && doorCell.z === z && (rel === 1 || rel === 2)) {
    return { door: true, half: rel === 1 ? "lower" : "upper" };
  }

  const pier = (x + z) % 3 === 0;
  if (pier) return { id: "white_concrete" };

  // Warm light behind some glazed bays on upper storeys.
  if (rel === 2 && k >= 1 && (x * 5 + z * 3 + k) % 4 === 0) {
    return { id: "light_blue_stained_glass", light: true };
  }
  return { id: "light_blue_stained_glass" };
}

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const outs = exposed(x, z);
  const fac = outs.length > 0;

  // Fill the gap between this cell's ground and the next floor line.
  const gapTop = FLOORS.find((f) => f >= gr) ?? 23;
  for (let y = gr; y < gapTop && y <= PARAPET; y++) {
    g.set(x, y, z, fac ? "light_gray_concrete" : "white_concrete");
  }

  for (let y = Math.max(gr, gapTop); y <= PARAPET; y++) {
    const m = rowMat(x, z, gr, y, fac);
    if (!m) continue;
    if (m.door) {
      setDoor(x, y, z, doorCell.facing, m.half);
    } else {
      g.set(x, y, z, m.id);
      if (m.light && outs.length) {
        const [dx, dz] = [outs[0][0], outs[0][1]];
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz) && exposed(ix, iz).length === 0) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Roof plant: AC units on interior roof cells, central mast.
for (const [x, z] of cells) {
  if (exposed(x, z).length === 0 && x % 7 === 3 && z % 5 === 2) {
    g.set(x, 22, z, "iron_block");
    g.set(x, 23, z, "iron_block");
  }
}
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
if (has(cx, cz)) {
  for (let y = 22; y <= 27; y++) g.set(cx, y, cz, "iron_bars");
  g.set(cx, 28, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
