import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE103-0263-3: 2014 two-storey concrete commercial block, Xinyi district.
// White-concrete piers at full depth, tinted glass bays recessed one block
// into reveals on the long facades, smooth-quartz string courses, a grey
// fascia band over a stone-brick plinth, a recessed dark-oak entrance,
// flat roof with a parapet and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE103-0263-3";
const W = 5, H = 23, D = 18;
const ROOF = 10;      // roof deck / cornice
const PARAPET = 11;   // parapet top, roof surface reads at about 11 blocks
const SLAB = 5;       // storey-1 / storey-2 floor line

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassProps = (exX) => exX
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Per-cell facade classification.
function classify(x, z) {
  const exX = !has(x - 1, z) || !has(x + 1, z);
  const exZ = !has(x, z - 1) || !has(x, z + 1);
  const edge = exX || exZ;
  const corner = exX && exZ;
  let pier = false;
  if (edge) {
    if (corner) pier = true;
    else if (exX) pier = (z % 3 === 0) || z === D - 1;
    else pier = (x === 0 || x === W - 1);
  }
  const entrance = edge && exZ && !exX && x === 2 && !has(x, z - 1);
  // Long-facade window bays are recessed: the glass sits one cell inward.
  const recess = edge && exX && !exZ && !pier && has(x > 0 ? x - 1 : x + 1, z) === true
    ? true
    : (edge && exX && !exZ && !pier);
  return { exX, exZ, edge, corner, pier, entrance, recess };
}

// Inward cell that carries the glass for a recessed bay.
const innerX = (x, z) => (!has(x - 1, z) ? x + 1 : x - 1);

// Block for one footprint cell at absolute height y (y >= its ground).
function blockAt(x, z, y, gr, c) {
  if (!c.edge) {
    if (y === SLAB) return ["white_concrete"];
    if (y === ROOF) return ["light_gray_concrete"];
    return null;
  }
  if (y === PARAPET) return ["white_concrete"];
  if (y === ROOF) return ["smooth_quartz"];
  if (y === SLAB) return ["smooth_quartz"];
  if (y === 4) return ["gray_concrete"];        // fascia band over the shopfronts
  if (y > 4) {
    // storey 2, y = 6..9
    if (c.pier) return ["white_concrete"];
    if (c.recess) return null;                  // glass is set in the reveal
    if (y === 6 || y === 9) return ["smooth_quartz"];
    return ["light_blue_stained_glass_pane", glassProps(c.exX)];
  }
  // ground floor, y < 4
  if (c.entrance) {
    if (y === gr) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (y === gr + 1) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (y >= gr + 2) return ["glass_pane", glassProps(false)];
    return null;
  }
  if (y === gr) return ["polished_andesite"];   // base course
  if (c.pier) return ["white_concrete"];
  if (c.recess) return null;
  return ["light_blue_stained_glass_pane", glassProps(c.exX)];
}

// Pass 1: foundations and the building body, cell by cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");
  const c = classify(x, z);
  for (let y = gr; y <= PARAPET; y++) {
    const b = blockAt(x, z, y, gr, c);
    if (!b) continue;
    put(x, y, z, b[0], b[1]);
  }
}

// Pass 2: recessed window bays. Glass, sills and heads sit one cell in,
// with a soffit under the fascia and an air gap behind the glass.
for (const [x, z, gr] of cells) {
  const c = classify(x, z);
  if (!c.recess) continue;
  const ix = innerX(x, z);
  if (!has(ix, z)) continue;
  for (let y = Math.max(gr, 0); y <= 9; y++) {
    if (y === SLAB) continue;                       // floor slab already placed
    if (y === gr) { put(ix, y, z, "polished_andesite"); continue; }
    if (y === 4) { put(ix, y, z, "gray_concrete"); continue; }   // soffit
    if (y >= 1 && y <= 3 && y > gr) { put(ix, y, z, "light_blue_stained_glass_pane", glassProps(true)); continue; }
    if (y === 6 || y === 9) { put(ix, y, z, "smooth_quartz"); continue; }
    if (y === 7 || y === 8) { put(ix, y, z, "light_blue_stained_glass_pane", glassProps(true)); continue; }
  }
}

// Pass 3: warm light behind some glass (air gap sits behind every pane).
for (const [x, z, gr] of cells) {
  const c = classify(x, z);
  if (!c.edge || c.pier || c.entrance) continue;
  const along = c.exX ? z : x;
  let gx, gz, bx, bz;
  if (c.recess) {
    gx = innerX(x, z); gz = z;
    bx = gx + (gx - x); bz = z;                     // one further inward
  } else {
    gx = x; gz = c.exX ? z : (!has(x, z - 1) ? z + 1 : z - 1);
    bx = c.exX ? (!has(x - 1, z) ? x + 1 : x - 1) : x;
    bz = gz;
  }
  if (!has(bx, bz) && !(bx >= 0 && bx < W && bz >= 0 && bz < D)) continue;
  if (2 >= gr + 1 && along % 3 === 1) put(bx, 2, bz, "glowstone");
  if (along % 4 === 1) put(bx, 7, bz, "glowstone");
}

// Pass 4: rooftop plant on interior roof cells, sitting on the roof deck.
for (const [x, z, gr] of cells) {
  const c = classify(x, z);
  if (c.edge || gr > ROOF) continue;
  if (x === 2 && (z === 4 || z === 5 || z === 12 || z === 13)) put(x, PARAPET, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
