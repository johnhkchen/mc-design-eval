import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-era office block: 4 storeys of 5 blocks on a flat roof at y 21,
// white-concrete piers and glass bays, a shopfront ground storey with a centred
// double-door entrance and canopy, a cornice band, and roof plant with a mast.
const ID = "OSMw1067738183";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 33, D = 24;
const ROOF = 21;   // parapet top, blocks above lowest ground
const FLOOR = 5;   // storey height in blocks
const MAX_GROUND = 16;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => g.set(x, y, z, id, props);

const gMap = new Map();
for (const [x, z, gr] of cells) gMap.set(`${x},${z}`, gr);
const has = (x, z) => gMap.has(`${x},${z}`);
const exterior = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});
const isRing = (x, z) => {
  const e = exterior(x, z);
  return e.N || e.S || e.W || e.E;
};

// Foundation, storey slabs, cornice, parapet and facade bays.
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(Math.round(gr0), MAX_GROUND));
  const ex = exterior(x, z);
  const ring = ex.N || ex.S || ex.W || ex.E;
  const corner = (ex.N || ex.S) && (ex.W || ex.E);
  const zSide = ex.N || ex.S;
  const t = zSide ? x : z;  // position along the facade

  // Inward neighbour for lamps (single-side cells only)
  let inward = null;
  if (ring && !corner) {
    if (ex.N) inward = [x, z + 1];
    else if (ex.S) inward = [x, z - 1];
    else if (ex.W) inward = [x + 1, z];
    else if (ex.E) inward = [x - 1, z];
  }

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    const r = y % FLOOR;

    if (y === ROOF) {
      if (ring) put(x, y, z, "white_concrete");   // parapet
      continue;
    }

    // Storey slabs (also the bottom course at the cell's ground)
    if (y === gr || (r === 0 && y > 0)) {
      put(x, y, z, ring && y === 20 ? "smooth_stone" : "light_gray_concrete");
      continue;
    }

    if (!ring) continue; // interior air behind the glass

    const ground = y < FLOOR;

    if (corner) { put(x, y, z, "white_concrete"); continue; }

    // Shopfront entrance on the south face
    const doorCol = ground && ex.S && (x === 8 || x === 9) && gr <= 2;
    if (doorCol && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "oak_door", {
        facing: "south",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: x === 8 ? "left" : "right",
        open: "false",
        powered: "false",
      });
      continue;
    }
    // Entrance canopy over the doors
    if (ground && ex.S && x >= 7 && x <= 10 && gr <= 1 && y === gr + 3) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    if (ground) {
      if (r === 4 || t % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass");
      continue;
    }

    // Upper storeys: sill and head bands, mullions, glass bays
    const lamp = inward && t % 6 === 1 && !isRing(inward[0], inward[1]);
    if (lamp && r === 1) {
      put(x, y, z, "light_blue_stained_glass");
      put(inward[0], y, inward[1], "glowstone");
      continue;
    }
    if (r === 1 || r === 4) { put(x, y, z, "white_concrete"); continue; }
    if (t % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass");
  }
}

// Roof plant: a service box with a cap, and a tall mast.
for (let x = 4; x <= 7; x++) {
  for (let z = 15; z <= 18; z++) {
    if (!has(x, z)) continue;
    put(x, ROOF, z, "light_gray_concrete");
    if (x >= 5 && x <= 6 && z >= 16 && z <= 17) put(x, ROOF + 1, z, "white_concrete");
  }
}
if (has(9, 12)) {
  for (let y = ROOF; y <= ROOF + 5; y++) put(9, y, 12, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
