import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw535167410: 16 x 25 footprint, roof ~26 blocks above lowest ground.
// Read as a five-storey 1990s-2000s Xinyi commercial/office block:
// tiled stone base, shopfront ground floor, white concrete frame with
// light-blue glass curtain panes, light-grey cornice bands per storey,
// a parapet, and a central roof plant room.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167410";
const W = 16, H = 38, D = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const OPP = { north: "south", south: "north", east: "west", west: "east" };

// Faces of a cell that border the outside of the footprint.
function exposed(x, z) {
  return Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));
}

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Glass pane connecting along the wall direction.
function pane(along) {
  return along === "x"
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
}

// Front (street) face: smallest z, door at the median x of that edge.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const frontXs = cells.filter(([, z]) => z === minZ).map(c => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const STOREY = 5;
const STOREYS = 5;
const TOP = STOREY * STOREYS; // 25: parapet row, roof top at ground + 26

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = exposed(x, z);
  const ext = faces.length > 0;

  if (!ext) {
    // Interior: floor slabs per storey and a roof slab. Air elsewhere.
    for (let k = 0; k < STOREYS; k++) {
      put(x, gr + STOREY * k, z, k === 0 ? "smooth_stone" : "white_concrete");
    }
    put(x, gr + TOP, z, "gray_concrete");
    continue;
  }

  const corner = faces.length >= 2;
  const face = faces[0];
  const alongX = face === "north" || face === "south";
  const idx = alongX ? x : z;
  const isPillar = corner || idx % 3 === 0;
  const pill = alongX ? pane("x") : pane("z");

  for (let dy = 0; dy <= TOP; dy++) {
    const y = gr + dy;
    const k = Math.floor(dy / STOREY);
    const r = dy % STOREY;

    if (dy === TOP) {
      put(x, y, z, "smooth_stone"); // parapet
      continue;
    }
    if (dy === 0) {
      put(x, y, z, "polished_andesite"); // base course
      continue;
    }
    if (r === 0) {
      put(x, y, z, "white_concrete"); // floor spandrel
      continue;
    }
    if (r === 4) {
      put(x, y, z, "light_gray_concrete"); // cornice band
      continue;
    }

    // Window band rows r = 1..3.
    if (k === 0) {
      // Ground floor shopfront.
      if (z === minZ && (x === doorX || x === doorX - 0 && false)) {
        // handled below
      }
      if (isPillar) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "cyan_stained_glass_pane", pill);
      }
    } else {
      if (isPillar) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", pill);
      }
    }
  }

  // Warm light behind some upper-floor windows, in the interior cell.
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (!isPillar && has(ix, iz) && exposed(ix, iz).length === 0) {
    for (let k = 1; k < STOREYS; k++) {
      if ((idx + k) % 3 === 1) put(ix, gr + STOREY * k + 2, iz, "glowstone");
    }
  }
  // A few lit windows on the ground floor too.
  if (!isPillar && has(ix, iz) && exposed(ix, iz).length === 0 && idx % 4 === 2) {
    put(ix, gr + 2, iz, "shroomlight");
  }
}

// Entrance: iron door on the street face, two blocks tall, above the base.
{
  const gr = ground.get(key(doorX, minZ));
  put(doorX, gr + 1, minZ, "iron_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, gr + 2, minZ, "iron_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Canopy: slab course over the entrance at the cornice line of the shopfront.
  put(doorX, gr + 4, minZ, "light_gray_concrete");
}

// Roof plant room: a centred box on the roof, only where the roof is interior.
{
  let cx = 0, cz = 0;
  for (const [x, z] of cells) { cx += x; cz += z; }
  cx = Math.round(cx / cells.length);
  cz = Math.round(cz / cells.length);
  for (const [x, z, gr] of cells) {
    if (Math.abs(x - cx) > 3 || Math.abs(z - cz) > 5) continue;
    const inner = Object.values(DIRS).every(([dx, dz]) => has(x + dx, z + dz));
    if (!inner) continue;
    put(x, gr + TOP + 1, z, "white_concrete");
    put(x, gr + TOP + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
