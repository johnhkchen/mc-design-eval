import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise (about 2 storeys, roof ~11 blocks) concrete commercial block, Xinyi, 1980s-90s Taipei:
// stone-faced base, white render walls with light-grey piers, glass bays, cornice and parapet,
// rooftop water tank. Warm glowstone sits behind some upper windows for dusk reading.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343686";
const W = 29, H = 23, D = 19;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const c of raw) {
  const [x, z, g] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  if (x >= 0 && x < W && z >= 0 && z < D) cells.set(`${x},${z}`, Math.round(g));
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const has = (x, z) => cells.has(`${x},${z}`);
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const faces = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz)).map(([dx, dz]) => [dx, dz]);

const keys = [...cells.keys()].map((k) => k.split(",").map(Number));
const B = Math.min(...[...cells.values()]);               // lowest ground: storey datum
const minZ = Math.min(...keys.map(([, z]) => z));

// Entrance: median-x cell on the north (minZ) row, facing north.
const northRow = keys.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = northRow.length ? northRow[Math.floor(northRow.length / 2)] : -1;
const doorZ = minZ;

const T = B + 13; // parapet cap level

// Foundations and body for every footprint cell.
for (const [x, z] of keys) {
  const gr = cells.get(`${x},${z}`);
  const F = faces(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (F.length) {
    for (let y = gr; y <= T; y++) perimeter(x, z, y, F);
  } else {
    // Interior: solid ground storey core, floor slab at storey line, roof deck; air in storey 2.
    for (let y = gr; y <= B + 11; y++) {
      const yo = y - B;
      if (yo <= 5 || yo === 11) put(x, y, z, "smooth_stone");
    }
  }
}

function perimeter(x, z, y, F) {
  const yo = y - B;
  const face = F[0];
  const u = face[0] !== 0 ? z : x;            // position along the face
  const win = u % 3 !== 0;                    // piers every third block
  if (yo === 0) return put(x, y, z, "stone_bricks");
  if (yo >= 1 && yo <= 3) return put(x, y, z, win ? "glass" : "light_gray_concrete");
  if (yo === 4 || yo === 5) return put(x, y, z, "stone_bricks");
  if (yo >= 6 && yo <= 10) {
    if (yo === 6 || yo === 10) return put(x, y, z, win ? "light_gray_concrete" : "white_concrete");
    return put(x, y, z, win ? "glass" : "white_concrete");
  }
  if (yo === 11) return put(x, y, z, "stone_bricks");        // cornice
  if (yo === 12) return put(x, y, z, "white_concrete");      // parapet
  if (yo === 13) return put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// Warm light behind some upper-storey windows (glowstone on the interior side, on the floor slab).
for (const [x, z] of keys) {
  const F = faces(x, z);
  if (!F.length) continue;
  for (const [dx, dz] of F) {
    const u = dx !== 0 ? z : x;
    if (u % 6 !== 1) continue;
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz) || faces(ix, iz).length) continue;
    if (cells.get(`${ix},${iz}`) > B + 6) continue;
    put(ix, B + 6, iz, "glowstone");
  }
}

// Entrance door, lintel lantern.
if (northRow.length) {
  const dy = B + 1;
  const cellG = cells.get(`${doorX},${doorZ}`);
  if (cellG <= dy) {
    put(doorX, dy, doorZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(doorX, dy + 1, doorZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(doorX, B + 3, doorZ, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Rooftop water tank on a 2x2 block of interior roof cells nearest the centre.
const cx = (W - 1) / 2, cz = (D - 1) / 2;
let best = null;
for (const [x, z] of keys) {
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => {
    const tx = x + a, tz = z + b;
    return has(tx, tz) && faces(tx, tz).length === 0 && cells.get(`${tx},${tz}`) <= B + 11;
  });
  if (!ok) continue;
  const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  for (let yo = 12; yo <= 14; yo++) {
    for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      put(best.x + a, B + yo, best.z + b, "spruce_planks");
    }
  }
  for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    put(best.x + a, B + 15, best.z + b, "spruce_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
