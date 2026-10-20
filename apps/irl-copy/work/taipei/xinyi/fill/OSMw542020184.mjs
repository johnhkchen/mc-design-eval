import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020184";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 12 x 23 x 12: two storeys (~5 blocks each) plus a parapet, roof ~11 above lowest ground.
const W = 12, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, id, st) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

const WIN_GROUND = [1, 2, 3];   // relative rows of shopfront glass
const WIN_UPPER = [7, 8];       // relative rows of upper-storey glass

for (const [x, z, gr] of cells) {
  // Foundation course up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground floor, second floor, roof deck.
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 10, z, "light_gray_concrete");

  const mx = !has(x - 1, z), px = !has(x + 1, z);
  const mz = !has(x, z - 1), pz = !has(x, z + 1);
  const xe = mx || px;   // edge in x direction
  const ze = mz || pz;   // edge in z direction

  if (!xe && !ze) {
    // Interior: air, roof plant on the deck.
    if (x % 4 === 1 && z % 4 === 2) put(x, gr + 11, z, "iron_block");
    continue;
  }

  if (xe && ze) {
    // Corner column: solid, with parapet.
    for (let r = 1; r <= 10; r++) put(x, gr + r, z, "white_concrete");
    put(x, gr + 10, z, "white_concrete");
    put(x, gr + 11, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }

  // Straight wall cell.
  const alongX = ze;                    // wall runs along x
  const t = alongX ? x : z;             // position along the wall
  const dx = alongX ? 0 : (mx ? 1 : -1);
  const dz = alongX ? (mz ? 1 : -1) : 0;
  const pillar = t % 3 === 0;
  const isEntrance = alongX && pz && t === 5;
  const paneState = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Wall column, storey by storey.
  for (let r = 1; r <= 9; r++) {
    const y = gr + r;
    if (r === 5) { put(x, y, z, "smooth_stone"); continue; }     // storey line
    if (r === 10) continue;                                       // handled below
    let isWin = false;
    if (r >= 1 && r <= 3 && WIN_GROUND.includes(r)) isWin = true;
    if (r >= 6 && r <= 9 && WIN_UPPER.includes(r)) isWin = true;
    if (isEntrance && (r === 1 || r === 2)) {
      put(x, y, z, "oak_door", {
        facing: "north", half: r === 1 ? "lower" : "upper", hinge: "left",
        open: "false", powered: "false",
      });
      continue;
    }
    if (isWin && !pillar) {
      put(x, y, z, "glass_pane", paneState);
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Parapet and cap.
  put(x, gr + 10, z, "white_concrete");
  put(x, gr + 11, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Warm lanterns just inside selected windows (sit on the floor slab).
  if (!pillar && t % 6 === 1 && !isEntrance) {
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz)) {
      put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
      put(ix, gr + 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
