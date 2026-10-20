import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 老爹廚房 (Lao Die Kitchen): a 1980s-90s mid-rise commercial block in Xinyi.
// Seven storeys of white tiled concrete with aluminium-framed glass, a red signage
// band over a glazed shopfront, light-grey string courses, a plain parapet,
// and a rooftop water tank with an AC unit. Warm lights sit behind some windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610202";
const W = 21, H = 47, D = 19;
const ROOF = 35;       // roof deck level, about 35 blocks above lowest ground
const PARAPET_TOP = 37;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const inside = (x, z) => ground.has(key(x, z));
const clampG = (v) => Math.min(30, Math.max(0, v));

function outDirs(x, z) {
  const d = [];
  if (!inside(x, z - 1)) d.push("north");
  if (!inside(x, z + 1)) d.push("south");
  if (!inside(x - 1, z)) d.push("west");
  if (!inside(x + 1, z)) d.push("east");
  return d;
}

const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Door cell: a single-face street-side cell on the south face, nearest the west edge.
let doorCell = null;
{
  const cand = cells
    .map(([x, z]) => [x, z, outDirs(x, z)])
    .filter(([, , d]) => d.length === 1 && d[0] === "south")
    .sort((a, b) => a[0] - b[0]);
  const any = cells
    .map(([x, z]) => [x, z, outDirs(x, z)])
    .filter(([, , d]) => d.length === 1);
  const pick = cand[0] || any[0];
  if (pick) doorCell = { x: pick[0], z: pick[1], face: pick[2][0] };
}

// Pick a tank footprint near the centre that is fully interior.
const tankCells = [];
for (let x = 8; x <= 10; x++) for (let z = 7; z <= 9; z++) {
  if (inside(x, z) && outDirs(x, z).length === 0) tankCells.push([x, z]);
}
const tankFull = tankCells.length === 9;

for (const [x, z, gr] of cells) {
  const G = clampG(gr);
  const dirs = outDirs(x, z);
  const boundary = dirs.length > 0;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // Roof deck over the whole footprint.
  put(x, ROOF, z, "smooth_stone");

  if (!boundary) {
    // Interior: one floor slab per storey, air between.
    put(x, G, z, "smooth_stone");
    for (let k = 1; k <= 6; k++) {
      const L = 5 * k;
      if (L > G) put(x, L, z, "smooth_stone");
    }
    continue;
  }

  const corner = dirs.length >= 2;
  const face = dirs[0];
  const horizontalFace = face === "north" || face === "south";
  const t = horizontalFace ? x : z;
  const isPillar = corner || (t % 3 === 0);
  const glassProps = horizontalFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Base course.
  put(x, G, z, "stone_bricks");

  // Parapet and cap.
  for (let y = ROOF + 1; y <= PARAPET_TOP; y++) put(x, y, z, "white_concrete");
  put(x, PARAPET_TOP + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Walls from above the base course up to the roof deck.
  for (let y = G + 1; y < ROOF; y++) {
    if (y <= 4) {
      // Ground storey: shopfront with red signage lintel at y=4.
      if (y === 4) {
        put(x, y, z, "red_terracotta");
        continue;
      }
      const isDoorCell = doorCell && doorCell.x === x && doorCell.z === z;
      if (isDoorCell && y === G + 1) {
        put(x, y, z, "oak_door", {
          facing: face, half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (isDoorCell && y === G + 2) {
        put(x, y, z, "oak_door", {
          facing: face, half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (isPillar) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass");
      }
      continue;
    }

    const k = Math.floor(y / 5);
    const r = y % 5;
    if (r === 0) {
      put(x, y, z, "light_gray_concrete");          // storey line
    } else if (r === 4) {
      put(x, y, z, "white_concrete");               // spandrel
    } else {
      if (isPillar) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", glassProps);
        // Warm light behind some glazing, one block inside.
        if (r === 2 && (t % 3 === 1) && ((k * 2 + t) % 4 === 0)) {
          const [dx, dz] = INWARD[face];
          if (inside(x + dx, z + dz)) put(x + dx, y, z + dz, "glowstone");
        }
      }
    }
  }
}

// Tank and AC on the roof, only if the central 3x3 is fully interior.
if (tankFull) {
  for (const [x, z] of tankCells) {
    for (let y = ROOF + 1; y <= 39; y++) put(x, y, z, "light_gray_concrete");
    put(x, 40, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (inside(14, 5) && outDirs(14, 5).length === 0) {
  put(14, ROOF + 1, 5, "iron_block");
  put(14, ROOF + 2, 5, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
