import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3000127.cells.json`, "utf8"));

// 100 Front Street, DUMBO: 1877 brick multi-family walk-up.
// Four storeys on a stone plinth, red brick walls with stone quoins and belt
// courses, a shopfront ground floor with a stone-framed entrance, paired
// windows on a 2-block storey pitch, a smooth stone cornice, a brick parapet
// and a flat tar roof with one chimney.
const W = 6, H = 24, D = 9;
const g = new Voxels([W, H, D]);

const map = new Map();
let minGround = Infinity;
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.min(H - 2, Math.round(gr)));
  minGround = Math.min(minGround, ground);
  map.set(`${x},${z}`, { gr: ground });
}
// One flat roof plane about 12 blocks above the lowest ground (lidar), so the
// silhouette reads as a single clean parapet rather than stepped noise.
const TOP = Math.min(H - 8, minGround + 11); // top block index of the roof deck
for (const v of map.values()) v.roof = TOP + 1;

const has = (x, z) => map.has(`${x},${z}`);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const FACES = [
  { n: [-1, 0], facing: "west", along: (x, z) => z, len: D },
  { n: [1, 0], facing: "east", along: (x, z) => z, len: D },
  { n: [0, -1], facing: "north", along: (x, z) => x, len: W },
  { n: [0, 1], facing: "south", along: (x, z) => x, len: W },
];
const exposedFaces = (x, z) => FACES.filter((f) => !has(x + f.n[0], z + f.n[1]));

// Entrance on the north (street) face, centre of the frontage.
const DOOR_X = Math.floor(W / 2), DOOR_Z = 0;

for (const [key, { gr }] of map) {
  const [x, z] = key.split(",").map(Number);
  const { roof } = map.get(key);
  const top = roof - 1;
  const exp = exposedFaces(x, z);

  // Foundation below the cell.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (exp.length === 0) {
    // Interior: storey floors, roof deck at the top, air between.
    for (let y = gr; y < top; y += 2) put(x, y, z, "oak_planks");
    put(x, top, z, "deepslate_tiles");
    continue;
  }

  const corner = exp.length > 1;
  const f = exp[0];
  const a = f.along(x, z);
  const winCol = !corner && a % 2 === 1 && a < f.len - 1;
  const inX = x - f.n[0], inZ = z - f.n[1];

  for (let y = gr; y <= top; y++) {
    const rel = y - gr;
    let id = "bricks";

    if (y === top) {
      id = "smooth_stone"; // cornice band under the parapet
    } else if (rel === 0) {
      id = "stone_bricks"; // plinth course
    } else if (rel % 2 === 0) {
      id = "smooth_stone"; // storey belt course
    } else {
      const k = (rel - 1) / 2; // storey index, 0 = ground floor
      if (k === 0) {
        id = corner ? "stone_bricks" : (winCol ? "glass" : "bricks");
      } else if (corner) {
        id = (k % 2 === 0) ? "stone_bricks" : "bricks"; // quoins
      } else if (winCol) {
        id = "glass";
      }
    }

    // Warm light behind a subset of upper windows.
    if (rel % 2 === 1 && rel >= 3 && winCol) {
      const k = (rel - 1) / 2;
      if (has(inX, inZ) && exposedFaces(inX, inZ).length === 0 && (k + a) % 4 === 0) {
        put(inX, y, inZ, "glowstone");
      }
    }

    put(x, y, z, id);
  }

  // Brick parapet on the wall cells, stone coping on top of it.
  put(x, top + 1, z, "bricks");
  put(x, top + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// Entrance: stone-framed doorway on the north face.
if (has(DOOR_X, DOOR_Z)) {
  const { gr } = map.get(`${DOOR_X},${DOOR_Z}`);
  put(DOOR_X - 1, gr + 1, DOOR_Z, "stone_bricks");
  put(DOOR_X + 1, gr + 1, DOOR_Z, "stone_bricks");
  put(DOOR_X, gr + 1, DOOR_Z, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(DOOR_X, gr + 2, DOOR_Z, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(DOOR_X, gr + 3, DOOR_Z, "smooth_stone"); // lintel over the door
}

// Single brick chimney on an interior roof cell.
const chim = [1, 1];
if (has(chim[0], chim[1]) && exposedFaces(chim[0], chim[1]).length === 0 && TOP + 4 < H) {
  for (let y = TOP + 1; y <= TOP + 3; y++) put(chim[0], y, chim[1], "bricks");
  put(chim[0], TOP + 4, chim[1], "smooth_stone");
}

g.save(`${DIR}/NYC3000127.nbt`);
