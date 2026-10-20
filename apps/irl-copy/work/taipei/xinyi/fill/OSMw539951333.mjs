import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951333";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 16 x 15 footprint, roof about 11 blocks above lowest ground:
// a two-storey, mid-century (1970s-80s) reinforced-concrete commercial block
// with a tiled white facade, a granite base, a shopfront ground floor, a
// light-grey storey line and parapet, and a roof plant enclosure.
const W = 16, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gy] of cells) ground.set(key(x, z), gy);
const inside = (x, z) => ground.has(key(x, z));

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const BASE = "polished_granite";
const GLASS = "light_blue_stained_glass";
const LIT = "glowstone";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";

// Foundation, floor slabs and exterior walls, cell by cell.
for (const [x, z, gy] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, FOUND);

  // Floor slab at the ground floor, the storey-2 floor and the roof slab.
  for (const fy of [gy, gy + 5, gy + 10]) put(x, fy, z, FLOOR);

  // Which sides of this cell face outside the footprint.
  const ext = [];
  if (!inside(x + 1, z)) ext.push("E");
  if (!inside(x - 1, z)) ext.push("W");
  if (!inside(x, z + 1)) ext.push("S");
  if (!inside(x, z - 1)) ext.push("N");
  if (ext.length === 0) continue;

  // Along-face coordinate for window rhythm.
  const onEW = ext.includes("E") || ext.includes("W");
  const coord = onEW ? z : x;
  const pier = ext.length >= 2 || coord % 3 === 0;

  for (let y = gy + 1; y <= gy + 11; y++) {
    let b = WALL;
    if (y === gy + 1) b = BASE;                  // base course
    else if (y === gy + 5 || y === gy + 10) b = BAND; // storey lines
    else if (y === gy + 11) b = BAND;            // parapet cap
    else if (!pier && (y >= gy + 2 && y <= gy + 3)) b = GLASS;          // ground shopfront glass
    else if (!pier && (y >= gy + 6 && y <= gy + 8)) {                   // storey-2 windows
      b = (y === gy + 7 && coord % 4 === 1) ? LIT : GLASS;              // a few warm lit windows
    }
    put(x, y, z, b);
  }
}

// Entrance on the south (+z) street face, at the median x of that face.
const southCells = cells
  .filter(([x, z]) => !inside(x, z + 1))
  .sort((a, b) => a[0] - b[0]);
if (southCells.length > 0) {
  const [dx, dz, dgy] = southCells[Math.floor(southCells.length / 2)];
  // Door: two blocks, opening outward to the south.
  put(dx, dgy + 1, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dgy + 2, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Transom glass above the door and a dark stone lintel band.
  put(dx, dgy + 3, dz, GLASS);
  put(dx, dgy + 4, dz, "stone_bricks");
}

// Roof plant: a 2x2 light-grey plant box, at the interior cell nearest the centroid.
let cx = 0, cz = 0;
for (const [x, z] of cells) { cx += x; cz += z; }
cx /= cells.length; cz /= cells.length;

let best = null;
for (const [x, z, gy] of cells) {
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([ox, oz]) => {
    const px = x + ox, pz = z + oz;
    return inside(px, pz) &&
      inside(px + 1, pz) && inside(px - 1, pz) &&
      inside(px, pz + 1) && inside(px, pz - 1);
  });
  if (!ok) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (!best || d < best.d) best = { x, z, gy, d };
}
if (best) {
  for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    put(best.x + ox, best.gy + 11, best.z + oz, BAND);
    put(best.x + ox, best.gy + 12, best.z + oz, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
