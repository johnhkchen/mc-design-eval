import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833542";
const cells = JSON.parse(readFileSync(BASE + ".cells.json", "utf8"));

const W = 20, H = 23, D = 22;
const ROOF_TOP = 11;   // parapet top, 11 blocks above lowest ground
const DECK = 10;       // roof deck (cornice band) under the parapet
const FLOOR_LINE = 5;  // second-storey floor line

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(key(x, z), Math.max(0, Math.round(gr)));
}
const has = (x, z) => G.has(key(x, z));
const gAt = (x, z) => G.get(key(x, z));

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Faces: outward normal (dx,dz), inward step (ix,iz), axis along which t runs.
const dirs = [
  { name: "north", dx: 0, dz: -1, ix: 0, iz: 1, axis: "x" },
  { name: "south", dx: 0, dz: 1, ix: 0, iz: -1, axis: "x" },
  { name: "west", dx: -1, dz: 0, ix: 1, iz: 0, axis: "z" },
  { name: "east", dx: 1, dz: 0, ix: -1, iz: 0, axis: "z" },
];

const paneProps = (d) =>
  d.axis === "x"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Facade material for a perimeter cell at height y. Returns { id, props? } or null.
function facadeBlock(d, t, y, gr, corner) {
  if (y === gr + 1) return { id: "polished_andesite" };      // base course
  if (y === ROOF_TOP) return { id: "white_concrete" };       // parapet
  if (y === DECK) return { id: "smooth_quartz" };            // cornice band
  if (y === FLOOR_LINE) return { id: "smooth_quartz" };      // storey line
  if (y === 4) return { id: "stone_bricks" };                // ground-floor lintel
  if (y === 6 || y === 9) return { id: "light_gray_concrete" }; // spandrels
  const winRow = (y >= 2 && y <= 3) || (y >= 7 && y <= 8);
  if (winRow && !corner && (t % 4 === 1 || t % 4 === 2)) {
    return { id: "light_blue_stained_glass_pane", props: paneProps(d) };
  }
  return { id: "white_concrete" };                           // piers and frames
}

// Pass 1: foundations, interior, facades, roof.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground, surface at gr.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  // Storeys up to the parapet.
  for (let y = gr + 1; y <= ROOF_TOP; y++) {
    const faces = dirs.filter((d) => !has(x + d.dx, z + d.dz));
    if (faces.length > 0) {
      const corner = faces.length > 1;
      const d = faces[0];
      const t = d.axis === "x" ? x : z;
      const b = facadeBlock(d, t, y, gr, corner);
      if (b) put(x, y, z, b.id, b.props);
    } else {
      // Interior: floor slabs at storey lines and roof deck; air otherwise.
      if (y === FLOOR_LINE || y === DECK) put(x, y, z, "light_gray_concrete");
    }
  }
}

// Pass 2: entrance on the south (max z) face, with lantern above.
if (has(10, D - 1) && gAt(10, D - 1) <= 1) {
  const gr = gAt(10, D - 1);
  put(10, gr + 1, D - 1, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(10, gr + 2, D - 1, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(10, gr + 3, D - 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 3: warm lights set two cells behind selected windows (air gap at depth 1).
const fullyInside = (x, z) => dirs.every((d) => has(x + d.dx, z + d.dz));
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  for (const d of dirs) {
    if (has(x + d.dx, z + d.dz)) continue; // only from perimeter cells
    const t = d.axis === "x" ? x : z;
    const ix2 = x + 2 * d.ix, iz2 = z + 2 * d.iz;
    if (!has(ix2, iz2) || !fullyInside(ix2, iz2)) continue;
    const gi = gAt(ix2, iz2);
    // Upper-floor lights behind selected windows.
    if (t % 8 === 1 && gi < 7) put(ix2, 7, iz2, "glowstone");
    // Ground-floor shroomlight behind selected shopfront windows.
    if (t % 8 === 5 && gi < 3) put(ix2, 3, iz2, "shroomlight");
  }
}

// Pass 4: rooftop plant on the deck, inside the footprint.
const plantBox = (x0, x1, z0, z1) => {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z) || gAt(x, z) > DECK) continue;
      put(x, ROOF_TOP, z, "light_gray_concrete");
    }
  }
};
plantBox(5, 8, 8, 11);
for (let x = 6; x <= 7; x++) {
  for (let z = 9; z <= 10; z++) {
    if (!has(x, z) || gAt(x, z) > DECK) continue;
    put(x, ROOF_TOP + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

vox.save(BASE + ".nbt");
