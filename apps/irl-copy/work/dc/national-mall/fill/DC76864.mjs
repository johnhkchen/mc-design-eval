// DC76864: a 1900s Classical office block, three storeys of red brick on a stone plinth, with a 3 x 3 tower
// rising a storey and a half above the wings. The lidar roof is smoothed into two flat tiers (12 and 15).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76864.cells.json`, "utf8"));

// The footprint by cell: its ground (the foundation depth) and the flat roof tier it is built to.
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const inFoot = (x, z) => ground.has(`${x},${z}`);
const inTower = (x, z) => x >= 9 && x <= 11 && z >= 7 && z <= 9;
const topOf = (x, z) => (inTower(x, z) ? 15 : 12);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
// the sides of a cell that face air at height y: outside the footprint, or the neighbour stands lower than y
const openSides = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d], nx = x + dx, nz = z + dz;
  return !inFoot(nx, nz) || topOf(nx, nz) <= y;
});
const parapetState = (x, z, R) => {
  const s = { up: "true" };
  for (const d of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[d], nx = x + dx, nz = z + dz;
    s[d] = inFoot(nx, nz) && topOf(nx, nz) === R ? "low" : "none";
  }
  return s;
};
const paneState = (d) => (d === "north" || d === "south"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

const v = new Voxels([16, 27, 16]);
const lightSpots = [];

for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);
  const R = topOf(x, z);
  for (let y = 0; y < R; y++) {
    if (y < g) { v.set(x, y, z, "stone_bricks"); continue; }                // foundation down to the lowest ground
    const open = openSides(x, z, y), shell = open.length > 0;
    if (y === R - 1) {                                                     // parapet on the edge, roof deck inside
      if (shell) v.set(x, y, z, "stone_brick_wall", parapetState(x, z, R));
      else v.set(x, y, z, "stone_bricks");
      continue;
    }
    if (y === 0) { v.set(x, y, z, "smooth_stone"); continue; }             // plinth course
    const rel = (y - 1) % 3;                                              // storey lines at y = 1, 4, 7, 10, 13
    if (rel === 0) { v.set(x, y, z, shell ? "calcite" : "stone"); continue; }  // string course / floor slab
    if (!shell) continue;                                                  // air behind the glass
    if (open.length === 1) {
      const d = open[0], along = d === "north" || d === "south" ? x : z;
      if (along % 2 === 1) {
        v.set(x, y, z, "glass_pane", paneState(d));
        if (rel === 1) lightSpots.push({ x, y, z, d });
        continue;
      }
    }
    v.set(x, y, z, "bricks");                                              // piers and corners
  }
}

// The entrance on the south front: dark oak door, calcite jambs, a dark timber canopy over it.
for (const y of [2, 3]) {
  const half = y === 2 ? "lower" : "upper";
  v.set(10, y, 15, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
  v.set(9, y, 15, "calcite"); v.set(11, y, 15, "calcite");
}
for (const x of [9, 10, 11]) v.set(x, 4, 15, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// Warm light in some windows: glowstone or a standing lantern on the floor just inside the glass.
lightSpots.forEach(({ x, y, z, d }, i) => {
  if ((x * 3 + z * 5) % 4 !== 0) return;
  const [dx, dz] = DIRS[d], ix = x - dx, iz = z - dz;
  if (!inFoot(ix, iz) || openSides(ix, iz, y).length) return;
  if (i % 2) v.set(ix, y, iz, "glowstone");
  else v.set(ix, y, iz, "lantern", { hanging: "false" });
});

// Roof plant on the wing roof, standing on the deck.
for (const [x, y, z] of [[12, 12, 4], [13, 12, 4], [5, 12, 12]]) v.set(x, y, z, "copper_block");

const info = v.save(`${DIR}/DC76864.nbt`);
console.log(JSON.stringify(info));
