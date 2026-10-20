import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE102-0335-13F: 2013 mid-rise glass-and-concrete office/residential tower, Xinyi district.
// ~13 storeys: 4-block ground storey, then 12 storeys of 5 blocks. Roof slab at y=64.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE102-0335-13F";
const W = 48, H = 76, D = 30;
const ROOF = 64;          // roof slab level (top of building)
const SHOP_TOP = 3;       // ground storey shopfront runs up to y=3

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// footprint map: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(Math.max(Math.round(gr), 0), ROOF - 2));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const isFloor = (y) => y >= 4 && (y - 4) % 5 === 0;   // storey lines: 4, 9, ..., 64
const allCells = [...ground.keys()].map((k) => k.split(",").map(Number));

const g = new Voxels([W, H, D]);
const cx = (W - 1) / 2, cz = (D - 1) / 2;

// 1. Foundations, facade, floor slabs
for (const [x, z] of allCells) {
  const grd = ground.get(`${x},${z}`);

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < grd; y++) g.set(x, y, z, "stone_bricks");

  if (isPerim(x, z)) {
    // facade: bays run along x on north/south faces, along z on east/west faces
    const eastWest = !has(x + 1, z) || !has(x - 1, z);
    const bay = eastWest ? z : x;
    const pier = bay % 3 === 0;
    // recessed glass band: every other bay of glass is set back one row in the
    // spandrel (dark trim) to break up the flat curtain wall
    const reveal = !pier && bay % 6 === 1;

    for (let y = grd; y <= ROOF; y++) {
      if (y === grd) {
        g.set(x, y, z, "polished_andesite");                     // base course
      } else if (y <= SHOP_TOP) {
        g.set(x, y, z, pier ? "light_gray_concrete" : "glass"); // shopfront
      } else if (isFloor(y)) {
        g.set(x, y, z, "white_concrete");                        // storey line / spandrel
      } else if (pier) {
        g.set(x, y, z, "light_gray_concrete");                   // mullion pier
      } else if (reveal) {
        g.set(x, y, z, "gray_concrete");                         // deep reveal behind glass
      } else {
        g.set(x, y, z, "light_blue_stained_glass");              // curtain-wall glass
      }
    }
    // cornice and parapet: two-course coping
    g.set(x, ROOF + 1, z, "white_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
  } else {
    // interior: air with a floor slab per storey, plus roof slab
    for (let y = grd; y <= ROOF; y++) {
      if (isFloor(y)) g.set(x, y, z, "light_gray_concrete");
    }
  }
}

// 2. Rooftop core and mast (interior cells only, sitting on the roof slab)
for (const [x, z] of allCells) {
  if (isPerim(x, z)) continue;
  const dx = Math.abs(x - cx), dz = Math.abs(z - cz);
  if (dx <= 6 && dz <= 4) {
    for (let y = ROOF + 1; y <= ROOF + 4; y++) g.set(x, y, z, "light_gray_concrete");
    for (let y = ROOF + 5; y <= ROOF + 6; y++) g.set(x, y, z, "light_blue_stained_glass");
    g.set(x, ROOF + 7, z, "white_concrete");
  }
}
const mastCells = [[24, 15], [23, 15], [24, 14], [23, 14]].filter(([x, z]) => has(x, z) && !isPerim(x, z));
for (const [x, z] of mastCells) {
  for (let y = ROOF + 8; y <= ROOF + 10; y++) g.set(x, y, z, "white_concrete");
  g.set(x, ROOF + 11, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// 3. Warm lights: glowstone behind curtain-wall windows, and in the ground-floor interior
for (const [x, z, gr] of allCells.map(([a, b]) => [a, b, ground.get(`${a},${b}`)])) {
  if (!isPerim(x, z)) continue;
  const eastWest = !has(x + 1, z) || !has(x - 1, z);
  const bay = eastWest ? z : x;
  if (bay % 6 !== 2) continue;

  // inward neighbour (toward the building interior)
  let ix = x, iz = z;
  if (!has(x + 1, z)) ix = x - 1;
  else if (!has(x - 1, z)) ix = x + 1;
  else if (!has(x, z + 1)) iz = z - 1;
  else if (!has(x, z - 1)) iz = z + 1;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;

  for (let f = 9; f < ROOF; f += 5) {          // storey lines above the ground storey
    const y = f + 2;
    if (y < gr) continue;
    const storeyIdx = (f - 4) / 5;
    if (storeyIdx % 2 === 0) g.set(ix, y, iz, "glowstone");
  }
}
// ground-floor interior glow so the shopfronts read warm at dusk
for (const [x, z] of allCells) {
  if (isPerim(x, z)) continue;
  const gr = ground.get(`${x},${z}`);
  if (gr <= 1 && (x + z) % 5 === 0) g.set(x, 2, z, "shroomlight");
}

// 4. Entrance: door on the south edge, nearest the middle, at the lowest south-edge cell
let door = null;
for (const [x, z] of allCells) {
  if (has(x, z + 1)) continue;                 // not on the south edge
  if (Math.abs(x - cx) > 3) continue;
  const gr = ground.get(`${x},${z}`);
  if (!door || gr < door.gr || (gr === door.gr && Math.abs(x - cx) < Math.abs(door.x - cx))) {
    door = { x, z, gr };
  }
}
if (door) {
  const lower = Math.max(door.gr + 1, 1);
  // clear the shopfront on the door cell and its neighbours before placing the door
  for (let dx = -2; dx <= 2; dx++) {
    const nx = door.x + dx;
    if (!has(nx, door.z)) continue;
    const grn = ground.get(`${nx},${door.z}`);
    // canopy: a solid row across the entrance at the lintel height
    g.set(nx, lower + 2, door.z, "smooth_stone");
    if (nx !== door.x && isPerim(nx, door.z)) {
      for (let y = grn + 1; y <= SHOP_TOP; y++) g.set(nx, y, door.z, "light_gray_concrete");
    }
  }
  g.set(door.x, lower, door.z, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(door.x, lower + 1, door.z, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // flanking lamps either side of the door, warm at dusk
  for (const dx of [-1, 1]) {
    if (has(door.x + dx, door.z) && isPerim(door.x + dx, door.z)) {
      g.set(door.x + dx, lower, door.z, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
