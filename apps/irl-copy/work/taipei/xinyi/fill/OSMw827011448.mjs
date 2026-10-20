import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw827011448.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw827011448.nbt";

const W = 24, H = 38, D = 19;
const ROOF = 25;      // top layer of the building shell; roof deck and parapet cap
const STOREY = 5;     // blocks per storey
const FLOORS = [0, 5, 10, 15, 20];

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const gmap = new Map();
for (const [x, z, g] of raw) {
  gmap.set(x + "," + z, Math.max(0, Math.min(g, ROOF - 6)));
}
const has = (x, z) => gmap.has(x + "," + z);
const gnd = (x, z) => gmap.get(x + "," + z);

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const sidesOf = (x, z) => {
  const out = [];
  for (const k of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[k];
    if (!has(x + dx, z + dz)) out.push(k);
  }
  return out;
};
const isPerim = (x, z) => sidesOf(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Front = south face (z max). Pick the south-facing non-corner cell nearest the middle.
const southCells = [];
for (const [key] of gmap) {
  const [x, z] = key.split(",").map(Number);
  const s = sidesOf(x, z);
  if (s.includes("s") && s.length === 1) southCells.push(x);
}
southCells.sort((a, b) => a - b);
const doorX = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;
const doorZ = doorX !== null ? [...gmap.keys()].map(k => k.split(",").map(Number)).find(([x]) => x === doorX && has(x, 0) !== undefined && isPerim(x, Math.max(...[...gmap.keys()].map(k => +k.split(",")[1])))) : null;
let frontZ = null;
if (doorX !== null) {
  frontZ = Math.max(...[...gmap.keys()].map(k => +k.split(",")[1]));
}
const doorG = doorX !== null ? gnd(doorX, frontZ) : 0;

// ---- Main pass: foundation, shell, floors, roof, windows, warm light ----
for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);

  // Foundation under the ground line
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const sides = sidesOf(x, z);
  const perim = sides.length > 0;

  if (!perim) {
    // Interior: floor slabs per storey plus ground slab and roof deck. Air otherwise.
    const floorSet = new Set(FLOORS);
    floorSet.add(gr);
    for (const y of floorSet) {
      if (y >= gr && y < ROOF) put(x, y, z, "smooth_quartz");
    }
    put(x, ROOF, z, "gray_concrete");
    continue;
  }

  // Facade face and pattern
  const face = ["s", "n", "e", "w"].find(f => sides.includes(f));
  const corner = sides.length >= 2;
  const u = (face === "n" || face === "s") ? x : z;
  const pier = corner || (u % 3 === 0);
  const inwardOff = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] }[face];
  const ix = x + inwardOff[0], iz = z + inwardOff[1];
  const inwardOK = has(ix, iz) && !isPerim(ix, iz);

  for (let y = gr; y <= ROOF; y++) {
    const B = STOREY * Math.floor(y / STOREY);
    const rel = y - B;
    let id;

    if (y === ROOF) {
      id = "smooth_quartz";                       // parapet cap
    } else if (y === gr && gr > 0) {
      id = "polished_granite";                    // base course on the slope
    } else if (rel === 0) {
      id = "smooth_quartz";                       // storey line
    } else if (rel === 4) {
      id = "white_concrete";                      // spandrel
    } else if (pier) {
      id = "white_concrete";                      // pier
    } else {
      id = "light_blue_stained_glass";            // window / shopfront glass
    }
    put(x, y, z, id);

    // Warm light behind some glass
    if (!pier && rel === 2 && inwardOK && gnd(ix, iz) <= y && ((u + B) % 4 === 0)) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// ---- Entrance, canopy and lantern on the south face ----
if (doorX !== null && frontZ !== null) {
  const dg = doorG;
  put(doorX, dg, frontZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, dg + 1, frontZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(doorX, dg + 2, frontZ, "lantern", { hanging: "true", waterlogged: "false" });

  for (const dx of [-1, 0, 1]) {
    const cx = doorX + dx;
    if (!has(cx, frontZ)) continue;
    const s = sidesOf(cx, frontZ);
    if (!s.includes("s")) continue;
    put(cx, dg + 3, frontZ, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- Roof plant: penthouse block, louvred band, roof deck, mast ----
const PH = { x0: 6, x1: 17, z0: 5, z1: 13 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let y = ROOF + 1; y <= ROOF + 4; y++) {
      let id;
      if (y === ROOF + 2) id = "smooth_quartz";            // louvre band
      else if (edge) id = "light_gray_concrete";
      else id = null;
      if (id) put(x, y, z, id);
    }
    put(x, ROOF + 5, z, "smooth_quartz");                  // penthouse roof
  }
}
const mastX = 11, mastZ = 9;
if (has(mastX, mastZ) && !isPerim(mastX, mastZ)) {
  for (let y = ROOF + 6; y <= ROOF + 8; y++) {
    put(mastX, y, mastZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(OUT);
