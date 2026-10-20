import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831858851.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831858851.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const W = 14, H = 23, D = 14;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const zmin = Math.min(...zs), zmax = Math.max(...zs);
const L = xmax - xmin; // 13

// Flat roof: about 11 blocks above lowest ground; allow for steep ground.
const maxG = Math.max(...cells.map((c) => c[2]));
const R = Math.min(H - 3, Math.max(11, maxG + 6)); // top of parapet level

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Edge classification: which face and along-index a footprint cell sits on
function faceOf(x, z) {
  if (z === zmin) return { f: "N", a: x - xmin };
  if (z === zmax) return { f: "S", a: x - xmin };
  if (x === xmin) return { f: "W", a: z - zmin };
  if (x === xmax) return { f: "E", a: z - zmin };
  return null;
}
const isCorner = (x, z) => (x === xmin || x === xmax) && (z === zmin || z === zmax);

// Window bay logic: piers every 3 blocks plus both corners
const isPier = (a) => a % 3 === 0 || a === L;

// Entrance on north face, door at along-index 7
const DOOR_A = 7;

// Pass 1: foundations, floors, walls, cornice, parapet
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fo = faceOf(x, z);
  const edge = fo !== null;
  const corner = isCorner(x, z);

  for (let y = gr; y <= R; y++) {
    let b = null;
    let props;

    if (y === gr) {
      // Ground-level course / ground floor slab
      b = edge ? "polished_andesite" : "smooth_stone";
    } else if (y === 5) {
      // Storey line between ground floor and first upper storey
      b = "smooth_quartz";
    } else if (y < 5) {
      // Ground floor: shopfront glazing with concrete piers
      if (edge) {
        b = (corner || isPier(fo.a)) ? "white_concrete" : "light_blue_stained_glass";
      }
    } else if (y < 10) {
      // Upper storey: window grid, spandrel band at y=9
      if (edge) {
        if (corner || isPier(fo.a)) b = "white_concrete";
        else if (y === 9) b = "smooth_quartz";
        else b = "light_blue_stained_glass";
      }
    } else if (y === 10) {
      // Cornice on edges, roof slab inside
      b = edge ? "stone_bricks" : "light_gray_concrete";
    } else if (y === 11) {
      // Parapet on edges only
      if (edge) b = "white_concrete";
    }

    if (b) put(x, y, z, b);
  }

  // Corner pillars rise slightly above the parapet line for a crisp silhouette
  if (corner && R + 1 < H) {
    put(x, R + 1, z, "stone_bricks");
  }
}

// Pass 2: entrance door on north face (lower + upper half)
const doorX = xmin + DOOR_A, doorZ = zmin;
if (has(doorX, doorZ) && 1 + 1 < 5) {
  const gDoor = G.get(`${doorX},${doorZ}`);
  const yLow = gDoor + 1;
  const yUp = gDoor + 2;
  if (yUp < 5) {
    put(doorX, yLow, doorZ, "oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(doorX, yUp, doorZ, "oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

// Pass 3: warm light behind the upper-storey glass (on interior floor slab at y=6)
for (const [x, z, gr] of cells) {
  const fo = faceOf(x, z);
  if (!fo || isCorner(x, z)) continue;
  if (isPier(fo.a)) continue;
  if (fo.a !== 4 && fo.a !== 10) continue;
  // inward neighbour
  let ix = x, iz = z;
  if (fo.f === "N") iz = z + 1;
  else if (fo.f === "S") iz = z - 1;
  else if (fo.f === "W") ix = x + 1;
  else if (fo.f === "E") ix = x - 1;
  if (!has(ix, iz) || faceOf(ix, iz)) continue;
  const gi = G.get(`${ix},${iz}`);
  if (gi <= 5 && 6 < R) put(ix, 6, iz, "glowstone");
}

// Pass 4: rooftop mechanical units on the interior roof (y = R + 1 level)
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (faceOf(x, z)) continue;
  const ax = x - xmin, az = z - zmin;
  if ((ax === 4 || ax === 5) && (az === 4 || az === 5)) {
    put(x, R + 1, z, "iron_block");
  }
}

g.save(OUT);
