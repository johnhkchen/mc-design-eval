import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540891050.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540891050.nbt";

// Footprint: 21 x 11 blocks, 2-storey mid-century commercial block with a cream
// tiled concrete frame, glazed ground-floor shopfront, flat roof with parapet
// and a rooftop water tank (common across Taipei's older low-rise stock).
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;

let minG = Infinity;
for (const [, , gr] of raw) minG = Math.min(minG, gr);

const fp = new Map();
for (const [x, z, gr] of raw) {
  const g = Math.max(0, Math.min(12, Math.round(gr - minG)));
  fp.set(key(x, z), g);
}

const MAX_X = 20;
const MAX_Z = 10;
const ROOF_Y = 10;     // top of the body slab; roof surface reads at y 11
const PARAPET_Y = 11;
const BAND_Y = 5;      // storey line between ground and upper floor

const g = new Voxels([21, 23, 11]);

const dirs = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];

const isPerim = (x, z) => dirs.some((d) => !fp.has(key(x + d.dx, z + d.dz)));

const setStairsFree = () => {}; // placeholder kept minimal; no stairs needed

for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ext = dirs.filter((d) => !fp.has(key(x + d.dx, z + d.dz)));

  if (ext.length > 0) {
    // Perimeter cell: facade.
    const corner = ext.length >= 2;
    const zFace = ext.some((d) => d.dz !== 0);
    const p = zFace ? x : z;
    const edge = zFace ? (x === 0 || x === MAX_X) : (z === 0 || z === MAX_Z);
    const pillar = corner || edge || p % 3 === 0;

    // Main door on the north face, centred.
    const isDoorCell = ext.some((d) => d.name === "north") && x === 10;

    for (let y = gr; y <= 9; y++) {
      let id;
      if (y === gr) id = "stone_bricks";                 // base course
      else if (y <= 3) id = pillar ? "light_gray_concrete" : "glass"; // shopfront
      else if (y === 4) id = "smooth_quartz";            // transom
      else if (y === BAND_Y) id = "light_gray_concrete"; // storey line
      else if (y <= 8) id = pillar ? "light_gray_concrete" : "glass"; // upper windows
      else id = "smooth_quartz";                         // spandrel

      if (isDoorCell && (y === gr || y === gr + 1) && y <= 3) {
        const half = y === gr ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      g.set(x, y, z, id);
    }

    // Warm light just inside some upper windows.
    if (!corner && !pillar) {
      const o = ext[0];
      if (p % 6 === 1) {
        const ix = x - o.dx;
        const iz = z - o.dz;
        const ik = key(ix, iz);
        if (fp.has(ik) && !isPerim(ix, iz)) {
          g.set(ix, 7, iz, "glowstone");
        }
      }
    }

    // Parapet on the roof edge.
    g.set(x, PARAPET_Y, z, "light_gray_concrete");
  } else {
    // Interior: air gap, floor slab at the storey line.
    if (gr <= BAND_Y) g.set(x, BAND_Y, z, "smooth_stone");
  }

  // Roof slab over every footprint cell.
  g.set(x, ROOF_Y, z, "smooth_quartz");
}

// Rooftop water tank, 3 x 3, on the roof slab, only if fully on interior cells.
const tcx = 15, tcz = 5;
let tankOk = true;
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    const k = key(tcx + dx, tcz + dz);
    if (!fp.has(k) || isPerim(tcx + dx, tcz + dz)) tankOk = false;
  }
}
if (tankOk) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let y = 11; y <= 13; y++) {
        g.set(tcx + dx, y, tcz + dz, "white_concrete");
      }
    }
  }
  g.set(tcx, 14, tcz, "iron_block");
}

g.save(OUT);
