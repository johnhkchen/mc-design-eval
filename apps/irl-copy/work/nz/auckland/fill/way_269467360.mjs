// Way 269467360, the Mt Eden / Eden Terrace side of the CBD: a 1960s concrete-frame office block with ribbon glazing in
// tinted glass between white storey lines, a stone base course, a flat roof with a parapet, on a podium with a tower core.
// Lidar roof tiers 13 (base), 14 (podium and wings), 16 (tower core), carved clean from the noisy lidar. Storeys start at
// each column's own ground, so the downhill south face shows its extra storeys; the entrance is on the low east face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467360.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(key(x, z), { g: ground, lid: roof, R: 0 });
const inF = (x, z) => F.has(key(x, z));

// Clean tiers: the 3x3 mean of the lidar roof, quantised to 13 / 14 / 16; the tower block is carved out of the north-west.
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const o = F.get(key(x + dx, z + dz)); if (o) { sum += o.lid; n++; } }
  const s = sum / n;
  let R = s >= 14.5 ? 16 : s >= 13.6 ? 14 : 13;
  if (x >= 7 && x <= 16 && z >= 1 && z <= 5) R = x >= 8 && x <= 15 && z >= 2 && z <= 4 ? 16 : 14;
  c.R = R;
}

const SX = 42, SY = 29, SZ = 31;
const g = new Voxels([SX, SY, SZ]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < SY) g.set(x, y, z, block, state); };

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
// the faces of (x, z) that show at height y: off the footprint, or over a lower tier's top (the taller tier's side above it)
const faces = (x, z, y, c) => DIRS.filter(([dx, dz]) => {
  const o = F.get(key(x + dx, z + dz));
  return !o || (o.R < c.R && y >= o.R);
});
const onEdge = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));

// The entrance: on the east face, at the lowest ground (the foot of the slope, the street side).
let door = null;
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  if (inF(x + 1, z) || !inF(x, z - 1) || inF(x + 1, z - 1)) continue;   // a two-cell door on the flat east face
  if (!door || c.g < door.c.g || (c.g === door.c.g && Math.abs(z - 22) < Math.abs(door.z - 22))) door = { x, z, c };
}
const isDoorCell = (x, z) => x === door.x && (z === door.z || z === door.z - 1);

const LIT = (x, y, z) => (x * 5 + z * 3 + y * 7) % 9 === 0;

for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  const { g: gr, R } = c;
  const edge = onEdge(x, z);
  const glass = R === 16 ? "light_blue_stained_glass" : "cyan_stained_glass";
  // storey slabs start at this column's ground and step up every 4 blocks; the roof slab sits at R - 1
  const slabs = [];
  for (let s = gr; s < R - 1; s += 4) slabs.push(s);

  // foundation under the ground, so nothing floats on the slope
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= R; y++) {
    if (y === R) { if (edge) put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; } // coping
    if (y === R - 1) { put(x, y, z, edge ? "light_gray_concrete" : "smooth_stone"); continue; } // cornice and roof

    const s = slabs.filter((v) => v <= y).at(-1);
    const si = slabs.indexOf(s);
    if (slabs.includes(y)) { put(x, y, z, edge && si === 0 ? "stone_bricks" : "white_concrete"); continue; }
    const shown = faces(x, z, y, c);
    if (!shown.length) continue;                                  // interior: air behind the glass

    const [dx, dz] = shown[0];
    const bay = dz !== 0 ? x : z;                                 // the bay along the face this column is in
    const rel = y - s;                                            // 1..3 within the storey
    const door_ = isDoorCell(x, z) && dx === 1 && y >= gr + 1 && y <= gr + 2;
    const canopy = isDoorCell(x, z) && dx === 1 && y === gr + 3;

    let block, state;
    if (door_) {
      block = "dark_oak_door";
      state = { facing: "east", half: y === gr + 1 ? "lower" : "upper", hinge: z === door.z ? "left" : "right", open: "false", powered: "false" };
    } else if (canopy) {
      block = "stone_brick_slab"; state = { type: "bottom", waterlogged: "false" };
    } else if (si === 0) {                                        // shopfront under the base
      block = rel <= 2 ? (bay % 3 === 0 ? "stone_bricks" : "glass") : "light_gray_concrete";
    } else if (rel === 1) {
      block = "light_gray_concrete";                              // spandrel under the window ribbon
    } else {
      block = bay % 3 === 0 ? "white_concrete" : glass;           // concrete fins between the ribbon panes
    }
    put(x, y, z, block, state);

    // warm light: a glowstone one cell behind a lit pane, in the air gap; a lantern behind the shopfront
    const [ix, iz] = [x - dx, z - dz];
    if (!door_ && !canopy && inF(ix, iz)) {
      if (block === glass && LIT(x, y, z)) put(ix, y, iz, "glowstone");
      if (si === 0 && rel === 2 && bay % 4 === 2 && block === "glass") put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }

  // roof plant: a lift core on the tower, small vents on the lower roofs
  if (R === 16 && x >= 9 && x <= 10 && z === 3) { put(x, R, z, "light_gray_concrete"); put(x, R + 1, z, "light_gray_concrete"); }
  else if (R === 14 && !edge && (x * 3 + z) % 11 === 0) put(x, R, z, "iron_block");
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467360.nbt");
console.log(JSON.stringify({ door, ...stats }));
