import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE114-0082-9F";
const W = 18, D = 30, H = 23;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));

// Roof: about 11 blocks above lowest ground.
// Deck at R, parapet on the perimeter at R (wall) and R+1 (coping slab).
const R = minG + 10;
const TOP = R + 1;

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Perimeter test and outward faces
const outward = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isPerimeter = (x, z) => {
  const o = outward(x, z);
  return o.n || o.s || o.w || o.e;
};

// Entrance: two cells in the middle of the north (z = 0) face
const ENT_X = [8, 9];
const isEntrance = (x, z) => z === 0 && ENT_X.includes(x);

// Facade bay index along the face the cell sits on
const bayIndex = (x, z) => {
  const o = outward(x, z);
  const zFace = o.n || o.s;
  return zFace ? x : z;
};

// Pass 1: foundation, floors, walls, parapet, deck
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (gr > R) continue; // should not happen on this site

  const per = isPerimeter(x, z);
  const o = outward(x, z);
  const corner = (o.n || o.s) && (o.w || o.e);
  const bay = bayIndex(x, z);

  if (per) {
    for (let y = gr; y <= R; y++) {
      const rel = y - gr;
      let id = null;

      if (y === R) {
        id = "white_concrete"; // parapet wall
      } else if (y === R - 1) {
        id = "smooth_stone"; // cornice band
      } else if (rel === 0) {
        id = "light_gray_concrete"; // base course
      } else if (rel === 4 || rel === 5 || rel === 9) {
        id = "white_concrete"; // lintel, floor slab, spandrel
      } else if (rel === 1 || rel === 2 || rel === 3 || rel === 6 || rel === 7 || rel === 8) {
        if (isEntrance(x, z) && rel <= 3) {
          id = null; // doorway opening
        } else if (corner || bay % 3 === 0) {
          id = "white_concrete"; // mullions and corner columns
        } else {
          id = "light_blue_stained_glass"; // window glass
        }
      }

      if (id) put(x, y, z, id);
    }
    // Coping: a continuous bottom slab on top of the parapet wall
    put(x, R + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior: air gap, floor slabs per storey
    for (let y = gr; y < R; y++) {
      const rel = y - gr;
      if (rel === 0 || rel === 5) put(x, y, z, "light_gray_concrete");
    }
  }

  // Roof deck over the whole footprint (perimeter parapet overrides above)
  put(x, R, z, per ? "white_concrete" : "light_gray_concrete");
}

// Canopy over the entrance, projecting in from the street face
for (let x = 6; x <= 11; x++) {
  for (const z of [0, 1]) {
    const gr = gAt(x, z);
    if (gr === undefined) continue;
    put(x, gr + 4, z, "smooth_stone");
  }
}

// Warm light: a few upper-storey bays only, plus the entrance hall
for (const [x, z, gr] of cells) {
  if (!isPerimeter(x, z)) continue;
  const o = outward(x, z);
  const corner = (o.n || o.s) && (o.w || o.e);
  if (corner || isEntrance(x, z)) continue;
  const bay = bayIndex(x, z);

  let ix = x, iz = z;
  if (o.n) iz = z + 1;
  else if (o.s) iz = z - 1;
  else if (o.w) ix = x + 1;
  else if (o.e) ix = x - 1;

  if (bay % 12 === 1) {
    put(ix, gr + 7, iz, "glowstone");
  }
}

// Entrance hall glow, one lamp just inside the doorway
{
  const gr = gAt(8, 1);
  if (gr !== undefined) put(8, gr + 2, 1, "glowstone");
}

// Mechanical penthouse on the roof, fully inside the footprint
const PH = { x0: 5, x1: 12, z0: 10, z1: 19 };
let phOk = TOP + 3 < H;
if (phOk) {
  for (let x = PH.x0; x <= PH.x1; x++) {
    for (let z = PH.z0; z <= PH.z1; z++) {
      if (!has(x, z) || isPerimeter(x, z)) phOk = false;
    }
  }
}
if (phOk) {
  for (let x = PH.x0; x <= PH.x1; x++) {
    for (let z = PH.z0; z <= PH.z1; z++) {
      put(x, R + 1, z, "light_gray_concrete");
      put(x, R + 2, z, "light_gray_concrete");
      put(x, R + 3, z, "smooth_stone");
    }
  }
  // Louvred vent slots on the penthouse faces
  for (let z = PH.z0 + 1; z <= PH.z1 - 1; z += 2) {
    put(PH.x0, R + 1, z, "iron_block");
    put(PH.x1, R + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
