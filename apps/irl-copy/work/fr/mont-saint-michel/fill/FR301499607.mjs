import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499607.cells.json`, "utf8"));

const W = 18, H = 21, D = 29;
const g = new Voxels([W, H, D]);

const C = new Map();
for (const [x, z, gr, rr] of cells) C.set(`${x},${z}`, { g: gr, r: rr });
const has = (x, z) => C.has(`${x},${z}`);

const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const maxZ = Math.max(...cells.map(c => c[1]));

const paneProps = (face) =>
  (face === "N" || face === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "false", south: "true", east: "false", west: "true", waterlogged: "false" };

const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

for (const [x, z, gr, rr] of cells) {
  const g0 = gr;
  // wall top (cornice row); roof rises three blocks above it to the lidar ridge
  const E = Math.max(g0 + 6, rr - 3);
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  // face: street-facing preference N, S, W, E
  let face = null;
  if (perim) {
    if (!has(x, z - 1)) face = "N";
    else if (!has(x, z + 1)) face = "S";
    else if (!has(x - 1, z)) face = "W";
    else if (!has(x + 1, z)) face = "E";
  }
  const isNS = face === "N" || face === "S";
  const along = face ? (isNS ? x - minX : z - minZ) : -1;
  const corner = face ? (isNS ? (x === minX || x === maxX) : (z === minZ || z === maxZ)) : false;
  const isBay = !!face && !corner && along % 3 === 2;
  const isDoor = face === "N" && z === minZ && !corner && along === 8;

  // foundation: solid from y 0 up to the cell's ground; bay cells get a stone sill on top
  for (let y = 0; y <= g0; y++) g.set(x, y, z, "stone");
  if (perim && isBay && !isDoor) {
    g.set(x, g0, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }

  // ground floor storey: rows g0+1 .. g0+2
  if (perim) {
    for (const y of [g0 + 1, g0 + 2]) {
      if (isDoor) continue;
      if (isBay) g.set(x, y, z, "glass_pane", paneProps(face));
      else if (corner) g.set(x, y, z, (y % 2 === 0) ? "chiseled_stone_bricks" : "stone_bricks");
      else g.set(x, y, z, "stone_bricks");
    }
    if (isDoor) {
      g.set(x, g0 + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, g0 + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  }

  // storey line / string course at g0+3; the door cell carries a hanging lantern over the entrance
  if (perim && isDoor) {
    g.set(x, g0 + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    g.set(x, g0 + 3, z, perim ? "chiseled_stone_bricks" : "smooth_stone");
  }

  // first floor storey: rows g0+4 .. E-1
  if (perim) {
    for (let y = g0 + 4; y <= E - 1; y++) {
      if (isBay) g.set(x, y, z, "glass_pane", paneProps(face));
      else if (corner) g.set(x, y, z, (y % 2 === 0) ? "chiseled_stone_bricks" : "stone_bricks");
      else g.set(x, y, z, "stone_bricks");
    }
  }

  // cornice / ceiling row at E
  if (perim) {
    g.set(x, E, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  } else {
    g.set(x, E, z, "stone_bricks");
  }

  // warm lanterns just inside selected ground-floor windows
  if (isBay && face && along % 6 === 2) {
    const [dx, dz] = inward[face];
    if (has(x + dx, z + dz)) g.set(x + dx, g0 + 1, z + dz, "lantern", { hanging: "false" });
  }

  // stepped slate roof rising 3 blocks to the ridge, stairs on each step's outer edge
  const d = Math.min(x - minX, maxX - x);
  const L = 1 + Math.floor(d / 3);
  for (let y = E + 1; y <= E + L - 1; y++) g.set(x, y, z, "deepslate_tiles");
  if (d % 3 === 0) {
    const facing = x <= (minX + maxX) / 2 ? "east" : "west";
    g.set(x, E + L, z, "deepslate_tile_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
  } else {
    g.set(x, E + L, z, "deepslate_tiles");
  }

  // a single chimney stack on the roof
  if (x === 12 && z === 10) {
    for (let y = E + 1; y <= E + 4; y++) g.set(x, y, z, "stone_bricks");
    g.set(x, E + 5, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/FR301499607.nbt`);
