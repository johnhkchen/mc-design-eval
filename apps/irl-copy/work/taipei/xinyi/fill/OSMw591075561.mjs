import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075561";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey commercial block with shopfront, white-tile upper floors,
// stone base, cornice and parapet. Roof top block at y=12 (13 blocks tall).
const W = 12, H = 25, D = 6, ROOF = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const WALL = "white_concrete";
const TRIM = "light_gray_concrete";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const GLASS = "glass";
const CAP = "stone_brick_slab";
const SLAB_TOP = { type: "top", waterlogged: "false" };

// Facade pattern along the 12-block length: piers at x%3==0 and at the last column.
const isPier = (x) => x % 3 === 0 || x === W - 1;
const isWinRow = (y) => (y >= 1 && y <= 3) || (y >= 6 && y <= 8);

function facadeSpec(x, y) {
  if (isPier(x)) return WALL;
  if (y === 4 || y === 9) return TRIM;
  if (isWinRow(y)) return GLASS;
  return null;
}

function endSpec(z, y) {
  if ((z === 2 || z === 3) && isWinRow(y)) return GLASS;
  if (y === 4 || y === 9) return TRIM;
  return WALL;
}

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  const perim =
    !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const face =
    z === 0 ? "front" :
    z === D - 1 ? "back" :
    (x === 0 || x === W - 1) ? "end" : "none";

  for (let y = 0; y <= ROOF; y++) {
    // Foundation below ground.
    if (y < gr) { put(x, y, z, BASE); continue; }

    // Floor / base course at ground level.
    if (y === gr) { put(x, y, z, perim ? BASE : FLOOR); continue; }

    // Roof cap and parapet top.
    if (y === ROOF) { put(x, y, z, perim ? CAP : TRIM, perim ? SLAB_TOP : undefined); continue; }

    // Floor slabs between storeys (also the cornice band at y=10).
    if (y === 5 || y === 10) { put(x, y, z, TRIM); continue; }

    if (!perim) continue; // interior air behind glass

    // Parapet course.
    if (y === 11) { put(x, y, z, WALL); continue; }

    let spec = null;
    if (face === "front" || face === "back") spec = facadeSpec(x, y);
    else if (face === "end") spec = endSpec(z, y);
    else spec = WALL;

    if (spec) put(x, y, z, spec);
  }
}

// Entrance on the front (z=0) face at x=5: double-height transom with lantern.
if (has(5, 0) && gAt(5, 0) <= 1) {
  put(5, 1, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(5, 2, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(5, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm light behind some windows (interior air row at z=1 front, z=4 back).
const lights = [
  [2, 2, 1, 0], [4, 7, 1, 0], [8, 7, 4, 0], [10, 2, 4, 0],
];
for (const [x, y, z] of lights) {
  if (has(x, z === 1 ? 1 : 4) && gAt(x, z) < y) put(x, y, z, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
