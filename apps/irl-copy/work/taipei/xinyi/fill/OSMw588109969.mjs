import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109969";
const W = 22, H = 33, D = 51;
const ROOF_DECK = 20;   // roof deck row; parapet sits above it
const PARAPET = 21;     // top of parapet (roof reads ~21 above lowest ground)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const gmap = new Map();
for (const [x, z, gy] of cells) {
  gmap.set(`${x},${z}`, Math.max(0, Math.round(gy)));
}
const inside = (x, z) => gmap.has(`${x},${z}`);
const groundAt = (x, z) => gmap.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Exposed faces: [dx, dz, facingName]
const FACES = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

// Materials
const WALL = "white_concrete";
const PIER = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane";
const FRAME = "light_gray_concrete";
const BASE = "polished_granite";
const CORNICE = "smooth_quartz";
const FLOOR = "light_gray_concrete";
const FOUNDATION = "stone";

// ---- 1. foundations: solid from y0 up to each cell's ground -----------------
for (const [x, z, gy] of cells) {
  const ground = Math.max(0, Math.round(gy));
  for (let y = 0; y < ground; y++) put(x, y, z, FOUNDATION);
}

// ---- 2. floor slabs and roof deck across the whole footprint ----------------
for (const [x, z] of gmap.keys().map((k) => k.split(",").map(Number))) {
  for (const y of [5, 10, 15]) put(x, y, z, FLOOR);
  put(x, ROOF_DECK, z, FLOOR);
}

// ---- 3. walls, window grids, shopfronts, cornice ----------------------------
const wallCells = []; // {x,z,gy,faces}
for (const [key, gy] of gmap) {
  const [x, z] = key.split(",").map(Number);
  const faces = FACES.filter(([dx, dz]) => !inside(x + dx, z + dz));
  if (faces.length === 0) continue;
  wallCells.push({ x, z, gy, faces });
}

// Pick the entrance: exposed north-facing cell nearest the middle of the north front.
let entrance = null;
{
  const north = wallCells.filter((c) => c.faces.some(([, dz]) => dz === -1));
  if (north.length) {
    const xs = north.map((c) => c.x).sort((a, b) => a - b);
    const midX = xs[Math.floor(xs.length / 2)];
    entrance = north.reduce((best, c) =>
      !best || Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best, null);
  }
}

for (const c of wallCells) {
  const { x, z, gy, faces } = c;
  if (gy >= ROOF_DECK) continue;
  const [fdx, fdz] = faces[0];
  const isPier = ((x + z) % 4 === 0) || faces.length > 1; // corners and piers
  const isEntrance = entrance && entrance.x === x && entrance.z === z;

  for (let y = gy; y < ROOF_DECK; y++) {
    const k = Math.floor(y / 5);          // storey index 0..3
    const r = y - 5 * k;                  // row within storey 0..4
    let id = WALL;

    if (y === gy) {
      id = BASE;                          // base course at each cell's ground
    } else if (k === 0 && r >= 1 && r <= 3) {
      // shopfront: glazed ground floor
      id = isPier ? PIER : GLASS;
    } else if (r === 0 || r === 4) {
      id = isPier ? PIER : FRAME;         // sills and lintels
    } else if (r >= 1 && r <= 3) {
      id = isPier ? PIER : GLASS;         // upper storey windows
    }
    put(x, y, z, id);
  }

  // Parapet above the cornice course
  put(x, PARAPET, z, CORNICE, { type: "bottom", waterlogged: "false" });
  put(x, ROOF_DECK, z, CORNICE);
  // Cornice band just under parapet
  if (!isPier) put(x, ROOF_DECK - 1, z, CORNICE);
}

// Entrance door and glowing lintel
if (entrance) {
  const { x, z, gy } = entrance;
  const lower = gy + 1, upper = gy + 2;
  // clear whatever sits on the door cell first
  put(x, lower, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, upper, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gy + 3, z, "glowstone");
}

// Warm lights behind some upper-floor windows (interior cell just inward of glass)
for (const c of wallCells) {
  const { x, z, gy, faces } = c;
  if (faces.length !== 1) continue;
  const [dx, dz] = faces[0];
  const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz)) continue;
  for (let k = 1; k <= 3; k++) {
    const y = 5 * k + 2;
    if (y < gy || y >= ROOF_DECK) continue;
    if ((x + z + k) % 3 !== 0) continue;
    put(ix, y, iz, "glowstone");
  }
}

// ---- 4. rooftop plant core ---------------------------------------------------
{
  const xs = [...gmap.keys()].map((k) => Number(k.split(",")[0]));
  const zs = [...gmap.keys()].map((k) => Number(k.split(",")[1]));
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const z0 = Math.min(...zs), z1 = Math.max(...zs);
  const cx0 = x0 + 5, cx1 = x1 - 5, cz0 = z0 + 12, cz1 = z1 - 12;
  for (let x = cx0; x <= cx1; x++) {
    for (let z = cz0; z <= cz1; z++) {
      if (!inside(x, z)) continue;
      const ring = x === cx0 || x === cx1 || z === cz0 || z === cz1;
      for (let y = PARAPET; y <= 24; y++) {
        let id = WALL;
        if (ring && (y === 22 || y === 23) && (x + z) % 3 !== 0) id = GLASS;
        put(x, y, z, id);
      }
      put(x, 25, z, CORNICE);
    }
  }
  const mx = Math.round((cx0 + cx1) / 2), mz = Math.round((cz0 + cz1) / 2);
  if (inside(mx, mz)) {
    put(mx, 26, mz, "lightning_rod");
    put(mx, 27, mz, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
