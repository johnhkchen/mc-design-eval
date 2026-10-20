import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738268";
const W = 15, H = 23, D = 23;
const PARAPET_Y = 10;   // top course of the parapet; roof surface at y = 11

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const maxZ = Math.max(...cells.map(c => c[1]));

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward directions: N = -z, S = +z, W = -x, E = +x
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const edgeFaces = (x, z) =>
  Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));

// Facade block for an edge cell at height y, given the face and bay index along it.
function facadeBlock(y, gr, pier) {
  if (y === gr) return "polished_granite";             // base course
  if (y <= 2) return pier ? "white_concrete" : "glass"; // shopfront glazing
  if (y === 3) return "red_terracotta";                 // shopfront awning band
  if (y === 4) return "white_concrete";                 // lintel band
  if (y === 5) return "smooth_quartz";                  // storey line / cornice
  if (y <= 8) return pier ? "white_concrete" : "light_blue_stained_glass"; // upper windows
  if (y === 9) return "light_gray_concrete";            // spandrel
  return "white_concrete";                              // parapet
}

// Pass 1: foundations, walls, interior slabs
for (const [x, z, gr] of cells) {
  // Solid foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = edgeFaces(x, z);
  if (faces.length === 0) {
    // Interior cell: floor slab at storey line and roof deck, air otherwise
    if (gr <= 5) put(x, 5, z, "light_gray_concrete");
    if (gr <= PARAPET_Y) put(x, PARAPET_Y, z, "gray_concrete");
    continue;
  }

  // Primary face: south first (street frontage), then north, east, west
  const face = ["S", "N", "E", "W"].find(f => faces.includes(f));
  const along = face === "N" || face === "S" ? x : z;
  const corner = faces.length > 1;
  const pier = corner || along % 3 === 0 || along === 0 || along === (face === "N" || face === "S" ? W - 1 : D - 1);

  for (let y = gr; y <= PARAPET_Y; y++) {
    put(x, y, z, facadeBlock(y, gr, pier));
  }

  // Warm light behind some upper windows, in the interior cell just inside the face
  if (!pier && along % 6 === 1) {
    const [dx, dz] = DIRS[face];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && edgeFaces(ix, iz).length === 0 && gr <= 7) {
      put(ix, 7, iz, "glowstone");
    }
  }
}

// Pass 2: entrance on the street face, placed last so it overrides the shopfront
for (const [x, z, gr] of cells) {
  if (z === maxZ && x === 7 && has(x, z) && edgeFaces(x, z).includes("S")) {
    put(x, gr, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    if (gr + 1 <= 2) {
      put(x, gr + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  }
}

// Pass 3: roof equipment on interior roof cells
for (const [x, z, gr] of cells) {
  if (edgeFaces(x, z).length !== 0) continue;
  if (gr > PARAPET_Y) continue;
  if (x % 5 === 2 && z % 6 === 3) {
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
