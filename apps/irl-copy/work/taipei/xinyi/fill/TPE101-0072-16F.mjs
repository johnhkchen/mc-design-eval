import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE101-0072-16F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 2012 Xinyi-district office tower: 16 storeys, ~78 blocks to roof.
// Rectangular glass-and-concrete slab, stepped back at storey 12 to an inner
// core, with a granite plinth, quartz parapets, mullioned glass and a crown.
const W = 65, H = 90, D = 36;
const ROOF = 78;
const STOREYS = 16;
const SETBACK = 12;
const IX = 8;   // inset of the upper core in x (cells from each bbox edge)
const IZ = 5;   // inset of the upper core in z

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const x0 = Math.min(...xs), x1 = Math.max(...xs);
const z0 = Math.min(...zs), z1 = Math.max(...zs);

// storey boundaries, evenly spread so the roof lands exactly on ROOF
const B = Array.from({ length: STOREYS + 1 }, (_, k) => Math.round((k * ROOF) / STOREYS));
const TOP_LOW = B[SETBACK];

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

const g = new Voxels([W, H, D]);

function put(x, y, z, name, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

function inCore(x, z) {
  return x >= x0 + IX && x <= x1 - IX && z >= z0 + IZ && z <= z1 - IZ;
}

// top (exclusive) of a footprint cell's solid stack; -1 outside footprint
function topOf(x, z) {
  if (!ground.has(key(x, z))) return -1;
  return inCore(x, z) ? ROOF : TOP_LOW;
}

// outward directions where the neighbour column has ended at or below y
function exposure(x, z, y) {
  return DIRS.filter((d) => topOf(x + d.dx, z + d.dz) <= y);
}

function storeyOf(y) {
  for (let k = STOREYS - 1; k >= 0; k--) if (y >= B[k]) return k;
  return 0;
}

const mid = (x0 + x1) / 2;
const mastCx = Math.round(mid);
const mastCz = Math.round((z0 + z1) / 2);

// entrances sit on both street faces (min z and max z), centred on the lobby
function isEntrance(d, along, s) {
  return s === 0 && (d.n === "north" || d.n === "south") && Math.abs(along - mid) <= 3;
}

// block chooser for the main shell
function blockAt(x, z, y, T, gr) {
  if (y < gr) return ["stone_bricks"];
  if (y === T) {
    return exposure(x, z, T - 1).length > 0 ? ["smooth_quartz"] : ["light_gray_concrete"];
  }
  if (y > T) return null;
  if (y === gr) return ["polished_granite"]; // plinth course

  const s = storeyOf(y);
  const b = B[s];
  const h = B[s + 1] - b;
  const yy = y - b;

  if (yy === 0) return ["light_gray_concrete"]; // floor slab

  const exp = exposure(x, z, y);
  if (exp.length === 0) return null; // interior: air

  if (yy === h - 1) {
    // spandrels alternate colour so the storey stripes do not read as flat banding
    return s % 2 === 0 ? ["gray_concrete"] : ["stone"];
  }

  // corners carry a full-height pillar
  if (exp.length >= 2) return ["white_concrete"];

  const d = exp[0];
  const along = d.dz === 0 ? x - x0 : z - z0;
  const alongAbs = d.dz === 0 ? x : z;

  // entrances: doors, glass lobby, lintel and canopy slab above
  if (isEntrance(d, alongAbs, s)) {
    if (yy === 1 && y === gr + 1) return ["iron_door", { facing: d.n, half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (yy === 2 && y === gr + 2) return ["iron_door", { facing: d.n, half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (y === gr + 3) return ["smooth_quartz"]; // lintel over the doors
    if (y === gr + 4) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }]; // canopy
    if (y < gr + 4 && Math.abs(alongAbs - mid) <= 2) return ["light_blue_stained_glass"];
  }

  // granite base course above the ground floor slab
  if (s === 0 && yy === 1) return ["polished_granite"];

  if (along % 3 === 0) return ["white_concrete"]; // mullion / frame
  return ["light_blue_stained_glass"];
}

// main pass
for (const [x, z, gr] of cells) {
  const T = topOf(x, z);
  for (let y = 0; y <= T; y++) {
    const r = blockAt(x, z, y, T, gr);
    if (r) put(x, y, z, r[0], r[1]);
  }
}

// lobby lights just inside each entrance, and warm lights behind windows
for (const [x, z, gr] of cells) {
  const T = topOf(x, z);
  const exp = exposure(x, z, gr + 1);
  for (const d of exp) {
    const alongAbs = d.dz === 0 ? x : z;
    if (isEntrance(d, alongAbs, 0) && Math.abs(alongAbs - mid) <= 2) {
      const ix = x - d.dx, iz = z - d.dz;
      if (topOf(ix, iz) > gr + 1) put(ix, gr + 1, iz, "glowstone");
    }
  }
  for (let y = gr + 1; y < T; y++) {
    const s = storeyOf(y);
    if (s === 0 || s % 3 !== 1) continue;
    const yy = y - B[s];
    const h = B[s + 1] - B[s];
    if (yy !== 2 || yy >= h - 1) continue;
    const e = exposure(x, z, y);
    if (e.length !== 1) continue;
    const d = e[0];
    const along = d.dz === 0 ? x - x0 : z - z0;
    if (along % 3 === 0 || along % 6 !== 2) continue;
    const ix = x - d.dx, iz = z - d.dz;
    if (topOf(ix, iz) > y) put(ix, y, iz, "glowstone");
  }
}

// rooftop plant boxes on the setback terrace
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const T = topOf(x, z);
  if (T !== TOP_LOW || inCore(x, z)) continue;
  if (exposure(x, z, T - 1).length > 0) continue;
  if ((x - x0) % 9 !== 4 || (z - z0) % 7 !== 3) continue;
  put(x, T, z, "iron_block");
  put(x, T + 1, z, "iron_block");
}

// crown: mechanical penthouse on the core roof, then a slim mast
for (let x = mastCx - 6; x <= mastCx + 6; x++) {
  for (let z = mastCz - 4; z <= mastCz + 4; z++) {
    if (topOf(x, z) !== ROOF) continue;
    const edge = Math.abs(x - mastCx) === 6 || Math.abs(z - mastCz) === 4;
    put(x, ROOF + 1, z, edge ? "smooth_quartz" : "light_gray_concrete");
    put(x, ROOF + 2, z, edge ? "smooth_quartz" : "light_gray_concrete");
  }
}
for (let x = mastCx - 1; x <= mastCx + 1; x++) {
  for (let z = mastCz - 1; z <= mastCz + 1; z++) {
    if (topOf(x, z) !== ROOF) continue;
    put(x, ROOF + 3, z, "white_concrete");
    put(x, ROOF + 4, z, "white_concrete");
  }
}
for (let y = ROOF + 5; y <= ROOF + 10; y++) {
  if (topOf(mastCx, mastCz) === ROOF) put(mastCx, y, mastCz, "white_concrete");
}
if (topOf(mastCx, mastCz) === ROOF) put(mastCx, ROOF + 11, mastCz, "sea_lantern");

g.save(`${DIR}/${ID}.nbt`);
