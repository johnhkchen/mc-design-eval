import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 23 x 18 footprint, roof ~11 blocks above lowest ground.
// Read as a 2-storey (5 blocks each) 1960s-70s Taipei commercial block:
// white concrete wall with glass-and-quartz mullions, stone-brick plinth,
// shopfront at street level, flat roof with cornice and parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833590";
const W = 23, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pick the street-side door: southern exposed cells, nearest the middle of their span.
const southCells = cells.filter(([x, z]) => !has(x, z + 1));
let door = null;
if (southCells.length) {
  const xs = southCells.map((c) => c[0]);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const maxZ = Math.max(...southCells.map((c) => c[1]));
  const cand = southCells.filter((c) => c[1] === maxZ);
  cand.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
  door = { x: cand[0][0], z: cand[0][1], gr: cand[0][2] };
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const exN = !has(x, z - 1), exS = !has(x, z + 1);
  const exW = !has(x - 1, z), exE = !has(x + 1, z);
  const perimeter = exN || exS || exW || exE;
  const axis = exN || exS ? "x" : "z"; // which coordinate runs along the exposed wall
  const t = axis === "x" ? x : z;

  if (!perimeter) {
    // Interior: storey slab at gr+5 and roof slab at gr+10, air between.
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    // Roof plant boxes.
    if ((x * 3 + z * 5) % 11 === 0) put(x, gr + 11, z, "light_gray_concrete");
    // Warm light in an upper room, only where the facade window it belongs to is lit.
    continue;
  }

  // Ground storey plinth.
  put(x, gr, z, "polished_andesite");

  const isDoor = door && door.x === x && door.z === z;
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isDoor && y <= gr + 2) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
    } else if (t % 3 === 0) {
      put(x, y, z, "quartz_block");
    } else {
      put(x, y, z, "glass_pane", paneProps(axis));
    }
  }
  if (isDoor) put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  put(x, gr + 4, z, "stone_bricks");

  // Storey line.
  put(x, gr + 5, z, "white_concrete");

  // Upper storey windows with mullions, lintel/sill bands.
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (t % 3 === 0) put(x, y, z, "quartz_block");
    else put(x, y, z, "glass_pane", paneProps(axis));
  }
  put(x, gr + 9, z, "white_concrete");

  // Cornice and parapet.
  put(x, gr + 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  put(x, gr + 11, z, "white_concrete");

  // Warm light behind some upper glass: glowstone in the room just inside.
  if (t % 6 === 1 && !isDoor) {
    let ix = x, iz = z;
    if (exN) iz = z + 1;
    else if (exS) iz = z - 1;
    else if (exW) ix = x + 1;
    else if (exE) ix = x - 1;
    if (has(ix, iz)) {
      const innerPerimeter =
        !has(ix, iz - 1) || !has(ix, iz + 1) || !has(ix - 1, iz) || !has(ix + 1, iz);
      if (!innerPerimeter) put(ix, gr + 7, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
