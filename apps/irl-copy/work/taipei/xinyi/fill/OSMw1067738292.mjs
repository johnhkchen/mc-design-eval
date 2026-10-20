import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738292";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 33, D = 22;
const g = new Voxels([W, H, D]);

// Materials: 1990s Xinyi office block, white tiled concrete, blue-tinted glazing,
// light grey frames and a quartz cornice, shopfront at grade.
const WALL = "white_concrete";
const FRAME = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const BASE = "stone_bricks";
const CAP = "smooth_quartz";
const ROOF = "light_gray_concrete";
const CROWN = "copper_block";

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const minG = Math.min(...cells.map((c) => c[2]));

// Roof slab sits 21 blocks above the lowest ground.
const R = minG + 21;

// Storey lines every 5 blocks from the lowest ground: band 0 is the shopfront storey.
function exposed(x, z) {
  return { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
}

// Penthouse core on the roof, centred on the footprint.
const inPent = (x, z) => x >= 7 && x <= 15 && z >= 6 && z <= 14;

// Entrance: the south-exposed cell nearest the centre line.
let entrance = null;
for (const [x, z] of cells) {
  if (!exposed(x, z).s) continue;
  if (!entrance || Math.abs(x - 11) < Math.abs(entrance[0] - 11)) entrance = [x, z];
}

for (const [x, z, G] of cells) {
  const e = exposed(x, z);
  const exCount = [e.n, e.s, e.w, e.e].filter(Boolean).length;
  const edge = exCount > 0;
  const corner = exCount >= 2;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, BASE);

  // Storey body from this cell's ground up to the roof slab.
  for (let y = G; y < R; y++) {
    const rel = y - minG;
    const b = Math.floor(rel / 5);
    const r = rel % 5;
    const isSlab = y === G || r === 0;

    if (isSlab) {
      g.set(x, y, z, FRAME);
      continue;
    }
    if (!edge) continue; // interior air behind the glass

    if (corner) {
      g.set(x, y, z, r === 4 ? FRAME : WALL);
      continue;
    }

    // Single exposed face: along-face coordinate s.
    const onNS = e.n || e.s;
    const s = onNS ? x : z;

    let mat;
    if (b === 0) {
      if (r === 4) mat = FRAME;
      else mat = s % 3 === 0 ? CAP : GLASS;
    } else {
      if (r === 4) mat = WALL;
      else mat = s % 2 === 0 ? FRAME : GLASS;
    }
    g.set(x, y, z, mat);

    // Warm light just inside selected windows, standing on the storey floor.
    if (mat === GLASS && r === 1 && y > G && s % 4 === 1) {
      let ix = x, iz = z;
      if (e.n) iz = z + 1;
      else if (e.s) iz = z - 1;
      else if (e.w) ix = x + 1;
      else if (e.e) ix = x - 1;
      if (has(ix, iz)) {
        const gi = ground.get(key(ix, iz));
        if (y > gi) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }

  // Roof slab.
  if (R >= G) g.set(x, R, z, ROOF);

  // Parapet and cornice on the roof edge (outside the penthouse).
  if (edge && !inPent(x, z)) {
    g.set(x, R + 1, z, FRAME);
    g.set(x, R + 2, z, CAP);
  }
}

// Entrance: double-height door in the wall cell, lanterns above the doors.
if (entrance) {
  const [ex, ez] = entrance;
  const gE = ground.get(key(ex, ez));
  const yl = gE + 1;
  const yu = gE + 2;
  g.set(ex, yl, ez, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, yu, ez, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Rooftop penthouse core with a copper crown.
for (const [x, z] of cells) {
  if (!inPent(x, z)) continue;
  g.set(x, R + 1, z, WALL);
  g.set(x, R + 2, z, WALL);
  g.set(x, R + 3, z, CAP);
}
const cx = 11, cz = 10;
if (has(cx, cz) && inPent(cx, cz)) {
  g.set(cx, R + 4, cz, CROWN);
}

g.save(`${DIR}/${ID}.nbt`);
