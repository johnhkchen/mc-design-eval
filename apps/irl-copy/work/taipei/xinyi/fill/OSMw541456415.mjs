import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456415";
const W = 16, H = 23, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint lookup: "x,z" -> ground height (rounded)
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const inF = (x, z) => G.has(`${x},${z}`);

const out = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) out.set(x, y, z, block, props);
  else out.set(x, y, z, block);
};

// Entrance: south-face cell closest to the footprint centre
const cx = (W - 1) / 2;
let entranceX = null;
for (const [x, z] of G.keys().map(k => k.split(",").map(Number))) {
  if (inF(x, z + 1)) continue; // not a south-face cell
  if (entranceX === null || Math.abs(x - cx) < Math.abs(entranceX - cx)) entranceX = x;
}

const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";

for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);

  const onN = !inF(x, z - 1);
  const onS = !inF(x, z + 1);
  const onW = !inF(x - 1, z);
  const onE = !inF(x + 1, z);
  const onNS = onN || onS;
  const onEW = onW || onE;
  const perim = onNS || onEW;
  const corner = onNS && onEW;

  // Foundation: solid from y 0 up to ground under this cell
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at each storey level (all footprint cells)
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 10, z, "smooth_stone");

  // Roof surface
  put(x, gr + 11, z, perim ? "smooth_stone" : "light_gray_concrete");

  if (!perim) {
    // Rooftop plant box in the middle of the roof
    if (x >= 5 && x <= 10 && z >= 3 && z <= 7) {
      put(x, gr + 12, z, "gray_concrete");
    }
    continue;
  }

  // Perimeter walls
  const pillar = corner || (onNS ? x % 3 === 0 : z % 3 === 0);

  // Inward neighbour, used for placing light behind glass
  let inX = x, inZ = z;
  if (onS) inZ = z - 1;
  else if (onN) inZ = z + 1;
  else if (onW) inX = x + 1;
  else if (onE) inX = x - 1;
  const hasInside = inF(inX, inZ) && (inX !== x || inZ !== z);

  // Base course
  put(x, gr + 1, z, "polished_granite");

  // Storey lines and parapet
  put(x, gr + 5, z, FRAME);
  put(x, gr + 10, z, FRAME);
  put(x, gr + 12, z, FRAME);

  // Ground storey: shopfront (y gr+2..gr+4)
  const isDoor = onS && x === entranceX;
  for (let y = gr + 2; y <= gr + 4; y++) {
    if (pillar) {
      put(x, y, z, "polished_andesite");
    } else {
      put(x, y, z, GLASS);
    }
  }
  if (isDoor) {
    put(x, gr + 2, z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 3, z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else if (!pillar && hasInside && (x + z) % 5 === 0) {
    // warm light behind a ground-floor pane
    put(inX, gr + 3, inZ, "glowstone");
  }

  // Upper storey: windows (y gr+6..gr+9)
  for (let y = gr + 6; y <= gr + 9; y++) {
    put(x, y, z, pillar ? FRAME : GLASS);
  }
  if (!pillar && hasInside && (x + z) % 4 === 0) {
    put(inX, gr + 7, inZ, "glowstone");
  }

  // Cornice and parapet
  put(x, gr + 11, z, "smooth_stone");
  put(x, gr + 12, z, FRAME);
}

out.save(`${DIR}/${ID}.nbt`);
