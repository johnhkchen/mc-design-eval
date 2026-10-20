import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi office block, 44 x 22 footprint, roof about 26 blocks above lowest ground.
// Read as a late-1990s / early-2000s Taipei office block: pale concrete frame,
// blue-grey glazing, granite plinth, quartz cornice, a shopfront ground storey,
// five storeys of 5 blocks each and a rooftop plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1147850018";
const W = 44, H = 38, D = 22;
const ROOF_Y = 25;      // parapet course (y 25), cap at 26 -> roof about 26 above lowest ground
const CAP_Y = 26;
const PLANT_TOP = 27;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z);
}
const centreX = (minX + maxX) / 2;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// Outward normals of a footprint cell (neighbour missing from the footprint).
const outward = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const facingOf = ([dx, dz]) =>
  dz === -1 ? "north" : dz === 1 ? "south" : dx === 1 ? "east" : "west";

const g = new Voxels([W, H, D]);

// Facade material for one wall cell at height y.
function facadeBlock(y, gr, i) {
  if (y === gr) return "polished_granite";          // plinth course on the ground
  if (y === ROOF_Y) return "white_concrete";        // parapet
  if (y === 24) return "smooth_quartz";             // cornice
  if (y % 5 === 0) return "light_gray_concrete";    // storey lines
  if (y % 5 === 4) return "white_concrete";         // spandrel below each window band
  if (i % 3 === 0) return "smooth_quartz";          // mullion piers
  return "light_blue_stained_glass";                // glazing
}

// Pass 1: foundations, facades, floor slabs and roof.
for (const [x, z, gr] of cells) {
  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ns = outward(x, z);
  if (ns.length) {
    const n = ns[0];
    const i = n[0] !== 0 ? z : x; // position along the wall
    for (let y = gr; y <= ROOF_Y; y++) {
      g.set(x, y, z, facadeBlock(y, gr, i));
    }
    g.set(x, CAP_Y, z, "smooth_quartz");
  } else {
    // Interior: floor slabs at storey lines and the roof deck; air between.
    for (let y = gr; y <= ROOF_Y; y++) {
      if (y % 5 === 0 || y === ROOF_Y) g.set(x, y, z, "smooth_stone");
    }
  }
}

// Pass 2: shopfront entrance, two oak doors in the middle of the front (north) wall.
for (const [x, z, gr] of cells) {
  if (z !== minZ) continue;
  if (!(Math.abs(x - centreX) <= 0.5)) continue;
  const ns = outward(x, z);
  if (!ns.some(([dx, dz]) => dx === 0 && dz === -1)) continue;
  const hinge = x < centreX ? "left" : "right";
  const facing = "north";
  g.set(x, gr, z, "oak_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, gr + 1, z, "oak_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
  // Recessed canopy-line over the door (quartz band across the entrance).
  g.set(x, gr + 2, z, "smooth_quartz");
}

// Pass 3: warm light behind a few upper-floor windows (air gap inside the facade).
for (const [x, z, gr] of cells) {
  const ns = outward(x, z);
  if (!ns.length) continue;
  const n = ns[0];
  const i = n[0] !== 0 ? z : x;
  const ix = x - n[0], iz = z - n[1];  // inward cell
  if (!has(ix, iz)) continue;
  for (const y of [7, 12, 17, 22]) {
    if (y < gr) continue;
    if (i % 3 === 1 && (i * 7 + y) % 4 === 0) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

// Pass 4: rooftop plant box, set back from the parapet.
for (const [x, z] of cells) {
  if (x < 14 || x > 29 || z < 7 || z > 14) continue;
  if (outward(x, z).length) continue;
  g.set(x, CAP_Y, z, "light_gray_concrete");
  g.set(x, 27, z, "light_gray_concrete");
  g.set(x, PLANT_TOP, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
