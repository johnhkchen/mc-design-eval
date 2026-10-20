import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1990s-style Xinyi commercial block: two storeys of tiled and quartz
// facade, glazed shopfront, a stone base course and a parapet with rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403757";
const W = 13, D = 14, H = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(key(x, z), Math.round(gy));
const has = (x, z) => ground.has(key(x, z));

// Body floor level: the highest ground under the footprint, so the whole
// plinth is solid and no storey hangs over a gap.
let baseY = 0;
for (const gy of ground.values()) baseY = Math.max(baseY, gy);

// Storey geometry: ground storey 5 blocks, upper storey to the roof at ~11
// above the lowest ground (absolute y 11 when baseY = 1).
const slab2 = baseY + 5;                 // first-floor slab / storey line
const roofY = Math.max(11, baseY + 8);   // roof slab top
const ROOF_TOP = roofY + 2;              // plant and parapet headroom (< H)

// Exterior cell test and the outward face it sits on.
const isExt = (x, z) => has(x, z) && (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
};
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Entrance: the middle cell of the north (z-minimum) face.
const northXs = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (has(x, z) && !has(x, z - 1)) northXs.push(x);
}
northXs.sort((a, b) => a - b);
const doorX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;
const isDoor = (x, z) => faceOf(x, z) === "N" && x === doorX && !isCorner(x, z);

const g = new Voxels([W, H, D]);

function facade(x, z, y) {
  const face = faceOf(x, z);
  const u = face === "N" || face === "S" ? x : z;
  const corner = isCorner(x, z);
  const pier = corner || u % 3 === 0;

  if (y === baseY) return corner ? "stone_bricks" : "smooth_stone";   // base course
  if (y === baseY + 4) return "stone_bricks";                          // ground-storey lintel
  if (y === slab2) return "stone_bricks";                              // storey line
  if (y === roofY - 1) return "smooth_stone";                          // cornice

  if (y <= baseY + 3) {                                                // shopfront
    if (pier) return "smooth_quartz";
    return "glass";
  }
  if (y > slab2 && y <= roofY - 2) {                                   // upper storey
    if (pier) return "white_concrete";
    return (x + z) % 7 === 0 ? "glowstone" : "glass";                  // a few lit panels
  }
  return "white_concrete";
}

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!has(x, z)) continue;
    const ext = isExt(x, z);

    // Foundation: solid from y 0 up to the body floor.
    for (let y = 0; y < baseY; y++) g.set(x, y, z, "stone_bricks");

    // Ground-floor slab / base course.
    if (ext) g.set(x, baseY, z, facade(x, z, baseY));
    else g.set(x, baseY, z, "smooth_stone");

    // Storeys.
    for (let y = baseY + 1; y < roofY; y++) {
      if (ext) {
        if (isDoor(x, z) && (y === baseY + 1 || y === baseY + 2)) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north",
            half: y === baseY + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (isDoor(x, z) && y === baseY + 3) {
          g.set(x, y, z, "smooth_quartz");
        } else {
          g.set(x, y, z, facade(x, z, y));
        }
      } else if (y === slab2) {
        g.set(x, y, z, "smooth_stone"); // interior floor slab, air above and below
      }
    }

    // Roof slab and parapet.
    g.set(x, roofY, z, "smooth_stone");
    if (ext) {
      g.set(x, roofY + 1, z, isCorner(x, z) ? "shroomlight" : "white_concrete");
    }
  }
}

// Rooftop plant: a condenser block and a small penthouse near the centre.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
for (let dx = -1; dx <= 0; dx++) for (let dz = -1; dz <= 0; dz++) {
  const x = cx + dx, z = cz + dz;
  if (has(x, z) && !isExt(x, z)) g.set(x, roofY + 1, z, "iron_block");
}
if (has(cx, cz) && !isExt(cx, cz)) {
  g.set(cx, roofY + 1, cz, "light_gray_concrete");
  g.set(cx, roofY + 2, cz, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
