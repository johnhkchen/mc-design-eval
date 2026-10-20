import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw827011430.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw827011430.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 5, H = 23, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const key = (x, z) => x + "," + z;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));

const minG = Math.min(...cells.map(c => c[2]));
const xMin = Math.min(...cells.map(c => c[0]));
const zMin = Math.min(...cells.map(c => c[1]));
const TOP = minG + 10;          // cornice / roof-slab course; roof surface ~ minG + 11

// Two-storey 1990s-2000s Xinyi commercial block: white concrete piers,
// glass window bays, stone base, stone string course at the floor line,
// smooth-stone cornice. Entrance on the north (street) face.
const FACES = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west",  dx: -1, dz: 0 },
  { n: "east",  dx: 1, dz: 0 },
];

// Entrance cell: centre of the north face
const entrance = has(xMin + 2, zMin) ? [xMin + 2, zMin]
  : cells.filter(([x, z]) => !has(x, z - 1)).map(c => [c[0], c[1]])[0];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const exterior = FACES.filter(f => !has(x + f.dx, z + f.dz));
  const isEntrance = entrance && x === entrance[0] && z === entrance[1];

  for (let y = gr; y <= TOP; y++) {
    const rel = y - minG;

    if (exterior.length === 0) {
      // Interior cell: only floor slabs and roof slab, air otherwise (no interiors)
      if (y === gr || rel === 5) g.set(x, y, z, "light_gray_concrete");
      else if (y === TOP) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Entrance doors (north face, centre)
    if (isEntrance && y <= gr + 1 && exterior.some(f => f.n === "north")) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Corner cells: solid pier column with the cornice/base/string course
    if (exterior.length >= 2) {
      let b = "white_concrete";
      if (y === TOP) b = "smooth_stone";
      else if (rel === 0) b = "stone_bricks";
      else if (rel === 5) b = "stone_bricks";
      g.set(x, y, z, b);
      continue;
    }

    // Single exterior face: window bays on odd u, piers on even u
    const f = exterior[0];
    const along = f.dx !== 0 ? z - zMin : x - xMin;
    const u = along;

    let b;
    if (y === TOP) b = "smooth_stone";
    else if (rel === 0) b = "stone_bricks";
    else if (rel === 5) b = "stone_bricks";
    else if (u % 2 === 0) b = "white_concrete";          // pier
    else if (rel >= 1 && rel <= 4) {
      // ground-floor shopfront glass
      b = ((u + rel) % 5 === 1 && rel >= 2) ? "glowstone" : "glass_pane";
    } else {
      // upper storey windows (rel 6..9), some lit warm
      b = ((u + rel) % 4 === 1) ? "glowstone" : "glass_pane";
    }
    g.set(x, y, z, b);
  }
}

g.save(OUT);
