import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE102-0141-14F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 35, H = 81, D = 47;
const ROOF = 69;      // roof top (absolute, from lidar: ~69 above lowest ground)
const PODIUM = 10;    // two storeys of podium
const STOREY = 5;

const k = (x, z) => x * 64 + z;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(k(x, z), g);
const inSet = (x, z) => ground.has(k(x, z));
const gOf = (x, z) => ground.get(k(x, z));

// depth from the footprint edge (0 = outer edge cell)
const depth = new Map();
const queue = [];
for (const [x, z] of cells) {
  const edge = !inSet(x + 1, z) || !inSet(x - 1, z) || !inSet(x, z + 1) || !inSet(x, z - 1);
  if (edge) { depth.set(k(x, z), 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(k(x, z));
  for (const [nx, nz] of [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]) {
    if (inSet(nx, nz) && !depth.has(k(nx, nz))) {
      depth.set(k(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const depthOf = (x, z) => depth.get(k(x, z)) ?? 0;

// setback massing: outer ring stops at 45, middle at 57, core to roof
const tierTop = (d) => (d >= 8 ? ROOF : d >= 4 ? 57 : 45);
const colTop = (x, z) => Math.max(tierTop(depthOf(x, z)), gOf(x, z) + PODIUM + 2);

const present = (nx, nz, y) => {
  if (!inSet(nx, nz)) return false;
  const gn = gOf(nx, nz);
  return y >= gn && y < colTop(nx, nz);
};

const outwardAt = (x, z, y) => {
  const dirs = [];
  if (!present(x, z - 1, y)) dirs.push("north");
  if (!present(x, z + 1, y)) dirs.push("south");
  if (!present(x - 1, z, y)) dirs.push("west");
  if (!present(x + 1, z, y)) dirs.push("east");
  return dirs;
};

// entrance: ground-level south-facing edge cell nearest the footprint centre
let cx = 0, n = 0;
for (const [x] of cells) { cx += x; n++; }
cx /= n;
let door = null;
let best = Infinity;
for (const [x, z, g] of cells) {
  if (depthOf(x, z) !== 0) continue;
  if (!outwardAt(x, z, g + 1).includes("south")) continue;
  if (!inSet(x - 1, z) || !inSet(x + 1, z)) continue; // need flanking wall for pilasters
  const dd = Math.abs(x - cx);
  if (dd < best) { best = dd; door = { x, z, g, facing: "south" }; }
}
if (!door) {
  // fallback: any ground-level edge cell with a flanking neighbour
  for (const [x, z, g] of cells) {
    if (depthOf(x, z) !== 0) continue;
    const o = outwardAt(x, z, g + 1);
    if (!o.length) continue;
    if (!inSet(x - 1, z) || !inSet(x + 1, z)) continue;
    door = { x, z, g, facing: o[0] };
    break;
  }
}

const gv = new Voxels([W, H, D]);

// is this cell one of the entrance's flanking pilasters (beside the door on the same row)
const nearDoor = (x, z) =>
  door && z === door.z && Math.abs(x - door.x) === 1 && door.facing === "south";

for (const [x, z, g] of cells) {
  const T = colTop(x, z);
  const d = depthOf(x, z);

  // foundation
  for (let y = 0; y < g; y++) gv.set(x, y, z, "stone_bricks");

  for (let y = g; y < T; y++) {
    const rel = y - g;
    const ly = rel % STOREY;
    const idx = x + z;

    // roof cap / terrace
    if (y === T - 1) { gv.set(x, y, z, "light_gray_concrete"); continue; }

    const out = outwardAt(x, z, y);
    const facade = out.length > 0;

    if (!facade) {
      gv.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // parapet / cornice at top of each tier
    if (y >= T - 4) {
      gv.set(x, y, z, "white_concrete");
      continue;
    }

    let block;
    if (rel < STOREY) {
      // ground floor shopfront with stone pilasters flanking the entrance
      if (ly === 0) block = "smooth_stone";
      else if (ly === 4) block = "smooth_stone";
      else if (nearDoor(x, z)) block = "stone_bricks";
      else if (idx % 4 === 0) block = "stone_bricks";
      else block = "light_blue_stained_glass";
    } else if (rel < PODIUM) {
      // podium storeys
      if (ly === 0) block = "smooth_stone";
      else if (ly === 4) block = "white_concrete";
      else if (idx % 3 === 0) block = "white_concrete";
      else block = "light_blue_stained_glass";
    } else {
      // tower storeys: floor band, spandrel, window ribbons with proud fins
      if (ly === 0) block = "light_gray_concrete";
      else if (ly === 4) block = "white_concrete";
      else if (idx % 6 === 0) block = "light_gray_concrete";   // fin every 6 columns
      else if (idx % 3 === 0) block = "white_concrete";        // mullion
      else if (ly === 2 && (x * 7 + z * 13 + y * 3) % 23 === 0) block = "glowstone";
      else block = "light_blue_stained_glass";
    }
    gv.set(x, y, z, block);
  }

  // roof equipment on the core
  if (d >= 8 && T === ROOF && (x * 5 + z * 3) % 11 === 0) {
    gv.set(x, T, z, "iron_block");
    if ((x + 2 * z) % 2 === 0) gv.set(x, T + 1, z, "iron_block");
  }
}

// entrance: door, warm light above it, and a stone lintel course
if (door) {
  const { x, z, g, facing } = door;
  gv.set(x, g, z, "dark_oak_door",
    { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  gv.set(x, g + 1, z, "dark_oak_door",
    { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  gv.set(x, g + 2, z, "glowstone");
  for (const dx of [-1, 0, 1]) {
    gv.set(x + dx, g + 4, z, "smooth_stone");
  }
}

gv.save(`${DIR}/${ID}.nbt`);
