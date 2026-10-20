import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 25 x 18 footprint, roof ~26 blocks above lowest ground.
// Read as a late-1980s Taipei commercial office block: five storeys of 5 blocks,
// beige tiled piers and spandrels, blue-tinted glazing, a granite-faced
// ground-floor shopfront with a central entrance, a parapet cornice and a
// rooftop plant room with a lightning rod.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw1042397477.cells.json`, "utf8"));

const W = 25, H = 38, D = 18;
const TOP = 25;          // top block of the roof deck / parapet (roof surface about y 26)
const STOREY = 5;
const STOREYS = 5;

const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inS = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isPerim = (x, z) => NB.some(([dx, dz]) => !inS(x + dx, z + dz));
const onNS = (x, z) => !inS(x, z + 1) || !inS(x, z - 1);
const onEW = (x, z) => !inS(x + 1, z) || !inS(x - 1, z);
const isPier = (x, z) => {
  if (onNS(x, z) && onEW(x, z)) return true;           // corners
  const idx = onNS(x, z) ? x : z;                      // bays along the face
  return idx % 3 === 0;
};

// Entrance: front (+z) perimeter cells near the centre of the footprint.
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length;
const doorCells = new Set(
  cells
    .filter(([x, z]) => !inS(x, z + 1) && Math.abs(x - Math.round(cx)) <= 1)
    .map(([x, z]) => `${x},${z}`)
);
const isDoor = (x, z) => doorCells.has(`${x},${z}`);

// Rooftop plant room footprint (only if every cell is interior and present).
const RX0 = 8, RX1 = 16, RZ0 = 5, RZ1 = 12;
let plant = true;
for (let x = RX0; x <= RX1; x++)
  for (let z = RZ0; z <= RZ1; z++)
    if (!inS(x, z) || isPerim(x, z)) plant = false;

const inPlant = (x, z) => plant && x >= RX0 && x <= RX1 && z >= RZ0 && z <= RZ1;
const plantEdge = (x, z) => inPlant(x, z) && (x === RX0 || x === RX1 || z === RZ0 || z === RZ1);

function facadeElement(x, y, z, gr) {
  const k = Math.floor(y / STOREY);
  const o = y % STOREY;

  if (k === 0) {
    if (o === 0) return ["polished_granite"];
    if (isDoor(x, z) && gr <= 1 && (o === 1 || o === 2)) {
      const half = o === 1 ? "lower" : "upper";
      return ["dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" }];
    }
    if (isDoor(x, z) && gr <= 1 && o === 3) {
      return ["lantern", { hanging: "true", waterlogged: "false" }];
    }
    if (isPier(x, z)) return ["smooth_quartz"];
    if (o === 4) return ["gray_concrete"];
    return ["light_blue_stained_glass"];
  }

  if (o === 0) return ["light_gray_concrete"];      // spandrel / storey line
  if (o === 4) return ["smooth_quartz"];            // wall course
  if (isPier(x, z)) return ["smooth_quartz"];
  return ["light_blue_stained_glass"];
}

// Pass 1: foundations, facades, interior floors and roof deck.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (isPerim(x, z)) {
    for (let y = gr; y < TOP; y++) {
      const [blk, props] = facadeElement(x, y, z, gr);
      if (props) g.set(x, y, z, blk, props);
      else g.set(x, y, z, blk);
    }
    // Parapet cornice on the roof line.
    g.set(x, TOP, z, "smooth_quartz");
  } else {
    // Floor slabs per storey and the roof deck; interior is air.
    for (let k = 0; k < STOREYS; k++) {
      const fy = k * STOREY;
      if (fy >= gr) g.set(x, fy, z, "gray_concrete");
    }
    g.set(x, TOP, z, "gray_concrete");
  }
}

// Pass 2: warm lights set back behind some window glass (interior air side).
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  for (let k = 1; k < STOREYS; k++) {
    const y = k * STOREY + 2;
    if (y < gr || y >= TOP) continue;
    if (isPier(x, z)) continue;
    if ((x * 5 + z * 7 + k) % 7 !== 0) continue;
    const inward = NB.find(([dx, dz]) => inS(x + dx, z + dz) && !isPerim(x + dx, z + dz));
    if (!inward) continue;
    g.set(x + inward[0], y, z + inward[1], "glowstone");
  }
}

// Pass 3: rooftop plant room with louvred walls, roof slab and a lightning rod.
if (plant) {
  for (let x = RX0; x <= RX1; x++) {
    for (let z = RZ0; z <= RZ1; z++) {
      for (let y = TOP + 1; y <= TOP + 3; y++) {
        if (plantEdge(x, z)) g.set(x, y, z, "light_gray_concrete");
      }
      g.set(x, TOP + 4, z, "gray_concrete");
    }
  }
  g.set(12, TOP + 5, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  for (let y = TOP + 6; y <= TOP + 8; y++) {
    g.set(12, y, 8, "iron_bars", {
      north: "false", south: "false", east: "false", west: "false", waterlogged: "false",
    });
  }
}

g.save(`${DIR}/OSMw1042397477.nbt`);
