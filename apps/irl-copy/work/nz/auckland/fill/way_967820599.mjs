// Te Waihorotiu Station: a 1990s-2000s concrete-and-glass transit office block on a basalt plinth, seven storeys
// above the low side of the site. Massing follows the lidar roof (flat near 29, a 31 tier on the rim), snapped to
// storey lines. Facade: polished-basalt base, white-concrete piers on 4-block bays, blue glass with an air gap behind,
// full-width string courses, a stone coping, a recessed entrance and a plant room with an oxidised copper cap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_967820599.cells.json`, "utf8"));

const ROOF_TOPS = [16, 20, 24, 28, 30];   // storey-line roof layers (the top solid layer; the coping sits on it + 1)
const SLABS = new Set([5, 9, 13, 17, 21, 25]);   // full-width floor / string-course layers
const LOWER_TOP = 5;                               // layers under this on the downhill side are the lower storey
const GLASS = "light_blue_stained_glass";
const DIRS = [
  { name: "east", dx: 1, dz: 0 }, { name: "west", dx: -1, dz: 0 },
  { name: "south", dx: 0, dz: 1 }, { name: "north", dx: 0, dz: -1 },
];

// Glazing alternates by bay (blue, cyan, blue-grey), so the curtain wall reads as bays rather than one plane.
const bayGlass = (u) => [GLASS, "cyan_stained_glass", "gray_stained_glass"][Math.floor(u / 4) % 3];

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(key(x, z), { x, z, g: ground, r: roof });
const inFp = (x, z) => fp.has(key(x, z));

// Roof tier: the nearest storey-line roof to the lidar top (the top layer is R - 1), then the most common tier in each
// cell's 3x3 neighbourhood, so the lidar noise becomes flat tiers rather than stray steps.
const nearestTop = (r) => ROOF_TOPS.reduce((best, t) => (Math.abs(t - (r - 1)) < Math.abs(best - (r - 1)) ? t : best));
for (const c of fp.values()) c.t0 = nearestTop(c.r);
for (const c of fp.values()) {
  const count = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = fp.get(key(c.x + dx, c.z + dz)); if (n) count.set(n.t0, (count.get(n.t0) || 0) + 1);
  }
  let best = c.t0, bestN = count.get(c.t0) || 0;
  for (const [t, n] of count) if (n > bestN) { best = t; bestN = n; }
  c.t = best;
}

// Facade: the outward side of a footprint cell that touches the outside (null for core cells).
for (const c of fp.values()) c.n = DIRS.find((d) => !inFp(c.x + d.dx, c.z + d.dz)) ?? null;
const along = (c) => (c.n.dx ? c.z : c.x);    // position along a facade, for bays
const across = (c) => (c.n.dx ? c.x : c.z);

// Entrance: the lowest-ground frontage on the uphill (west / north) side, at the middle of its run.
const fronts = [...fp.values()].filter((c) => c.n && c.g <= 5);
const nw = fronts.filter((c) => c.n.name === "west" || c.n.name === "north");
const pool = nw.length >= 6 ? nw : fronts;
const tally = new Map(); for (const c of pool) tally.set(c.n.name, (tally.get(c.n.name) || 0) + 1);
const faceName = [...tally].sort((a, b) => b[1] - a[1])[0][0];
const face = pool.filter((c) => c.n.name === faceName).sort((a, b) => along(a) - along(b));
const entrance = face[Math.floor(face.length / 2)];
const isEntryBay = (c) => c.n && c.n.name === entrance.n.name &&
  Math.abs(across(c) - across(entrance)) <= 1 && Math.abs(along(c) - along(entrance)) <= 1;

// A deterministic hash for choosing which windows carry a warm light.
const hash = (x, y, z) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
};

const out = new Map();     // "x,y,z" -> [x, y, z, block, state], or null where the cell is air
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, [x, y, z, block, state]);
const air = (x, y, z) => out.set(`${x},${y},${z}`, null);
const glazed = [];         // { c, y, lit } facade openings: an air gap sits behind each one

