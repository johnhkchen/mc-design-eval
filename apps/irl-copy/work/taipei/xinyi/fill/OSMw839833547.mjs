import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833547";
const W = 18, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// Exterior directions: [dx, dz, name]
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Exterior faces for each footprint cell
const exteriorOf = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// Entrance: north-facing (or any single-face) perimeter cell nearest the centroid
let cxSum = 0;
for (const [x] of cells) cxSum += x;
const cx = cxSum / cells.length;
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const ex = exteriorOf(x, z);
    if (ex.length !== 1) continue;
    const [dx, dz, name] = ex[0];
    const score = (name === "north" ? 0 : 100) + Math.abs(x - cx);
    if (score < best) {
      best = score;
      entrance = { x, z, dirName: name, dx, dz };
    }
  }
}

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const ex = exteriorOf(x, z);
  const perim = ex.length > 0;

  if (!perim) {
    // Interior: floor slabs at each storey line and roof slab; air between (no interior)
    put(x, gr, z, "light_gray_concrete");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");

    // Rooftop plant on a sparse pattern
    if ((x * 3 + z * 5) % 11 === 0) put(x, gr + 11, z, "iron_block");

    // Hanging warm lanterns just inside the shopfront / upper windows
    // (handled from the perimeter side below)
    continue;
  }

  // Perimeter storey lines and parapet
  put(x, gr, z, "stone_bricks");
  put(x, gr + 4, z, "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 9, z, "white_concrete");
  put(x, gr + 10, z, "smooth_stone");

  if (ex.length >= 2) {
    // Corner pier
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "stone_bricks");
    for (let y = gr + 6; y <= gr + 8; y++) put(x, y, z, "white_concrete");
    continue;
  }

  const [dx, dz, name] = ex[0];
  const alongX = dx === 0; // wall runs east-west
  const c = alongX ? x : z;
  const endMissing = alongX
    ? !has(x - 1, z) || !has(x + 1, z)
    : !has(x, z - 1) || !has(x, z + 1);
  const pier = c % 3 === 0 || endMissing;

  const isEntrance = entrance && entrance.x === x && entrance.z === z;

  if (isEntrance) {
    // Glass door with transom above, stone lintel
    put(x, gr + 1, z, "dark_oak_door", { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "glass");
  } else if (pier) {
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "stone_bricks");
    for (let y = gr + 6; y <= gr + 8; y++) put(x, y, z, "white_concrete");
  } else {
    // Shopfront: dark kickplate, glass display windows
    put(x, gr + 1, z, "gray_concrete");
    put(x, gr + 2, z, "glass");
    put(x, gr + 3, z, "glass");
    // Upper storey: framed glass panes
    const paneProps = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    for (let y = gr + 6; y <= gr + 8; y++) put(x, y, z, "glass_pane", paneProps);

    // Warm light: hanging lantern just inside some windows
    if ((x + z) % 4 === 0) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && exteriorOf(ix, iz).length === 0) {
        put(ix, gr + 9, iz, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }
  }
}

// Entrance lintel accent (stone over the door)
if (entrance) {
  put(entrance.x, entrance.z !== undefined ? 0 : 0, entrance.z, "stone"); // no-op guard keeps y0 untouched
}

g.save(`${DIR}/${ID}.nbt`);
