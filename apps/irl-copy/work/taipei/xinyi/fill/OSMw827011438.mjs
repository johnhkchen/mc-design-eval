import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi commercial/office block, c. 1990s: five storeys of white concrete
// with an aluminium-frame glass window grid, a stone base, a shopfront ground floor,
// a recessed entrance, and a stone parapet. Roof top sits 26 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011438";
const W = 22, H = 38, D = 16;

const STOREY = 5;          // blocks per storey
const DECK = 25;           // roof deck / cornice level (top of body)
const PARAPET = 26;        // parapet course on the perimeter

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`) - minG;

// Outward faces of a cell: a neighbour missing from the footprint means exterior.
const DIRS = [
  { name: "north", dx: 0, dz: -1, axis: "x" },
  { name: "south", dx: 0, dz: 1, axis: "x" },
  { name: "west", dx: -1, dz: 0, axis: "z" },
  { name: "east", dx: 1, dz: 0, axis: "z" },
];
const outward = (x, z) => DIRS.filter(d => !has(x + d.dx, z + d.dz));

// Main entrance: south face, cell nearest to x = 11.
let entrance = null;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const f = outward(x, z);
  if (f.length === 1 && f[0].name === "south") {
    if (!entrance || Math.abs(x - 11) < Math.abs(entrance[0] - 11)) entrance = [x, z];
  }
}
const entKey = entrance ? `${entrance[0]},${entrance[1]}` : null;

const g = new Voxels([W, H, D]);

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gr = gnd(x, z);
  const faces = outward(x, z);
  const perim = faces.length > 0;
  const corner = faces.length >= 2;
  const isEnt = perim && `${x},${z}` === entKey;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= PARAPET; y++) {
    const yy = y % STOREY;
    const s = Math.floor(y / STOREY);

    // Floor slabs and roof deck (interior and perimeter alike).
    if (y % STOREY === 0 && y <= DECK) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (y === PARAPET) {
      if (perim) g.set(x, y, z, "stone_brick_wall");
      continue;
    }

    if (y === DECK) {
      if (perim) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (!perim) continue; // interior air behind the glass

    // Exterior shell.
    if (isEnt && y >= gr && y <= gr + 3) {
      const f = faces[0];
      const e = { x, z };
      if (y === gr) {
        g.set(x, y, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (y === gr + 1) {
        g.set(x, y, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (y === gr + 2) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else {
        g.set(x, y, z, "smooth_stone"); // canopy over the entrance
      }
      continue;
    }

    if (y === gr) {
      g.set(x, y, z, "stone_bricks"); // base course
      continue;
    }

    if (corner) {
      g.set(x, y, z, "polished_andesite"); // corner pier
      continue;
    }

    const face = faces[0];
    const idx = face.axis === "x" ? x : z;

    if (yy === 0) {
      g.set(x, y, z, "smooth_stone"); // storey line
    } else if (yy === 4) {
      g.set(x, y, z, "white_concrete"); // spandrel
    } else if (idx % 3 === 0) {
      g.set(x, y, z, "polished_andesite"); // aluminium mullion
    } else if (s >= 1 && yy === 2 && idx % 6 === 1 && s % 2 === 1) {
      g.set(x, y, z, "glowstone"); // lit office window
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Rooftop equipment on interior roof cells.
  if (!perim && x % 6 === 3 && z % 5 === 2) {
    g.set(x, PARAPET, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
