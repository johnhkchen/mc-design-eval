import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738139";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 33, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let B = Infinity;
for (const [x, z, gy] of cells) {
  ground.set(key(x, z), gy);
  B = Math.min(B, gy);
}
const ROOF = B + 21; // flat roof, about 21 blocks above the lowest ground, 4 storeys of 5

function put(x, y, z, id, p) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

const has = (x, z) => ground.has(key(x, z));

// Outward normal of a perimeter cell, or null for interior cells.
function outward(x, z) {
  if (!has(x, z - 1)) return [0, -1];
  if (!has(x, z + 1)) return [0, 1];
  if (!has(x - 1, z)) return [-1, 0];
  if (!has(x + 1, z)) return [1, 0];
  return null;
}

// Pick the south-facing entrance cell nearest the middle of the facade.
let doorCell = null;
for (const [x, z, G] of cells) {
  const o = outward(x, z);
  if (o && o[0] === 0 && o[1] === 1) {
    if (!doorCell || Math.abs(x - 11) < Math.abs(doorCell[0] - 11)) doorCell = [x, z, G];
  }
}

for (const [x, z, G] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  const out = outward(x, z);

  if (!out) {
    // Interior: air gap, with floor slabs at ground and at each storey line.
    for (let y = G; y < ROOF; y++) {
      const rel = y - B;
      if (y === G || (rel >= 0 && rel % 5 === 0)) put(x, y, z, "smooth_stone");
    }
  } else {
    const alongAxisIsZ = out[0] !== 0; // x-facing face runs along z
    const along = alongAxisIsZ ? z : x;
    const alongMax = alongAxisIsZ ? 18 : 22;
    const pil = along % 4 === 0 || along === alongMax;
    const windowProps = alongAxisIsZ
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    for (let y = G; y < ROOF; y++) {
      const rel = y - B;
      const o = ((rel % 5) + 5) % 5;
      const k = Math.floor(rel / 5);
      if (o === 0) {
        put(x, y, z, k === 0 ? "polished_andesite" : "light_gray_concrete");
      } else if (o === 4) {
        put(x, y, z, pil ? "white_concrete" : "light_gray_concrete");
      } else if (pil) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", windowProps);
      }
    }

    // Warm lights behind some windows, in the air gap just inside the facade.
    for (let k = 1; k < 4; k++) {
      const y = B + 5 * k + 2;
      if (y < G || y >= ROOF) continue;
      if (!pil && along % 8 === 2) {
        const ix = x - out[0], iz = z - out[1];
        if (has(ix, iz) && !outward(ix, iz)) put(ix, y, iz, "shroomlight");
      }
    }
  }

  // Roof slab with cornice on the perimeter, and a parapet above it.
  put(x, ROOF, z, out ? "smooth_stone" : "light_gray_concrete");
  if (out) put(x, ROOF + 1, z, "white_concrete");
}

// Entrance on the south facade: two-block dark oak door.
if (doorCell) {
  const [dx, dz, dG] = doorCell;
  put(dx, dG, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dG + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Warm light just inside the entrance.
  if (has(dx, dz - 1) && !outward(dx, dz - 1)) put(dx, dG + 2, dz - 1, "shroomlight");
}

// Roof plant: a hollow penthouse box with a capping slab and a lightning rod.
const PX0 = 7, PX1 = 15, PZ0 = 6, PZ1 = 12;
for (let y = ROOF + 1; y <= ROOF + 3; y++) {
  for (let x = PX0; x <= PX1; x++) {
    for (let z = PZ0; z <= PZ1; z++) {
      const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
      if (edge) put(x, y, z, "light_gray_concrete");
    }
  }
}
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    put(x, ROOF + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
put(11, ROOF + 5, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
