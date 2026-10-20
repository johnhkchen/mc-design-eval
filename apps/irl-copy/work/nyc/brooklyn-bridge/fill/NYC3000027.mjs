import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000027";
const W = 5, H = 22, D = 11;

// 55 Pearl Street, DUMBO: 2014 brick-clad mixed-use infill, ~5 storeys (2 blocks each).
// Red brick walls with pale stone belts, blue glazing, storefront at street level.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const g = new Voxels([W, H, D]);
const key = (x, z) => x + "," + z;
const cellMap = new Map();
for (const [x, z, gr, rf] of list) {
  cellMap.set(key(x, z), { x, z, g: Math.round(gr), r: Math.round(rf) });
}
const has = (x, z) => cellMap.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const cells = [...cellMap.values()];
const gMin = Math.min(...cells.map((c) => c.g));
const roofs = cells.map((c) => c.r).sort((a, b) => a - b);
const roofMed = roofs[Math.floor(roofs.length / 2)];
const minX = Math.min(...cells.map((c) => c.x));
const minZ = Math.min(...cells.map((c) => c.z));
let nS = Math.max(2, Math.min(9, Math.round((roofMed - gMin) / 2)));
nS = Math.min(nS, Math.floor((H - 4 - gMin) / 2));
const topY = gMin + 2 * nS;

const isExterior = (x, z) =>
  !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const faceOf = (x, z) => {
  if (!has(x, z - 1)) return { nx: 0, nz: -1, along: x - minX };
  if (!has(x, z + 1)) return { nx: 0, nz: 1, along: x - minX };
  if (!has(x - 1, z)) return { nx: -1, nz: 0, along: z - minZ };
  return { nx: 1, nz: 0, along: z - minZ };
};

const tierOf = (c) => gMin + 2 * Math.max(1, Math.min(nS, Math.round((c.r - gMin) / 2)));

// Street door: centre of the min-z face at grade
const frontCells = cells.filter((c) => c.z === minZ && c.g === gMin).map((c) => c.x).sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : -1;
const doorZ = minZ;

const litWindows = [];

for (const c of cells) {
  const { x, z } = c;
  const gr = c.g;
  const ct = tierOf(c);
  const ext = isExterior(x, z);

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (ext) {
    const f = faceOf(x, z);
    for (let y = gr; y < ct; y++) {
      const off = y - gMin;
      let id;
      if (off === 0) id = "polished_granite";          // base course
      else if (off % 2 === 0) id = "smooth_stone";     // thin pale storey belt
      else {
        const pier = f.along % 2 === 0;
        id = pier ? "bricks" : "light_blue_stained_glass";
        if (!pier && (x + z + y) % 4 === 0) litWindows.push({ x, y, z, nx: f.nx, nz: f.nz });
      }
      put(x, y, z, id);
    }
    // Single parapet course on the cell's roof edge (no double layer)
    put(x, ct, z, "stone_bricks");
  } else {
    for (let y = gr; y < ct; y++) {
      const off = y - gMin;
      if (y === gr || off % 2 === 0) put(x, y, z, "smooth_stone");
    }
    put(x, ct, z, "stone");
  }
}

// Storefront door, lower and upper halves
if (doorX >= 0) {
  put(doorX, gMin, doorZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, gMin + 1, doorZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm light behind some windows
for (const w of litWindows) {
  const ix = w.x - w.nx;
  const iz = w.z - w.nz;
  if (has(ix, iz) && !isExterior(ix, iz)) put(ix, w.y, iz, "glowstone");
}

// Rooftop mechanical penthouse on the top tier
if (topY + 2 < H) {
  for (const c of cells) {
    if (tierOf(c) !== topY) continue;
    if (c.x === 2 && c.z >= 4 && c.z <= 6 && !isExterior(c.x, c.z)) {
      put(c.x, topY + 1, c.z, "stone_bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
