import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi shophouse-style commercial block: two storeys over a stone base,
// white concrete piers and spandrels with quartz bands, glazed bays, a central
// shopfront entrance on the north end, and a parapet roof with plant boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121244";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, D = 19, H = 23;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFoot = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const B = Math.min(...cells.map((c) => c[2])); // lowest ground: y of storey 1 base
const TOP = B + 11;                              // parapet top, ~11 above lowest ground
if (TOP > H - 1) throw new Error("building exceeds grid height");

// place a block only on a footprint cell and only above that cell's foundation
function put(x, y, z, id, props) {
  if (!inFoot(x, z)) return;
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (y < gnd(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// 1. foundation: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// which exterior faces a cell sits on (neighbour missing from footprint)
function faces(x, z) {
  const f = [];
  if (!inFoot(x - 1, z)) f.push("W");
  if (!inFoot(x + 1, z)) f.push("E");
  if (!inFoot(x, z - 1)) f.push("N");
  if (!inFoot(x, z + 1)) f.push("S");
  return f;
}
const isLong = (f) => f === "W" || f === "E"; // the 19-block faces

// facade block for a face, along-coordinate a, and height rel above B
function facadeBlock(face, a, rel) {
  const long = isLong(face);
  const L = long ? D : W;
  const pier = a === 0 || a === L - 1 || a % 3 === 0;
  const paneProps = long
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  const pane = { id: "glass_pane", props: paneProps };
  const pierB = { id: "smooth_quartz" };
  const wall = { id: "white_concrete" };

  if (rel === 0) return { id: "stone_bricks" };          // base course
  if (rel === 4) return { id: "smooth_quartz" };          // lintel band
  if (rel === 5) return { id: "stone_bricks" };           // storey line / slab edge
  if (rel === 10) return { id: "smooth_quartz" };         // roof cornice
  if (rel === 11) return pier ? pierB : wall;             // parapet

  // entrance on the north short face: door at a=3, shopfront glazing either side
  if (face === "N" && a >= 2 && a <= 4) {
    if (a === 3 && rel === 1) return { id: "iron_door", props: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (a === 3 && rel === 2) return { id: "iron_door", props: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (rel <= 3) return pane;
  }

  if (rel === 6 || rel === 9) return pier ? pierB : wall; // spandrels and sills
  if (rel >= 1 && rel <= 3) return pier ? pierB : pane;   // ground storey shopfront bays
  if (rel >= 7 && rel <= 8) return pier ? pierB : pane;   // upper storey windows
  return null;
}

// 2. exterior shell and floors
for (const [x, z] of cells) {
  const f = faces(x, z);
  if (f.length) {
    const face = f.find(isLong) ?? f[0];
    const a = isLong(face) ? z : x;
    for (let rel = 0; rel <= 11; rel++) {
      const b = facadeBlock(face, a, rel);
      if (b) put(x, B + rel, z, b.id, b.props);
    }
  } else {
    // interior: upper floor slab and roof deck
    put(x, B + 5, z, "light_gray_concrete");
    put(x, B + 10, z, "light_gray_concrete");
  }
}

// 3. interior structural columns on the centre line (carry floor and roof)
for (const z of [3, 9, 15]) {
  for (let rel = 0; rel <= 4; rel++) put(3, B + rel, z, "stone_bricks");
  for (let rel = 6; rel <= 9; rel++) put(3, B + rel, z, "stone_bricks");
}

// 4. warm lights behind some glazed bays (interior air sits behind the glass)
for (let a = 1; a < D - 1; a++) {
  if (a % 3 === 0) continue;
  if (a % 6 === 2) put(1, B + 2, a, "glowstone");
  if (a % 6 === 4) put(5, B + 8, a, "shroomlight");
}
for (let a = 1; a < W - 1; a++) {
  // nothing extra on the short faces; keep the entrance clear
}

// 5. roof equipment: two plant boxes on the roof deck
for (const [x, z] of [[2, 5], [4, 13]]) {
  if (inFoot(x, z)) put(x, B + 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
