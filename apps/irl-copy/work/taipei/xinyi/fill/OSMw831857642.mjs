import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unknown record: read as a two-storey mid-century commercial block in Xinyi.
// Stone base, shopfront with glass and white-concrete piers, one storey line,
// a window band with white-concrete piers, a red-brick cornice and parapet,
// and a flat roof with rooftop AC plant.
// Storey height is 5 blocks; roof is at ground + 11 (the lidar figure).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857642";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 13, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const perimeter = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Main massing, column by column.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const perim = perimeter(x, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course / floor slab at ground.
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  // Ground-floor shopfront: glass with white-concrete piers; air behind.
  if (perim) {
    for (let y = gr + 1; y <= gr + 3; y++) {
      put(x, y, z, (x + z) % 4 === 0 ? "white_concrete" : "glass");
    }
    put(x, gr + 4, z, "smooth_stone"); // shopfront lintel band
  }

  // Storey floor slab between the two storeys.
  put(x, gr + 5, z, "smooth_stone");

  // Upper storey: window band with piers, some panes lit from behind.
  if (perim) {
    for (let y = gr + 6; y <= gr + 8; y++) {
      if ((x + z) % 3 !== 0) {
        put(x, y, z, (x * 5 + z * 7 + y) % 7 === 0 ? "glowstone" : "glass_pane");
      } else {
        put(x, y, z, "white_concrete");
      }
    }
    put(x, gr + 9, z, "bricks"); // cornice course
  }

  // Roof slab, parapet, and rooftop plant.
  put(x, gr + 10, z, "light_gray_concrete");
  if (perim) put(x, gr + 11, z, "bricks");
  else if ((x * 5 + z * 3) % 11 === 0) put(x, gr + 11, z, "iron_block");
}

// Entrance: on the north (min z) exposed face, middle of the run of that row.
let doorX = null, doorZ = null;
{
  const candidates = [];
  for (const [key, gr] of ground) {
    const [x, z] = key.split(",").map(Number);
    if (!has(x, z - 1)) candidates.push([x, z]);
  }
  if (candidates.length) {
    const minZ = Math.min(...candidates.map(c => c[1]));
    const row = candidates.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
    doorX = row[Math.floor(row.length / 2)];
    doorZ = minZ;
  }
}
if (doorX !== null) {
  const gr = ground.get(`${doorX},${doorZ}`);
  const hinge = "left";
  put(doorX, gr + 1, doorZ, "iron_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(doorX, gr + 2, doorZ, "iron_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
