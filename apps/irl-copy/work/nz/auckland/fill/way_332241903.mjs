// way 332241903: a 1920s brick commercial block on the Mt Eden / Eden Terrace side of the CBD ridge. Shopfronts on the
// ground floor under a dark fascia, two storeys of sash-style windows in brick piers, quartz sill and string bands,
// a quartz cornice, flat stone roofs with a plant box on the top tier. The lidar roof (5-12 blocks above y 0) is
// quantized to three flat tiers (6 = one storey, 10 = two, 12 = three), so the massing steps down to the north-west.
// Shell rule: an edge cell (on the footprint's edge, or beside a lower tier) is solid from its ground to its top, so
// every wall stands on the floor below; interiors are air with a floor slab at y 4 and 8 and a roof slab on each tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_332241903.cells.json`, "utf8"));
const N = 33, YMAX = 25;
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];   // N is -z, W is -x (the outward face names)
const OUT = { N: "north", S: "south", W: "west", E: "east" };
const INNER = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };      // from the facade cell back into the building

// per-cell ground (floor level, at least 1 so every cell has a floor) and roof, from the lidar cells
const G = Array.from({ length: N }, () => Array(N).fill(-1));
const R = Array.from({ length: N }, () => Array(N).fill(0));
for (const [x, z, g, r] of cells) { G[x][z] = Math.max(1, g); R[x][z] = r; }
const inF = (x, z) => x >= 0 && z >= 0 && x < N && z < N && G[x][z] >= 0;

// roof tiers: 6 = one storey with parapet, 10 = two storeys, 12 = three; lidar noise smoothed by a neighbour vote
const quant = (r) => (r <= 7 ? 6 : r <= 10 ? 10 : 12);
let tier = Array.from({ length: N }, (_, x) => Array.from({ length: N }, (_, z) => (inF(x, z) ? quant(R[x][z]) : 0)));
{
  const next = tier.map((row) => row.slice());
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    if (!inF(x, z)) continue;
    const votes = [tier[x][z]];
    for (const [, dx, dz] of DIRS) if (inF(x + dx, z + dz)) votes.push(tier[x + dx][z + dz]);
    const count = new Map(); for (const v of votes) count.set(v, (count.get(v) || 0) + 1);
    const [best, n] = [...count].sort((a, b) => b[1] - a[1])[0];
    if (n >= 3 && best !== tier[x][z]) next[x][z] = best;
  }
  tier = next;
}
const T = (x, z) => (inF(x, z) ? tier[x][z] : 0);

// an edge cell touches the outside or a lower tier; it is solid from its ground to its top
const edge = (x, z) => DIRS.some(([, dx, dz]) => !inF(x + dx, z + dz) || T(x + dx, z + dz) < T(x, z));

function solid(x, z, y) {
  if (!inF(x, z) || y < 0) return false;
  const g = G[x][z], t = T(x, z);
  if (y < g) return true;                       // foundation
  if (y >= t) return false;
  if (y === t - 1) return true;                 // roof or cornice
  if (edge(x, z)) return true;                  // wall
  return y === 4 || (y === 8 && t > 8);         // floor slabs of the storeys
}

// the faces of a solid cell that look out: off the footprint, or above a lower neighbour's roof
function outwardDirs(x, z, y) {
  return DIRS.filter(([, dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return !inF(nx, nz) || y >= T(nx, nz);
  });
}

// the facade block at height y on bay index i (the along-wall coordinate), for a tier of height t
function facadeBlock(y, i, t) {
  if (y === t - 1) return "smooth_quartz";                                  // cornice / parapet cap
  if (y < 2) return "stone_bricks";                                          // plinth
  if (y <= 3) return i % 4 === 0 ? "bricks" : "glass_pane";                  // shopfront under the fascia
  if (y === 4) return "dark_oak_planks";                                     // shop fascia
  if (y === 5 || y === 8) return "smooth_quartz";                            // sills and string courses
  return i % 4 === 0 || i % 4 === 3 ? "bricks" : "glass_pane";              // storey windows in brick piers
}

const v = new Voxels([N, YMAX, N]);
const placed = new Set();
const key = (x, y, z) => `${x},${y},${z}`;
const place = (x, y, z, block, state) => { v.set(x, y, z, block, state); placed.add(key(x, y, z)); };

// shell and tiers
for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
  if (!inF(x, z)) continue;
  for (let y = 0; y < Math.min(YMAX, T(x, z)); y++) {
    if (!solid(x, z, y)) continue;
    const out = outwardDirs(x, z, y);
    if (out.length) {
      const [name, dx] = out[0];
      const i = dx === 0 ? x : z;
      const t = T(x, z);
      let b = y < G[x][z] ? "stone_bricks" : facadeBlock(y, i, t);
      // a glass pane needs air behind it: otherwise it is brick
      if (b === "glass_pane") { const [ix, iz] = INNER[name]; if (solid(x + ix, z + iz, y)) b = "bricks"; }
      place(x, y, z, b);
    } else if (y < G[x][z]) place(x, y, z, "stone_bricks");
    else if (y === T(x, z) - 1) place(x, y, z, "stone");
    else if (y === 4 || y === 8) place(x, y, z, "smooth_stone");
    else place(x, y, z, "bricks");
  }
}

// one door, on the outer ground-floor bay nearest the middle of the front
{
  let best = null;
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    if (!inF(x, z) || G[x][z] > 2 || T(x, z) < 10) continue;
    for (const [name, dx, dz] of DIRS) {
      if (inF(x + dx, z + dz)) continue;
      const i = dx === 0 ? x : z;
      if (i % 4 === 0) continue;
      const score = Math.abs(i - 16);
      if (!best || score < best.score) best = { x, z, name, score };
    }
  }
  if (best) {
    const { x, z, name } = best;
    place(x, 2, z, "dark_oak_door", { facing: OUT[name], half: "lower", hinge: "left", open: "false", powered: "false" });
    place(x, 3, z, "dark_oak_door", { facing: OUT[name], half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// warm light behind some windows: a hanging lantern under the ceiling of the room behind the glass
for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
  if (!inF(x, z) || !edge(x, z)) continue;
  for (const y of [3, 7, 10]) {
    if (!placed.has(key(x, y, z)) || y >= T(x, z) - 1) continue;
    const out = outwardDirs(x, z, y);
    if (!out.length || (x * 5 + z * 3 + y) % 7 !== 0) continue;
    const [name] = out[0];
    const [ix, iz] = INNER[name];
    if (!inF(x + ix, z + iz) || solid(x + ix, z + iz, y) || !solid(x + ix, z + iz, y + 1)) continue;
    place(x + ix, y, z + iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// roof equipment on the top tier: plant boxes on the roof slab
for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
  if (!inF(x, z) || T(x, z) !== 12 || edge(x, z)) continue;
  if ((x % 8 === 3 || x % 8 === 4) && (z % 8 === 3 || z % 8 === 4)) place(x, 12, z, "light_gray_concrete");
}

const out = `${HERE}/way_332241903.nbt`;
const stats = v.save(out);
const tiers = {}; for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) if (inF(x, z)) tiers[T(x, z)] = (tiers[T(x, z)] || 0) + 1;
console.log(JSON.stringify({ file: out, blocks: stats.blocks, palette: stats.palette, tiers }));
