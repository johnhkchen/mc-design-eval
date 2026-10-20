import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1335587041";
const W = 14, H = 19, D = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const L = Math.min(...cells.map((c) => c[2]));   // lowest ground under footprint
const R = L + 7;                                  // roof about 7 blocks above lowest ground

const NB = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INWARD = { north: "south", south: "north", west: "east", east: "west" };
const inside = (x, z) => ground.has(key(x, z));
const faces = (x, z) => Object.keys(NB).filter(f => !inside(x + NB[f][0], z + NB[f][1]));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const paneProps = (f) =>
  (f === "north" || f === "south")
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Front = south (z max) side; entrance centred on the exposed south cells.
const southXs = cells
  .filter(([x, z]) => faces(x, z).includes("south"))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;
const doorZ = cells.reduce((m, [, z]) => Math.max(m, z), -Infinity);

for (const [x, z, gr] of cells) {
  const T = Math.max(R, gr + 5);          // top of wall (parapet cap at T-1)
  const fs = faces(x, z);
  const boundary = fs.length > 0;

  // Foundation fill from 0 to ground, plinth on the ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "polished_andesite");

  // Storey line between ground floor and upper floor (also acts as floor slab).
  if (gr + 4 < T - 1) put(x, gr + 4, z, "smooth_stone");

  // Roof: parapet cap on the edge, roof deck inside.
  put(x, T - 1, z, boundary ? "smooth_stone" : "light_gray_concrete");

  // Rooftop AC units on interior cells, kept under the height limit.
  if (!boundary && T < H - 1 && (x * 3 + z * 5) % 23 === 0) {
    put(x, T, z, "iron_block");
  }

  if (!boundary) continue;

  // Shell walls: glass panes in bays, white concrete pillars.
  for (let y = gr + 1; y <= T - 2; y++) {
    if (y === gr + 4) continue; // storey line already placed
    if (fs.length >= 2) {        // corner column
      put(x, y, z, "white_concrete");
      continue;
    }
    const f = fs[0];
    const p = (f === "north" || f === "south") ? x : z;
    const isPillar = p % 3 === 0;

    // Entrance door on the front (south) face, lantern above it.
    if (f === "south" && x === doorX && z === doorZ && y === gr + 1) {
      put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (f === "south" && x === doorX && z === doorZ && y === gr + 3) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (f === "south" && x === doorX && z === doorZ && y === gr + 2) continue;

    if (isPillar) {
      put(x, y, z, "white_concrete");
      continue;
    }

    put(x, y, z, "cyan_stained_glass_pane", paneProps(f));

    // Warm light behind some upper-storey glass (inward neighbour, inside air).
    if (y > gr + 4 && y < T - 1 && (x + z + y) % 7 === 0) {
      const inv = INWARD[f];
      const ix = x + NB[inv][0], iz = z + NB[inv][1];
      if (inside(ix, iz)) put(ix, y, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
