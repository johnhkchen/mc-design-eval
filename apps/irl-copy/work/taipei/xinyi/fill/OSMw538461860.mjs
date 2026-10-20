import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538461860";
const W = 13, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// footprint: key -> ground (rounded, clamped)
const footprint = new Map();
for (const [x, z, gr] of cells) {
  footprint.set(key(x, z), Math.max(0, Math.min(H - 1, Math.round(gr))));
}

const base = Math.min(...footprint.values());   // lowest ground = y reference
const L1 = base + 5;                            // storey 1 / 2 floor line
const L2 = base + 10;                           // cornice band over storey 2
const R = base + 11;                            // roof deck (about 11 above lowest ground)

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of footprint.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const FACES = [
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 0, dz: -1, name: "north" },
];
const exteriorFaces = (x, z) =>
  FACES.filter((f) => !footprint.has(key(x + f.dx, z + f.dz)));

// Entrance: south (+z) face, cell nearest the middle of the frontage
const southCells = [];
for (const k of footprint.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!footprint.has(key(x, z + 1))) southCells.push(x);
}
const midX = Math.floor((minX + maxX) / 2);
let entX = null;
if (southCells.length) {
  entX = southCells.reduce((a, b) => (Math.abs(b - midX) < Math.abs(a - midX) ? b : a));
}
const entranceKey = entX === null ? null : key(entX, maxZ);

// Pass 1: foundations, floor slabs, roof deck, walls, parapet
for (const [k, gr] of footprint) {
  const [x, z] = k.split(",").map(Number);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // storey floor between storey 1 and storey 2 (interior only; facade overwrites)
  if (L1 > gr && L1 < R) put(x, L1, z, "light_gray_concrete");

  // roof deck
  if (R >= gr) put(x, R, z, "light_gray_concrete");

  const ext = exteriorFaces(x, z);
  if (!ext.length) continue;

  const f = ext[0];
  const along = f.dx !== 0 ? z - minZ : x - minX;
  const corner = ext.length > 1;
  const pier = corner || along % 3 === 0;
  const lit = !pier && along % 6 === 1;

  for (let y = gr; y < R; y++) {
    let id = "white_concrete";
    if (y === gr) id = "polished_granite";                 // base course
    else if (y === L1 || y === L2) id = "smooth_quartz";   // storey lines / cornice
    else if (pier) id = "smooth_quartz";                   // piers
    else {
      id = "light_blue_stained_glass";                     // tinted glass
      if (lit && (y === L1 + 2 || y === gr + 2)) id = "shroomlight"; // warm lamp in window
    }
    put(x, y, z, id);
  }

  // parapet and cap on exterior edge
  put(x, R + 1, z, "smooth_quartz");
  put(x, R + 2, z, "smooth_quartz");
  put(x, R + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: entrance on the south frontage
if (entranceKey) {
  const [ex, ez] = entranceKey.split(",").map(Number);
  const gr = footprint.get(entranceKey);
  put(ex, gr + 1, ez, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(ex, gr + 2, ez, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(ex, gr + 3, ez, "smooth_quartz");                   // lintel over door
  // warm light flanking the entrance
  for (const dx of [-1, 1]) {
    const nk = key(ex + dx, ez);
    if (footprint.has(nk) && exteriorFaces(ex + dx, ez).some((f) => f.name === "south")) {
      const ng = footprint.get(nk);
      if (gr + 2 < L1) put(ex + dx, gr + 2, ez, "shroomlight");
      void ng;
    }
  }
}

// Pass 3: rooftop plant room and a smaller penthouse on the roof deck
for (const [k] of footprint) {
  const [x, z] = k.split(",").map(Number);
  if (exteriorFaces(x, z).length) continue;
  if (x >= 3 && x <= 9 && z >= 6 && z <= 15) {
    put(x, R + 1, z, "light_gray_concrete");
    put(x, R + 2, z, "light_gray_concrete");
  }
  if (x >= 5 && x <= 7 && z >= 9 && z <= 12) {
    put(x, R + 3, z, "smooth_quartz");
    put(x, R + 4, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
