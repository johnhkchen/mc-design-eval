import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise commercial block, Xinyi district, c. 1990s:
// four storeys (5-block pitch) on a stone plinth, white tiled piers, blue-glass
// window bands, dark shopfronts at grade, quartz cornice and parapet, roof plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169550";
const W = 72, H = 33, D = 17;
const ROOF = 20;      // roof deck; cornice at 20, parapet slab at 21
const PITCH = 5;      // storey pitch in blocks
const FLOORS = [5, 10, 15];

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const edgeMissing = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isEdge = (x, z) => edgeMissing(x, z).length > 0;
const inward = (x, z) => {
  const [dx, dz] = edgeMissing(x, z)[0];
  return [x - dx, z - dz];
};

const minZ = Math.min(...cells.map(c => c[1]));
const SLAB = { type: "bottom", waterlogged: "false" };

// Facade block for an edge cell at height y. Returns [id, props?]
function facade(x, y, z, gr) {
  const s = x + z;
  const miss = edgeMissing(x, z);
  const corner = miss.length >= 2;
  const pier = corner || s % 3 === 0;
  const northFace = miss.some(([dx, dz]) => dx === 0 && dz === -1);
  const entrance = northFace && x >= 30 && x <= 35;

  if (y === 21) return ["smooth_quartz_slab", SLAB];
  if (y === ROOF) return ["smooth_quartz"];

  if (y < 5) {
    if (y === gr) return ["polished_granite"];      // plinth course
    if (y === 4) return ["dark_oak_planks"];         // shopfront fascia / canopy band
    if (entrance) return ["glass"];                  // entrance bays
    if (corner || pier) return ["polished_andesite"];
    return ["glass"];                                // shopfront glazing
  }

  const r = y % PITCH;
  if (r === 0) return ["white_concrete"];            // floor band
  if (r === 4) return ["light_gray_concrete"];       // head / spandrel
  if (pier) return ["white_concrete"];               // tiled piers
  return ["light_blue_stained_glass"];               // window bands
}

const g = new Voxels([W, H, D]);

// Foundation, floor slabs and roof deck on every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");
  for (const fy of FLOORS) if (fy > gr) g.set(x, fy, z, "smooth_stone");
  g.set(x, ROOF, z, "light_gray_concrete");
}

// Facade walls, cornice and parapet on perimeter cells.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  for (let y = gr; y <= 21; y++) {
    const [id, props] = facade(x, y, z, gr);
    if (props) g.set(x, y, z, id, props);
    else g.set(x, y, z, id);
  }
}

// Warm lights: shroomlight/glowstone set just inside some lit window bays,
// standing on the floor slab below.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const s = x + z;
  const miss = edgeMissing(x, z);
  if (miss.length >= 2 || s % 3 === 0) continue;
  const [ix, iz] = inward(x, z);
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const ig = ground.get(`${ix},${iz}`);
  for (let k = 1; k <= 3; k++) {
    const floorY = PITCH * k;
    const ly = floorY + 1;
    if (floorY < ig || ly <= gr) continue;
    if ((x * 7 + z * 3 + k * 5) % 9 !== 0) continue;
    g.set(ix, ly, iz, (k + x) % 2 === 0 ? "shroomlight" : "glowstone");
  }
}

// Roof plant: a few AC/mechanical units on the deck, set back from the parapet.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (isEdge(x, z)) continue;
  const inX = (x >= 10 && x <= 13) || (x >= 34 && x <= 37) || (x >= 58 && x <= 61);
  const inZ = z >= 6 && z <= 10;
  if (!(inX && inZ)) continue;
  g.set(x, 21, z, "light_gray_concrete");
  if (x >= 11 && x <= 12 && z >= 7 && z <= 9) g.set(x, 22, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
