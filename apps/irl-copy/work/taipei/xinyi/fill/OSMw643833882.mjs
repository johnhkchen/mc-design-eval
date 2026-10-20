import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643833882";
const W = 28, H = 24, D = 24;

// Record: 28 x 24 footprint, roof ~12 blocks above lowest ground.
// Reads as a 3-storey, early-1990s Taipei commercial block: stone plinth,
// white concrete piers, glass bays, storey bands, quartz cornice, parapet with cap.
const ROOF = 12;        // roof slab / cornice level
const PARAPET = 13;     // parapet wall
const CAP = 14;         // parapet cap (bottom slab)
const STOREYS = [4, 8]; // storey floor lines
const DOOR_X = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Exterior faces of a footprint cell (a face is exterior when the neighbour is missing).
function edgeFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

const g = new Voxels([W, H, D]);

// Pass 1: foundations, floors, walls, roof, parapet.
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const faces = edgeFaces(x, z);
  const edge = faces.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-level floor / plinth course.
  g.set(x, gr, z, edge ? "polished_andesite" : "smooth_stone");

  // Interior floor slabs at storey lines (air gap elsewhere).
  if (!edge) {
    for (const sy of STOREYS) if (sy > gr) g.set(x, sy, z, "smooth_stone");
  }

  // Roof slab / cornice level.
  if (ROOF > gr) {
    g.set(x, ROOF, z, edge ? "quartz_block" : "smooth_stone");
  }

  if (!edge) continue;

  // Facade logic: along-face coordinate picks the 3-block bay rhythm.
  const primary = faces[0];
  const t = (primary === "north" || primary === "south") ? x : z;
  const corner = faces.length > 1;
  const pier = corner || t % 3 === 0;
  const isDoor = primary === "south" && x === DOOR_X && faces.includes("south");

  for (let y = gr + 1; y < ROOF; y++) {
    let id;
    if (y === 4 || y === 8) {
      id = "smooth_stone"; // storey band
    } else if (y <= 3) {
      // Shopfront: piers, glass, entrance door in the middle of the street face.
      if (isDoor) {
        if (y === gr + 1) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "south", half: "lower", hinge: "left", open: "false", powered: "false"
          });
        } else if (y === gr + 2) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "south", half: "upper", hinge: "left", open: "false", powered: "false"
          });
        } else {
          g.set(x, y, z, "glass_pane");
        }
        continue;
      }
      id = pier ? "white_concrete" : "glass_pane";
    } else {
      // Upper storeys: glass bays framed by piers.
      id = pier ? "white_concrete" : "glass_pane";
    }
    g.set(x, y, z, id);
  }

  // Cornice already set above (quartz). Parapet and bottom-slab cap.
  g.set(x, PARAPET, z, "white_concrete");
  g.set(x, CAP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: warm light behind glass (interior air cells just inside the facade).
const INWARD = {
  north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0]
};
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const faces = edgeFaces(x, z);
  if (!faces.length) continue;
  const primary = faces[0];
  const t = (primary === "north" || primary === "south") ? x : z;
  if (faces.length > 1 || t % 3 === 0) continue; // only glass bays
  const [dx, dz] = INWARD[primary];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || edgeFaces(ix, iz).length) continue;
  if (t % 6 === 1) g.set(ix, 6, iz, "glowstone");
  else if (t % 6 === 4) g.set(ix, 10, iz, "shroomlight");
}

// Pass 3: roof equipment on interior roof cells.
for (const [x, z, gr] of cells) {
  if (edgeFaces(x, z).length) continue;
  if (x % 8 === 4 && z % 8 === 4 && ROOF > gr) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
}

// Antenna mast at the footprint centre, if the cell exists and is interior.
if (has(14, 12) && !edgeFaces(14, 12).length) {
  for (let y = ROOF + 1; y <= ROOF + 6; y++) {
    if (y < H) g.set(14, y, 12, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
