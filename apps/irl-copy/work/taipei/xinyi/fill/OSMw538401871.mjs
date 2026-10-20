import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401871";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 11;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(`${x},${z}`, gr);
const has = (x, z) => groundOf.has(`${x},${z}`);

// Perimeter = any side neighbour missing from the footprint
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
// Wall runs along X when the outward face is north/south
const runsAlongX = (x, z) => !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (x, z) =>
  runsAlongX(x, z)
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pick the entrance: outward north face, median x
const northCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = northCells.length ? northCells[Math.floor(northCells.length / 2)] : -1;
const doorZ = northCells.length ? cells.find(([x, z]) => x === doorX && !has(x, z - 1))[1] : -1;

for (const [x, z, gr] of cells) {
  const p = perim(x, z);
  const bayPier = (x + z) % 3 === 0;
  const isDoor = x === doorX && z === doorZ;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-storey floor slab
  put(x, gr, z, "smooth_stone");

  // Ground storey (gr+1 .. gr+4): shopfront
  if (p) {
    if (isDoor) {
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      put(x, gr + 4, z, "smooth_quartz");
    } else {
      put(x, gr + 1, z, "polished_andesite");
      if (bayPier || (x === 0 || x === W - 1)) {
        put(x, gr + 2, z, "smooth_quartz");
        put(x, gr + 3, z, "smooth_quartz");
      } else {
        put(x, gr + 2, z, "glass");
        put(x, gr + 3, z, "glass");
      }
      put(x, gr + 4, z, "smooth_quartz");
    }
  } else {
    // Interior: floor lamps on the ground floor for warm light behind glass
    if ((x + z) % 4 === 2) put(x, gr + 1, z, "glowstone");
  }

  // Storey line
  put(x, gr + 5, z, "smooth_stone");

  // Upper storey (gr+6 .. gr+9): windows with sill and header
  if (p) {
    put(x, gr + 6, z, "smooth_quartz");
    if (bayPier || x === 0 || x === W - 1) {
      put(x, gr + 7, z, "smooth_quartz");
      put(x, gr + 8, z, "smooth_quartz");
    } else {
      put(x, gr + 7, z, "light_gray_stained_glass_pane", paneProps(x, z));
      put(x, gr + 8, z, "light_gray_stained_glass_pane", paneProps(x, z));
    }
    put(x, gr + 9, z, "smooth_quartz");
    // Cornice and parapet
    put(x, gr + 10, z, "smooth_stone");
    put(x, gr + 11, z, "smooth_quartz");
  } else {
    // Interior upper floor: hanging lanterns under the roof slab
    if ((x + z) % 4 === 0) put(x, gr + 9, z, "lantern", { hanging: "true", waterlogged: "false" });
    // Roof slab over interior
    put(x, gr + 10, z, "smooth_stone");
  }

  // Roof equipment: small plant boxes on the middle of the roof
  const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
  const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);
  if (!p && Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 1 && (x + z) % 2 === 0) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
