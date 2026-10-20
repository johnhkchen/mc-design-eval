import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-90s Taipei commercial block: two storeys over a stone plinth,
// white tiled concrete walls, a light-blue glass shopfront at street level,
// upper-floor window bays, a cornice-parapet roof and a plant housing on top.
// Storeys are 5 blocks: ground at gr (base), shopfront gr+1..gr+3, lintel gr+4;
// upper floor gr+6..gr+8 with band at gr+5 and gr+9; cornice/roof at gr+10.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833556";
const W = 20, H = 23, D = 21;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((e) => (Array.isArray(e) ? e : [e.x, e.z, e.ground]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const g = new Voxels([W, H, D]);

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
};

const inside = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function missingDirs(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!inside(x + dx, z + dz)) out.push(name);
  }
  return out;
}

// Pane orientation: a pane on a north/south facing wall connects east-west, and vice versa.
function paneProps(face) {
  const alongX = face === "north" || face === "south";
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
}

// 1. Foundation, floors, walls, bands and roof for every footprint cell.
for (const [x, z, gr] of cells) {
  const miss = missingDirs(x, z);
  const edge = miss.length > 0;
  const corner = miss.length >= 2;

  // Stone plinth from the ground up to the lowest-ground line of this cell.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course / ground-floor slab.
  put(x, gr, z, edge ? "polished_granite" : "smooth_stone");

  // Storey-two floor line / slab.
  put(x, gr + 5, z, edge ? "light_gray_concrete" : "smooth_stone");

  // Cornice on the edge, roof deck inside.
  put(x, gr + 10, z, edge ? "smooth_quartz" : "gray_concrete");

  if (!edge) continue;

  // Wall body for both storeys, default white tiled concrete.
  for (const y of [gr + 1, gr + 2, gr + 3, gr + 4, gr + 6, gr + 7, gr + 8, gr + 9]) {
    put(x, y, z, "white_concrete");
  }

  // Lintel and sill bands at storey heights.
  put(x, gr + 4, z, "light_gray_concrete");
  put(x, gr + 9, z, "light_gray_concrete");

  // Window bays on flat (non-corner) wall cells, with light-gray piers between them.
  const bay = !corner && (x + z) % 3 !== 0;
  const face = miss[0];

  if (bay) {
    // Shopfront glass at street level.
    for (const y of [gr + 1, gr + 2, gr + 3]) {
      put(x, y, z, "light_blue_stained_glass");
    }
    // Upper-floor panes with frames.
    for (const y of [gr + 6, gr + 7, gr + 8]) {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
    }
  } else if (!corner) {
    // Pier between bays.
    for (const y of [gr + 1, gr + 2, gr + 3, gr + 6, gr + 7, gr + 8]) {
      put(x, y, z, "light_gray_concrete");
    }
  }
}

// 2. Warm lights behind some interior glass (air gap inside, lit upper-floor interior).
for (const [x, z, gr] of cells) {
  if (missingDirs(x, z).length > 0) continue;
  if ((x * 5 + z * 3) % 13 === 0) put(x, gr + 7, z, "shroomlight");
}

// 3. Entrance on the south face, nearest the middle, overwriting a shopfront bay.
let doorCell = null;
let bestDist = Infinity;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const miss = missingDirs(x, z);
  if (!miss.includes("south") || miss.length !== 1) continue;
  const d = Math.abs(x - W / 2);
  if (d < bestDist) {
    bestDist = d;
    doorCell = [x, z, miss[0]];
  }
}
if (!doorCell) {
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    const miss = missingDirs(x, z);
    if (miss.length === 1) {
      doorCell = [x, z, miss[0]];
      break;
    }
  }
}
if (doorCell) {
  const [dx, dz, face] = doorCell;
  const gr = ground.get(`${dx},${dz}`);
  const facing = face;
  const doorProps = (half) => ({
    facing,
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(dx, gr + 1, dz, "dark_oak_door", doorProps("lower"));
  put(dx, gr + 2, dz, "dark_oak_door", doorProps("upper"));
  // Transom glass above the door.
  put(dx, gr + 3, dz, "light_blue_stained_glass");
}

// 4. Rooftop plant housing on the interior roof deck, with a quartz cap.
const cx = Math.floor(W / 2);
const cz = Math.floor(D / 2);
for (const [x, z, gr] of cells) {
  if (missingDirs(x, z).length > 0) continue;
  if (x >= cx - 3 && x <= cx + 1 && z >= cz - 2 && z <= cz + 1) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
