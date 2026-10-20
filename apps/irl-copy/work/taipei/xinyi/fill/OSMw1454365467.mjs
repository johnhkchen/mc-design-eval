import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1454365467";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 4;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.min(H - 2, gr)));

const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const FW = maxX - minX + 1;

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS = "light_blue_stained_glass";
const PIER = "white_concrete";
const SPANDREL = "light_gray_concrete";
const STOREY_LINE = "smooth_quartz";
const CORNICE = "quartz_block";
const PARAPET = "smooth_quartz_slab";
const BASE = "stone_bricks";
const DECK = "light_gray_concrete";

// Shell facade: base course, ground-floor glass/shopfront, storey line at 4,
// upper windows 6..8 with spandrels at 5 and 9, cornice at 10, parapet to T.
function shellBlock(x, y, z, G, T) {
  const front = z === minZ, back = z === maxZ;
  const isCorner = (x === minX || x === maxX) && (z === minZ || z === maxZ);
  let pier;
  let offset = 0;
  if (front || back) {
    offset = x - minX;
    pier = isCorner || offset % 4 === 0 || offset === FW - 1;
  } else {
    pier = isCorner;
  }

  // Base course at the ground line
  if (y === G) return put(x, y, z, BASE);

  // Parapet cap
  if (y === T) return put(x, y, z, PARAPET, { type: "bottom", waterlogged: "false" });

  // Solid parapet/upper wall above cornice
  if (y >= 11) return put(x, y, z, PIER);

  if (y === 10) return put(x, y, z, CORNICE);
  if (y === 9 || y === 5) return put(x, y, z, SPANDREL);
  if (y === 4) return put(x, y, z, STOREY_LINE);

  // Shopfront door on the street (front) face
  if (front && offset === Math.floor(FW / 2) && y >= G + 1 && y <= G + 2) {
    const half = y === G + 1 ? "lower" : "upper";
    return put(x, y, z, "dark_oak_door", {
      facing: "north", half, hinge: "left", open: "false", powered: "false",
    });
  }

  if (pier) return put(x, y, z, PIER);
  return put(x, y, z, GLASS);
}

for (const [x, z, G] of cells) {
  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, BASE);

  const shell = x === minX || x === maxX || z === minZ || z === maxZ;
  const T = Math.max(11, G + 1); // roof/parapet top for this cell

  if (shell) {
    for (let y = G; y <= T; y++) shellBlock(x, y, z, G, T);
  } else {
    // Interior: air gap, one floor slab per storey, roof deck on top
    if (G <= 5) put(x, 5, z, DECK);
    put(x, T, z, DECK);
  }
}

// Warm lights behind some front/back windows (interior row next to the facade)
for (const [x, z, G] of cells) {
  const front = z === minZ, back = z === maxZ;
  if (!(front || back)) continue;
  const isCorner = (x === minX || x === maxX);
  if (isCorner) continue;
  const offset = x - minX;
  const iz = front ? minZ + 1 : maxZ - 1;
  if (iz === z) continue;
  if (offset % 4 === 0 || offset === FW - 1 || offset === Math.floor(FW / 2)) continue;

  // Upper storey: shroomlight behind some windows
  if (offset % 3 === 1) put(x, 7, iz, "shroomlight");
  // Ground floor: glowstone behind a few shop windows
  if (offset % 5 === 2 && G + 2 <= 3) put(x, G + 2, iz, "glowstone");
}

// Roof equipment: two AC plant boxes and a lantern on the front corner
const roofT = Math.max(11, ...cells.map(([, , G]) => G + 1));
put(4, roofT + 1, 1, SPANDREL);
put(4, roofT + 2, 1, SPANDREL);
put(4, roofT + 1, 2, SPANDREL);
put(4, roofT + 2, 2, SPANDREL);
put(10, roofT + 1, 1, "smooth_stone");
put(10, roofT + 2, 1, "smooth_stone");
put(minX, roofT + 1, minZ, "lantern", { hanging: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
