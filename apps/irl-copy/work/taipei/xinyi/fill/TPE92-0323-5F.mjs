import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE92-0323-5F: 2003 Xinyi mid-rise office/retail block, 5 storeys of 5 blocks.
// Concrete frame, glass curtain-wall bands with white concrete mullions and
// spandrels, granite shopfront at street level, glass entrance on the south face,
// flat roof deck with a parapet and a single plant box.

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE92-0323-5F.cells.json", "utf8")
);

const W = 13, H = 38, D = 26;
const g = new Voxels([W, H, D]);

const STOREY = 5;          // blocks per storey
const BODY = 25;           // body levels 0..24 are storeys, 25 is the roof deck
const PARAPET = 26;        // parapet level above the deck (roof top ~26)

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// footprint map: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inSet = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// perimeter = footprint cell with a 4-neighbour outside the footprint
const isPerim = (x, z) =>
  !inSet(x + 1, z) || !inSet(x - 1, z) || !inSet(x, z + 1) || !inSet(x, z - 1);

const glassProps = (onXWall, onZWall) => {
  // pane connects along the wall it sits in
  if (onXWall && onZWall) return { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
  if (onXWall) return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

const DOOR_X = 6;

// ---- pass 1: foundations, floors, facade, roof
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);
  // on an x-running wall (north/south face): neighbours in x are in the footprint, z is not
  const offZ = !inSet(x, z + 1) || !inSet(x, z - 1);
  // on a z-running wall (east/west face)
  const offX = !inSet(x + 1, z) || !inSet(x - 1, z);
  const cornerLike = offX && offZ;
  const onSouthFace = !inSet(x, z + 1);

  // mullion column: spaced along the wall it sits in
  const mullion =
    cornerLike ||
    (offZ && !offX && x % 3 === 0) ||   // north/south face: step along x
    (offX && !offZ && z % 3 === 0);     // east/west face: step along z

  // foundation solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let L = 0; L <= PARAPET; L++) {
    const y = gr + L;
    if (y >= H) break;

    if (L === BODY) {
      // roof deck
      put(x, y, z, perim ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (L === PARAPET) {
      if (perim) put(x, y, z, "smooth_stone");
      continue;
    }
    if (L > BODY) continue;

    const k = Math.floor(L / STOREY);
    const o = L % STOREY;

    if (!perim) {
      // interior: floor slab per storey, air otherwise (air gap behind glass)
      if (o === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // perimeter facade
    if (k === 0) {
      if (o === 0) { put(x, y, z, "polished_granite"); continue; }
      if (o === 4) { put(x, y, z, "white_concrete"); continue; }
      // entrance on the south face
      if (onSouthFace && x === DOOR_X && (o === 1 || o === 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "south",
          half: o === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (mullion) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", glassProps(offZ, offX));
      }
      continue;
    }

    // upper storeys
    if (o === 0) { put(x, y, z, "white_concrete"); continue; }
    if (mullion) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane", glassProps(offZ, offX));
    }
  }
}

// ---- pass 2: warm light behind some upper-storey windows (glowstone inside)
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  for (let k = 1; k < 5; k++) {
    const L = k * STOREY + 2;
    if (((x * 7 + z * 3 + k * 5) % 11) !== 0) continue;
    const nbrs = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
    for (const [nx, nz] of nbrs) {
      if (inSet(nx, nz) && !isPerim(nx, nz)) {
        put(nx, gAt(nx, nz) + L, nz, "glowstone");
        break;
      }
    }
  }
}

// ---- pass 3: rooftop plant box, centred, inside footprint only
const plant = [];
for (let x = 4; x <= 8; x++) for (let z = 10; z <= 15; z++) if (inSet(x, z)) plant.push([x, z]);
for (const [x, z] of plant) {
  const gr = gAt(x, z);
  const edge = !inSet(x + 1, z) || !inSet(x - 1, z) || !inSet(x, z + 1) || !inSet(x, z - 1)
    || x === 4 || x === 8 || z === 10 || z === 15;
  put(x, gr + BODY + 1, z, edge ? "light_gray_concrete" : "iron_block");
  put(x, gr + BODY + 2, z, edge ? "smooth_stone_slab" : "light_gray_concrete", edge ? { type: "bottom", waterlogged: "false" } : undefined);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE92-0323-5F.nbt");
