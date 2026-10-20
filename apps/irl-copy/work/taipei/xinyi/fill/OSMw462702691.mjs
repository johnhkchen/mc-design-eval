import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 世貿新城大廈 莊敬 : 1990s residential-office block, 11 storeys over a ground storey.
// White concrete frame, blue-tinted glazing in grey mullions, stone base, parapet, rooftop plant room.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw462702691";
const W = 48, H = 71, D = 71;
const STOREY = 5;
const ROOF = 59;          // roof top, relative to lowest ground
const DECK = 55;          // roof deck level (storey 11 line)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...cells.map((c) => c[2]));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g - minG);

const g = new Voxels([W, H, D]);

const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
// face the outward normal points to: N = -z (street frontage), S = +z, W = -x, E = +x
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  return "E";
};
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const hash = (x, y, z) => Math.abs(Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) % 11;

const pane = (face) => {
  const p = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (face === "N" || face === "S") { p.east = "true"; p.west = "true"; }
  else { p.north = "true"; p.south = "true"; }
  return p;
};

// 1. Foundation: solid from 0 up to each cell's ground
for (const [x, z, _] of cells) {
  const gg = gr(x, z);
  for (let y = 0; y < gg; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs at every storey line (and roof deck), across all footprint cells that reach that level
for (let L = 0; L <= DECK; L += STOREY) {
  const blk = L === DECK ? "gray_concrete" : "light_gray_concrete";
  for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
    if (L >= gr(x, z)) g.set(x, L, z, blk);
  }
}

// 3. Perimeter walls: base course, window bays, spandrels, parapet
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const face = faceOf(x, z);
  const base = gr(x, z);
  const bay = face === "N" || face === "S" ? x : z;

  for (let y = base; y <= ROOF - 1; y++) {
    if (y === base) { g.set(x, y, z, "polished_andesite"); continue; }
    if (y === DECK) continue;
    if (y > DECK) {
      g.set(x, y, z, y === ROOF - 1 ? "stone_brick_slab" : "white_concrete",
        y === ROOF - 1 ? { type: "top", waterlogged: "false" } : undefined);
      continue;
    }
    const o = y % STOREY;
    if (o === 0) continue;                       // storey slab line, already set
    const s = Math.floor(y / STOREY);
    const fy = y - base;

    // Ground storey, street frontage: entrance lobby
    if (s === 0 && face === "N" && Math.abs(x - 24) <= 1 && fy <= 2) {
      if (x === 24) {
        const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
        g.set(x, y, z, "dark_oak_door", { ...door, half: fy === 1 ? "lower" : "upper" });
      } else {
        g.set(x, y, z, "white_concrete");
      }
      continue;
    }

    if (o === 4) { g.set(x, y, z, "white_concrete"); continue; }   // spandrel under next slab

    // windows o = 1..3
    if (bay % 3 === 0) g.set(x, y, z, "gray_concrete");          // grey mullion frame
    else g.set(x, y, z, "light_blue_stained_glass_pane", pane(face));
  }
}

// 4. Warm lights behind some glazing (interior air cell just inside the window)
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const face = faceOf(x, z);
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  for (let y = gr(x, z) + 1; y < DECK; y++) {
    const o = y % STOREY;
    if (o !== 2) continue;
    const bay = face === "N" || face === "S" ? x : z;
    if (bay % 3 === 0) continue;
    if (hash(x, y, z) === 0) {
      g.set(ix, y, iz, hash(x, y, z + 1) % 2 ? "glowstone" : "shroomlight");
    }
  }
}

// 5. Roof: rooftop plant room with lit shell and lightning rod mast
const PH = { x0: 14, x1: 33, z0: 24, z1: 46 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!has(x, z)) continue;
    const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let y = DECK + 1; y <= ROOF; y++) {
      if (edge && y < ROOF) g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, ROOF + 1, z, "light_gray_concrete");
  }
}
// louvred band on plant room faces
for (let x = PH.x0 + 1; x < PH.x1; x++) {
  if (has(x, PH.z0)) g.set(x, DECK + 2, PH.z0, "iron_bars");
  if (has(x, PH.z1)) g.set(x, DECK + 2, PH.z1, "iron_bars");
}
g.set(24, ROOF + 2, 35, "lightning_rod");
for (let y = ROOF + 3; y <= ROOF + 6; y++) g.set(24, y, 35, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
