import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980398";
const W = 30, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground (rounded)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inFp = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

// Two storeys (~5 blocks each) above the lowest ground, roof/parapet at R
const R = minG + 11;

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Exterior faces of a footprint cell (outward direction)
function exteriorDirs(x, z) {
  const d = [];
  if (!inFp(x, z - 1)) d.push("north");
  if (!inFp(x, z + 1)) d.push("south");
  if (!inFp(x + 1, z)) d.push("east");
  if (!inFp(x - 1, z)) d.push("west");
  return d;
}
// Inward offset (toward the building interior) for a face
const INWARD = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

const cx = (W - 1) / 2;

// ---------- Pass 1: structure and facades ----------
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const dirs = exteriorDirs(x, z);
  const edge = dirs.length > 0;
  const corner = dirs.length >= 2;

  // Foundation below ground, base course on the ground line
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "polished_granite");

  if (gr >= R - 2) continue;

  const F1 = gr + 5;      // first-floor slab / storey line
  const DECK = R - 1;     // top slab (roof deck / cornice)

  // Floor slab per storey and roof deck (plates across the footprint)
  if (F1 < DECK) put(x, F1, z, edge ? "smooth_quartz" : "light_gray_concrete");
  put(x, DECK, z, edge ? "smooth_quartz" : "gray_concrete");

  if (edge) {
    // Parapet and coping
    put(x, R, z, "white_concrete");
    put(x, R + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

    // Which face gives the bay rhythm
    const face = dirs[0];
    const alongNorthSouth = face === "north" || face === "south";
    const bay = alongNorthSouth ? x : z;
    const neighbourMissing = alongNorthSouth
      ? !inFp(x - 1, z) || !inFp(x + 1, z)
      : !inFp(x, z - 1) || !inFp(x, z + 1);
    const isPierCol = corner || neighbourMissing;
    const pos = ((bay % 3) + 3) % 3;
    const window = !isPierCol && pos !== 0;

    const paneProps = alongNorthSouth
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

    // Ground storey: shopfront glass, piers, lintel band
    for (let y = gr + 1; y <= gr + 4 && y < F1; y++) {
      if (y === gr + 4) {
        put(x, y, z, "smooth_quartz");
      } else if (window) {
        put(x, y, z, "gray_stained_glass_pane", paneProps);
      } else {
        put(x, y, z, "white_concrete");
      }
    }

    // Upper storey: spandrels at top and bottom, window grid, piers
    for (let y = gr + 6; y <= R - 2; y++) {
      if (y === gr + 6 || y === R - 2) {
        put(x, y, z, "light_gray_concrete");
      } else if (window) {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  } else {
    // Interior: air behind the glass, nothing else beyond the plates
  }
}

// ---------- Pass 2: entrance, lamps, roof equipment ----------

// Entrance: prefer south-facing, non-corner cells nearest the centre
let door = null;
let bestScore = Infinity;
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const dirs = exteriorDirs(x, z);
  if (dirs.length === 0 || gr >= R - 2) continue;
  const score = (dirs.includes("south") ? 0 : 100) + (dirs.length >= 2 ? 50 : 0) + Math.abs(x - cx);
  if (score < bestScore) {
    bestScore = score;
    door = { x, z, gr, face: dirs.includes("south") ? "south" : dirs[0] };
  }
}

if (door) {
  const doorProps = (half) => ({
    facing: door.face,
    half,
    hinge: "left",
    open: "false",
    powered: "false",
    waterlogged: "false",
  });
  put(door.x, door.gr + 1, door.z, "oak_door", doorProps("lower"));
  put(door.x, door.gr + 2, door.z, "oak_door", doorProps("upper"));
  put(door.x, door.gr + 3, door.z, "gray_stained_glass_pane", {
    north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
  });

  // Lantern just inside the entrance, standing on the interior floor
  const [ox, oz] = INWARD[door.face];
  const ix = door.x + ox, iz = door.z + oz;
  if (inFp(ix, iz) && exteriorDirs(ix, iz).length === 0) {
    put(ix, door.gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Warm lights behind some upper-storey and shopfront windows
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const dirs = exteriorDirs(x, z);
  if (dirs.length === 0 || gr >= R - 2) continue;
  const face = dirs[0];
  const alongNorthSouth = face === "north" || face === "south";
  const bay = alongNorthSouth ? x : z;
  const pos = ((bay % 3) + 3) % 3;
  const group = Math.floor(bay / 3);
  const [ox, oz] = INWARD[face];
  const ix = x + ox, iz = z + oz;
  if (!inFp(ix, iz) || exteriorDirs(ix, iz).length > 0) continue;
  if (pos === 1 && group % 2 === 0) {
    put(ix, gr + 7, iz, "glowstone");
  }
  if (pos === 2 && group % 3 === 1 && gr + 2 < F1Of(gr)) {
    put(ix, gr + 2, iz, "shroomlight");
  }
}

function F1Of(gr) { return gr + 5; }

// Roof equipment: AC plant and a small service block on the deck
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (exteriorDirs(x, z).length > 0 || gr >= R - 2) continue;
  if (x >= 4 && x <= 7 && z >= 3 && z <= 5) {
    put(x, R, z, "light_gray_concrete");
    put(x, R + 1, z, "light_gray_concrete");
  }
  if (x >= 20 && x <= 23 && z >= 7 && z <= 8) {
    put(x, R, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
