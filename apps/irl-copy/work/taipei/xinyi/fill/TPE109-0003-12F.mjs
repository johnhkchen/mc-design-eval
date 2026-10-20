import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE109-0003-12F";
const W = 30, H = 71, D = 43;
const ROOF = 59;      // roof surface, about 59 blocks above lowest ground
const BODY_TOP = 45;  // podium/terrace row, tier stands on it
const TIER_FROM = 4;  // setback: cells at least 4 in from the perimeter

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));

// Depth from the outside edge: 1 = perimeter, 2 = next ring in, and so on.
const depth = new Map();
const queue = [];
for (const [x, z] of cells) {
  const edge = DIRS.some(([dx, dz]) => !ground.has(key(x + dx, z + dz)));
  if (edge) {
    depth.set(key(x, z), 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const k = key(x + dx, z + dz);
    if (ground.has(k) && !depth.has(k)) {
      depth.set(k, d + 1);
      queue.push([x + dx, z + dz]);
    }
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const mullion = (x, z) => (x + z) % 4 === 0;

// Facade block for a window band, spandrel or shopfront row on a perimeter cell.
function facade(x, y, z) {
  const local = y % 5;
  if (local === 4) return ["white_concrete"];
  if (y < 5) {
    // ground storey shopfront: stone piers every third column, glass bays between
    return x % 3 === 0 ? ["polished_granite"] : ["light_blue_stained_glass_pane"];
  }
  if (mullion(x, z)) return ["white_concrete"];
  return ["light_blue_stained_glass_pane"];
}

// Sparse warm lights behind some windows (inside the air gap).
const lightSpot = (x, y, z) => y % 5 === 2 && (x + z) % 4 === 2 && (x * 3 + z * 5) % 7 === 0;

// Foundation, body, setback tier, parapet and penthouse, cell by cell.
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  const d = depth.get(key(x, z));

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= 60; y++) {
    let id = null;
    let p = null;

    if (y <= BODY_TOP) {
      if (y === gr) {
        id = d === 1 ? "polished_granite" : "smooth_stone";
      } else if (y % 5 === 0) {
        id = "light_gray_concrete";
      } else if (d === 1) {
        [id, p] = facade(x, y, z);
      } else if (d === 2 && lightSpot(x, y, z)) {
        id = "glowstone";
      }
    }

    if (y === BODY_TOP + 1 && d === 1) {
      id = "stone_brick_wall"; // terrace parapet
    }

    if (y > BODY_TOP && y <= ROOF && d >= TIER_FROM) {
      if (y === ROOF || y % 5 === 0) {
        id = "light_gray_concrete";
      } else if (d === TIER_FROM) {
        [id, p] = facade(x, y, z);
      } else if (d === TIER_FROM + 1 && lightSpot(x, y, z)) {
        id = "glowstone";
      }
    }

    // cornice and parapet on the tier edge
    if (y === ROOF + 1 && d === TIER_FROM) id = "white_concrete";
    if (y === ROOF + 1 && d === TIER_FROM - 1) id = "light_gray_concrete";

    // penthouse on the deep core
    if (y >= ROOF + 1 && y <= ROOF + 3 && d >= TIER_FROM + 3) id = "light_gray_concrete";

    if (id) put(x, y, z, id, p ?? undefined);
  }
}

// Entrance: the front-most perimeter cell (lowest z, then x) at the body.
let door = null;
for (const [x, z] of cells) {
  if (depth.get(key(x, z)) !== 1) continue;
  if (!door || z < door.z || (z === door.z && x < door.x)) door = { x, z, gr: ground.get(key(x, z)) };
}
if (door) {
  const { x, z, gr } = door;
  // door, with a dark stone surround either side
  put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) {
    if (depth.get(key(x + dx, z)) === 1) {
      put(x + dx, gr + 1, z, "polished_granite");
      put(x + dx, gr + 2, z, "polished_granite");
    }
  }
  // projecting canopy over the door and its neighbours
  for (const dx of [-2, -1, 0, 1, 2]) {
    if (depth.get(key(x + dx, z)) === 1) {
      put(x + dx, gr + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // warm lantern marking the entrance
  for (const dx of [-2, 2]) {
    if (depth.get(key(x + dx, z)) === 1) put(x + dx, gr + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Antenna on the deepest cell of the tier.
let top = null;
for (const [x, z] of cells) {
  const d = depth.get(key(x, z));
  if (!top || d > top.d) top = { x, z, d };
}
if (top) {
  for (let y = ROOF + 4; y <= ROOF + 9; y++) put(top.x, y, top.z, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
