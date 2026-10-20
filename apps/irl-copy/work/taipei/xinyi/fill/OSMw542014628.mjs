import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542014628";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey 1980s-90s Xinyi commercial block: granite plinth, white tiled
// walls with smooth quartz string courses, light-blue glass shopfront below,
// a central entrance on the north face, and a red terracotta parapet.
const W = 16, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const has = (x, z) => cells.some(c => c[0] === x && c[1] === z);
const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);

const minG = Math.min(...cells.map(c => c[2]));
const minZ = Math.min(...cells.map(c => c[1]));
const L1 = minG + 5;   // second-storey floor line
const R = minG + 10;   // parapet course; roof top ~ minG + 11

// Entrance: north-face cell nearest the middle of the footprint
const northCells = cells.filter(c => c[1] === minZ).sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
const doorX = northCells.length ? northCells[0][0] : -1;

const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

function edgeInfo(x, z) {
  const missX = !inFp(x - 1, z) || !inFp(x + 1, z);
  const missZ = !inFp(x, z - 1) || !inFp(x, z + 1);
  return { edge: missX || missZ, corner: missX && missZ };
}

for (const [x, z, gr] of cells) {
  // Foundation under every footprint cell
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const { edge, corner } = edgeInfo(x, z);

  if (!edge) {
    // Interior: floor slabs only, air between, warm lights behind some windows
    put(x, gr, z, "light_gray_concrete");
    if (L1 > gr) put(x, L1, z, "light_gray_concrete");
    if (R - 1 > gr) put(x, R - 1, z, "light_gray_concrete");

    if ((x + z) % 4 === 0 && gr + 2 < L1) put(x, gr + 2, z, "shroomlight");
    if ((x * 3 + z) % 5 === 0 && L1 + 2 < R - 1) put(x, L1 + 2, z, "glowstone");

    // Roof plant on the roof deck
    if (R - 1 > gr && (x * 5 + z * 3) % 11 === 0) {
      put(x, R, z, "iron_block");
      if ((x + 2 * z) % 3 === 0) put(x, R + 1, z, "iron_block");
    }
    continue;
  }

  // Perimeter wall, from its ground up to the parapet
  for (let y = gr; y <= R; y++) {
    // Entrance door on the north face
    if (z === minZ && x === doorX && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (y === gr) { put(x, y, z, "polished_granite"); continue; }
    if (y === R) { put(x, y, z, "red_terracotta"); continue; }
    if (y === L1 || y === R - 1) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === L1 - 1) { put(x, y, z, "smooth_quartz"); continue; } // shopfront lintel

    if (corner) { put(x, y, z, "white_concrete"); continue; }
    if ((x + z) % 3 === 0) { put(x, y, z, "white_concrete"); continue; }

    // Window column
    put(x, y, z, "light_blue_stained_glass");
  }
}

// Canopy-style ground course above the entrance: a slab cap on the lintel
if (doorX >= 0) {
  const c = northCells[0];
  const gr = c[2];
  put(doorX, gr + 4, minZ, "smooth_quartz_slab", { type: "top" });
}

g.save(`${DIR}/${ID}.nbt`);
