// Way 326736316, Eden Terrace / Mt Eden edge: a two-storey Edwardian brick shop-and-office block. Red brick walls on a
// stone plinth, a stone string course at the first floor, a smooth-stone cornice on the lidar roof line (y 7) and a
// two-course parapet with a coping. The street face (the longest run of outer walls) has a shopfront with a dark-oak
// fascia and a door; the other faces carry sash-style glass windows on a pier grid, with quoins at every corner. Some
// windows have glowstone just inside. Interiors are air: a floor slab per storey and a roof slab; a rooftop plant box.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326736316.cells.json", "utf8"));
const F = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const at = (x, z) => F.get(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// the outer faces of each footprint cell, and the straight runs of outer wall they make (along x for north/south, z for east/west)
const outward = new Map();
for (const key of F.keys()) {
  const [x, z] = key.split(",").map(Number);
  outward.set(key, Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return !at(x + dx, z + dz); }));
}
const runs = [];
for (const d of Object.keys(DIRS)) {
  const alongX = d === "north" || d === "south";
  const groups = new Map();
  for (const [key, os] of outward) {
    if (!os.includes(d)) continue;
    const [x, z] = key.split(",").map(Number);
    const fixed = alongX ? z : x, along = alongX ? x : z;
    if (!groups.has(fixed)) groups.set(fixed, []);
    groups.get(fixed).push(along);
  }
  for (const [fixed, alongs] of groups) {
    alongs.sort((a, b) => a - b);
    let run = [];
    for (const a of alongs) {
      if (run.length && a !== run[run.length - 1] + 1) { runs.push({ d, alongX, fixed, run }); run = []; }
      run.push(a);
    }
    if (run.length) runs.push({ d, alongX, fixed, run });
  }
}
// the face role of each (cell, direction): which run it belongs to and its place along it
const role = new Map();
runs.forEach((R, ri) => R.run.forEach((a, k) => {
  const [x, z] = R.alongX ? [a, R.fixed] : [R.fixed, a];
  role.set(`${x},${z},${R.d}`, { ri, k, L: R.run.length, alongX: R.alongX });
}));
const street = runs.reduce((best, R) => (R.run.length > best.run.length ? R : best), runs[0]);
const streetDir = street.d;
const doorK = Math.floor(street.run.length / 2);
const streetIndex = runs.indexOf(street);

const g = new Voxels([11, 20, 17]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const paneState = (alongX) => (alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const doorState = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
const isInterior = (x, z) => at(x, z) && outward.get(`${x},${z}`).length === 0;
const inward = (x, z, d) => { const [dx, dz] = DIRS[d]; return [x - dx, z - dz]; };
const OPP = { north: "south", south: "north", west: "east", east: "west" };

for (const [key, { g: G, r: R }] of F) {
  const [x, z] = key.split(",").map(Number);
  const os = outward.get(key);
  // foundation: solid from y 0 up to the lowest ground under the cell (none where the ground is level at y 0)
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
  if (!os.length) {
    // interior: floor slab per storey, roof slab, air between
    put(x, G, z, "smooth_stone");
    put(x, G + 4, z, "spruce_planks");
    put(x, R, z, "deepslate_tiles");
    continue;
  }
  const d0 = os[0];
  const rl = role.get(`${x},${z},${d0}`);
  // quoins: corners where both walls are straight runs of three or more, and the ends of such a run. The footprint's
  // stair steps are corners too, but short ones: those stay brick
  const bigCorner = os.length > 1 && os.every((d) => role.get(`${x},${z},${d}`).L >= 3);
  const quoin = bigCorner || (rl.L >= 3 && (rl.k === 0 || rl.k === rl.L - 1));
  const onStreet = os.includes(streetDir) && rl.ri === streetIndex;
  const isDoor = onStreet && rl.k === doorK && !quoin;
  const windowCell = !quoin && rl.k % 2 === 1;
  const pane = paneState(rl.alongX);
  // glowstone just inside a lit window, when there is room behind it
  const [ix, iz] = inward(x, z, d0);
  const lit = windowCell && (rl.k + rl.ri) % 3 === 0 && isInterior(ix, iz);
  for (let y = G; y < R; y++) {
    if (y === G) { put(x, y, z, "stone_bricks"); continue; }                     // plinth course
    if (y === G + 4) { put(x, y, z, "smooth_stone"); continue; }                  // first-floor string course
    if (isDoor && (y === G + 1 || y === G + 2)) {
      put(x, y, z, "dark_oak_door", doorState(OPP[d0], y === G + 1 ? "lower" : "upper"));
      continue;
    }
    if (onStreet && y === G + 3) { put(x, y, z, "dark_oak_planks"); continue; }  // shopfront fascia
    const ground = y < G + 4;
    const shopGlass = onStreet && !quoin && ground && y <= G + 2;
    if (!quoin && (windowCell || shopGlass)) {
      if (y === G + 1 || y === G + 2 || y >= G + 5) {
        put(x, y, z, "glass_pane", pane);
        if (lit && (ground ? y <= G + 2 : y >= G + 5)) put(ix, y, iz, "glowstone");
        continue;
      }
    }
    put(x, y, z, quoin ? "stone_bricks" : "bricks");
  }
  put(x, R, z, "smooth_stone");                                                  // cornice on the roof line
  put(x, R + 1, z, "bricks");                                                    // parapet
  put(x, R + 2, z, "bricks");
  put(x, R + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // coping
}

// roof: the flat roof slab over the interior; a plant box of 2x2 on the interior cells nearest the middle of the roof
const interior = [...F.keys()].filter((k) => outward.get(k).length === 0).map((k) => k.split(",").map(Number));
const cx = interior.reduce((s, [x]) => s + x, 0) / interior.length, cz = interior.reduce((s, [, z]) => s + z, 0) / interior.length;
let best = null;
for (const [x, z] of interior) {
  const sq = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!sq.every(([a, b]) => isInterior(a, b))) continue;
  const dist = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
  if (!best || dist < best.dist) best = { dist, sq, R: at(x, z).r };
}
if (best) {
  for (const [x, z] of best.sq) {
    put(x, best.R + 1, z, "iron_block");
    put(x, best.R + 2, z, "iron_block");
    put(x, best.R + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326736316.nbt");
