import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century Taipei low-rise commercial block: two storeys over a plinth,
// grey-white concrete frame, shopfront on the street (x = 0) face, flat roof
// with a parapet and a small plant box.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540098231.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540098231.nbt";

const W = 5, H = 23, D = 22;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gmin = Math.min(...cells.map((c) => c[2]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Classify a footprint cell by which of its sides face outward.
function facade(x, z) {
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const xf = mW || mE, zf = mN || mS;
  if (xf && zf) return { kind: "corner" };
  if (xf) return { kind: "x", p: z, front: mW };   // faces along z
  if (zf) return { kind: "z", p: x, front: false }; // faces along x
  return null;
}

const WIN_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const WIN_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Returns [id, props?] for a perimeter wall block at offset o (1..4) above a floor.
function wall(x, z, o, isGround) {
  const f = facade(x, z);
  if (!f) return null;
  if (f.kind === "corner") return ["light_gray_concrete"];
  if (o === 4) return ["smooth_stone"];                 // spandrel / fascia band
  const pier = f.p % 3 === 0;
  if (pier) return ["light_gray_concrete"];             // structural pier
  if (isGround && f.kind === "x" && f.front) {          // shopfront on street face
    if (f.p === 10) {                                    // entrance door
      if (o === 1) return ["oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (o === 2) return ["oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" }];
    }
    if (o === 1) return ["stone_bricks"];               // plinth
    return ["glass"];
  }
  return ["glass_pane", f.kind === "x" ? WIN_X : WIN_Z];
}

for (const [x, z, gr] of cells) {
  const gy = gr - gmin;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground floor, first floor, roof deck.
  for (const fy of [gy, gy + 5, gy + 10]) put(x, fy, z, "light_gray_concrete");

  const f = facade(x, z);
  if (f) {
    // Storeys: offsets 1..4 above each floor (floors at gy and gy+5).
    for (let s = 0; s < 2; s++) {
      const b = gy + 5 * s;
      for (let o = 1; o <= 4; o++) {
        const w = wall(x, z, o, s === 0);
        if (w) put(x, b + o, z, w[0], w[1]);
      }
    }
    // Parapet on the roof edge.
    put(x, gy + 11, z, "white_concrete");
  }
}

// Warm light behind some upper and ground windows on the street face.
for (let z = 0; z < D; z++) {
  if (z % 6 !== 2 || !has(1, z)) continue;
  const f = facade(0, z);
  if (!f || f.kind !== "x" || !f.front || f.p % 3 === 0) continue;
  const gr = ground.get(`0,${z}`);
  if (gr === undefined) continue;
  const gy = gr - gmin;
  for (let s = 0; s < 2; s++) put(1, gy + 5 * s + 2, z, "glowstone");
}

// Plant box on the roof, set back from the parapet.
for (const [x, z, gr] of cells) {
  if (x < 1 || x > 3 || z < 3 || z > 6) continue;
  if (facade(x, z)) continue;
  const gy = gr - gmin;
  put(x, gy + 11, z, "white_concrete");
  put(x, gy + 12, z, "white_concrete");
}

// Lanterns on the parapet at the street-face corners.
for (const z of [1, D - 2]) {
  if (!has(0, z)) continue;
  const gr = ground.get(`0,${z}`);
  put(0, gr - gmin + 12, z, "lantern", { hanging: "false" });
}

g.save(OUT);
