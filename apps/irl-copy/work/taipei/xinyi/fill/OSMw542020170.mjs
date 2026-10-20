import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542020170";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 18, H = 23, D = 9;
const g = new Voxels([W, H, D]);

// Materials: 1980s-style Taipei shophouse-office, tiled white concrete frame,
// red fascia over a glazed ground-floor shopfront, flat roof with parapet.
const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const WALL = "white_concrete";
const FRAME = "light_gray_concrete";
const GLASS = "glass_pane";
const FASCIA = "red_concrete";
const FLOOR = "smooth_stone";
const DECK = "smooth_stone";
const PARAPET = "smooth_stone_slab";

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const minG = Math.min(...cells.map((c) => c[2]));
const SLAB = minG + 10;   // flat roof deck: 2 storeys of ~5 blocks above lowest ground
const FLOOR2 = minG + 5;  // second-floor slab line

// Outward-facing directions of a footprint cell
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const outward = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isEdge = (x, z) => outward(x, z).length > 0;

// Facade block by absolute storey offset o (0 = lowest ground) and along-face coordinate u
function facade(o, u) {
  if (o === 0) return BASE;
  if (o === 4) return FASCIA;
  if (o < 4) return u % 3 === 1 ? GLASS : FRAME;   // shopfront glazing with mullions
  if (o === 5 || o === 9) return FRAME;            // floor bands / cornice line
  if (o < 9) return u % 3 === 1 ? GLASS : WALL;    // upper window grid
  return WALL;
}

// Pick entrance: an edge cell facing north (street side) nearest the middle, else any edge cell
let entrance = null;
{
  const cand = [];
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    for (const d of outward(x, z)) cand.push({ x, z, d });
  }
  const north = cand.filter((c) => c.d.name === "north");
  const pool = north.length ? north : cand;
  pool.sort((a, b) => Math.abs(a.x - (W - 1) / 2) - Math.abs(b.x - (W - 1) / 2));
  entrance = pool[0] || null;
}

// 1) Foundation fill, walls, ground floor and interior floors
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const dirs = outward(x, z);
  if (dirs.length > 0) {
    const face = dirs[0];
    const u = face.dz !== 0 ? x : z;
    for (let y = gr; y < SLAB; y++) {
      const o = y - minG;
      g.set(x, y, z, facade(o, u));
    }
  } else {
    if (gr < SLAB) g.set(x, gr, z, FLOOR);
    if (FLOOR2 >= gr && FLOOR2 < SLAB) g.set(x, FLOOR2, z, FLOOR);
  }
}

// Floor slabs at the second-floor line for edge cells are already the FRAME band (o=5).

// 2) Roof deck over every cell, parapet on the perimeter
for (const [x, z, gr] of cells) {
  if (gr <= SLAB) g.set(x, SLAB, z, DECK);
  if (isEdge(x, z)) {
    g.set(x, SLAB + 1, z, PARAPET, { type: "bottom", waterlogged: "false" });
  }
}

// 3) Warm light behind some upper and shopfront windows (interior cell just inside the glass)
for (const [x, z, gr] of cells) {
  const dirs = outward(x, z);
  if (!dirs.length) continue;
  const face = dirs[0];
  const u = face.dz !== 0 ? x : z;
  const ix = x - face.dx, iz = z - face.dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  if (u % 6 === 1) {
    const y = minG + 7;
    if (y >= ground.get(key(ix, iz)) && y < SLAB) g.set(ix, y, iz, "glowstone");
  }
  if (u % 6 === 4) {
    const y = minG + 2;
    if (y >= ground.get(key(ix, iz)) && y < SLAB) g.set(ix, y, iz, "shroomlight");
  }
}

// 4) Entrance: iron-framed glass door on the street face with a small canopy band inside
if (entrance) {
  const { x, z, d } = entrance;
  const gr = ground.get(key(x, z));
  const yd = gr + 1;
  g.set(x, yd, z, "iron_door", { facing: d.name, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, yd + 1, z, "iron_door", { facing: d.name, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel above the door (stays within the wall column)
  if (yd + 2 < SLAB) g.set(x, yd + 2, z, FRAME);
}

// 5) Roof equipment: a pair of plant boxes on the roof near the centre
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (x >= 6 && x <= 7 && z >= 3 && z <= 5 && !isEdge(x, z)) {
    g.set(x, SLAB + 1, z, FRAME);
    if (x === 6 && z === 4) g.set(x, SLAB + 2, z, "iron_block");
  }
}

g.save(`${dir}/${id}.nbt`);
