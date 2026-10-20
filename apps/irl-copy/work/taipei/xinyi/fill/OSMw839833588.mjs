import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833588";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Two-storey 1980s Taipei commercial block: tiled quartz facade, granite base,
// red fascia over a glass shopfront, one upper floor of windows, stone cornice, parapet.
const ROOF = 11; // roof is about 11 blocks above the lowest ground

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const perim = (x, z) => dirs.some(([dx, dz]) => !has(x + dx, z + dz));

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Front = lowest z edge; door sits at the middle of that edge's perimeter cells.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const frontCells = cells
  .filter(([x, z]) => z === minZ && perim(x, z))
  .sort((a, b) => a[0] - b[0]);
const door = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;
const doorKey = door ? key(door[0], door[1]) : null;

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Storeys, walls, roof.
for (const [x0, z0, gr0] of cells) {
  const x = x0, z = z0, gr = Math.round(gr0);
  const bay = ((x + z) % 3 + 3) % 3;

  if (!perim(x, z)) {
    // Interior: floor slabs per storey and roof, air between.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + ROOF, z, "stone_bricks");
    // Roof equipment: a few AC/water boxes on the roof deck.
    if (x % 4 === 1 && z % 4 === 2) put(x, gr + ROOF + 1, z, "iron_block");
    continue;
  }

  const isDoor = key(x, z) === doorKey;

  // Granite base course.
  put(x, gr, z, "polished_andesite");

  // Shopfront, rel 1..3.
  for (let r = 1; r <= 3; r++) {
    if (isDoor && r <= 2) {
      put(x, gr + r, z, "dark_oak_door", {
        facing: "north",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (bay === 0) {
      put(x, gr + r, z, "stone_bricks");
    } else {
      put(x, gr + r, z, "glass");
    }
  }

  // Red fascia / signage band over the shopfront.
  put(x, gr + 4, z, "red_terracotta");
  // Storey line.
  put(x, gr + 5, z, "polished_andesite");

  // Upper floor windows with quartz pilasters at bay 0.
  for (let r = 6; r <= 9; r++) {
    put(x, gr + r, z, bay === 0 ? "quartz_block" : "glass");
  }

  // Stone cornice, quartz parapet, parapet cap.
  put(x, gr + 10, z, "stone_bricks");
  put(x, gr + ROOF, z, "quartz_block");
  put(x, gr + ROOF + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// 3. Warm lights behind some upper windows (glowstone one cell inward).
for (const [x, z, gr0] of cells) {
  if (!perim(x, z)) continue;
  const bay = ((x + z) % 3 + 3) % 3;
  if (bay === 0 || (x + z) % 4 !== 1) continue;
  for (const [dx, dz] of dirs) {
    if (has(x + dx, z + dz)) continue; // outward side is the missing neighbour
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && !perim(ix, iz)) {
      const igr = Math.round(ground.get(key(ix, iz)));
      put(ix, igr + 7, iz, "glowstone");
    }
    break;
  }
}

g.save(`${DIR}/${ID}.nbt`);
