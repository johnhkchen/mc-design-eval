import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833637";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 23 x 21. Roof about 11 blocks above lowest ground: a two-storey
// 1990s Taipei commercial block with a shopfront ground floor, white tiled
// upper storey, black fascia, parapet and a flat gravel-grey roof with plant.
const W = 23, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const mask = new Set(cells.map(([x, z]) => key(x, z)));
const inMask = (x, z) => mask.has(key(x, z));

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Outward faces: facing name, step, and the index along the face (u).
const DIRS = [
  { facing: "east", dx: 1, dz: 0 },
  { facing: "west", dx: -1, dz: 0 },
  { facing: "south", dx: 0, dz: 1 },
  { facing: "north", dx: 0, dz: -1 },
];
const exposedFaces = (x, z) => DIRS.filter((d) => !inMask(x + d.dx, z + d.dz));
const alongU = (d, x, z) => (d.dx !== 0 ? z : x);

// Ground grade per cell (third number), and edge classification.
const edgeCells = [];
const interiorCells = [];
for (const [x, z, gr] of cells) {
  const faces = exposedFaces(x, z);
  if (faces.length) edgeCells.push({ x, z, gr, faces });
  else interiorCells.push({ x, z, gr });
}

// Entrance: middle of the south-facing frontage (or north if no south face).
const faceGroup = (name) => {
  const list = [];
  for (const e of edgeCells) {
    for (const f of e.faces) {
      if (f.facing === name) list.push({ x: e.x, z: e.z, gr: e.gr, d: f, u: alongU(f, e.x, e.z) });
    }
  }
  return list.sort((a, b) => a.u - b.u);
};
let entranceList = faceGroup("south");
if (!entranceList.length) entranceList = faceGroup("north");
const entrance = entranceList.length ? entranceList[Math.floor(entranceList.length / 2)] : null;
const entranceKey = entrance ? key(entrance.x, entrance.z) + "|" + entrance.d.facing : null;

// Pass 0: foundation, ground floor, storey floor slabs and roof on every cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");                 // ground floor slab
  put(x, gr + 5, z, "smooth_quartz");            // storey line slab
}

// Pass 1: envelope on edge cells (base course, tiled walls, fascia, parapet).
for (const { x, z, gr } of edgeCells) {
  put(x, gr, z, "stone_bricks");                 // base course
  for (let y = gr + 1; y <= gr + 9; y++) {
    if (y === gr + 4) put(x, y, z, "black_concrete");   // shopfront fascia
    else if (y === gr + 5) put(x, y, z, "smooth_stone"); // storey band
    else put(x, y, z, "smooth_quartz");
  }
  put(x, gr + 10, z, "white_concrete");          // parapet / cornice
}

// Pass 2: facade articulation per exposed face.
for (const { x, z, gr, faces } of edgeCells) {
  for (const f of faces) {
    const u = alongU(f, x, z);
    const inward = { x: x - f.dx, z: z - f.dz };
    const inwardIsInterior = inMask(inward.x, inward.z) &&
      !exposedFaces(inward.x, inward.z).length;

    // Ground floor shopfront: glass with white concrete mullions.
    const isEntrance = entranceKey === key(x, z) + "|" + f.facing;
    if (isEntrance) {
      put(x, gr + 1, z, "dark_oak_door", { facing: f.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: f.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "glass");
    } else {
      for (let y = gr + 1; y <= gr + 3; y++) {
        put(x, y, z, u % 4 === 0 ? "white_concrete" : "glass");
      }
    }

    // Upper storey windows: grid of glass with pillars every third cell.
    for (let y = gr + 6; y <= gr + 8; y++) {
      put(x, y, z, u % 3 === 0 ? "white_concrete" : "glass");
    }

    // Warm light behind some upper windows.
    if (u % 6 === 1 && inwardIsInterior) {
      put(inward.x, gr + 7, inward.z, "shroomlight");
    }
  }
}

// Pass 3: roof. Interior roof surface and rooftop plant.
for (const { x, z, gr } of interiorCells) {
  put(x, gr + 10, z, "gray_concrete");
}
for (const { x, z, gr } of edgeCells) {
  // parapet cap already set; interior-facing edge stays white concrete
  put(x, gr + 10, z, "white_concrete");
}

// Rooftop plant box near the centre of the footprint.
const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);
for (const { x, z, gr } of interiorCells) {
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 1 && gr + 11 < H) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

// Corner lanterns on the parapet for dusk read.
for (const { x, z, gr, faces } of edgeCells) {
  if (faces.length >= 2 && gr + 11 < H) {
    put(x, gr + 11, z, "sea_lantern");
  }
}

g.save(`${DIR}/${ID}.nbt`);
