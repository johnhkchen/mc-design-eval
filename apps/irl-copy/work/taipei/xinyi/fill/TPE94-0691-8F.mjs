import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0691-8F";
const W = 51, H = 52, D = 15;
const ROOF = 40;          // roof slab top course (about 40 blocks above lowest ground)
const PARAPET_TOP = 42;
const PENT_TOP = 44;      // penthouse roof slab level

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), Math.round(gr));
const has = (x, z) => groundOf.has(key(x, z));

// Which neighbour is missing: returns {dx,dz} of the outward direction, or null if interior.
// Prefers the z-facing (street/long) faces when a cell is exposed on two sides.
function exposure(x, z) {
  if (!has(x, z - 1)) return { dx: 0, dz: -1 };
  if (!has(x, z + 1)) return { dx: 0, dz: 1 };
  if (!has(x - 1, z)) return { dx: -1, dz: 0 };
  if (!has(x + 1, z)) return { dx: 1, dz: 0 };
  return null;
}

const FACING = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };

// Entrance: on the z=0 (north) long face, cell nearest x=25.
let door = null;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const f = exposure(x, z);
  if (!f || f.dz !== -1) continue;
  if (!door || Math.abs(x - 25) < Math.abs(door.x - 25)) door = { x, z, gr: groundOf.get(key(x, z)) };
}

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gr = groundOf.get(key(x, z));
  const face = exposure(x, z);

  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // Base course / first floor slab at ground
  g.set(x, gr, z, face ? "smooth_stone" : "light_gray_concrete");

  for (let y = gr + 1; y <= ROOF; y++) {
    const r = y % 5;
    const k = Math.floor(y / 5);

    // Floor slabs at every storey line (interior and exterior); roof slab at top
    if (r === 0) {
      g.set(x, y, z, y === ROOF ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (!face) continue; // interior: air gap behind the glass

    // Facade: index along the exposed face selects the mullion rhythm
    const idx = face.dz !== 0 ? x : z;
    const mullion = idx % 3 === 0;

    if (r === 4) {                       // spandrel band under each floor
      g.set(x, y, z, "white_concrete");
      continue;
    }

    if (k === 0) {                       // ground-floor shopfront
      if (door && door.x === x && door.z === z && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: FACING[`${face.dx},${face.dz}`] ?? "north",
          half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      g.set(x, y, z, mullion ? "white_concrete" : "glass");
      continue;
    }

    // Upper storeys: glass bays between white mullions
    if (mullion) {
      g.set(x, y, z, "white_concrete");
      continue;
    }
    g.set(x, y, z, "light_blue_stained_glass");

    // Warm light: glowstone just inside some windows
    if (r === 2 && k % 2 === 1 && idx % 9 === 4) {
      const ix = x - face.dx, iz = z - face.dz;
      if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
    }
  }

  // Parapet on exposed cells above the roof slab
  if (face) {
    for (let y = ROOF + 1; y <= PARAPET_TOP; y++) g.set(x, y, z, "white_concrete");
  }
}

// Rooftop mechanical penthouse (central, set back from the parapet)
for (let x = 18; x <= 32; x++) {
  for (let z = 4; z <= 10; z++) {
    if (!has(x, z)) continue;
    for (let y = ROOF + 1; y <= PENT_TOP - 1; y++) {
      const louvre = (x + y) % 2 === 0;
      g.set(x, y, z, louvre ? "light_gray_concrete" : "stone_bricks");
    }
    g.set(x, PENT_TOP, z, "smooth_stone");
  }
}
// Sea lanterns on the penthouse corners for a warm roofline at dusk
for (const [x, z] of [[18, 4], [32, 4], [18, 10], [32, 10]]) {
  if (has(x, z)) g.set(x, PENT_TOP + 1, z, "sea_lantern");
}

g.save(`${DIR}/${ID}.nbt`);
