import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded building, 22 x 22 footprint, roof ~11 blocks above its lowest ground.
// Read as a two-storey Taipei commercial block of the 1980s-90s: white-tiled
// concrete piers, tinted glazing, shopfront ground floor under a red fascia,
// a quartz cornice and parapet, and a rooftop plant room with an antenna.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833609";
const W = 22, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Lookup of footprint cell -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const minG = Math.min(...ground.values());
const R = Math.min(minG + 11, 19); // roof slab level (top of body)

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exteriorFaces = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// Pane connection props so adjacent panes join into a continuous wall.
const pane = (dx, dz) =>
  dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Facade block: white piers every 4 blocks, glazing between.
const facade = (x, y, z, fc, glass) => {
  if (fc.length > 1) return put(x, y, z, "white_concrete"); // corner pier
  const [dx, dz] = fc[0];
  const u = dz !== 0 ? x : z;
  if (u % 4 === 0) return put(x, y, z, "white_concrete");
  put(x, y, z, glass, pane(dx, dz));
};

// Pass 1: foundation, floors, body walls, cornice, parapet, roof.
const edgeCells = [];
for (const [x, z, gr] of cells) {
  const fc = exteriorFaces(x, z);
  const edge = fc.length > 0;

  // Foundation solid from y 0 up to this cell's ground, then base course / floor.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  put(x, gr, z, edge ? "stone_bricks" : "smooth_quartz");

  // Floor slab between storeys (spandrel band on the edge).
  if (gr + 5 < R) put(x, gr + 5, z, edge ? "light_gray_concrete" : "smooth_quartz");

  // Roof slab over the whole footprint.
  if (gr < R) put(x, R, z, "smooth_quartz");

  if (!edge || gr >= R) continue;
  edgeCells.push([x, z, gr, fc]);

  // Storey 1: shopfront glazing, fascia band above.
  for (let y = gr + 1; y <= gr + 3; y++) facade(x, y, z, fc, "light_blue_stained_glass_pane");
  if (gr + 4 < R) put(x, gr + 4, z, "red_concrete");

  // Storey 2: office glazing up to the cornice.
  for (let y = gr + 6; y <= R - 2; y++) facade(x, y, z, fc, "gray_stained_glass_pane");

  // Cornice band and parapet on the roof edge.
  if (R - 1 > gr + 5) put(x, R - 1, z, "smooth_quartz");
  put(x, R + 1, z, "white_concrete");
  put(x, R + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: entrance door with hanging lantern, warm lights behind some windows.
const midFaceCandidates = edgeCells.filter(
  ([x, z, , fc]) => fc.length === 1 && fc[0][0] === 0 && fc[0][1] === 1 && (x % 4) !== 0
);
const pool = midFaceCandidates.length
  ? midFaceCandidates
  : edgeCells.filter(([x, , , fc]) => fc.length === 1 && (fc[0][0] !== 0 ? z_ok(fc) : true));
function z_ok(fc) { return true; }
if (pool.length) {
  const xs = pool.map(c => c[0]).sort((a, b) => a - b);
  const med = xs[Math.floor(xs.length / 2)];
  pool.sort((a, b) => Math.abs(a[0] - med) - Math.abs(b[0] - med));
  const [dx0, dz0] = pool[0][3][0];
  const [ex, ez, egr] = pool[0];
  const facing = dz0 !== 0 ? (dz0 > 0 ? "north" : "south") : (dx0 > 0 ? "west" : "east");
  put(ex, egr + 1, ez, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, egr + 2, ez, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, egr + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

for (const [x, z, gr, fc] of edgeCells) {
  if (fc.length !== 1) continue;
  const [dx, dz] = fc[0];
  const u = dz !== 0 ? x : z;
  if (u % 8 !== 5 && u % 8 !== 1) continue;
  const ix = x - dx, iz = z - dz; // inward cell behind the glass
  if (!has(ix, iz) || exteriorFaces(ix, iz).length || gnd(ix, iz) !== gr) continue;
  const y = u % 8 === 5 ? gr + 2 : gr + 7;
  if (y >= R - 1 || (y > gr + 4 && y < gr + 6)) continue;
  put(ix, y, iz, "glowstone");
}

// Pass 3: rooftop plant room (3x3, fully inside the footprint) and antenna.
const inSet = (x, z) => has(x, z);
let best = null;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++)
    for (let dz = -1; dz <= 1; dz++) if (!inSet(x + dx, z + dz)) { ok = false; break; }
  if (!ok) continue;
  const d = Math.hypot(x - 10.5, z - 10.5);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  const gy = R + 1;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      put(best.x + dx, gy, best.z + dz, "light_gray_concrete");
      put(best.x + dx, gy + 1, best.z + dz, "light_gray_concrete");
      put(best.x + dx, gy + 2, best.z + dz, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    }
  put(best.x, gy + 3, best.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
