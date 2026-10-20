import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise office block, Xinyi district. Reads as a 12-storey
// glass-and-concrete office block: granite plinth, cyan glazing with grey piers,
// white spandrels, a quartz cornice and parapet, a three-bay entrance lobby,
// a plant room and a lightning rod. Floors sit on an absolute datum
// (y = 0 at the lowest ground), so storeys stay level across a sloping footprint
// and the downhill side shows its extra storeys.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw385940768";
const W = 29, H = 76, D = 23;
const ROOF = 64;      // roof deck layer, solid over the footprint
const CORNICE = 60;   // cornice band
const PARAPET_TOP = 63;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => `${x},${z}`;

// ground height per footprint cell
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), clamp(Math.round(gr), 0, ROOF - 1));
}
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

// outward faces of a footprint cell (a cell with a missing 4-neighbour is on the shell)
function faceInfo(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// deterministic scatter for warm lights
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// Shell block for a wall cell at height y (y >= ground of that cell).
function shellBlock(x, y, z, g) {
  const f = faceInfo(x, z);
  if (f.length === 0) return null;
  const corner = f.length >= 2;
  const face = f[0];
  const u = face === "north" || face === "south" ? x : z;
  const pier = corner || u % 3 === 0;
  const rb = y - g;

  if (y >= ROOF) return null;                       // roof deck handled separately
  if (rb === 0) return { id: "polished_granite" };  // base course at the ground line
  if (y >= 61 && y <= PARAPET_TOP) return { id: "white_concrete" };
  if (y === CORNICE) return { id: "smooth_quartz" };
  if (y < 5) {                                      // ground storey shopfront
    if (y === 4) return { id: "white_concrete" };   // lintel
    return pier ? { id: "polished_granite" } : { id: "cyan_stained_glass" };
  }
  if (y % 5 === 0) return { id: "light_gray_concrete" };  // floor line
  if (y % 5 === 4) return { id: "white_concrete" };       // spandrel
  return pier ? { id: "gray_concrete" } : { id: "cyan_stained_glass" };
}

const g = new Voxels([W, H, D]);

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs per storey, on the absolute datum, plus each cell's own ground and the roof deck.
const slabLevels = new Set([ROOF]);
for (let k = 0; k <= 12; k++) slabLevels.add(k * 5);
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  slabLevels.add(gr);
  for (const y of slabLevels) {
    if (y < gr) continue;
    if (y > ROOF) continue;
    g.set(x, y, z, "light_gray_concrete");
  }
}

// 3. Shell walls from each cell's ground up to the parapet.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (faceInfo(x, z).length === 0) continue;
  for (let y = gr; y <= PARAPET_TOP; y++) {
    const b = shellBlock(x, y, z, gr);
    if (b) g.set(x, y, z, b.id);
  }
}

// 4. Entrance lobby: three bays on the face with the most single-face shell cells.
//    Centre bay holds the door with a glowstone transom; flanks are dark glass.
const entranceCells = [];
{
  const counts = { north: [], south: [], west: [], east: [] };
  for (const [k] of ground) {
    const [x, z] = k.split(",").map(Number);
    const f = faceInfo(x, z);
    if (f.length === 1) counts[f[0]].push([x, z]);
  }
  let best = null;
  for (const face of Object.keys(counts)) {
    if (!best || counts[face].length > counts[best].length) best = face;
  }
  const list = counts[best];
  if (list && list.length) {
    const uIdx = best === "north" || best === "south" ? 0 : 1;
    list.sort((a, b) => a[uIdx] - b[uIdx]);
    const m = Math.floor(list.length / 2);
    for (const off of [-1, 0, 1]) {
      const c = list[m + off];
      if (c) entranceCells.push({ x: c[0], z: c[1], face: best, centre: off === 0 });
    }
  }
  for (const { x, z, face, centre } of entranceCells) {
    const gr = gAt(x, z);
    if (centre) {
      const props = { facing: face, hinge: "left", open: "false", powered: "false" };
      if (gr + 2 <= PARAPET_TOP) {
        g.set(x, gr + 1, z, "iron_door", { ...props, half: "lower" });
        g.set(x, gr + 2, z, "iron_door", { ...props, half: "upper" });
      }
      if (gr + 3 <= PARAPET_TOP) g.set(x, gr + 3, z, "glowstone");
    } else {
      for (let y = gr + 1; y <= Math.min(gr + 3, 4); y++) {
        g.set(x, y, z, "gray_stained_glass");
      }
    }
  }
}

// 5. Warm lights: glowstone just inside some glass panes.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const f = faceInfo(x, z);
  if (f.length !== 1) continue;
  const face = f[0];
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || faceInfo(ix, iz).length) continue;
  for (let y = gr; y <= 60; y++) {
    const rowIsGlass = (y % 5 >= 1 && y % 5 <= 3 && y >= 5) || (y < 5 && y >= 1 && y <= 3);
    if (!rowIsGlass) continue;
    const u = face === "north" || face === "south" ? x : z;
    if (u % 3 === 0) continue;
    if (hash(x, y, z) % 9 === 0) g.set(ix, y, iz, "glowstone");
  }
}

// 6. Roof plant room and lightning rod.
{
  const x0 = 8, x1 = 20, z0 = 7, z1 = 15;
  const inPlant = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
  for (const [k] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (!inPlant(x, z)) continue;
    const ring = x === x0 || x === x1 || z === z0 || z === z1;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (ring) g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, ROOF + 4, z, "light_gray_concrete");   // plant cap at y 68
  }
  // antenna on a footprint cell nearest the plant centre
  let cx = null, best = Infinity;
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
  for (const [k] of ground) {
    const [x, z] = k.split(",").map(Number);
    const d = (x - mx) ** 2 + (z - mz) ** 2;
    if (d < best) { best = d; cx = [x, z]; }
  }
  if (cx) {
    for (let y = ROOF + 5; y <= ROOF + 8; y++) {
      g.set(cx[0], y, cx[1], "lightning_rod", { facing: "up", powered: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
