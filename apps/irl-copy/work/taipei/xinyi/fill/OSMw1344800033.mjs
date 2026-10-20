import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1344800033";
const W = 7, H = 19, D = 8;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const inFp = (x, z) => G.has(key(x, z));

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Exterior faces: a footprint cell is an exterior wall cell where its neighbour is outside the footprint.
function faces(x, z) {
  return {
    n: !inFp(x, z - 1), // front (street side)
    s: !inFp(x, z + 1),
    w: !inFp(x - 1, z),
    e: !inFp(x + 1, z),
  };
}

// Pass 1: foundations, floors, walls, parapet, roof
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");   // foundation
  put(x, gr, z, "light_gray_concrete");                        // ground floor slab

  const f = faces(x, z);
  const onNS = f.n || f.s;
  const onEW = f.w || f.e;
  const isExt = onNS || onEW;

  // Roof slab over every footprint cell (ceiling of the single storey)
  put(x, gr + 5, z, "smooth_stone");

  if (!isExt) continue;

  // Cornice course on the exterior edge
  put(x, gr + 5, z, "stone_bricks");
  // Parapet
  put(x, gr + 6, z, onNS && onEW ? "stone_bricks" : "white_concrete");

  // Base course (plinth) on all exterior walls
  put(x, gr + 1, z, "polished_andesite");

  // Pier or window decision
  let pier;
  let idx = 0;
  if (onNS && !onEW) {
    idx = x;
    pier = idx % 2 === 0;
  } else if (onEW && !onNS) {
    idx = z;
    pier = idx % 2 === 0;
  } else {
    pier = true; // corners
  }

  const isFront = f.n && !onEW;
  const isDoor = isFront && x === 3;

  if (isDoor) {
    // Entrance: oak door, transom glass, lintel
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "glass");
    put(x, gr + 4, z, "white_concrete");
  } else if (pier) {
    put(x, gr + 2, z, "white_concrete");
    put(x, gr + 3, z, "white_concrete");
    put(x, gr + 4, z, "white_concrete");
  } else {
    // Window with glass, lintel above
    put(x, gr + 2, z, "glass");
    put(x, gr + 3, z, "glass");
    put(x, gr + 4, z, "white_concrete");
  }
}

// Pass 2: warm lights behind some window glass, lantern inside the entrance, roof unit
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const onNS = f.n || f.s;
  const onEW = f.w || f.e;
  if (!(onNS || onEW) || (onNS && onEW)) continue;

  let idx, pier;
  if (onNS) { idx = x; pier = idx % 2 === 0; }
  else { idx = z; pier = idx % 2 === 0; }
  if (pier || (f.n && x === 3)) continue;

  if (idx % 4 === 1) {
    let ix = x, iz = z;
    if (f.n) iz = z + 1;
    else if (f.s) iz = z - 1;
    else if (f.w) ix = x + 1;
    else if (f.e) ix = x - 1;
    if (inFp(ix, iz)) {
      const ff = faces(ix, iz);
      if (!(ff.n || ff.s || ff.w || ff.e)) {
        put(ix, gr + 2, iz, "shroomlight");
      }
    }
  }
}

// Lantern just inside the entrance
{
  const doorGround = G.get(key(3, 0));
  if (doorGround !== undefined && inFp(3, 1)) {
    put(3, doorGround + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Small roof plant box on the terrace, if the 2x2 block is inside the footprint
{
  const base = G.get(key(2, 3));
  const cluster = [[2, 3], [3, 3], [2, 4], [3, 4]];
  if (base !== undefined && cluster.every(([x, z]) => G.get(key(x, z)) === base)) {
    for (const [x, z] of cluster) put(x, base + 6, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
