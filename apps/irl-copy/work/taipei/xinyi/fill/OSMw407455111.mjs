import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407455111";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 58, H = 38, D = 55;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground level
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));

const inFp = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// Outward normal for edge cells (direction of a missing neighbour), else null
function outward(x, z) {
  if (!inFp(x, z - 1)) return [0, -1];
  if (!inFp(x, z + 1)) return [0, 1];
  if (!inFp(x + 1, z)) return [1, 0];
  if (!inFp(x - 1, z)) return [-1, 0];
  return null;
}

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const ROOF_Y = 26;      // roof deck sits on slab at y=25
const PARAPET_TOP = 27;
const TOP_SLAB = 25;

const doorLower = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const doorUpper = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };

const keys = [...ground.keys()].map((k) => k.split(",").map(Number));
for (const [x, z] of keys) {
  const gr = groundAt(x, z);
  const nrm = outward(x, z);
  const isEdge = nrm !== null;

  // Foundation: solid from y 0 up to this cell's ground, stone base course on the edge
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (isEdge) put(x, gr, z, "stone_bricks");

  // Floor slab at this cell's own ground level (solid across footprint)
  if (!isEdge) put(x, gr, z, "smooth_quartz");

  // Storey columns above ground up to the roof deck
  for (let y = gr + 1; y < TOP_SLAB; y++) {
    const r = y % 5;
    if (r === 0) {
      // Storey line slab, solid across footprint
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (!isEdge) continue; // interior stays air; no interiors

    const [nx, nz] = nrm;
    const u = nx !== 0 ? z : x;       // position along the face
    const inX = -nx, inZ = -nz;        // inward offset
    const isGroundStorey = y < 5;

    if (r === 4) {
      // Spandrel band; vertical pier continuation keeps the grid reading
      put(x, y, z, u % 4 === 0 || u % 4 === 3 ? "quartz_pillar" : "white_concrete", u % 4 === 0 || u % 4 === 3 ? { axis: "y" } : undefined);
      continue;
    }

    // r in 1..3: window zone
    if (isGroundStorey) {
      const entranceFace = nz === 1 && nx === 0;
      const entranceCols = entranceFace && Math.abs(u - 29) <= 2;
      if (entranceCols) {
        if (u === 29 && y === gr + 1) {
          put(x, y, z, "dark_oak_door", doorLower);
        } else if (u === 29 && y === gr + 2) {
          put(x, y, z, "dark_oak_door", doorUpper);
        } else if (u === 27 || u === 31) {
          put(x, y, z, "quartz_pillar", { axis: "y" });
        } else {
          put(x, y, z, "glass");
        }
        // Canopy / lintel over the entrance
        if (y === 4) put(x, y, z, "smooth_quartz");
        if (u === 29 && y === gr + 1 && inFp(x + inX, z + inZ)) {
          put(x + inX, y, z + inZ, "glowstone");
        }
      } else if (u % 4 === 0 || u % 4 === 3) {
        put(x, y, z, "quartz_pillar", { axis: "y" });
      } else {
        put(x, y, z, "glass");
      }
    } else {
      // Upper storeys: glass bays between quartz piers
      if (u % 4 === 1 || u % 4 === 2) {
        put(x, y, z, "light_blue_stained_glass");
        const storeyIdx = Math.floor(y / 5);
        if (((u * 7 + y * 3 + storeyIdx) % 5) === 0 && inFp(x + inX, z + inZ)) {
          put(x + inX, y, z + inZ, "glowstone");
        }
      } else {
        put(x, y, z, "quartz_pillar", { axis: "y" });
      }
    }
  }

  // Roof parapet and cornice on edge cells
  if (isEdge) {
    put(x, ROOF_Y, z, "white_concrete");
    put(x, PARAPET_TOP, z, "smooth_quartz");
  }
}

// Rooftop mechanical core (light grey box with stone cap), standing on the top slab
for (let x = 18; x <= 39; x++) {
  for (let z = 16; z <= 37; z++) {
    if (!inFp(x, z)) continue;
    const wall = x === 18 || x === 39 || z === 16 || z === 37;
    if (wall) {
      for (let y = ROOF_Y; y <= 29; y++) {
        const band = y === 27 || y === 28;
        const glassBay = band && (x + z) % 3 !== 0;
        put(x, y, z, glassBay ? "light_blue_stained_glass" : "light_gray_concrete");
      }
    }
    put(x, 30, z, "smooth_stone");
  }
}

// Antenna mast on the core, lit at the tip
if (inFp(29, 27)) {
  for (let y = 31; y <= 33; y++) put(29, y, 27, "iron_block");
  put(29, 34, 27, "end_rod", { facing: "up" });
}

g.save(`${DIR}/${ID}.nbt`);
