import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 14 x 16, roof ~11 blocks above lowest ground.
// Read as a two-storey, ~5-block-per-storey commercial block on a stone plinth:
// white ceramic-tile facade, granite base course, a shopfront ground storey with
// a central entrance, a second storey of tinted glazing in piers, a stone cornice
// and parapet, and rooftop plant. Glowstone sits behind some upper windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772039815";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 14, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(10, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// Storey lines (absolute, shared by all cells so floors line up)
const SLAB_A = 5;   // ground storey / upper storey floor line
const SLAB_B = 10;  // upper storey / roof floor line
const ROOF = 11;    // roof surface
const TOP = 13;     // parapet cap

const exposedFaces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push({ dir: "north", i: x, dx: 0, dz: 1 });
  if (!has(x, z + 1)) f.push({ dir: "south", i: x, dx: 0, dz: -1 });
  if (!has(x - 1, z)) f.push({ dir: "west", i: z, dx: 1, dz: 0 });
  if (!has(x + 1, z)) f.push({ dir: "east", i: z, dx: -1, dz: 0 });
  return f;
};

// Pier every third bay gives a clear vertical rhythm on each facade.
const isPier = (i) => i % 3 === 0;

// Pass 1: foundations, floor slabs, roof, shell walls and openings.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposedFaces(x, z);
  const exposed = faces.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs and roof surface, only where they are above ground.
  if (gr <= SLAB_A) g.set(x, SLAB_A, z, "smooth_stone");
  if (gr <= SLAB_B) g.set(x, SLAB_B, z, "smooth_stone");
  if (gr <= ROOF) g.set(x, ROOF, z, "gray_concrete");

  if (!exposed) continue;

  // Shell: the perimeter cell is the wall. Tile facade from ground to parapet.
  for (let y = gr; y <= TOP; y++) {
    let id = "white_concrete";
    if (y === gr) id = "polished_granite";          // base course
    else if (y === SLAB_A || y === SLAB_B) id = "smooth_stone"; // spandrel bands
    else if (y === ROOF) id = "smooth_stone";       // cornice line
    else if (y === TOP) id = "stone_bricks";        // parapet cap
    g.set(x, y, z, id);
  }

  // Ground storey shopfront glazing between piers.
  const shopLo = gr + 1, shopHi = Math.min(SLAB_A - 1, 4);
  for (const f of faces) {
    if (isPier(f.i)) continue;
    for (let y = shopLo; y <= shopHi; y++) {
      if (y >= gr) g.set(x, y, z, "glass");
    }
  }

  // Upper storey glazing, tinted blue, between piers.
  for (const f of faces) {
    if (isPier(f.i)) continue;
    for (let y = SLAB_A + 1; y <= SLAB_B - 1; y++) {
      if (y >= gr) g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Warm glowstone sitting just inside some upper windows.
  for (const f of faces) {
    if (isPier(f.i) || f.i % 6 !== 4) continue;
    const xi = x + f.dx, zi = z + f.dz;
    if (has(xi, zi) && exposedFaces(xi, zi).length === 0 && G(xi, zi) <= 7) {
      g.set(xi, 7, zi, "glowstone");
    }
  }
}

// Pass 2: entrance on the south (street) face, centred along its length.
{
  const southCells = [];
  for (const [key, gr] of ground) {
    const [x, z] = key.split(",").map(Number);
    if (!has(x, z + 1)) southCells.push([x, z, gr]);
  }
  southCells.sort((a, b) => a[0] - b[0]);
  if (southCells.length) {
    const [xd, zd, gd] = southCells[Math.floor(southCells.length / 2)];
    if (gd + 2 <= 4) {
      g.set(xd, gd + 1, zd, "iron_door", {
        facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(xd, gd + 2, zd, "iron_door", {
        facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      // Hanging lantern over the door as the entrance light.
      g.set(xd, gd + 3, zd, "lantern", { hanging: "true" });
    }
  }
}

// Pass 3: rooftop plant on interior roof cells.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (exposedFaces(x, z).length) continue;
  if (gr > ROOF) continue;
  if (x % 4 === 1 && z % 4 === 2) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
