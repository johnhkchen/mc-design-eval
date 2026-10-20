import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 信義運動中心 (Xinyi Sports Center), 2005. Seven storeys of about 5 blocks on a
// two-storey stone-faced podium, pale ceramic-tile and concrete facade, blue-tinted
// glazing, a recessed glazed lobby with a canopy on the north face, and a rooftop
// plant enclosure.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0072-7F";
const W = 70, H = 47, D = 35;
const ROOF = 35;        // roof deck layer, 7 storeys of 5
const BASE_TOP = 10;    // two-storey podium, stone-faced

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.floor(gr)));
const has = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 1. Foundation, floors, facade, roof deck and parapet, column by column.
for (const [x, z, gr] of cells) {
  const gy = Math.max(0, Math.floor(gr));
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  const edge = perim(x, z);
  const onNS = !has(x, z - 1) || !has(x, z + 1);
  const pos = onNS ? x : z;   // mullion rhythm along the face

  for (let y = gy; y < ROOF; y++) {
    if (!edge) {
      // interior: air gap plus a floor slab per storey
      if (y % 5 === 0) g.set(x, y, z, "smooth_quartz");
      continue;
    }
    const m = y % 5;
    let b;
    if (m === 0) b = y < BASE_TOP ? "stone_bricks" : "white_concrete";          // spandrel / base course
    else if (m === 4) b = y < BASE_TOP ? "stone_bricks" : "light_gray_concrete"; // sill band, tonal layer
    else b = pos % 3 === 0 ? "white_concrete" : "light_blue_stained_glass_pane"; // mullion or glazing
    g.set(x, y, z, b);
  }

  // roof deck on every footprint cell
  g.set(x, ROOF, z, edge ? "white_concrete" : "light_gray_concrete");

  if (edge) {
    g.set(x, 36, z, "white_concrete");
    g.set(x, 37, z, "white_concrete");
    g.set(x, 38, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 2. Warm light: lanterns standing on interior floors, lighting some windows.
for (const [x, z, gr] of cells) {
  if (!perim(x, z)) continue;
  const gy = Math.max(0, Math.floor(gr));
  for (let y = gy; y < ROOF; y++) {
    const m = y % 5;
    if (m === 0 || m === 4) continue;
    const b = y - m;
    if (b < gy) continue;
    if ((x * 7 + z * 3 + b) % 5 !== 0) continue;
    const inward = DIRS.find(([dx, dz]) => has(x + dx, z + dz) && !perim(x + dx, z + dz));
    if (!inward) continue;
    g.set(x + inward[0], b + 1, z + inward[1], "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 3. Recessed entrance on the north face (z = 0): stone surround, glazed lobby set back
//    two cells, a canopy carried on two stone posts inside the footprint, and double doors.
for (let x = 32; x <= 37; x++) {
  if (!has(x, 0) || !perim(x, 0)) continue;
  const gy = ground.get(`${x},0`);
  // stone surround and lintel on the front face
  g.set(x, gy + 2, 0, "stone_bricks");
  // clear the recess behind the front face (lobby air), with glazed back wall
  for (let z = 1; z <= 2; z++) {
    if (!has(x, z)) continue;
    for (let y = gy; y <= gy + 2; y++) {
      if (x === 32 || x === 37) g.set(x, y, z, "stone_bricks"); // canopy posts
      else if (z === 2 && (y === gy || y === gy + 1)) g.set(x, y, z, "light_blue_stained_glass_pane");
    }
  }
  // canopy slab at lintel height over the recess, carried by the posts
  if (x >= 32 && x <= 37) {
    for (let z = 0; z <= 2; z++) {
      if (has(x, z)) g.set(x, gy + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  if (x === 34 || x === 35) {
    const hinge = x === 34 ? "left" : "right";
    g.set(x, gy, 0, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    g.set(x, gy + 1, 0, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  }
}

// lobby lanterns for warmth at dusk
for (const x of [33, 36]) {
  const gy = ground.get(`${x},0`);
  if (gy !== undefined && has(x, 1)) g.set(x, gy + 1, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// 4. Rooftop plant enclosure: solid box with glazed ring at storey-two height and a stone cap.
for (let x = 22; x <= 40; x++) {
  for (let z = 12; z <= 22; z++) {
    if (!has(x, z)) continue;
    const ring = x === 22 || x === 40 || z === 12 || z === 22;
    for (let y = 36; y <= 38; y++) {
      if (ring && y === 37) g.set(x, y, z, "light_blue_stained_glass_pane");
      else g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, 39, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
