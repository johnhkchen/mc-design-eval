import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408136";
const W = 18, H = 23, D = 17;

// Two-storey low-rise commercial block: pale tiled/concrete walls, cyan-tinted glass
// shopfronts, a cornice band, a flat roof with a parapet and rooftop plant.
const ROOF_Y = 11;      // roof deck top (about 11 blocks above lowest ground)
const SLAB_Y = 5;       // first/second floor line (storey ~5 blocks)
const CORNICE_Y = 10;   // cornice band under the parapet

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const centreX = Math.round((minX + maxX) / 2);

// Which exterior face (if any) a footprint cell has: N = z-1 side (street front)
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const g = new Voxels([W, H, D]);
const GLASS = "light_blue_stained_glass";
const WALL = "smooth_quartz";
const MULLION = "quartz_pillar";

// Pass 1: foundations, floors, walls, roof deck
for (const [x, z, gr] of cells) {
  const gc = Math.max(0, Math.min(Math.round(gr), ROOF_Y));
  const face = faceOf(x, z);

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gc; y <= ROOF_Y; y++) {
    if (y === ROOF_Y) { g.set(x, y, z, face ? WALL : "smooth_stone"); continue; }
    if (!face) {
      // interior: only floor slabs, the rest is air
      if (y === gc || y === SLAB_Y) g.set(x, y, z, "smooth_stone");
      continue;
    }
    // exterior wall cell
    const idx = (face === "N" || face === "S") ? x : z;
    const isFront = face === "N";
    let b = WALL, props;

    if (y === gc) {
      b = "polished_andesite";                       // base course / plinth
    } else if (y === SLAB_Y) {
      b = "smooth_stone";                            // storey line
    } else if (y === CORNICE_Y) {
      b = "quartz_slab"; props = { type: "bottom", waterlogged: "false" };
    } else if (y > gc && y < SLAB_Y) {
      // ground floor
      if (isFront) b = (idx % 3 === 0) ? MULLION : GLASS;   // shopfront
      else b = (idx % 3 === 1) ? GLASS : WALL;
    } else if (y > SLAB_Y && y < CORNICE_Y) {
      // second floor window grid
      b = (idx % 3 === 0) ? MULLION : GLASS;
    }
    g.set(x, y, z, b, props);
  }

  // parapet on the roof edge
  if (face) g.set(x, ROOF_Y + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: entrance door on the street front, centred
for (const [x, z, gr] of cells) {
  if (x !== centreX || faceOf(x, z) !== "N") continue;
  const gc = Math.max(0, Math.round(gr));
  if (gc + 2 > 4) continue;
  g.set(x, gc + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gc + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Pass 3: warm lights set behind some windows, standing on the floor slab
for (const [x, z, gr] of cells) {
  const face = faceOf(x, z);
  if (!face) continue;
  const gc = Math.max(0, Math.round(gr));
  const idx = (face === "N" || face === "S") ? x : z;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || faceOf(ix, iz)) continue;   // need a true interior cell behind
  if (idx % 6 === 2) {
    // second floor lamp standing on the slab at SLAB_Y
    g.set(ix, SLAB_Y + 1, iz, "glowstone");
  }
  if (face === "N" && idx % 6 === 4 && gc + 1 <= 4 && idx !== centreX) {
    // shopfront lamp standing on ground floor slab
    g.set(ix, gc + 1, iz, "shroomlight");
  }
}

// Pass 4: rooftop plant on interior roof cells
const midZ = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
for (const xc of [minX + 4, maxX - 4]) {
  if (has(xc, midZ) && !faceOf(xc, midZ)) g.set(xc, ROOF_Y + 1, midZ, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
