import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988101.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988101.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 17, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Lookup of footprint cells and their ground levels
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// Perimeter: any orthogonal neighbour outside the footprint
const missing = (x, z) => ({
  xm: !inside(x - 1, z),
  xp: !inside(x + 1, z),
  zm: !inside(x, z - 1),
  zp: !inside(x, z + 1),
});
const isPerim = (x, z) => {
  const m = missing(x, z);
  return m.xm || m.xp || m.zm || m.zp;
};
const isCorner = (x, z) => {
  const m = missing(x, z);
  return (m.xm || m.xp) && (m.zm || m.zp);
};

const S = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Palette: 1990s Taipei commercial block, white-tiled concrete with dark aluminium
// frames, tinted glass, and a light-grey cornice and parapet.
const WALL = "white_concrete";
const TRIM = "light_gray_concrete";
const PIER = "polished_andesite";
const FRAME = "gray_concrete";
const GLASS = "light_blue_stained_glass";
const BASE = "stone_bricks";
const FLOOR = "smooth_quartz";
const ROOF = "light_gray_concrete";
const DARK = "black_concrete";

// Front face = the -z side of the footprint (faces north in the block grid)
const frontCells = cells
  .filter(([x, z]) => !inside(x, z - 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : -1;

// Pass 1: foundations, base floor, and interior floor slab, for every footprint cell
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) S(x, y, z, BASE);       // foundation
  S(x, gr, z, BASE);                                   // ground floor slab
  S(x, 5, z, FLOOR);                                   // first/second floor line
  S(x, 11, z, ROOF);                                   // roof slab, flat at y=11
}

// Pass 2: exterior walls on the perimeter, with storey articulation
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const m = missing(x, z);
  const isFront = m.zm;
  const corner = isCorner(x, z);
  const mullion = (x + z) % 3 === 0;

  // Wall body from ground to cornice
  for (let y = gr + 1; y <= 10; y++) S(x, y, z, WALL);

  // Corner piers run full height
  if (corner) {
    for (let y = gr + 1; y <= 10; y++) S(x, y, z, PIER);
  }

  // Storey line and cornice bands
  S(x, 5, z, TRIM);
  S(x, 10, z, TRIM);

  // Ground floor shopfront (front face) vs upper glazing
  if (isFront && !corner) {
    if (x === doorX) {
      // Entrance: doorway above base, glass transom, canopy at lintel level
      S(x, gr + 1, z, "oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      S(x, gr + 2, z, "oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      S(x, gr + 3, z, GLASS);
    } else {
      for (let y = gr + 1; y <= gr + 3; y++) {
        S(x, y, z, mullion ? FRAME : GLASS);
      }
    }
    S(x, gr + 4, z, DARK); // canopy / fascia over shopfront
  } else if (!corner) {
    // Ground-storey glazing on the other faces
    for (let y = gr + 1; y <= gr + 3; y++) {
      S(x, y, z, mullion ? FRAME : GLASS);
    }
    S(x, gr + 4, z, TRIM);
  }

  // Upper storey glazing, storey 2 (y 6..9)
  if (!corner) {
    for (let y = 6; y <= 9; y++) {
      S(x, y, z, mullion ? FRAME : GLASS);
    }
  }

  // Parapet above the roof slab
  S(x, 12, z, WALL);
  if (corner) S(x, 13, z, PIER);
}

// Pass 3: warm lights behind some upper windows (placed in the interior cell next to the glass)
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  const m = missing(x, z);
  if (((x * 5 + z * 3) % 4) !== 0) continue;
  let ix = x, iz = z;
  if (m.zm) iz = z + 1;
  else if (m.zp) iz = z - 1;
  else if (m.xm) ix = x + 1;
  else if (m.xp) ix = x - 1;
  if (!inside(ix, iz) || isPerim(ix, iz)) continue;
  S(ix, 7, iz, "glowstone");
}

// Pass 4: roof equipment on interior roof cells (AC plant and water tank)
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (x >= 7 && x <= 9 && z >= 4 && z <= 6) {
    S(x, 12, z, "iron_block");
    S(x, 13, z, "iron_block");
  } else if (x >= 11 && x <= 12 && z >= 8 && z <= 9) {
    S(x, 12, z, TRIM);
  }
}

// Rooftop parapet trim on corner pier caps
for (const [x, z] of cells) {
  if (isPerim(x, z) && isCorner(x, z)) S(x, 14, z, TRIM);
}

g.save(OUT);
