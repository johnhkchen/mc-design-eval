import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538402984.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538402984.nbt";

const W = 18, H = 23, D = 14;
const g = new Voxels([W, H, D]);
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior = footprint cell with a missing neighbour
const ext = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Primary street face: N (z min) first, then S, W, E
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  return "E";
};
const isCorner = (x, z) => {
  const m = [!has(x - 1, z), !has(x + 1, z), !has(x, z - 1), !has(x, z + 1)]
    .filter(Boolean).length;
  return m >= 2;
};

const SLAB = { type: "bottom", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

// Front (N) face entrance: middle cell of the north face
const northCells = cells
  .filter(([x, z]) => ext(x, z) && faceOf(x, z) === "N")
  .sort((a, b) => a[0] - b[0]);
const doorCell = northCells.length
  ? northCells[Math.floor(northCells.length / 2)]
  : null;
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

const DOOR_BASE = { facing: "south", hinge: "left", open: "false", powered: "false" };

for (const [x, z, gr] of cells) {
  const exterior = ext(x, z);
  const face = exterior ? faceOf(x, z) : null;

  // Foundation: solid from y 0 up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  // Ground-floor slab / base course
  put(x, gr, z, exterior ? "stone_bricks" : "smooth_stone");

  // Storey-2 floor slab (full footprint)
  put(x, gr + 5, z, "light_gray_concrete");

  // Roof deck (full footprint)
  put(x, gr + 11, z, "gray_concrete");

  if (exterior) {
    const corner = isCorner(x, z);
    const t = face === "N" || face === "S" ? x : z;
    const pillar = corner || t % 3 === 0;
    const frontFace = face === "N";

    // Pane connection props by facing
    const paneProps =
      face === "N" || face === "S"
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

    // Storey 1 base course already at gr (stone_bricks). Window band g+1..g+3.
    const s1Windows = [gr + 1, gr + 2, gr + 3];
    for (const y of s1Windows) {
      if (frontFace && (pillar === false) && `${x},${z}` === doorKey) {
        // Door placed below
        continue;
      }
      if (pillar) {
        put(x, y, z, "white_concrete");
      } else if (frontFace) {
        put(x, y, z, "glass");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      }
    }

    // Entrance door at front face middle
    if (`${x},${z}` === doorKey) {
      put(x, gr + 1, z, "dark_oak_door", { ...DOOR_BASE, half: "lower" });
      put(x, gr + 2, z, "dark_oak_door", { ...DOOR_BASE, half: "upper" });
      put(x, gr + 3, z, "glass");
    }

    // Storey 1 lintel / awning band
    put(x, gr + 4, z, frontFace && !corner ? "green_concrete" : "white_concrete");

    // Belt course at g+5 is handled by the full floor slab above (light gray)

    // Storey 2 spandrel
    put(x, gr + 6, z, "white_concrete");

    // Storey 2 window band g+7..g+9
    for (const y of [gr + 7, gr + 8, gr + 9]) {
      if (pillar) {
        put(x, y, z, "white_concrete");
      } else if (frontFace) {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      }
    }

    // Cornice
    put(x, gr + 10, z, "light_gray_concrete");

    // Parapet and coping
    put(x, gr + 12, z, "white_concrete");
    put(x, gr + 13, z, "smooth_stone_slab", SLAB);

    // Corner lanterns on the parapet
    if (corner) put(x, gr + 14, z, "lantern", LANTERN);

    // Warm light behind some windows (interior neighbour, storey mid-height)
    const inward =
      face === "N" ? [x, z + 1] :
      face === "S" ? [x, z - 1] :
      face === "W" ? [x + 1, z] : [x - 1, z];
    const [ix, iz] = inward;
    if (has(ix, iz) && !ext(ix, iz) && !pillar) {
      const lit = (t + (gr % 3)) % 4 === 0;
      if (lit) {
        const igr = gAt(ix, iz);
        put(ix, igr + 2, iz, "glowstone");   // ground storey window
        put(ix, igr + 8, iz, "glowstone");   // storey 2 window
      }
    }
  }
}

// Rooftop plant: a small equipment block on the roof deck, interior cells
for (const [x, z, gr] of cells) {
  if (ext(x, z)) continue;
  if (x >= 5 && x <= 7 && z >= 4 && z <= 6) {
    put(x, gr + 12, z, "iron_block");
  }
}

g.save(OUT);
