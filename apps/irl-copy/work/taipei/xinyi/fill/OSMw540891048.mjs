import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540891048";
const W = 16, H = 23, D = 11;

// Record: no building name. Read as a two-storey, flat-roofed commercial block
// (c. 1970s-80s Xinyi low-rise): stone plinth, white-concrete piers, quartz storey
// bands, glass-pane shopfront and upper windows, parapet with rooftop plant.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces a footprint cell has (missing neighbour = exterior face).
const faces = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  return f;
};

// Pick the front (longest exterior face) for the entrance.
const counts = { west: 0, east: 0, north: 0, south: 0 };
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (const f of faces(x, z)) counts[f]++;
}
const front = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

// Door at the middle of the front face.
const frontCells = [];
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (faces(x, z).includes(front)) {
    const t = (front === "west" || front === "east") ? z : x;
    frontCells.push({ x, z, t });
  }
}
frontCells.sort((a, b) => a.t - b.t);
const doorCell = frontCells[Math.floor(frontCells.length / 2)];
const doorKey = doorCell ? `${doorCell.x},${doorCell.z}` : null;

// Pass 1: foundation, plinth, floor slabs, roof deck.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const gl = Math.min(Math.max(0, Math.round(gr)), H - 12);
  const fs = faces(x, z);
  const perim = fs.length > 0;

  for (let y = 0; y < gl; y++) put(x, y, z, "stone_bricks");   // foundation
  put(x, gl, z, "stone_bricks");                              // base course / ground slab
  put(x, gl + 5, z, "smooth_quartz");                         // storey 2 floor
  if (perim) {
    put(x, gl + 10, z, "smooth_quartz");                      // parapet
  } else {
    put(x, gl + 10, z, "light_gray_concrete");                // roof deck
  }
}

// Pass 2: perimeter walls, shopfront, upper windows.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const gl = Math.min(Math.max(0, Math.round(gr)), H - 12);
  const fs = faces(x, z);
  if (fs.length === 0) continue;

  const corner = fs.length >= 2;
  const f = fs[0];
  const alongZ = f === "west" || f === "east";
  const t = alongZ ? z : x;
  const pier = corner || t % 3 === 0;
  const isDoor = key === doorKey;

  const pane = {
    north: alongZ ? "true" : "false",
    south: alongZ ? "true" : "false",
    east: alongZ ? "false" : "true",
    west: alongZ ? "false" : "true",
    waterlogged: "false",
  };

  // Ground floor shopfront (rows gl+1..gl+3)
  for (let y = gl + 1; y <= gl + 3; y++) {
    if (isDoor && y <= gl + 2) {
      const half = y === gl + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: front, half, hinge: "left", open: "false", powered: "false",
      });
    } else if (pier) {
      put(x, y, z, "polished_andesite");
    } else {
      put(x, y, z, "glass_pane", pane);
    }
  }
  // Lintel band under the first storey
  put(x, gl + 4, z, "smooth_quartz");

  // Storey line between floors
  put(x, gl + 5, z, "smooth_quartz");

  // Upper storey windows (rows gl+6..gl+8)
  for (let y = gl + 6; y <= gl + 8; y++) {
    if (pier) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane", pane);
  }
  // Cornice under parapet
  put(x, gl + 9, z, "smooth_quartz");
}

// Pass 3: interior warm lights (behind glass) and rooftop plant.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const gl = Math.min(Math.max(0, Math.round(gr)), H - 12);
  const perim = faces(x, z).length > 0;
  if (perim) continue;

  // Ground-floor hanging lanterns
  if ((x + z) % 4 === 0) {
    put(x, gl + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
  // Upper-floor glowstone accents on the floor
  if ((x + 2 * z) % 5 === 0) {
    put(x, gl + 6, z, "glowstone");
  }
  // Rooftop AC plant boxes
  if (x % 4 === 1 && z % 3 === 1) {
    put(x, gl + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
