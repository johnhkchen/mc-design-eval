// Metropolis Museum (way 293020930): a 1930s Art Deco civic building on the Mt Eden slope. Pale reinforced-concrete
// facade on a basalt base (the volcanic stone of the isthmus), quartz floor bands, glass panes between white piers,
// oxidised copper cornices, a stepped massing from the lidar roof (tiers at y 12, 16, 20). Solid below each cell's
// ground, a floor slab per storey, and an air gap behind every glass pane.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020930.cells.json", "utf8"));   // [x, z, ground, roof]
const SIZE = [36, 32, 36];
const k = (x, z) => `${x},${z}`;
const DIRS = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] };

// footprint: ground and lidar roof per cell
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(k(x, z), { g, r });
const inFp = (x, z) => fp.has(k(x, z));

// 1. the lidar roof, median-smoothed over the 3x3 neighbourhood (noise out)
const roof = new Map();
for (const [key, { r }] of fp) {
  const [x, z] = key.split(",").map(Number); const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = fp.get(k(x + dx, z + dz)); if (c) vals.push(c.r); }
  vals.sort((a, b) => a - b); roof.set(key, vals[vals.length >> 1] ?? r);
}

// 2. clean tiers on the storey grid: tower 20, middle 16, low wing 12
const tierOfRoof = (v) => (v >= 18 ? 20 : v >= 14 ? 16 : 12);
const tierRaw = new Map();
for (const [key] of fp) tierRaw.set(key, tierOfRoof(roof.get(key)));
const tier = new Map();
for (const [key] of fp) {   // majority of the 3x3 (own tier wins ties): no single stray cell in a tier
  const [x, z] = key.split(",").map(Number); const n = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const t = tierRaw.get(k(x + dx, z + dz)); if (t) n.set(t, (n.get(t) ?? 0) + (dx || dz ? 1 : 1.5)); }
  const own = tierRaw.get(key); let best = own, bn = n.get(own) ?? 0;
  for (const [t, c] of n) if (c > bn) { best = t; bn = c; }
  tier.set(key, best);
}

// 3. shell cells: on the outline, or standing above a lower neighbour (a setback face)
const shell = new Map();
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number); const T = tier.get(key);
  let s = false;
  for (const [dx, dz] of Object.values(DIRS)) {
    if (!inFp(x + dx, z + dz)) s = true;
    else if (tier.get(k(x + dx, z + dz)) < T) s = true;
  }
  shell.set(key, s);
}

// 4. the entrance: a double door on a street-level (ground 4) outline cell, facing north if it can
let door = null;
{
  let bestScore = Infinity;
  for (const [key, { g }] of fp) {
    if (g !== 4 || !shell.get(key)) continue;
    const [x, z] = key.split(",").map(Number);
    for (const [name, [dx, dz]] of Object.entries(DIRS)) {
      if (inFp(x + dx, z + dz)) continue;   // the outward face
      const [px, pz] = [dz, dx];            // along the face
      for (const s of [1, -1]) {
        const qx = x + px * s, qz = z + pz * s;
        if (!inFp(qx, qz) || fp.get(k(qx, qz)).g !== 4 || inFp(qx + dx, qz + dz)) continue;
        const score = (name === "north" ? 0 : 100) + Math.abs(x - 17) + Math.abs(z - 2) * 0.5;
        if (score < bestScore) { bestScore = score; door = { cells: [[x, z], [qx, qz]], facing: name, hinges: s > 0 ? ["left", "right"] : ["right", "left"] }; }
      }
    }
  }
}
const doorCell = new Map();
if (door) for (const [x, z] of door.cells) doorCell.set(k(x, z), true);

// 5. blocks: key "x,y,z" -> { block, state }
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const isPier = (x, z) => ((x + z) % 3 + 3) % 3 === 0;
const LIT_EVERY = 11;

