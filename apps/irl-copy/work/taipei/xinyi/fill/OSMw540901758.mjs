import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540901758";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 18 x 13. Two-storey commercial block (a Xinyi-era shophouse/office in
// cast-in-place concrete, stone base, tinted glazing) with a parapet. Roof ~11 above lowest ground.
const W = 18, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const at = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward directions
const DIRS = [
  { dx: 0, dz: -1, name: "north", axis: "x" },
  { dx: 0, dz: 1, name: "south", axis: "x" },
  { dx: -1, dz: 0, name: "west", axis: "z" },
  { dx: 1, dz: 0, name: "east", axis: "z" },
];

// Exposed faces per cell
const exposed = new Map(); // "x,z" -> dir list
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const list = DIRS.filter(d => !has(x + d.dx, z + d.dz));
  if (list.length) exposed.set(`${x},${z}`, list);
}

// Street (front) facade = the side with the most exposed cells
const counts = {};
for (const list of exposed.values()) for (const d of list) counts[d.name] = (counts[d.name] || 0) + 1;
const frontName = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
const front = DIRS.find(d => d.name === frontName);

// Entrance: middle cell of the front facade
const frontCells = [...exposed.entries()]
  .filter(([, list]) => list.some(d => d.name === frontName))
  .map(([k]) => k.split(",").map(Number))
  .sort((a, b) => (front.axis === "x" ? a[0] - b[0] : a[1] - b[1]));
const doorCell = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

// Primary facing direction and along-axis index for each exposed cell
function primaryDir(key) {
  const list = exposed.get(key);
  if (!list) return null;
  return list.find(d => d.name === frontName) || list[0];
}

const isExposed = (x, z) => exposed.has(`${x},${z}`);

// ---- 1. Foundation and floor slabs for every footprint cell ----
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");                  // ground floor slab
  put(x, gr + 5, z, "light_gray_concrete");       // floor 2 slab
  put(x, gr + 10, z, "gray_concrete");            // roof deck
}

// ---- 2. Facades on exposed cells ----
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const d = primaryDir(`${x},${z}`);
  if (!d) continue;
  const along = d.axis === "x" ? x : z;
  const pier = along % 3 === 0;
  const isDoor = `${x},${z}` === doorKey;

  // Ground floor shopfront band (gr+1 .. gr+3)
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isDoor && y <= gr + 2) continue; // door placed below
    if (isDoor && y === gr + 3) { put(x, y, z, "stone_bricks"); continue; }
    put(x, y, z, pier ? "stone_bricks" : "gray_stained_glass_pane");
  }
  if (isDoor) {
    put(x, gr + 1, z, "dark_oak_door", { facing: d.name, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: d.name, half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Fascia / storey line above shopfront
  put(x, gr + 4, z, pier ? "white_concrete" : "smooth_stone");

  // Floor 2 window band (gr+6 .. gr+9)
  for (let y = gr + 6; y <= gr + 9; y++) {
    put(x, y, z, pier ? "white_concrete" : "gray_stained_glass_pane");
  }

  // Spandrel at the floor-2 slab line
  put(x, gr + 5, z, "white_concrete");

  // Parapet with cornice cap
  put(x, gr + 10, z, "stone_bricks");
  put(x, gr + 11, z, "stone_brick_wall");
}

// ---- 3. Warm lights behind glass (interior cells beside the facade) ----
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (isExposed(x, z)) continue;
  // Floor 2 lamps
  if ((x + 2 * z) % 4 === 1) put(x, gr + 7, z, "glowstone");
  // Ground floor glow behind a few shopfront windows
  if ((x * 3 + z) % 7 === 2) put(x, gr + 2, z, "shroomlight");
}
if (doorCell) {
  const [dx, dz] = doorCell;
  const gr = Math.round(at(dx, dz));
  // Lamp just inside the entrance
  put(dx - front.dx, gr + 2, dz - front.dz, "glowstone");
}

// ---- 4. Roof equipment and a small rooftop plant ----
const interior = cells.filter(([x, z]) => !isExposed(x, z));
if (interior.length) {
  const sorted = interior.slice().sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  // AC plant: a 2x2 concrete block near the centre of the roof
  const mid = sorted[Math.floor(sorted.length / 2)];
  for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const k = `${mid[0] + ox},${mid[1] + oz}`;
    if (!has(mid[0] + ox, mid[1] + oz) || isExposed(mid[0] + ox, mid[1] + oz)) continue;
    const gr = Math.round(at(mid[0] + ox, mid[1] + oz));
    put(mid[0] + ox, gr + 11, mid[1] + oz, "light_gray_concrete");
    put(mid[0] + ox, gr + 12, mid[1] + oz, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
