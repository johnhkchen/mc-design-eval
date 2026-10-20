import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1047501176";
const W = 24, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const F = Math.max(...cells.map((c) => c[2])); // storey datum: top of the highest ground under the footprint

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Ring = footprint cells touching the outside
const isRing = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Storey layout above datum F (1.4 block scale, 5-block storeys):
//  F..F+3   ground storey glass shopfront (piers white concrete)
//  F+4      quartz lintel band
//  F+5      floor slab (band on ring)
//  F+6..F+8 upper storey glass
//  F+9      cornice band
//  F+10     roof slab
//  F+11     parapet
//  F+11..12 roof plant box (centre)

// 1) Foundation + plinth, floors, roof slab
for (const [x, z, gr] of cells) {
  const ring = isRing(x, z);
  for (let y = 0; y < F; y++) {
    if (y < gr) put(x, y, z, "stone_bricks");
    else if (ring) put(x, y, z, "polished_granite");
    else put(x, y, z, "stone");
  }
  // floor slab between storeys
  put(x, F + 5, z, ring ? "smooth_quartz" : "smooth_stone");
  // roof slab
  put(x, F + 10, z, ring ? "smooth_quartz" : "light_gray_concrete");
}

// 2) Ring walls with window grids
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isRing(x, z)) continue;

  const north = !inFp(x, z - 1);
  const south = !inFp(x, z + 1);
  const west = !inFp(x - 1, z);
  const east = !inFp(x + 1, z);
  const corner = (north || south) && (west || east);

  let i;
  if (north || south) i = x;
  else i = z;

  const pier = corner || i % 3 === 0;

  // Entrance on the north face
  const isDoor = north && x === 11;

  // Wall column from F to F+9
  for (let y = F; y <= F + 9; y++) {
    if (y === F + 5) continue; // floor slab already placed

    if (y === F + 4 || y === F + 9) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    if (isDoor) {
      if (y === F) put(x, y, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === F + 1) put(x, y, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (y <= F + 3) put(x, y, z, "glass");
      continue;
    }

    const groundFloor = y <= F + 3;
    const upperFloor = y >= F + 6 && y <= F + 8;

    if (!groundFloor && !upperFloor) {
      put(x, y, z, "white_concrete");
      continue;
    }

    if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, groundFloor ? "light_blue_stained_glass" : "gray_stained_glass");
    }
  }

  // Parapet and cornice
  put(x, F + 11, z, "smooth_quartz");
}

// 3) Warm light behind selected upper-storey windows and inside the lobby
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isRing(x, z)) continue;
  const north = !inFp(x, z - 1);
  const south = !inFp(x, z + 1);
  const west = !inFp(x - 1, z);
  const east = !inFp(x + 1, z);
  const corner = (north || south) && (west || east);
  const i = (north || south) ? x : z;
  const pier = corner || i % 3 === 0;
  if (pier || (north && x === 11)) continue;

  if (i % 6 === 4) {
    let ix = x, iz = z;
    if (north) iz = z + 1;
    else if (south) iz = z - 1;
    else if (west) ix = x + 1;
    else if (east) ix = x - 1;
    if (inFp(ix, iz) && !isRing(ix, iz)) put(ix, F + 7, iz, "glowstone");
  }
}

// Lobby lanterns behind the entrance
if (inFp(11, 1)) put(11, F, 1, "lantern", { hanging: "false", waterlogged: "false" });
if (inFp(12, 1)) put(12, F, 1, "lantern", { hanging: "false", waterlogged: "false" });

// 4) Roof plant box, centred
for (let x = 8; x <= 15; x++) {
  for (let z = 5; z <= 10; z++) {
    if (!inFp(x, z) || isRing(x, z)) continue;
    put(x, F + 11, z, "light_gray_concrete");
    put(x, F + 12, z, (x + z) % 3 === 0 ? "iron_bars" : "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
