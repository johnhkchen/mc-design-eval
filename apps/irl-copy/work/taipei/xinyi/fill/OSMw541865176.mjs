import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1990s: two storeys on a plinth, white
// tiled concrete walls with light-grey pilasters, a shopfront ground floor,
// punched upper windows with grey frames, a cornice and parapet, one entrance
// with a red fascia, and roof plant. Footprint 15 x 19, roof ~11 blocks up.

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw541865176";
const W = 15, H = 23, D = 19;

const cellsRaw = JSON.parse(readFileSync(`${base}/${id}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, g] of cellsRaw) G.set(`${x},${z}`, g);
const has = (x, z) => G.has(`${x},${z}`);
const gAt = (x, z) => G.get(`${x},${z}`);

const xs = cellsRaw.map((c) => c[0]), zs = cellsRaw.map((c) => c[1]);
const x0 = Math.min(...xs), x1 = Math.max(...xs);
const z0 = Math.min(...zs), z1 = Math.max(...zs);
const cx = (x0 + x1) / 2;

// Outward facing directions of a footprint cell (empty list = interior).
function outsOf(x, z) {
  const o = [];
  if (!has(x, z - 1)) o.push({ dx: 0, dz: -1, facing: "north" });
  if (!has(x, z + 1)) o.push({ dx: 0, dz: 1, facing: "south" });
  if (!has(x - 1, z)) o.push({ dx: -1, dz: 0, facing: "west" });
  if (!has(x + 1, z)) o.push({ dx: 1, dz: 0, facing: "east" });
  return o;
}

const plan = new Map();
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  plan.set(`${x},${y},${z}`, { b, p });
};
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

// Pass 1: foundation, plinth, floors, walls, pilasters, windows, cornice, parapet.
for (const [x, z] of cellsRaw.map((c) => [c[0], c[1]])) {
  const g0 = gAt(x, z);
  const outs = outsOf(x, z);
  const per = outs.length > 0;

  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");
  put(x, g0, z, per ? "polished_andesite" : "smooth_stone");

  if (!per) {
    // Interior: floor slabs and the roof deck, air between.
    if (5 > g0) put(x, 5, z, "smooth_stone");
    put(x, 10, z, "smooth_stone");
    continue;
  }

  const pillar = outs.length >= 2 || (outs[0].dx !== 0 ? (z - z0) % 3 === 0 : (x - x0) % 3 === 0);

  for (let y = g0 + 1; y <= 11; y++) {
    let b;
    if (y === 11) b = pillar ? "light_gray_concrete" : "white_concrete";      // parapet
    else if (y === 10) b = "gray_concrete";                                     // cornice
    else if (y === 5) b = "light_gray_concrete";                                // string course
    else if (pillar) b = "light_gray_concrete";                                 // pilasters
    else if ((y >= g0 + 1 && y <= 3) || y === 7 || y === 8) b = "glass_pane";   // windows
    else if (y === 4 || y === 6 || y === 9) b = "gray_concrete";                // frames
    else b = "white_concrete";
    put(x, y, z, b);
  }
}

// Pass 2: entrance on the south facade, nearest the middle of the frontage.
let candidates = [];
for (const [x, z] of cellsRaw.map((c) => [c[0], c[1]])) {
  const outs = outsOf(x, z);
  if (outs.length === 1 && outs[0].dz === 1) candidates.push({ x, z, o: outs[0] });
}
if (candidates.length === 0) {
  for (const [x, z] of cellsRaw.map((c) => [c[0], c[1]])) {
    const outs = outsOf(x, z);
    if (outs.length) candidates.push({ x, z, o: outs[0] });
  }
}
candidates.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
const door = candidates[0];

if (door) {
  const g0 = gAt(door.x, door.z);
  const doorProps = (half) => ({
    facing: door.o.facing, half, hinge: "left", open: "false", powered: "false",
  });
  put(door.x, g0 + 1, door.z, "oak_door", doorProps("lower"));
  put(door.x, g0 + 2, door.z, "oak_door", doorProps("upper"));

  // Red fascia over the entrance, spanning the door cell and its wall neighbours.
  for (const [x, z] of cellsRaw.map((c) => [c[0], c[1]])) {
    const outs = outsOf(x, z);
    if (!outs.length) continue;
    if (outs[0].facing !== door.o.facing) continue;
    if (Math.abs(x - door.x) + Math.abs(z - door.z) <= 1) {
      put(x, g0 + 3, z, "red_terracotta");
    }
  }
}

// Pass 3: glass pane connections, based on neighbouring panes in the plan.
for (const [key, e] of plan) {
  if (e.b !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const is = (dx, dz) => at(x + dx, y, z + dz)?.b === "glass_pane";
  e.p = {
    north: String(is(0, -1)),
    south: String(is(0, 1)),
    east: String(is(1, 0)),
    west: String(is(-1, 0)),
    waterlogged: "false",
  };
}

// Pass 4: warm lights behind some windows (inside the air gap).
for (const [x, z] of cellsRaw.map((c) => [c[0], c[1]])) {
  const outs = outsOf(x, z);
  if (outs.length !== 1) continue;
  const g0 = gAt(x, z);
  const o = outs[0];
  const ix = x - o.dx, iz = z - o.dz;
  if (!has(ix, iz) || outsOf(ix, iz).length) continue;
  if (door && x === door.x && z === door.z) continue;
  if (at(x, 7, z)?.b !== "glass_pane") continue;
  if ((x + z) % 4 === 0) put(ix, 7, iz, "glowstone");
  if (g0 <= 1 && (x + z) % 5 === 0 && at(x, 2, z)?.b === "glass_pane") put(ix, 2, iz, "glowstone");
}

// Pass 5: roof plant and a lightning rod on the deck (interior cells only).
const interior = cellsRaw.map((c) => [c[0], c[1]]).filter(([x, z]) => outsOf(x, z).length === 0);
for (const [x, z] of interior) {
  if (x % 4 === 1 && z % 4 === 1) put(x, 11, z, "light_gray_concrete");
}
if (interior.length) {
  let best = interior[0], bd = Infinity;
  for (const [x, z] of interior) {
    const d = Math.abs(x - (x0 + x1) / 2) + Math.abs(z - (z0 + z1) / 2);
    if (d < bd) { bd = d; best = [x, z]; }
  }
  const rodProps = { facing: "up", powered: "false", waterlogged: "false" };
  put(best[0], 11, best[1], "lightning_rod", rodProps);
  put(best[0], 12, best[1], "lightning_rod", rodProps);
}

// Write the plan into the voxel volume.
const g = new Voxels([W, H, D]);
for (const [key, e] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  if (e.p) g.set(x, y, z, e.b, e.p);
  else g.set(x, y, z, e.b);
}
g.save(`${base}/${id}.nbt`);
