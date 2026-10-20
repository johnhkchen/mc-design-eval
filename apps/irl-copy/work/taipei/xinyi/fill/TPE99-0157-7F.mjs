import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE99-0157-7F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 47, D = 16;
const g = new Voxels([W, H, D]);

// Built 2010, roof ~35 blocks above lowest ground. Mid-rise Xinyi office/retail block:
// stone plinth, shopfront ground floor, white-piered blue-glass curtain wall with grey
// spandrels, parapet, plant room and mast on the roof.
const TOP = 35;

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const B = Math.max(...cells.map(c => c[2]));          // common podium base
const n = Math.max(1, Math.round((TOP - B) / 5));      // storeys of ~5 blocks
const levels = [];
for (let k = 0; k <= n; k++) levels.push(Math.round(B + k * (TOP - B) / n));

const minX = Math.min(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));

const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];

const perim = cells.map(([x, z, gr]) => ({
  x, z, gr,
  ex: DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz)),
}));
const isInterior = (x, z) => DIRS.every(([, dx, dz]) => has(x + dx, z + dz));

// 1. Foundation: solid from y 0 up to the podium base under every footprint cell.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs across the whole footprint at every storey line and the roof.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (let k = 0; k <= n; k++) {
    const y = levels[k];
    g.set(x, y, z, k === 0 ? "polished_granite" : "light_gray_concrete");
  }
}

// 3. Facade on perimeter cells.
const uOf = (p, d) => (d[2] !== 0 ? p.x - minX : p.z - minZ);
const lit = [];

for (const p of perim) {
  if (p.ex.length === 0) continue;
  const d = p.ex[0];
  const uu = uOf(p, d);
  const pier = uu % 3 === 0;

  for (let y = B; y < TOP; y++) {
    let k = 0;
    while (k < n - 1 && y >= levels[k + 1]) k++;
    if (y === levels[k]) continue; // slab already placed

    if (y === levels[k + 1] - 1) {
      g.set(p.x, y, p.z, "light_gray_concrete"); // spandrel
    } else if (k === 0) {
      g.set(p.x, y, p.z, pier ? "polished_granite" : "glass"); // shopfront
    } else {
      g.set(p.x, y, p.z, pier ? "white_concrete" : "light_blue_stained_glass");
    }

    // warm light behind some glass, only where the cell behind is a true interior cell
    const inZone = y >= levels[k] + 1 && y <= levels[k + 1] - 2;
    if (inZone && !pier && k > 0 && (uu + k + p.x + p.z) % 4 === 0) {
      const ix = p.x - d[1], iz = p.z - d[2];
      if (has(ix, iz) && isInterior(ix, iz)) lit.push([ix, y, iz]);
    }
  }

  // parapet
  g.set(p.x, TOP + 1, p.z, "white_concrete");
}
for (const [x, y, z] of lit) g.set(x, y, z, "glowstone");

// 4. Entrance on the longest street-facing face, dark oak door with a lit hall behind.
const count = {};
for (const p of perim) for (const e of p.ex) count[e[0]] = (count[e[0]] || 0) + 1;
const fname = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
const fdir = DIRS.find(d => d[0] === fname);
const fc = perim
  .filter(p => p.ex.some(e => e[0] === fname))
  .sort((a, b) => uOf(a, fdir) - uOf(b, fdir));
if (fc.length) {
  const ent = fc[Math.floor(fc.length / 2)];
  const base = { facing: fname, hinge: "left", open: "false", powered: "false" };
  g.set(ent.x, levels[0] + 1, ent.z, "dark_oak_door", { ...base, half: "lower" });
  g.set(ent.x, levels[0] + 2, ent.z, "dark_oak_door", { ...base, half: "upper" });
  const ix = ent.x - fdir[1], iz = ent.z - fdir[2];
  if (has(ix, iz) && isInterior(ix, iz)) g.set(ix, levels[0] + 2, iz, "glowstone");
}

// 5. Roof plant room and mast.
const eq = cells.filter(([x, z]) =>
  x >= minX + 5 && x <= minX + 18 && z >= minZ + 4 && z <= minZ + 11);
for (const [x, z] of eq) {
  for (let y = TOP + 1; y <= TOP + 3; y++) g.set(x, y, z, "gray_concrete");
}
if (eq.length) {
  const cx = Math.round(eq.reduce((s, c) => s + c[0], 0) / eq.length);
  const cz = Math.round(eq.reduce((s, c) => s + c[1], 0) / eq.length);
  let best = eq[0];
  for (const c of eq) {
    if (Math.abs(c[0] - cx) + Math.abs(c[1] - cz) < Math.abs(best[0] - cx) + Math.abs(best[1] - cz)) best = c;
  }
  for (let y = TOP + 4; y <= TOP + 7; y++) g.set(best[0], y, best[1], "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
