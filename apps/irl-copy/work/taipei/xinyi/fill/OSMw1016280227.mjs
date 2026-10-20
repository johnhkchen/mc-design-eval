import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280227";
const W = 11, H = 23, D = 21;

// Two-storey 1980s-90s Xinyi shophouse-style commercial block: ground-floor shopfront,
// upper storey with glass bands and light piers, stone parapet, rooftop plant.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.round(gy));

const g = new Voxels([W, H, D]);

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const faces = (x, z) => ({
  n: !has(x, z - 1), // z-min face
  s: !has(x, z + 1), // z-max face
  w: !has(x - 1, z), // x-min face
  e: !has(x + 1, z), // x-max face
});
const isEdge = (x, z) => {
  const f = faces(x, z);
  return f.n || f.s || f.w || f.e;
};

const doorLower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const doorUpper = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab at the second-storey level (also the storey line on the walls).
  put(x, gr + 5, z, "smooth_stone");

  const f = faces(x, z);
  const ns = f.n || f.s;
  const we = f.w || f.e;

  // Interior cell: roof deck, optional rooftop plant.
  if (!(ns || we)) {
    put(x, gr + 10, z, "gray_concrete");
    if (z === 10 && (x === 4 || x === 5)) put(x, gr + 11, z, "iron_block");
    continue;
  }

  // Perimeter: stone parapet caps the wall.
  put(x, gr + 10, z, "stone_brick_wall");

  // Corner piers run the full height.
  if (ns && we) {
    put(x, gr, z, "stone_bricks");
    for (let y = gr + 1; y <= gr + 9; y++) put(x, y, z, "light_gray_concrete");
    continue;
  }

  // Ordinary wall cell.
  const onZFace = ns;               // wall runs along x
  const idx = onZFace ? x : z;      // position along the facade
  const pier = idx % 3 === 0;
  const isDoor = f.n && x === 5;    // entrance on the z-min (north) frontage

  put(x, gr, z, "stone_bricks"); // base course

  // Ground-floor shopfront.
  if (isDoor) {
    put(x, gr, z, "dark_oak_door", doorLower);
    put(x, gr + 1, z, "dark_oak_door", doorUpper);
    put(x, gr + 2, z, "glass_pane");
    put(x, gr + 3, z, "glass_pane");
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) {
      put(x, y, z, pier ? "light_gray_concrete" : "glass_pane");
    }
  }
  put(x, gr + 4, z, "red_terracotta"); // shop fascia

  // Upper storey glass bands with sill and lintel.
  for (let y = gr + 6; y <= gr + 8; y++) {
    put(x, y, z, pier ? "light_gray_concrete" : "glass_pane");
  }
  put(x, gr + 9, z, "white_concrete"); // lintel band

  // Warm light behind some glass: glowstone on the interior side.
  let dx = 0, dz = 0;
  if (f.n) dz = 1;
  else if (f.s) dz = -1;
  else if (f.w) dx = 1;
  else if (f.e) dx = -1;

  if (!pier && !isDoor && idx % 6 === 2) {
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !isEdge(ix, iz)) put(ix, gr + 7, iz, "glowstone");
  }
  if (!pier && !isDoor && idx % 6 === 4) {
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !isEdge(ix, iz)) put(ix, gr + 2, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
