import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw549464121";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 33, D = 17;
const g = new Voxels([W, H, D]);

// Record: ~21 blocks to roof above lowest ground, 4 storeys of ~5 blocks.
// Era: late-1990s Xinyi commercial/office block. Materials: pale quartz-clad
// piers, white spandrels, tinted glass bays, andesite base, dark fascia.
const ROOF_Y = 21;
const PARAPET_CAP = 20;
const CORNICE_Y = 19;
const SPANDREL = new Set([5, 10, 15]);
const GROUND_TOP = 4;     // ground-storey zone is y < 5
const WINDOW_BANDS = new Set([6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18]);
const LIGHT_Y = new Set([7, 12, 17]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);
const exterior = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const adjToExterior = (x, z) =>
  (has(x + 1, z) && exterior(x + 1, z)) || (has(x - 1, z) && exterior(x - 1, z)) ||
  (has(x, z + 1) && exterior(x, z + 1)) || (has(x, z - 1) && exterior(x, z - 1));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: exterior cell on the southern-most edge, nearest the centre line.
let entrance = null;
{
  let maxZ = -1;
  for (const [x, z] of cells) if (exterior(x, z) && z > maxZ) maxZ = z;
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!exterior(x, z) || z !== maxZ) continue;
    const d = Math.abs(x - 8);
    if (d < best) { best = d; entrance = [x, z]; }
  }
}

// Penthouse footprint: interior cells well inside the plan.
const inPenthouse = (x, z) => x >= 5 && x <= 11 && z >= 5 && z <= 11;

for (const [x, z, gr] of cells) {
  const ext = exterior(x, z);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");

  if (ext) {
    // Piers on the face: face coordinate decides bay rhythm.
    const edgeZ = z === 0 || z === 16;
    const u = edgeZ ? x : z;
    const pier = u % 4 === 0;
    const isEntrance = entrance && entrance[0] === x && entrance[1] === z;

    for (let y = gr; y <= ROOF_Y; y++) {
      if (y === ROOF_Y) { put(x, y, z, "smooth_quartz"); continue; }
      if (y === PARAPET_CAP) { put(x, y, z, "white_concrete"); continue; }
      if (y === CORNICE_Y) { put(x, y, z, "smooth_quartz"); continue; }

      if (y < 5) {
        // Ground-storey shopfront zone.
        if (y === gr) { put(x, y, z, "polished_andesite"); continue; }
        if (y === GROUND_TOP) { put(x, y, z, "dark_prismarine"); continue; }
        if (isEntrance && y === gr + 1 && gr + 2 <= GROUND_TOP) {
          put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (isEntrance && y === gr + 2 && gr + 2 <= GROUND_TOP) {
          put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (pier) { put(x, y, z, "smooth_quartz"); continue; }
        put(x, y, z, "light_blue_stained_glass_pane");
        continue;
      }

      // Upper storeys.
      if (y === gr) { put(x, y, z, "white_concrete"); continue; }
      if (SPANDREL.has(y)) { put(x, y, z, "white_concrete"); continue; }
      if (pier) { put(x, y, z, "smooth_quartz"); continue; }
      if (WINDOW_BANDS.has(y)) { put(x, y, z, "light_blue_stained_glass_pane"); continue; }
      put(x, y, z, "smooth_quartz");
    }
  } else {
    // Interior cells: floor slabs at storey lines, roof slab, air gap otherwise.
    const lines = new Set([gr, ...SPANDREL, CORNICE_Y]);
    for (let y = gr; y < ROOF_Y; y++) {
      if (lines.has(y) && y < PARAPET_CAP) put(x, y, z, "light_gray_concrete");
      if (adjToExterior(x, z) && LIGHT_Y.has(y) && (x + z) % 3 === 0) put(x, y, z, "glowstone");
    }
    put(x, ROOF_Y, z, "light_gray_concrete");
  }

  // Rooftop plant room and mast on the central core.
  if (inPenthouse(x, z) && !ext) {
    put(x, 22, z, "light_gray_concrete");
    put(x, 23, z, "light_gray_concrete");
    put(x, 24, z, "stone_bricks");
  }
}

// Mast on the core centre if the cell exists.
if (has(8, 8)) put(8, 25, 8, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
