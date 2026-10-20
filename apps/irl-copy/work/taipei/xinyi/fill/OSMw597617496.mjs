import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw597617496";
const W = 15, H = 47, D = 22;

// 7 storeys of 5 blocks = 35 blocks above the lowest ground (roof at y=35)
const ROOF = 35;
const PARAPET = 36;
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(ROOF - 1, Math.round(gr))));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2;
const cz = (minZ + maxZ) / 2;

const isCell = (x, z) => ground.has(key(x, z));
const isPerimeter = (x, z) =>
  !isCell(x - 1, z) || !isCell(x + 1, z) || !isCell(x, z - 1) || !isCell(x, z + 1);

const g = new Voxels([W, H, D]);

const GLASS = "light_blue_stained_glass";
const MULLION = "smooth_quartz";
const SPANDREL = "white_concrete";
const SLAB = "light_gray_concrete";
const FOUND = "stone_bricks";
const ROOFBLK = "gray_concrete";
const WARM = "glowstone";
const PENT = "light_gray_concrete";

for (const [x, z, gr] of cells) {
  const perim = isPerimeter(x, z);
  // pattern index runs along the face the cell sits on
  const onZEdge = z === minZ || z === maxZ;
  const p = onZEdge ? x : z;
  const mullion = p % 3 === 0;

  for (let y = 0; y <= ROOF; y++) {
    if (y < gr) {
      // foundation fill up to this cell's ground
      g.set(x, y, z, FOUND);
      continue;
    }
    if (y === ROOF) {
      g.set(x, y, z, ROOFBLK);
      continue;
    }

    const k = Math.floor(y / STOREY);
    const r = y % STOREY;

    if (r === 0) {
      // storey floor line / spandrel course
      g.set(x, y, z, perim ? SPANDREL : SLAB);
      continue;
    }

    if (!perim) {
      // interior: floor slab per storey, air otherwise (no interiors)
      continue;
    }

    if (r === 4) {
      g.set(x, y, z, SPANDREL);
      continue;
    }

    // r = 1..3 : window band
    if (k === 0) {
      // ground storey: shopfront with a recessed entrance on the z-min face
      const entrance = z === minZ && x >= 6 && x <= 8;
      if (entrance) {
        if (r === 3) g.set(x, y, z, "lantern");
        // r 1..2 left as air: the door opening
        continue;
      }
      g.set(x, y, z, mullion ? MULLION : GLASS);
      continue;
    }

    if (mullion) {
      g.set(x, y, z, MULLION);
    } else if (r === 2 && k >= 1 && p % 6 === 1) {
      g.set(x, y, z, WARM);
    } else {
      g.set(x, y, z, GLASS);
    }
  }

  // parapet on the perimeter
  if (perim) {
    g.set(x, PARAPET, z, SPANDREL);
  }

  // central mechanical penthouse on interior cells
  if (!perim && Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 4) {
    for (let y = PARAPET; y <= PARAPET + 2; y++) {
      g.set(x, y, z, PENT);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
