// 3550 West Pacific Av (Miscellaneous / Mixed-Use), Presidio Tunnel Tops.
// Read from the record: a two-storey 1920s-30s stucco mixed-use block, its roof about 5 blocks above the lowest ground.
// Cream stucco walls over a stone plinth, a dark wood shopfront with a green awning and a centred entrance on the street
// (north) face, sash windows above with quartz piers, a chiselled-quartz cornice, a half-height parapet with full piers,
// and a flat roof with two HVAC boxes and a tree in a rooftop planter. The walls are one cell thick around a hollow
// interior: a floor slab per storey (not behind the glass ring), air behind every window, and warm lights behind
// some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0007025.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [10, 17, 19];
const PLINTH = 0;          // stone base course (also the foundation under the uphill cells)
const SHOP = 1;            // ground storey: shopfront glass
const UPPER = [2, 3];      // upper storey: sash windows
const CORNICE = 4;         // chiselled-quartz cornice
const PARAPET = 5;         // parapet cap (slab on windows, full block on piers)

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inside = (x, z) => ground.has(key(x, z));
const NORMALS = [[0, -1], [0, 1], [-1, 0], [1, 0]];     // north, south, west, east (north = street side)
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const shell = (x, z) => inside(x, z) && faces(x, z).length > 0;
const interior = (x, z) => inside(x, z) && !shell(x, z);
const ring = (x, z) => interior(x, z) && NORMALS.some(([dx, dz]) => shell(x + dx, z + dz));

// Front = the north face when the parcel has one, else south, west, east.
function facadeOf(x, z) {
  const fs = faces(x, z);
  const n = fs.find(([nx, nz]) => nz === -1) ?? fs.find(([nx, nz]) => nz === 1) ?? fs[0];
  const along = n[0] === 0 ? x : z;                  // coordinate running along the wall
  const inward = [-n[0], -n[1]];
  return { n, along, inward, front: n[0] === 0 && n[1] === -1 };
}

// Piers every fourth block, glass between; the shopfront uses dark wood frames for its piers.
const isPier = (along) => along % 4 === 0 || along % 4 === 3;

// Entrance: the middle of the street-level cells on the north face, on the lowest ground.
const northDoorCells = cells.filter(([x, z, g]) => shell(x, z) && g === 0 && faces(x, z).some(([dx, dz]) => dz === -1));
const doorX = northDoorCells.length
  ? northDoorCells.map(([x]) => x).sort((a, b) => a - b)[Math.floor(northDoorCells.length / 2)]
  : null;
const doorZ = northDoorCells.find(([x]) => x === doorX)?.[1];

const g = new Voxels(SIZE);
const panes = [];

// Pass 1: interior floors and roof, then the shell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");      // foundation fill: nothing floats on a slope

  if (interior(x, z)) {
    g.set(x, PLINTH, z, "smooth_stone");                            // ground-storey floor
    if (!ring(x, z)) g.set(x, UPPER[0], z, "smooth_stone");         // upper floor, behind the glass ring left as air
    g.set(x, CORNICE, z, "smooth_stone");                           // roof deck
    continue;
  }
  if (!shell(x, z)) continue;

  const { n, along, front } = facadeOf(x, z);
  const pier = isPier(along);
  const doorHere = front && x === doorX && z === doorZ;

  // Plinth.
  g.set(x, PLINTH, z, "stone_bricks");

  // Ground storey: shopfront on the street side, piers dark wood; elsewhere matching sash piers.
  if (!doorHere) {
    if (front) {
      if (pier) g.set(x, SHOP, z, "dark_oak_planks");
      else { g.set(x, SHOP, z, "glass_pane"); panes.push([x, SHOP, z]); }
    } else if (pier) g.set(x, SHOP, z, "smooth_quartz");
    else { g.set(x, SHOP, z, "glass_pane"); panes.push([x, SHOP, z]); }
  }

  // Upper storey: sash windows between quartz piers.
  for (const y of UPPER) {
    if (pier) g.set(x, y, z, "smooth_quartz");
    else { g.set(x, y, z, "glass_pane"); panes.push([x, y, z]); }
  }

  // Cornice and parapet.
  g.set(x, CORNICE, z, "chiseled_quartz_block");
  if (pier) g.set(x, PARAPET, z, "smooth_quartz");
  else g.set(x, PARAPET, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance: a two-high dark oak door in the middle of the shopfront, with a green awning over it inside the footprint.
if (doorX !== null) {
  g.set(doorX, PLINTH, doorZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, SHOP, doorZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) {
    if (!shell(doorX + dx, doorZ)) continue;
    g.set(doorX + dx, UPPER[0], doorZ, "dark_oak_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
  }
}

// Pass 2: warm light in the air ring behind some panes (glowstone at street level, lanterns upstairs).
for (const [x, y, z] of panes) {
  const { inward } = facadeOf(x, z);
  const [ix, iz] = [x + inward[0], z + inward[1]];
  if (!ring(ix, iz)) continue;
  if (y === SHOP && x % 4 === 1) g.set(ix, y, iz, "glowstone");
  if (y === UPPER[1] && (x + z) % 3 === 0) {
    g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof: two HVAC boxes and a tree in a planter, all on the deck in the core.
for (const [x, z] of cells) {
  if (!interior(x, z) || ring(x, z)) continue;
  if ((x * 3 + z * 5) % 13 === 0) g.set(x, CORNICE + 1, z, "light_gray_concrete");
  if (x === 7 && z === 6) g.set(x, CORNICE + 1, z, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" });
}

// Pass 3: glass panes connect to their neighbours in the wall plane, as the game draws them.
const solid = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, y, z] of panes) {
  const st = {
    north: String(solid(x, y, z - 1)),
    south: String(solid(x, y, z + 1)),
    west: String(solid(x - 1, y, z)),
    east: String(solid(x + 1, y, z)),
    waterlogged: "false",
  };
  g.set(x, y, z, "glass_pane", st);
}

const { blocks, palette } = g.save(`${DIR}/201006.0007025.nbt`);
console.log(`201006.0007025: ${blocks} blocks, ${palette} palette entries`);
