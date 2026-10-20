import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993144";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 14;
const g = new Voxels([W, H, D]);

// Footprint set and common base level (highest ground under the footprint),
// so every storey sits on a continuous slab; lower cells get a foundation up to it.
const inside = new Set();
let base = 0;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  inside.add(`${x},${z}`);
  base = Math.max(base, gr);
}

function put(x, y, z, id, props) {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const has = (x, z) => inside.has(`${x},${z}`);
const miss = (x, z, dx, dz) => !has(x + dx, z + dz);

function facade(x, z) {
  const mN = miss(x, z, 0, -1), mS = miss(x, z, 0, 1);
  const mW = miss(x, z, -1, 0), mE = miss(x, z, 1, 0);
  const wall = mN || mS || mW || mE;
  const corner = (mN || mS) && (mW || mE);
  const idx = (mN || mS) ? x : z;
  const pane = (mN || mS)
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const window = wall && !corner && idx % 3 === 1;
  // inward cell (one step into the building from the facade)
  let inward = null;
  if (wall && !corner) {
    if (mN) inward = [x, z + 1];
    else if (mS) inward = [x, z - 1];
    else if (mW) inward = [x + 1, z];
    else if (mE) inward = [x - 1, z];
  }
  return { wall, corner, mS, idx, pane, window, inward };
}

const isWall = (x, z) => facade(x, z).wall;

// Entrance: middle of the south-facing frontage (fallback: north)
let doorKey = null;
let doorFacing = "south";
{
  const sCells = [];
  for (const k of inside) {
    const [x, z] = k.split(",").map(Number);
    const f = facade(x, z);
    if (f.wall && !f.corner && f.mS) sCells.push([x, z]);
  }
  sCells.sort((a, b) => a[0] - b[0]);
  if (sCells.length) {
    const [dx, dz] = sCells[Math.floor(sCells.length / 2)];
    doorKey = `${dx},${dz}`;
  }
}

for (const k of inside) {
  const [x, z] = k.split(",").map(Number);
  const f = facade(x, z);
  const wallCell = f.wall;

  // Foundation and plinth
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");
  put(x, base, z, "smooth_stone");

  // Floor slabs at each storey line (storeys are 5 blocks: base..base+5..base+10)
  put(x, base + 5, z, wallCell ? "light_gray_concrete" : "smooth_stone");
  put(x, base + 10, z, wallCell ? "white_concrete" : "smooth_stone");

  if (wallCell) {
    // Storey lines
    put(x, base + 4, z, "light_gray_concrete");
    put(x, base + 9, z, "light_gray_concrete");

    // Window grids: glass panes between white piers, storey 1 and 2
    const winRows = [1, 2, 3, 6, 7, 8];
    for (const r of winRows) {
      const y = base + r;
      if (f.window) put(x, y, z, "glass_pane", f.pane);
      else put(x, y, z, "white_concrete");
    }

    // Parapet
    put(x, base + 11, z, f.corner ? "light_gray_concrete" : "white_concrete");

    // Entrance door with transom and lintel
    if (k === doorKey) {
      const dProps = (half) => ({
        facing: doorFacing, half, hinge: "left", open: "false", powered: "false",
      });
      put(x, base + 1, z, "oak_door", dProps("lower"));
      put(x, base + 2, z, "oak_door", dProps("upper"));
      put(x, base + 3, z, "glass_pane", f.pane);
      // Lantern just inside the door
      const inw = [x, z - 1];
      if (has(inw[0], inw[1]) && !isWall(inw[0], inw[1])) {
        put(inw[0], base + 1, inw[1], "lantern", { hanging: "false", waterlogged: "false" });
      }
    }

    // Warm lights behind some windows
    if (f.window && f.inward && (x + z) % 4 === 0) {
      const [ix, iz] = f.inward;
      if (has(ix, iz) && !isWall(ix, iz)) {
        put(ix, base + 2, iz, "glowstone");
        put(ix, base + 7, iz, "shroomlight");
      }
    }
  } else {
    // Roof equipment on the interior roof
    if ((x * 7 + z * 3) % 11 === 0) put(x, base + 11, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
