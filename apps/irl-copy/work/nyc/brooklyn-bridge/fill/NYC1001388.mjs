import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 411 Pearl Street, 1975: a Civic Center era municipal office tower.
// Smooth-stone piers, polished andesite spandrels, tinted gray glass,
// a granite base, a stepped tower with a setback, and a rooftop mechanical plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001388";
const W = 58, H = 38, D = 60;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);

const key = (x, z) => x * D + z;
const cellMap = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

for (const row of rows) {
  let x, z, g, r;
  if (Array.isArray(row)) [x, z, g, r] = row;
  else ({ x, z, ground: g, roof: r } = row);
  if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  g = Math.max(0, Math.min(H - 4, Math.round(g ?? 0)));
  r = Math.round(r ?? g + 4);
  r = Math.min(H, Math.max(g + 4, 2 * Math.round(r / 2)));
  cellMap.set(key(x, z), { g, r });
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const BH = Math.max(...[...cellMap.values()].map((c) => c.r));
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);
const inFoot = (x, z) => x >= 0 && x < W && z >= 0 && z < D && cellMap.has(key(x, z));

// Entrance: the street-facing (-z) edge cell nearest the footprint's lowest z,
// then closest to the centre x. Its ground is the entrance ground.
let door = null;
for (const k of cellMap.keys()) {
  const x = Math.floor(k / D), z = k % D;
  if (inFoot(x, z - 1)) continue;
  const score = z * 1000 + Math.abs(x - cx);
  if (!door || score < door.score) door = { x, z, score };
}

// Edge distance (4-neighbour BFS from outside the footprint)
const dist = new Int32Array(W * D).fill(-1);
const queue = [];
for (const k of cellMap.keys()) {
  const x = Math.floor(k / D), z = k % D;
  if (!inFoot(x + 1, z) || !inFoot(x - 1, z) || !inFoot(x, z + 1) || !inFoot(x, z - 1)) {
    dist[k] = 0;
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d0 = dist[key(x, z)];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!inFoot(nx, nz)) continue;
    const k = key(nx, nz);
    if (dist[k] === -1) { dist[k] = d0 + 1; queue.push([nx, nz]); }
  }
}
const edgeDist = (x, z) => {
  const d = dist[key(x, z)];
  return d < 0 ? 0 : d;
};

// Body of the building: podium, tower, and a top setback that pulls back 5 blocks from the edge
function bodyAt(x, y, z) {
  const c = cellMap.get(key(x, z));
  if (!c || y < c.g || y >= c.r) return false;
  if (y >= BH - 10 && y >= c.g + 8 && edgeDist(x, z) < 5) return false;
  return true;
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposures = (x, y, z) => DIRS.filter(([dx, dz]) => !bodyAt(x + dx, y, z + dz));

function solid(x, y, z) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return false;
  const c = cellMap.get(key(x, z));
  if (!c) return false;
  if (y < c.g) return true; // foundation
  if (!bodyAt(x, y, z)) return false;
  if (!bodyAt(x, y + 1, z)) return true; // roof / setback cap
  const rel = y - c.g;
  if (rel === 0) return true; // base course
  if (exposures(x, y, z).length > 0) return true; // exterior shell
  if (rel % 2 === 0) return true; // floor slab
  return false; // interior air behind glass
}

const out = new Map(); // "x,y,z" -> { id, props }
const put = (x, y, z, id, props) => out.set(`${x},${y},${z}`, { x, y, z, id, props });

function blockAt(x, y, z) {
  const c = cellMap.get(key(x, z));
  if (y < c.g) return { id: "stone" };
  const ex = exposures(x, y, z);
  const rel = y - c.g;
  const exterior = ex.length > 0;

  // Roof level: parapet/cornice on the edge, gray roof deck inside
  if (!bodyAt(x, y + 1, z)) {
    return exterior ? { id: "smooth_stone" } : { id: "gray_concrete" };
  }
  if (rel === 0) return exterior ? { id: "polished_granite" } : { id: "light_gray_concrete" };
  if (!exterior) return { id: "light_gray_concrete" };

  // Entrance: iron door on the street face, two blocks high
  const onStreetFace = ex.some(([dx, dz]) => dx === 0 && dz === -1);
  if (onStreetFace && door && x === door.x && z === door.z && (rel === 1 || rel === 2)) {
    return {
      id: "iron_door",
      props: { facing: "north", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" },
    };
  }

  // Spandrel bands at each floor line
  if (rel % 2 === 0) return { id: "polished_andesite" };

  // Window bays: smooth-stone piers every third bay, tinted glass between
  const [dx] = ex[0];
  const idx = dx !== 0 ? z : x;
  const bay = ((idx % 3) + 3) % 3;
  if (bay === 0) return { id: "smooth_stone" };
  return { id: "gray_stained_glass" };
}

// Solid shell
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
      if (!solid(x, y, z)) continue;
      const b = blockAt(x, y, z);
      put(x, y, z, b.id, b.props);
    }
  }
}

// Lit lobby behind the entrance
if (door) {
  const c = cellMap.get(key(door.x, door.z));
  const ly = c.g + 1;
  if (!solid(door.x, ly, door.z + 1) && door.z + 1 < D) {
    put(door.x, ly, door.z + 1, "lantern", { hanging: "false" });
  }
  if (!solid(door.x - 1, ly, door.z + 1) && door.x - 1 >= 0 && door.z + 1 < D) {
    put(door.x - 1, ly, door.z + 1, "lantern", { hanging: "false" });
  }
}

// Warm lights behind some glass (interior air cells next to the glass)
for (const b of [...out.values()]) {
  if (b.id !== "gray_stained_glass") continue;
  const c = cellMap.get(key(b.x, b.z));
  const rel = b.y - c.g;
  if (rel % 2 === 0) continue;
  const ex = exposures(b.x, b.y, b.z);
  if (ex.length === 0) continue;
  const [dx, dz] = ex[0];
  const idx = dx !== 0 ? b.z : b.x;
  const storey = Math.floor(rel / 2);
  if (((idx + storey) % 5) !== 1) continue;
  const lx = b.x - dx, lz = b.z - dz;
  if (solid(lx, b.y, lz)) continue;
  if (lx < 0 || lx >= W || lz < 0 || lz >= D) continue;
  put(lx, b.y, lz, "shroomlight");
}

// Rooftop mechanical plant on the tower top
for (const [k, c] of cellMap) {
  if (c.r !== BH) continue;
  const x = Math.floor(k / D), z = k % D;
  if (x - cx < -10 || x - cx > -4 || z - cz < -4 || z - cz > 4) continue;
  for (const y of [BH, BH + 1]) {
    if (y >= H) continue;
    put(x, y, z, y === BH ? "gray_concrete" : "light_gray_concrete");
  }
}

// Write
const g = new Voxels([W, H, D]);
for (const b of out.values()) {
  if (b.x < 0 || b.x >= W || b.y < 0 || b.y >= H || b.z < 0 || b.z >= D) continue;
  if (b.props) g.set(b.x, b.y, b.z, b.id, b.props);
  else g.set(b.x, b.y, b.z, b.id);
}
g.save(`${DIR}/${ID}.nbt`);
