// TS Wilson: a single-storey mid-century block (plastered concrete, a stone plinth, a glazed shopfront-height storey,
// a clerestory band under a flat roof). The lidar roof is flat (524 of 527 cells read 7; the three noisy cells are
// smoothed to the same tier), so the massing is one flat tier on the ground, with the lower cells showing more wall.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_269460331.cells.json`, "utf8"));

const W = 24, D = 34, H = 20;
const R = 7;                       // roof tier above y 0 (smoothed)
const PARAPET = R + 1, COPING = R + 2;

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inside = (x, z) => ground.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };   // N = -z (the front), S = +z, E = +x, W = -x
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));
const interior = (x, z) => inside(x, z) && exposed(x, z).length === 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const DOOR = [9, 1];               // the front (N) face, centred on the entrance bay
const panes = [];

for (const [x, z, gr] of cells) {
  // foundation and the ground floor slab, on every cell
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");
  // flat roof covering on every cell
  put(x, R, z, "stone");

  const ex = exposed(x, z);
  if (!ex.length) continue;         // interior: air above the slab, under the roof
  const corner = ex.length > 1;
  const face = ex[0];
  const along = face === "N" || face === "S" ? x : z;
  const pier = corner || along % 3 === 0;
  const isDoor = x === DOOR[0] && z === DOOR[1];

  for (let y = gr + 1; y < R; y++) {
    const rel = y - gr;
    if (isDoor && rel <= 2) {
      put(x, y, z, "dark_oak_door", { facing: "south", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoor && rel === 3) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    if (rel === 1) { put(x, y, z, "polished_andesite"); continue; }                  // base course
    if (rel === 4) { put(x, y, z, "light_gray_concrete"); continue; }                // storey line
    if (pier) { put(x, y, z, "light_gray_concrete"); continue; }                     // piers and corners
    if (rel === 5) { put(x, y, z, "white_concrete"); continue; }                     // spandrel
    put(x, y, z, "light_blue_stained_glass_pane");                                   // glazing (rel 2, 3, 6)
    panes.push({ x, y, z, face });
  }

  // parapet and coping on the edge
  put(x, PARAPET, z, "stone_bricks");
  put(x, COPING, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Pane connections: a pane joins the glass or pier beside it in the plane of its face.
for (const p of panes) {
  const horizontal = p.face === "N" || p.face === "S";
  const side = (dx, dz) => g.val(p.x + dx, p.y, p.z + dz) !== 0 ? "true" : "false";
  const state = horizontal
    ? { north: "false", south: "false", east: side(1, 0), west: side(-1, 0) }
    : { north: side(0, -1), south: side(0, 1), east: "false", west: "false" };
  put(p.x, p.y, p.z, "light_blue_stained_glass_pane", { ...state, waterlogged: "false" });
}

// Warm light behind some windows: a glowstone in the air gap just inside the glass.
let k = 0;
for (const p of panes) {
  if (k++ % 4 !== 0) continue;
  const [dx, dz] = DIRS[p.face];
  const ix = p.x - dx, iz = p.z - dz;
  if (!inside(ix, iz) || p.y <= gnd(ix, iz)) continue;
  if (g.val(ix, p.y, iz) !== 0) continue;
  put(ix, p.y, iz, "glowstone");
}

function gnd(x, z) { return ground.get(`${x},${z}`); }

// Roof plant: find free interior footprint blocks nearest a target, so the equipment sits on the roof, not on the parapet.
const used = new Set();
function place(w, d, tx, tz) {
  let best = null;
  for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
    let ok = true;
    for (let i = 0; i < w && ok; i++) for (let j = 0; j < d && ok; j++) {
      const X = x + i, Z = z + j;
      if (!interior(X, Z) || used.has(`${X},${Z}`)) ok = false;
    }
    if (!ok) continue;
    const dd = Math.hypot(x + (w - 1) / 2 - tx, z + (d - 1) / 2 - tz);
    if (!best || dd < best.dd) best = { x, z, dd };
  }
  if (!best) return null;
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) used.add(`${best.x + i},${best.z + j}`);
  return best;
}

// Lift core: a 3x3 white block with a slab cap, the tallest thing on the roof.
const core = place(3, 3, 12, 19);
if (core) {
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    put(core.x + i, R + 1, core.z + j, "white_concrete");
    put(core.x + i, R + 2, core.z + j, "white_concrete");
    put(core.x + i, R + 3, core.z + j, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Two plant units: iron grille boxes, one block high.
for (const [tx, tz] of [[7, 26], [17, 8]]) {
  const pl = place(2, 2, tx, tz);
  if (pl) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) put(pl.x + i, R + 1, pl.z + j, "iron_block");
}

// Two skylights set into the roof tier.
for (const [tx, tz] of [[9, 13], [16, 23]]) {
  const sk = place(2, 2, tx, tz);
  if (sk) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) put(sk.x + i, R, sk.z + j, "light_blue_stained_glass");
}

const out = `${HERE}/way_269460331.nbt`;
const res = g.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, ${res.palette} palette entries, ${panes.length} panes, ${k} window slots`);
