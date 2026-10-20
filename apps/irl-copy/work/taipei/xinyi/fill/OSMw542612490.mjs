import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612490";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 9 x 10 footprint, roof about 11 blocks above the lowest ground:
// a two-storey (5 + 5 block) reinforced-concrete shophouse with a
// shopfront ground floor, white tiled walls, grey concrete bands,
// a parapet and one rooftop plant box.
const W = 9, H = 23, D = 10;

const gh = new Map();
let g0 = Infinity;
for (const [x, z, gr] of cells) {
  gh.set(`${x},${z}`, gr);
  g0 = Math.min(g0, gr);
}
const inF = (x, z) => gh.has(`${x},${z}`);
const gnd = (x, z) => gh.get(`${x},${z}`);
const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const x0 = Math.min(...xs), x1 = Math.max(...xs);
const z0 = Math.min(...zs), z1 = Math.max(...zs);

const FL = g0 + 5;   // floor level of storey 2 (top of storey 1)
const RF = g0 + 10;  // roof slab
const TOP = g0 + 11; // parapet top, about 11 above lowest ground

const g = new Voxels([W, H, D]);

const doorProps = (half) => ({
  facing: "north",
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});

// Pass 1: foundations, floor slabs and roof slab, per footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (FL >= gr) g.set(x, FL, z, "smooth_stone");
  if (RF >= gr) g.set(x, RF, z, "light_gray_concrete");
}

// Pass 2: perimeter shell with storey articulation and windows.
for (const [x, z, gr] of cells) {
  const perim = !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
  if (!perim) continue;

  const front = z === z0;
  const back = z === z1;
  const side = !front && !back;

  for (let y = gr; y < RF; y++) {
    let block = "white_concrete";
    let props;

    if (y === g0) {
      // base course
      block = "polished_granite";
    } else if (y < FL) {
      // ground storey: shopfront on the front, plain wall elsewhere
      if (y === FL - 1) {
        block = "light_gray_concrete"; // storey band / fascia
      } else if (front) {
        if (x === x0 || x === x1) {
          block = "white_concrete";
        } else if (x === 4 && gr === g0 && (y === g0 + 1 || y === g0 + 2)) {
          block = "oak_door";
          props = doorProps(y === g0 + 1 ? "lower" : "upper");
        } else {
          block = "glass_pane";
        }
      } else {
        const winCol = side ? (z % 2 === 1 && z !== z0 && z !== z1) : (x % 2 === 1 && x !== x0 && x !== x1);
        if (winCol && y >= g0 + 1 && y <= g0 + 3) block = "glass_pane";
      }
    } else {
      // upper storey
      if (y === FL) {
        block = "light_gray_concrete"; // floor line
      } else if (y === RF - 1) {
        block = "light_gray_concrete"; // cornice band under roof
      } else {
        const winCol = (front || back)
          ? (x % 2 === 1 && x !== x0 && x !== x1)
          : (z % 2 === 1 && z !== z0 && z !== z1);
        if (winCol) block = "glass_pane";
      }
    }

    if (props) g.set(x, y, z, block, props);
    else g.set(x, y, z, block);
  }

  // parapet on the roof edge
  if (TOP >= gr) g.set(x, TOP, z, "white_concrete");
}

// Pass 3: warm light behind some upper-storey windows (inside the shell).
for (const [x, z, gr] of cells) {
  const perim = !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
  if (!perim) continue;
  if ((x + z) % 4 !== 1) continue;
  if (FL + 2 < gr) continue;
  let ix = x, iz = z;
  if (x === x0) ix = x + 1;
  else if (x === x1) ix = x - 1;
  else if (z === z0) iz = z + 1;
  else if (z === z1) iz = z - 1;
  if (!inF(ix, iz) || gnd(ix, iz) > FL + 2) continue;
  if (ix === x && iz === z) continue;
  g.set(ix, FL + 2, iz, "shroomlight");
}

// Pass 4: a warm lantern in the shopfront transom at the entrance.
for (const [x, z, gr] of cells) {
  if (z !== z0 || x !== 4 || gr !== g0) continue;
  if (inF(x, z + 1)) g.set(x, g0 + 3, z + 1, "shroomlight");
}

// Pass 5: rooftop plant box on the roof slab, inside the parapet.
const pcx = Math.floor((x0 + x1) / 2);
const pcz = Math.floor((z0 + z1) / 2);
for (let dx = 0; dx <= 1; dx++) {
  for (let dz = 0; dz <= 1; dz++) {
    const px = pcx + dx - 1;
    const pz = pcz + dz - 1;
    if (inF(px, pz) && RF >= gnd(px, pz)) {
      g.set(px, RF + 1, pz, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
