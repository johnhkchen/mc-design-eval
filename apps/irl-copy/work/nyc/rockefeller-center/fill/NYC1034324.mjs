// 33 West 46th Street, 1915: a ten-storey brick office block on a stone plinth, with calcite storey lines, a
// calcite cornice and a stone parapet (the Renaissance-revival manner of the midtown loft-office), a nine-storey wing
// on the low ground to the west and east, a plant penthouse on the body's roof, and a stone-hooded double-door
// entrance on the street face (z 23, the south edge). Lidar roofs smoothed into two flat tiers by a 3x3 mean.
// No interiors: the walls are one cell thick with an air gap behind the glass, and each storey is a floor slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1034324.cells.json`, "utf8"));

const W = 11, D = 24;
const BODY = 33, WING = 29;                                    // roof layers (the top solid layer) of the two tiers
const key = (x, z) => `${x},${z}`;
const lidar = new Map(cells.map(([x, z, , roof]) => [key(x, z), roof]));
const inF = (x, z) => lidar.has(key(x, z));

// Smooth the noisy lidar (cells read 0 or 29..34) into two flat tiers: the 3x3 mean decides body or wing.
const roofAt = new Map();
for (const [x, z] of lidar.keys().map((k) => k.split(",").map(Number))) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = lidar.get(key(x + dx, z + dz)); if (r) { s += r; n++; }
  }
  roofAt.set(key(x, z), s / n >= 31.5 ? BODY : WING);
}
const roof = (x, z) => roofAt.get(key(x, z));

const DIRS = [[1, 0, "E"], [-1, 0, "W"], [0, 1, "S"], [0, -1, "N"]];   // +z is south; the street is z = D-1
// A tier cell's wall faces at height y: outside the footprint, or a lower neighbour whose roof is below y.
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  if (!inF(nx, nz)) return true;
  const Rn = roof(nx, nz);
  return Rn < roof(x, z) && y > Rn;
}).map((d) => d[2]);

const vox = new Map();                                         // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => vox.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => vox.has(`${x},${y},${z}`);

const GLASS_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };  // pane on an N/S face
const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // pane on an E/W face
const glass = (f) => (f === "N" || f === "S" ? ["glass_pane", GLASS_EW] : ["glass_pane", GLASS_NS]);
const DOOR = (half, hinge) => ({ facing: "south", half, hinge, open: "false", powered: "false" });

// Windows sit on odd indices along a face, piers (brick) on even ones; corners are always piers.
const windowAt = (f, x, z) => {
  const i = f === "N" || f === "S" ? x : z, max = f === "N" || f === "S" ? W - 1 : D - 1;
  return i > 0 && i < max && i % 2 === 1;
};
const windows = [];                                            // glass cells, to back with light

for (const [kx, kz] of lidar.keys().map((k) => k.split(",").map(Number))) {
  const x = kx, z = kz, R = roof(x, z);
  put(x, 0, z, "stone_bricks");                                // plinth: the ground-floor slab
  for (let y = 1; y <= R + 1; y++) {
    const f = faces(x, z, y);
    if (y === R) { put(x, y, z, "stone"); continue; }          // roof slab over the whole tier
    if (y === R + 1) { if (f.length) put(x, y, z, "stone_bricks"); continue; }   // parapet on exposed edges
    if (y % 3 === 0) { put(x, y, z, "calcite"); continue; }    // storey line / floor slab (solid, carried by the walls)
    if (!f.length) continue;                                   // interior air
    if (y === R - 1) { put(x, y, z, "calcite"); continue; }    // cornice course
    if (f.length > 1) { put(x, y, z, "stone_bricks"); continue; }   // corner pier
    const face = f[0], street = face === "S" && z === D - 1;
    if (street && y === 3 && x >= 3 && x <= 6) { put(x, y, z, "stone_bricks"); continue; }   // stone hood over the entrance
    if (street && y < 3) {                                     // commercial ground floor, shopfront glass
      if (x === 0 || x === 10 || x === 3 || x === 6) { put(x, y, z, "stone_bricks"); continue; }
      if (x === 4 || x === 5) {
        put(x, y, z, "iron_door", DOOR(y === 1 ? "lower" : "upper", x === 4 ? "left" : "right"));
        continue;
      }
      const [b, s] = glass(face); put(x, y, z, b, s); windows.push({ x, y, z, face }); continue;
    }
    if (windowAt(face, x, z)) {
      const [b, s] = glass(face); put(x, y, z, b, s); windows.push({ x, y, z, face });
    } else put(x, y, z, "bricks");
  }
}

// Penthouse on the body's core: a one-storey plant room on the roof (floor 34, walls 35, roof 36).
const P = new Set();
for (let x = 4; x <= 6; x++) for (let z = 12; z <= 16; z++) if (inF(x, z) && roof(x, z) === BODY) P.add(key(x, z));
for (const k of P) {
  const [x, z] = k.split(",").map(Number);
  put(x, BODY + 1, z, "calcite");
  const pf = DIRS.filter(([dx, dz]) => !P.has(key(x + dx, z + dz))).map((d) => d[2]);
  if (pf.length) {
    if (pf.length > 1) put(x, BODY + 2, z, "stone_bricks");
    else if (windowAt(pf[0], x, z)) {
      const [b, s] = glass(pf[0]); put(x, BODY + 2, z, b, s); windows.push({ x, y: BODY + 2, z, face: pf[0] });
    } else put(x, BODY + 2, z, "bricks");
  }
  put(x, BODY + 3, z, "stone_bricks");
}

// Plant boxes on the wing roof (stand on the roof slab at WING, two layers).
for (let x = 1; x <= 2; x++) for (let z = 3; z <= 4; z++) {
  if (!inF(x, z) || roof(x, z) !== WING) throw new Error(`no wing roof at ${x},${z}`);
  put(x, WING + 1, z, "stone_bricks"); put(x, WING + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// Lobby lantern behind the double doors, and warm glowstone behind every fourth window.
put(4, 1, D - 2, "lantern", { hanging: "false", waterlogged: "false" });
for (const { x, y, z, face } of windows) {
  if ((x + y + z) % 4 !== 0) continue;
  const [dx, dz] = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[face];
  const ix = x + dx, iz = z + dz;
  if (inF(ix, iz) && !has(ix, y, iz)) put(ix, y, iz, "glowstone");
}

const g = new Voxels([W, 46, D]);
for (const [k, { block, state }] of vox) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${dir}/NYC1034324.nbt`);
console.log(`NYC1034324.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
