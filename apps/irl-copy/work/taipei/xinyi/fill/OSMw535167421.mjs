import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s-2000s Xinyi office block: five storeys of white concrete piers,
// light-blue tinted glazing, quartz spandrels, granite plinth, and a two-tier roof
// with a set-back upper tier, parapets and a small mechanical penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167421";
const W = 19, H = 38, D = 18;

const ROOF_SLAB = 25;   // upper-tier roof deck
const PARAPET_T1 = 21;  // low parapet on the lower-tier ring
const PARAPET_T2 = 26;  // top parapet on the upper tier

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const inF = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);

// Upper tier: footprint cells whose 5x5 neighbourhood lies wholly inside the footprint
const inT2 = (x, z) => {
  if (!inF(x, z)) return false;
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      if (!inF(x + dx, z + dz)) return false;
  return true;
};
const P1 = inF;
const P2 = inT2;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (P, x, z) => P(x, z) && NB.some(([dx, dz]) => !P(x + dx, z + dz));

// Entrance on the street (high-z) face, under the ground storey
const maxZ = Math.max(...cells.map((c) => c[1]));
const doorCands = cells
  .filter(([x, z, gr]) => z === maxZ && Math.round(gr) <= 2)
  .map((c) => c[0])
  .sort((a, b) => a - b);
const door = doorCands.length
  ? { x: doorCands[Math.floor(doorCands.length / 2)], z: maxZ }
  : null;
const isDoor = (x, y, z) => {
  if (!door || x !== door.x || z !== door.z) return false;
  const gr = gOf(x, z);
  return y === gr + 1 || y === gr + 2;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Facade material for a perimeter wall cell at height y
function facade(P, x, z, y, gr) {
  const mz = !P(x, z - 1) || !P(x, z + 1); // exposed on a north/south face, runs along x
  const mx = !P(x - 1, z) || !P(x + 1, z); // exposed on an east/west face, runs along z
  const corner = mz && mx;
  const pier = corner || (mz ? x % 3 === 0 : z % 3 === 0);
  if (y === gr && gr <= 4) return "polished_granite";          // plinth course
  if (y % 5 === 0 || y % 5 === 4) return "smooth_quartz";      // storey lines and spandrels
  return pier ? "white_concrete" : "light_blue_stained_glass"; // piers and glazing
}

// Warm light set in the room behind some window bays
const lit = (x, y, z) => (x * 7 + z * 13 + y * 5) % 6 === 0;
function maybeLight(P, x, z, y, gr) {
  if (y % 5 !== 2 || y <= gr) return;
  if (!lit(x, y, z)) return;
  const ox = !P(x - 1, z) ? -1 : (!P(x + 1, z) ? 1 : 0);
  const oz = !P(x, z - 1) ? -1 : (!P(x, z + 1) ? 1 : 0);
  if ((ox === 0) === (oz === 0)) return; // corners and ambiguous cells
  const ix = x - ox, iz = z - oz;
  if (!P(ix, iz) || isEdge(P, ix, iz)) return;
  put(ix, y, iz, "glowstone");
}

for (const [x, z] of cells) {
  const gr = gOf(x, z);

  // Foundation up to the local ground, then the ground-floor slab
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");
  put(x, gr, z, "stone");
  for (const L of [5, 10, 15, 20]) if (L >= gr) put(x, L, z, "stone");

  // Lower tier facade (footprint edge) up to the terrace at y 20
  if (isEdge(P1, x, z)) {
    for (let y = gr; y <= 20; y++) {
      if (isDoor(x, y, z)) continue;
      const b = facade(P1, x, z, y, gr);
      put(x, y, z, b);
      if (b === "light_blue_stained_glass") maybeLight(P1, x, z, y, gr);
    }
    put(x, PARAPET_T1, z, "white_concrete");
  }

  // Upper set-back tier, standing on the terrace slab at y 20
  if (inT2(x, z)) {
    put(x, ROOF_SLAB, z, "stone");
    if (isEdge(P2, x, z)) {
      for (let y = 21; y <= ROOF_SLAB; y++) {
        const b = facade(P2, x, z, y, gr);
        put(x, y, z, b);
        if (b === "light_blue_stained_glass") maybeLight(P2, x, z, y, gr);
      }
      put(x, PARAPET_T2, z, "white_concrete");
    }
  }
}

// Entrance: dark oak door pair with a stone surround
if (door) {
  const gr = gOf(door.x, door.z);
  const facing = "south";
  put(door.x, gr + 1, door.z, "dark_oak_door", {
    facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, gr + 2, door.z, "dark_oak_door", {
    facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // flanking piers and a transom above the door
  for (const dx of [-1, 1]) {
    const x = door.x + dx;
    if (inF(x, door.z)) put(x, gr + 1, door.z, "white_concrete");
  }
}

// Mechanical penthouse on the upper tier, with a lightning rod
for (let x = 6; x <= 12; x++)
  for (let z = 5; z <= 11; z++)
    if (inT2(x, z)) put(x, ROOF_SLAB + 1, z, "light_gray_concrete");
for (let x = 8; x <= 10; x++)
  for (let z = 7; z <= 9; z++)
    if (inT2(x, z)) put(x, ROOF_SLAB + 2, z, "light_gray_concrete");
if (inT2(9, 8)) {
  put(9, ROOF_SLAB + 3, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
