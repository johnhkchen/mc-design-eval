// Auckland, way 769193364: an interwar (1920s-30s) brick commercial block on Maungawhau's slope. Two storeys on a stone
// plinth that steps down with the lidar ground (the downhill side shows the extra courses): shopfront glass on the ground
// storey, a cream fascia, string course, lintel and cornice over the upper windows, a brick parapet, and a single-storey
// brick wing on the lower north-west. A recessed entrance on the north front has lanterns under its lintel. Mass is solid
// except an air pocket behind each pane (floor slabs carry the storeys above); some pockets hold warm lamps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769193364.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769193364.nbt";
const W = 21, D = 16, H = 23;
const ix = (x, z) => z * W + x;
const inF = new Uint8Array(W * D), gnd = new Int8Array(W * D), roof = new Float64Array(W * D);
for (const [x, z, gl, r] of JSON.parse(readFileSync(CELLS, "utf8"))) { inF[ix(x, z)] = 1; gnd[ix(x, z)] = gl; roof[ix(x, z)] = r; }
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D && inF[ix(x, z)] === 1;
const FACE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // outward; the north front is z 0
const exposed = (x, z) => Object.keys(FACE).filter((f) => !inside(x + FACE[f][0], z + FACE[f][1]));
const isPerim = (x, z) => inside(x, z) && exposed(x, z).length > 0;
const ground = (x, z) => gnd[ix(x, z)];
// lidar roof, 3x3 mean: the main block is the flat tier at 8 and over; below that, the one-storey wing
const isMain = (x, z) => {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) { s += roof[ix(x + dx, z + dz)]; n++; }
  return s / n >= 8;
};
// storey lines. Main: floor slab 5, lintel 9, cornice 10, parapet 11. Wing: cornice 5, parapet 6. Fascia 4 on both.
const deckRow = (x, z) => (isMain(x, z) ? 10 : 5);
const slab = (half) => ({ type: half, waterlogged: "false" });
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "true", waterlogged: "false" };

const g = new Voxels([W, H, D]);

// 1. plinth, solid mass with a floor slab per storey, and the roof covering inside the parapet
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const gl = ground(x, z), main = isMain(x, z), dk = deckRow(x, z);
  for (let y = 0; y < gl; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gl; y < dk; y++) g.set(x, y, z, y === gl || (main && y === 5) ? "smooth_stone" : "bricks");
  g.set(x, dk, z, "gravel");
}

// 2. the facades: a column on each perimeter cell (pier or pane bay), corners as stone quoins, an air pocket behind each pane
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!isPerim(x, z)) continue;
  const ex = exposed(x, z), gl = ground(x, z), main = isMain(x, z);
  const quoin = ex.some((f) => f === "N" || f === "S") && ex.some((f) => f === "E" || f === "W");
  const runFace = ex.find((f) => f === "N" || f === "S") ?? ex[0];   // N/S faces run along x, E/W along z
  const along = runFace === "N" || runFace === "S" ? x : z;
  const pier = quoin || along % 3 === 0;
  const pane = runFace === "N" || runFace === "S" ? PANE_NS : PANE_EW;
  // the cell inward from the face: its air pocket sits behind the glass, and it must be interior and main for upper glazing
  const [ox, oz] = FACE[runFace], bx = x - ox, bz = z - oz;
  const pocket = !quoin && !pier && inside(bx, bz) && !isPerim(bx, bz);
  const upperGlass = main && !quoin && inside(bx, bz) && isMain(bx, bz) && along % 3 !== 0;

  for (let y = gl; y <= 3; y++) pier ? g.set(x, y, z, quoin ? "stone_bricks" : "bricks") : g.set(x, y, z, "glass_pane", pane);
  g.set(x, 4, z, "white_concrete");
  if (main) {
    g.set(x, 5, z, "smooth_quartz");
    for (let y = 6; y <= 8; y++) {
      if (!upperGlass) g.set(x, y, z, quoin ? "stone_bricks" : "bricks");
      else if (y === 7) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "glass_pane", pane);
    }
    g.set(x, 9, z, "white_concrete");
    g.set(x, 10, z, "smooth_quartz_slab", slab("bottom"));
    g.set(x, 11, z, quoin ? "stone_bricks" : "bricks");
  } else {
    g.set(x, 5, z, "smooth_quartz_slab", slab("bottom"));
    g.set(x, 6, z, quoin ? "stone_bricks" : "bricks");
  }

  if (pocket) {
    const lowRow = ground(bx, bz) + 1;
    for (let y = lowRow; y <= 3; y++) g.set(bx, y, bz, "air");
    if ((x + z) % 3 === 0) g.set(bx, 3, bz, "lantern", LANTERN);
    if (upperGlass && isMain(bx, bz)) {
      for (let y = 6; y <= 8; y++) g.set(bx, y, bz, "air");
      if ((x + 2 * z) % 5 === 0) g.set(bx, 6, bz, "glowstone");
    }
  }
}

// 3. the entrance: a recessed porch on the north front in the middle bay, the door set in it, lanterns under the lintel
const dx = 5, dz = 0, dg = ground(dx, dz);
g.set(dx, dg, dz, "iron_door", DOOR("lower"));
g.set(dx, dg + 1, dz, "iron_door", DOOR("upper"));
g.set(dx, dg + 1, 1, "air");                                  // a vestibule pocket behind the door
for (const x of [dx - 1, dx + 1]) {
  g.set(x, dg, dz, "smooth_stone");                           // threshold on the plinth
  g.set(x, dg + 1, dz, "air");
  g.set(x, dg + 1, dz, "lantern", LANTERN);
}

// 4. roof plant: a stair-core box and two air-handling units on the main block's roof
for (const [x, z] of [[10, 6], [11, 6], [10, 7], [11, 7]]) {
  g.set(x, 10, z, "smooth_quartz");
  g.set(x, 11, z, "smooth_quartz");
  g.set(x, 12, z, "smooth_quartz_slab", slab("bottom"));
}
for (const x of [14, 15]) g.set(x, 10, 11, "iron_block");

console.log(g.save(OUT));
