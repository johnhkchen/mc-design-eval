import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 松山工農泳游池 (Songshan Vocational & Industrial School pool hall), built 2009.
// Pool-tiled base storey, five storeys of pale concrete grid with light-blue glass,
// flat roof with a plant screen and a water tank. Roof deck y 30, parapet y 31, plant to y 33.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE98-0052-4F-2";
const W = 18, H = 43, D = 14;
const TOP = 30;
const PAR = 31;
const WALL_TOP = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

function faces(x, z) {
  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  return { n, s, w, e, edge: n || s || w || e };
}

// Pane connections follow the wall axis: along x (north/south faces) or along z.
function paneProps(alongX) {
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// 1. Foundation, base course, storey grid on the facade
for (const [x, z, gc] of cells) {
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const f = faces(x, z);
  if (f.edge) {
    // Facing axis: north/south faces run along x, otherwise along z.
    const alongX = f.n || f.s;
    const idx = alongX ? x : z;
    for (let y = gc; y <= WALL_TOP; y++) {
      const rel = y % 5;
      const k = Math.floor(y / 5);
      if (y === gc) {
        put(x, y, z, "stone_bricks");                  // base course
      } else if (rel === 0) {
        put(x, y, z, k === 0 ? "light_blue_concrete" : "light_gray_concrete"); // storey lines
      } else if (rel === 4) {
        put(x, y, z, "white_concrete");                // spandrel
      } else if (idx % 3 === 0) {
        put(x, y, z, "white_concrete");                // mullion / pilaster
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(alongX));
      }
    }
  } else {
    // Interior: floor slabs only, air between
    for (let y = gc; y <= WALL_TOP; y++) {
      if (y === gc || y % 5 === 0) put(x, y, z, "light_gray_concrete");
    }
  }
}

// 2. Roof deck everywhere, parapet on the edge
for (const [x, z] of cells) {
  put(x, TOP, z, "smooth_stone");
  if (faces(x, z).edge) put(x, PAR, z, "white_concrete");
}

// 3. Roof plant on solid roof cells
for (const [x, z] of cells) {
  if (x >= 6 && x <= 11 && z >= 4 && z <= 9 && has(x, z)) {
    put(x, PAR, z, "light_gray_concrete");
    put(x, PAR + 1, z, "light_gray_concrete");
  }
}
for (const [x, z] of cells) {
  if (x >= 7 && x <= 10 && z >= 5 && z <= 8 && has(x, z) && has(x, z - 1) && has(x, z + 1)) {
    put(x, PAR + 2, z, "light_blue_concrete");
  }
}

// 4. Entrance on the north face, centred on that face
{
  const northCells = cells
    .filter(([x, z]) => !has(x, z - 1))
    .map(([x, z, gc]) => ({ x, z, gc }));
  if (northCells.length) {
    const mean = northCells.reduce((a, c) => a + c.x, 0) / northCells.length;
    const door = northCells.reduce((best, c) =>
      Math.abs(c.x - mean) < Math.abs(best.x - mean) ? c : best);
    const { x, z, gc } = door;
    put(x, gc, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gc + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gc + 2, z, "white_concrete");
  }
}

// 5. Warm light behind some windows, on the interior floor slab
for (const [x, z, gc] of cells) {
  const f = faces(x, z);
  if (!f.edge) continue;
  const alongX = f.n || f.s;
  const idx = alongX ? x : z;
  let ox = 0, oz = 0;
  if (f.n) oz = 1; else if (f.s) oz = -1; else if (f.w) ox = 1; else if (f.e) ox = -1;
  const ix = x + ox, iz = z + oz;
  if (!has(ix, iz) || faces(ix, iz).edge) continue;
  for (let k = 1; k <= 5; k++) {
    const yFloor = 5 * k;
    if (yFloor > WALL_TOP) break;
    if (yFloor < gc || gOf(ix, iz) > yFloor) continue;
    if (idx % 6 === 1 && (k + idx) % 2 === 0) {
      put(ix, yFloor + 1, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
