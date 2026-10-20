import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075549";
const W = 6, H = 41, D = 9;

// Storey plan: 5 storeys of 5 blocks, roof slab at 25, parapet to 27, plant cap at 28.
const ROOF = 25;
const PARAPET_TOP = 27;
const PLANT_TOP = 28;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gmin = Math.min(...raw.map(c => c[2]));
const cells = raw.map(([x, z, g]) => [x, z, g - gmin]);
const G = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));

const inF = (x, z) => G.has(`${x},${z}`);
const isExt = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
const isCorner = (x, z) => (!inF(x - 1, z) || !inF(x + 1, z)) && (!inF(x, z - 1) || !inF(x, z + 1));
const isPier = (x, z) => isCorner(x, z) || (x + z) % 3 === 0;

// Entrance: middle exterior cell on the lowest-z face.
const zmin = Math.min(...cells.map(c => c[1]));
const doorCands = cells.filter(([x, z]) => z === zmin && isExt(x, z)).map(c => c[0]).sort((a, b) => a - b);
const doorX = doorCands.length ? doorCands[Math.floor(doorCands.length / 2)] : null;
const doorFacing = zmin === 0 ? "north" : "south";

const g = new Voxels([W, H, D]);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ext = isExt(x, z);

  if (!ext) {
    // Interior: floor slabs per storey, roof membrane, air otherwise.
    for (let y = gr; y <= ROOF; y++) {
      if (y === ROOF) g.set(x, y, z, "gray_concrete");
      else if (y === gr || (y % 5 === 0 && y > 0)) g.set(x, y, z, "smooth_stone");
      // else air (no interiors)
    }
    // Warm light behind glass in some storeys.
    for (const s of [1, 3]) {
      const y = 5 * s + 2;
      if (y > gr && (x + z) % 4 === 1) g.set(x, y, z, "shroomlight");
    }
    continue;
  }

  // Exterior envelope from ground to parapet top.
  for (let y = gr; y <= PARAPET_TOP; y++) {
    if (y === gr) {
      g.set(x, y, z, "stone_bricks"); // base course
    } else if (y === ROOF) {
      g.set(x, y, z, "smooth_quartz"); // cornice
    } else if (y > ROOF) {
      g.set(x, y, z, "white_concrete"); // parapet
    } else {
      const h = y % 5;
      if (h === 0) {
        g.set(x, y, z, "white_concrete"); // spandrel
      } else if (h === 4) {
        g.set(x, y, z, "smooth_quartz"); // storey line
      } else if (isPier(x, z)) {
        g.set(x, y, z, "smooth_quartz"); // mullion / pier
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", {
          north: String(inF(x, z - 1)),
          south: String(inF(x, z + 1)),
          east: String(inF(x + 1, z)),
          west: String(inF(x - 1, z)),
          waterlogged: "false",
        });
      }
    }
  }
}

// Entrance door on the street face, in the ground storey.
if (doorX !== null) {
  const dy = (G.get(`${doorX},${zmin}`) ?? 0) + 1;
  const doorProps = (half) => ({
    facing: doorFacing, half, hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, dy, zmin, "dark_oak_door", doorProps("lower"));
  g.set(doorX, dy + 1, zmin, "dark_oak_door", doorProps("upper"));
}

// Rooftop plant room on the interior of the roof, sitting on the roof slab.
for (const [x, z] of cells) {
  if (isExt(x, z)) continue;
  if (x >= 1 && x <= 4 && z >= 2 && z <= 6) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
    g.set(x, PLANT_TOP, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
