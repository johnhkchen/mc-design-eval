// Victoria Residence: a late-1990s mixed-use residential tower (concrete frame, glass curtain bays, stone podium).
// Massing follows the lidar roof per cell, tiered into clean storeys (4 blocks = 1 storey, 1.2 blocks/m).
// Foundation solid to each cell's ground; a 1-block exterior shell, floor slabs per storey, air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_632021112.cells.json", "utf8"));
const W = 25, D = 29, H = 117;

// lidar roof -> tier top (multiple of 4 so every tier closes on a storey line)
const tierTop = (r) => {
  if (r <= 40) return Math.max(12, Math.round(r / 4) * 4);   // low wings: 1-9 storeys
  if (r < 82) return 72;                                        // mid setback
  if (r < 96) return 88;                                        // upper setback
  if (r < 102) return 100;                                      // tower
  return 104;                                                   // crown
};

const cell = new Map();                                         // "x,z" -> { ground, ct }
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, ct: tierTop(roof) });
const inFP = (x, z) => cell.has(`${x},${z}`);
const ctAt = (x, z) => (inFP(x, z) ? cell.get(`${x},${z}`).ct : 0);
const NB = [[1, 0, "e"], [-1, 0, "w"], [0, 1, "s"], [0, -1, "n"]];
// a cell is exterior at height y when one of its four neighbours has no block there (outside, or lower tier)
const exterior = (x, z, y) => NB.some(([dx, dz]) => y >= ctAt(x + dx, z + dz));

// the entrance: on the lowest street face (ground 0 is the east side), the cell nearest the middle of that face
const eastFace = cells.filter(([x, z, g, r]) => g === 0 && r > 40 && !inFP(x + 1, z));
let door = null;
if (eastFace.length) {
  const xMax = Math.max(...eastFace.map((c) => c[0]));
  const onFace = eastFace.filter((c) => c[0] === xMax);
  const mid = onFace.reduce((s, c) => s + c[1], 0) / onFace.length;
  door = onFace.sort((a, b) => Math.abs(a[1] - mid) - Math.abs(b[1] - mid))[0];
}

const g = new Voxels([W, H, D]);
const set = (x, y, z, b, st) => g.set(x, y, z, b, st);

// the facade: storey bands, mullioned glass, a podium of stone below y 20
function facade(x, z, y) {
  if (y < 4) {                                                  // ground floor: base, shopfront, fascia
    if (y === 0) return "polished_andesite";
    if (y === 3) return "stone_bricks";
    return (x + z) % 3 === 0 ? "dark_oak_planks" : "glass";
  }
  const podium = y < 20;
  const spandrel = podium ? "stone_bricks" : "light_gray_concrete";
  const frame = podium ? "stone_bricks" : "white_concrete";
  if (y % 4 === 0 || y % 4 === 3) return spandrel;              // floor line and head
  return (x + z) % 3 === 0 ? frame : "light_blue_stained_glass";
}

let lit = 0;
for (const [x, z, ground] of cells) {
  const { ct } = cell.get(`${x},${z}`);
  for (let y = 0; y < ground; y++) set(x, y, z, "stone");       // foundation up to this cell's ground
  for (let y = ground; y < ct; y++) {
    const ext = exterior(x, z, y);
    if (y === ct - 1) { set(x, y, z, ext ? "smooth_stone" : "gray_concrete"); continue; }   // cornice or roof deck
    if (ext) { set(x, y, z, facade(x, z, y)); continue; }
    if (y % 4 === 0) { set(x, y, z, "light_gray_concrete"); continue; }                  // floor slab per storey
    // air behind the glass: a few warm lights a block in from the window
    const near = NB.some(([dx, dz]) => exterior(x + dx, z + dz, y));
    if (near && y % 4 === 1 && (x * 31 + z * 17 + y * 7) % 37 === 0) { set(x, y, z, "glowstone"); lit++; }
    else if (near && y % 4 === 2 && (x * 13 + z * 29 + y * 3) % 53 === 0) { set(x, y, z, "shroomlight"); lit++; }
  }
  if (ct - 1 >= 0 && exterior(x, z, ct - 1)) set(x, ct, z, "smooth_stone");   // parapet above the cornice
}

// the entrance: two-high dark oak door with the shopfront either side
if (door) {
  const [dx, dz] = [door[0], door[1]];
  // the door faces inward (west, into the building from the east face)
  set(dx, 1, dz, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(dx, 2, dz, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// roof plant on the crown: stone boxes, a lightning rod near the middle of the crown
const crown = cells.filter(([x, z]) => cell.get(`${x},${z}`).ct === 104);
if (crown.length) {
  const cx = crown.reduce((s, c) => s + c[0], 0) / crown.length, cz = crown.reduce((s, c) => s + c[1], 0) / crown.length;
  const inner = crown.filter(([x, z]) => !exterior(x, z, 103)).sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz));
  if (inner.length) {
    const [rx, rz] = inner[0];
    set(rx, 104, rz, "lightning_rod");
    for (const [x, z] of inner.slice(4).filter(([x, z]) => (x * 3 + z * 5) % 17 === 0).slice(0, 6)) {
      set(x, 104, z, "stone_bricks"); set(x, 105, z, "stone_bricks");
    }
  }
}
// rooftop planting on the mid terraces
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { ct } = cell.get(`${x},${z}`);
  if (ct === 72 && !exterior(x, z, 71) && (x * 7 + z * 11) % 19 === 0) set(x, 72, z, "oak_leaves", { persistent: "true", distance: "7", waterlogged: "false" });
}

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_632021112.nbt");
console.log(JSON.stringify({ ...res, lights: lit, door }));
