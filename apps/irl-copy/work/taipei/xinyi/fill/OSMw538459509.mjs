import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459509";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 16 x 11 footprint, roof ~11 blocks above lowest ground: a two-storey
// 1970s-80s concrete shophouse-style commercial block with a shopfront
// ground floor, pale cream facade, grey piers, tinted glass, cornice and parapet.
const W = 16, H = 23, D = 11;
const vox = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

function put(x, y, z, b, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) vox.set(x, y, z, b, p);
  else vox.set(x, y, z, b);
}

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };

// Window rhythm: every third bay is a pier, the rest are glass panes.
const isWindow = (x, z) => (x + z) % 3 !== 0;

// Main door: on the south (max z) face, the edge cell nearest the facade's mid-width.
let maxZ = -Infinity;
for (const [, z] of cells) maxZ = Math.max(maxZ, z);
const southCells = cells.filter(([x, z]) => z === maxZ && isEdge(x, z));
let door = null;
if (southCells.length) {
  const meanX = southCells.reduce((s, [x]) => s + x, 0) / southCells.length;
  door = southCells.reduce((best, c) => (Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best));
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    const isDoor = door && door[0] === x && door[1] === z;

    // Base course.
    put(x, gr, z, "stone_bricks");

    // Ground floor shopfront (g+1..g+3).
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (isDoor && (y === gr + 1 || y === gr + 2)) continue; // door placed below
      if (isDoor && y === gr + 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      if (isWindow(x, z)) put(x, y, z, "light_blue_stained_glass_pane", PANE);
      else put(x, y, z, "light_gray_concrete");
    }
    if (isDoor) {
      const dp = { facing: "south", hinge: "left", open: "false", powered: "false" };
      put(x, gr + 1, z, "oak_door", { ...dp, half: "lower" });
      put(x, gr + 2, z, "oak_door", { ...dp, half: "upper" });
    }

    // Lintel over shopfront, string course at the floor line.
    put(x, gr + 4, z, "light_gray_concrete");
    put(x, gr + 5, z, "smooth_quartz");

    // Upper storey windows.
    for (let y = gr + 6; y <= gr + 8; y++) {
      if (isWindow(x, z)) put(x, y, z, "light_blue_stained_glass_pane", PANE);
      else put(x, y, z, "light_gray_concrete");
    }
    put(x, gr + 9, z, "light_gray_concrete");

    // Cornice and parapet cap.
    put(x, gr + 10, z, "smooth_quartz");
    put(x, gr + 11, z, "smooth_quartz_slab", SLAB_BOTTOM);
  } else {
    // Interior: floor slabs and roof deck only, air between (no interiors).
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "light_gray_concrete");

    // Warm lights standing on the floor slabs, a few behind the glass.
    if ((x * 2 + z * 3) % 7 === 0) put(x, gr + 6, z, "lantern", { hanging: "false", waterlogged: "false" });
    if ((x + 3 * z) % 9 === 0) put(x, gr + 1, z, "glowstone");

    // Roof plant: small units on the deck.
    if ((x * 3 + z * 5) % 11 === 0) put(x, gr + 11, z, "iron_block");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
