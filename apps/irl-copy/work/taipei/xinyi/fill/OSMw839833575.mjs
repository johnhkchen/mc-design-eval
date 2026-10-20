import { writeFileSync, readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: footprint 17 x 19, roof ~11 blocks above lowest ground.
// Read as a 1970s-90s Xinyi-style low commercial block: two storeys of white
// concrete with a stone base, a glazed shopfront, a second-floor window band,
// a smooth cornice, a flat light-grey roof with a parapet, and rooftop plant.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833575.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833575.nbt";

const W = 17, H = 23, D = 19;
const ROOF = 10;      // roof slab top layer
const PARAPET = 11;   // parapet top, roof about 11 blocks above lowest ground
const FLOOR = 5;      // second-floor slab / storey line

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

const paneProps = (face) => {
  const alongX = face === "north" || face === "south";
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
};

const setIf = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: foundations, floor slabs, roof slab on every footprint cell.
for (const [x, z, gr0] of cells) {
  const gr = Math.min(Math.max(0, gr0), 9);
  for (let y = 0; y < gr; y++) setIf(x, y, z, "stone");
  if (gr <= FLOOR) setIf(x, FLOOR, z, "smooth_stone");
  setIf(x, ROOF, z, "light_gray_concrete");
}

// Pass 2: facades on boundary cells.
const entrance = { x: 8, z: 0 }; // north face, centre-ish bay
for (const [x, z, gr0] of cells) {
  const gr = Math.min(Math.max(0, gr0), 9);
  const faces = [];
  for (const [dx, dz, name] of DIRS) if (!has(x + dx, z + dz)) faces.push(name);
  if (faces.length === 0) continue;

  // Corner cells: solid pillars with base, cornice and parapet.
  if (faces.length >= 2) {
    for (let y = gr; y <= PARAPET; y++) {
      let id = "white_concrete";
      if (y === gr) id = "stone_bricks";
      else if (y === FLOOR || y === ROOF) id = "smooth_stone";
      setIf(x, y, z, id);
    }
    continue;
  }

  const face = faces[0];
  const alongX = face === "north" || face === "south";
  const u = alongX ? x : z;
  const winCol = u % 3 === 1;

  for (let y = gr; y <= PARAPET; y++) {
    let id = null;
    let props = null;

    if (y === gr) {
      id = "stone_bricks";                                  // base course
    } else if (y === FLOOR || y === ROOF) {
      id = "smooth_stone";                                  // storey line / cornice
    } else if (y === PARAPET) {
      id = "white_concrete";                                // parapet
    } else if (y < FLOOR) {
      // ground-floor shopfront
      if (winCol && y >= gr + 1 && y <= gr + 3) { id = "glass_pane"; props = paneProps(face); }
      else id = "light_gray_concrete";
    } else if (y >= 6 && y <= 8) {
      // second-storey window band
      if (winCol) { id = "glass_pane"; props = paneProps(face); }
      else id = "white_concrete";
    } else {
      id = "white_concrete";                                // lintel at 9
    }

    setIf(x, y, z, id, props);
  }

  // Entrance door on the north face.
  if (face === "north" && x === entrance.x && gr <= 8) {
    const doorProps = (half) => ({
      facing: "north", half, hinge: "left", open: "false", powered: "false",
    });
    setIf(x, gr, z, "dark_oak_door", doorProps("lower"));
    setIf(x, gr + 1, z, "dark_oak_door", doorProps("upper"));
    setIf(x, gr + 2, z, "white_concrete");
  }
}

// Pass 3: warm light behind glass (interior air gap side).
for (const [x, z, gr0] of cells) {
  const gr = Math.min(Math.max(0, gr0), 9);
  const faces = [];
  for (const [dx, dz, name] of DIRS) if (!has(x + dx, z + dz)) faces.push(name);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const alongX = face === "north" || face === "south";
  const u = alongX ? x : z;
  if (u % 3 !== 1) continue;

  // inward offset from the exterior face
  const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[face];
  const ix = x + inward[0], iz = z + inward[1];
  if (!has(ix, iz) || faces.length !== 1) continue;
  if (has(ix + inward[0], iz + inward[1]) === false) continue;

  // second-storey lights in some windows
  if (u % 6 === 1) setIf(ix, 7, iz, "glowstone");
  // ground-floor lanterns in others
  if (u % 6 === 4 && gr + 2 < FLOOR) setIf(ix, gr + 2, iz, "glowstone");
}

// Pass 4: rooftop plant (AC boxes and a stair-access housing) on interior roof.
const plant = [
  { x: 4, z: 5, w: 3, d: 2, h: 2 },
  { x: 10, z: 12, w: 2, d: 3, h: 2 },
];
for (const p of plant) {
  let ok = true;
  for (let dx = 0; dx < p.w; dx++) for (let dz = 0; dz < p.d; dz++) {
    if (!has(p.x + dx, p.z + dz)) ok = false;
  }
  if (!ok) continue;
  for (let dx = 0; dx < p.w; dx++) for (let dz = 0; dz < p.d; dz++) {
    for (let y = ROOF + 1; y <= ROOF + p.h; y++) {
      setIf(p.x + dx, y, p.z + dz, "iron_block");
    }
  }
}

g.save(OUT);
