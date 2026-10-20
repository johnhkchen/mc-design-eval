import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458741";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 21 x 9, roof about 11 blocks above lowest ground.
// Two storeys of 5 blocks, a cornice and parapet: a 1980s-90s Taiwanese
// low-rise commercial block with cream tile facade, red terracotta sign band,
// and a shopfront ground floor.
const W = 21, H = 23, D = 9;
const OUT = `${DIR}/${ID}.nbt`;

const key = (x, z) => `${x},${z}`;
const set = new Set(cells.map(([x, z]) => key(x, z)));
const doorKeyFor = () => {
  // Street door on the north (z = 0) face, nearest to the middle of the frontage.
  let best = Infinity, k = null;
  for (const [x, z] of cells) {
    if (!set.has(key(x, z - 1))) {
      const d = Math.abs(x - 10);
      if (d < best) { best = d; k = key(x, z); }
    }
  }
  return k;
};
const doorKey = doorKeyFor();

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

const exteriorFaces = (x, z) => DIRS.filter(d => !set.has(key(x + d.dx, z + d.dz)));
const isInterior = (x, z) => set.has(key(x, z)) && exteriorFaces(x, z).length === 0;

// Pier columns at the corners and every third bay.
const isPier = (x, z, d) => {
  const p = d.dz !== 0 ? x : z;
  const max = d.dz !== 0 ? W - 1 : D - 1;
  return p % 3 === 0 || p === 0 || p === max;
};

const paneProps = (d) =>
  d.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function pick(x, z, y, ground, exts, isExt) {
  if (!isExt) {
    // Interior: air with floor slabs only.
    if (y === ground) return ["smooth_stone"];
    if (y === 5) return ["smooth_stone"];
    if (y === 10) return ["light_gray_concrete"];
    return null;
  }
  // Exterior shell.
  if (y === ground) return ["polished_granite"]; // base course
  if (y < 5) {
    // Ground floor: shopfront.
    if (y === 4) return ["red_terracotta"]; // sign band
    if (doorKey === key(x, z) && exts.some(d => d.n === "north")) {
      if (y === ground + 1) return ["dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === ground + 2) return ["dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
      if (y === ground + 3) return ["white_concrete"]; // transom
    }
    const win = exts.find(d => !isPier(x, z, d));
    if (win && y > ground && y <= ground + 3) return ["light_blue_stained_glass_pane", paneProps(win)];
    return ["white_concrete"];
  }
  if (y === 5) return ["smooth_quartz"]; // spandrel / floor line
  const win = exts.find(d => !isPier(x, z, d));
  if (y === 6) return win ? ["quartz_slab", { type: "bottom", waterlogged: "false" }] : ["smooth_quartz"];
  if (y <= 8) return win ? ["light_blue_stained_glass_pane", paneProps(win)] : ["smooth_quartz"];
  if (y === 9) return win ? ["white_concrete"] : ["smooth_quartz"]; // lintel
  if (y === 10) return ["smooth_quartz"]; // cornice
  if (y === 11) return ["white_concrete"]; // parapet
  return null;
}

const g = new Voxels([W, H, D]);

for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.min(H - 1, gr | 0));
  const exts = exteriorFaces(x, z);
  const isExt = exts.length > 0;
  // Foundation up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  // Body, floors, roof, parapet.
  for (let y = ground; y <= 11 && y < H; y++) {
    const b = pick(x, z, y, ground, exts, isExt);
    if (!b) continue;
    if (b[1]) g.set(x, y, z, b[0], b[1]);
    else g.set(x, y, z, b[0]);
  }
}

// Warm light behind some upper-floor windows (only where an interior cell sits behind the glass).
for (const [x, z] of cells) {
  const exts = exteriorFaces(x, z);
  for (const d of exts) {
    if (isPier(x, z, d)) continue;
    const p = d.dz !== 0 ? x : z;
    if (p % 6 !== 1) continue;
    const ix = x - d.dx, iz = z - d.dz;
    if (isInterior(ix, iz)) g.set(ix, 7, iz, "glowstone");
    break;
  }
}

// Roof equipment on interior roof cells: a water-tank plinth and an antenna.
const roofOk = (x, z) => isInterior(x, z);
let tankOk = true;
for (let x = 14; x <= 16; x++) for (let z = 3; z <= 5; z++) if (!roofOk(x, z)) tankOk = false;
if (tankOk) {
  for (let x = 14; x <= 16; x++) for (let z = 3; z <= 5; z++) g.set(x, 11, z, "gray_concrete");
  g.set(15, 12, 4, "light_gray_concrete");
  g.set(15, 13, 4, "light_gray_concrete");
}
if (roofOk(4, 4)) {
  for (let y = 11; y <= 14; y++) {
    g.set(4, y, 4, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(OUT);
