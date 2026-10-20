import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538464248";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 13;
const ROOF_TOP = 10;      // parapet course; roof surface sits at y = 11
const FLOOR_LINE = 5;     // second-storey slab / band
const CORNICE = 9;        // cornice band under parapet
const GROUND_BAND = 4;    // lintel band over shopfront

const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const SLAB = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const LIGHT = "glowstone";

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);
const isEdge = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Door: two central cells on the south (high-z) facade
let minX = Infinity, maxX = -Infinity;
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z + 1) && x < minX) minX = x;
  if (!has(x, z + 1) && x > maxX) maxX = x;
}
const doorMid = Math.round((minX + maxX) / 2);
const doorXs = new Set([doorMid, doorMid + 1]);

const doorProps = (half) => ({
  facing: "south", half, hinge: "left", open: "false", powered: "false",
});

for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const faces = {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
  const edge = faces.N || faces.S || faces.W || faces.E;

  if (!edge) {
    // Interior: floor slabs, roof deck, roof units; air gap otherwise
    put(x, gr, z, SLAB);
    if (FLOOR_LINE >= gr) put(x, FLOOR_LINE, z, SLAB);
    if (ROOF_TOP >= gr) put(x, ROOF_TOP, z, SLAB);

    if ((x * 7 + z * 3) % 13 === 0 && x > 3 && x < W - 4 && z > 3 && z < D - 4) {
      put(x, ROOF_TOP + 1, z, "iron_block");
    }

    // Warm light just behind the facade glass
    const nearEdge = isEdge(x - 1, z) || isEdge(x + 1, z) || isEdge(x, z - 1) || isEdge(x, z + 1);
    if (nearEdge && (x + z) % 4 === 0) {
      if (2 > gr) put(x, 2, z, LIGHT);
      if (7 > gr && 7 < ROOF_TOP) put(x, 7, z, LIGHT);
    }
    continue;
  }

  // Facade: choose the face (front first so corners read as the street side)
  const face = faces.S ? "S" : faces.N ? "N" : faces.E ? "E" : "W";
  const p = face === "N" || face === "S" ? x : z;
  const isDoorCell = face === "S" && doorXs.has(x);

  for (let y = gr; y <= ROOF_TOP; y++) {
    let id = WALL;
    let props;

    if (y === ROOF_TOP) {
      id = WALL; // parapet cap
    } else if (y === CORNICE || y === FLOOR_LINE || y === GROUND_BAND) {
      id = BAND;
    } else if (y < GROUND_BAND) {
      // Ground storey: shopfront with piers
      if (y === gr) {
        id = BASE;
      } else if (isDoorCell && y <= gr + 1) {
        id = "dark_oak_door";
        props = doorProps(y === gr ? "lower" : "upper");
      } else if (isDoorCell) {
        id = WALL; // transom over door
      } else if (p % 3 === 0) {
        id = WALL;
      } else {
        id = GLASS;
      }
    } else {
      // Upper storeys: punched window grid
      id = p % 3 === 1 ? GLASS : WALL;
    }

    if (props) put(x, y, z, id, props);
    else put(x, y, z, id);
  }

  // Roof: the top of the wall is the parapet; add a roof deck inside the parapet
  // handled by interior cells; edge cells keep parapet at ROOF_TOP
}

g.save(`${DIR}/${ID}.nbt`);
