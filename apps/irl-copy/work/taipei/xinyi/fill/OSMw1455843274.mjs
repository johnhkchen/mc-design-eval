import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 聯合報系第五大樓: mid-rise 1980s-90s Taipei office block, six storeys of
// 5 blocks, cream cladding, blue-tinted glazing, granite base, roof plant room.
const W = 26, D = 15, H = 43;
const ROOF = 31;                 // roof slab level (lidar: ~31 above lowest ground)
const SF = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1455843274";

const cells = JSON.parse(readFileSync(`${SF}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const gyOf = (x, z) => ground.get(`${x},${z}`);

// Exterior faces of a footprint cell (a neighbour across the edge is missing)
function exteriorFaces(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push("n");
  if (!has(x, z + 1)) out.push("s");
  if (!has(x - 1, z)) out.push("w");
  if (!has(x + 1, z)) out.push("e");
  return out;
}

// Inward step from each face (the cell behind the glass)
const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

// Materials
const FOUNDATION = "stone_bricks";
const BASE = "polished_granite";
const SLAB = "smooth_quartz";
const FRAME = "white_concrete";
const PANE = "light_blue_stained_glass_pane";
const SHOP = "glass";
const FLOOR = "light_gray_concrete";
const ROOFCAP = "gray_concrete";

// Front (street) face is south (z = 14); main entrance on it
const DOOR_X = 12;

// 1. Foundation, floor slabs and facade shell, column by column
for (const [x, z, gy] of cells) {
  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, FOUNDATION);

  const faces = exteriorFaces(x, z);
  const isWall = faces.length > 0;
  const isCorner = faces.length > 1;
  const face = faces[0];

  for (let y = gy; y < ROOF; y++) {
    const r = (y - gy) % 5;          // position within storey
    const k = Math.floor((y - gy) / 5); // storey index
    if (r === 0) {
      // storey line / floor slab
      if (!isWall) g.set(x, y, z, FLOOR);
      else g.set(x, y, z, k === 0 ? BASE : SLAB);
      continue;
    }
    if (!isWall) continue; // interior: air behind the glass
    if (isCorner) { g.set(x, y, z, r === 4 ? FRAME : FRAME); continue; }

    const t = (face === "n" || face === "s") ? x : z;
    if (r === 4) { g.set(x, y, z, FRAME); continue; } // spandrel

    // band r = 1..3: window grid with frames
    let id;
    if (t % 3 === 0) id = FRAME;                       // mullion
    else if (k === 0 && face === "s") id = (r === 3) ? FRAME : SHOP; // shopfront
    else id = PANE;
    g.set(x, y, z, id);
  }

  // roof membrane on every footprint cell
  g.set(x, ROOF, z, ROOFCAP);

  // parapet: cornice on the perimeter and crenellated coping
  if (isWall) {
    g.set(x, ROOF + 1, z, SLAB);
    const t = (face === "n" || face === "s") ? x : z;
    if (!isCorner && t % 2 === 0) g.set(x, ROOF + 2, z, FRAME);
    if (isCorner) g.set(x, ROOF + 2, z, FRAME);
  }
}

// 2. Warm lights behind some windows (glowstone in the cell inside the glass)
for (const [x, z, gy] of cells) {
  const faces = exteriorFaces(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const t = (face === "n" || face === "s") ? x : z;
  const [dx, dz] = inward[face];
  for (let k = 0; k < 6; k++) {
    const y = gy + 5 * k + 2; // middle of band
    if (y >= ROOF) break;
    if ((t + 2 * k) % 7 === 3 && t % 3 !== 0) {
      if (has(x + dx, z + dz)) g.set(x + dx, y, z + dz, "glowstone");
    }
  }
}

// 3. Entrance on the street face: door, transom, lantern
{
  const x = DOOR_X, z = D - 1;
  if (has(x, z)) {
    const gy = gyOf(x, z);
    g.set(x, gy + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gy + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gy + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 4. Roof plant room (penthouse) set in from the parapet
for (let x = 9; x <= 16; x++) {
  for (let z = 4; z <= 10; z++) {
    if (!has(x, z)) continue;
    const ring = x === 9 || x === 16 || z === 4 || z === 10;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (ring) g.set(x, y, z, y === ROOF + 2 ? PANE : FLOOR);
    }
    g.set(x, ROOF + 4, z, "smooth_stone");
  }
}

// 5. Lightning rod on the roof
if (has(1, 1)) g.set(1, ROOF + 1, 1, "lightning_rod");

g.save(`${SF}.nbt`);
