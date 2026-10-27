// Saint Kevin's Arcade: a 1910s Edwardian commercial block on Queen Street's grid, red brick over a volcanic (andesite)
// plinth, cream plaster string courses and cornice, shopfront glass on the ground storey with an arched dark awning at
// each entrance. The lidar roof sits at 15-17 on the north and west wings (four storeys, deck 16) and 19-22 on the main
// block (five storeys, deck 20, a one-course parapet to 22). The roof is median-smoothed and quantized to those two
// flat tiers, and each tier's walls stand on their own ground: foundation fill from y 0, ground storey from the cell's
// ground, upper storeys on 4-block lines. Interior is air behind the glass, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152417.cells.json", "utf8"));
const W = 37, H = 35, D = 66;
const g = new Voxels([W, H, D]);

const at = new Map();
for (const [x, z, ground, roof] of cells) at.set(`${x},${z}`, { x, z, ground, roof });
const cell = (x, z) => at.get(`${x},${z}`);
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];

// Massing: a 5x5 mean of the lidar roof, then two flat tiers, then a 3x3 majority on the tier so the edges are clean.
const smooth = new Map();
for (const c of at.values()) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const o = cell(c.x + dx, c.z + dz); if (o) { s += o.roof; n++; } }
  c.mean = s / n;
}
for (const c of at.values()) c.wing = c.mean < 18;
for (const c of at.values()) {
  let w = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const o = cell(c.x + dx, c.z + dz); if (o) { w += o.wing ? 1 : 0; n++; } }
  c.tier = w * 2 > n ? "wing" : "main";
  c.deck = c.tier === "wing" ? 16 : 20;
}

// Storey lines are absolute multiples of 4. A cell's ground storey runs from its ground to the next line above it.
const nextLine = (y) => (Math.floor(y / 4) + 1) * 4;

// Shell: a cell is wall when a side faces outside the footprint or a lower tier (a step in the massing).
const faces = (c) => {
  const out = [], seam = [];
  for (const [dx, dz, name] of DIRS) {
    const o = cell(c.x + dx, c.z + dz);
    if (!o) out.push([dx, dz, name]);
    else if (o.deck < c.deck) seam.push([dx, dz, name]);
  }
  return { out, seam };
};
for (const c of at.values()) {
  const f = faces(c);
  c.corner = f.out.length >= 2;
  c.outside = f.out;
  c.faces = f.out.length ? f.out : f.seam;
  c.shell = c.faces.length > 0;
}

