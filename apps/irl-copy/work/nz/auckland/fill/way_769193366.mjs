// A two-storey brick and rendered-plaster commercial block with a single-storey wing, in the Eden Terrace / Newton
// idiom: a dark brick ground floor with a shopfront under a stone string course, cream rendered upper floor between
// pilasters, a stone coping, a flat roof with a small plant box. Walls are one block thick, with an air gap behind
// the glass; the lidar roof heights are smoothed into two flat tiers (7 for the main block, 4 for the wing).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769193366.cells.json", "utf8"));

const W = 17, D = 23, Y = 20, MAIN = 7, WING = 4;
const cell = new Map();                                              // "x,z" -> { g: ground, t: top (smoothed tier) }
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, t: r >= 6 ? MAIN : WING });

const DIR = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const FACES = ["N", "E", "S", "W"];                                  // the street is north: its faces win corners
const at = (x, z) => cell.get(`${x},${z}`);
// a face is exposed where the neighbour is outside the footprint or stands lower (the main block's flank above a wing)
const exposed = (x, z) => {
  const c = at(x, z);
  return FACES.filter((f) => { const n = at(x + DIR[f][0], z + DIR[f][1]); return !n || n.t < c.t; });
};

// cells from the nearest exposed wall: 1 is the ring just inside a wall (the air gap behind the glass), 2+ is deeper
const dist = new Map(), queue = [];
for (const k of cell.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (exposed(x, z).length) { dist.set(k, 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(`${x},${z}`);
  for (const [dx, dz] of Object.values(DIR)) {
    const k = `${x + dx},${z + dz}`;
    if (at(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}

const g = new Voxels([W, Y, D]);
// a pane runs along the wall it sits in, so it joins its neighbours on that axis
const pane = (face) => (face === "N" || face === "S")
  ? { east: "true", west: "true", north: "false", south: "false" }
  : { north: "true", south: "true", east: "false", west: "false" };

for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const faces = exposed(x, z), face = faces[0], d = dist.get(k);
  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone_bricks");        // foundation: fill to the ground, nothing floats on a slope
  if (!face) {                                                         // interior: floor, air, upper floor slab, roof deck
    g.set(x, c.g, z, "smooth_stone");
    if (c.t === MAIN && d >= 2) g.set(x, 4, z, "smooth_stone");        // the upper floor, with an air gap at its edge
    g.set(x, c.t - 1, z, "smooth_stone");
    continue;
  }
  const side = face === "E" || face === "W";
  const u = side ? z : x;                                              // position along the face: bays of three
  const glazed = side ? u % 3 === 1 : u % 3 !== 0;                     // side walls get one window in three
  const put = (y, block, state) => g.set(x, y, z, block, state);
  for (let y = c.g; y < c.t; y++) {
    if (y === c.g) { put(y, "stone_bricks"); continue; }               // plinth
    if (y === c.t - 1) { put(y, "stone_brick_slab", { type: "bottom" }); continue; }   // coping
    if (face === "N" && x === 8 && z === 1) {                          // the entrance, a door under an awning
      if (y === 1) put(y, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === 2) put(y, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(y, u === 8 ? "white_concrete" : "red_concrete");
      continue;
    }
    if (face === "N" && y === 3 && u >= 7 && u <= 9) { put(y, u === 8 ? "white_concrete" : "red_concrete"); continue; }   // awning stripes
    if (c.t === MAIN && y === 3) { put(y, "polished_andesite"); continue; }   // string course over the shopfront
    const upper = c.t === MAIN && y >= 4;
    if (glazed) { put(y, "glass_pane", pane(face)); continue; }
    put(y, upper ? "smooth_quartz" : "bricks");                        // pilasters and plain wall
  }
}

// lamps in the ground-floor air gap behind some windows, and shroomlights on the upper floor
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (exposed(x, z).length) continue;
  const d = dist.get(k);
  if (d === 1 && (x + 2 * z) % 5 === 0) g.set(x, c.g + 1, z, "lantern", { hanging: "false" });
  if (c.t === MAIN && d >= 2 && (3 * x + z) % 9 === 0) g.set(x, 5, z, "shroomlight");
}

// a plant room on the main roof's middle, a 2 x 2 box standing on the deck
let sx = 0, sz = 0, n = 0;
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (c.t === MAIN && dist.get(k) >= 3) { sx += x; sz += z; n++; }
}
if (n) {
  const fx = Math.round(sx / n) - 1, fz = Math.round(sz / n) - 1;
  for (const [x, z] of [[fx, fz], [fx + 1, fz], [fx, fz + 1], [fx + 1, fz + 1]]) {
    const c = at(x, z);
    if (c && c.t === MAIN && dist.get(`${x},${z}`) >= 2) { g.set(x, 7, z, "stone_bricks"); g.set(x, 8, z, "stone_bricks"); }
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769193366.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
