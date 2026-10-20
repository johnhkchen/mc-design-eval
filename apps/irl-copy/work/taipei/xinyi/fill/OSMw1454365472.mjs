import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 6 x 11 footprint, roof ~11 blocks above lowest ground.
// Read as a 1980s-90s Xinyi-style mid-rise shophouse: two storeys of 5 blocks,
// pale tiled concrete walls, stone base, quartz storey lines, a street-level
// shopfront with a red awning, a flat roof with a parapet and roof plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1454365472";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 23, D = 11;
const ROOF_Y = 11;     // roof membrane / cornice level
const PARAPET_Y = 12;  // parapet on exterior ring
const TOP_WALL_Y = 10; // top of second storey walls

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) {
  gmap.set(key(x, z), Math.max(0, Math.min(9, Math.round(gr))));
}
const has = (x, z) => gmap.has(key(x, z));
const groundOf = (x, z) => gmap.get(key(x, z));

// Faces: name, outward offset
const faces = [
  ["N", 0, -1],
  ["S", 0, 1],
  ["W", -1, 0],
  ["E", 1, 0],
];

const exteriorFaces = (x, z) =>
  faces.filter(([, dx, dz]) => !has(x + dx, z + dz));

// Along-face index and its maximum
const along = (f, x, z) => (f === "N" || f === "S" ? x : z);
const alongMax = (f) => (f === "N" || f === "S" ? W - 1 : D - 1);

// Street face is N (z = 0)
const STREET = "N";
const doorA = Math.floor((W - 1) / 2); // column on the street face for the entrance

// Pane connection props for a window on a given face
const paneProps = (f) =>
  f === "N" || f === "S"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Block for the exterior skin of a given face at height y
function faceBlock(f, x, z, y, gr) {
  const a = along(f, x, z);
  const L = alongMax(f);
  const corner = a === 0 || a === L;
  const pillar = a % 2 === 0;

  if (y === gr) return { id: "stone_bricks" };             // base course
  if (y === 5 || y === TOP_WALL_Y) return { id: "quartz_block" }; // storey lines

  if (f === STREET) {
    // Shopfront storey (y 1..4)
    if (y === 4) return { id: corner ? "light_gray_concrete" : "red_terracotta" }; // awning band
    if (corner) return { id: "light_gray_concrete" };
    if (a === doorA) {
      if (y === 3) return { id: "light_gray_concrete" };    // lintel above door
      if (y <= 2) return { id: "air", door: true };         // placeholder, door set later
    }
    if (y >= 1 && y <= 3) {
      return { id: "light_blue_stained_glass_pane", props: paneProps(f) };
    }
  }

  // Storey 1 upper section on non-street faces (y 1..4)
  if (y >= 1 && y <= 4 && f !== STREET) {
    if (y === 1 || y === 4) return { id: "light_gray_concrete" };
    if (corner || pillar) return { id: "light_gray_concrete" };
    return { id: "light_blue_stained_glass_pane", props: paneProps(f) };
  }

  // Storey 2 (y 6..9)
  if (y >= 6 && y <= 9) {
    if (y === 6 || y === 9) return { id: "light_gray_concrete" };
    if (corner || pillar) return { id: "light_gray_concrete" };
    return { id: "light_blue_stained_glass_pane", props: paneProps(f) };
  }

  return { id: "white_concrete" };
}

// 1. Foundation: solid from y0 up to each cell's ground
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.min(9, Math.round(gr)));
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");
}

// 2. Interior floor slabs and roof membrane, for every footprint cell
for (const [x, z] of [...gmap.keys()].map((k) => k.split(",").map(Number))) {
  const gr = groundOf(x, z);
  for (const fy of [5, TOP_WALL_Y]) {
    if (fy >= gr) put(x, fy, z, "smooth_stone");
  }
  put(x, ROOF_Y, z, "stone");
}

// 3. Exterior walls, windows, shopfront, cornice and parapet
for (const [x, z] of [...gmap.keys()].map((k) => k.split(",").map(Number))) {
  const gr = groundOf(x, z);
  const ext = exteriorFaces(x, z);
  if (ext.length === 0) continue;

  // Wall column from ground to top of storey 2
  for (let y = gr; y <= TOP_WALL_Y; y++) {
    // Pick the first exterior face that defines this block; windows win over skin
    let chosen = null;
    for (const [f] of ext) {
      const b = faceBlock(f, x, z, y, gr);
      if (!chosen || (chosen.id === "white_concrete" && b.id !== "white_concrete")) {
        chosen = b;
      }
    }
    if (!chosen) continue;
    if (chosen.door) {
      put(x, y, z, "white_concrete");
    } else if (chosen.props) {
      put(x, y, z, chosen.id, chosen.props);
    } else {
      put(x, y, z, chosen.id);
    }
  }

  // Cornice at roof line and parapet ring
  put(x, ROOF_Y, z, "quartz_block");
  put(x, PARAPET_Y, z, "white_concrete");
}

// 4. Door on the street face (two blocks tall, lower and upper)
if (has(doorA, 0)) {
  const gr = groundOf(doorA, 0);
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  if (1 >= gr) put(doorA, 1, 0, "oak_door", doorProps("lower"));
  if (2 >= gr) put(doorA, 2, 0, "oak_door", doorProps("upper"));
}

// 5. Warm lights behind some storey-2 glass (on the inside of the footprint)
for (const [x, z] of [...gmap.keys()].map((k) => k.split(",").map(Number))) {
  const gr = groundOf(x, z);
  for (const [f, dx, dz] of exteriorFaces(x, z)) {
    const a = along(f, x, z);
    const L = alongMax(f);
    if (a <= 0 || a >= L || a % 2 !== 1) continue;
    if (a % 4 !== 1) continue; // only some windows are lit
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz)) continue;
    const yLight = 7;
    if (yLight >= groundOf(ix, iz)) {
      put(ix, yLight, iz, "glowstone");
    }
  }
}

// 6. Roof plant and lightning rod on interior roof cells
for (const [x, z] of [[1, 2], [2, 2], [1, 3], [2, 3]]) {
  if (!has(x, z)) continue;
  if (exteriorFaces(x, z).length) continue;
  put(x, PARAPET_Y, z, "light_gray_concrete");
  put(x, PARAPET_Y + 1, z, "light_gray_concrete");
}
if (has(2, 5) && exteriorFaces(2, 5).length === 0) {
  for (let y = PARAPET_Y; y <= PARAPET_Y + 3; y++) {
    put(2, y, 5, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
