import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey 1980s Taipei commercial block: granite base, shopfront ground floor,
// tiled white concrete upper storey with a light-grey pilaster grid, bronze-blue glass,
// a cornice and parapet, and a rooftop of plant units with a mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833572";
const W = 22, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const FLOOR_Y = 6;     // string course / second-floor slab
const ROOF_Y = 11;     // roof deck and cornice line
const PARAPET_Y = 12;  // parapet course
const dirs = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

const outFaces = (x, z) => dirs.filter(([dx, dz]) => !has(x + dx, z + dz));
const isFacade = (x, z) => outFaces(x, z).length > 0;

// Front = outward face shared by the most footprint cells.
const faceCount = { north: 0, south: 0, east: 0, west: 0 };
for (const [x, z] of cells) for (const [, , f] of outFaces(x, z)) faceCount[f]++;
const front = Object.keys(faceCount).reduce((a, b) => (faceCount[b] > faceCount[a] ? b : a));
const frontCells = cells
  .filter(([x, z]) => outFaces(x, z).some(([, , f]) => f === front))
  .sort((a, b) => (front === "north" || front === "south" ? a[0] - b[0] : a[1] - b[1]));
const entrance = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;

// Pass 1: foundations, interiors, facades.
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  const out = outFaces(x, z);
  if (out.length === 0) {
    // Interior: floor slabs only, air elsewhere (no interiors).
    if (gr + 1 <= ROOF_Y) g.set(x, gr + 1, z, "smooth_stone");
    if (FLOOR_Y > gr && FLOOR_Y < ROOF_Y) g.set(x, FLOOR_Y, z, "smooth_stone");
    g.set(x, ROOF_Y, z, "smooth_stone");
    continue;
  }

  const corner = out.length > 1;
  const face = out[0][2];
  const t = face === "north" || face === "south" ? x : z;
  const pil = corner || t % 3 === 0;

  for (let y = gr + 1; y <= PARAPET_Y; y++) {
    let id;
    if (y === PARAPET_Y) id = "white_concrete";
    else if (y === ROOF_Y) id = "smooth_stone";
    else if (y === 10) id = "light_gray_concrete";
    else if (y >= 8 && y <= 9) id = pil ? "light_gray_concrete" : "light_blue_stained_glass";
    else if (y === 7) id = pil ? "light_gray_concrete" : "gray_concrete";
    else if (y === FLOOR_Y) id = "smooth_stone";
    else if (y === gr + 1 && y <= 5) id = "polished_granite";
    else if (y === 5) id = "light_gray_concrete";
    else id = pil ? "gray_concrete" : "light_blue_stained_glass"; // shopfront
    g.set(x, y, z, id);
  }
}

// Pass 2: warm light behind some upper-storey windows (glowstone in the interior cell).
for (const [x, z, gr] of cells) {
  const out = outFaces(x, z);
  if (out.length !== 1) continue;
  const [dx, dz, face] = out[0];
  const t = face === "north" || face === "south" ? x : z;
  if (t % 3 === 0) continue;
  if ((x * 3 + z * 5) % 4 !== 0) continue;
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && !isFacade(ix, iz) && 8 > groundAt(ix, iz)) {
    g.set(ix, 8, iz, "glowstone");
  }
}

// Pass 3: entrance door and roof plant.
if (entrance) {
  const [ex, ez, egr] = entrance;
  if (egr + 2 <= 4) {
    g.set(ex, egr + 1, ez, "dark_oak_door", {
      facing: front, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(ex, egr + 2, ez, "dark_oak_door", {
      facing: front, half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

for (const [x, z] of cells) {
  if (isFacade(x, z)) continue;
  if ((x * 2 + z) % 9 === 0) {
    g.set(x, PARAPET_Y, z, "light_gray_concrete");
    g.set(x, PARAPET_Y + 1, z, "light_gray_concrete");
  }
}

const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
if (has(cx, cz) && !isFacade(cx, cz)) {
  for (let y = PARAPET_Y; y <= PARAPET_Y + 2; y++) g.set(cx, y, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
