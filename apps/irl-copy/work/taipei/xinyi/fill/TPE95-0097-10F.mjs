import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0097-10F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 31, H = 62, D = 15;
const g = new Voxels([W, H, D]);

// Footprint and per-cell ground (third number of each cell record).
const key = (x, z) => `${x},${z}`;
const gr = new Map();
for (const [x, z, gnd] of cells) gr.set(key(x, z), Math.max(0, Math.round(gnd)));
const F0 = Math.min(...gr.values());          // lowest ground under the building
const has = (x, z) => gr.has(key(x, z));
const G = (x, z) => gr.get(key(x, z));
const minZ = Math.min(...cells.map(c => c[1]));
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
const list = cells.map(c => [c[0], c[1]]);

// Only write footprint cells, only at or above that cell's ground, inside the grid.
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z) || y < G(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z] of list) {
  for (let y = 0; y < G(x, z) && y < H; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Ten storeys of 5 blocks, starting at the lowest ground (roof at F0 + 50).
const STOREYS = 10;
for (let k = 0; k < STOREYS; k++) {
  const b = F0 + 5 * k;

  // Floor slab across every footprint cell.
  for (const [x, z] of list) {
    put(x, b, z, perim(x, z) ? "gray_concrete" : "gray_concrete");
  }

  // Facade on perimeter cells.
  for (const [x, z] of list) {
    if (!perim(x, z)) continue;
    const missingZ = !has(x, z - 1) || !has(x, z + 1);   // north/south face
    const missingX = !has(x - 1, z) || !has(x + 1, z);   // east/west face
    const corner = missingZ && missingX;
    const pier = corner || (missingZ ? x % 3 === 0 : z % 3 === 0);

    // Ground storey: polished base course. Upper storeys: dark spandrel band
    // so the white piers and blue glass stand out as separate storeys.
    put(x, b, z, k === 0 ? "polished_andesite" : "dark_prismarine");

    // Ground-floor entrance: centre three cells of the front (minimum-z) face.
    const isEntrance = k === 0 && z === minZ && missingZ && Math.abs(x - cx) <= 1;
    if (isEntrance) {
      // Stone surround cells, with the middle cell as a glazed opening.
      const mid = x === cx;
      put(x, b + 1, z, mid ? "light_blue_stained_glass" : "polished_andesite");
      put(x, b + 2, z, mid ? "light_blue_stained_glass" : "polished_andesite");
      put(x, b + 3, z, mid ? "light_blue_stained_glass" : "polished_andesite");
      put(x, b + 4, z, "light_gray_concrete");
      if (mid) put(x, b + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    for (let off = 1; off <= 3; off++) {
      const y = b + off;
      if (pier) {
        // Piers: white for the tower, stone-bricks plinth on the ground storey.
        put(x, y, z, k === 0 ? "stone_bricks" : "white_concrete");
      } else if (k > 0 && off === 2 && (x * 3 + z * 5 + k * 7) % 13 === 0) {
        put(x, y, z, "glowstone");                        // warm lit window
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }

    // Header band above each window row.
    put(x, b + 4, z, "light_gray_concrete");
  }
}

// 3. Roof slab at F0 + 50: smooth stone cornice on the edge, light concrete inside.
const roofY = F0 + 50;
for (const [x, z] of list) {
  if (perim(x, z)) {
    put(x, roofY, z, "smooth_stone");
    put(x, roofY + 1, z, "white_concrete");              // parapet
    put(x, roofY + 2, z, "white_concrete");
  } else {
    put(x, roofY, z, "light_gray_concrete");
  }
}

// 4. Roof plant room on the central interior cells, standing on the roof slab.
for (const [x, z] of list) {
  if (perim(x, z)) continue;
  if (Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 3) {
    put(x, roofY + 1, z, "gray_concrete");
    put(x, roofY + 2, z, "gray_concrete");
    put(x, roofY + 3, z, "stone_bricks");
    if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 1) {
      put(x, roofY + 4, z, "light_gray_concrete");       // plant cap
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
