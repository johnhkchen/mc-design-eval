import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, Xinyi district: cream quartz-tile facade,
// blue-tinted glazing in pale quartz frames, stone plinth, flat roof with plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833552";
const W = 18, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.min(gr, 10));
const has = (x, z) => G.has(`${x},${z}`);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Door sits on the north (minimum-z) street face, nearest the footprint's middle.
const xs = cells.map(c => c[0]);
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
let door = null;
for (const [x, z] of cells) {
  if (has(x, z - 1)) continue;
  if (!door || Math.abs(x - midX) < Math.abs(door.x - midX)) door = { x, z };
}

for (const [x, z, gr0] of cells) {
  const gr = Math.min(gr0, 10);
  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const per = nN || nS || nW || nE;
  const corner = (nN || nS) && (nW || nE);
  const u = (nN || nS) ? x : z;
  const pier = corner || (u % 3 === 0);
  const isDoor = door && door.x === x && door.z === z;
  const interior = !per;

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / plinth course.
  put(x, gr, z, per ? "stone_bricks" : "smooth_stone");

  // Ground storey shopfront: gr+1..gr+3, glazing between quartz piers.
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (!per) continue;
    if (isDoor && (y === gr + 1 || y === gr + 2)) continue; // door placed below
    put(x, y, z, pier ? "smooth_quartz" : "light_blue_stained_glass");
  }
  if (isDoor) {
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (has(x, z + 1)) put(x, gr + 3, z + 1, "lantern", { hanging: "true" });
  }
  // Warm interior light behind shopfront glass.
  if (interior && x % 4 === 0 && z % 4 === 0) put(x, gr + 1, z, "glowstone");

  // Lintel band over the shopfront.
  if (per) put(x, gr + 4, z, "smooth_quartz");

  // Storey line / upper floor slab.
  put(x, gr + 5, z, per ? "smooth_quartz" : "smooth_stone");

  // Upper storey windows: gr+6..gr+8.
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (per) put(x, y, z, pier ? "smooth_quartz" : "light_blue_stained_glass");
  }
  if (interior && x % 3 === 1 && z % 3 === 1) put(x, gr + 6, z, "glowstone");

  // Cornice band.
  if (per) put(x, gr + 9, z, "smooth_quartz");

  // Roof deck, with parapet walls on the perimeter.
  put(x, gr + 10, z, per ? "smooth_quartz" : "light_gray_concrete");
  if (per) put(x, gr + 11, z, "smooth_quartz");

  // Rooftop AC units and central plant box.
  if (interior) {
    if (x >= 6 && x <= 11 && z >= 8 && z <= 12) {
      put(x, gr + 11, z, "white_concrete");
      put(x, gr + 12, z, "white_concrete");
    } else if (x % 4 === 2 && z % 4 === 2) {
      put(x, gr + 11, z, "iron_block");
    }
  }
}

// Cap the plant box with a slab.
for (const [x, z, gr0] of cells) {
  const gr = Math.min(gr0, 10);
  if (x >= 6 && x <= 11 && z >= 8 && z <= 12 && has(x, z)) {
    put(x, gr + 13, z, "quartz_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