const pane = (dx) => (dx === 0
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Entrances: on the two outside faces with the most cells, the window-bay column nearest the middle of the run.
const runs = new Map();
for (const c of at.values()) if (c.outside.length === 1 && !c.corner) {
  const [dx, dz, name] = c.outside[0];
  if (!runs.has(name)) runs.set(name, []);
  runs.get(name).push(c);
}
const entrances = new Set();
for (const [name, list] of [...runs].sort((a, b) => b[1].length - a[1].length).slice(0, 2)) {
  if (list.length < 6) continue;
  const dir = DIRS.find((d) => d[2] === name);
  const along = (c) => (dir[0] === 0 ? c.x : c.z);
  const sorted = list.slice().sort((a, b) => along(a) - along(b));
  const mid = along(sorted[Math.floor(sorted.length / 2)]);
  const bays = sorted.filter((c) => along(c) % 3 === 1);
  const pick = bays.reduce((best, c) => (!best || Math.abs(along(c) - mid) < Math.abs(along(best) - mid) ? c : best), null);
  if (pick) entrances.add(`${pick.x},${pick.z}`);
}

// Blocks. Order: foundation, interior floors and roof deck, then the shell, then the parapet and roof plant.
const put = (x, y, z, block, state) => { if (y >= 0 && y < H) g.set(x, y, z, block, state); };
const lights = [];

for (const c of at.values()) {
  for (let y = 0; y < c.ground; y++) put(c.x, y, c.z, "stone_bricks");
  for (let f = 4; f < c.deck; f += 4) if (f > c.ground) put(c.x, f, c.z, "smooth_stone");
  put(c.x, c.deck, c.z, "smooth_stone");
}

for (const c of at.values()) {
  if (!c.shell) continue;
  const dir = c.faces[0];
  const [dx, dz] = dir;
  const i = dx === 0 ? c.x : c.z;
  const bayPier = i % 3 === 0;
  const nl = nextLine(c.ground);
  const entrance = entrances.has(`${c.x},${c.z}`) && c.outside.length === 1;
  const inner = [c.x - dx, c.z - dz];
  for (let y = c.ground; y < c.deck; y++) {
    let block = null, state;
    if (c.corner) block = "polished_andesite";
    else if (y < nl) {
      if (y === c.ground) block = "polished_andesite";
      else if (entrance && (y === c.ground + 1 || y === c.ground + 2) && c.ground + 2 <= nl - 1) {
        block = "dark_oak_door";
        state = { facing: dir[2], half: y === c.ground + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      } else if (entrance && y === nl - 1 && nl - 1 > c.ground + 2) {
        block = "dark_oak_stairs";
        state = { facing: dir[2], half: "top", shape: "straight", waterlogged: "false" };
      } else if (y === nl - 1) block = "smooth_quartz";
      else if (bayPier) block = "polished_andesite";
      else { block = "glass_pane"; state = pane(dx); }
    } else {
      const r = (y - nl) % 4;
      if (r === 0) block = "smooth_quartz";
      else if (bayPier || r === 3) block = "bricks";
      else { block = "glass_pane"; state = pane(dx); }
    }
    if (block) put(c.x, y, c.z, block, state);
    if (block === "glass_pane" && (y + c.x * 7 + c.z * 5) % 4 === 0) lights.push({ y, ix: inner[0], iz: inner[1] });
  }
  put(c.x, c.deck, c.z, "smooth_quartz");
  if (c.deck === 20) put(c.x, 21, c.z, i % 3 === 0 ? "polished_andesite" : "bricks");
}

// Warm light behind some windows: glowstone in the air gap on the inside of the glass, never on a floor line.
for (const l of lights) {
  const inn = cell(l.ix, l.iz);
  if (!inn || inn.shell) continue;
  if (l.y < inn.ground || l.y >= inn.deck || l.y % 4 === 0) continue;
  if (g.get(l.ix, l.y, l.iz)) continue;
  put(l.ix, l.y, l.iz, "glowstone");
}

// Roof plant on the main block: a stair-and-plant house in the middle of the roof, with a few AC units around it.
const main = [...at.values()].filter((c) => c.tier === "main" && !c.shell);
if (main.length) {
  const cx = main.reduce((s, c) => s + c.x, 0) / main.length, cz = main.reduce((s, c) => s + c.z, 0) / main.length;
  const ok = (x, z) => { const o = cell(x, z); return o && o.tier === "main" && !o.shell && !o.corner; };
  let best = null;
  for (const c of main) {
    let all = true;
    for (let dz = -1; dz <= 1 && all; dz++) for (let dx = -1; dx <= 1 && all; dx++) if (!ok(c.x + dx, c.z + dz)) all = false;
    if (all && (!best || Math.hypot(c.x - cx, c.z - cz) < Math.hypot(best.x - cx, best.z - cz))) best = c;
  }
  if (best) {
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const x = best.x + dx, z = best.z + dz;
      put(x, 21, z, "smooth_quartz"); put(x, 22, z, "smooth_quartz");
      put(x, 23, z, "smooth_stone");
    }
    put(best.x, 21, best.z, "air"); put(best.x, 22, best.z, "air");
  }
  for (const c of main) if (c.x % 7 === 3 && c.z % 7 === 3 && !(best && Math.abs(c.x - best.x) <= 2 && Math.abs(c.z - best.z) <= 2)) put(c.x, 21, c.z, "iron_block");
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152417.nbt");
console.log(JSON.stringify({ cells: at.size, entrances: [...entrances], lights: lights.length, ...stats }));
