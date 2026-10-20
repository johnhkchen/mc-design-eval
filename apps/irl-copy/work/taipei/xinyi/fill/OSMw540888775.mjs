import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888775.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888775.nbt";

const W = 10, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x + "," + z;
const G = new Map();
let B = Infinity;
for (const [x, z, gr] of cells) {
  const gg = Math.max(0, Math.min(H - 1, Math.round(gr)));
  G.set(key(x, z), gg);
  if (gg < B) B = gg;
}
const has = (x, z) => G.has(key(x, z));
const isInt = (a, b) => has(a, b) && has(a - 1, b) && has(a + 1, b) && has(a, b - 1) && has(a, b + 1);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Two storeys of 5 blocks above the lowest ground B; roof deck at B+10, parapet at B+11.
const top = B + 10;
const parapet = B + 11;

const GLASS_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);

  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const bnd = nW || nE || nN || nS;
  const faceX = nW || nE;
  const faceZ = nN || nS;
  const corner = faceX && faceZ;
  const street = nW; // west (x = 0) face is the street frontage
  const along = faceX ? z : x;
  const doorCell = street && along === 11;

  for (let y = gr; y <= B + 9 && y < H; y++) {
    const off = (y - B) % 5;
    const sto = y - B < 5 ? 0 : 1;

    if (!bnd) {
      // Interior: only the storey slab at the floor line
      if (y === B + 5) put(x, y, z, "smooth_stone");
      continue;
    }

    // Entrance door on the street face, two blocks tall at this cell's ground
    if (doorCell && (y === gr || y === gr + 1)) {
      put(x, y, z, "dark_oak_door", {
        facing: "west",
        half: y === gr ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (corner) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (off === 0) {
      // Base course on ground floor, floor band at storey two
      put(x, y, z, sto === 0 ? "stone_bricks" : "light_gray_concrete");
      continue;
    }

    if (off === 4) {
      // Lintel; red tile awning over the shopfront
      if (street && sto === 0) put(x, y, z, "red_terracotta");
      else put(x, y, z, "white_concrete");
      continue;
    }

    // Rows 1 to 3: pillars every third bay, glazing elsewhere
    if (along % 3 === 0) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    put(x, y, z, "glass_pane", faceX ? GLASS_X : GLASS_Z);

    // Warm light behind some upper windows, inside the air gap
    if (sto === 1 && off === 2 && along % 6 === 2 && faceX) {
      const ix = x + (nW ? 1 : -1);
      if (isInt(ix, z) && y >= G.get(key(ix, z))) {
        put(ix, y, z, "glowstone");
      }
    }
  }

  // Roof deck and parapet
  if (top >= gr && top < H) {
    put(x, top, z, "smooth_stone");
    if (bnd) put(x, parapet, z, "red_terracotta");
  }
}

// Small roof plant units on the interior of the roof
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  if (!isInt(x, z)) continue;
  if (x >= 2 && x <= 3 && z >= 5 && z <= 7 && top >= gr) {
    put(x, parapet, z, "light_gray_concrete");
  }
}

g.save(OUT);
