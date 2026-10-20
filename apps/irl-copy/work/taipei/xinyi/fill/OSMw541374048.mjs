import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey shop/office block, Xinyi District, Taipei.
// Read as a 1980s-90s cream-tile commercial building: smooth quartz piers,
// grey tinted glazing, a light-grey spandrel and cornice band, and a clear
// shopfront with a central door on the street (north) face.
// Roof at 11 blocks above the lowest ground: storeys 0-4 and 5-9, parapet at 10.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541374048";
const W = 12, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundMap = new Map();
let base = Infinity;
for (const [x, z, gr] of cells) {
  groundMap.set(key(x, z), gr);
  base = Math.min(base, gr);
}
const foot = new Set(groundMap.keys());
const gl = (x, z) => groundMap.get(key(x, z)) - base;

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const NAMES = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !foot.has(key(x + dx, z + dz)));

// Street frontage: the north (z-min) face if it is exposed, otherwise the first exposed face.
let street = null;
for (const [x, z] of groundMap.keys().map((k) => k.split(",").map(Number))) {
  const ex = exposed(x, z);
  if (ex.some(([dx, dz]) => dx === 0 && dz === -1)) { street = [0, -1]; break; }
}
if (!street) {
  for (const [x, z] of groundMap.keys().map((k) => k.split(",").map(Number))) {
    const ex = exposed(x, z);
    if (ex.length) { street = ex[0]; break; }
  }
}

// Along-face extent for each facade direction (x for north/south faces, z for east/west).
const ranges = {};
for (const k of foot) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  if (!ex.length) continue;
  const dir = ex.find(([dx, dz]) => dx === street[0] && dz === street[1]) || ex[0];
  const name = NAMES[dir.join(",")];
  const along = dir[0] !== 0 ? z : x;
  const r = ranges[name] ?? (ranges[name] = { min: Infinity, max: -Infinity });
  r.min = Math.min(r.min, along);
  r.max = Math.max(r.max, along);
}

const streetName = NAMES[street.join(",")];
const sr = ranges[streetName];
const sLen = sr.max - sr.min + 1;
let doorK = Math.floor(sLen / 2);
if (doorK % 3 === 0) doorK += 1;
const doorAlong = sr.min + doorK;

const isWindowRow = (r) => (r >= 1 && r <= 3) || (r >= 6 && r <= 8);

function placeFacade(x, z, dir) {
  const name = NAMES[dir.join(",")];
  const base0 = gl(x, z);
  const along = dir[0] !== 0 ? z : x;
  const rg = ranges[name];
  const k = along - rg.min;
  const len = rg.max - rg.min + 1;
  const pier = k === 0 || k === len - 1 || k % 3 === 0;
  const onStreet = name === streetName;
  const isDoorCol = onStreet && along === doorAlong;
  const glassProps = dir[0] !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  const doorFacing = name;

  for (let r = 0; r <= 10; r++) {
    const y = base0 + r;
    if (y >= H) continue;
    if (r === 0) { g.set(x, y, z, "smooth_stone"); continue; }
    if (r === 4 || r === 9 || r === 10) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (r === 5) { g.set(x, y, z, "light_gray_concrete"); continue; }
    // window rows 1-3 (ground) and 6-8 (upper)
    if (isDoorCol && (r === 1 || r === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: doorFacing,
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoorCol && r === 3) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (pier || !isWindowRow(r)) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    // Shopfront on the street face is clear glass; elsewhere tinted grey glazing.
    const pane = onStreet && r <= 3 ? "glass_pane" : "gray_stained_glass_pane";
    g.set(x, y, z, pane, glassProps);
  }

  // Warm light behind some upper windows on non-street faces.
  if (!onStreet && k % 6 === 2) {
    const ix = x - dir[0], iz = z - dir[1];
    if (foot.has(key(ix, iz)) && exposed(ix, iz).length === 0) {
      g.set(ix, base0 + 7, iz, "glowstone");
    }
  }
}

// Foundation, plinth, facade and interior floors/roof deck.
const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = Math.floor((minX + maxX) / 2);

for (const k of foot) {
  const [x, z] = k.split(",").map(Number);
  const b0 = gl(x, z);
  for (let y = 0; y < b0; y++) g.set(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  if (ex.length) {
    const dir = ex.find(([dx, dz]) => dx === street[0] && dz === street[1]) || ex[0];
    placeFacade(x, z, dir);
  } else {
    // interior: floor slab at storey line and roof deck, air between
    g.set(x, b0 + 5, z, "light_gray_concrete");
    g.set(x, b0 + 10, z, "light_gray_concrete");
  }
}

// Rooftop mechanical plant: two units on the deck, set back from the parapet.
for (const k of foot) {
  const [x, z] = k.split(",").map(Number);
  if (exposed(x, z).length) continue;
  const b0 = gl(x, z);
  const inCore = (x === cx || x === cx - 1) && (z - minZ === 2 || z - minZ === 3);
  if (inCore) g.set(x, b0 + 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
