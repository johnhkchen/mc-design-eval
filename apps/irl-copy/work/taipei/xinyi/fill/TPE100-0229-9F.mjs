import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Shin Kong Mitsukoshi A4 (新光三越A4館, 2011)
// Retail podium of three storeys over the full footprint, with a six-storey
// block set back 8 blocks from the podium edge along the footprint outline.
// Light-grey plinth, white piers, quartz spandrels, light-blue glass,
// warm lamps behind some panes, a wide entrance on both short faces, and a
// mechanical box with a mast on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE100-0229-9F";
const W = 110, H = 57, D = 88;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const PODIUM_TOP = 15;   // podium roof deck at y=15 (three storeys of 5)
const ROOF = 45;         // tower roof deck at y=45 (lidar: ~45 above lowest ground)
const SETBACK = 8;       // tower setback from the podium edge, following the outline
const STOREY = 5;

const ground = new Map();
let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.round(gr));
  minx = Math.min(minx, x); maxx = Math.max(maxx, x);
  minz = Math.min(minz, z); maxz = Math.max(maxz, z);
}
const cx = Math.round((minx + maxx) / 2);
const cz = Math.round((minz + maxz) / 2);

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const inFp = (x, z) => ground.has(`${x},${z}`);
const edgeFp = (x, z) => NB.some(([dx, dz]) => !inFp(x + dx, z + dz));

// Distance from the outer edge of the footprint (edge cells = 1), so the
// setback follows the real outline rather than its bounding box.
const dist = new Map();
const queue = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (edgeFp(x, z)) { dist.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(`${x},${z}`);
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz, nk = `${nx},${nz}`;
    if (inFp(nx, nz) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const inTower = (x, z) => inFp(x, z) && (dist.get(`${x},${z}`) || 0) > SETBACK;
const edgeTower = (x, z) => NB.some(([dx, dz]) => !inTower(x + dx, z + dz));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Facade material for an edge cell at height y.
function facade(x, y, z, tower) {
  const sy = y - STOREY * Math.floor(y / STOREY);

  // Entrances: wide glazed openings on the north and south faces of the podium,
  // framed by a quartz lintel and a grey base band.
  if (!tower && y < STOREY && (z === minz || z === maxz) && Math.abs(x - cx) <= 8) {
    if (sy <= 2) return "glass";
    if (sy === 3) return "smooth_quartz";
  }

  if (sy === 0) return "light_gray_concrete"; // base band of each storey
  if (sy === 4) return "quartz_block";        // cornice band

  const pier = (((x + z) % 4) + 4) % 4 === 0; // mullions every 4 blocks
  if (pier) return "white_concrete";

  // Warm light behind some panes: glowstone in retail, shroomlight in offices
  if (((x * 5 + z * 3 + y) % 17) === 0) return tower ? "shroomlight" : "glowstone";

  // Darker spandrel tint on alternate bays so the glass reads as separate panels
  if (((x - z) % 6 + 6) % 6 === 0) return "cyan_stained_glass";

  return "light_blue_stained_glass";
}

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const tw = inTower(x, z);
  const ef = edgeFp(x, z);
  const et = edgeTower(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Podium: three storeys over the whole footprint
  for (let y = gr; y < PODIUM_TOP; y++) {
    if (ef) {
      put(x, y, z, facade(x, y, z, false));
    } else if (y % STOREY === 0 && y > 0) {
      put(x, y, z, "light_gray_concrete"); // interior floor slab
    }
  }

  // Podium roof deck over every footprint cell
  if (PODIUM_TOP >= gr) put(x, PODIUM_TOP, z, "light_gray_concrete");

  // Podium parapet on the outer edge where the tower is not standing
  if (!tw && ef && PODIUM_TOP + 1 >= gr) put(x, PODIUM_TOP + 1, z, "white_concrete");

  // Tower: six storeys, set back, standing on the podium roof
  if (tw) {
    for (let y = Math.max(gr, PODIUM_TOP + 1); y < ROOF; y++) {
      if (et) {
        put(x, y, z, facade(x, y, z, true));
      } else if (y % STOREY === 0) {
        put(x, y, z, "light_gray_concrete"); // interior floor slab
      }
    }
    // Tower roof deck and parapet
    if (ROOF >= gr) put(x, ROOF, z, "light_gray_concrete");
    if (et && ROOF + 1 >= gr) put(x, ROOF + 1, z, "quartz_block");
  }
}

// Roof equipment: a mechanical box on the tower roof, with a mast over its centre
for (let x = cx - 6; x <= cx + 6; x++) {
  for (let z = cz - 6; z <= cz + 6; z++) {
    if (!inTower(x, z)) continue;
    for (let y = ROOF + 1; y <= ROOF + 4; y++) put(x, y, z, "light_gray_concrete");
  }
}
if (inTower(cx, cz)) {
  for (let y = ROOF + 5; y <= ROOF + 9; y++) put(cx, y, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
