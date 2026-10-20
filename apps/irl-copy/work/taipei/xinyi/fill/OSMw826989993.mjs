import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Late-1990s/2000s Taipei commercial block: granite-faced ground floor with
// shopfront glazing, white-concrete curtain-wall piers and light-blue glass,
// five storeys, stone parapet, rooftop plant and penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989993";
const W = 19, H = 38, D = 18;
const ROOF = 26;          // parapet top, about the lidar roof height
const FOUND = "stone_bricks";
const FRAME = "polished_granite";
const SPAND = "white_concrete";
const GLASS = "light_blue_stained_glass_pane";
const SLABF = "light_gray_concrete";
const SOLID = new Set([FOUND, FRAME, SPAND, "stone_bricks", SLABF, "quartz_block"]);

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);
const missing = (x, z) =>
  [!has(x - 1, z), !has(x + 1, z), !has(x, z - 1), !has(x, z + 1)].filter(Boolean).length;
const isRing = (x, z) => missing(x, z) > 0;
const isCorner = (x, z) => missing(x, z) >= 2;
const key = (x, y, z) => `${x},${y},${z}`;

// Plan: every block is decided here first so pane connections can be computed.
const plan = new Map();
function put(x, y, z, id, props = null, pane = false) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H || !has(x, z)) return;
  const k = key(x, y, z);
  if (plan.has(k)) return;
  plan.set(k, { x, y, z, id, props, pane });
}

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells)
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

// 2. Entrance: a ring cell on the north (min z) face, near the middle of it.
const doorCands = cells
  .filter(([x, z, gr]) => isRing(x, z) && !has(x, z - 1) && gr <= 2)
  .sort((a, b) => a[0] - b[0]);
const door = doorCands.length ? doorCands[Math.floor(doorCands.length / 2)] : null;

// 3. Facade rings: shopfront, granite fascia, storey bands, parapet.
for (const [x, z, gr] of cells) {
  if (!isRing(x, z)) continue;
  const pillar = isCorner(x, z) || (x + z) % 3 === 0;
  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, "stone_bricks"); continue; }
    if (y < 4) {
      if (door && door[0] === x && door[1] === z && y <= gr + 1) {
        const half = y === gr ? "lower" : "upper";
        put(x, y, z, "dark_oak_door",
          { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (pillar) put(x, y, z, FRAME);
      else put(x, y, z, GLASS, null, true);
    } else if (y === 4) {
      put(x, y, z, FRAME);                       // shopfront fascia
    } else if (y % 5 === 0 || y % 5 === 4) {
      put(x, y, z, SPAND);                       // slab line and transom band
    } else {
      if (pillar) put(x, y, z, SPAND);           // curtain-wall piers
      else put(x, y, z, GLASS, null, true);      // glazing
    }
  }
}

// 4. Parapet cap: lanterns on corners, stone slab coping elsewhere.
for (const [x, z] of cells) {
  if (!isRing(x, z)) continue;
  if (isCorner(x, z))
    put(x, 27, z, "lantern", { hanging: "false", waterlogged: "false" });
  else
    put(x, 27, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Floor slabs at each storey line and the roof deck (air gap between).
for (const [x, z, gr] of cells)
  for (const L of [5, 10, 15, 20, 25])
    if (L >= gr) put(x, L, z, SLABF);

// 6. Warm lights behind the glass: glowstone standing on a floor slab.
for (const [x, z, gr] of cells) {
  if (isRing(x, z)) continue;
  if ((x * 5 + z * 3) % 9 !== 0) continue;
  if (gr < 4) put(x, gr, z, "glowstone");
  for (const L of [5, 10, 15, 20]) {
    const y = L + 1;
    if (y >= gr + 1) put(x, y, z, "glowstone");
  }
}

// 7. Rooftop plant: a solid penthouse box and a smaller mechanical unit.
for (let x = 4; x <= 13; x++)
  for (let z = 4; z <= 11; z++) {
    put(x, 26, z, SLABF);
    put(x, 27, z, SLABF);
    put(x, 28, z, "stone_bricks");
  }
for (let x = 14; x <= 16; x++)
  for (let z = 13; z <= 14; z++) {
    put(x, 26, z, "quartz_block");
    put(x, 27, z, "quartz_block");
  }

// 8. Pane connections, then write everything to the voxel grid.
const nbPane = (e, dx, dz) => {
  const n = plan.get(key(e.x + dx, e.y, e.z + dz));
  return n && (n.pane || SOLID.has(n.id)) ? "true" : "false";
};

const g = new Voxels([W, H, D]);
for (const e of plan.values()) {
  let props = e.props;
  if (e.pane)
    props = {
      north: nbPane(e, 0, -1),
      south: nbPane(e, 0, 1),
      east: nbPane(e, 1, 0),
      west: nbPane(e, -1, 0),
      waterlogged: "false",
    };
  if (props) g.set(e.x, e.y, e.z, e.id, props);
  else g.set(e.x, e.y, e.z, e.id);
}

g.save(`${DIR}/${ID}.nbt`);
