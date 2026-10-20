import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690419";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const L = Math.min(...ground.values());          // lowest ground under the footprint

// Levels (absolute y). Two storeys of ~5 blocks, cornice at L+11, parapet to L+13.
const STOREY1_TOP = L + 5;   // top of ground-floor shopfront band (lintel course)
const FLOOR2 = L + 6;        // second-floor slab / spandrel course
const CORNICE = L + 11;      // roof deck and cornice course
const PARAPET = L + 12;      // parapet course on exterior ring

const at = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const exposed = (x, z) => ({
  N: !ground.has(`${x},${z - 1}`),
  S: !ground.has(`${x},${z + 1}`),
  W: !ground.has(`${x - 1},${z}`),
  E: !ground.has(`${x + 1},${z}`),
});

// Entrance: south-facing exterior cell nearest x = 10
const southCells = cells.filter(([x, z]) => exposed(x, z).S);
let door = null;
if (southCells.length) {
  southCells.sort((a, b) => Math.abs(a[0] - 10) - Math.abs(b[0] - 10));
  door = southCells[0];
}

// Pass 1: foundation, base, walls, floors, roof
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const isExt = ex.N || ex.S || ex.W || ex.E;

  // Foundation from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) at(x, y, z, "stone");
  // Ground course: plinth on the street face, floor inside
  at(x, gr, z, isExt ? "polished_andesite" : "smooth_stone");

  for (let y = gr + 1; y <= CORNICE; y++) {
    if (!isExt) {
      // Interior: only floor slabs and roof deck; air otherwise (no interiors)
      if (y === FLOOR2) at(x, y, z, "smooth_stone");
      if (y === CORNICE) at(x, y, z, "smooth_stone");
      continue;
    }

    // Exterior wall: bay index runs along the face the cell sits on
    const along = (ex.N || ex.S) ? x : z;
    let id;
    if (y === CORNICE) {
      id = "light_gray_concrete";                       // cornice
    } else if (y === CORNICE - 1) {
      id = "light_gray_concrete";                       // upper lintel
    } else if (y <= STOREY1_TOP) {
      if (y === STOREY1_TOP) id = "light_gray_concrete"; // shop lintel
      else id = along % 4 === 0 ? "white_concrete" : "cyan_stained_glass"; // shopfront with piers
    } else if (y === FLOOR2) {
      id = "light_gray_concrete";                       // spandrel
    } else {
      id = along % 3 === 0 ? "white_concrete" : "cyan_stained_glass";     // upper windows
    }
    at(x, y, z, id);

    // Warm light behind some upper windows: shroomlight on the inside cell
    if (id === "cyan_stained_glass" && y === L + 8 && along % 6 === 1) {
      const inward = ex.N ? [x, z + 1] : ex.S ? [x, z - 1] : ex.W ? [x + 1, z] : [x - 1, z];
      const ig = ground.get(`${inward[0]},${inward[1]}`);
      if (ig !== undefined && ig < y) at(inward[0], y, inward[1], "shroomlight");
    }
  }

  if (isExt) {
    // Parapet with a capping slab
    at(x, PARAPET, z, "white_concrete");
    at(x, PARAPET + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: interior hanging lanterns under the roof deck
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const isExt = ex.N || ex.S || ex.W || ex.E;
  if (!isExt && x % 5 === 2 && z % 5 === 2 && gr < CORNICE - 1) {
    at(x, CORNICE - 1, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 3: roof plant and standing roof lanterns (interior roof cells only)
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const isExt = ex.N || ex.S || ex.W || ex.E;
  if (isExt || gr > CORNICE) continue;
  if (x >= 7 && x <= 9 && z >= 4 && z <= 6) {
    at(x, CORNICE + 1, z, "iron_block");
    at(x, CORNICE + 2, z, "iron_block");
  } else if (x % 5 === 2 && z % 5 === 2) {
    at(x, CORNICE + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 4: entrance door on the south face, set into the shopfront
if (door) {
  const [dx, dz] = door;
  const dg = ground.get(`${dx},${dz}`);
  at(dx, dg + 1, dz, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  at(dx, dg + 2, dz, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
