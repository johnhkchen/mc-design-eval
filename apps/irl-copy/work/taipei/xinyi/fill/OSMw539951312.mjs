import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951312";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 13 x 28 footprint, roof about 11 blocks above lowest ground.
// Read as a 1960s-70s Xinyi-era two-storey commercial block: white concrete
// walls, glazed shopfront and upper windows, light grey storey lines and
// cornice, stone-brick plinth and parapet, rooftop plant box.
const W = 13, H = 23, D = 28;
const ROOF = 11;   // roof slab top course
const FL2 = 6;     // upper floor slab
const PARA = 12;   // parapet course

const g = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;
const inFp = new Set(cells.map(([x, z]) => key(x, z)));

const DIRS = [
  { dx: 1, dz: 0, f: "east" },
  { dx: -1, dz: 0, f: "west" },
  { dx: 0, dz: 1, f: "south" },
  { dx: 0, dz: -1, f: "north" },
];

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const facesOf = (x, z) => DIRS.filter((d) => !inFp.has(key(x + d.dx, z + d.dz)));

// Boundary info
const boundary = new Map();
for (const [x, z] of cells) boundary.set(key(x, z), facesOf(x, z));

// Main entrance: middle of the north-facing (street) edge
const northCells = cells
  .filter(([x, z]) => boundary.get(key(x, z)).some((f) => f.f === "north"))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
let doorKey = null;
if (northCells.length) {
  const mx = northCells[Math.floor(northCells.length / 2)];
  const dz = cells.find(([x, z]) => x === mx && boundary.get(key(x, z)).some((f) => f.f === "north"));
  if (dz) doorKey = key(dz[0], dz[1]);
}

// Facade logic for one boundary wall voxel at height y
function wallBlock(x, z, y, faces) {
  if (y === FL2) return { id: "light_gray_concrete" };
  if (faces.length !== 1) return { id: "white_concrete" }; // corner pier
  const f = faces[0];
  const a = f.dx !== 0 ? z : x;
  if (a % 3 !== 1) return { id: "white_concrete" };         // pier
  if (y < FL2) {
    if (y === FL2 - 1) return { id: "light_gray_concrete" }; // ground lintel
    return { id: "glass" };                                  // shopfront glass
  }
  if (y === FL2 + 1 || y === ROOF - 1) return { id: "light_gray_concrete" }; // sill / lintel
  return { id: "glass" };
}

// Pass 1: foundations, floors, walls, roof
for (const [x, z, gr] of cells) {
  const k = key(x, z);
  const faces = boundary.get(k);
  const isB = faces.length > 0;

  // Solid foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // Ground slab / plinth course
  put(x, gr, z, isB ? "stone_bricks" : "smooth_stone");

  // Ground floor and upper floor slab
  if (gr < FL2) {
    put(x, FL2, z, isB ? "light_gray_concrete" : "smooth_stone");
  }

  if (isB) {
    for (let y = gr + 1; y <= ROOF - 1; y++) {
      if (y >= FL2 + 0 && y === FL2) continue; // slab already placed
      if (y <= gr) continue;
      if (y < FL2 && k === doorKey && faces.some((f) => f.f === "north") && y <= gr + 2) {
        if (y === gr + 1) put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      const w = wallBlock(x, z, y, faces);
      put(x, y, z, w.id);
    }
    // Parapet
    put(x, PARA, z, "stone_bricks");
    // Cornice
    put(x, ROOF, z, "light_gray_concrete");
  } else {
    // Interior: roof slab only; air between storeys (no interiors)
    put(x, ROOF, z, "smooth_stone");
  }
}

// Pass 2: shroomlight behind selected upper windows, lanterns on corners,
// rooftop plant box.
for (const [x, z] of cells) {
  const k = key(x, z);
  const faces = boundary.get(k);
  if (!faces.length) continue;

  if (faces.length >= 2) {
    put(x, PARA + 1, z, "lantern", { hanging: "false" });
    continue;
  }
  const f = faces[0];
  const a = f.dx !== 0 ? z : x;
  if (a % 3 === 1 && a % 6 === 1) {
    const ix = x - f.dx, iz = z - f.dz;
    const ik = key(ix, iz);
    if (inFp.has(ik) && !boundary.get(ik).length) {
      put(ix, FL2 + 2, iz, "shroomlight");
    }
  }
}

// Rooftop plant box, centred on the footprint
for (const [x, z] of cells) {
  const k = key(x, z);
  if (boundary.get(k).length) continue;
  if (Math.abs(x - 6) <= 1 && Math.abs(z - 14) <= 2) {
    put(x, PARA, z, "gray_concrete");
    put(x, PARA + 1, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
