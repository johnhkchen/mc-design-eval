import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "TPE97-0111-7F";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 9, H = 47, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const minG = Math.min(...cells.map(c => c[2]));
const Y0 = minG + 1;
const STOREYS = 7;
const STOREY_H = 5;
const roofY = Y0 + STOREYS * STOREY_H;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const inFp = (x, z) => ground.has(key(x, z));
const missing = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const isEdge = (x, z) => missing(x, z).length > 0;

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!inFp(x, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance: street-level edge cell on the -z face, nearest the middle of the face
const edgeCells = cells.filter(([x, z]) => isEdge(x, z));
const streetCells = edgeCells.filter(([, , gr]) => gr <= Y0);
const pool = streetCells.length ? streetCells : edgeCells;
const southPool = pool.filter(([x, z]) => missing(x, z).some(([, dz]) => dz === -1));
const doorPool = southPool.length ? southPool : pool;
const meanX = (W - 1) / 2;
let doorCell = null;
for (const c of doorPool) {
  if (!doorCell || Math.abs(c[0] - meanX) < Math.abs(doorCell[0] - meanX)) doorCell = c;
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= Math.min(gr, H - 1); y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const miss = missing(x, z);
  const corner = miss.length >= 2;
  const out = edge ? miss[0] : null;
  const along = out && out[0] !== 0 ? z : x;
  const pier = edge && (corner || along % 3 === 0);

  for (let s = 0; s < STOREYS; s++) {
    for (let k = 0; k < STOREY_H; k++) {
      const y = Y0 + s * STOREY_H + k;
      if (y <= gr || y >= H) continue;

      if (!edge) {
        if (k === 0) put(x, y, z, "light_gray_concrete");
        continue;
      }

      if (k === 0) {
        put(x, y, z, "white_concrete");                       // spandrel / storey base
      } else if (k === STOREY_H - 1) {
        put(x, y, z, "light_gray_concrete");                  // storey line
      } else if (pier) {
        put(x, y, z, "quartz_pillar", { axis: "y" });         // vertical pier, reads as relief
      } else if (k === 1) {
        put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // window sill
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Warm lights behind some window bays
  if (edge && out && !pier) {
    for (const s of [1, 3, 5]) {
      if (along % 6 !== 1) break;
      const y = Y0 + s * STOREY_H + 2;
      const ix = x - out[0], iz = z - out[1];
      if (y > gr && inFp(ix, iz) && !isEdge(ix, iz) && y > ground.get(key(ix, iz))) {
        put(ix, y, iz, "shroomlight");
      }
    }
  }

  // Roof: deck inside, parapet and cap at the edge
  if (roofY > gr) {
    if (edge) {
      put(x, roofY, z, "white_concrete");
      put(x, roofY + 1, z, "white_concrete");
      put(x, roofY + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    } else {
      put(x, roofY, z, "light_gray_concrete");
    }
  }
}

// Roof plant room, set back from the parapet
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (x < 2 || x > 6 || z < 4 || z > 11) continue;
  if (roofY + 1 <= gr) continue;
  put(x, roofY + 1, z, "gray_concrete");
  if (x === 2 || x === 6 || z === 4 || z === 11) put(x, roofY + 2, z, "light_gray_concrete");
}

// Entrance: iron doors, stone lintel, dark stone canopy band above
if (doorCell) {
  const [x, z] = doorCell;
  const [dx0, dz0] = missing(x, z)[0];
  const facing = dz0 < 0 ? "north" : dz0 > 0 ? "south" : dx0 < 0 ? "west" : "east";
  put(x, Y0 + 1, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, Y0 + 2, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, Y0 + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  // Flanking lanterns on the wall beside the door, warm light at street level
  for (const ox of [-1, 1]) {
    if (inFp(x + ox, z) && isEdge(x + ox, z) && ground.get(key(x + ox, z)) <= Y0) {
      put(x + ox, Y0 + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${dir}/${id}.nbt`);
