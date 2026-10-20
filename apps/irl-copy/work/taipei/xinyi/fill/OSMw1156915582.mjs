import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1156915582";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 14, H = 23, D = 30;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gy] of cells) G.set(`${x},${z}`, gy);
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// outward/inward helpers
const DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
];
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

// Mid-century office/commercial block, two storeys of 5 blocks (storey lines at y=5, cornice at 10),
// granite base, quartz bays, glass curtain of shopfronts and windows, flat roof with plant room.
const zs = cells.map(c => c[1]);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midZ = (minZ + maxZ) / 2;

// Foundation + floors + walls
for (const [x, z, gy] of cells) {
  // foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // interior: floor at ground, storey slabs at 5 and 10, air between (glowstone allowed behind glass)
    put(x, gy, z, "smooth_stone");
    if (gy <= 5) put(x, 5, z, "smooth_stone");
    if (gy <= 10) put(x, 10, z, "light_gray_concrete");
    continue;
  }

  // edge: full facade from the cell's ground up to the parapet at y=11
  for (let y = gy; y <= 11; y++) {
    const bay = (x + z) % 3 === 0; // quartz mullion every third cell
    let block;
    if (y === gy) block = "polished_granite";              // base course
    else if (y <= 3) block = bay ? "smooth_quartz" : "glass"; // shopfront
    else if (y === 4) block = "smooth_quartz";             // lintel
    else if (y === 5) block = "smooth_stone";              // storey line
    else if (y <= 9) block = bay ? "smooth_quartz" : "glass"; // upper windows
    else if (y === 10) block = "smooth_stone";             // cornice
    else block = "stone_bricks";                           // parapet
    put(x, y, z, block);
  }
}

// Warm lights: glowstone behind some upper windows and shopfront glass
for (const [x, z, gy] of cells) {
  if (!isEdge(x, z)) continue;
  const inward = DIRS.find(([dx, dz]) => !has(x + dx, z + dz)); // missing side is outward
  if (!inward) continue;
  // inward neighbour = opposite of the missing side, must be footprint interior
  const ix = x - inward[0], iz = z - inward[1];
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const bay = (x + z) % 3 === 0;
  if (bay) continue;
  if ((x + z) % 4 === 1 && gnd(ix, iz) <= 7 && gy < 7) {
    put(ix, 7, iz, "glowstone");
  }
  if ((x + z) % 6 === 2 && gy < 2 && gnd(ix, iz) <= 2) {
    put(ix, gy + 2, iz, "glowstone");
  }
}

// Front entrance on the lowest-z side (street face), canopy above the door
const frontCells = cells
  .filter(([x, z]) => z === minZ && isEdge(x, z))
  .map(([x]) => x)
  .sort((a, b) => a - b);
if (frontCells.length) {
  const doorX = frontCells[Math.floor(frontCells.length / 2)];
  const dgy = gnd(doorX, minZ);
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(doorX, dgy + 1, minZ, "dark_oak_door", doorProps("lower"));
  put(doorX, dgy + 2, minZ, "dark_oak_door", doorProps("upper"));
  // canopy across the entrance bay
  for (let x = doorX - 1; x <= doorX + 1; x++) {
    if (!has(x, minZ) || !isEdge(x, minZ)) continue;
    const cg = gnd(x, minZ);
    put(x, cg + 3, minZ, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
  // door surround: granite pillars flanking the entrance at ground
  for (const x of [doorX - 1, doorX + 1]) {
    if (has(x, minZ) && isEdge(x, minZ)) {
      const cg = gnd(x, minZ);
      put(x, cg + 1, minZ, "smooth_quartz");
      put(x, cg + 2, minZ, "smooth_quartz");
    }
  }
}

// Roof plant room: a low block with a vent grid, set back from the parapet
for (const [x, z, gy] of cells) {
  if (isEdge(x, z) || gy > 10) continue;
  if (x < 4 || x > 9) continue;
  if (Math.abs(z - midZ) > 4) continue;
  put(x, 11, z, "light_gray_concrete");
  if ((x + z) % 2 === 0) put(x, 12, z, "iron_block");
}

g.save(`${dir}/${id}.nbt`);
