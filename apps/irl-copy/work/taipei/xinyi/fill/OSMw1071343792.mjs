import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343792";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 38 x 26. Read as a two-storey (about 11 block) pale-stone and glass
// commercial/civic block: granite plinth, glass shopfront, two storeys of
// window bays with quartz piers, a quartz cornice and parapet, and a rooftop plant.
const W = 38, H = 23, D = 26;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Exterior faces of a footprint cell: neighbours outside the footprint.
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // N, S, W, E (z-1, z+1, x-1, x+1)
function facesOf(x, z) {
  const f = [];
  for (const [dx, dz] of DIRS) if (!inside(x + dx, z + dz)) f.push([dx, dz]);
  return f;
}
const isEdge = (x, z) => facesOf(x, z).length > 0;

// Along-face coordinate: x on north/south faces, z on east/west faces.
function uOf(faces) {
  const ns = faces.some(([dx, dz]) => dz !== 0);
  return { ns };
}

// Ground-floor entrance on the south face (z = D-1), centred.
function isEntrance(x, z, faces) {
  return faces.some(([dx, dz]) => dz === 1) && (x === 17 || x === 18);
}

// Interior cell behind a window: returns glowstone where a lit window is.
function interiorLight(x, z, y) {
  const gr = gAt(x, z);
  if (y !== gr + 8) return false;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz) || !isEdge(nx, nz)) continue;
    // n is a wall cell whose outward side is in direction (dx,dz) from this cell
    if (inside(nx + dx, nz + dz)) continue;
    const u = dx !== 0 ? nz : nx;
    if (u % 8 === 1) return true;
  }
  return false;
}

function plantAt(x, z, y, gr) {
  if (x < 6 || x > W - 7 || z < 6 || z > D - 7) return null;
  if (!((x % 6) < 3 && (z % 6) < 3)) return null;
  if (y === gr + 11 || y === gr + 12) return "light_gray_concrete";
  return null;
}

function blockAt(x, z, y) {
  const gr = gAt(x, z);
  if (y < gr) return "stone_bricks";                       // foundation to lowest-of-cell ground
  if (y === gr) return "smooth_stone";                     // ground-floor slab
  const top = gr + 11;
  if (y > top) return null;

  const faces = facesOf(x, z);
  const edge = faces.length > 0;

  if (!edge) {
    if (y === gr + 5) return "smooth_stone";               // storey-2 floor slab
    if (y === gr + 10) return "light_gray_concrete";       // roof slab
    if (y === gr + 11) return plantAt(x, z, y, gr);
    if (y >= gr + 1 && y <= gr + 9 && interiorLight(x, z, y)) return "glowstone";
    return null;                                           // air behind the glass
  }

  const { ns } = uOf(faces);
  const u = ns ? x : z;
  const pier = u % 4 === 0;

  if (y === gr + 5) return "light_gray_concrete";          // storey line
  if (y === gr + 10) return "smooth_quartz";               // cornice
  if (y === gr + 11) return "white_concrete";              // parapet

  if (y === gr + 1) return "polished_granite";             // base course / plinth

  // Ground floor: shopfront
  if (y >= gr + 2 && y <= gr + 4) {
    if (isEntrance(x, z, faces) && y <= gr + 3) return null; // doorway opening
    if (y === gr + 4) return pier ? "smooth_quartz" : "glass_pane";
    return pier ? "smooth_quartz" : "glass_pane";
  }

  // Storey 2: window bays
  if (y === gr + 6) return "white_concrete";               // spandrel
  if (y >= gr + 7 && y <= gr + 9) return pier ? "smooth_quartz" : "glass_pane";

  return "white_concrete";
}

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  for (let y = 0; y < H; y++) {
    const id = blockAt(x, z, y);
    if (id) g.set(x, y, z, id);
  }
}

g.save(`${DIR}/${ID}.nbt`);
