import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397511";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Palette: 1990s Xinyi office block, white quartz piers, bronze-grey glazing,
// granite plinth, andesite belt courses and cornice.
const FOUND = "stone_bricks";
const SLAB = "smooth_stone";
const PIER = "quartz_block";
const GLASS = "gray_stained_glass";
const BASE = "polished_granite";
const BELT = "polished_andesite";
const PARAPET = "smooth_quartz";
const DOOR = "dark_oak_door";

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inside = (x, z) => ground.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const missing = (x, z) =>
  Object.entries(DIRS).filter(([, [dx, dz]]) => !inside(x + dx, z + dz)).map(([n]) => n);
const isPerim = (x, z) => missing(x, z).length > 0;
const G = (x, z) => ground.get(`${x},${z}`);

// Entrance: a single-face perimeter cell on the south side nearest the middle.
const ent = (() => {
  const single = cells.filter(([x, z]) => isPerim(x, z) && missing(x, z).length === 1);
  let pool = single.filter(([x, z]) => missing(x, z)[0] === "south");
  if (!pool.length) pool = single;
  if (!pool.length) return null;
  const mx = pool.reduce((s, c) => s + c[0], 0) / pool.length;
  const best = pool.reduce((b, c) => (Math.abs(c[0] - mx) < Math.abs(b[0] - mx) ? c : b));
  return { x: best[0], z: best[1], face: missing(best[0], best[1])[0] };
})();

// Pass 1: foundation, floor slabs, belt courses, cladding, parapet.
for (const [x, z] of cells) {
  const gr = G(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  g.set(x, gr, z, SLAB);

  const perim = isPerim(x, z);
  if (!perim) {
    if (5 > gr) g.set(x, 5, z, SLAB);
    g.set(x, 10, z, SLAB); // roof slab
    continue;
  }

  const miss = missing(x, z);
  const face = miss.length === 1 ? miss[0] : null;
  const idx = face === null ? 0 : (face === "north" || face === "south" ? x : z);
  const isWin = face !== null && idx % 3 !== 0;

  for (let y = gr + 1; y <= 10; y++) {
    if (y === 10) { g.set(x, y, z, BELT); continue; }          // cornice
    if (y === 5 && 5 > gr) { g.set(x, y, z, BELT); continue; } // belt course
    if (y === gr + 1) { g.set(x, y, z, BASE); continue; }      // plinth
    const storey1 = y < 5;
    const winRow = storey1 ? (y === gr + 2 || y === gr + 3) : (y === 7 || y === 8);
    if (winRow && isWin) g.set(x, y, z, GLASS);
    else g.set(x, y, z, PIER);
  }

  // Parapet on the roof edge.
  g.set(x, 11, z, PARAPET);
}

// Entrance: double door, hanging lantern, lintel already quartz above.
if (ent) {
  const gr = G(ent.x, ent.z);
  const facing = ent.face;
  g.set(ent.x, gr + 1, ent.z, DOOR, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ent.x, gr + 2, ent.z, DOOR, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(ent.x, gr + 3, ent.z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 2: glowing offices behind selected windows, rooftop plant, lightning rod.
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const miss = missing(x, z);
  if (miss.length !== 1) continue;
  const face = miss[0];
  const idx = (face === "north" || face === "south") ? x : z;
  if (idx % 3 === 0 || idx % 6 !== 1) continue;
  const [dx, dz] = DIRS[OPP[face]];
  const ix = x + dx, iz = z + dz;
  if (!inside(ix, iz) || isPerim(ix, iz)) continue;
  const ig = G(ix, iz);
  const gr = G(x, z);
  g.set(ix, gr + 2, iz, "glowstone");
  if (gr + 2 !== 7) g.set(ix, 7, iz, "glowstone");
}

// Rooftop plant room.
for (let x = 8; x <= 15; x++) {
  for (let z = 6; z <= 11; z++) {
    if (inside(x, z) && !isPerim(x, z)) g.set(x, 11, z, "light_gray_concrete");
  }
}
for (let x = 9; x <= 14; x++) {
  for (let z = 7; z <= 10; z++) {
    if (inside(x, z) && !isPerim(x, z)) g.set(x, 12, z, "stone_bricks");
  }
}
if (inside(20, 5) && !isPerim(20, 5)) {
  g.set(20, 11, 5, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
