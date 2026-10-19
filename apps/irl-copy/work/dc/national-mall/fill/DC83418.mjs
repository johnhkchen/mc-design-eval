// 101 Independence Ave SE: the Library of Congress, Thomas Jefferson Building (1897, Smithsonian-era Beaux-Arts).
// Pale limestone walls with a stone base, pilasters and window bays on every facade, a 2-storey main ring
// with a taller central core, and a copper-clad drum and dome over the reading-room axis. The south front
// (the Independence Ave side) has a low terrace and a central portal with doors and a transom.
// Lidar: main ring roof 12-14 above y0, core 15-17, terrace 3-5. Tiers are smoothed flat: 13, 16, and the dome.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC83418.cells.json`, "utf8"));  // [x, z, ground, roof]

const [W, H, D] = [58, 29, 53];
const g = new Voxels([W, H, D]);

// Footprint: smoothed top (block layers 0..T-1) per cell from the lidar roof
const foot = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, ground, roof] of cells) {
  const T = roof <= 6 ? (roof <= 3 ? 3 : 5) : roof <= 14 ? 13 : 16;   // terrace / main ring / core
  foot.set(key(x, z), { x, z, ground, T });
}
const cell = (x, z) => foot.get(key(x, z));
const topOf = (x, z) => (cell(x, z)?.T ?? 0);

// The dome: a copper drum (A, reaches 18), dome (B, 19) and cap (C, 20), centred on the reading-room axis
const CX = 28, CZ = 26;
const inEllipse = (x, z, rx, rz) => ((x - CX) / rx) ** 2 + ((z - CZ) / rz) ** 2 <= 1;
for (const c of foot.values()) {
  if (c.T !== 16) continue;
  if (inEllipse(c.x, c.z, 6.5, 5.5)) c.T = 18;
  if (inEllipse(c.x, c.z, 4.5, 4.0)) c.T = 19;
  if (inEllipse(c.x, c.z, 2.2, 2.0)) c.T = 20;
}

// Which way a cell's wall faces: the outside, or the lower neighbour it steps down to
const DIRS = [
  { dx: 0, dz: -1, name: "N" },
  { dx: 0, dz: 1, name: "S" },
  { dx: -1, dz: 0, name: "W" },
  { dx: 1, dz: 0, name: "E" },
];
function facadeOf(c) {
  let best = null;
  for (const d of DIRS) {
    const Tn = topOf(c.x + d.dx, c.z + d.dz);
    if (Tn < c.T && (!best || Tn < best.Tn)) best = { ...d, Tn };
  }
  return best;
}

const WIN_ROWS = new Set([5, 6, 7, 9, 10, 11, 13, 14]);  // two storeys of 3-tall windows, plus the core attic
const pending = [];   // windows and their air pockets, set after the solid masses

function blockFor(c, y, fd) {
  if (c.T >= 19 && y >= 18) return { block: "oxidized_copper" };                    // dome skin
  if (c.T <= 5) return { block: "stone_bricks" };                                    // terrace
  if (y === c.T - 1) return fd ? { block: "chiseled_quartz_block" } : { block: "deepslate_tiles" };
  if (!fd) return { block: "stone_bricks" };                                          // hidden mass
  const i = fd.dz === 0 ? c.z : c.x;                                                  // bay index along the face
  if (y < 4) return { block: "stone_bricks" };                                        // rusticated base
  if (y === 4) return { block: "quartz_slab", state: { type: "bottom", waterlogged: "false" } };  // string course
  if (y === 8 || (c.T === 16 && y === 12)) return { block: "quartz_slab", state: { type: "bottom", waterlogged: "false" } };
  if (WIN_ROWS.has(y) && y >= fd.Tn && (i % 4 === 1 || i % 4 === 2)) {
    const pane = fd.dz === 0
      ? { east: "true", west: "true", north: "false", south: "false" }                // on an E-W run, in an N/S face
      : { north: "true", south: "true", east: "false", west: "false" };
    return { win: true, block: "glass_pane", state: { ...pane, waterlogged: "false" }, i, fd };
  }
  if (i % 4 === 0) return { block: "quartz_pillar", state: { axis: "y" } };          // pilasters
  return { block: "smooth_quartz" };
}

// Pass 1: every footprint cell is solid from y 0 (foundation) up to its top
for (const c of foot.values()) {
  const fd = facadeOf(c);
  for (let y = 0; y < c.T; y++) {
    const b = blockFor(c, y, fd);
    g.set(c.x, y, c.z, b.block, b.state);
    if (b.win) {
      const bay = Math.floor(b.i / 4);
      const lit = (bay + Math.floor(y / 4)) % 3 === 0;
      pending.push({ x: c.x - fd.dx, y, z: c.z - fd.dz, lit });   // the air gap behind the glass
    }
  }
}

// Pass 2: the air behind each window (glowstone in some, warm at dusk), only where the mass is solid
for (const p of pending) {
  if (topOf(p.x, p.z) > p.y) {
    if (p.lit) g.set(p.x, p.y, p.z, "glowstone");
    else g.set(p.x, p.y, p.z, "air");
  }
}

// Terrace balustrade on the south edge, and a few copper ventilators on the main roof
for (const c of foot.values()) {
  if (c.T <= 5 && topOf(c.x, c.z + 1) === 0) g.set(c.x, c.T, c.z, "stone_brick_wall");
  if (c.T === 13 && c.x % 8 === 4 && c.z % 8 === 3) {
    const ring = DIRS.every((d) => topOf(c.x + d.dx, c.z + d.dz) === 13);
    if (ring) g.set(c.x, 13, c.z, "weathered_copper");
  }
}

// Dome top: a lantern standing on the cap
g.set(CX, 20, CZ, "lantern", { hanging: "false", waterlogged: "false" });

// South portal (z = 51, x 26..30): a recessed opening with two doors, glass beside and a transom over,
// a solid lintel, and warm light in the air behind the glass
const SZ = 51;
for (let x = 26; x <= 30; x++) for (let y = 1; y <= 5; y++) g.set(x, y, SZ, "air");
for (let x = 26; x <= 30; x++) g.set(x, 6, SZ, "smooth_quartz");                  // lintel
for (const x of [26, 29, 30]) for (const y of [1, 2]) g.set(x, y, SZ, "glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
for (let x = 26; x <= 30; x++) for (let y = 3; y <= 5; y++) g.set(x, y, SZ, "glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
for (const [x, hinge] of [[27, "left"], [28, "right"]]) {
  g.set(x, 1, SZ, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 2, SZ, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
}
for (let x = 26; x <= 30; x++) for (let y = 1; y <= 5; y++) g.set(x, y, SZ - 1, "air");   // the room behind
g.set(27, 4, SZ - 1, "glowstone");
g.set(29, 4, SZ - 1, "glowstone");

const out = `${DIR}/DC83418.nbt`;
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
