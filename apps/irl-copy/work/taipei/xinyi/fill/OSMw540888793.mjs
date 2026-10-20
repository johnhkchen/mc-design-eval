import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century Taipei shophouse-style office block: white-concrete frame with a
// stone base, a glazed shopfront, one storey line, a cornice and parapet,
// flat roof with rooftop plant. Roof is level at lowest ground + 11 blocks.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888793";
const W = 10, H = 23, D = 12;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = (Array.isArray(raw) ? raw : raw.cells).map((c) =>
  Array.isArray(c) ? c : [c.x, c.z, c.ground]
);

const ground = new Map();
for (const [x, z, gr] of list) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const B = Math.min(...ground.values());     // lowest ground under the footprint
const ROOF = B + 10;                        // roof surface / cornice course
const PARAPET = B + 11;                     // top of parapet (roof ~11 above lowest ground)

// Exterior faces of a footprint cell (a side with no neighbouring cell).
const faces = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  return f;
};

// Main entrance: middle of the south-facing row.
const zMax = Math.max(...list.map(([, z]) => z));
const southCells = list
  .filter(([x, z]) => z === zMax && faces(x, z).includes("S"))
  .sort((a, b) => a[0] - b[0]);
const door = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  g.set(x, y, z, id);
};

// Pass 1: foundations, interiors, roof plant.
for (const [x, z] of list.map(([x, z]) => [x, z])) {
  const gr = ground.get(`${x},${z}`);
  const f = faces(x, z);
  const edge = f.length > 0;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    put(x, gr, z, "polished_andesite");                    // ground-floor slab
    if (B + 5 >= gr) put(x, B + 5, z, "polished_andesite"); // storey-2 floor slab
    if (ROOF >= gr) put(x, ROOF, z, "light_gray_concrete"); // roof deck
    if (x % 4 === 2 && z % 4 === 2 && ROOF >= gr) {          // rooftop plant
      put(x, ROOF + 1, z, "light_gray_concrete");
      put(x, ROOF + 2, z, "iron_block");
    }
  }
}

// Pass 2: exterior envelope with articulated facades.
for (const [x, z] of list.map(([x, z]) => [x, z])) {
  const gr = ground.get(`${x},${z}`);
  const f = faces(x, z);
  if (f.length === 0) continue;

  const along = f[0] === "W" || f[0] === "E" ? z : x;
  const isWindowBay = f.length === 1 && along % 3 === 1;
  const isDoor = door && x === door[0] && z === door[1];

  for (let y = gr; y <= PARAPET; y++) {
    let id = "white_concrete";

    if (y === gr) id = "stone_bricks";                       // base course
    else if (y === PARAPET) id = "white_concrete";           // parapet
    else if (y === ROOF) id = "smooth_stone";                // cornice
    else if (y === B + 5) id = "smooth_stone";               // storey line
    else if (y === B + 4) id = "white_concrete";             // spandrel
    else {
      const winRow = (y >= B + 1 && y <= B + 3) || (y >= B + 6 && y <= B + 9);
      if (isDoor && (y === B + 1 || y === B + 2)) id = null;   // doorway
      else if (isDoor && y === B + 3) id = "red_concrete";     // canopy/lintel
      else if (winRow && isWindowBay) id = "glass";
      else id = "white_concrete";
    }
    if (id) put(x, y, z, id);
  }

  // Warm light behind selected storey-2 windows.
  if (isWindowBay && along % 6 === 1) {
    const inward = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] }[f[0]];
    const ix = x + inward[0], iz = z + inward[1];
    if (has(ix, iz) && faces(ix, iz).length === 0) put(ix, B + 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
