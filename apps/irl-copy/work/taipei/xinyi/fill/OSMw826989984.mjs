import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw826989984";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 19, H = 38, D = 17;
const ROOF = 26;          // roof level above lowest ground
const vox = new Voxels([W, H, D]);

// Footprint lookup and ground heights
const groundOf = new Map();
for (const [x, z, gr] of cells) {
  groundOf.set(`${x},${z}`, Math.max(0, Math.min(Math.round(gr), 20)));
}
const has = (x, z) => groundOf.has(`${x},${z}`);

// Palette: 1990s Taipei office block, white concrete frame, blue-tint glazing,
// stone base, quartz belts and parapet.
const FOUND = "stone_bricks";
const BASE = "stone_bricks";
const PIER = "white_concrete";
const BELT = "smooth_quartz";
const GLASS = "light_blue_stained_glass";
const LIT = "glowstone";
const SLAB_FLOOR = "light_gray_concrete";

// Find minimum Z row for the street face (door side)
let minZ = Infinity;
for (const [, z] of groundOf.keys().map(k => k.split(",").map(Number))) minZ = Math.min(minZ, z);

const cellList = [...groundOf.keys()].map(k => k.split(",").map(Number));

// Pass 1: envelope, foundations, floor belts, windows
for (const [x, z] of cellList) {
  const gr = groundOf.get(`${x},${z}`);
  const onZ = !has(x, z - 1) || !has(x, z + 1);
  const onX = !has(x - 1, z) || !has(x + 1, z);
  const perim = onX || onZ;

  let pier = false;
  if (onX && onZ) pier = true;
  else if (onZ) pier = x % 3 === 0;
  else if (onX) pier = z % 3 === 0;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) vox.set(x, y, z, FOUND);

  // Superstructure from ground up to the roof
  for (let y = gr; y <= ROOF && y < H; y++) {
    const k = Math.floor(y / 5);
    const r = y % 5;
    let block = null;

    if (y === ROOF) {
      if (perim) block = BELT; // parapet
    } else if (r === 0) {
      if (perim) block = k === 0 ? BASE : BELT;
      else block = SLAB_FLOOR;
    } else if (r === 4) {
      if (perim) block = pier ? PIER : BELT;
    } else {
      // r = 1..3 window band
      if (perim) {
        if (pier) block = PIER;
        else if (k >= 1 && ((x * 3 + z * 5 + k) % 7 === 0)) block = LIT;
        else block = GLASS;
      }
    }

    if (block) vox.set(x, y, z, block);
  }
}

// Pass 2: entrance on the street face, with a canopy above
let doorX = null;
{
  const mid = Math.floor(W / 2);
  let best = Infinity;
  for (const [x, z] of cellList) {
    if (z !== minZ) continue;
    const onX = !has(x - 1, z) || !has(x + 1, z);
    if (onX) continue; // keep corners out of the door
    const d = Math.abs(x - mid);
    if (d < best) { best = d; doorX = x; }
  }
  if (doorX !== null) {
    const gr = groundOf.get(`${doorX},${minZ}`);
    if (gr + 1 < H) {
      vox.set(doorX, gr, minZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      vox.set(doorX, gr + 1, minZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    // Canopy over the entrance, on the ground-storey head band
    for (let x = doorX - 1; x <= doorX + 1; x++) {
      if (!has(x, minZ)) continue;
      const cg = groundOf.get(`${x},${minZ}`);
      if (cg <= 4) {
        vox.set(x, 4, minZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

// Pass 3: roof plant enclosure and mast on interior cells
for (const [x, z] of cellList) {
  const onZ = !has(x, z - 1) || !has(x, z + 1);
  const onX = !has(x - 1, z) || !has(x + 1, z);
  if (onX || onZ) continue;
  if (x >= 6 && x <= 12 && z >= 5 && z <= 11) {
    vox.set(x, ROOF, z, PIER);
    vox.set(x, ROOF + 1, z, PIER);
    vox.set(x, ROOF + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (has(9, 8) && ROOF + 4 < H) {
  vox.set(9, ROOF + 3, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

vox.save(`${dir}/${id}.nbt`);
