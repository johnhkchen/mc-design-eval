import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source. Lidar roof ~11 blocks above lowest ground, footprint 15 x 21.
// Read as a two-storey Taipei commercial block of the late 20th century:
// shopfront ground floor with a red signboard band, white tiled upper storey
// in bays of glazing and piers, a cornice and a plain parapet with rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541374045";
const W = 15, H = 23, D = 21;

const ROOF = 11;      // parapet top course (roof deck sits at y=11)
const FLOOR2 = 5;     // second-floor slab / storey line
const CORNICE = 10;   // ceiling slab of storey 2 and cornice band
const SIGN_Y = 4;     // red signboard band above shopfronts

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);

const OUT = { N: "north", S: "south", W: "west", E: "east" };
const DELTA = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Outward faces of a footprint cell (a face is outward when the neighbour is absent)
const facesOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const uOf = (f, x, z) => (f === "N" || f === "S" ? x : z);

// Run extents per face along the facade's horizontal axis
const runMin = { N: Infinity, S: Infinity, W: Infinity, E: Infinity };
const runMax = { N: -Infinity, S: -Infinity, W: -Infinity, E: -Infinity };
for (const [x, z] of cells) {
  for (const f of facesOf(x, z)) {
    const u = uOf(f, x, z);
    runMin[f] = Math.min(runMin[f], u);
    runMax[f] = Math.max(runMax[f], u);
  }
}

// Piers: corners, run ends, and every third bay along each facade
const isPier = (x, z) => {
  const fs = facesOf(x, z);
  if (fs.length === 0) return false;
  if (fs.length > 1) return true;
  const f = fs[0];
  const u = uOf(f, x, z);
  return u === runMin[f] || u === runMax[f] || (u - runMin[f]) % 3 === 0;
};

// Entrance: middle of the south facade (or first available face)
const doorFace = ["S", "N", "E", "W"].find((d) => runMax[d] > -Infinity);
const doorU = Math.floor((runMin[doorFace] + runMax[doorFace]) / 2);
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const fs = facesOf(x, z);
    if (fs.length !== 1 || fs[0] !== doorFace || isPier(x, z)) continue;
    const d = Math.abs(uOf(doorFace, x, z) - doorU);
    if (d < best) { best = d; doorCell = [x, z]; }
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z] of cells) {
  const gr = ground.get(`${x},${z}`);
  const fs = facesOf(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (fs.length === 0) {
    // Interior: floor slabs per storey, ceiling slab, roof deck, air between
    if (gr <= FLOOR2) put(x, gr, z, "smooth_stone");
    if (gr <= FLOOR2) put(x, FLOOR2, z, "smooth_stone");
    if (gr <= CORNICE) put(x, CORNICE, z, "smooth_stone");
    if (gr <= ROOF) put(x, ROOF, z, "stone_bricks");
    // Rooftop plant: a few condenser boxes and one lightning rod
    if ((x * 3 + z * 5) % 7 === 0 && x > 1 && x < W - 2 && z > 1 && z < D - 2) {
      put(x, ROOF + 1, z, "light_gray_concrete");
    }
    if (x === 7 && z === 10) put(x, ROOF + 1, z, "lightning_rod", { facing: "up", waterlogged: "false" });
    continue;
  }

  const f = fs[0];
  const u = uOf(f, x, z);
  const pier = isPier(x, z);
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;
  const nextToDoor = fs.length === 1 && f === doorFace && Math.abs(u - doorU) === 1;
  const lit = !pier && ((x * 7 + z * 3) % 5 === 0);

  for (let y = gr; y <= ROOF; y++) {
    // Base course at street level
    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }

    // Shopfront storey (ground floor)
    if (y < SIGN_Y) {
      if (pier || fs.length > 1) { put(x, y, z, "stone_bricks"); continue; }
      if (isDoor) {
        if (y === gr + 1) { put(x, y, z, "dark_oak_door", { facing: OUT[f], half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gr + 2) { put(x, y, z, "dark_oak_door", { facing: OUT[f], half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      }
      if (y === gr + 3 && nextToDoor) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      put(x, y, z, "glass");
      continue;
    }

    // Signboard band
    if (y === SIGN_Y) { put(x, y, z, "red_terracotta"); continue; }

    // Storey line
    if (y === FLOOR2) { put(x, y, z, "smooth_quartz"); continue; }

    // Upper storey: piers and window bays
    if (y > FLOOR2 && y < CORNICE) {
      if (pier || fs.length > 1) { put(x, y, z, "white_concrete"); continue; }
      if (y === FLOOR2 + 1) { put(x, y, z, "smooth_quartz"); continue; } // sill
      if (lit && y === 8) { put(x, y, z, "glowstone"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    // Cornice
    if (y === CORNICE) { put(x, y, z, "smooth_quartz"); continue; }

    // Parapet
    if (y === ROOF) { put(x, y, z, "white_concrete"); continue; }
  }
}

g.save(`${DIR}/${ID}.nbt`);
