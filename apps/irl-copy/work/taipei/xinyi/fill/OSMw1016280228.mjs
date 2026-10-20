import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw1016280228: no record. Read as an 8-storey, mid-1980s Taipei office block
// (white tiled concrete piers, tinted glazing, granite base, stone cornice,
// setback penthouse). Storeys are 5 blocks; the roof deck sits at y 40 above
// the lowest ground. Each footprint cell's foundation is solid stone from y 0
// up to its own ground level.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280228";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 33, H = 52, D = 23;
const ROOF = 40;               // roof deck level (8 storeys x 5)
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), Math.max(0, Math.round(gr)));
const inFP = (x, z) => gmap.has(key(x, z));
const gnd = (x, z) => gmap.get(key(x, z));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// Outward faces of a footprint cell (sides with no neighbouring footprint cell).
function faces(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!inFP(x + dx, z + dz)) out.push(name);
  }
  return out;
}

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pier / glass choice for a window column. Piers every fourth column, and
// all corners are solid piers.
const isPier = (corner, idx) => corner || idx % 4 === 0;

// 1. Main body, cell by cell.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gr = gnd(x, z);
  const fl = faces(x, z);
  const corner = fl.length >= 2;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (fl.length === 0) {
    // Interior: floor slab per storey, air elsewhere (no interiors).
    if (gr === 0) put(x, 0, z, "smooth_stone");
    else put(x, gr, z, "smooth_stone");
    for (let k = 1; k <= 7; k++) {
      const y = 5 * k;
      if (y > gr) put(x, y, z, "smooth_stone");
    }
    put(x, ROOF, z, "light_gray_concrete"); // roof deck
    continue;
  }

  // Facade cell.
  const face = fl[0];
  const axisX = face === "north" || face === "south";
  const idx = axisX ? x : z;
  const [ox, oz] = DIRS[face];
  const ix = x - ox, iz = z - oz;                 // interior neighbour
  const innerOK = inFP(ix, iz) && faces(ix, iz).length === 0;

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {                              // stone cornice
      put(x, y, z, "smooth_stone");
      continue;
    }
    const k = Math.floor(y / 5);
    const r = y % 5;

    if (k === 0) {                                 // shopfront storey
      if (y === gr) put(x, y, z, "polished_granite");   // base course
      else if (y === 4) put(x, y, z, "light_gray_concrete"); // lintel band
      else if (isPier(corner, idx)) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    if (r === 0) {                                 // storey line
      put(x, y, z, "light_gray_concrete");
    } else if (r === 4) {                          // spandrel
      put(x, y, z, "white_concrete");
    } else {                                       // window zone
      if (isPier(corner, idx)) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");
        // Warm light behind some windows (shroomlight in the air gap).
        if (r === 2 && innerOK && (idx * 7 + k * 3) % 11 === 0) {
          put(ix, y, iz, "shroomlight");
        }
      }
    }
  }

  // Parapet and cap above the cornice.
  put(x, ROOF + 1, z, "white_concrete");
  put(x, ROOF + 2, z, "white_concrete");
  put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 2. Setback penthouse on the roof deck (inside the footprint, standing on y 40).
const PH = { x0: 9, x1: 23, z0: 7, z1: 15, yBase: ROOF + 1, yTop: 45, yRoof: 46 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!inFP(x, z)) continue;
    const wall = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    if (wall) {
      for (let y = PH.yBase; y <= PH.yTop; y++) {
        const glass = (y === 42 || y === 43) && (x + z) % 2 === 0;
        put(x, y, z, glass ? "light_blue_stained_glass" : "white_concrete");
      }
    }
    put(x, PH.yRoof, z, "light_gray_concrete");   // penthouse roof slab
  }
}

// 3. Entrance on the most-populated street-facing side, at the middle of that face.
function pickEntrance() {
  for (const face of ["north", "south", "west", "east"]) {
    const cand = cells
      .map(([x, z]) => [x, z])
      .filter(([x, z]) => faces(x, z).includes(face));
    if (cand.length === 0) continue;
    const axisX = face === "north" || face === "south";
    const vals = cand.map(([x, z]) => (axisX ? x : z)).sort((a, b) => a - b);
    const mid = vals[Math.floor(vals.length / 2)];
    const hit = cand.find(([x, z]) => (axisX ? x : z) === mid) ?? cand[0];
    return { x: hit[0], z: hit[1], face };
  }
  return null;
}

const ent = pickEntrance();
if (ent) {
  const gr = gnd(ent.x, ent.z);
  // Door: lower and upper halves on the granite base.
  put(ent.x, gr + 1, ent.z, "dark_oak_door", {
    facing: ent.face, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(ent.x, gr + 2, ent.z, "dark_oak_door", {
    facing: ent.face, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Canopy lintel over the door.
  put(ent.x, gr + 3, ent.z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
