import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538618828.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538618828.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 16, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Era/type: 1980s-90s Taipei mid-rise commercial block, two storeys over a
// stone base, white concrete piers, light-blue glazing in grey aluminium frames,
// a cornice and a plain parapet, with a rooftop plant box.
const FOUND = "stone";
const BASE = "stone_bricks";
const WHITE = "white_concrete";
const TRIM = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const ROOF = 11;          // roof deck / parapet top (about 11 blocks above lowest ground)
const STOREY = 5;         // storey line height
const CORNICE = 10;

const key = (x, z) => `${x},${z}`;
const gm = new Map();
for (const [x, z, gr] of cells) gm.set(key(x, z), Math.max(0, Math.min(ROOF - 1, gr)));
const has = (x, z) => gm.has(key(x, z));

// direction -> [dx, dz] of neighbour, outward face, and inward offset
const DIRS = {
  n: { d: [0, -1], inward: [0, 1], axis: "x" },
  s: { d: [0, 1], inward: [0, -1], axis: "x" },
  w: { d: [-1, 0], inward: [1, 0], axis: "z" },
  e: { d: [1, 0], inward: [-1, 0], axis: "z" },
};

function paneProps(face) {
  // panes on n/s faces connect east-west, on w/e faces connect north-south
  if (face === "n" || face === "s") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Entrance: on the north (min z) face, the exposed cell nearest the middle of the face,
// only where the ground floor is tall enough for a two-block door.
const nFace = cells
  .map(([x, z, gr]) => [x, z, Math.max(0, Math.min(ROOF - 1, gr))])
  .filter(([x, z]) => !has(x, z - 1));
let doorX = null;
if (nFace.length) {
  const xs = nFace.map((c) => c[0]);
  const mid = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
  const candidates = nFace.filter(([, , gr]) => gr <= 2);
  if (candidates.length) {
    candidates.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
    doorX = candidates[0][0];
  }
}
const doorZ = doorX === null ? null : nFace.find((c) => c[0] === doorX)[1];

for (const [x, z, gr] of cells) {
  const gg = Math.max(0, Math.min(ROOF - 1, gr));

  // foundation up to this cell's ground
  for (let y = 0; y < gg; y++) g.set(x, y, z, FOUND);

  const exposed = Object.keys(DIRS).filter((f) => {
    const [dx, dz] = DIRS[f].d;
    return !has(x + dx, z + dz);
  });
  const perim = exposed.length > 0;

  if (!perim) {
    // interior: floor slabs and roof deck, air between (no interiors)
    g.set(x, gg, z, TRIM);
    if (STOREY > gg) g.set(x, STOREY, z, TRIM);
    g.set(x, ROOF, z, TRIM);
    continue;
  }

  // perimeter shell
  for (let y = gg; y <= ROOF; y++) {
    if (y === gg) { g.set(x, y, z, BASE); continue; }
    if (y === ROOF) { g.set(x, y, z, WHITE); continue; }           // parapet
    if (y === CORNICE) { g.set(x, y, z, TRIM); continue; }         // cornice
    if (y === STOREY) { g.set(x, y, z, TRIM); continue; }          // storey line

    const corner = exposed.length >= 2;
    // a single exposed face is used for the facade; corners are piers
    const face = exposed[0];
    const u = DIRS[face].axis === "x" ? x : z;
    const pier = corner || u % 3 === 0;

    // entrance on the north face
    if (
      face === "n" && !corner && doorX !== null && x === doorX && z === doorZ &&
      (y === gg + 1 || y === gg + 2) && y < STOREY
    ) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gg + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (face === "n" && !corner && doorX !== null && x === doorX && z === doorZ && y === gg + 3) {
      g.set(x, y, z, TRIM); // entrance canopy fascia
      continue;
    }

    if (pier) {
      g.set(x, y, z, y < STOREY ? TRIM : WHITE);
      continue;
    }

    g.set(x, y, z, GLASS, paneProps(face));

    // warm light behind some upper windows, in the air gap of the interior cell
    if (y >= STOREY + 1 && y <= 9 && (u + y) % 4 === 0 && !corner) {
      const [ix, iz] = [x + DIRS[face].inward[0], z + DIRS[face].inward[1]];
      if (has(ix, iz) && !Object.keys(DIRS).some((f) => !has(ix + DIRS[f].d[0], iz + DIRS[f].d[1]))) {
        if (gm.get(key(ix, iz)) < y) g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// rooftop plant: a few smooth-stone boxes on the roof near the middle
for (const [x, z, gr] of cells) {
  if (x >= 6 && x <= 9 && z >= 7 && z <= 10) {
    const isEdge = !(
      has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1)
    );
    if (!isEdge) {
      g.set(x, ROOF + 1, z, "smooth_stone");
      if (x === 7 || x === 8) g.set(x, ROOF + 2, z, "smooth_stone");
    }
  }
}

g.save(OUT);
