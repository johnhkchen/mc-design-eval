import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const raw = JSON.parse(readFileSync(`${DIR}/NYC1083355.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);

const W = 21, H = 67, D = 40;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => x + "," + z;

// ---- footprint + massing ---------------------------------------------------
const map = new Map();
for (const [x, z, gr, rf] of list) {
  const ground = clamp(Math.round(gr), 0, H - 10);
  const roofRaw = Math.round(rf);
  let top = ground + 2 * Math.round((roofRaw - ground) / 2);
  top = clamp(top, ground + 4, H - 6);
  map.set(key(x, z), { x, z, base: ground, top });
}

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// depth from outside edge: 1 = facade, 2 = air gap / inner layer, 3+ = solid core
const depth = new Map();
let queue = [];
for (const c of map.values()) {
  const edge = NB.some(([dx, dz]) => !map.has(key(c.x + dx, c.z + dz)));
  if (edge) { depth.set(key(c.x, c.z), 1); queue.push(c); }
}
while (queue.length) {
  const next = [];
  for (const c of queue) {
    const d = depth.get(key(c.x, c.z));
    for (const [dx, dz] of NB) {
      const k = key(c.x + dx, c.z + dz);
      if (map.has(k) && !depth.has(k)) {
        depth.set(k, d + 1);
        next.push(map.get(k));
      }
    }
  }
  queue = next;
}

const maxTop = Math.max(...[...map.values()].map(c => c.top));
const facadeCells = [...map.values()].filter(c => depth.get(key(c.x, c.z)) === 1);

// street-facing entrance: lowest-z facade cell nearest the middle of that face
const minZ = Math.min(...facadeCells.map(c => c.z));
const faceCells = facadeCells.filter(c => c.z === minZ);
const midX = faceCells.reduce((s, c) => s + c.x, 0) / faceCells.length;
const doorCell = faceCells.reduce((best, c) =>
  Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best, faceCells[0]);
const DX = doorCell.x, DZ = doorCell.z;
const isFacade = (x, z) => map.has(key(x, z)) && depth.get(key(x, z)) === 1;

// ---- element helpers -------------------------------------------------------
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

function facadeBlock(x, y, z, off, base, top) {
  const idx = x + z;
  const isDoorCell = (x === DX && z === DZ);
  const onDoorFace = z === DZ;
  const dxa = Math.abs(x - DX);
  const nearDoor = dxa <= 1 && onDoorFace;     // door, its pilasters and canopy span
  const pilaster = dxa === 1 && onDoorFace;

  if (y === top - 1) return ["white_concrete"];                       // coping
  if (off === 0) {
    if (isDoorCell) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (pilaster) return ["stone_bricks"];                            // door surround
    return ["polished_andesite"];                                      // base course
  }
  if (off === 1) {
    if (isDoorCell) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (pilaster) return ["stone_bricks"];
    if (nearDoor) return ["gray_stained_glass"];                       // dark recessed lobby glass
    if (idx % 3 === 0) return ["white_concrete"];                      // shopfront piers
    return ["light_blue_stained_glass"];
  }
  if (off === 2) {
    if (nearDoor) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }]; // wide canopy
    return ["light_gray_concrete"];                                    // floor spandrel
  }
  if (off % 2 === 1) {                                                 // window rows
    if (idx % 3 === 0) return ["white_concrete"];                      // mullions
    return ["light_blue_stained_glass"];
  }
  return ["light_gray_concrete"];                                      // spandrels
}

// ---- build -----------------------------------------------------------------
for (const c of map.values()) {
  const { x, z, base, top } = c;
  const d = depth.get(key(x, z));

  // foundation up to ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  for (let y = base; y < top; y++) {
    const off = y - base;

    if (d === 1) {
      const [id, props] = facadeBlock(x, y, z, off, base, top);
      put(x, y, z, id, props);
      continue;
    }

    if (y === top - 1) { put(x, y, z, "gray_concrete"); continue; }   // flat roof surface

    if (d === 2 && off % 2 === 1 && off >= 1) {
      // air gap behind the glass; a few warm lights
      if (off >= 3 && ((x * 31 + z * 17 + y * 7) % 11 === 0)) put(x, y, z, "glowstone");
      continue;
    }

    put(x, y, z, "stone");                                             // floor slabs and solid core
  }
}

// lobby: a ceiling light behind the door recess, so the entrance reads at dusk
if (map.has(key(DX, DZ))) {
  const bz = DZ + 1;
  if (map.has(key(DX, bz))) put(DX, (map.get(key(DX, DZ)).base) + 1, bz, "glowstone");
}

// mechanical penthouse on the tallest tier
for (const c of map.values()) {
  const { x, z, top } = c;
  if (top !== maxTop) continue;
  if (x < 6 || x > 14 || z < 12 || z > 27) continue;
  if (depth.get(key(x, z)) < 2) continue;
  if (top + 3 > H) continue;
  put(x, top, z, "light_gray_concrete");
  put(x, top + 1, z, "light_gray_concrete");
  put(x, top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// roof corner lanterns on the parapet
for (const c of facadeCells) {
  const cornerX = (c.x === 0 || c.x === W - 1);
  const cornerZ = (c.z === 0 || c.z === D - 1);
  if (cornerX && cornerZ && c.top === maxTop) {
    put(c.x, c.top, c.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/NYC1083355.nbt`);
