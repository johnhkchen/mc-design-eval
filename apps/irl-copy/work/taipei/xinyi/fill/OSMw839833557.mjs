import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block (c. 1980s-90s Taipei): white tiled
// facade, light grey concrete piers and frames, a shopfront ground floor,
// a stone cornice and a parapet. Roof at about 11 blocks above lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833557";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => G.has(`${x},${z}`);
const groundOf = (x, z) => G.get(`${x},${z}`);

const DIRS = {
  north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// outward faces of a footprint cell (faces whose neighbour is outside the footprint)
function facesOf(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) out.push(name);
  }
  return out;
}
const isPerim = (x, z) => facesOf(x, z).length > 0;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const paneProps = (ax) =>
  ax === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// centre-most north-facing entrance cell
const minZ = Math.min(...cells.map((c) => c[1]));
const maxX = Math.max(...cells.map((c) => c[0]));
const midX = maxX / 2;
let doorCell = null;
for (const [x, z] of G.keys().__proto__ ? [] : []) {} // placeholder for lint-safe iteration below
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (z !== minZ || !facesOf(x, z).includes("north")) continue;
  if (!doorCell || Math.abs(x - midX) < Math.abs(doorCell[0] - midX)) doorCell = [x, z];
}

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const gr = groundOf(x, z);
  const fs = facesOf(x, z);
  const perim = fs.length > 0;

  // foundation below the ground level
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // base course / floor at ground level
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  if (!perim) {
    // interior: storey floor slab, roof deck, optional roof plant; air elsewhere
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "stone_bricks");
    if (x % 7 === 3 && z % 5 === 2) put(x, gr + 11, z, "iron_block");
    continue;
  }

  // perimeter wall
  const main = fs[0];
  const [odx, odz] = DIRS[main];
  const ax = main === "north" || main === "south" ? "x" : "z";
  const u = ax === "x" ? x : z;
  const corner = fs.length > 1;
  const pier = corner || u % 3 === 0;

  // shopfront, ground storey (gr+1 .. gr+4)
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (pier) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "glass_pane", paneProps(ax));
  }

  // storey line / lower cornice band
  put(x, gr + 5, z, "light_gray_concrete");

  // upper storey windows (gr+6 .. gr+9) with framed head and sill
  for (let y = gr + 6; y <= gr + 9; y++) {
    if (pier || y === gr + 6 || y === gr + 9) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "glass_pane", paneProps(ax));
  }

  // warm light behind some upper windows (inside the glass)
  if (!pier && u % 6 === 1) {
    const ix = x - odx, iz = z - odz;
    if (has(ix, iz) && !isPerim(ix, iz)) put(ix, gr + 7, iz, "shroomlight");
  }

  // stone cornice and parapet
  put(x, gr + 10, z, "smooth_stone");
  put(x, gr + 11, z, "white_concrete");
}

// entrance: door on the north face, lantern above
if (doorCell) {
  const [dx, dz] = doorCell;
  const gr = groundOf(dx, dz);
  const dprops = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(dx, gr + 1, dz, "dark_oak_door", dprops("lower"));
  put(dx, gr + 2, dz, "dark_oak_door", dprops("upper"));
  put(dx, gr + 3, dz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
