import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540295090";
const W = 19, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const exposedDirs = (x, z) => Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));
const facade = (x, z) => {
  const e = exposedDirs(x, z);
  for (const d of ["S", "N", "E", "W"]) if (e.includes(d)) return d;
  return null;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Door: on the south-facing exposed edge, nearest the footprint's centre line
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
let doorKey = null, best = Infinity;
for (const [x, z] of cells) {
  if (!has(x, z + 1) && Math.abs(x - cx) < best) {
    best = Math.abs(x - cx);
    doorKey = `${x},${z}`;
  }
}
const FACING = { N: "north", S: "south", E: "east", W: "west" };

// Pass 1: solid body, foundation, storeys, roof
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = facade(x, z);
  const ext = f !== null;
  const along = (f === "N" || f === "S") ? x : z;
  const isDoor = `${x},${z}` === doorKey;

  // Floor slabs at storey lines (r0, r5, r10) across the whole footprint
  put(x, gr, z, ext ? "stone_bricks" : "smooth_stone");
  put(x, gr + 5, z, ext ? "light_gray_concrete" : "smooth_stone");
  put(x, gr + 10, z, "smooth_stone");

  if (ext) {
    // Ground storey shopfront r1..r3
    for (let r = 1; r <= 3; r++) {
      if (isDoor && r === 1) {
        put(x, gr + r, z, "oak_door", { facing: FACING[f], half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (isDoor && r === 2) {
        put(x, gr + r, z, "oak_door", { facing: FACING[f], half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (isDoor && r === 3) {
        put(x, gr + r, z, "lantern", { hanging: "true" });
      } else if (along % 3 === 0) {
        put(x, gr + r, z, "polished_andesite");
      } else {
        put(x, gr + r, z, "glass_pane");
      }
    }
    // Spandrel band above shopfront
    put(x, gr + 4, z, "light_gray_concrete");

    // Upper storey windows r6..r8, bands at r9
    for (let r = 6; r <= 8; r++) {
      put(x, gr + r, z, along % 3 === 0 ? "white_concrete" : "glass_pane");
    }
    put(x, gr + 9, z, "light_gray_concrete");

    // Parapet and cap
    put(x, gr + 11, z, "white_concrete");
    put(x, gr + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Penthouse and roof plant on the interior roof
const pcx = Math.round(cx), pcz = Math.round(cz);
for (const [x, z, gr] of cells) {
  if (facade(x, z) !== null) continue;
  if (Math.abs(x - pcx) <= 2 && Math.abs(z - pcz) <= 2) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  } else if ((x * 7 + z * 3) % 11 === 0) {
    put(x, gr + 11, z, "iron_block");
  }
}

// Pass 2: warm lights behind some glass, one cell inside the facade
for (const [x, z, gr] of cells) {
  const f = facade(x, z);
  if (f === null) continue;
  const along = (f === "N" || f === "S") ? x : z;
  if (along % 3 === 0) continue;
  const ix = x - DIRS[f][0], iz = z - DIRS[f][1];
  if (!has(ix, iz) || exposedDirs(ix, iz).length !== 0) continue;
  for (const r of [2, 7]) {
    if ((along * 5 + gr + r) % 4 === 0) put(ix, gr + r, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