for (const c of fp.values()) {
  const { x, z, g: gr, t: T, n } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");                   // foundation under the ground
  for (let y = gr; y <= T; y++) {
    let block = "white_concrete";
    let state;
    const u = n ? along(c) : 0;
    const isPier = u % 4 === 0;
    if (y === T || SLABS.has(y)) block = "smooth_stone";                  // roof and storey lines
    else if (n && y < LOWER_TOP) block = y === gr || isPier ? "polished_basalt" : GLASS;
    else if (n) block = isPier ? "white_concrete" : bayGlass(u);

    // The recessed entrance: door on the ground floor, transom above, a stepped canopy over it at the storey line.
    if (n && isEntryBay(c) && y >= 6 && y <= 8) {
      if (c === entrance && y <= 7) {
        block = "iron_door";
        state = { facing: n.name, half: y === 6 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      } else block = GLASS;
    }
    if (n && isEntryBay(c) && y === 10) {
      block = "polished_blackstone_brick_stairs";
      state = { facing: n.name, half: "top", shape: "straight", waterlogged: "false" };
    }
    put(x, y, z, block, state);
    if (n && block.endsWith("_stained_glass")) glazed.push({ c, y, lit: y <= 8 ? 3 : 9 });
    if (c === entrance && y >= 6 && y <= 8) glazed.push({ c, y, lit: 1 });   // vestibule air behind the door, lit
  }
  if (n) put(x, T + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // coping
}

// The air gap behind each glazed opening (one block in, never through a facade or a slab) with a warm light in some.
for (const { c, y, lit } of glazed) {
  const { x, z, n } = c;
  const ix = x - n.dx, iz = z - n.dz;
  if (!inFp(ix, iz) || fp.get(key(ix, iz)).n) continue;
  const inner = fp.get(key(ix, iz));
  if (SLABS.has(y) || y > inner.t - 1) continue;
  air(ix, y, iz);
  const h = hash(x, y, z);
  if (lit && h % lit === 0) put(ix, y, iz, "glowstone");
  else if (y >= 10 && h % 37 === 0) put(ix, y, iz, "shroomlight");
}

// Plant room: a 7 x 5 block on the main roof, walls with copper louvres, an oxidised copper cap.
const mainRoof = (x, z) => fp.has(key(x, z)) && !fp.get(key(x, z)).n && fp.get(key(x, z)).t === 28;
let best = null, bestD = Infinity;
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length, cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
for (const [x0, z0] of cells.map(([x, z]) => [x, z])) {
  let ok = true;
  for (let dx = 0; dx < 7 && ok; dx++) for (let dz = 0; dz < 5 && ok; dz++) ok = mainRoof(x0 + dx, z0 + dz);
  if (!ok) continue;
  const d = Math.hypot(x0 + 3 - cx, z0 + 2 - cz);
  if (d < bestD) { bestD = d; best = [x0, z0]; }
}
if (best) {
  const [x0, z0] = best, T = 28;
  for (let dx = 0; dx < 7; dx++) for (let dz = 0; dz < 5; dz++) {
    const x = x0 + dx, z = z0 + dz;
    for (let y = T + 1; y <= T + 3; y++) put(x, y, z, "light_gray_concrete");
    const edge = dx === 0 || dz === 0 || dx === 6 || dz === 4;
    if (edge && (x + z) % 2 === 0) put(x, T + 2, z, "iron_bars");
    put(x, T + 4, z, "oxidized_cut_copper");
  }
}

const g = new Voxels([50, 44, 51]);
for (const cell of out.values()) if (cell) g.set(cell[0], cell[1], cell[2], cell[3], cell[4]);
const stats = g.save(`${HERE}/way_967820599.nbt`);
console.log(`footprint ${cells.length} cells, entrance ${faceName} face at x ${entrance.x} z ${entrance.z}, plant room ${best ? best.join(",") : "none"}`);
console.log(`saved way_967820599.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries`);
