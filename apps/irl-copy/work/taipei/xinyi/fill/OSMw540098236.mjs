import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540098236.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540098236.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 8, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const map = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => map.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const isPerimeter = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: on the minimum-z street face, centred on that row's x-span.
const minZ = Math.min(...cells.map(([, z]) => z));
const rowX = cells.filter(([, z]) => z === minZ).map(([x]) => x);
const midX = rowX.length ? (Math.min(...rowX) + Math.max(...rowX)) / 2 : 0;
let entrance = null;
for (const [x, z] of cells) {
  if (z !== minZ) continue;
  if (!entrance || Math.abs(x - midX) < Math.abs(entrance.x - midX)) entrance = { x, z };
}

// Light positions: interior cells on the upper storey, sparse grid.
const isLight = (x, z) => x % 4 === 2 && z % 5 === 2;

for (const [x, z, gr] of cells) {
  const per = isPerimeter(x, z);
  const p = (x + z) % 3; // mullion rhythm along walls
  const isEntrance = entrance && entrance.x === x && entrance.z === z;

  // Foundation and ground-floor plinth top
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  put(x, gr, z, "stone_bricks");

  // Ground storey (shopfront)
  if (per) {
    put(x, gr + 1, z, "polished_granite");
    if (isEntrance) {
      const facing = "south";
      put(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else {
      put(x, gr + 2, z, p === 0 ? "light_gray_concrete" : "light_blue_stained_glass");
      put(x, gr + 3, z, p === 0 ? "light_gray_concrete" : "light_blue_stained_glass");
    }
    put(x, gr + 4, z, "light_gray_concrete");
  }

  // Floor slab between storeys
  put(x, gr + 5, z, "smooth_quartz");

  // Upper storey
  if (per) {
    put(x, gr + 6, z, "white_concrete");
    const win = p !== 0;
    put(x, gr + 7, z, win ? "light_blue_stained_glass" : "white_concrete");
    put(x, gr + 8, z, win ? "light_blue_stained_glass" : "white_concrete");
    put(x, gr + 9, z, "white_concrete");
  } else if (isLight(x, z)) {
    put(x, gr + 7, z, "glowstone");
  }

  // Roof slab and cornice
  put(x, gr + 10, z, per ? "smooth_quartz" : "light_gray_concrete");

  // Parapet and roof equipment
  if (per) {
    put(x, gr + 11, z, p === 1 ? "smooth_stone" : "smooth_quartz");
  } else if (x % 3 === 1 && z % 3 === 1) {
    put(x, gr + 11, z, "iron_block");
  }
}

g.save(OUT);
