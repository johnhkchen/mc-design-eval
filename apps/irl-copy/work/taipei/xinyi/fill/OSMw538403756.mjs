import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403756";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 13 x 14 footprint, roof ~11 above lowest ground.
// Read as a 2-storey (5-block storeys) reinforced-concrete shophouse with a
// shopfront at ground level on the south (Xinyi road) face, white concrete
// piers, light-blue glass bays, red sign band, and a flat roof with a parapet.
const W = 13, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
for (const [x, z] of cells) {
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
}

const FACES = [
  { n: "S", dx: 0, dz: 1 },
  { n: "N", dx: 0, dz: -1 },
  { n: "E", dx: 1, dz: 0 },
  { n: "W", dx: -1, dz: 0 },
];

// Facade block for an exposed face at storey-relative level rel (0..11).
function faceBlock(f, x, z, rel, gr) {
  const isFront = f.n === "S";
  const u = f.dx ? z : x;
  const lo = f.dx ? zmin : xmin;
  const pier = (u - lo) % 3 === 0;

  if (rel === 0) return "polished_andesite";              // base course
  if (rel === 5 || rel === 10 || rel === 11) return "light_gray_concrete"; // storey lines, roof slab, parapet cap

  if (isFront && rel <= 4) {                               // shopfront storey
    if (rel === 4) return "red_terracotta";                // sign band
    if (pier) return "polished_andesite";
    if (rel === 2 && (u - lo) % 6 === 1) return "glowstone"; // warm light behind glass
    return "light_blue_stained_glass";
  }

  // upper storeys (rel 1..4 and 6..9)
  const r = rel <= 4 ? rel : rel - 5;
  if (pier) return "white_concrete";
  if (r === 1 || r === 4) return "light_gray_concrete";    // sill / lintel
  if (r === 2 && (u - lo + gr + rel) % 9 === 4) return "glowstone";
  return "light_blue_stained_glass";
}

// Pick the front door cell: south-face edge cell nearest the middle of the front.
const frontCells = [];
for (const [x, z] of cells) {
  if (!has(x, z + 1)) frontCells.push([x, z]);
}
const midX = Math.floor((xmin + xmax) / 2);
frontCells.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
const doorCell = frontCells.length ? frontCells[0] : null;

// Roof plant: two small units near the centre of the roof, where interior.
const cx = Math.floor((xmin + xmax) / 2), cz = Math.floor((zmin + zmax) / 2);
const plant = new Set([`${cx},${cz}`, `${cx + 1},${cz}`]);

for (const [x, z, gr] of cells) {
  const base = gr;
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  const faces = FACES.filter((f) => !has(x + f.dx, z + f.dz));
  const front = faces.find((f) => f.n === "S") || faces[0];

  if (!front) {
    // Interior cell: floor slabs and roof slab only; air between (no interior).
    g.set(x, base, z, "smooth_stone");
    g.set(x, base + 5, z, "smooth_stone");
    g.set(x, base + 10, z, "smooth_stone");
  } else {
    // Exposed cell: full facade column rel 0..11.
    for (let rel = 0; rel <= 11; rel++) {
      const y = base + rel;
      if (doorCell && x === doorCell[0] && z === doorCell[1] && front.n === "S") {
        if (rel === 1) { g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (rel === 2) { g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      }
      g.set(x, y, z, faceBlock(front, x, z, rel, gr));
    }
  }

  // Interior floor/roof slabs (also under edge cells' interior rows).
  if (front) {
    g.set(x, base + 10, z, "light_gray_concrete");
  }

  // Roof plant on interior roof cells.
  if (!front && plant.has(`${x},${z}`)) {
    g.set(x, base + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
