import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1980s-90s: two storeys of white tiled concrete over a
// shopfront ground floor, with a light-grey cornice, a parapet, and roof plant. Roof sits
// 11 blocks above the lowest ground, with five-block storeys.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542017374";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Classify every footprint cell: which sides are open to the outside.
const info = [];
for (const [x, z, gr] of cells) {
  const n = !has(x, z - 1);
  const s = !has(x, z + 1);
  const w = !has(x - 1, z);
  const e = !has(x + 1, z);
  info.push({ x, z, gr, n, s, w, e, edge: n || s || w || e, corner: (n || s) && (w || e) });
}

// Entrance: a south-facing edge cell nearest the middle of the width.
let entrance = null;
for (const c of info) {
  if (!c.s) continue;
  if (!entrance || Math.abs(c.x - W / 2) < Math.abs(entrance.x - W / 2)) entrance = c;
}
if (!entrance) {
  for (const c of info) if (c.edge && (!entrance || Math.abs(c.x - W / 2) < Math.abs(entrance.x - W / 2))) entrance = c;
}

// Pass 1: foundation, floors, walls, cornice, parapet, roof plant.
for (const c of info) {
  const { x, z, gr } = c;

  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-floor slab, then floor slabs at storey lines and roof deck.
  put(x, gr, z, "light_gray_concrete");
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "light_gray_concrete");

  if (!c.edge) {
    // Interior: floor slabs only, air between, roof plant on a grid.
    if ((x + z) % 5 === 0 && gr + 12 < H) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }
    continue;
  }

  // Exterior facade.
  const along = (c.n || c.s) ? x : z;
  const isPier = c.corner || along % 3 === 0;

  for (let dy = 1; dy <= 4; dy++) {
    const y = gr + dy;
    let id;
    if (isPier) id = "white_concrete";
    else if (dy === 1) id = "light_gray_concrete";      // plinth
    else if (dy === 4) id = "white_concrete";           // lintel
    else id = "light_blue_stained_glass";               // shopfront glass
    put(x, y, z, id);
  }

  for (let dy = 6; dy <= 9; dy++) {
    const y = gr + dy;
    let id;
    if (isPier) id = "white_concrete";
    else if (dy === 6 || dy === 9) id = "light_gray_concrete"; // sill and head
    else id = "light_blue_stained_glass_pane";                  // upper windows
    put(x, y, z, id);
  }

  // Cornice and parapet.
  put(x, gr + 10, z, "light_gray_concrete");
  put(x, gr + 11, z, "white_concrete");
}

// Pass 2: entrance, transom and canopy line, applied on the chosen south cell.
if (entrance) {
  const { x, z, gr } = entrance;
  put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  put(x, gr + 4, z, "white_concrete");
  // Flank the door with the shopfront glass one cell over where possible.
  for (const dx of [-1, 1]) {
    const nb = info.find((c) => c.x === x + dx && c.z === z);
    if (nb) put(nb.x, nb.gr + 1, nb.z, "light_gray_concrete");
  }
}

// Pass 3: warm lights behind upper-floor panes. Set after the interiors are cleared.
for (const c of info) {
  if (!c.edge || c.corner) continue;
  const along = (c.n || c.s) ? c.x : c.z;
  if (along % 3 === 0 || along % 4 !== 1) continue;
  let ix = c.x, iz = c.z;
  if (c.n) iz += 1;
  else if (c.s) iz -= 1;
  else if (c.w) ix += 1;
  else if (c.e) ix -= 1;
  if (!has(ix, iz)) continue;
  put(ix, c.gr + 7, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
