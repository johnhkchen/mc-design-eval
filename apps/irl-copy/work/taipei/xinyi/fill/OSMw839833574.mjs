import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 18 x 24 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, late-20th-century Xinyi commercial block: stone-brick
// piers and a shopfront at street level, white concrete upper storey with
// framed light-blue glass, a dark timber fascia, a stone cornice, a white
// parapet, and rooftop plant. Warm lanterns and a shroomlight sit behind glass.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833574";
const W = 18, H = 23, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const DIRS = [
  { dx: -1, dz: 0, f: "west" },
  { dx: 1, dz: 0, f: "east" },
  { dx: 0, dz: -1, f: "north" },
  { dx: 0, dz: 1, f: "south" },
];
const faces = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Street entrance: median x of the single-face north-facing cells.
const northXs = cells
  .filter(([x, z]) => {
    const fs = faces(x, z);
    return fs.length === 1 && fs[0].f === "north";
  })
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : null;
const doorZ = doorX === null ? null : cells.find(([x, z]) => x === doorX && faces(x, z).some((d) => d.f === "north") && faces(x, z).length === 1)?.[1];

const GLASS = "light_blue_stained_glass";

// Pass 1: foundation, floor slabs, walls, storey lines, cornice, parapet.
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  const fs = faces(x, z);
  const face = fs.length === 1 ? fs[0] : null;
  const i = face ? (face.dx !== 0 ? z : x) : -1;

  // Foundation below the cell's own ground, then the ground floor slab.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  // Storey line / floor slab over storey 1.
  put(x, gr + 5, z, "smooth_stone");

  // Roof deck (interior) or cornice (perimeter) at gr+10.
  put(x, gr + 10, z, fs.length ? "smooth_stone" : "light_gray_concrete");

  if (!fs.length) continue; // interior: no walls, air behind the facade

  // Ground storey (rows gr+1..gr+3): stone piers and shopfront glass.
  const groundPier = !face || i % 3 === 0;
  for (let r = 1; r <= 3; r++) {
    put(x, gr + r, z, groundPier ? "stone_bricks" : GLASS);
  }
  // Dark timber fascia over the shopfront.
  put(x, gr + 4, z, "dark_oak_planks");

  // Upper storey (rows gr+6..gr+9): white concrete piers, framed glass bays.
  const upperPier = !face || i % 3 === 0;
  for (let r = 6; r <= 9; r++) {
    if (upperPier) put(x, gr + r, z, "white_concrete");
    else if (r === 6 || r === 9) put(x, gr + r, z, "polished_andesite");
    else put(x, gr + r, z, GLASS);
  }

  // Parapet.
  put(x, gr + 11, z, "white_concrete");
}

// Pass 2: entrance door on the street (north) face.
if (doorX !== null && doorZ !== undefined) {
  const gr = gAt(doorX, doorZ);
  put(doorX, gr + 1, doorZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, gr + 2, doorZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Transom above the door stays glass.
  put(doorX, gr + 3, doorZ, GLASS);
}

// Pass 3: warm lights just inside the glass.
for (const [x, z] of cells) {
  const fs = faces(x, z);
  if (fs.length !== 1) continue;
  const face = fs[0];
  const i = face.dx !== 0 ? z : x;
  const ix = x - face.dx, iz = z - face.dz;
  if (!has(ix, iz)) continue;
  const igr = gAt(ix, iz);
  const gr = gAt(x, z);

  // Upper storey lantern standing on the storey-2 floor.
  if (i % 6 === 1) {
    put(ix, igr + 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // Ground storey shroomlight behind the shopfront glass.
  if (i % 6 === 4) {
    put(ix, igr + 2, iz, "shroomlight");
  }
}

// Pass 4: rooftop plant (two condenser units on the roof deck).
const plant = [
  [4, 5], [5, 5], [4, 6], [5, 6],
  [12, 15], [13, 15], [12, 16], [13, 16],
];
for (const [x, z] of plant) {
  if (!has(x, z)) continue;
  const gr = gAt(x, z);
  put(x, gr + 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
