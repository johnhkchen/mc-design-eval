import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s-style Taipei office block: five storeys of white tiled
// concrete with blue-glass bands, granite base, light-grey mullions,
// a glazed ground-floor shopfront with a central entrance, a cornice and
// parapet, and a rooftop plant box. Roof slab at y=26 above the lowest ground.

const ID = "OSMw827011428";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 38, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inFp = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) =>
  !inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1);
const isCorner = (x, z) =>
  (!inFp(x + 1, z) || !inFp(x - 1, z)) && (!inFp(x, z + 1) || !inFp(x, z - 1));

// Storey geometry
const B = 1;          // first floor slab (y)
const NS = 5;         // storeys
const SH = 5;         // blocks per storey
const ROOF = B + NS * SH;   // roof slab y = 26
const PARAPET = ROOF + 1;   // y = 27

// Materials
const FACADE = "white_concrete";
const FRAME = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const FLOOR = "light_gray_concrete";
const SHOPFRAME = "polished_andesite";
const SPAN = "white_concrete";
const MECH = "light_gray_concrete";

// Entrance: on the south-facing edge (no footprint cell at z+1), nearest the centre x
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!isEdge(x, z) || inFp(x, z + 1)) continue;
    const d = Math.abs(x - W / 2);
    if (d < best) { best = d; entrance = [x, z]; }
  }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, FOUND);

  const edge = isEdge(x, z);
  const corner = edge && isCorner(x, z);

  // Floor slabs at every storey line (and roof) where above ground
  for (let k = 0; k <= NS; k++) {
    const L = B + k * SH;
    if (L <= gr) continue;
    let id = FLOOR;
    if (edge) id = k === 0 ? BASE : (k === NS ? FRAME : FLOOR);
    g.set(x, L, z, id);
  }

  if (edge) {
    const mullion = (x + z) % 3 === 0;

    for (let k = 0; k < NS; k++) {
      const L = B + k * SH;
      for (let dy = 1; dy <= 3; dy++) {
        const y = L + dy;
        if (y <= gr) continue;
        if (k === 0) {
          g.set(x, y, z, mullion ? SHOPFRAME : GLASS);
        } else {
          g.set(x, y, z, mullion ? FRAME : GLASS);
        }
      }
      // Spandrel / storey line
      const ys = L + 4;
      if (ys > gr) g.set(x, ys, z, SPAN);

      // Warm light behind some upper-floor glass
      if (k >= 1 && k <= 3 && !mullion && (x + z) % 6 === 1) {
        const nbrs = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
        for (const [nx, nz] of nbrs) {
          if (inFp(nx, nz) && !isEdge(nx, nz)) {
            const ly = L + 2;
            if (ly > ground.get(key(nx, nz))) {
              g.set(nx, ly, nz, "glowstone");
            }
            break;
          }
        }
      }
    }

    // Cornice and parapet
    if (ROOF > gr) g.set(x, ROOF, z, FRAME);
    g.set(x, PARAPET, z, FACADE);

    // Corner pilasters
    if (corner) {
      for (let y = gr + 1; y <= PARAPET; y++) g.set(x, y, z, FACADE);
    }
  }
}

// Entrance door and lintel on the front edge
if (entrance) {
  const [ex, ez] = entrance;
  const gr = ground.get(key(ex, ez));
  const dy = gr + 1;
  g.set(ex, dy, ez, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(ex, dy + 1, ez, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Lintel above the door
  g.set(ex, dy + 2, ez, FRAME);
  // Neighbouring shopfront glass beside the door stays as is
}

// Rooftop plant box on interior cells near the centre
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (Math.abs(x - 11) <= 4 && Math.abs(z - 10) <= 3) {
    g.set(x, PARAPET, z, MECH);
    g.set(x, PARAPET + 1, z, MECH);
  }
}

g.save(`${DIR}/${ID}.nbt`);
