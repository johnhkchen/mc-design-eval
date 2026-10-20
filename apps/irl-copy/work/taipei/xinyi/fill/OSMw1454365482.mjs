import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1454365482";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inF = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Bounds-guarded setter
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward directions for a footprint cell (neighbours outside the footprint)
const outs = (x, z) => {
  const o = [];
  if (!inF(x, z - 1)) o.push([0, -1]);
  if (!inF(x, z + 1)) o.push([0, 1]);
  if (!inF(x + 1, z)) o.push([1, 0]);
  if (!inF(x - 1, z)) o.push([-1, 0]);
  return o;
};
const isPerim = (x, z) => outs(x, z).length > 0;

const DIRNAME = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Storey height 5 blocks; ground floor at each cell's own ground.
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at each storey line (ground, 1st floor, roof deck)
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 10, z, "light_gray_concrete");

  if (!isPerim(x, z)) {
    // Roof equipment on interior roof cells
    if (x % 5 === 2 && z % 5 === 2) put(x, gr + 11, z, "iron_block");
    continue;
  }

  const o = outs(x, z);
  const corner = o.length > 1;
  const [ox, oz] = o[0];
  const idx = ox !== 0 ? z : x;
  const paneProps = ox !== 0 ? PANE_Z : PANE_X;

  // Storey walls
  for (let s = 0; s < 2; s++) {
    const base = gr + 5 * s;
    const isDoor = s === 0 && !corner && ox === 0 && oz === -1 && x === 7;
    const isWindow = !corner && idx % 3 !== 0;

    if (isDoor) {
      const dp = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
      put(x, base + 1, z, "dark_oak_door", dp("lower"));
      put(x, base + 2, z, "dark_oak_door", dp("upper"));
      put(x, base + 3, z, "light_blue_stained_glass_pane", paneProps);
    } else {
      for (let y = base + 1; y <= base + 3; y++) {
        if (isWindow) put(x, y, z, "light_blue_stained_glass_pane", paneProps);
        else put(x, y, z, "white_concrete");
      }
    }
    // Storey line / lintel band
    put(x, base + 4, z, "smooth_quartz");
  }

  // Warm light behind some windows (air gap inward)
  if (!corner && idx % 6 === 2) {
    const ix = x - ox, iz = z - oz;
    if (inF(ix, iz) && !isPerim(ix, iz)) {
      for (let s = 0; s < 2; s++) {
        put(ix, gr + 5 * s + 2, iz, "glowstone");
      }
    }
  }

  // Cornice and parapet
  put(x, gr + 10, z, "smooth_quartz");
  put(x, gr + 11, z, corner ? "smooth_quartz" : "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
