import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334820049";
const W = 7, H = 19, D = 22;
const ROOF = 7; // roof slab level above the lowest ground (lidar record)

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const FOOT = raw.map(([x, z, gr]) => [
  x, z, Math.max(0, Math.min(4, Math.round(gr ?? 0)))
]);

const g = new Voxels([W, H, D]);
const foot = new Map(FOOT.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => foot.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Door: middle of the 7-block frontage, north face preferred, then south.
const doorNorth = FOOT.find(([x, z]) => x === 3 && !has(3, z - 1));
const doorSouth = FOOT.find(([x, z]) => x === 3 && !has(3, z + 1));
const doorAny = FOOT.find(([x, z]) => !has(x, z - 1));
let door = null, doorDir = "north";
if (doorNorth) { door = doorNorth; doorDir = "north"; }
else if (doorSouth) { door = doorSouth; doorDir = "south"; }
else if (doorAny) { door = doorAny; doorDir = "north"; }
const doorKey = door ? `${door[0]},${door[1]}` : null;

for (const [x, z, gr] of FOOT) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Exterior faces of this cell (outward direction and index along the face).
  const faces = [];
  if (!has(x, z - 1)) faces.push({ dir: "north", idx: x });
  if (!has(x, z + 1)) faces.push({ dir: "south", idx: x });
  if (!has(x - 1, z)) faces.push({ dir: "west", idx: z });
  if (!has(x + 1, z)) faces.push({ dir: "east", idx: z });
  const ext = faces.length > 0;
  const pier = faces.some((f) => f.idx % 3 === 0);

  // Ground floor plinth or floor slab at the storey base.
  put(x, gr, z, ext ? "polished_andesite" : "smooth_stone");

  if (ext) {
    for (let y = gr + 1; y <= ROOF - 2; y++) {
      if (y === gr + 3) {
        // Storey line / fascia band; red sign band over the entrance.
        const isDoorFascia = doorKey === `${x},${z}`;
        put(x, y, z, isDoorFascia ? "red_concrete" : "light_gray_concrete");
      } else if (pier) {
        put(x, y, z, "white_concrete");
      } else if (y <= gr + 2) {
        // Shopfront glass; warm light behind some panes.
        const warm = (x + z) % 4 === 1 && y === gr + 1;
        put(x, y, z, warm ? "shroomlight" : "light_blue_stained_glass");
      } else {
        // Upper storey windows; a few lit.
        const lit = (x + 2 * z + y) % 9 === 0;
        put(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
      }
    }
    // Cornice and roof edge parapet.
    put(x, ROOF - 1, z, "light_gray_concrete");
    put(x, ROOF + 1, z, "white_concrete");
  } else {
    // Interior: storey floor slab only, air gap above it.
    if (gr + 3 < ROOF) put(x, gr + 3, z, "smooth_stone");
  }

  // Roof slab over every footprint cell.
  put(x, ROOF, z, "smooth_stone");

  // Rooftop plant box on the interior of the roof.
  if (!ext && x >= 2 && x <= 4 && z >= 8 && z <= 13) {
    put(x, ROOF + 1, z, "gray_concrete");
    if (x === 3 && (z === 10 || z === 11)) put(x, ROOF + 2, z, "light_gray_concrete");
  }
}

// Entrance door (two blocks tall) on the chosen frontage.
if (door) {
  const [x, z, gr] = door;
  const props = (half) => ({
    facing: doorDir, half, hinge: "left", open: "false", powered: "false"
  });
  put(x, gr + 1, z, "oak_door", props("lower"));
  put(x, gr + 2, z, "oak_door", props("upper"));
}

g.save(`${DIR}/${ID}.nbt`);
