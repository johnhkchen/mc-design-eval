import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403006";
const W = 23, H = 23, D = 19;

// Two-storey mid-century commercial block: white concrete frame, stone base,
// blue-glass upper storey, shopfront at grade, parapet and rooftop plant.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(([x, z, g]) => [x, z, Math.max(0, Math.round(g))]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);
const inside = (x, z) => ground.has(key(x, z));

const DIRS = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];

function exposedFaces(x, z) {
  return DIRS.filter((d) => !inside(x + d.dx, z + d.dz));
}

// Door: centre of the north-facing (min z) exposed run.
const northCells = cells
  .filter(([x, z]) => exposedFaces(x, z).some((f) => f.dz === -1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;
const doorZ = doorX === null ? null : cells.find(([x, z]) => x === doorX && exposedFaces(x, z).some((f) => f.dz === -1))[1];
const doorKey = doorX === null ? null : key(doorX, doorZ);

const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length;
const cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;

const v = new Voxels([W, H, D]);

// Wall composition on exterior cells, y from ground to 10.
function wallBlock(y, t, g) {
  if (y === g) return ["stone_bricks"];           // base course
  if (y === 5) return ["smooth_stone"];           // storey line
  if (y === 10) return ["smooth_stone"];          // cornice band
  if (y <= 4) {                                   // ground storey / shopfront
    if (y === 4) return ["white_concrete"];       // lintel
    if (t % 4 === 0) return ["white_concrete"];   // piers
    if (y === 2 && t % 8 === 1) return ["glowstone"];
    return ["glass"];
  }
  if (y === 6) return ["white_concrete"];         // upper lintel
  // upper windows y 7..9
  if (t % 4 === 0) return ["white_concrete"];
  if (y === 8 && t % 8 === 2) return ["glowstone"];
  return ["light_blue_stained_glass"];
}

for (const [x, z, g] of cells) {
  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");

  // Roof slab on every footprint cell at y 11.
  if (g <= 11) v.set(x, 11, z, "light_gray_concrete");

  const faces = exposedFaces(x, z);
  if (faces.length > 0) {
    // Choose facade orientation: north, south, west, east priority.
    const face = DIRS.find((d) => faces.includes(d));
    const t = face.dz !== 0 ? x : z;
    const isDoorCell = key(x, z) === doorKey;

    for (let y = g; y <= 10; y++) {
      if (isDoorCell && (y === g || y === g + 1)) continue; // door set below
      const [block, props] = [wallBlock(y, t, g)[0], undefined];
      v.set(x, y, z, block, props);
    }

    if (isDoorCell) {
      v.set(x, g, z, "dark_oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      v.set(x, g + 1, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
    }

    // Parapet on the perimeter.
    if (g <= 12) v.set(x, 12, z, "white_concrete");
  } else {
    // Interior cell: floor slab at storey line.
    if (g <= 5) v.set(x, 5, z, "smooth_stone");
  }
}

// Rooftop plant: AC units and a small mechanical box in the deep interior.
for (const [x, z, g] of cells) {
  const deep = [-1, 0, 1].every((a) => [-1, 0, 1].every((b) => inside(x + a, z + b)));
  if (!deep || g > 11) continue;
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 1) {
    v.set(x, 12, z, "iron_block");
    if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) < 1) v.set(x, 13, z, "light_gray_concrete");
  }
}

v.save(`${DIR}/${ID}.nbt`);
