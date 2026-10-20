import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record-less guess: a 1980s-90s Taipei commercial/office block, 4 storeys of
// 5 blocks on a stone base, cream terracotta piers and spandrels, light-blue
// glass bays, a smooth belt course per storey, a cornice and parapet, a
// shopfront ground floor with a central entrance, and a small penthouse core.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711381";
const W = 26, H = 33, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => x * 1000 + z;
const G = new Map();
for (const [x, z, g] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(key(x, z), g);
}
const minG = Math.min(...G.values());
const has = (x, z) => G.has(key(x, z));
const gOf = (x, z) => G.get(key(x, z)) - minG;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE = (ns) =>
  ns
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const LEVEL_TOP = 20;   // cornice course
const PARAPET = 21;     // roof edge
const PENT_TOP = 24;

// Front entrance: the southernmost exterior cell in column x=13
let doorZ = -1;
for (let z = 0; z < D; z++) if (has(13, z) && !has(13, z + 1)) doorZ = z;
const doorG = doorZ >= 0 ? gOf(13, doorZ) : -1;

// Penthouse rectangle (interior cells only)
const P = { x0: 9, x1: 16, z0: 6, z1: 11 };
let penthouse = true;
for (let x = P.x0; x <= P.x1 && penthouse; x++)
  for (let z = P.z0; z <= P.z1; z++) {
    const ext = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
    if (!has(x, z) || ext || gOf(x, z) > LEVEL_TOP) { penthouse = false; break; }
  }

for (const [cx, cz] of cells.map(([x, z]) => [x, z])) {
  if (cx < 0 || cx >= W || cz < 0 || cz >= D) continue;
  const gr = gOf(cx, cz);
  const N = !has(cx, cz - 1), S = !has(cx, cz + 1);
  const Wf = !has(cx - 1, cz), E = !has(cx + 1, cz);
  const ext = N || S || Wf || E;
  const nsFace = N || S;
  const u = nsFace ? cx : cz;

  // Foundation fills from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(cx, y, cz, "stone_bricks");

  if (!ext) {
    // Interior: ground slab, floor slabs per storey, roof deck, air elsewhere
    put(cx, gr, cz, "gray_concrete");
    for (let k = 1; k <= 4; k++) {
      const L = k * 5;
      if (L > gr) put(cx, L, cz, k === 4 ? "gray_concrete" : "light_gray_concrete");
    }
    continue;
  }

  // Exterior: base course, then facade up to cornice, then parapet
  put(cx, gr, cz, "stone_bricks");
  for (let y = gr + 1; y <= PARAPET; y++) {
    if (y === PARAPET) { put(cx, y, cz, "white_terracotta"); continue; }
    if (y === LEVEL_TOP) { put(cx, y, cz, "smooth_stone"); continue; }
    if (y % 5 === 0) { put(cx, y, cz, "smooth_stone"); continue; }
    const pier = u % 3 === 0;
    if (pier) { put(cx, y, cz, "light_gray_concrete"); continue; }
    if (y % 5 === 4) { put(cx, y, cz, "white_terracotta"); continue; }
    // glass bay, some lit from behind
    if ((u * 7 + y * 3) % 13 === 0) { put(cx, y, cz, "glowstone"); continue; }
    put(cx, y, cz, "light_blue_stained_glass_pane", PANE(nsFace));
  }
}

// Entrance door and hanging lantern on the south face
if (doorZ >= 0 && doorG + 3 < 5) {
  const dy = doorG + 1;
  const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  put(13, dy, doorZ, "oak_door", door("lower"));
  put(13, dy + 1, doorZ, "oak_door", door("upper"));
  put(13, dy + 2, doorZ, "lantern", { hanging: "true", waterlogged: "false" });
}

// Penthouse core with glazed sides, flat roof, and a lightning rod
if (penthouse) {
  const { x0, x1, z0, z1 } = P;
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      put(x, 24, z, "gray_concrete");
      const onRing = x === x0 || x === x1 || z === z0 || z === z1;
      if (!onRing) continue;
      const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
      for (let y = 21; y <= 23; y++) {
        if (corner) { put(x, y, z, "light_gray_concrete"); continue; }
        const midZ = z > z0 && z < z1, midX = x > x0 && x < x1;
        const glassSide = y === 22 && ((x === x0 || x === x1) ? midZ : midX);
        if (glassSide) put(x, y, z, "light_blue_stained_glass_pane", PANE((x === x0 || x === x1)));
        else put(x, y, z, "white_terracotta");
      }
    }
  const cx = 12, cz = 8;
  put(cx, 25, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(cx, 26, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Rooftop plant: small AC blocks on the interior roof deck
for (let x = 0; x < W; x++)
  for (let z = 0; z < D; z++) {
    if (!has(x, z)) continue;
    const ext = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
    if (ext || gOf(x, z) > LEVEL_TOP) continue;
    if (penthouse && x >= P.x0 && x <= P.x1 && z >= P.z0 && z <= P.z1) continue;
    if (x % 6 === 3 && z % 5 === 2) put(x, 21, z, "iron_block");
  }

g.save(`${DIR}/${ID}.nbt`);
