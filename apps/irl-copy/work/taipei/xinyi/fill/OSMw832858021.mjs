import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw832858021";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells || []);

const W = 17, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const c of list) {
  const x = c[0], z = c[1];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.round(c[2] ?? 0)));
}
const cellsXZ = [...ground.keys()].map((k) => k.split(",").map(Number));
const inF = (x, z) => ground.has(key(x, z));

// Lowest ground sets the datum; the roof sits about 11 blocks above it.
let L = Infinity;
for (const v of ground.values()) L = Math.min(L, v);
if (!isFinite(L)) L = 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Per-cell base (ground), clamped so the storeys always fit under the roof datum.
const base = new Map();
for (const [k, v] of ground) base.set(k, clamp(v, 0, L + 8));

const isEdge = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade grid: mullions every 4 blocks plus the corners.
const pier = (x, z) => x % 4 === 0 || x === W - 1 || z % 4 === 0 || z === D - 1;

const R = L + 10;           // roof slab
const T = Math.min(L + 11, H - 1); // parapet top
const F2 = L + 5;           // storey 2 floor slab

// 1) Foundation, base course, storeys, slabs, cornice, parapet.
for (const [x, z] of cellsXZ) {
  const gc = base.get(key(x, z));
  const edge = isEdge(x, z);
  const pr = pier(x, z);

  // Foundation fill under the cell.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  // Base course / ground floor slab.
  put(x, gc, z, edge ? "polished_andesite" : "smooth_stone");

  // Storey 1: shopfront (y L+1..L+4).
  for (let y = Math.max(gc + 1, L + 1); y <= L + 4; y++) {
    if (!edge) continue;
    if (y === L + 4) put(x, y, z, "polished_andesite");
    else if (pr) put(x, y, z, "stone_bricks");
    else put(x, y, z, "glass");
  }

  // Storey 2 floor slab.
  if (F2 > gc) put(x, F2, z, edge ? "smooth_stone" : "smooth_stone");

  // Storey 2 walls (y L+6..L+9).
  for (let y = Math.max(gc + 1, F2 + 1); y <= L + 9; y++) {
    if (!edge) continue;
    if (pr) put(x, y, z, "white_concrete");
    else if (y === F2 + 1 || y === L + 9) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "cyan_stained_glass_pane");
  }

  // Roof slab and cornice.
  if (R > gc) {
    put(x, R, z, edge ? "smooth_stone" : "gray_concrete");
  }

  // Parapet on the perimeter.
  if (edge && T > gc && T > R) put(x, T, z, "white_concrete");
}

// 2) Warm lights behind some glass (only where the inner cell is open air).
for (const [x, z] of cellsXZ) {
  if (!isEdge(x, z) || pier(x, z)) continue;
  const gc = base.get(key(x, z));
  // Inward neighbour.
  let dx = 0, dz = 0;
  if (!inF(x - 1, z)) dx = 1; else if (!inF(x + 1, z)) dx = -1;
  if (!inF(x, z - 1)) dz = 1; else if (!inF(x, z + 1)) dz = -1;
  const ix = x + dx, iz = z + dz;
  if (!inF(ix, iz) || (dx === 0 && dz === 0)) continue;
  const gn = base.get(key(ix, iz));

  // Ground-floor glowstone behind shopfront glass.
  if ((x + z) % 2 === 0 && gn <= L + 2 && gc < L + 2) {
    put(ix, L + 2, iz, "glowstone");
  }
  // Upper-storey shroomlight behind a window.
  if ((x + z) % 3 === 0 && gn <= L + 7 && gc < L + 7) {
    put(ix, L + 7, iz, "shroomlight");
  }
}

// 3) Rooftop plant room, set back from the parapet.
for (let x = 6; x <= 10; x++) {
  for (let z = 8; z <= 13; z++) {
    if (!inF(x, z)) continue;
    const gc = base.get(key(x, z));
    if (L + 11 > gc) put(x, L + 11, z, "light_gray_concrete");
    if (L + 12 > gc && L + 12 < H) put(x, L + 12, z, "iron_block");
  }
}

// 4) Entrance on the min-z street front, middle of the frontage.
{
  let minZ = Infinity;
  for (const [, z] of cellsXZ) minZ = Math.min(minZ, z);
  const front = cellsXZ.filter(([x, z]) => z === minZ && isEdge(x, z)).map(([x]) => x).sort((a, b) => a - b);
  if (front.length) {
    const ex = front[Math.floor(front.length / 2)];
    const ez = minZ;
    const gc = base.get(key(ex, ez));
    const dy = gc + 1;
    if (dy + 1 <= L + 4) {
      put(ex, dy, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(ex, dy + 1, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    // Hanging lantern over the door, in the storey 1 frieze.
    if (gc + 3 <= L + 4) put(ex, gc + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
