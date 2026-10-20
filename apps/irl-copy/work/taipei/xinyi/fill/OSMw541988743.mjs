import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 15 x 13 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey 1970s-80s Xinyi-style commercial block: light grey
// concrete frame, tinted glass with a shopfront at street level, stone belt
// courses and cornice, a parapet, and roof plant. Two storeys is the best fit
// for an 11-block roof at about 5 blocks per storey.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988743";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, e] of cells) ground.set(`${x},${z}`, e);
const fp = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const perim = (x, z) => !fp(x + 1, z) || !fp(x - 1, z) || !fp(x, z + 1) || !fp(x, z - 1);
const corner = (x, z) => (!fp(x - 1, z) || !fp(x + 1, z)) && (!fp(x, z - 1) || !fp(x, z + 1));
function outward(x, z) {
  if (!fp(x + 1, z)) return { name: "east", dx: 1, dz: 0 };
  if (!fp(x - 1, z)) return { name: "west", dx: -1, dz: 0 };
  if (!fp(x, z + 1)) return { name: "south", dx: 0, dz: 1 };
  return { name: "north", dx: 0, dz: -1 };
}

const L = Math.min(...cells.map(c => c[2]));          // lowest ground under footprint
const TOP = Math.min(L + 11, H - 1);                   // parapet top, common to all cells

// Entrance: south-facing perimeter cell nearest the centre line (x = 7).
const southEdge = cells.filter(([x, z]) => !fp(x, z + 1));
let door = null;
if (southEdge.length) {
  const [dx0, dz0, de] = southEdge.reduce((a, b) => (Math.abs(b[0] - 7) < Math.abs(a[0] - 7) ? b : a));
  door = { x: dx0, z: dz0, e: de, facing: "south" };
}

for (const [x, z, e] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < e && y < H; y++) g.set(x, y, z, "stone_bricks");

  if (!perim(x, z)) {
    // Interior: no air-hidden rooms, just floor slabs per storey and a roof.
    if (e < H) g.set(x, e, z, "smooth_stone");                 // ground floor slab
    if (L + 6 > e && L + 6 < TOP) g.set(x, L + 6, z, "smooth_stone"); // upper floor slab
    if (TOP > e) {
      g.set(x, TOP, z, "gray_concrete");                       // roof deck
      if ((x % 5 === 2) && (z % 5 === 2) && TOP + 1 < H) {
        g.set(x, TOP + 1, z, "stone_bricks");                  // roof plant box
      }
    }
    continue;
  }

  // Perimeter facade.
  g.set(x, e, z, "stone_bricks");                              // base course
  if (e >= TOP) continue;
  const pillar = corner(x, z) || ((x + z) % 3 === 0);
  const isDoor = door && door.x === x && door.z === z;
  for (let y = e + 1; y <= TOP; y++) {
    let id = "light_gray_concrete";
    let props;
    if (y === TOP) {
      id = "light_gray_concrete";                              // parapet
    } else if (y === L + 10) {
      id = "smooth_stone";                                     // cornice
    } else if (y === L + 6) {
      id = "smooth_stone";                                     // storey belt course
    } else if (isDoor && (y === e + 1 || y === e + 2)) {
      id = "dark_oak_door";
      props = { facing: door.facing, half: y === e + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    } else if (isDoor && y === e + 3) {
      id = "smooth_stone";                                     // door lintel
    } else if ((y >= L + 1 && y <= L + 4) || (y >= L + 7 && y <= L + 9)) {
      if (!pillar) id = "light_blue_stained_glass";            // tinted glazing
    }
    g.set(x, y, z, id, props);
  }
}

// Warm light behind some storey-one glazing: standing lanterns on the interior floor.
for (const [x, z, e] of cells) {
  if (!perim(x, z) || corner(x, z) || (x + z) % 3 === 0) continue;
  if ((x + z) % 6 !== 1) continue;
  if (e + 2 > L + 4) continue;
  const o = outward(x, z);
  const ix = x - o.dx, iz = z - o.dz;
  if (!fp(ix, iz) || perim(ix, iz)) continue;
  const gi = gnd(ix, iz);
  const ly = gi + 1;
  if (ly <= L + 4 && ly < TOP) g.set(ix, ly, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
