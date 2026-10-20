import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540295094";
const cells = JSON.parse(readFileSync(`${BASE}.cells.json`, "utf8"));

// Record: roof about 11 blocks above lowest ground. Reads as a late-1980s/1990s
// Xinyi mid-rise commercial block: white and light-grey concrete piers, quartz
// storey lines, light-blue glass, a shopfront band, and a plant penthouse.
const W = 19, H = 23, D = 20;
const ROOF = 11;   // parapet cap top (about 11 blocks above lowest ground)
const CORN = 10;   // roof slab / cornice band
const STOREY = 5;  // upper-storey floor line
const SHOP = 4;    // top of shopfront band

const g = new Voxels([W, H, D]);

// Footprint: ground height per cell, clamped so the body keeps at least one course.
const gmap = new Map();
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, Math.max(0, Math.min(CORN - 1, Math.round(gr))));
}
const cellAt = (x, z) => gmap.has(`${x},${z}`);
const gAt = (x, z) => gmap.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const facesOf = (x, z) =>
  Object.keys(DIRS).filter((f) => !cellAt(x + DIRS[f][0], z + DIRS[f][1]));

// Facade block for one perimeter cell at height y.
function facade(y, gr, f, idx, corner) {
  const alongX = f === "north" || f === "south";
  const panes = alongX ? { east: "true", west: "true" } : { north: "true", south: "true" };
  const pillar = corner || idx % 3 === 0;

  if (y === ROOF) return ["smooth_stone"];                 // parapet cap
  if (y === CORN || y === STOREY) return ["smooth_quartz"]; // cornice and storey line
  if (y <= SHOP) {                                          // shopfront band
    if (y === gr) return ["stone_bricks"];                  // base course
    if (y === SHOP) return ["smooth_quartz"];               // transom
    return pillar ? ["white_concrete"] : ["light_blue_stained_glass"];
  }
  if (y === 6 || y === 9) return ["light_gray_concrete"];   // spandrels
  return pillar ? ["white_concrete"] : ["light_blue_stained_glass_pane", panes]; // windows
}

// 1. Foundations, floor slabs and interior roof slabs for every footprint cell.
for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");   // foundation to ground
  g.set(x, gr, z, "stone_bricks");                         // ground floor slab
  if (STOREY > gr) g.set(x, STOREY, z, "smooth_quartz");   // upper floor slab
  g.set(x, CORN, z, "smooth_quartz");                      // roof slab
}

// 2. Perimeter walls, windows, and small interior lights behind the glass.
for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  const faces = facesOf(x, z);
  if (!faces.length) continue;
  const corner = faces.length > 1;
  const f = faces[0];
  const [dx, dz] = DIRS[f];
  const idx = f === "north" || f === "south" ? x : z;

  for (let y = gr; y <= ROOF; y++) {
    const [name, props] = facade(y, gr, f, idx, corner);
    if (props) g.set(x, y, z, name, props);
    else g.set(x, y, z, name);
  }

  // Warm light: a shelf and shroomlight just inside some upper-storey windows.
  const pillar = corner || idx % 3 === 0;
  if (!pillar && gr < 6 && (x * 7 + z * 3) % 4 === 0) {
    const ix = x - dx, iz = z - dz;
    if (cellAt(ix, iz) && facesOf(ix, iz).length === 0 && gAt(ix, iz) < 6) {
      g.set(ix, 6, iz, "smooth_quartz");
      g.set(ix, 7, iz, "shroomlight");
    }
  }
}

// 3. Roof equipment: air-handling boxes and a central plant penthouse.
for (const [key] of gmap) {
  const [x, z] = key.split(",").map(Number);
  if (facesOf(x, z).length) continue;
  const inPenthouse = Math.abs(x - 9) <= 1 && Math.abs(z - 10) <= 1;
  if (inPenthouse) {
    g.set(x, 11, z, "white_concrete");
    g.set(x, 12, z, "white_concrete");
    g.set(x, 13, z, "light_gray_concrete");
  } else if ((x * 5 + z * 7) % 13 === 0) {
    g.set(x, 11, z, "light_gray_concrete");
    g.set(x, 12, z, "light_gray_concrete");
  }
}

// 4. Entrance: a door in the middle of the north-facing shopfront.
const northCells = [...gmap.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !cellAt(x, z - 1))
  .sort((a, b) => a[0] - b[0]);
if (northCells.length) {
  const [cx, cz] = northCells[Math.floor(northCells.length / 2)];
  const gr = gAt(cx, cz);
  if (gr <= 3) {
    g.set(cx, gr, cz, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(cx, gr + 1, cz, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

g.save(`${BASE}.nbt`);
