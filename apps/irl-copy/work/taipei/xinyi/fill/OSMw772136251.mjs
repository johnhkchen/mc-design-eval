import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772136251";
const W = 26, H = 23, D = 18;
const ROOF = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const SLAB_TOP = { type: "top", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const DOOR_LO = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_HI = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

const inward = {
  W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1],
};

// Pass 1: foundations, floors, perimeter walls and facades
for (const [x, z, gr] of cells) {
  const faces = [];
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  const perim = faces.length > 0;

  // foundation fill up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // interior: floor slabs only, air between them (no interiors)
    put(x, gr, z, "smooth_stone");
    if (gr < 5) put(x, 5, z, "smooth_stone");
    if (gr < 10) put(x, 10, z, "smooth_stone");
    continue;
  }

  const isCorner = faces.length > 1;
  const f = faces[0];
  const front = faces.includes("N");

  for (let y = gr; y <= ROOF; y++) {
    // front entrance door, centred on the north (street) frontage
    if (!isCorner && f === "N" && x === 12 && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", y === gr + 1 ? DOOR_LO : DOOR_HI);
      continue;
    }

    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }       // base course
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }         // parapet
    if (y === 10) { put(x, y, z, "quartz_slab", SLAB_TOP); continue; }  // cornice
    if (y === 9) { put(x, y, z, "smooth_quartz"); continue; }           // frieze
    if (y === 5) { put(x, y, z, "white_concrete"); continue; }          // storey line
    if (y === 4) {
      if (front && x >= 9 && x <= 15) put(x, y, z, "dark_oak_slab", SLAB_TOP); // shop canopy band
      else put(x, y, z, "smooth_quartz");
      continue;
    }

    if (isCorner) { put(x, y, z, "white_concrete"); continue; }

    const along = (f === "W" || f === "E") ? z : x;
    const a = along % 4;
    const bay = Math.floor(along / 4);
    const inB1 = y >= gr + 1 && y <= 3;   // ground storey
    const inB2 = y >= 6 && y <= 8;        // upper storey

    if (a === 0) { put(x, y, z, "white_concrete"); continue; } // piers

    if (!(inB1 || inB2)) { put(x, y, z, "smooth_quartz"); continue; }

    if (f === "N" && inB1) {
      put(x, y, z, "glass");
    } else if (a === 1 || a === 2) {
      put(x, y, z, "light_blue_stained_glass_pane", (f === "W" || f === "E") ? PANE_NS : PANE_EW);
    } else {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    // warm light behind some glass, in the air gap just inside
    const [dx, dz] = inward[f];
    const ix = x + dx, iz = z + dz;
    const lit =
      (inB2 && y === 7 && a === 1 && bay % 2 === 0) ||
      (f === "N" && inB1 && y === 2 && a === 2 && bay % 2 === 0);
    if (lit && has(ix, iz)) put(ix, y, iz, "glowstone");
  }
}

// Pass 2: rooftop plant on the interior roof slab
const boxes = [[4, 7, 5, 8], [18, 21, 11, 13]];
const isInterior = (x, z) => has(x, z) && has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
for (const [x0, x1, z0, z1] of boxes) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!isInterior(x, z)) continue;
      put(x, ROOF, z, "light_gray_concrete");
      put(x, ROOF + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
