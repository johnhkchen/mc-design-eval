import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise office block, c. 1990s Taipei: seven storeys of white
// tiled concrete with blue-glass ribbon windows, granite plinth, quartz
// spandrels, and a set-back penthouse with a lightning-rod mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993148";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 47, D = 21;
const TOP = 35;               // roof slab surface sits at y = 35
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inF = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isPer = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
const isCorner = (x, z) => (!inF(x - 1, z) || !inF(x + 1, z)) && (!inF(x, z - 1) || !inF(x, z + 1));

// Street (front) face: the lowest-z row; entrance sits on its middle cell.
const minZ = Math.min(...cells.map(c => c[1]));
const frontXs = cells.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
const ex = frontXs[Math.floor(frontXs.length / 2)];

// Direction from a perimeter cell toward an interior footprint cell (for glow lights).
const inward = (x, z) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (inF(x + dx, z + dz) && !isPer(x + dx, z + dz)) return [x + dx, z + dz];
  }
  return null;
};

// Pass 1: foundation, floor slabs, roof.
for (const [x, z, gr] of cells) {
  const per = isPer(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (!per) {
    put(x, gr, z, "smooth_quartz");                 // ground-floor slab
    for (let s = 1; s <= 6; s++) {
      const y = 5 * s;
      if (y >= gr && y < TOP) put(x, y, z, "smooth_quartz");
    }
    put(x, TOP, z, "gray_concrete");                // roof deck
  }
}

// Pass 2: perimeter walls, ribbon windows, entrance, cornice, parapet.
for (const [x, z, gr] of cells) {
  if (!isPer(x, z)) continue;
  const corner = isCorner(x, z);
  const pier = corner || (x + z) % 4 === 0;
  const front = z === minZ && Math.abs(x - ex) <= 1;

  for (let y = gr; y < TOP; y++) {
    const r = y % 5;
    const s = Math.floor(y / 5);
    let id;
    if (r === 0) {
      id = s === 0 ? "polished_granite" : "smooth_quartz";          // base / spandrel
    } else if (s === 0) {
      id = pier ? "polished_granite" : (r === 4 ? "smooth_quartz" : "light_blue_stained_glass");
    } else if (r === 4) {
      id = "light_gray_concrete";                                    // storey shadow line
    } else {
      id = pier ? "white_concrete" : "light_blue_stained_glass";
    }
    put(x, y, z, id);
  }

  // Entrance: centre door on the street face, glass either side, transom above.
  if (front && x === ex) {
    put(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "light_gray_concrete");
  } else if (front && Math.abs(x - ex) === 1) {
    for (let y = gr; y <= gr + 2; y++) put(x, y, z, "light_blue_stained_glass");
  }

  // Warm light behind some upper-storey glass, on the interior cell next to the wall.
  const inn = inward(x, z);
  if (!corner && inn) {
    for (let s = 1; s <= 6; s++) {
      const y = 5 * s + 2;
      if (y >= gr && y < TOP && (x + z) % 8 === 2) {
        put(inn[0], y, inn[1], "glowstone");
      }
    }
  }

  // Cornice and parapet.
  put(x, TOP, z, "smooth_quartz");
  put(x, TOP + 1, z, "white_concrete");
  put(x, TOP + 2, z, "white_concrete");
}

// Penthouse: inset set-back block on the roof, ringed with glass and capped.
const PX0 = 5, PX1 = 19, PZ0 = 5, PZ1 = 15;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!inF(x, z)) continue;
    const ring = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    put(x, 39, z, "smooth_quartz");                 // penthouse roof
    if (ring) {
      const pierP = (x + z) % 4 === 0;
      put(x, 36, z, "white_concrete");
      put(x, 37, z, pierP ? "white_concrete" : "light_blue_stained_glass");
      put(x, 38, z, "white_concrete");
    }
  }
}

// Roof plant: low equipment boxes on the main roof, clear of the penthouse.
for (const [x, z] of [[2, 3], [22, 17], [2, 17]]) {
  if (inF(x, z)) {
    put(x, TOP + 1, z, "light_gray_concrete");
    put(x, TOP + 2, z, "light_gray_concrete");
  }
}

// Mast on the penthouse roof.
put(12, 40, 10, "lightning_rod");
put(12, 41, 10, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
