import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1970s-80s Taiwanese commercial block: two storeys of white tiled
// concrete over a stone base, shopfronts at street level, a plain parapet and
// a small water tank on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456426";
const W = 19, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const B = Math.min(...cells.map((c) => c[2]));   // lowest ground = floor datum
const L0 = B, L1 = B + 5, L2 = B + 10;           // floor, floor, roof slabs
const PAR = B + 11;                              // parapet course

const FACES = [
  ["north", [0, -1]],
  ["south", [0, 1]],
  ["west", [-1, 0]],
  ["east", [1, 0]],
];
const faceOf = (x, z) => FACES.filter(([, [dx, dz]]) => !has(x + dx, z + dz));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;

// Entrance: a single-face cell on the north side nearest the middle.
const singles = cells
  .map(([x, z]) => [x, z, faceOf(x, z)])
  .filter(([, , f]) => f.length === 1);
const northSingles = singles.filter(([, , f]) => f[0][0] === "north");
const pool = (northSingles.length ? northSingles : singles).slice();
pool.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
const entrance = pool.length ? { x: pool[0][0], z: pool[0][1] } : null;

// Glass panes connect along the wall they sit in.
const pane = (dz) =>
  dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Element on a single-face perimeter cell at height y.
// Returns [id, props?, isWindowCell, band]
function faceEl(x, z, face, y) {
  const [name, [dx, dz]] = face;
  const t = dx !== 0 ? z : x;          // position along the wall
  const b = y <= B + 4 ? 0 : 1;        // storey band
  const r = y - (B + 5 * b);           // 1..4 within the storey
  const win = t % 2 === 1;
  const isDoor = entrance && entrance.x === x && entrance.z === z;

  if (isDoor) {
    if (r === 1) return ["oak_door", { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (r === 2) return ["oak_door", { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (r === 3) return ["glass_pane", pane(dz)];
    return ["light_gray_concrete"];
  }
  if (b === 0) {
    if (r === 4) return ["light_gray_concrete"];           // shopfront lintel
    if (!win) return ["stone_bricks"];                     // pier
    return ["glass_pane", pane(dz)];                       // shop window
  }
  // upper storey
  if (!win) return ["white_concrete"];
  if (r === 1) return ["light_gray_concrete"];             // sill
  if (r === 4) return ["white_concrete"];                  // head
  return ["glass_pane", pane(dz)];
}

for (const [x, z, gy] of cells) {
  const fs = faceOf(x, z);
  const perim = fs.length > 0;

  // Foundation up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Ground surface above foundation where this cell sits above the datum.
  if (gy > B) put(x, gy, z, perim ? "stone_bricks" : "smooth_stone");

  // Floor and roof slabs; storey lines on the facade.
  for (const L of [L0, L1, L2]) {
    if (L < gy) continue;
    let id;
    if (perim) id = L === L0 ? "stone_bricks" : L === L1 ? "white_concrete" : "light_gray_concrete";
    else id = L === L2 ? "light_gray_concrete" : "smooth_stone";
    put(x, L, z, id);
  }

  // Walls.
  if (perim) {
    for (let y = Math.max(gy + 1, B); y <= B + 9; y++) {
      if (y === L0 || y === L1 || y === L2) continue;
      if (fs.length >= 2) {
        put(x, y, z, "white_concrete"); // corner pier
        continue;
      }
      const face = fs[0];
      const [id, props] = faceEl(x, z, face, y);
      put(x, y, z, id, props);

      // Warm light: lantern on the interior floor behind some upper windows.
      const b = y <= B + 4 ? 0 : 1;
      const r = y - (B + 5 * b);
      const t = face[1][0] !== 0 ? z : x;
      if (r === 2 && t % 4 === 1 && id === "glass_pane") {
        const [dx, dz] = face[1];
        const nx = x - dx, nz = z - dz;
        const lightY = B + 5 * b + 1;
        if (has(nx, nz) && gnd(nx, nz) < lightY && B + 5 * b >= gnd(nx, nz)) {
          put(nx, lightY, nz, "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    }

    // Parapet with a cap course.
    if (gy < PAR) {
      put(x, PAR, z, "white_concrete");
      put(x, PAR + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Rooftop water tank on the interior cell nearest the centre.
const interior = cells.filter(([x, z]) => faceOf(x, z).length === 0 && gnd(x, z) <= L2);
if (interior.length && PAR + 3 < H) {
  interior.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz));
  const [tx, tz] = interior[0];
  put(tx, PAR, tz, "white_concrete");
  put(tx, PAR + 1, tz, "white_concrete");
  put(tx, PAR + 2, tz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
