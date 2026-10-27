// Way 162091724: a 1920s-30s stripped-classical commercial block on the slope, 3 storeys of cream render over a stone
// plinth, a shopfront with a dark-oak fascia on the ground storey, a stepped 4th-storey tower and a plant room on the roof.
// A one-block shell with an air gap behind the glass and a floor slab per storey; the footprint is the only thing built on.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162091724.cells.json`, "utf8"));
const W = 35, H = 30, D = 43;
const grid = () => Array.from({ length: D }, () => Array(W).fill(-1));
const ground = grid(), lidar = grid();
for (const [x, z, gr, roof] of cells) { ground[z][x] = gr; lidar[z][x] = roof; }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[z][x] >= 0;

// Massing: lidar roof snapped to three flat tiers (wing 9, main 13, tower 17), at least one storey above its ground.
const snap = (r) => (r <= 6 ? 5 : r <= 9 ? 9 : r <= 14 ? 13 : 17);
const top = grid();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inF(x, z)) top[z][x] = Math.max(snap(lidar[z][x]), ground[z][x] + 4);
// The tower keeps its 17 only where all eight neighbours are footprint at 13+: it is set back from every edge.
const towerCut = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inF(x, z) && top[z][x] === 17) {
  let ok = true;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (!(inF(x + dx, z + dz) && top[z + dz][x + dx] >= 13)) ok = false;
  if (!ok) towerCut.push([x, z]);
}
for (const [x, z] of towerCut) top[z][x] = 13;

const solid = (x, y, z) => inF(x, z) && y >= 0 && y < top[z][x];
const HORIZ = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const SIX = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const exposed = (x, y, z) => HORIZ.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const isEnv = (x, y, z) => solid(x, y, z) && SIX.some(([dx, dy, dz]) => !solid(x + dx, y + dy, z + dz));

const g = new Voxels([W, H, D]);
const lights = [];

// Facade of an envelope cell: cornice on the top course, pilasters at corners, a stone band and lintel per storey,
// glass between cream piers every third column; the ground storey is a shopfront with a dark-oak fascia.
function facade(x, y, z, faces) {
  const t = top[z][x], gs = Math.floor(ground[z][x] / 4) * 4, shop = y < gs + 4, r = y % 4;
  // a real corner is two faces on the footprint edge; a step between tiers takes its face as a wall
  const edgeFaces = faces.filter(([dx, dz]) => !inF(x + dx, z + dz));
  if (y === t - 1 || edgeFaces.length >= 2) return ["smooth_quartz"];
  if (r === 0) return [shop ? "polished_andesite" : "smooth_quartz"];
  if (r === 3) return [shop ? "dark_oak_planks" : "white_concrete"];
  const [dx] = edgeFaces[0] ?? faces[0], u = dx !== 0 ? z : x;
  if (u % 3 === 0) return ["smooth_quartz"];
  const pane = dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false" }
    : { north: "false", south: "false", east: "true", west: "true" };
  if (!shop && r !== 0 && (u + y) % 7 === 2) lights.push([x - (edgeFaces[0] ?? faces[0])[0], y, z - (edgeFaces[0] ?? faces[0])[1]]);
  return ["glass_pane", { ...pane, waterlogged: "false" }];
}

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const t = top[z][x], gr = ground[z][x];
  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }
    if (isEnv(x, y, z)) {
      const faces = exposed(x, y, z);
      if (!faces.length) g.set(x, y, z, "light_gray_concrete");   // roof membrane
      else { const [b, s] = facade(x, y, z, faces); g.set(x, y, z, b, s); }
    } else if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");   // floor slab; the rest is air
  }
  // coping on the exposed edges of the roof
  const edge = HORIZ.some(([dx, dz]) => !inF(x + dx, z + dz) || top[z + dz][x + dx] < t);
  if (edge) g.set(x, t, z, "smooth_quartz");
}

// Warm lights behind some glass (air cells inside the shell).
for (const [x, y, z] of lights) if (!solid(x, y, z)) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });

// Entrance on the south (+z) street front, at the lowest ground that still lets the door stand on its own foundation.
let best = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z) || inF(x, z + 1) || ground[z][x] % 4 > 1) continue;
  const score = -z * 100 + Math.abs(x - 17);
  if (!best || score < best.score) best = { x, z, score };
}
if (best) {
  const { x, z } = best, gs = Math.floor(ground[z][x] / 4) * 4;
  g.set(x, gs + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gs + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // a dark-oak hood over the door with a lantern on each side
  for (const dx of [-1, 0, 1]) g.set(x + dx, gs + 3, z, "dark_oak_planks");
  for (const dx of [-1, 1]) if (inF(x + dx, z)) g.set(x + dx, gs + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Plant room: a 4 x 3 box on the flat main roof, set in from its edges, with a cap.
let plant = null;
for (let z0 = 0; z0 + 3 <= D; z0++) for (let x0 = 0; x0 + 4 <= W; x0++) {
  let ok = true;
  for (let z = z0 - 1; z <= z0 + 3 && ok; z++) for (let x = x0 - 1; x <= x0 + 4 && ok; x++)
    if (!(inF(x, z) && top[z][x] === 13)) ok = false;
  if (!ok) continue;
  const d = Math.abs(x0 + 2 - W / 2) + Math.abs(z0 + 1 - D / 2);
  if (!plant || d < plant.d) plant = { x0, z0, d };
}
if (plant) for (let z = plant.z0; z < plant.z0 + 3; z++) for (let x = plant.x0; x < plant.x0 + 4; x++) {
  g.set(x, 13, z, "stone_bricks"); g.set(x, 14, z, "stone_bricks"); g.set(x, 15, z, "smooth_stone");
}

// A lightning rod on the tower, at the tower cell nearest the middle.
let tower = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inF(x, z) && top[z][x] === 17) {
  const d = Math.abs(x - W / 2) + Math.abs(z - D / 2);
  if (!tower || d < tower.d) tower = { x, z, d };
}
if (tower) g.set(tower.x, 17, tower.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const out = `${DIR}/way_162091724.nbt`;
const info = g.save(out);
console.log("saved", out, info);
