import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280226";
const W = 23, H = 33, D = 21;
const STOREY = 5, STOREYS = 4;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(key(x, z), gr);
const minG = Math.min(...groundAt.values());
const inside = (x, z) => groundAt.has(key(x, z));
const baseOf = (x, z) => groundAt.get(key(x, z)) - minG;

// perimeter = footprint cell with a missing 4-neighbour
const isPerim = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Entrance: south-facing perimeter cell nearest the middle of the front
let door = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!isPerim(x, z) || inside(x, z + 1)) continue;
    const d = Math.abs(x - W / 2);
    if (d < best) { best = d; door = [x, z]; }
  }
  if (!door) for (const [x, z] of cells) if (isPerim(x, z)) { door = [x, z]; break; }
}

for (const [x, z] of cells) {
  const b = baseOf(x, z);
  const perim = isPerim(x, z);
  const t = x + z;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // floor slabs, one per storey, and roof deck
  for (let s = 0; s <= STOREYS; s++) put(x, b + s * STOREY, z, "smooth_stone");

  if (perim) {
    // base plinth at ground storey
    put(x, b + 1, z, "polished_granite");

    for (let s = 0; s < STOREYS; s++) {
      const yb = b + s * STOREY;
      const pier = t % 3 === 0;
      for (let dy = 1; dy <= 3; dy++) {
        const y = yb + dy;
        if (pier) put(x, y, z, "white_concrete");
        else if (s === 0) put(x, y, z, "tinted_glass");
        else put(x, y, z, "light_blue_stained_glass");
      }
      // spandrel / lintel band
      put(x, yb + 4, z, s === 0 ? "smooth_quartz" : "light_gray_concrete");
    }

    // entrance: double-height door in the ground storey, lantern above
    if (door && x === door[0] && z === door[1]) {
      const yb = b;
      put(x, yb + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, yb + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, yb + 3, z, "lantern");
    }

    // cornice, parapet and coping
    put(x, b + 20, z, "smooth_quartz");
    put(x, b + 21, z, "white_concrete");
    put(x, b + 22, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

    // warm light behind glass: glowstone on the inside neighbour
    for (let s = 1; s < STOREYS; s++) {
      const yb = b + s * STOREY;
      if (t % 5 !== 1) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (inside(nx, nz) && !isPerim(nx, nz)) {
          put(nx, yb + 2, nz, "glowstone");
          break;
        }
      }
    }
  } else {
    // interior of the roof: deck and a few HVAC units
    put(x, b + 20, z, "light_gray_concrete");
    if (x % 6 === 3 && z % 6 === 3) {
      put(x, b + 21, z, "iron_block");
      put(x, b + 22, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
