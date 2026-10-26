import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 2000 N St NW: a 1920s-30s Georgian Revival apartment house. Red brick walls, limestone (calcite) string courses,
// cornice and quoins, a stone base, a 4-block entry pavilion on the north front, a 13-block podium wing and a
// 14-16 block setbacked tower. Storeys are 3 blocks: a stone sill/floor course and two rows of glass.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55069.cells.json`, "utf8"));

const SIZE = [29, 28, 30];
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inF = (x, z) => cell.has(key(x, z));

// Lidar noise: each cell takes the most common roof height among its footprint neighbours (ties go high),
// which settles the roof into flat tiers.
const roof = new Map();
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const tally = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = cell.get(key(x + dx, z + dz)); if (n) tally.set(n.r, (tally.get(n.r) ?? 0) + 1);
  }
  let best = c.r, most = -1;
  for (const [r, n] of tally) if (n > most || (n === most && r > best)) { best = r; most = n; }
  roof.set(k, best);
}

const g3 = new Voxels(SIZE);
const GLASS_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const lanterns = [];

for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const G = c.g, R = roof.get(k);
  const n = Math.max(0, Math.floor((R - 1 - G) / 3));          // full 3-block storeys above the ground
  const exN = !inF(x, z - 1), exS = !inF(x, z + 1), exW = !inF(x - 1, z), exE = !inF(x + 1, z);
  const edge = exN || exS || exW || exE;
  const zFace = exN || exS, xFace = exW || exE;                // a wall running along x (N/S front) or along z
  const corner = zFace && xFace && (x === 0 || x === 28 || z === 0 || z === 29);   // quoins only at the block's own corners, not on every stair step
  const t = zFace ? x : z;                                     // position along that wall
  const winCol = edge && !corner && t % 3 !== 0;               // piers every third cell, windows between

  for (let y = 0; y < R; y++) {
    if (y < G) { g3.set(x, y, z, "stone_bricks"); continue; }  // foundation, fills to the lowest ground under the cell
    if (y === R - 1) { g3.set(x, y, z, "calcite"); continue; } // roof cap / cornice
    const i = y - G, attic = i > 3 * n, course = i % 3 === 0 && !attic, win = i % 3 !== 0 && !attic;
    if (!edge) {
      if (course || attic) g3.set(x, y, z, "smooth_stone");     // floor slabs and parapet mass; air behind the glass
      continue;
    }
    if (corner && !(course && i === 0)) { g3.set(x, y, z, "calcite"); continue; }   // quoins
    if (course) { g3.set(x, y, z, i === 0 ? "stone_bricks" : "calcite"); continue; } // base course, storey lines
    if (attic) { g3.set(x, y, z, "bricks"); continue; }
    if (win && winCol) {
      g3.set(x, y, z, "glass_pane", zFace ? GLASS_NS : GLASS_EW);
      // a lit window: lantern in the air gap just inside the glass, standing on the floor course
      if (i % 3 === 1 && t % 3 === 1 && (Math.floor(t / 3) + 2 * Math.floor(i / 3)) % 3 === 0) {
        const ix = zFace ? x : (exW ? x + 1 : x - 1), iz = zFace ? (exN ? z + 1 : z - 1) : z;
        if (inF(ix, iz)) lanterns.push([ix, y, iz]);
      }
    } else g3.set(x, y, z, "bricks");
  }

  // roof plant: sparse mechanical boxes on the tower and the podium
  if (!edge) {
    if (R === 16 && x % 5 === 2 && z % 5 === 2) { g3.set(x, R, z, "stone_bricks"); g3.set(x, R + 1, z, "stone_bricks"); }
    else if ((R === 13 || R === 14) && x % 6 === 3 && z % 6 === 3) g3.set(x, R, z, "iron_block");
  }
}

for (const [x, y, z] of lanterns) g3.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });

// Entry on the north front: a 2-block oak door between calcite-capped stone piers, under a canopy.
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g3.set(19, 2, 0, "oak_door", door("lower"));
g3.set(19, 3, 0, "oak_door", door("upper"));
for (let x = 17; x <= 21; x++) g3.set(x, 4, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

const out = g3.save(`${DIR}/DC55069.nbt`);
console.log(`built DC55069: ${out.blocks} blocks, palette ${out.palette}, lanterns ${lanterns.length}`);
