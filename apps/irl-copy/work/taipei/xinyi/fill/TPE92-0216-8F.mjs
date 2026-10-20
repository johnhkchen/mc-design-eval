import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 莊敬分隊 (Zhuangjing fire substation), Taipei, built 2003.
// Read as an 8-storey reinforced-concrete civic/fire building: white concrete
// frame with light-blue glass bays, red-concrete ground floor and parapet
// (the brigade's colour), a stepped roof stair/hose-tower, and warm lamps
// set behind the glass at dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0216-8F";
const W = 26, H = 52, D = 50;
const ROOF = 40;          // roof slab top, 8 storeys x 5 blocks
const NSTOREY = 8;

const SLAB = "light_gray_concrete";
const FOUND = "stone_bricks";
const WALL = "white_concrete";
const RED = "red_concrete";
const SPAN = "smooth_quartz";
const GLASS = "light_blue_stained_glass";
const LAMP = "shroomlight";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));

// Front face = smallest z; entrance sits on the middle cell of that edge.
const frontZ = Math.min(...[...ground.keys()].map((k) => Number(k.split(",")[1])));
const frontXs = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([, z]) => z === frontZ)
  .map(([x]) => x)
  .sort((a, b) => Math.abs(a - 12.5) - Math.abs(b - 12.5));
const doorX = frontXs[0];

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  // Floor slabs at every storey line and the roof slab.
  for (let k = 0; k <= NSTOREY; k++) {
    const y = 5 * k;
    if (y >= gr) put(x, y, z, SLAB);
  }

  // Facade on perimeter cells: piers and glass bays, spandrels, red ground floor.
  if (edge) {
    for (let y = Math.max(gr, 1); y < ROOF; y++) {
      const k = Math.floor(y / 5);
      const r = y % 5;
      if (r === 0) continue; // storey line already placed
      if (r === 4) {
        put(x, y, z, SPAN);
        continue;
      }
      const pier = (x + z) % 3 === 0;
      if (pier) put(x, y, z, k === 0 ? RED : WALL);
      else put(x, y, z, GLASS);
    }
    // Parapet: red cornice over white cap, standing on the roof slab.
    put(x, ROOF + 1, z, RED);
    put(x, ROOF + 2, z, WALL);
  }

  // Warm lamps set in the interior air behind the glass.
  if (!edge) {
    for (let k = 0; k < NSTOREY; k++) {
      const y = 5 * k + 2;
      if (y >= gr && (x * 5 + z * 3 + k * 7) % 13 === 0) put(x, y, z, LAMP);
    }
  }
}

// Roof hose/stair tower, 6x6 on the roof slab, glass band mid-height, red cap.
for (let x = 10; x <= 15; x++) {
  for (let z = 22; z <= 27; z++) {
    if (!has(x, z)) continue;
    const outer = x === 10 || x === 15 || z === 22 || z === 27;
    for (let y = ROOF + 1; y <= ROOF + 7; y++) {
      if (y === ROOF + 7) put(x, y, z, RED);
      else if (outer && y >= ROOF + 2 && y <= ROOF + 4) put(x, y, z, GLASS);
      else put(x, y, z, WALL);
    }
  }
}

// Entrance on the front face: quartz pilasters either side, a red lintel,
// and a double iron door at the centre bay, always placed at ground level.
{
  const gr = gAt(doorX, frontZ);
  const doorState = { facing: "south", hinge: "left", open: "false", powered: "false" };
  for (const dx of [doorX - 1, doorX + 1]) {
    if (!has(dx, frontZ)) continue;
    for (let y = gr; y <= gr + 2; y++) put(dx, y, frontZ, SPAN);
  }
  put(doorX, gr + 2, frontZ, RED);
  put(doorX, gr, frontZ, "iron_door", { ...doorState, half: "lower" });
  put(doorX, gr + 1, frontZ, "iron_door", { ...doorState, half: "upper" });
}

g.save(`${DIR}/${ID}.nbt`);
