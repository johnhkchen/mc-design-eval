import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343713";
const W = 80, H = 23, D = 35;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const minG = Math.min(...ground.values());

// Direction bookkeeping
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
};
const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };

// Bounds-guarded setter
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Building parameters from the lidar record:
// roof about 11 blocks above lowest ground, two storeys of ~5 blocks,
// white/cyan-glass commercial-civic block of the late 1990s Xinyi fabric.
const ROOF_REL = 11;     // roof deck sits at minG + 11 (parapet one above)
const STOREY = 5;
const ENTRANCE_X = [38, 41];

const lights = [];       // deferred glowstone placements (second pass)
const plantCells = [];   // rooftop plant footprint (second pass)

for (const [x, z, G] of cells) {
  // Foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // Top of this cell's body: roof deck at T-1, parapet at T
  const T = Math.max(minG + ROOF_REL, G + 6);

  // Which sides are open to the outside
  const miss = Object.keys(DIRS).filter(n => {
    const [dx, dz] = DIRS[n];
    return !has(x + dx, z + dz);
  });
  const edge = miss.length > 0;

  if (!edge) {
    // Interior: floor slab per storey and roof deck only, air between
    for (let y = G; y < T - 1; y += STOREY) put(x, y, z, "light_gray_concrete");
    put(x, T - 1, z, "light_gray_concrete");
    if (x >= 30 && x <= 36 && z >= 13 && z <= 21) plantCells.push([x, z, T]);
    continue;
  }

  // Facade face: prefer north/south so long façades read as the main elevation
  const face = miss.find(n => n === "north" || n === "south") ?? miss[0];
  const idx = (face === "north" || face === "south") ? x : z;

  // Solid wall from ground to roof deck
  for (let y = G; y <= T - 1; y++) put(x, y, z, "white_concrete");

  // Plinth course and cornice/parapet
  put(x, G, z, "polished_granite");
  put(x, T - 1, z, "smooth_quartz");   // cornice
  put(x, T, z, "smooth_quartz");       // parapet cap

  // Storeys
  for (let k = 0; ; k++) {
    const b = G + STOREY * k;
    if (b >= T - 1) break;

    // Floor slab line behind the facade (interior-side air gap kept)
    put(x, b, z, "smooth_quartz");

    // Window rows b+1..b+3 (clipped to stay under the cornice)
    const top = Math.min(b + 3, T - 2);
    const mull = k === 0 ? 3 : 4;   // storefront bays are wider
    for (let y = b + 1; y <= top; y++) {
      if (idx % mull === 0) {
        put(x, y, z, "smooth_quartz");                // mullion
      } else {
        put(x, y, z, "cyan_stained_glass");          // glazing
      }
    }

    // Storey line above the window band
    if (b + 4 <= T - 2) put(x, b + 4, z, "smooth_quartz");

    // Warm light behind some glazing on the two lower storeys
    if (k <= 1 && idx % mull !== 0 && idx % 8 === 2 && b + 2 <= T - 2) {
      const [ix, iz] = DIRS[OPPOSITE[face]];
      lights.push([x + ix, b + 2, z + iz]);
    }
  }

  // Entrance on the south elevation: double door at ground floor
  if (face === "south" && G + 2 <= T - 2 && x >= ENTRANCE_X[0] && x <= ENTRANCE_X[1]) {
    const props = (half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
    put(x, G, z, "polished_granite");
    put(x, G + 1, z, "iron_door", props("lower"));
    put(x, G + 2, z, "iron_door", props("upper"));
    put(x, G + 3, z, "smooth_quartz");
  }
}

// Second pass: rooftop plant boxes (only where the roof deck exists)
for (const [x, z, T] of plantCells) {
  put(x, T, z, "light_gray_concrete");
  put(x, T + 1, z, "gray_concrete");
}

// Second pass: warm lights behind glazing, only on interior air cells
for (const [x, y, z] of lights) {
  if (has(x, z)) {
    const isEdge = Object.values(DIRS).some(([dx, dz]) => !has(x + dx, z + dz));
    if (!isEdge) put(x, y, z, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
