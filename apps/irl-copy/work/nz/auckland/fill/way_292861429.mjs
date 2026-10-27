// The Guardian: a ten-storey, 1980s concrete-frame office block on the Auckland CBD ridge, as the lidar reads it.
// Roof 41-43 over the footprint, so ten storeys of 4 blocks from a datum at y 2 (the uphill ground), a tower core
// that stands to 42, and a one-cell perimeter setback that stops at 34 with a parapet coping. Light-grey concrete
// piers and spandrels, light-blue glass panes in the bays, a tinted-glass shopfront on the street face and a
// recessed door at its centre. Floors are slabs, the air between them is kept, and warm lanterns stand behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861429.cells.json", "utf8"));

const W = 24, D = 28, H = 56, DATUM = 2, STOREY = 4;
const key = (x, z) => `${x},${z}`;
const fp = new Map();                                            // "x,z" -> { g: ground, r: lidar roof }
for (const [x, z, g, r] of cells) fp.set(key(x, z), { g, r });
const inFp = (x, z) => fp.has(key(x, z));

// distance from the outline (1 = the outermost ring of footprint cells), for the setbacks
const dist = new Map();
let frontier = [];
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFp(x + dx, z + dz))) { dist.set(k, 1); frontier.push([x, z]); }
}
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = key(x + dx, z + dz);
    if (fp.has(k) && !dist.has(k)) { dist.set(k, dist.get(key(x, z)) + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}

// Flat tiers from the lidar: every cell reads 38-43 and the tower's roof sits at 41-43, so it is one tier at 42 (ten
// storeys). The one-cell perimeter steps back to 34 (eight storeys) with its own parapet.
const topOf = (x, z) => {
  const k = key(x, z); if (!fp.has(k)) return 0;
  return dist.get(k) === 1 ? 34 : 42;
};
const inMass = (x, z, Y0) => inFp(x, z) && topOf(x, z) >= Y0 + STOREY;
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const exposed = (x, z, Y0) => DIRS.filter(([, dx, dz]) => !inMass(x + dx, z + dz, Y0));

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (x >= 0 && x < W && z >= 0 && z < D) g.set(x, y, z, block, state); };

// the entrance: the street (north, z-min) face, the exposed bay nearest the middle of the face
let entrance = null;
{
  const cand = [];
  for (const [k] of fp) {
    const [x, z] = k.split(",").map(Number);
    if (z !== Math.min(...[...fp.keys()].map((q) => +q.split(",")[1]))) continue;
    const e = exposed(x, z, DATUM);
    if (e.length === 1 && e[0][0] === "north") cand.push(x);
  }
  cand.sort((a, b) => Math.abs(a - W / 2) - Math.abs(b - W / 2));
  entrance = cand[0];
}

const PANE = "light_blue_stained_glass_pane", PIER = "white_concrete", BAND = "smooth_stone", SPANDREL = "white_concrete";
const BASE = "stone_bricks", SHOP = "tinted_glass", ROOF = "gray_concrete", COPING = { block: "stone_brick_slab", state: { type: "bottom", waterlogged: "false" } };

// Foundation and plinth: solid from y 0 up to the datum under every footprint cell, so nothing floats on the slope.
// Downhill cells (ground 0) show two extra courses; the outer ring at y 1 has iron-bar vents there.
const paneState = (dir) => (dir === "north" || dir === "south" ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [k, { g: ground }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const ring = exposed(x, z, 0).length > 0;
  for (let y = 0; y < DATUM; y++) {
    if (y === 0 || !ring) { put(x, y, z, ring ? BASE : "stone"); continue; }
    const e = exposed(x, z, 0);
    const i = e[0] && (e[0][0] === "north" || e[0][0] === "south") ? x : z;
    if (ground === 0 && e.length === 1 && i % 3 !== 0) put(x, y, z, "iron_bars", paneState(e[0][0]));
    else put(x, y, z, BASE);
  }
}

// Storeys: a band (floor slab, whole footprint of the storey), two rows of glazing or piers, and a spandrel row.
// The storey whose spandrel row is the top of its cell is the roof: a gray roof inside, a parapet and coping on the edge.
const lanternSpots = [];
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  const top = topOf(x, z);
  for (let s = 0; DATUM + s * STOREY + STOREY <= top; s++) {
    const Y0 = DATUM + s * STOREY, isTop = Y0 + STOREY === top, isGround = s === 0;
    put(x, Y0, z, BAND);
    const e = exposed(x, z, Y0);
    if (!e.length) { if (isTop) put(x, Y0 + 3, z, ROOF); continue; }
    // ring cell: the facade
    const corner = e.length >= 2;
    const [face] = e[0];
    const axisIdx = face === "north" || face === "south" ? x : z;
    const pier = corner || axisIdx % 3 === 0;
    const [dname, dx, dz] = e[0];
    const inward = [x - dx, z - dz];
    if (isGround && face === "north" && x === entrance && !corner) {
      // the entrance: a stair at y 1, a door at y 2-3 (open), a glazed transom at 4, a dark canopy lintel at 5
      put(x, 1, z, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
      put(x, Y0, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "true", powered: "false" });
      put(x, Y0 + 1, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "true", powered: "false" });
      put(x, Y0 + 2, z, SHOP);
      put(x, Y0 + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    for (const yy of [Y0 + 1, Y0 + 2]) {
      if (pier) put(x, yy, z, isGround ? BASE : PIER);
      else if (isGround && face === "north") put(x, yy, z, SHOP);
      else put(x, yy, z, PANE, paneState(face));
    }
    if (isTop) {
      put(x, Y0 + 3, z, PIER);
      put(x, Y0 + 4, z, COPING.block, COPING.state);
    } else put(x, Y0 + 3, z, isGround ? BASE : SPANDREL);
    // a warm lantern standing on the floor, just inside a glazed bay
    const behindGlass = inMass(inward[0], inward[1], Y0) && exposed(inward[0], inward[1], Y0).length === 0;
    if (!pier && behindGlass && (axisIdx + s) % 4 === 1) lanternSpots.push([inward[0], Y0 + 1, inward[1]]);
  }
}
for (const [x, y, z] of lanternSpots) put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });

// the tower roof: a plant room on the core, and a parapet already set on the edge
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (topOf(x, z) === 42 && x >= 8 && x <= 14 && z >= 9 && z <= 17 && dist.get(k) >= 3) put(x, 42, z, "iron_block");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861429.nbt";
const stats = g.save(out);
console.log(JSON.stringify({ entrance, lanterns: lanternSpots.length, ...stats }));
