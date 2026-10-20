import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 卡蒂雅大廈: 1970s-80s Taipei mid-rise, two storeys of shopfronts and offices,
// quartz-clad piers, light-blue glass bands, parapet roof with mechanical box.
const W = 23, H = 23, D = 27;
const ROOF = 10;            // top block index of roof deck and parapet (roof top at y=11)
const CORNICE = 9;
const BELT = 5;             // storey line between floors
const LINTEL = 4;           // head of ground-floor shopfronts

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw774689159.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw774689159.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

const outwardFaces = (x, z) => {
  const f = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) f.push(name);
  }
  return f;
};

// Pick the entrance: a north-facing edge cell nearest the middle of the frontage (x 11).
let front = "north";
let entry = null;
const northCells = [];
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (outwardFaces(x, z).includes("north")) northCells.push([x, z]);
}
if (northCells.length === 0) {
  const [x0, z0] = [...ground.keys()][0].split(",").map(Number);
  front = outwardFaces(x0, z0)[0] ?? "north";
}
const frontCells = [];
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (outwardFaces(x, z).includes(front)) frontCells.push([x, z]);
}
for (const [x, z] of frontCells) {
  if (!entry || Math.abs(x - 11) < Math.abs(entry.x - 11)) entry = { x, z };
}

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Interior cells: floor slab at each storey line and roof deck, air in between.
// 3. Edge cells: walls, piers, glazing, cornice, parapet.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const faces = outwardFaces(x, z);
  const isEdge = faces.length > 0;

  if (!isEdge) {
    g.set(x, BELT, z, "smooth_stone");
    g.set(x, ROOF, z, "stone_bricks");
    // Penthouse / mechanical plant on the roof, centred.
    if (x >= 9 && x <= 13 && z >= 11 && z <= 15) {
      g.set(x, ROOF + 1, z, "light_gray_concrete");
    }
    continue;
  }

  const isCorner = faces.length >= 2;
  const face = isCorner ? (faces.includes(front) ? front : faces[0]) : faces[0];
  const isEntry = entry && entry.x === x && entry.z === z;
  const t = (face === "north" || face === "south") ? x : z;

  for (let y = gr; y <= ROOF; y++) {
    // Entrance door and its lintel on the front face.
    if (isEntry && y >= gr + 1 && y <= gr + 3) {
      if (y === gr + 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: face, half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (y === gr + 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: face, half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else {
        g.set(x, y, z, "quartz_block");
      }
      continue;
    }

    if (y === ROOF) { g.set(x, y, z, "quartz_block"); continue; }          // parapet
    if (y === CORNICE) { g.set(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === BELT || y === LINTEL) { g.set(x, y, z, "quartz_block"); continue; }
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }            // base course
    if (isCorner) { g.set(x, y, z, "quartz_block"); continue; }            // corner pier
    if (t % 3 === 0) { g.set(x, y, z, "quartz_block"); continue; }         // pier between bays

    if (y >= 1 && y <= 3) {
      // Ground-floor shopfront glazing.
      g.set(x, y, z, "glass");
    } else if (y >= 6 && y <= 8) {
      // Upper-storey window bays.
      g.set(x, y, z, "light_blue_stained_glass");
      // Warm glow behind some windows, on the interior cell just inside the wall.
      if (y === 7 && t % 6 === 2) {
        const [dx, dz] = DIRS[face];
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz) && outwardFaces(ix, iz).length === 0) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    } else {
      g.set(x, y, z, "quartz_block");
    }
  }

  // Hanging lantern under the entrance canopy line, inside the lobby.
  if (isEntry) {
    const [dx, dz] = DIRS[face];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz)) {
      g.set(ix, gr + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(OUT);
