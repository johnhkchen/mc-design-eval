import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 仁愛樓: Taipei mid-century (c. 1960s-70s) reinforced-concrete block,
// three storeys of ~5 blocks, flat roof with parapet, ground-floor shopfronts.
const W = 58, H = 28, D = 17;
const STOREY = 5;          // blocks per storey
const TOP_REL = 16;        // parapet top above lowest ground

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1334984549.cells.json", "utf8"));
const occ = new Map();
for (const [x, z, gr] of cells) occ.set(`${x},${z}`, gr);
const has = (x, z) => occ.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

// Bounds-guarded setter; props optional.
function put(x, y, z, b, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Door location: centre of the north (min z) face.
const doorX = Math.floor(W / 2);
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const b = gr; // base of the building in this cell

  // Exterior faces: which neighbours are missing.
  const nMissing = !has(x, z - 1);
  const sMissing = !has(x, z + 1);
  const wMissing = !has(x - 1, z);
  const eMissing = !has(x + 1, z);
  const perimeter = nMissing || sMissing || wMissing || eMissing;

  // Facing for perimeter cells: z-faces take priority, bays counted along x.
  let faceAlongX = nMissing || sMissing;
  let inwardDz = nMissing ? 1 : sMissing ? -1 : 0;
  let inwardDx = (!faceAlongX) ? (wMissing ? 1 : -1) : 0;
  const bayCoord = faceAlongX ? x : z;

  const isDoorCell = perimeter && nMissing && z === minZ && (x === doorX || x === doorX - 1 || x === doorX + 1);

  for (let rel = 0; rel <= TOP_REL; rel++) {
    const y = b + rel;
    const storey = Math.min(2, Math.floor((rel - 1) / STOREY)); // 0 ground, 1, 2
    const r = rel % STOREY;

    if (rel === 0) {
      put(x, y, z, perimeter ? "stone_bricks" : "light_gray_concrete");
      continue;
    }

    if (r === 0) {
      // Storey lines / floor slabs / roof slab.
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (!perimeter) {
      // Interior: air gap, with roof equipment on the roof.
      if (rel === STOREY * 3 + 1 && x % 7 === 3 && z % 5 === 2) {
        put(x, y, z, "iron_block");
      }
      continue;
    }

    if (rel === TOP_REL) {
      // Parapet cap.
      put(x, y, z, "white_concrete");
      continue;
    }

    if (r === 4) {
      // Spandrel; ground-floor awning band on alternating bays.
      if (storey === 0 && bayCoord % 4 === 1) put(x, y, z, "red_concrete");
      else put(x, y, z, "white_concrete");
      continue;
    }

    // Window zone rows r = 1..3.
    const open = storey === 0
      ? (bayCoord % 4 !== 0)
      : (bayCoord % 4 === 1 || bayCoord % 4 === 2);

    if (isDoorCell && storey === 0 && r <= 2) {
      if (x === doorX) {
        put(x, y, z, "dark_oak_door", {
          facing: nMissing ? "north" : "south",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else {
        put(x, y, z, "white_concrete");
      }
      continue;
    }

    if (open) {
      put(x, y, z, "light_blue_stained_glass");
      // Warm light just inside some windows (in the interior cell behind).
      const ix = x + inwardDx, iz = z + inwardDz;
      if (has(ix, iz) && r === 2 && (bayCoord + storey) % 3 === 0) {
        put(ix, y, iz, "glowstone");
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1334984549.nbt");
