import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s-2000s Xinyi commercial block: five storeys of tinted glass
// between white concrete piers, granite base, ground-floor shopfront with a
// central entrance on the street (north) face, flat parapet roof, central
// mechanical penthouse with a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011426";
const W = 23, H = 38, D = 19;
const STOREY = 5;
const STOREYS = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// N = low z (street front), S = high z, W = low x, E = high x
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const exteriorFaces = (x, z) =>
  Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));

// Pass 1: envelope, floors, foundations, roof
for (const [x, z, gr] of cells) {
  const ext = exteriorFaces(x, z);
  const boundary = ext.length > 0;
  const corner = ext.length >= 2;
  const face = ext[0];

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab at every storey line (interior), spandrel/base band on the envelope
  for (let k = 0; k < STOREYS; k++) {
    const b = gr + k * STOREY;
    if (!boundary) put(x, b, z, "light_gray_concrete");
    else put(x, b, z, k === 0 ? "polished_granite" : "white_concrete");
  }

  // Storey walls: four rows per storey above the floor line
  if (boundary) {
    for (let k = 0; k < STOREYS; k++) {
      for (let off = 1; off <= 4; off++) {
        const y = gr + k * STOREY + off;

        if (off === 4) { // head spandrel between storeys
          put(x, y, z, "light_gray_concrete");
          continue;
        }
        if (corner) { // corner piers
          put(x, y, z, "white_concrete");
          continue;
        }

        const along = (face === "N" || face === "S") ? x : z;

        if (along % 3 === 0) { // mullions
          put(x, y, z, k === 0 ? "dark_oak_planks" : "white_concrete");
          continue;
        }

        // Street entrance on the north face, ground floor
        if (k === 0 && face === "N" && x === 11) {
          if (off === 1) {
            put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          } else if (off === 2) {
            put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          } else {
            put(x, y, z, "stone_brick_slab", { type: "bottom" });
          }
          continue;
        }

        // Glass panes
        put(x, y, z, "light_blue_stained_glass");

        // Warm lights standing on the floor slab just inside some windows
        if (k > 0 && off === 2 && along % 6 === 4) {
          const [dx, dz] = DIRS[face];
          const ix = x - dx, iz = z - dz;
          if (has(ix, iz) && exteriorFaces(ix, iz).length === 0) {
            const gi = groundAt(ix, iz);
            put(ix, gi + k * STOREY + 1, iz, "glowstone");
          }
        }
      }
    }
  }

  // Roof deck and parapet
  const roofY = gr + STOREYS * STOREY;
  if (boundary) {
    put(x, roofY, z, "white_concrete");
    put(x, roofY + 1, z, "white_concrete");
  } else {
    put(x, roofY, z, "light_gray_concrete");
  }
}

// Pass 2: central mechanical penthouse (x 6..16, z 5..13) with a mast
const inPen = (x, z) => x >= 6 && x <= 16 && z >= 5 && z <= 13;
for (const [x, z, gr] of cells) {
  if (!inPen(x, z)) continue;
  const base = gr + STOREYS * STOREY; // roof deck level
  const ring = x === 6 || x === 16 || z === 5 || z === 13;

  put(x, base + 1, z, "light_gray_concrete");          // penthouse floor on deck
  if (ring) {
    put(x, base + 2, z, "smooth_quartz");              // louvred walls
    put(x, base + 3, z, "smooth_quartz");
  }
  put(x, base + 4, z, "light_gray_concrete");          // penthouse roof on ring walls
}

const cx = 11, cz = 9;
if (has(cx, cz) && inPen(cx, cz)) {
  const top = groundAt(cx, cz) + STOREYS * STOREY + 5;
  put(cx, top, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
