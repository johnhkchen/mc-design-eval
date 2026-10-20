import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466777";
const W = 24, H = 38, D = 20;
const ROOF = 26;          // lidar roof height above lowest ground
const STOREY = 5;         // blocks per storey

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup ----
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => foot.has(`${x},${z}`);
const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Boundary and face info for each footprint cell
function faceInfo(x, z) {
  const bnd = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  const ns = !has(x, z - 1) || !has(x, z + 1);   // exposed on a north/south-facing side
  const ew = !has(x - 1, z) || !has(x + 1, z);   // exposed on an east/west-facing side
  // piers: corners always; otherwise every 3rd cell along the exposed face
  const pier = bnd && ((ns && ew) || (ns ? x % 3 === 0 : z % 3 === 0));
  return { bnd, ns, ew, pier };
}

// ---- 1. foundations: solid from y 0 up to each cell's ground ----
for (const [x, z, gr] of cells) {
  const top = Math.min(Math.round(gr), H - 1);
  for (let y = 0; y <= top; y++) put(x, y, z, "stone_bricks");
}

// ---- 2. body: storeys, facade, floor slabs, air gap behind glass ----
for (const [x, z, gr] of cells) {
  const ground = Math.round(gr);
  const { bnd, ns, ew, pier } = faceInfo(x, z);

  for (let y = ground + 1; y < ROOF; y++) {
    const r = y - ground;                 // height above this cell's ground
    const storeyIdx = Math.floor((r - 1) / STOREY);
    const rem = r % STOREY;               // 0 = floor line, 4 = head band

    if (!bnd) {
      // interior: air gap, floor slab per storey
      if (rem === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // facade
    if (rem === 0 || rem === 4) {
      put(x, y, z, "white_concrete");                       // spandrel / storey line
    } else if (pier) {
      put(x, y, z, "smooth_quartz");                        // frame pier
    } else if (r < STOREY && r === 1) {
      put(x, y, z, "polished_andesite");                    // ground-floor base course
    } else if (r < STOREY) {
      put(x, y, z, "glass");                                // clear shopfront glass
    } else {
      // upper storeys: dark curtain glass, some lit by glowstone behind
      const lit = rem === 2 && ((x * 7 + z * 3 + storeyIdx) % 5 === 0);
      put(x, y, z, lit ? "glowstone" : "gray_stained_glass");
    }
  }

  // floor slab level at the top of the body, where the roof stands
  if (ROOF < H) put(x, ROOF, z, "light_gray_concrete");
}

// ---- 3. entrance: opening on the north-facing frontage, centred ----
for (const [x, z, gr] of cells) {
  const ground = Math.round(gr);
  const northFace = !has(x, z - 1);
  if (northFace && x >= 10 && x <= 13) {
    for (let r = 1; r <= 3; r++) put(x, ground + r, z, "air");
    // warm light either side of the door
    if (x === 10 || x === 13) put(x, ground + 3, z, "shroomlight");
  }
}

// ---- 4. parapet and cap on the roof edge ----
for (const [x, z] of [...foot.keys()].map((k) => k.split(",").map(Number))) {
  const { bnd } = faceInfo(x, z);
  if (!bnd) continue;
  put(x, ROOF + 1, z, "white_concrete");
  put(x, ROOF + 2, z, "white_concrete");
  put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// ---- 5. rooftop: plant and mechanical penthouse ----
const penthouse = (x, z) => x >= 7 && x <= 16 && z >= 6 && z <= 13 && has(x, z);
for (const [x, z] of [...foot.keys()].map((k) => k.split(",").map(Number))) {
  if (penthouse(x, z)) {
    const edge = x === 7 || x === 16 || z === 6 || z === 13;
    for (let y = ROOF + 1; y <= ROOF + 4; y++) {
      put(x, y, z, edge && (y === ROOF + 2 || y === ROOF + 3) ? "iron_bars" : "light_gray_concrete");
    }
    put(x, ROOF + 5, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// condenser units on the open roof
for (const [x, z] of [[4, 4], [5, 4], [19, 15], [18, 15]]) {
  if (has(x, z)) put(x, ROOF + 1, z, "iron_block");
}

// antenna mast on the penthouse axis
if (has(11, 10)) {
  for (let y = ROOF + 6; y <= ROOF + 10; y++) put(11, y, 10, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
