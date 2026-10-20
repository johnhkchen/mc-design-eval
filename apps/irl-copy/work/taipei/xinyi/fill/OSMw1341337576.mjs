import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1341337576.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1341337576.nbt";

const W = 7, H = 19, D = 3;

// ---- read footprint: [x, z, ground] per cell (tolerate object form too)
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const rawList = Array.isArray(raw) ? raw : (raw.cells || []);
let list = rawList.map(c =>
  Array.isArray(c)
    ? { x: c[0], z: c[1], g: c[2] }
    : { x: c.x, z: c.z, g: c.ground ?? c.g ?? c.y ?? 0 }
);
const minG = Math.min(...list.map(c => c.g));
list = list.map(c => ({ x: c.x, z: c.z, g: c.g - minG })); // y 0 = lowest ground

const key = (x, z) => x + "," + z;
const set = new Set(list.map(c => key(c.x, c.z)));
const has = (x, z) => set.has(key(x, z));
const minZ = Math.min(...list.map(c => c.z));
const minX = Math.min(...list.map(c => c.x));
const maxX = Math.max(...list.map(c => c.x));
const midX = Math.round((minX + maxX) / 2);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS = "glass";
const WALL = "white_concrete";
const BASE = "stone_bricks";
const BAND = "smooth_stone";
const CAP = "stone_brick_wall";

for (const c of list) {
  const { x, z, g: gr } = c;

  // exterior faces: outward directions where no neighbour cell exists
  const outN = !has(x, z - 1), outS = !has(x, z + 1);
  const outW = !has(x - 1, z), outE = !has(x + 1, z);
  const exterior = outN || outS || outW || outE;
  const outCount = [outN, outS, outW, outE].filter(Boolean).length;
  const corner = outCount >= 2;
  const frontFace = outN && z === minZ; // street-side face (north)

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  // base course / floor slab at ground level
  put(x, gr, z, BASE);

  // ground-floor shopfront and entrance: y = gr+1 .. gr+2
  for (const dy of [1, 2]) {
    const y = gr + dy;
    if (!exterior) {
      // interior: air behind glass; warm light in the gap behind the middle row
      if (dy === 1 && z === 1 && x % 2 === 0 && x > minX && x < maxX) {
        put(x, y, z, "glowstone");
      }
      continue;
    }
    if (corner) {
      put(x, y, z, WALL);
    } else if (frontFace && x === midX && dy === 1) {
      put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    } else if (frontFace && x === midX && dy === 2) {
      put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      put(x, y, z, GLASS);
    }
  }

  // storey line / signband above the shopfront
  if (exterior) {
    put(x, gr + 3, z, corner ? WALL : BAND);
    // upper wall with a lit clerestory window on the street face
    if (corner) put(x, gr + 4, z, WALL);
    else if (frontFace && (x - minX) % 2 === 1) put(x, gr + 4, z, GLASS);
    else put(x, gr + 4, z, WALL);
  }

  // cornice / roof slab (solid under the roof surface)
  put(x, gr + 5, z, BAND);

  // parapet on the perimeter, roof surface inside
  if (exterior) put(x, gr + 6, z, CAP);
}

// roof equipment: a small plant box on the roof, centre cell
if (has(midX, 1)) put(midX, list[0].g + 6, 1, "light_gray_concrete");

g.save(OUT);
