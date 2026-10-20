import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1067738171";
const W = 19, H = 47, D = 41;

// Footprint: [x, z, ground] per cell.
const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

// Distance (in cells) to the footprint edge: 0 = perimeter cell.
function inset(x, z) {
  let best = Infinity;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let k = 0;
    while (has(x + dx * (k + 1), z + dz * (k + 1))) k++;
    best = Math.min(best, k);
  }
  return best;
}

const ins = new Map();
for (const [x, z] of cells) ins.set(key(x, z), inset(x, z));
const insAt = (x, z) => ins.get(key(x, z));

// Place only inside the footprint and above that cell's ground.
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z) || y < gnd(x, z)) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr && y < H; y++) vox.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs (one per storey, standing on the course below).
for (const [x, z] of cells) {
  const i = insAt(x, z);
  put(x, 0, z, "light_gray_concrete");
  for (const k of [1, 2, 3, 4, 5, 6]) put(x, 5 * k, z, "light_gray_concrete");
  if (i >= 2) put(x, 35, z, "light_gray_concrete");   // roof of the setback tier
  if (i >= 5) put(x, 40, z, "light_gray_concrete");   // roof of the penthouse
}

// Storey list: f = floor level, p = perimeter inset that carries walls.
// Ground floor (f=0) is a shopfront; f=30 is the setback tier; f=35 the penthouse.
const storeys = [
  { f: 0, p: 0, idx: 0 },
  { f: 5, p: 0, idx: 1 }, { f: 10, p: 0, idx: 2 }, { f: 15, p: 0, idx: 3 },
  { f: 20, p: 0, idx: 4 }, { f: 25, p: 0, idx: 5 },
  { f: 30, p: 2, idx: 6 },
  { f: 35, p: 5, idx: 7 },
];
const LIGHT_STOREYS = new Set([1, 3, 5, 7]);
const GLASS = "light_blue_stained_glass";
const MULLION = "white_concrete";

// 3. Walls, windows, entrance and warm lights.
for (const s of storeys) {
  for (const [x, z] of cells) {
    const i = insAt(x, z);
    if (i !== s.p) continue;

    for (let y = s.f + 1; y <= s.f + 4; y++) {
      let id = null, props = null;
      const bay = (x + z) % 3 === 0;   // mullion column

      if (s.f === 0) {
        // Shopfront: granite kickplate, glass, quartz lintel.
        if (y === 1) id = "polished_granite";
        else if (y === 4) id = "smooth_quartz";
        else id = bay ? MULLION : GLASS;
        // Main entrance on the z=0 face, centred.
        if (z === 0 && x === 9 && y <= 2) {
          id = "dark_oak_door";
          props = {
            facing: "north", hinge: "left", open: "false", powered: "false",
            half: y === 1 ? "lower" : "upper",
          };
        }
        if (z === 0 && x === 9 && y === 3) id = "smooth_quartz";
      } else {
        if (y === s.f + 1) id = MULLION;          // spandrel
        else if (y === s.f + 4) id = "smooth_quartz"; // lintel
        else id = bay ? MULLION : GLASS;
      }

      if (id) put(x, y, z, id, props);
    }

    // Warm lights: shroomlight in the room behind some glazed bays.
    if (s.f > 0 && LIGHT_STOREYS.has(s.idx) && (x + z) % 6 === 1) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dz] of dirs) {
        const nx = x + dx, nz = z + dz;
        if (has(nx, nz) && insAt(nx, nz) > i) {
          put(nx, s.f + 2, nz, "shroomlight");
          break;
        }
      }
    }
  }

  // Parapet on the outer edge of the setback tier.
  if (s.idx === 6) {
    for (const [x, z] of cells) {
      if (insAt(x, z) === 0) put(x, 31, z, "smooth_quartz");
    }
  }
}

// 4. Roof: tier parapet, penthouse cornice, roof plant, mast.
let maxIns = -1, mastX = 0, mastZ = 0;
for (const [x, z] of cells) {
  const i = insAt(x, z);
  if (i === 2) put(x, 36, z, "smooth_quartz");           // tier roof parapet
  if (i === 5) put(x, 41, z, "smooth_quartz");           // penthouse cornice
  if (i >= 6) put(x, 41, z, "light_gray_concrete");      // penthouse roof cap
  if (i === 3 && (x * 3 + z) % 5 === 0) {                // roof plant boxes
    put(x, 36, z, "light_gray_concrete");
    put(x, 37, z, "iron_block");
  }
  if (i > maxIns) { maxIns = i; mastX = x; mastZ = z; }
}
for (let y = 42; y <= 46; y++) put(mastX, y, mastZ, "lightning_rod");

vox.save(`${SRC}.nbt`);
