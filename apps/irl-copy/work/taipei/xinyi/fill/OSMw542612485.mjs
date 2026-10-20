import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1970s–80s Taipei shophouse-style block: stone-bricked foundation,
// beige quartz facade, andesite base and frames, light-blue glass bays,
// two storeys of 5 blocks, cornice parapet, centre entrance with a lintel
// canopy, and a rooftop water tank. Roof top sits about 11 blocks above the
// lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612485";
const W = 15, H = 23, D = 9;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : raw.cells;

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

// Bounds-checked setter; props are optional.
function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Palette
const FOUNDATION = "stone_bricks";
const FACADE = "smooth_quartz";
const ANDESITE = "polished_andesite";
const CORNICE = "smooth_stone";
const GLASS = "light_blue_stained_glass";
const GLOW = "glowstone";
const SLAB = "light_gray_concrete";
const ROOF = "stone";

const interior = [];
const doorFrontCells = [];

// Main pass over the footprint
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUNDATION);

  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const perim = zFace || xFace;

  if (!perim) {
    // Interior: floor slabs per storey and the roof deck, air between
    interior.push([x, z, gr]);
    put(x, gr, z, SLAB);
    put(x, gr + 5, z, SLAB);
    put(x, gr + 10, z, ROOF);
    continue;
  }

  if (zFace && z === minZ && !xFace) doorFrontCells.push([x, z, gr]);

  const corner = zFace && xFace;
  const u = zFace ? x - minX : z - minZ;

  for (let r = 0; r <= 10; r++) {
    const y = gr + r;
    let block;

    if (corner) {
      // Solid corner pillar, cornice and base still apply
      block = r === 0 ? ANDESITE : r === 10 ? CORNICE : FACADE;
      put(x, y, z, block);
      continue;
    }

    if (r === 0) block = ANDESITE;                 // base course
    else if (r === 10) block = CORNICE;            // cornice / parapet cap
    else if (r === 4 || r === 9) block = FACADE;   // spandrels
    else if (r === 5) block = ANDESITE;            // storey line
    else {
      // Window band (rows 1-3 and 6-8): two glass bays, one frame column
      const isFrame = u % 3 === 0;
      if (isFrame) block = ANDESITE;
      else if ((r === 2 || r === 7) && u % 6 === 2) block = GLOW; // warm light behind glass
      else block = GLASS;
    }
    put(x, y, z, block);
  }
}

// Centre entrance on the front (lowest-z) face
const frontSorted = cells
  .filter(([x, z]) => z === minZ && (!has(x, z - 1)))
  .map(([x, z, gr]) => [x, z, gr])
  .sort((a, b) => a[0] - b[0]);

if (frontSorted.length) {
  const midX = Math.floor((minX + maxX) / 2);
  let door = frontSorted.find(([x]) => x === midX) ?? frontSorted[Math.floor(frontSorted.length / 2)];
  const [dx, dz, dg] = door;

  const dprops = (half) => ({
    facing: "north", half, hinge: "left", open: "false", powered: "false",
  });
  put(dx, dg, dz, "dark_oak_door", dprops("lower"));
  put(dx, dg + 1, dz, "dark_oak_door", dprops("upper"));

  // Lintel canopy over the entrance bay, on the facade cells beside the door
  for (const [x, z, gr] of frontSorted) {
    if (Math.abs(x - dx) <= 1) {
      put(x, gr + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Rooftop water tank on the interior cell nearest the centre
if (interior.length) {
  const cx = (minX + maxX) / 2;
  const cz = (Math.min(...cells.map((c) => c[1])) + Math.max(...cells.map((c) => c[1]))) / 2;
  let best = interior[0];
  let bestD = Infinity;
  for (const c of interior) {
    const d = (c[0] - cx) ** 2 + (c[1] - cz) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  const [tx, tz, tg] = best;
  put(tx, tg + 11, tz, "white_concrete");
  put(tx, tg + 12, tz, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
