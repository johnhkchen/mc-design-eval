import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951873";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// ground lookup
const gMap = new Map();
for (const [x, z, gr] of cells) gMap.set(`${x},${z}`, gr);
const has = (x, z) => gMap.has(`${x},${z}`);
const isExt = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const y0 = Math.min(...cells.map((c) => c[2]));
const roofY = Math.min(y0 + 10, H - 2);   // top of walls / cornice
const parapetY = roofY + 1;               // y0 + 11 (about 11 above lowest ground)
const midY = y0 + 5;                      // storey floor line

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const doorX = minX + Math.floor((maxX - minX) / 2);

const DOOR_FACING = "south";

for (const [x, z, gr] of cells) {
  const ext = isExt(x, z);
  const u = x - minX;
  const front = ext && z === minZ;

  // foundation fill up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (gr > roofY) continue;

  // floor at ground level
  put(x, gr, z, ext ? "stone_bricks" : "smooth_stone");

  if (!ext) {
    // interior: air gap, floor slabs per storey, roof deck
    if (midY > gr && midY < roofY) put(x, midY, z, "smooth_stone");
    put(x, roofY, z, "smooth_quartz");
    continue;
  }

  // exterior walls, gr+1 .. roofY
  for (let y = gr + 1; y <= roofY; y++) {
    const r = y - gr;
    if (r === 1) {
      put(x, y, z, "polished_andesite");
    } else if (r <= 4) {
      // ground-storey shopfront
      if (front && x === doorX && r <= 3) {
        if (r === 2) put(x, y, z, "oak_door", { facing: DOOR_FACING, half: "lower", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "oak_door", { facing: DOOR_FACING, half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (front && x === doorX && r === 4) {
        put(x, y, z, "smooth_quartz");
      } else if (u % 2 === 1) {
        put(x, y, z, "glass");
      } else {
        put(x, y, z, "deepslate_tiles");
      }
    } else if (r === 5) {
      put(x, y, z, "smooth_quartz");           // storey line / canopy band
    } else if (y === roofY) {
      put(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" }); // cornice
    } else if (r === 6 || r === 9) {
      put(x, y, z, "smooth_quartz");           // sills and heads
    } else if ((r === 7 || r === 8) && u % 2 === 1) {
      put(x, y, z, "glass_pane");
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // parapet
  put(x, parapetY, z, "white_concrete");
}

// roof parapet cap slab edges and interior roof already placed; warm lights behind some windows
for (const [x, z, gr] of cells) {
  if (!isExt(x, z) || gr > roofY) continue;
  const u = x - minX;
  if (u % 2 !== 1) continue;
  const y = gr + 7;
  if (y >= roofY) continue;
  const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dz]) => [x + dx, z + dz])
    .find(([nx, nz]) => has(nx, nz) && !isExt(nx, nz));
  if (!inward) continue;
  const [nx, nz] = inward;
  if ((x + z) % 4 === 0) put(nx, y, nz, "glowstone");
  else if ((x + z) % 4 === 2) put(nx, gr + 2, nz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
