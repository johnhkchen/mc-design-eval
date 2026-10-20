import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source. Read as a 1970s-80s Taipei mid-rise: two-storey stone-based
// commercial block with a tiled facade, shopfront on the street side, a plain
// parapet, and a small rooftop penthouse. Roof is at y = 11 above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1156915584";
const W = 21, H = 23, D = 22;
const ROOF = 11;          // parapet top course
const DECK = 10;          // roof deck / cornice level
const PH_X0 = 7, PH_X1 = 13, PH_Z0 = 7, PH_Z1 = 14;   // penthouse footprint (inclusive)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gY] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gY))));
}

const inF = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`) ?? 0;
const perim = (x, z) => inF(x, z) && (!inF(x + 1, z) || !inF(x - 1, z) || !inF(x, z + 1) || !inF(x, z - 1));
const inPH = (x, z) => x >= PH_X0 && x <= PH_X1 && z >= PH_Z0 && z <= PH_Z1;

// Street face: the perimeter side facing +z if any exists, otherwise -z.
const hasPlusZ = [...ground.keys()].some((k) => {
  const [x, z] = k.split(",").map(Number);
  return perim(x, z) && !inF(x, z + 1);
});
const streetDz = hasPlusZ ? 1 : -1;
const isStreet = (x, z) => perim(x, z) && !inF(x, z + streetDz);
const streetCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => isStreet(x, z))
  .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const doorCell = streetCells.length ? streetCells[Math.floor(streetCells.length / 2)] : null;
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : "";
const doorFacing = streetDz > 0 ? "south" : "north";

const bayOf = (x, z) => x + z;

function paneProps(x, z) {
  // A wall running along x has missing neighbours on the z axis, so panes connect east/west.
  const runX = !inF(x, z - 1) || !inF(x, z + 1);
  return {
    north: runX ? "false" : "true",
    south: runX ? "false" : "true",
    east: runX ? "true" : "false",
    west: runX ? "true" : "false",
    waterlogged: "false",
  };
}

function doorProps(half) {
  return { facing: doorFacing, half, hinge: "left", open: "false", powered: "false" };
}

// Returns [id, props|null] for the building element at (x, y, z), or null for air.
function el(x, z, y) {
  if (!inF(x, z)) return null;
  const p = perim(x, z);

  // Penthouse and rooftop, above the deck.
  if (y >= 11 && inPH(x, z)) {
    const edge = x === PH_X0 || x === PH_X1 || z === PH_Z0 || z === PH_Z1;
    if (y <= 13) return edge ? ["light_gray_concrete", null] : null;
    if (y === 14) return ["stone_bricks", null];
    return null;
  }
  if (y === 15 && x === 10 && z === 10 && inPH(x, z)) return ["lightning_rod", null];

  if (y === 0) return ["stone_bricks", null];

  if (y === 1) return p ? ["stone_bricks", null] : null;                // plinth course

  if (y >= 2 && y <= 4) {                                               // ground storey
    if (!p) return null;
    const bay = bayOf(x, z);
    const pillar = bay % 3 === 0;
    if (isStreet(x, z)) {
      if (y === 4) return ["red_terracotta", null];                     // fascia
      if (`${x},${z}` === doorKey && y <= 3) {
        return ["oak_door", doorProps(y === 2 ? "lower" : "upper")];
      }
      if (pillar) return ["white_terracotta", null];
      return ["glass", null];
    }
    if (y === 4 || pillar) return ["white_terracotta", null];
    return ["glass_pane", paneProps(x, z)];
  }

  if (y === 5) return ["smooth_stone", null];                           // storey line / floor slab

  if (y >= 6 && y <= 9) {                                               // upper storey
    if (!p) return null;
    const pillar = bayOf(x, z) % 3 === 0;
    if (y === 6) return pillar ? ["white_terracotta", null] : ["smooth_stone", null];   // sill
    if (y === 9) return ["white_terracotta", null];                                     // lintel
    if (pillar) return ["white_terracotta", null];
    return ["glass_pane", paneProps(x, z)];
  }

  if (y === DECK) return p ? ["smooth_stone", null] : ["stone_bricks", null];          // cornice / roof deck

  if (y === ROOF) return p ? ["stone_brick_wall", null] : null;                        // parapet

  return null;
}

const g = new Voxels([W, H, D]);

// Foundation below ground, then the building above it.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gy = gnd(x, z);
  for (let y = 0; y < H; y++) {
    if (y < gy) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    const e = el(x, z, y);
    if (!e) continue;
    const [id, props] = e;
    if (props) g.set(x, y, z, id, props);
    else g.set(x, y, z, id);
  }
}

// Warm lights in the interior behind some windows (air cell just inside the facade).
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!perim(x, z) || inPH(x, z)) continue;
  let ix, iz;
  if (!inF(x + 1, z)) { ix = x - 1; iz = z; }
  else if (!inF(x - 1, z)) { ix = x + 1; iz = z; }
  else if (!inF(x, z + 1)) { ix = x; iz = z - 1; }
  else if (!inF(x, z - 1)) { ix = x; iz = z + 1; }
  else continue;
  if (!inF(ix, iz) || perim(ix, iz)) continue;
  const bay = bayOf(x, z);
  if (isStreet(x, z) && `${x},${z}` !== doorKey && bay % 6 === 2 && bay % 3 !== 0) {
    g.set(ix, 2, iz, "glowstone");
  } else if (!isStreet(x, z) && bay % 6 === 1 && bay % 3 !== 0) {
    g.set(ix, 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
