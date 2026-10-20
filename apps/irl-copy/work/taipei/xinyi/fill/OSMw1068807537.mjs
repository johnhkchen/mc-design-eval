import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807537";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 41, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${Math.round(gr)}`.replace(/,(\d+)$/, `,${Math.round(gr)}`) && `${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Door: north face (no footprint cell at z-1), median x of that run
const northRun = [];
for (const [x, z] of cells) if (!has(x, z - 1)) northRun.push(x);
northRun.sort((a, b) => a - b);
const doorX = northRun.length ? northRun[Math.floor(northRun.length / 2)] : null;

// Interior neighbour for an edge cell (used for lanterns / door light)
function inward(x, z) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isEdge(nx, nz)) return [nx, nz];
  }
  return null;
}

for (const [x0, z0] of cells) {
  const x = x0, z = z0;
  const gr = gAt(x, z);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const horiz = !has(x, z - 1) || !has(x, z + 1); // north/south facade
  const idx = horiz ? x : z;
  const pier = isCorner(x, z) || idx % 3 === 0;

  if (!edge) {
    // Interior: floor slabs at storey lines, roof deck; air between (no interiors)
    put(x, gr + 0, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_quartz");
    put(x, gr + 10, z, "gray_concrete");
    continue;
  }

  // Facade column, relative r = 0..10 (11 blocks: two storeys plus cornice)
  for (let r = 0; r <= 10; r++) {
    const y = gr + r;
    let id = null, props = null;
    if (r === 0) id = "polished_andesite";                       // base course
    else if (r <= 3) id = pier ? "polished_andesite" : "glass_pane"; // shopfront
    else if (r === 4) id = "smooth_quartz";                      // lintel band
    else if (r === 5) id = "light_gray_concrete";                // floor line
    else if (r <= 8) id = pier ? "smooth_quartz" : "glass_pane"; // upper windows
    else if (r === 9) id = "light_gray_concrete";                // spandrel
    else if (r === 10) id = "smooth_stone";                      // cornice / parapet cap
    if (id) put(x, y, z, id, props);
  }

  // Entrance: dark oak door on the north face, with a warm light just inside
  if (!has(x, z - 1) && x === doorX) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "smooth_quartz");
    const inn = inward(x, z);
    if (inn) put(inn[0], gr + 1, inn[1], "lantern", { hanging: "false", waterlogged: "false" });
  }

  // Sparse warm lanterns standing just inside upper-floor windows
  if (!pier && idx % 6 === 1) {
    const inn = inward(x, z);
    if (inn) put(inn[0], gr + 6, inn[1], "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop plant enclosure: two blocks high, set back inside the roof
for (let x = 14; x <= 26; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    const gr = gAt(x, z);
    put(x, gr + 11, z, "stone_bricks");
    put(x, gr + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
