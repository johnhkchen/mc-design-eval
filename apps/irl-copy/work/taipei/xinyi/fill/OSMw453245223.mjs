import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw453245223";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 35, H = 19, D = 26;
const g = new Voxels([W, H, D]);

// Record-driven design: no historic record, so a mid-century Taipei low-rise
// commercial block (white tiled concrete, blue glass, granite base, shopfront
// ground storey, quartz cornice, parapet). Roof reads ~7 blocks above lowest ground.
const ROOF = 7;

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const inside = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

let minZ = Infinity;
for (const [, z] of cells) if (z < minZ) minZ = z;
const doorXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = doorXs[Math.floor(doorXs.length / 2)];

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

for (const [x, z, gr] of cells) {
  const g0 = gr;
  const top = Math.min(Math.max(ROOF, g0 + 5), H - 3);
  const i = x + z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    // Base course
    put(x, g0, z, "polished_granite");

    // Ground storey shopfront band (g0+1 .. g0+2), lintel at g0+3
    const front = z === minZ;
    for (let y = g0 + 1; y <= g0 + 2; y++) {
      if (front && x === doorX) {
        const half = y === g0 + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      } else if (i % 3 === 0) {
        put(x, y, z, "polished_andesite");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
      }
    }
    put(x, g0 + 3, z, "smooth_stone");

    // Upper storey wall with window grid
    for (let y = g0 + 4; y <= top - 3; y++) {
      if (i % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "cyan_stained_glass_pane");
    }

    // Cornice and parapet
    put(x, top - 2, z, "smooth_quartz");
    put(x, top - 1, z, "white_concrete");
  } else {
    // Interior: floor slab, air, roof deck
    put(x, g0, z, "smooth_stone");
    put(x, top - 1, z, "light_gray_concrete");
    // Warm light behind the shopfront glass
    if (z === minZ + 1 && x % 4 === 1) put(x, g0 + 1, z, "glowstone");
  }

  // Roof plant on interior deck
  if (!isEdge(x, z) && x % 8 === 4 && z % 6 === 3) {
    put(x, top, z, "light_gray_concrete");
    put(x, top + 1, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
