import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401860";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 18 x 23; roof ends at y=10 (11 blocks above lowest ground), roof kit to y=12.
const W = 18, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const missingNeighbours = (x, z) =>
  [!has(x + 1, z), !has(x - 1, z), !has(x, z + 1), !has(x, z - 1)].filter(Boolean).length;
const isPerim = (x, z) => missingNeighbours(x, z) > 0;
const isCorner = (x, z) => missingNeighbours(x, z) >= 2;

// Front = northern-most (min z) row of the footprint; door nearest the middle of that row.
let minZ = Infinity;
for (const [, z] of ground.keys().map(k => k.split(",").map(Number))) minZ = Math.min(minZ, z);
const frontCells = cells.filter(([x, z]) => z === minZ && isPerim(x, z));
let door = null;
for (const [x, z] of frontCells) {
  if (!door || Math.abs(x - W / 2) < Math.abs(door[0] - W / 2)) door = [x, z];
}

// 1. Foundations: solid from y=0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Body: storeys, floor slabs, parapet, roof.
for (const [x, z] of cells) {
  const p = isPerim(x, z);

  // Floor slabs (storey 1 at y=0, storey 2 at y=5) and roof at y=10.
  g.set(x, 0, z, "smooth_stone");
  g.set(x, 5, z, "smooth_stone");
  g.set(x, 10, z, p ? "quartz_block" : "red_terracotta");

  if (!p) continue;

  const corner = isCorner(x, z);
  const pillar = corner || (x + z) % 3 === 0;
  const isDoor = door && door[0] === x && door[1] === z;

  // Base course.
  g.set(x, 0, z, "stone_bricks");

  // Ground storey: shopfront (y 1..3), signboard band (y 4).
  if (isDoor) {
    g.set(x, 1, z, "birch_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "birch_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, 3, z, "light_blue_stained_glass"); // transom
  } else if (pillar) {
    for (let y = 1; y <= 4; y++) g.set(x, y, z, "polished_andesite");
  } else {
    for (let y = 1; y <= 3; y++) g.set(x, y, z, "light_blue_stained_glass");
    g.set(x, 4, z, "red_concrete");
  }

  // Storey line between floors.
  g.set(x, 5, z, "smooth_stone");

  // Upper storey: window grid (y 6..8), sills/lintels on the band rows.
  for (let y = 6; y <= 8; y++) {
    if (pillar) g.set(x, y, z, "quartz_pillar", { axis: "y" });
    else g.set(x, y, z, "light_blue_stained_glass");
  }
  g.set(x, 9, z, "polished_andesite"); // cornice band
  g.set(x, 10, z, "quartz_block");     // parapet
}

// 3. Warm lights behind some glass (interior cells next to the facade).
const interiorNeighbour = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dz]) => [x + dx, z + dz])
    .find(([nx, nz]) => has(nx, nz) && !isPerim(nx, nz));

for (const [x, z] of cells) {
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  if ((x + z) % 3 === 0) continue; // pillar cell, no window
  if (door && door[0] === x && door[1] === z) continue;
  const inward = interiorNeighbour(x, z);
  if (!inward) continue;
  const [ix, iz] = inward;
  const k = (x * 7 + z * 3) % 6;
  if (k === 1) g.set(ix, 7, iz, "glowstone");        // upper storey
  else if (k === 4) g.set(ix, 2, iz, "lantern", { hanging: "false" }); // shopfront
  else if (k === 3) g.set(ix, 7, iz, "shroomlight");
}

// 4. Roof equipment: small plant box on the roof, centred.
for (let x = 7; x <= 10; x++) {
  for (let z = 9; z <= 12; z++) {
    if (!has(x, z)) continue;
    g.set(x, 11, z, "light_gray_concrete");
    g.set(x, 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
