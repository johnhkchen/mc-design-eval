import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377790";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 29, H = 23, D = 24;
const g = new Voxels([W, H, D]);

// Footprint and per-cell ground, normalised so the lowest ground is y 0.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const minG = Math.min(...ground.values());

const key = (x, z) => `${x},${z}`;
const inF = (x, z) => ground.has(key(x, z));
// [name, dx, dz] for the four horizontal neighbours.
const DIRS = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];
const missing = (x, z) => DIRS.filter(([, dx, dz]) => !inF(x + dx, z + dz));

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: front (south) edge cell nearest the footprint's centre line.
const cxAll = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let doorKey = null, bestD = Infinity;
for (const [x, z] of cells) {
  if (!missing(x, z).some(([n]) => n === "south")) continue;
  const d = Math.abs(x - cxAll);
  if (d < bestD) { bestD = d; doorKey = key(x, z); }
}

const PARAPET_H = 11; // roof about 11 blocks above lowest ground

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const b = gr - minG;                 // this cell's ground level
  const top = b + PARAPET_H;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone");

  // Floor slabs: ground, first storey line, roof deck.
  for (const fy of [b, b + 5, b + 10]) put(x, fy, z, "smooth_stone");

  const miss = missing(x, z);
  const edge = miss.length > 0;
  if (!edge) {
    // Interior: air gap, with a roof plant box on the roof deck.
    if (x >= 8 && x <= 10 && z >= 9 && z <= 11) {
      for (let y = b + 11; y <= Math.min(b + 12, H - 1); y++)
        put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // Edge cell: cornice and parapet.
  put(x, b + 10, z, "light_gray_concrete");
  if (top < H) put(x, top, z, "white_concrete");

  const isCorner = miss.some(([n]) => n === "east" || n === "west") &&
                   miss.some(([n]) => n === "north" || n === "south");
  const onZFace = miss.some(([n]) => n === "north" || n === "south");
  const along = onZFace ? x : z;
  const pier = isCorner || along % 4 === 0;

  // Storey walls.
  for (let s = 0; s < 2; s++) {
    const st = b + 5 * s;
    if (s === 0) {
      // Ground floor: shopfront glass from ground to transom, head frame at st+4.
      for (let y = st + 1; y <= st + 3; y++)
        put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      put(x, st + 4, z, "smooth_stone");
    } else {
      // Upper storey: sill, glass, head frame.
      put(x, st + 1, z, pier ? "white_concrete" : "smooth_stone");
      for (let y = st + 2; y <= st + 3; y++)
        put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      put(x, st + 4, z, pier ? "white_concrete" : "smooth_stone");
    }

    // Warm light behind some upper-storey windows (in the air gap).
    if (!pier && s === 1 && along % 8 === 2) {
      const [, dx, dz] = miss[0];
      const ix = x - dx, iz = z - dz;
      if (inF(ix, iz) && missing(ix, iz).length === 0)
        put(ix, st + 2, iz, "glowstone");
    }
  }

  // Articulate the ground floor: door and canopy on the front face.
  if (k === doorKey) {
    put(x, b + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  if (miss.some(([n]) => n === "south") && Math.abs(x - cxAll) <= 2 && !pier) {
    put(x, b + 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
