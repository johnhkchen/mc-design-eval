import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1345143754.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1345143754.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 8, H = 19, D = 10;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const at = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior faces of a footprint cell. Outward normal per face.
const FACES = {
  north: { dx: 0, dz: -1, inX: 0, inZ: 1 },
  south: { dx: 0, dz: 1, inX: 0, inZ: -1 },
  west:  { dx: -1, dz: 0, inX: 1, inZ: 0 },
  east:  { dx: 1, dz: 0, inX: -1, inZ: 0 },
};

function facesOf(x, z) {
  const out = [];
  if (!has(x + FACES.north.dx, z + FACES.north.dz)) out.push("north");
  if (!has(x + FACES.south.dx, z + FACES.south.dz)) out.push("south");
  if (!has(x + FACES.west.dx, z + FACES.west.dz)) out.push("west");
  if (!has(x + FACES.east.dx, z + FACES.east.dz)) out.push("east");
  return out;
}

// Along-wall index ranges per face, so pillars and windows are spaced evenly.
const faceRange = { north: null, south: null, west: null, east: null };
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (const f of facesOf(x, z)) {
    const idx = (f === "north" || f === "south") ? x : z;
    const r = faceRange[f] ?? (faceRange[f] = { min: idx, max: idx });
    r.min = Math.min(r.min, idx);
    r.max = Math.max(r.max, idx);
  }
}
// Front (entrance and sign band) is the north face if present, otherwise south.
const front = faceRange.north ? "north" : faceRange.south ? "south" : null;

for (const [x, z, gy] of cells) {
  const gr = gy;

  // 1. Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // 2. Roof slab over the whole footprint, one storey above the 5-block ground storey.
  put(x, gr + 6, z, "smooth_stone");

  const faces = facesOf(x, z);
  const exterior = faces.length > 0;

  // 3. Base course on exterior walls.
  if (exterior) {
    put(x, gr + 1, z, "polished_andesite");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 7, z, "white_concrete"); // parapet ring
  }

  // 4. Wall surfaces, pillars, windows, entrance, lights, per exterior face.
  if (exterior) {
    const isCorner = faces.length >= 2;
    for (const f of faces) {
      const along = (f === "north" || f === "south") ? x : z;
      const r = faceRange[f];
      const rel = along - r.min;
      const last = r.max - r.min;
      const isPillar = isCorner || rel % 3 === 0 || rel === last;

      // Entrance on the front face, centred.
      const isDoor = f === front && rel === Math.floor(last / 2) && !isCorner;

      // Sign band on the front face above the windows.
      if (f === front) put(x, gr + 5, z, isPillar ? "white_concrete" : "red_concrete");

      if (isDoor) {
        const props = { facing: f, hinge: "left", open: "false", powered: "false" };
        put(x, gr + 1, z, "birch_door", { ...props, half: "lower" });
        put(x, gr + 2, z, "birch_door", { ...props, half: "upper" });
        put(x, gr + 3, z, "white_concrete");
        put(x, gr + 4, z, "white_concrete");
        continue;
      }

      if (isPillar) {
        for (let y = gr + 2; y <= gr + 4; y++) put(x, y, z, "white_concrete");
      } else {
        for (let y = gr + 2; y <= gr + 4; y++) put(x, y, z, "glass");
        // Warm light behind some windows, on the interior cell just inside.
        if (rel % 6 === 1) {
          const ix = x + FACES[f].inX;
          const iz = z + FACES[f].inZ;
          if (has(ix, iz)) put(ix, gr + 3, iz, "glowstone");
        }
      }
    }
  }
}

// Roof equipment: one small unit on an interior roof cell.
const interior = cells.filter(([x, z]) => facesOf(x, z).length === 0);
if (interior.length > 0) {
  const [ex, ez, egr] = interior[Math.floor(interior.length / 2)];
  put(ex, egr + 7, ez, "light_gray_concrete");
}

g.save(OUT);
