import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542681373";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 12, H = 23, D = 7;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y (rounded)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Glass pane connection states: panes run along the wall they sit in
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1980s-90s Taipei mid-rise: white/cream tiled piers, glass shopfronts at street level,
// red sign fascia on the street front, two storeys of framed windows, parapet and rooftop units.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation and plinth: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, y === gr ? "stone_bricks" : "stone");

  const edge = isEdge(x, z);

  if (!edge) {
    // Interior: floor slabs only (air between), roof deck, rooftop units
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    if ((x === 3 || x === 8) && z === 3) put(x, gr + 11, z, "iron_block");
    continue;
  }

  const nW = has(x - 1, z), nE = has(x + 1, z), nN = has(x, z - 1), nS = has(x, z + 1);
  const zEdge = !nN || !nS;          // on a north/south boundary (wall runs along x)
  const xEdge = !nW || !nE;          // on an east/west boundary (wall runs along z)
  const corner = zEdge && xEdge;
  const u = zEdge ? x : z;           // bay index along the facade
  const pier = corner || u % 3 === 0;
  const front = !nN;                 // z = 0 face is the street front
  const doorCell = front && x === 5;

  // Inward neighbour, used to place warm lights behind the glass
  let ix = x, iz = z;
  if (zEdge) iz = nN ? z + 1 : z - 1;
  else ix = nW ? x + 1 : x - 1;
  const innerOK = has(ix, iz) && !isEdge(ix, iz);

  const pane = zEdge ? paneZ : paneX;

  // Cornice belt course, roof parapet
  put(x, gr + 5, z, "smooth_quartz");
  put(x, gr + 10, z, "smooth_quartz");
  put(x, gr + 11, z, "white_concrete");

  // Storey 1: shopfronts
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (pier) {
      put(x, y, z, "smooth_quartz");
    } else if (doorCell && y <= gr + 2) {
      // entrance door (lower and upper halves)
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
    } else if (doorCell && y === gr + 3) {
      put(x, y, z, "smooth_quartz");
    } else {
      put(x, y, z, "glass");
    }
  }
  // Sign fascia on street front, plain band elsewhere
  put(x, gr + 4, z, front ? "red_concrete" : "smooth_quartz");

  // Warm light behind shopfront glass
  if (!pier && !doorCell && innerOK && u % 2 === 0) {
    put(ix, gr + 2, iz, "shroomlight");
  }

  // Storey 2: framed windows
  for (let y = gr + 6; y <= gr + 9; y++) {
    if (pier) {
      put(x, y, z, "smooth_quartz");
    } else if (y === gr + 6 || y === gr + 9) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane", pane);
    }
  }
  if (!pier && innerOK && u % 2 === 1) {
    put(ix, gr + 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
