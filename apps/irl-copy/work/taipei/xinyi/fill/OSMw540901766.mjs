import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no building record. Lidar gives a roof about 11 blocks above the lowest ground.
// Read: a 1970s-80s Taipei mid-rise shophouse block. Two storeys of about 5 blocks, with a
// shopfront ground storey, cream and white concrete piers, light grey storey lines,
// a quartz parapet, water tank and stair hut on the roof, and warm lights behind the glass.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540901766";
const W = 10, H = 23, D = 18;
const ROOF = 10; // parapet top course; roof deck sits at y 10 inside, equipment starts at y 11

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));

const inFp = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, name, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};
const setBlock = (x, y, z, name, props) => {
  if (name === "pane") {
    name = "light_blue_stained_glass_pane";
  }
  put(x, y, z, name, props);
};

// Which outward face a perimeter cell sits on, and its position along that face.
function faceOf(x, z) {
  if (!inFp(x, z - 1)) return { face: "front", u: x, L: W };
  if (!inFp(x, z + 1)) return { face: "back", u: x, L: W };
  if (!inFp(x - 1, z)) return { face: "west", u: z, L: D };
  return { face: "east", u: z, L: D };
}

const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundations, shell, floor slabs, roof deck
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!isPerim(x, z)) {
    // interior: no rooms, just an air gap, a floor slab at y 5, and the roof deck
    if (gr <= 5) put(x, 5, z, "smooth_stone");
    put(x, ROOF, z, "smooth_stone");
    continue;
  }

  const { face, u, L } = faceOf(x, z);
  const pier = u === 0 || u === L - 1 || u % 3 === 0;
  const paneProps = face === "front" || face === "back" ? PANE_X : PANE_Z;

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      setBlock(x, y, z, "quartz_block"); // parapet
    } else if (y === 9) {
      setBlock(x, y, z, "light_gray_concrete"); // cornice band
    } else if (y === gr && gr <= 4) {
      setBlock(x, y, z, "stone_bricks"); // base course
    } else if (y === 5) {
      setBlock(x, y, z, "light_gray_concrete"); // storey line / floor slab edge
    } else if (y < 5) {
      // ground storey: shopfront
      if (pier) setBlock(x, y, z, "white_concrete");
      else if (y === 4) setBlock(x, y, z, "light_gray_concrete"); // lintel
      else setBlock(x, y, z, "pane", paneProps);
    } else {
      // upper storey: window grid
      if (pier) setBlock(x, y, z, "white_concrete");
      else setBlock(x, y, z, "pane", paneProps);
    }
  }
}

// 2. Entrance on the street face
for (const [x, z, gr] of cells) {
  if (x === 4 && z === 0 && gr <= 3) {
    put(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// 3. Warm lights behind the glass (interior cells only)
for (const [x, z, gr] of cells) {
  if (z !== 1 || isPerim(x, z)) continue;
  if (gr <= 4 && (x === 2 || x === 6)) {
    put(x, 4, z, "lantern", { hanging: "true", waterlogged: "false" }); // hangs from the y 5 slab
  }
  if (gr <= 6) {
    if (x === 2 || x === 7) put(x, 7, z, "glowstone");
    if (x === 5) put(x, 7, z, "shroomlight");
  }
}

// 4. Roof equipment: stair hut and water tank
const onRoof = (x, z) => inFp(x, z) && !isPerim(x, z);
for (let x = 2; x <= 4; x++) {
  for (let z = 5; z <= 7; z++) {
    if (!onRoof(x, z)) continue;
    put(x, 11, z, "quartz_block");
    put(x, 12, z, "quartz_block");
    put(x, 13, z, "light_gray_concrete");
  }
}
for (let x = 6; x <= 7; x++) {
  for (let z = 11; z <= 12; z++) {
    if (!onRoof(x, z)) continue;
    put(x, 11, z, "iron_block");
    put(x, 12, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
