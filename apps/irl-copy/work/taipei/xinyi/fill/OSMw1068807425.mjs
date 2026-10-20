import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807425";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Record-driven massing: roof at y 11 (about 11 blocks above lowest ground),
// two storeys of ~5 blocks, a parapet, a penthouse and roof plant.
const ROOF = 11;     // roof slab / top of the walls
const FLOOR2 = 6;    // storey 2 floor slab and spandrel band
const CORNICE = 10;  // top-of-storey-2 cornice band
const TRANSOM = 5;   // ground-floor header band

const key = (x, z) => `${x},${z}`;
const inFp = new Set();
const gr = new Map();
for (const [x, z, gy] of cells) {
  inFp.add(key(x, z));
  gr.set(key(x, z), gy);
}
const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inFp.has(key(x, z));
const isPerimeter = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

const STAIR_DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const STAIR_DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

// Pass 1: foundation, floors, walls, windows, parapet, shopfront.
for (const [x, z, gy] of cells) {
  const perim = isPerimeter(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab at this cell's ground.
  g.set(x, gy, z, "smooth_stone");

  // Storey-2 floor slab across the footprint (skipped if ground already above it).
  if (FLOOR2 > gy) g.set(x, FLOOR2, z, "smooth_stone");

  // Roof slab across the footprint, interior only; perimeter becomes parapet.
  if (!perim && ROOF > gy) g.set(x, ROOF, z, "gray_concrete");

  if (!perim) continue;

  const corner = isCorner(x, z);
  const onZFace = z === 0 || z === D - 1;
  const idx = onZFace ? x : z;
  const isPier = corner || idx % 3 === 0;
  const isFront = z === 0;

  // Walls, bands, cornice and parapet.
  for (let y = gy + 1; y <= ROOF + 1; y++) {
    let b = "white_concrete";
    if (y === FLOOR2) b = "light_gray_concrete";
    else if (y === TRANSOM) b = "light_gray_concrete";
    else if (y === CORNICE) b = "light_gray_concrete";
    if (y >= ROOF) b = "white_concrete";
    if (y === ROOF + 1 && !corner) b = "stone_brick_slab";
    if (y === ROOF + 1 && corner) b = "stone_brick_slab";
    g.set(x, y, z, b, y === ROOF + 1 ? { type: "top", waterlogged: "false" } : undefined);
  }

  // Ground-floor windows (glass with piers), upper windows (blue glass with piers).
  if (!corner && !isPier) {
    for (let y = gy + 1; y <= TRANSOM - 1; y++) {
      if (isFront) g.set(x, y, z, "glass");
      else g.set(x, y, z, "glass");
    }
    for (let y = 7; y <= 9; y++) g.set(x, y, z, "light_blue_stained_glass");
  } else if (!corner && isPier) {
    // piers already white_concrete from the wall pass
  }

  // Shopfront door on the front face, with glass either side.
  if (isFront && x === 10) {
    if (gy + 1 >= 1 && gy + 1 <= TRANSOM - 1) {
      g.set(x, gy + 1, z, "dark_oak_door", STAIR_DOOR_LOWER);
      g.set(x, gy + 2, z, "dark_oak_door", STAIR_DOOR_UPPER);
    }
  }
}

// Pass 2: warm light behind some upper windows (glowstone inside the room).
const glowAt = (x, z) => {
  for (let i = 0; i < 1; i++) {}
  return null;
};
for (const [x, z, gy] of cells) {
  if (!isPerimeter(x, z) || isCorner(x, z)) continue;
  const onZFace = z === 0 || z === D - 1;
  const idx = onZFace ? x : z;
  if (idx % 3 === 0 || idx % 6 !== 1) continue;
  let dx = 0, dz = 0;
  if (z === 0) dz = 1;
  else if (z === D - 1) dz = -1;
  else if (x === 0) dx = 1;
  else if (x === W - 1) dx = -1;
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && !isPerimeter(ix, iz)) {
    const gi = gr.get(key(ix, iz));
    g.set(ix, 8, iz, "glowstone");
  }
}

// Pass 3: penthouse and roof equipment (only where footprint exists).
const put = (x, y, z, b, p) => { if (has(x, z)) g.set(x, y, z, b, p); };

// Mechanical penthouse, x 8..13, z 6..11, walls y 12..14, roof y 15.
for (let x = 8; x <= 13; x++) {
  for (let z = 6; z <= 11; z++) {
    const edge = x === 8 || x === 13 || z === 6 || z === 11;
    for (let y = 12; y <= 14; y++) {
      if (edge) {
        // Slit windows on the penthouse faces, otherwise solid concrete.
        const slit = y === 13 && (x === 8 || x === 13 ? z % 2 === 0 : x % 2 === 0);
        put(x, y, z, slit ? "light_blue_stained_glass" : "light_gray_concrete");
      }
    }
    put(x, 15, z, "gray_concrete");
  }
}

// Roof AC units and plant boxes.
for (let x = 3; x <= 4; x++) for (let z = 3; z <= 4; z++) put(x, 12, z, "iron_block");
for (let x = 17; x <= 18; x++) for (let z = 13; z <= 14; z++) put(x, 12, z, "light_gray_concrete");
put(17, 13, 13, "light_gray_concrete");
put(18, 13, 14, "light_gray_concrete");

// Antenna on the penthouse roof.
put(11, 16, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
put(11, 17, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
