import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, Xinyi district, 1990s Taipei idiom:
// white render facade, light-grey string courses, tinted shopfront glass on the
// ground floor, blue-glass upper windows with concrete mullions, flat roof with
// a parapet and rooftop AC plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542009189";
const W = 23, D = 18, H = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const L = Math.min(...cells.map((c) => c[2])); // lowest ground = storey datum
const PARAPET_Y = L + 11;                       // ~11 blocks above lowest ground
if (PARAPET_Y >= H) throw new Error(`parapet ${PARAPET_Y} exceeds height ${H}`);

// Palette
const FOUND = "stone";
const BASE = "stone_bricks";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const SHOP = "tinted_glass";
const GLASS = "light_blue_stained_glass";
const FLOOR = "polished_andesite";
const ROOF = "gray_concrete";
const PLANT = "iron_block";
const LAMP_A = "glowstone";
const LAMP_B = "shroomlight";

const DV = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// Outward-facing sides of a footprint cell (empty => interior)
function outFaces(x, z) {
  const f = [];
  if (!has(x, z + 1)) f.push("south");
  if (!has(x, z - 1)) f.push("north");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x - 1, z)) f.push("west");
  return f;
}

// Street frontage = south (+z) face; entrance at the middle of its cells
const frontCells = cells
  .filter(([x, z]) => outFaces(x, z).includes("south"))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : -1;

// Pass 1: foundations, floors, walls, storey bands, roof
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const faces = outFaces(x, z);
  const perimeter = faces.length > 0;
  const face = faces[0];
  const idx = face === "north" || face === "south" ? x : z;

  if (!perimeter) {
    // Ground-floor interior slab
    g.set(x, gr, z, FLOOR);
  }

  for (let y = gr; y <= L + 10; y++) {
    const k = y - L;
    if (perimeter) {
      let m;
      if (k === 0) m = BASE;
      else if (k >= 1 && k <= 3) {
        m = idx % 4 === 0 ? WALL : SHOP;
      } else if (k === 4 || k === 5 || k === 9) m = BAND;
      else if (k >= 6 && k <= 8) m = idx % 4 === 0 ? WALL : GLASS;
      else m = WALL; // k === 10, parapet base
      g.set(x, y, z, m);
    } else {
      // Interior: upper storey floor slab at datum+5, roof deck at datum+10
      if (k === 5) g.set(x, y, z, FLOOR);
      else if (k === 10) g.set(x, y, z, ROOF);
    }
  }

  if (perimeter) {
    // Parapet cap
    g.set(x, PARAPET_Y, z, BAND);
  }
}

// Pass 2: warm lights behind selected windows (only where interior exists)
for (const [x, z, gr] of cells) {
  const faces = outFaces(x, z);
  if (!faces.length) continue;
  const face = faces[0];
  const idx = face === "north" || face === "south" ? x : z;
  const [dx, dz] = DV[face];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || outFaces(ix, iz).length) continue; // need true interior

  const igr = groundAt(ix, iz);
  // Upper storey: glowstone on the floor slab behind a window
  if (idx % 8 === 2) g.set(ix, L + 6, iz, LAMP_A);
  // Ground floor shop: shroomlight standing on the interior floor
  if (idx % 6 === 3) g.set(ix, igr + 1, iz, LAMP_B);
}

// Pass 3: entrance door on the street front, with a lintel band over it
for (const [x, z, gr] of cells) {
  if (x !== doorX) continue;
  if (!outFaces(x, z).includes("south")) continue;
  g.set(x, gr + 1, z, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gr + 2, z, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gr + 3, z, BAND);
}

// Pass 4: rooftop plant (AC units) on the roof deck, inset from the parapet
for (const [x, z, gr] of cells) {
  if (outFaces(x, z).length) continue;
  if (gr > L + 10) continue;
  const inset = x >= 3 && x <= W - 4 && z >= 3 && z <= D - 4;
  if (inset && (x + z) % 7 === 0) {
    g.set(x, L + 11, z, PLANT);
  }
}

g.save(`${DIR}/${ID}.nbt`);
