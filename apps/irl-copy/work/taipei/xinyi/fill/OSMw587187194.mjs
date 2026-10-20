import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise office block, c. 1985-95, Xinyi: 10 storeys of 5 blocks on a
// white-concrete frame with blue-tinted glass and light-grey spandrels.
// Two-storey commercial podium, stone plinth, lobby set in the north face,
// rooftop plant penthouse and a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587187194";
const W = 69, H = 62, D = 19;
const ROOF = 50;      // roof slab level above lowest ground
const PODIUM = 5;     // ground storey top (first storey line)
const ENT_X0 = 30, ENT_X1 = 37;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));

const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, gr - minG);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isBoundary = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Which outward face a boundary cell carries (z-faces preferred at corners).
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- Main pass: every footprint cell --------------------------------------
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gr = gAt(x, z);
  const f = faceOf(x, z);
  const bnd = f !== null;
  const idx = f === "N" || f === "S" ? x : z;   // mullion rhythm along the face
  const mull = bnd && idx % 3 === 0;
  const entrance = f === "N" && x >= ENT_X0 && x <= ENT_X1;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, bnd ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    if (!bnd) {
      // Interior: only floor slabs, no rooms; air between them
      if (y % 5 === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // ---- Boundary (facade) cells ----
    if (y < PODIUM) {
      // Commercial podium: plinth, shopfront, lintel
      if (y === gr) put(x, y, z, "stone_bricks");
      else if (y === PODIUM - 1) put(x, y, z, "smooth_stone");
      else if (entrance) put(x, y, z, "glass");
      else if (mull) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane");
      continue;
    }

    if (y % 5 === 0) {
      // Storey string course / slab line
      put(x, y, z, "white_concrete");
      continue;
    }

    const rel = y % 5;
    if (rel === 1 || rel === 4) {
      // Spandrels above and below the window band
      put(x, y, z, mull ? "white_concrete" : "light_gray_concrete");
    } else {
      // rel 2 and 3: glazed window band with mullions
      put(x, y, z, mull ? "white_concrete" : "light_blue_stained_glass_pane");
    }
  }

  // Parapet above the roof on the perimeter
  if (bnd) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "smooth_quartz");
  }
}

// ---- Lobby: columns carrying the entrance canopy --------------------------
for (const cx of [ENT_X0 - 1, ENT_X1 + 1]) {
  const cz = 1;
  if (!has(cx, cz)) continue;
  for (let y = gAt(cx, cz); y < PODIUM - 1; y++) put(cx, y, cz, "white_concrete");
}
for (let x = ENT_X0 - 1; x <= ENT_X1 + 1; x++) {
  for (const z of [0, 1]) {
    if (has(x, z)) put(x, PODIUM - 1, z, "smooth_stone");
  }
}

// ---- Warm lights behind some window panes (interior side) -----------------
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const f = faceOf(x, z);
  if (!f) continue;
  const idx = f === "N" || f === "S" ? x : z;
  if (idx % 3 === 0) continue;
  const gr = gAt(x, z);
  for (let y = Math.max(gr, PODIUM); y < ROOF; y++) {
    if (y % 5 !== 2) continue;
    const floor = Math.floor(y / 5);
    if ((idx + floor) % 4 !== 0) continue;
    let ix = x, iz = z;
    if (f === "N") iz = z + 1;
    else if (f === "S") iz = z - 1;
    else if (f === "W") ix = x + 1;
    else ix = x - 1;
    if (!has(ix, iz) || isBoundary(ix, iz)) continue;
    if (y < gAt(ix, iz)) continue;
    put(ix, y, iz, "glowstone");
  }
}

// ---- Rooftop plant penthouse and mast --------------------------------------
const PH = { x0: 20, x1: 48, z0: 6, z1: 12 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!has(x, z)) continue;
    const edgeZ = z === PH.z0 || z === PH.z1;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (y === ROOF + 2 && edgeZ && x % 3 !== 0) {
        put(x, y, z, "light_blue_stained_glass_pane");
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    }
    put(x, ROOF + 4, z, "stone_bricks");
  }
}

if (has(34, 9)) {
  for (let y = ROOF + 5; y <= ROOF + 8; y++) put(34, y, 9, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
