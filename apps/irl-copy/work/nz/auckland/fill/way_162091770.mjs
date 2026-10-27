// way 162091770: no record on the footprint, so this is a 1960s-70s Auckland concrete office block (the post-war
// glass-and-precast blocks of the city): a basalt-stone plinth, pale precast piers with white belt courses, tinted
// glass in two-storey bands (glass in two-cell bays, a pier between), a glazed shopfront and a door on the low south
// face under a canopy, a 26-block tower on a 22-block body, a 4-block plant room on the tower, and a low north-east
// wing. Tiers come from the lidar roof, 3x3 median smoothed, so the spikes go. Every window is glass with an air gap
// behind it; a few gaps hold glowstone; the core is solid, with a floor line every 4 blocks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_162091770";
const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));

const X = 16, Z = 42, Y = 40;                  // footprint x 0..15, z 0..41; the tallest roof is 30
const FOUND = "stone", PLINTH = "stone_bricks", PIER = "white_concrete", SKIN = "smooth_quartz";
const GLASS = "light_blue_stained_glass", ROOF = "gray_concrete", COPING = "smooth_quartz_slab";
const DOOR = "dark_oak_door", CANOPY = "stone_brick_slab", LAMP = "lantern", GLOW = "glowstone";

const raw = new Map(), gnd = new Map();
for (const [x, z, g, r] of cells) { raw.set(`${x},${z}`, r); gnd.set(`${x},${z}`, g); }
const inF = (x, z) => raw.has(`${x},${z}`);
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// Tiers: the lidar roof's 3x3 median (drops the 1- and 11-block spikes), snapped to three flat roofs:
// the tower 26, the body 22, the low wing 12
const roof = new Map();
for (const [x, z] of cells) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) near.push(raw.get(`${x + dx},${z + dz}`));
  const t = med(near);
  roof.set(`${x},${z}`, t >= 24 ? 26 : t <= 16 ? 12 : 22);
}
// the plant room: a 4 x 6 set-back core on the tower, 4 blocks above the tower roof
for (let z = 24; z <= 29; z++) for (let x = 6; x <= 9; x++) if (roof.get(`${x},${z}`) === 26) roof.set(`${x},${z}`, 30);

const H = (x, z) => (inF(x, z) ? roof.get(`${x},${z}`) : 0);
const G = (x, z) => gnd.get(`${x},${z}`);
const solid = (x, y, z) => y >= 0 && y < H(x, z);
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, y, z) => SIDES.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

const put = new Map(), pockets = [];
const set = (x, y, z, block, state) => put.set(`${x},${y},${z}`, { block, state });

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inF(x, z)) continue;
  const h = H(x, z), gr = G(x, z);
  for (let y = 0; y < h; y++) {
    const ex = exposed(x, y, z);
    // foundation from y 0 up to this cell's ground; the exposed part is the plinth
    if (y < gr) { set(x, y, z, ex.length ? PLINTH : FOUND); continue; }
    // flat roof: a coping slab on the exposed edge, membrane inside
    if (y === h - 1) { ex.length ? set(x, y, z, COPING, { type: "top", waterlogged: "false" }) : set(x, y, z, ROOF); continue; }
    if (!ex.length) { set(x, y, z, SKIN); continue; }
    const [dx, dz] = ex[0];
    const along = dx !== 0 ? z : x;
    // entrance on the low south face: a door, and a canopy lintel over it
    if (dz === 1 && z === Z - 1 && y === 3 && x >= 10 && x <= 14) { set(x, y, z, CANOPY, { type: "top", waterlogged: "false" }); continue; }
    if (dz === 1 && z === Z - 1 && x === 12 && (y === 1 || y === 2)) {
      set(x, y, z, DOOR, { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const band = y % 4;                         // 0 floor line, 1-2 glass, 3 spandrel
    if (band === 0) { set(x, y, z, y < 4 ? PLINTH : PIER); continue; }
    if (band === 3) { set(x, y, z, SKIN); continue; }
    // ground storey: glazed shopfront with no piers; above it, glass in two-cell bays with a pier between
    if (y >= 4 && along % 3 === 0) { set(x, y, z, PIER); continue; }
    set(x, y, z, GLASS);
    const ix = x - dx, iz = z - dz;
    if (solid(ix, y, iz) && !exposed(ix, y, iz).length) pockets.push([ix, y, iz, (along + y) % 9 === 1]);
  }
}

// the air gap behind each glass: left as air, or a glowstone lamp in every ninth window
for (const [x, y, z, lit] of pockets) {
  const k = `${x},${y},${z}`;
  if (lit) put.set(k, { block: GLOW }); else put.delete(k);
}

// roof: lanterns on the tower roof, and the plant room's cornice reads from the coping rule above
for (const [k, h] of roof) {
  const [x, z] = k.split(",").map(Number);
  if (h === 26 && (x * 3 + z) % 11 === 0) set(x, 26, z, LAMP, { hanging: "false", waterlogged: "false" });
}

const g = new Voxels([X, Y, Z]);
for (const [k, v] of put) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${DIR}/${NAME}.nbt`);
console.log(`way ${NAME}: ${out.blocks} blocks, palette ${out.palette}`);
