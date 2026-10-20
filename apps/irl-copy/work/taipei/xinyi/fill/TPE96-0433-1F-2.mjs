import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE96-0433-1F-2.cells.json`, "utf8"));

const W = 8, H = 19, D = 20;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// outward faces of a footprint cell
function faces(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push({ name: "north", dx: 0, dz: -1, inX: 0, inZ: 1, p: x });
  if (!has(x, z + 1)) out.push({ name: "south", dx: 0, dz: 1, inX: 0, inZ: -1, p: x });
  if (!has(x - 1, z)) out.push({ name: "west", dx: -1, dz: 0, inX: 1, inZ: 0, p: z });
  if (!has(x + 1, z)) out.push({ name: "east", dx: 1, dz: 0, inX: -1, inZ: 0, p: z });
  return out;
}

for (const [x, z, gr] of cells) {
  // foundation: solid stone from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // ground-floor slab across the whole footprint
  g.set(x, gr, z, "smooth_stone");
  // roof deck / storey ceiling across the whole footprint
  g.set(x, gr + 5, z, "smooth_stone");

  const fs = faces(x, z);

  // roof plant: two-block housing on interior roof cells, with a vent cap
  if (fs.length === 0 && x >= 2 && x <= 5 && z >= 7 && z <= 12) {
    g.set(x, gr + 6, z, "light_gray_concrete");
    if (x >= 3 && x <= 4 && z >= 8 && z <= 11) {
      g.set(x, gr + 7, z, "iron_block");
    }
  }

  if (fs.length === 0) continue; // interior cell: no shell

  const corner = fs.length >= 2;

  // parapet and cap on every perimeter cell
  g.set(x, gr + 6, z, "white_concrete");
  g.set(x, gr + 7, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // dark base course for contrast against the pale walls
  g.set(x, gr + 1, z, "polished_andesite");
  // red fascia / sign band, readable at dusk
  g.set(x, gr + 4, z, "red_terracotta");

  if (corner) {
    // corner pillars run the full storey height
    g.set(x, gr + 2, z, "white_concrete");
    g.set(x, gr + 3, z, "white_concrete");
    continue;
  }

  const f = fs[0];
  const isDoor = f.name === "north" && x === 3;

  if (isDoor) {
    // entrance: door (2 blocks) with glass transom above
    g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 3, z, "glass");
    continue;
  }

  // shopfront glass with a mullion every third bay
  const mullion = f.p % 3 === 0;
  for (const yy of [gr + 2, gr + 3]) {
    g.set(x, yy, z, mullion ? "white_concrete" : "glass");
  }

  // warm light just inside the glass, on some bays
  if (!mullion && f.p % 3 === 1) {
    const ix = x + f.inX, iz = z + f.inZ;
    if (has(ix, iz)) g.set(ix, gr + 2, iz, "shroomlight");
  }
}

g.save(`${DIR}/TPE96-0433-1F-2.nbt`);
