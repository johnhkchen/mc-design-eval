import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986972";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 14;
const g = new Voxels([W, H, D]);

// Absolute storey levels (shared roof line across the footprint)
const SLAB_1 = 5;   // floor line between storey 1 and 2
const SPANDREL_1 = 4;
const SPANDREL_2 = 9;
const CORNICE = 10; // roof slab / cornice course
const PARAPET = 11; // top of parapet, the roof line

const ground = new Map();
for (const [x, z, gy] of cells) {
  const y = Math.max(0, Math.min(Math.round(gy), 12));
  ground.set(`${x},${z}`, y);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const GLASS = "light_blue_stained_glass_pane";
const PIER = "smooth_quartz";
const SPAN = "light_gray_concrete";
const BASE = "stone_bricks";
const SLABQ = { type: "bottom", waterlogged: "false" };

// Which outward faces a perimeter cell exposes
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Pick the entrance: south-face cell closest to the centre line
let door = null;
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  if (!has(x, z + 1)) {
    if (!door || Math.abs(x - W / 2) < Math.abs(door[0] - W / 2)) door = [x, z];
  }
}

// 1. Foundations and interior floors / structure
for (const [k, gy] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");
  const perim = faces(x, z).length > 0;
  if (!perim) {
    g.set(x, gy, z, "smooth_stone");                 // ground slab
    g.set(x, SLAB_1, z, SPAN);                       // storey-2 floor slab
    g.set(x, CORNICE, z, "gray_concrete");           // roof slab
    // interior columns on a 4-block grid
    if (x % 4 === 0 && z % 4 === 0) {
      for (let y = gy + 1; y <= SPANDREL_1; y++) g.set(x, y, z, PIER);
    }
  }
}

// 2. Perimeter facade
for (const [k, gy] of ground) {
  const [x, z] = k.split(",").map(Number);
  const f = faces(x, z);
  if (!f.length) continue;
  const face = f[0];
  const i = face === "N" || face === "S" ? x : z;
  const bay = i % 3;
  const pier = bay === 0;

  for (let y = gy; y <= PARAPET; y++) {
    let b = null, props;
    if (y === gy) {
      b = BASE;
    } else if (y <= SPANDREL_1) {                    // ground storey shopfront
      b = y === SPANDREL_1 ? SPAN : (pier ? PIER : GLASS);
    } else if (y === SLAB_1) {                       // floor line
      b = SPAN;
    } else if (y <= 8) {                             // storey-2 windows
      b = pier ? PIER : GLASS;
    } else if (y === SPANDREL_2) {
      b = SPAN;
    } else if (y === CORNICE) {                      // cornice
      b = PIER;
    } else if (y === PARAPET) {                      // parapet with rhythm
      if (bay % 2 === 0) b = PIER;
      else { b = "smooth_quartz_slab"; props = SLABQ; }
    }
    if (b) g.set(x, y, z, b, props);
  }

  // Warm light behind some upper-storey windows (inside air gap)
  if (bay === 2) {
    const inward = { N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] }[face];
    if (has(inward[0], inward[1]) && gy < 7) {
      g.set(inward[0], 7, inward[1], "shroomlight");
    }
  }
}

// 3. Entrance on the south face: double-height door with transom
if (door) {
  const [dx, dz] = door;
  const gy = gnd(dx, dz);
  g.set(dx, gy + 1, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, gy + 2, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(dx, gy + 3, dz, GLASS);
  // lanterns flanking the door, on the inner side
  for (const dxx of [-1, 1]) {
    if (has(dx + dxx, dz) && faces(dx + dxx, dz).includes("S")) {
      g.set(dx + dxx, gy + 2, dz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// 4. Roof plant enclosure on the cornice, centred
for (let x = 6; x <= 9; x++) {
  for (let z = 4; z <= 8; z++) {
    if (!has(x, z)) continue;
    const edge = x === 6 || x === 9 || z === 4 || z === 8;
    g.set(x, CORNICE + 1, z, edge ? "light_gray_concrete" : "gray_concrete");
    if (edge) g.set(x, CORNICE + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
