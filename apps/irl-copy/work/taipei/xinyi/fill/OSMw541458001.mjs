import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458001";
const W = 12, H = 23, D = 18;
const ROOF = 10;            // top body block; roof surface at y = 11
const FLOOR_2 = 5;          // storey line between the two storeys (5 blocks each)

// ---- footprint and ground -------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(g))));
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Which outward face a footprint cell sits on (null = interior cell).
const faceOf = (x, z) =>
  !inFp(x, z - 1) ? "N" :
  !inFp(x, z + 1) ? "S" :
  !inFp(x - 1, z) ? "W" :
  !inFp(x + 1, z) ? "E" : null;

const OUT = { N: "north", S: "south", W: "west", E: "east" };
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Pier (white concrete frame) every 3 blocks along a face, plus the corners.
function isPier(x, z, f) {
  if (f === "N" || f === "S") return (x - minX) % 3 === 0 || x === maxX;
  return (z - minZ) % 3 === 0 || z === maxZ;
}

// ---- entrance: one door on the street-facing side, nearest mid-frontage ----
let door = null;
for (const f of ["N", "S", "W", "E"]) {
  const cands = [];
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (faceOf(x, z) === f && gAt(x, z) <= 2) cands.push([x, z]);
  }
  if (!cands.length) continue;
  const along = (c) => (f === "N" || f === "S" ? c[0] : c[1]);
  const mid = f === "N" || f === "S" ? (minX + maxX) / 2 : (minZ + maxZ) / 2;
  cands.sort((a, b) => Math.abs(along(a) - mid) - Math.abs(along(b) - mid));
  const [dx, dz] = cands[0];
  door = { x: dx, z: dz, f, g: gAt(dx, dz) };
  break;
}

// ---- output voxels --------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, arr) => g.set(x, y, z, arr[0], arr[1]);

// Facade material for a face cell at absolute height y (ground g under it).
function facadeBlock(x, z, f, y, gr) {
  if (y === ROOF) return ["smooth_quartz"];                 // cornice / parapet
  if (y === gr) return ["polished_andesite"];               // base course
  if (y === FLOOR_2) return ["smooth_quartz"];              // storey line

  if (y <= 4) {                                             // ground-floor shopfront
    if (door && door.x === x && door.z === z) {
      const facing = OUT[f];
      if (y === door.g + 1)
        return ["dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === door.g + 2)
        return ["dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" }];
      if (y === door.g + 3 && door.g <= 1)
        return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }]; // canopy
    }
    if (isPier(x, z, f)) return ["white_concrete"];
    if (y === 4) return ["smooth_quartz"];                  // shopfront lintel
    return ["glass"];
  }

  // upper storey (y 6..9)
  if (isPier(x, z, f)) return ["white_concrete"];
  if (y === 6) return ["smooth_quartz_slab", { type: "bottom", waterlogged: "false" }]; // sill
  if (y === 9) return ["smooth_quartz"];                    // head course
  return ["glass_pane"];                                    // y 7, 8
}

// Body: foundations, facade, floor slabs and roof deck inside.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = gAt(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, ["stone_bricks"]);

  const f = faceOf(x, z);
  for (let y = gr; y <= ROOF; y++) {
    if (f) {
      put(x, y, z, facadeBlock(x, z, f, y, gr));
    } else if (y === gr || y === FLOOR_2 || y === ROOF) {
      put(x, y, z, ["light_gray_concrete"]);               // floor slabs / roof deck
    }
  }
}

// Warm light behind some upper-storey windows.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const f = faceOf(x, z);
  if (!f || isPier(x, z, f)) continue;
  if ((x * 5 + z * 7) % 4 !== 0) continue;
  const [dx, dz] = IN[f];
  const ix = x + dx, iz = z + dz;
  if (!inFp(ix, iz) || faceOf(ix, iz) || gAt(ix, iz) > 7) continue;
  g.set(ix, 7, iz, "glowstone");
}

// ---- roof equipment: water tank (2x2 enclosure) and lightning rod ---------
const cx = Math.floor((minX + maxX) / 2) - 1;
const cz = Math.floor((minZ + maxZ) / 2) - 1;
const tankCells = [[cx, cz], [cx + 1, cz], [cx, cz + 1], [cx + 1, cz + 1]];
if (tankCells.every(([x, z]) => inFp(x, z) && !faceOf(x, z))) {
  for (const [x, z] of tankCells) {
    put(x, 11, z, ["white_concrete"]);
    put(x, 12, z, ["white_concrete"]);
    put(x, 13, z, ["iron_block"]);
  }
}

// Lightning rod on an interior roof cell away from the tank.
let rod = null;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (faceOf(x, z)) continue;
  if (tankCells.some(([tx, tz]) => tx === x && tz === z)) continue;
  if (!rod || x + z > rod[0] + rod[1]) rod = [x, z];
}
if (rod) {
  put(rod[0], 11, rod[1], ["lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }]);
}

g.save(`${DIR}/${ID}.nbt`);
