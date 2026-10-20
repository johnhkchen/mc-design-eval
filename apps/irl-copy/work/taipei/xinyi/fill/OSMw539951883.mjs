import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi low-rise commercial block, c. 1990s: two storeys over a shopfront,
// white-tiled concrete piers, light-blue curtain glazing, grey cornice and parapet,
// a rooftop plant penthouse and warm interior light behind the glass.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951883";
const W = 17, H = 23, D = 24;
const CAP = 10;            // parapet / roof-deck block; roof surface at y = 11

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(Math.floor(gy), CAP - 3)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const exposed = (x, z) =>
  Object.keys(DIRS).filter((k) => {
    const [dx, dz] = DIRS[k];
    return !has(x + dx, z + dz);
  });

const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const exteriorOf = new Map(); // key -> face list
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const ex = exposed(x, z);
  if (ex.length) exteriorOf.set(`${x},${z}`, ex);
}

// 1. Foundations, floors, walls, cornice, parapet
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gc = gAt(x, z);

  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const ex = exteriorOf.get(key);
  if (!ex) {
    // Interior: floor slabs and roof deck only; air gap otherwise
    put(x, gc, z, "smooth_stone");
    if (gc + 5 < CAP) put(x, gc + 5, z, "smooth_stone");
    put(x, CAP, z, "light_gray_concrete");
    continue;
  }

  // Facade face: first exposed side; column rhythm runs along it
  const face = ex[0];
  const u = face === "north" || face === "south" ? x : z;
  const pier = u % 3 === 0;

  for (let y = gc; y <= CAP; y++) {
    const r = y - gc;
    let id;
    if (y === CAP) id = "light_gray_concrete";           // parapet coping
    else if (r === 0) id = "polished_andesite";           // base course
    else if (r <= 3) id = pier ? "stone_bricks" : "light_blue_stained_glass"; // shopfront
    else if (r === 4) id = "light_gray_concrete";         // shop lintel band
    else if (r === 5) id = "smooth_stone";                // storey line
    else if (r <= 8) id = pier ? "white_concrete" : "light_blue_stained_glass"; // upper windows
    else id = "light_gray_concrete";                      // cornice
    put(x, y, z, id);
  }
}

// 2. Interior light behind selected glass (air gap, warm glow)
for (const [key, ex] of exteriorOf) {
  const [x, z] = key.split(",").map(Number);
  const gc = gAt(x, z);
  const face = ex[0];
  const [dx, dz] = DIRS[OPP[face]];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || exteriorOf.has(`${ix},${iz}`)) continue;
  const u = face === "north" || face === "south" ? x : z;
  if (u % 3 !== 0 && u % 6 === 1 && gc + 7 < CAP) {
    put(ix, gc + 7, iz, "glowstone");
  }
  if (u % 3 !== 0 && u % 6 === 4 && gc + 1 < CAP) {
    put(ix, gc + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 3. Entrance on the most southern exposed face, centred on the footprint
{
  const xs = [];
  for (const [key, ex] of exteriorOf) {
    if (ex.includes("south")) xs.push(Number(key.split(",")[0]));
  }
  if (xs.length) {
    xs.sort((a, b) => a - b);
    const cx = xs[Math.floor(xs.length / 2)];
    const z = Math.max(...cells.map(([, zz]) => zz));
    const gc = gAt(cx, z);
    if (gc !== undefined) {
      put(cx, gc + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(cx, gc + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(cx, gc + 3, z, "light_gray_concrete");
      // Warm lantern inside the entrance
      if (has(cx, z - 1)) {
        put(cx, gc + 1, z - 1, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

// 4. Roof: plant penthouse, AC units, corner lanterns
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (exteriorOf.has(key)) {
    const ex = exteriorOf.get(key);
    if (ex.length >= 2) put(x, CAP + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    continue;
  }
  const inPent = x >= 5 && x <= 11 && z >= 7 && z <= 16;
  if (inPent) {
    put(x, CAP + 1, z, "white_concrete");
    put(x, CAP + 2, z, "light_gray_concrete");
  } else if ((x + z) % 5 === 0) {
    put(x, CAP + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
