import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001328";
const W = 4, H = 25, D = 18;

// Footprint records: [x, z, ground, roof]
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cell = new Map();
for (const [x, z, g, r] of raw) cell.set(`${x},${z}`, { g, r });
const has = (x, z) => cell.has(`${x},${z}`);

// Flat roof: median lidar roof, clamped to a sensible range
const roofs = [...cell.values()].map(c => c.r).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const maxGround = Math.max(...[...cell.values()].map(c => c.g));
const Rt = Math.min(22, Math.max(maxGround + 7, Math.round(medianRoof)));

// Belt courses (floor lines) every 3 blocks, top-aligned under the cornice
const belts = [];
for (let b = Rt - 4; b >= 3; b -= 3) belts.push(b);
const isBelt = (y) => belts.includes(y);
const isWinRow = (y, gr) =>
  (y >= gr + 1 && y <= 2) || belts.some(b => y === b + 1 || y === b + 2);

// Pier test for an exposed side (bays of 3: one pier, two glass)
function isPier(side, x, z) {
  if (side === "W" || side === "E") return z % 3 === 0 || z === 0 || z === D - 1;
  return x === 0 || x === W - 1; // N / S faces
}

const vox = new Voxels([W, H, D]);

for (const [key, { g: gr }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const sides = [];
  if (!has(x - 1, z)) sides.push("W");
  if (!has(x + 1, z)) sides.push("E");
  if (!has(x, z - 1)) sides.push("N");
  if (!has(x, z + 1)) sides.push("S");
  const edge = sides.length > 0;
  const corner = sides.length >= 2;

  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) vox.set(x, y, z, "stone_bricks");

  // Body of the cell
  for (let y = gr; y < Rt; y++) {
    if (!edge) {
      if (y === Rt - 1) vox.set(x, y, z, "gravel");
      else if (isBelt(y)) vox.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === Rt - 1) vox.set(x, y, z, "stone_bricks");            // cornice cap
    else if (y === Rt - 2) vox.set(x, y, z, (z % 2 === 0 || corner) ? "chiseled_stone_bricks" : "bricks"); // dentil course
    else if (isBelt(y)) vox.set(x, y, z, "smooth_stone");          // belt courses
    else if (corner) vox.set(x, y, z, (y % 2 === 0) ? "stone_bricks" : "polished_andesite"); // quoins
    else vox.set(x, y, z, "bricks");
  }

  if (!edge) continue;

  // Ground base course
  if (gr <= 2) vox.set(x, gr, z, "polished_granite");

  // Windows and shopfront
  for (let y = gr + 1; y <= Rt - 3; y++) {
    if (!isWinRow(y, gr)) continue;
    const groundRow = y <= 2;
    let glazed = false;
    for (const s of sides) {
      if (groundRow && s === "W" && z >= 1 && z <= D - 2) glazed = true; // full shopfront
      else if (!isPier(s, x, z)) glazed = true;
    }
    if (glazed) vox.set(x, y, z, "glass_pane");
  }

  // Entrance on the west frontage at ground level, with lanterns flanking the door
  if (sides.includes("W") && x === 0 && gr === 0) {
    if (z === 8) {
      vox.set(x, 1, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
      vox.set(x, 2, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    if (z === 7 || z === 9) {
      vox.set(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Warm light behind some upper-storey windows (glowstone in the air gap)
for (const b of belts) {
  for (let z = 1; z < D - 1; z++) {
    if (has(0, z) && z % 6 === 2 && has(1, z) && b + 1 >= 4) vox.set(1, b + 1, z, "glowstone");
    if (has(3, z) && z % 6 === 4 && has(2, z) && b + 1 >= 4) vox.set(2, b + 1, z, "glowstone");
  }
}

// Brick chimneys on the flat tar roof
for (const [cx, cz] of [[1, 3], [2, 14]]) {
  if (!has(cx, cz)) continue;
  for (let y = Rt - 1; y <= Rt + 1; y++) vox.set(cx, y, cz, "bricks");
  vox.set(cx, Rt + 2, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

vox.save(`${DIR}/${ID}.nbt`);
