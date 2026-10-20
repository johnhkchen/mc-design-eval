import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617854";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const TOP = 10;            // roof slab index; roof surface about 11 blocks above lowest ground
const STOREY2 = 5;         // storey line between floors
const LINTEL1 = 4;         // ground-floor lintel row
const LINTEL2 = 9;         // upper-floor lintel row

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function pane(xFace) {
  // Glass pane connecting along the face it sits in
  return xFace
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const exposed = exW || exE || exN || exS;
  const corner = (exW || exE) && (exN || exS);
  const xFace = exW || exE;  // facade runs along z
  const c = xFace ? z : x;    // along-facade index

  if (!exposed) {
    // Interior cell: floor slabs and roof slab only, no walls
    put(x, gr, z, "smooth_stone");
    if (STOREY2 > gr) put(x, STOREY2, z, "smooth_stone");
    put(x, TOP, z, "light_gray_concrete");
    continue;
  }

  // Exterior shell: plinth at ground level
  put(x, gr, z, "polished_andesite");

  for (let y = gr + 1; y <= TOP; y++) {
    let id;
    let props;

    if (y === TOP) {
      id = "smooth_quartz";                       // cornice / roof edge
    } else if (corner) {
      id = "quartz_pillar";                       // corner pillar
    } else if (y === LINTEL1 || y === LINTEL2 || y === STOREY2) {
      id = "smooth_quartz";                       // lintels and storey line
    } else if (exW && x === 0 && y === gr + 1 && gr === 0) {
      id = "white_concrete";
    } else if (y <= 3 && y > gr) {
      // Ground-floor storey
      if (exW && y === gr + 1 && false) id = "white_concrete";
      id = c % 3 === 0 ? "smooth_quartz" : "glass_pane";
      if (id === "glass_pane") props = pane(xFace);
    } else if (y >= 6 && y <= 8) {
      // Upper-floor storey
      id = c % 3 === 0 ? "smooth_quartz" : "glass_pane";
      if (id === "glass_pane") props = pane(xFace);
    } else {
      id = "white_concrete";                      // tiled wall
    }

    // Red shop fascia along the street face on ground level
    if (exW && y === LINTEL1 && !corner) id = "red_concrete";

    put(x, y, z, id, props);
  }

  // Warm light behind some upper-floor panes (shroomlight in the interior cell)
  if (c % 6 === 1) {
    const ix = exW ? x + 1 : exE ? x - 1 : x;
    const iz = exN ? z + 1 : exS ? z - 1 : z;
    if (has(ix, iz) && !(ix === x && iz === z)) {
      put(ix, 7, iz, "shroomlight");
    }
  }
}

// Street entrance on the west face: double-height glass door (lower and upper halves)
if (has(0, 8) && !has(-1, 8) && gnd(0, 8) <= 2) {
  const gr = gnd(0, 8);
  put(0, gr + 1, 8, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(0, gr + 2, 8, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Small canopy/fascia above the door, on the wall line
  put(0, gr + 3, 8, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant on the interior roof slab
for (const [x, z, gr] of cells) {
  const exposed = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (!exposed && x === 2 && (z === 5 || z === 6)) {
    put(x, TOP + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
