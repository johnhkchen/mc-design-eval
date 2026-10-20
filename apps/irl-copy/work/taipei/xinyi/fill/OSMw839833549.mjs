import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833549";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 24 x 23, y 0..22. Roof about 11 blocks above lowest ground.
// Reading: a two-storey, early-1990s-style concrete commercial block with
// a shopfront ground floor, banded upper storey, cornice, parapet and
// rooftop plant. Off-white and light grey concrete, stone base, glass panes.
const W = 24, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const inside = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) =>
  !inside(x + 1, z) || !inside(x - 1, z) || !inside(x, z + 1) || !inside(x, z - 1);

function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Pane connection props: connect to neighbouring footprint walls on the same ring.
function paneProps(x, z) {
  const c = (nx, nz) => (inside(nx, nz) && isEdge(nx, nz) ? "true" : "false");
  return {
    north: c(x, z - 1),
    south: c(x, z + 1),
    east: c(x + 1, z),
    west: c(x - 1, z),
    waterlogged: "false",
  };
}

// Pick the entrance: edge cell on the minimum-z (north) side, nearest the middle of x.
const edgeCells = cells.filter(([x, z]) => isEdge(x, z));
let doorCell = null;
if (edgeCells.length) {
  const minZ = Math.min(...edgeCells.map(([, z]) => z));
  const northRow = edgeCells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
  const midX = northRow[Math.floor(northRow.length / 2)];
  doorCell = [midX, minZ];
}

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const pier = (x + z) % 3 === 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab of storey 2 and roof slab (solid across the whole footprint).
  put(x, gr + 6, z, "light_gray_concrete");
  put(x, gr + 11, z, "smooth_stone");

  if (edge) {
    // Base course.
    put(x, gr + 1, z, "stone_bricks");

    // Ground floor shopfront: glass with white piers.
    for (let y = gr + 2; y <= gr + 4; y++) {
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
    }
    // Storey line over shopfront.
    put(x, gr + 5, z, "light_gray_concrete");

    // Upper storey windows with warm lights in some panes.
    for (let y = gr + 7; y <= gr + 9; y++) {
      if (pier) {
        put(x, y, z, "white_concrete");
      } else if (y === gr + 8 && (x * 5 + z * 3 + gr) % 9 === 0) {
        put(x, y, z, "glowstone");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
      }
    }

    // Cornice and parapet.
    put(x, gr + 10, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
    put(x, gr + 12, z, "white_concrete");
  } else {
    // Interior: air, with rooftop plant on the roof surface.
    if (x % 7 === 3 && z % 5 === 2) put(x, gr + 12, z, "iron_block");
  }
}

// Entrance door and its lit lantern above.
if (doorCell) {
  const [dx, dz] = doorCell;
  const gr = ground.get(key(dx, dz));
  put(dx, gr + 2, dz, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr + 3, dz, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Warm light beside the door.
  const side = inside(dx + 1, dz) ? dx + 1 : dx - 1;
  if (inside(side, dz)) put(side, gr + 2, dz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