for (const [key, { g }] of fp) {
  const [x, z] = key.split(",").map(Number); const T = tier.get(key); const sh = shell.get(key);
  for (let y = 0; y < T; y++) {
    if (y < g) { put(x, y, z, "polished_andesite"); continue; }                 // foundation: solid to the ground
    if (g > 0 && y < 4) { put(x, y, z, "polished_andesite"); continue; }        // basalt plinth up to the street storey line
    const f = (y >> 2) << 2, r = y - f, top = y === T - 1;
    if (r === 0) { put(x, y, z, f === 0 || f === 4 ? "polished_andesite" : "smooth_quartz"); continue; }   // floor slab / string course
    if (r === 3) {
      if (top) put(x, y, z, sh ? "waxed_oxidized_cut_copper" : "smooth_stone");   // roof deck, copper cornice on the outline
      else if (sh) put(x, y, z, "white_concrete");                                // spandrel
      continue;                                                                   // interior: air gap
    }
    if (!sh) continue;                                                            // interior: air behind the glass
    if (isPier(x, z)) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane");
  }
}

// lit windows: a warm light set just inside a few panes, glowing through the glass
for (const [key, { g }] of fp) {
  const [x, z] = key.split(",").map(Number); const T = tier.get(key);
  if (!shell.get(key)) continue;
  for (let f = (g > 0 ? 4 : 0); f + 2 < T; f += 4) {
    if (isPier(x, z) || ((x * 5 + z * 7 + f) % LIT_EVERY) !== 0) continue;
    const y = f + 1;
    for (const [dx, dz] of Object.values(DIRS)) {
      const nx = x + dx, nz = z + dz;
      if (!inFp(nx, nz) || shell.get(k(nx, nz))) continue;
      if (B.has(`${nx},${y},${nz}`)) continue;
      put(nx, y, nz, "glowstone"); break;
    }
  }
}

// the entrance bay: doors at street level, a glass transom, a basalt lintel
if (door) {
  for (let i = 0; i < door.cells.length; i++) {
    const [x, z] = door.cells[i];
    const state = (half) => ({ facing: door.facing, half, hinge: door.hinges[i], open: "false", powered: "false" });
    put(x, 4, z, "dark_oak_door", state("lower"));
    put(x, 5, z, "dark_oak_door", state("upper"));
    put(x, 6, z, "light_blue_stained_glass_pane");
    put(x, 7, z, "polished_andesite");
  }
}

// roof plant on the tower tier: a 3x3 room with a lightning rod, standing on the roof deck
{
  const tower = [...fp.keys()].filter((key) => tier.get(key) === 20 && !shell.get(key)).map((key) => key.split(",").map(Number));
  if (tower.length) {
    const cx = tower.reduce((s, [x]) => s + x, 0) / tower.length, cz = tower.reduce((s, [, z]) => s + z, 0) / tower.length;
    let best = null, bd = Infinity;
    for (const [x, z] of tower) { const d = Math.hypot(x - cx, z - cz); if (d < bd) { bd = d; best = [x, z]; } }
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const x = best[0] + dx, z = best[1] + dz;
      if (!inFp(x, z) || tier.get(k(x, z)) !== 20 || shell.get(k(x, z))) continue;
      put(x, 20, z, "light_gray_concrete"); put(x, 21, z, "light_gray_concrete");
    }
    put(best[0], 22, best[1], "lightning_rod", { facing: "up" });
  }
}

// window panes join the piers and each other (the state a placed pane would have)
const solid = (b) => b && b.block !== "light_blue_stained_glass_pane" && b.block !== "dark_oak_door" && b.block !== "glowstone";
for (const [key, v] of B) {
  if (v.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const link = (dx, dz) => { const n = B.get(`${x + dx},${y},${z + dz}`); return n && (n.block === "light_blue_stained_glass_pane" || solid(n)) ? "true" : "false"; };
  v.state = { east: link(1, 0), west: link(-1, 0), north: link(0, -1), south: link(0, 1), waterlogged: "false" };
}

const g = new Voxels(SIZE);
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020930.nbt");
console.log("tiers", Object.fromEntries([12, 16, 20].map((t) => [t, [...tier.values()].filter((v) => v === t).length])), "door", door?.facing ?? "none", stats);
