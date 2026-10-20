import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low two-storey Xinyi-era commercial block: white tiled concrete, granite base,
// shopfront ground storey with a central double entrance, a sparse upper-storey
// window grid, a smooth-stone cornice, and a small roof plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833583";
const W = 24, H = 23, D = 19;

const BAND1 = 5;   // storey line above the shopfront
const FLOOR2 = 6;  // second floor slab
const BAND2 = 10;  // sill/band under the upper windows
const TOP = 11;    // roof surface and parapet top

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const maxZ = Math.max(...cells.map(c => c[1]));
const width = maxX - minX + 1;
const doorIdx = [Math.floor(width / 2) - 1, Math.floor(width / 2)];

// Outward-facing sides of a footprint cell
function outFaces(x, z) {
  const f = [];
  if (!inside(x, z - 1)) f.push("N");
  if (!inside(x, z + 1)) f.push("S");
  if (!inside(x - 1, z)) f.push("W");
  if (!inside(x + 1, z)) f.push("E");
  return f;
}

// Inward offset for a face
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const isPerimeter = (x, z) => inside(x, z) && outFaces(x, z).length > 0;

function put(x, y, z, id, props) {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Windows chosen to show a warm light behind the glass (interior cell at y=8)
const litWindows = [];

// ---- Pass 1: foundations, floors, walls, roof ----
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isPerimeter(x, z)) {
    const fs = outFaces(x, z);
    const corner = fs.length > 1;
    const f = fs[0];
    const ns = f === "N" || f === "S";
    const idx = ns ? x - minX : z - minZ;
    const paneProps = ns
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    const isDoorCell = f === "S" && doorIdx.includes(idx);
    const hinge = idx === doorIdx[0] ? "left" : "right";
    const pier = corner || idx % 3 === 0;
    const isWindowCol = !pier;

    for (let y = gr; y <= TOP; y++) {
      if (y === TOP) { put(x, y, z, "smooth_stone"); continue; }     // cornice / parapet cap
      if (y === gr) { put(x, y, z, "polished_granite"); continue; }  // base course
      if (y === BAND1 || y === BAND2 || y === FLOOR2) {
        put(x, y, z, "smooth_stone");
        continue;
      }

      if (y < BAND1) {
        // Shopfront storey
        if (isDoorCell && (y === gr + 1 || y === gr + 2)) {
          put(x, y, z, "dark_oak_door", {
            facing: "south",
            half: y === gr + 1 ? "lower" : "upper",
            hinge,
            open: "false",
            powered: "false",
          });
          continue;
        }
        if (corner || idx % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
        if (y === gr + 1) { put(x, y, z, "stone_bricks"); continue; } // bulkhead
        put(x, y, z, "glass_pane", paneProps);
        continue;
      }

      // Upper storey (y 7..9)
      if (pier) { put(x, y, z, corner ? "light_gray_concrete" : "white_concrete"); continue; }
      put(x, y, z, "glass_pane", paneProps);

      // Mark some upper windows as lit (shroomlight behind them)
      if (y === 8 && idx % 6 === 2 && !isDoorCell) {
        const [dx, dz] = INWARD[f];
        litWindows.push([x + dx, z + dz]);
      }
    }
  } else if (inside(x, z)) {
    // Interior: floor slabs and roof deck only; air above ground floor
    put(x, gr, z, "smooth_stone");
    if (gr < FLOOR2) put(x, FLOOR2, z, "smooth_stone");
    put(x, TOP, z, "light_gray_concrete");
  }
}

// ---- Pass 2: warm light behind selected upper windows ----
for (const [x, z] of litWindows) {
  if (inside(x, z) && !isPerimeter(x, z)) {
    put(x, 8, z, "shroomlight");
  }
}

// ---- Pass 3: roof plant box on the roof deck ----
for (let x = minX + 8; x <= minX + 15; x++) {
  for (let z = minZ + 6; z <= minZ + 12; z++) {
    if (!inside(x, z) || isPerimeter(x, z)) continue;
    put(x, TOP + 1, z, "light_gray_concrete");
    put(x, TOP + 2, z, "light_gray_concrete");
    put(x, TOP + 2, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
