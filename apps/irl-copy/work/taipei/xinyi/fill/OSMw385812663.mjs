import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 和平樓 (Heping Building), Xinyi. Mid-century reinforced-concrete block, four storeys
// of 5 blocks, white rendered walls, stone-faced base, light-grey storey lines,
// glazed bays with pillars, ground-floor shopfronts with entrances, parapet and a
// rooftop penthouse with plant and mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw385812663";
const W = 92, H = 33, D = 23;
const STOREY = 5;
const STOREYS = 4;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, Math.round(gr));
const inFoot = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);
const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));

const g = new Voxels([W, H, D]);

function set(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Writes only on footprint cells.
function setOn(x, z, y, id, props) {
  if (!inFoot(x, z)) return;
  set(x, y, z, id, props);
}

const SIDES = [
  { nx: 0, nz: -1 }, // z-min face (street frontage)
  { nx: 0, nz: 1 },  // z-max face (rear)
  { nx: -1, nz: 0 }, // x-min face
  { nx: 1, nz: 0 },  // x-max face
];

// Footprint extents, used to place the street-face features.
const zMin = Math.min(...cellList.map(([, z]) => z));
const xMin = Math.min(...cellList.map(([x]) => x));
const xMax = Math.max(...cellList.map(([x]) => x));
const zMax = Math.max(...cellList.map(([, z]) => z));

// 1. Foundation: solid from y 0 up to each cell's ground, so nothing floats.
for (const [x, z] of cellList) {
  const gr = groundAt(x, z);
  for (let y = 0; y < gr; y++) setOn(x, z, y, "stone_bricks");
}

// 2. Interior floor slabs for each storey and the roof deck, across the whole footprint.
for (const [x, z] of cellList) {
  const gr = groundAt(x, z);
  for (let s = 0; s < STOREYS; s++) setOn(x, z, gr + STOREY * s, "light_gray_concrete");
  setOn(x, z, gr + STOREY * STOREYS, "gray_concrete");
}

// 3. Exterior faces on perimeter cells only.
for (const [x, z] of cellList) {
  const gr = groundAt(x, z);
  for (const { nx, nz } of SIDES) {
    if (inFoot(x + nx, z + nz)) continue;
    const u = nx !== 0 ? z : x;           // position along the face
    const pillar = u % 4 === 0;
    for (let s = 0; s < STOREYS; s++) {
      const b = gr + STOREY * s;
      const ground0 = s === 0;
      // Floor line / base course
      setOn(x, z, b, ground0 ? "stone_bricks" : "light_gray_concrete");
      if (pillar) {
        for (let dy = 1; dy <= 4; dy++) setOn(x, z, b + dy, ground0 ? "stone_bricks" : "white_concrete");
      } else if (ground0) {
        // Shopfront: glazing with a stone fascia above.
        setOn(x, z, b + 1, "glass_pane");
        setOn(x, z, b + 2, "glass_pane");
        setOn(x, z, b + 3, "glass_pane");
        setOn(x, z, b + 4, "stone_bricks");
      } else {
        // Upper bay: glazing, light-grey sill/lintel band, white spandrel.
        setOn(x, z, b + 1, "glass_pane");
        setOn(x, z, b + 2, "glass_pane");
        setOn(x, z, b + 3, "light_gray_concrete");
        setOn(x, z, b + 4, "white_concrete");
      }
    }
    // Cornice band under the parapet.
    setOn(x, z, gr + STOREY * STOREYS, "light_gray_concrete");
  }
}

// 4. Parapet on the roof edge.
for (const [x, z] of cellList) {
  const gr = groundAt(x, z);
  const edge = SIDES.some(({ nx, nz }) => !inFoot(x + nx, z + nz));
  if (edge) setOn(x, z, gr + STOREY * STOREYS + 1, "stone_brick_wall");
}

// 5. Rooftop penthouse, x 36..55, z 6..16.
for (const [x, z] of cellList) {
  if (x < 36 || x > 55 || z < 6 || z > 16) continue;
  const gr = groundAt(x, z);
  const base = gr + STOREY * STOREYS;
  const edge = x === 36 || x === 55 || z === 6 || z === 16;
  if (edge) {
    setOn(x, z, base + 1, "white_concrete");
    setOn(x, z, base + 2, (x + z) % 4 !== 0 ? "glass_pane" : "white_concrete");
    setOn(x, z, base + 3, "white_concrete");
  }
  setOn(x, z, base + 4, "smooth_stone");
}
if (inFoot(46, 6)) {
  const pb = groundAt(46, 6) + STOREY * STOREYS;
  setOn(46, 6, pb + 1, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  setOn(46, 6, pb + 2, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// 6. Rooftop plant and antenna mast.
for (const [x, z] of [[8, 5], [12, 5], [8, 9], [12, 9]]) {
  if (!inFoot(x, z)) continue;
  setOn(x, z, groundAt(x, z) + STOREY * STOREYS + 1, "iron_block");
}
if (inFoot(46, 11)) {
  const mb = groundAt(46, 11) + STOREY * STOREYS + 5;
  for (let dy = 0; dy < 4; dy++) setOn(46, 11, mb + dy, "iron_bars");
  setOn(46, 11, mb + 4, "lightning_rod");
}

// 7. Entrances on the street face: two doors on the z-min edge, lanterns above.
// Positions are chosen from the cells that actually exist on that edge.
const streetCells = cellList
  .filter(([, z]) => z === zMin)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entrancePicks = streetCells.length
  ? [streetCells[Math.floor(streetCells.length * 0.2)], streetCells[Math.floor(streetCells.length * 0.8)]]
  : [];
for (const ex of entrancePicks) {
  if (!inFoot(ex, zMin)) continue;
  const gr = groundAt(ex, zMin);
  setOn(ex, zMin, gr + 1, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  setOn(ex, zMin, gr + 2, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  setOn(ex, zMin, gr + 3, "lantern", { hanging: "true" });
  // Flanking lanterns on the fascia line for the entrance read at street level.
  if (inFoot(ex - 1, zMin)) setOn(ex - 1, zMin, groundAt(ex - 1, zMin) + 3, "lantern", { hanging: "true" });
  if (inFoot(ex + 1, zMin)) setOn(ex + 1, zMin, groundAt(ex + 1, zMin) + 3, "lantern", { hanging: "true" });
}

// 8. Warm light behind some glazed bays on storeys 1..3 (glowstone just inside the glass).
for (const [x, z] of cellList) {
  const gr = groundAt(x, z);
  for (const { nx, nz } of SIDES) {
    if (inFoot(x + nx, z + nz)) continue;
    const u = nx !== 0 ? z : x;
    if (u % 4 !== 2) continue;
    for (let s = 1; s < STOREYS; s++) {
      if ((u + s) % 3 !== 0) continue;
      const ix = x - nx, iz = z - nz;
      if (!inFoot(ix, iz)) continue;
      setOn(ix, iz, gr + STOREY * s + 2, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
