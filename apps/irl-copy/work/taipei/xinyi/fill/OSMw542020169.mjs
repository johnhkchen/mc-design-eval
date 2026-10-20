import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Taipei commercial block (1980s-90s): white tiled concrete walls,
// light-grey cornices, a glazed shopfront with a central entrance, two storeys
// of ribbon windows, and a parapet with a small rooftop plant enclosure.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020169";
const W = 11, D = 11, H = 23;
const ROOF_TOP = 11;     // parapet top sits ~11 blocks above lowest ground
const FLOOR2 = 5;        // second-floor slab
const ROOF = 10;         // roof slab (top of upper storey)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gmap = new Map();
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, Math.max(0, Math.min(10, Math.round(gr))));
}

const g = new Voxels([W, H, D]);

const isEdge = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// Face and index along that face; street frontage is the z = 0 (north) face.
function faceOf(x, z) {
  if (z === 0) return { face: "north", i: x };
  if (z === D - 1) return { face: "south", i: x };
  if (x === 0) return { face: "west", i: z };
  return { face: "east", i: z };
}

for (const [x, z] of [...gmap.keys()].map((k) => k.split(",").map(Number))) {
  const gr = gmap.get(`${x},${z}`);

  // 1. Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: floor slabs only, air gaps between them (no interiors).
    if (gr <= 4) g.set(x, gr, z, "smooth_stone");          // ground floor slab
    if (gr <= FLOOR2) g.set(x, FLOOR2, z, "smooth_stone"); // second floor slab
    g.set(x, ROOF, z, "smooth_stone");                     // roof slab
    continue;
  }

  // 2. Perimeter envelope from its ground up to the parapet.
  const { face, i } = faceOf(x, z);
  const corner = isCorner(x, z);
  const mull = corner || i % 3 === 2; // mullions at i = 2, 5, 8
  const front = face === "north";
  const doorCell = front && i === 5 && gr <= 1;

  for (let y = gr; y <= ROOF_TOP; y++) {
    let mat;
    let props;

    if (y === ROOF_TOP) {
      mat = corner ? "light_gray_concrete" : "white_concrete";      // parapet cap
    } else if (y === ROOF) {
      mat = "light_gray_concrete";                                  // cornice
    } else if (y === 9) {
      mat = "white_concrete";                                       // upper lintel
    } else if (y >= 6 && y <= 8) {
      mat = mull ? "white_concrete" : "light_blue_stained_glass";  // upper ribbon windows
    } else if (y === FLOOR2) {
      mat = "white_concrete";                                       // string course
    } else if (y === 4) {
      mat = "light_gray_concrete";                                  // shopfront fascia
    } else if (y === gr) {
      mat = "polished_andesite";                                    // base course
    } else {
      // ground storey, y between gr+1 and 3
      mat = mull ? "white_concrete" : "light_blue_stained_glass";
      if (doorCell) {
        if (y === gr + 1) {
          mat = "oak_door";
          props = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" };
        } else if (y === gr + 2) {
          mat = "oak_door";
          props = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" };
        } else if (y === gr + 3 && gr + 3 <= 3) {
          mat = "lantern";
          props = { hanging: "true", waterlogged: "false" };
        }
      }
    }

    if (props) g.set(x, y, z, mat, props);
    else g.set(x, y, z, mat);
  }
}

// Interior floor slabs under the perimeter ring so spans sit on the walls.
for (let x = 1; x < W - 1; x++) {
  for (let z = 1; z < D - 1; z++) {
    if (!gmap.has(`${x},${z}`)) continue;
    const gr = gmap.get(`${x},${z}`);
    if (gr <= 4) g.set(x, gr, z, "smooth_stone");
    if (gr <= FLOOR2) g.set(x, FLOOR2, z, "smooth_stone");
    g.set(x, ROOF, z, "smooth_stone");
  }
}

// Warm light behind some windows (interior air gaps).
for (const i of [3, 7]) {
  const gr = gmap.get(`${i},1`);
  if (gr !== undefined && gr + 2 <= 3) g.set(i, gr + 2, 1, "glowstone");
}
for (const i of [3, 7]) {
  const gr = gmap.get(`${i},9`);
  if (gr !== undefined) g.set(i, 7, 9, "shroomlight");
}
{
  const gr = gmap.get("4,1");
  if (gr !== undefined && gr + 2 <= 3) g.set(4, gr + 2, 1, "glowstone");
}

// Rooftop plant enclosure on the parapet line, centred.
for (let x = 4; x <= 6; x++) {
  for (let z = 4; z <= 6; z++) {
    if (!gmap.has(`${x},${z}`)) continue;
    g.set(x, ROOF_TOP, z, "light_gray_concrete");
    if (x === 5 && z === 5) g.set(x, ROOF_TOP + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
