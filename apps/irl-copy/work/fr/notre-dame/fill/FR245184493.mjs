// FR245184493: a four-storey stone hôtel on the lidar footprint, with lower wings stepping down to the south-east.
// Storeys are 5 blocks: a string course (chiseled stone) at the floor line, two window rows (glass on alternate cells,
// calcite piers between, some windows lit with glowstone), and a sill and lintel band of calcite. The cornice is
// stone brick. The tallest tier (lidar 18-20) carries a slate mansard to y = 23, about 24 blocks above the lowest ground.
// Each column is solid from its ground up to its tier, so every storey and roof stands on the one below. The footprint is
// one block a cell, so there is no air gap behind the glass: the glass is the wall itself, and there are no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184493.cells.json`, "utf8"));

const X = 6, Y = 36, Z = 8;
const STOREY = 5;

// The footprint: cells the lidar gives a roof above their ground. A roof of 0 is no building (the lidar's empty cell).
const fp = new Map();                                    // "x,z" -> { ground, lidar, n, top }
for (const [x, z, ground, roof] of cells) if (roof > 0) fp.set(`${x},${z}`, { ground, lidar: roof });
const at = (x, z) => fp.get(`${x},${z}`);

// Smooth the lidar into whole storeys (at least one): round(height / 5), so 11-12 is 2 storeys, 13-14 is 3, 18-20 is 4.
for (const c of fp.values()) {
  c.n = Math.max(1, Math.round((c.lidar - c.ground) / STOREY));
  c.top = c.ground + STOREY * c.n;                       // the cornice row: the top solid block of the column
}

// A column is solid from y 0 up to its cornice (inclusive). The foundation below its ground is part of the column.
const solid = (x, y, z) => { const c = at(x, z); return !!c && y >= 0 && y <= c.top; };
const NEI = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const exposedAt = (x, y, z) => NEI.some(([dx, dz]) => !solid(x + dx, y, z + dz));

// Tall tier: columns whose cornice is the building's top (4 storeys). The mansard sits on their cornice, and each ring
// of cells inside the tall tier (every neighbour tall, then every neighbour of those) steps the slate up one block.
const tall = (x, z) => at(x, z)?.n === 4;
const inset = (x, z, d) => tall(x, z) && NEI.every(([dx, dz]) => (d === 0 ? tall(x + dx, z + dz) : inset(x + dx, z + dz, d - 1)));

// Street door: the north face at the middle of the north-most row of cells, on the ground storey.
const zMin = Math.min(...[...fp.keys()].map((k) => +k.split(",")[1]));
const northRow = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([, z]) => z === zMin).sort((a, b) => a[0] - b[0]);
const door = northRow.length ? { x: northRow[Math.floor(northRow.length / 2)][0], z: zMin } : null;

const v = new Voxels([X, Y, Z]);

for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= c.top; y++) {
    const rel = y - c.ground;
    let block;
    if (y < c.ground || y === 0) block = "stone_bricks";                   // plinth and foundation
    else if (y === c.top) block = "stone_bricks";                          // cornice
    else if (!exposedAt(x, y, z)) block = "calcite";                       // hidden fill (no interiors)
    else if (rel % STOREY === 0) block = "chiseled_stone_bricks";          // floor line / string course
    else if (rel % STOREY === 2 || rel % STOREY === 3) {                   // window rows
      if ((x + z) % 2 === 0) {
        const storeyIdx = Math.floor(rel / STOREY);
        block = (x * 3 + z * 5 + storeyIdx) % 7 === 0 ? "glowstone" : "glass";   // a few lit rooms, not a grid of them
      } else block = "stone_bricks";                                       // piers between panes
    } else block = "calcite";                                              // sill and lintel bands
    v.set(x, y, z, block);
  }
}

// Mansard over the tall tier: slate on the cornice (y = top + 1), inset rows stepping up to y = 23.
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (c.n !== 4) continue;
  v.set(x, c.top + 1, z, "deepslate_tiles");
  if (inset(x, z, 0)) v.set(x, c.top + 2, z, "deepslate_tiles");
  if (inset(x, z, 1)) v.set(x, c.top + 3, z, "deepslate_tiles");
}

// Roof equipment: a brick chimney stack on the innermost slate, rising to y = 23 (the lidar's roof, about 24 blocks).
const innerCells = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => inset(x, z, 1));
if (innerCells.length) {
  const [cx, cz] = innerCells[Math.floor(innerCells.length / 2)];
  for (let y = at(cx, cz).top + 1; y <= 23; y++) v.set(cx, y, cz, "bricks");
}

// The street door on the ground storey: a dark oak door, lower and upper halves, facing north.
if (door) {
  const c = at(door.x, door.z);
  v.set(door.x, c.ground + 1, door.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(door.x, c.ground + 2, door.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

const info = v.save(`${DIR}/FR245184493.nbt`);
console.log(`FR245184493: ${fp.size} cells, ${info.blocks} blocks, ${info.palette} palette entries`);
