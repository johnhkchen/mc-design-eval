import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738259";
const W = 17, H = 33, D = 24;
const ROOF = 21;      // roof slab level (about 21 above lowest ground)
const PARAPET = 22;   // parapet course and cap above roof

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => Math.round(c[2])));

const G = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of raw) G.set(key(x, z), Math.round(gr) - minG);

const inF = (x, z) => G.has(key(x, z));
const gr = (x, z) => G.get(key(x, z));

// exterior faces of a footprint cell
function exterior(x, z) {
  return { n: !inF(x, z - 1), s: !inF(x, z + 1), w: !inF(x - 1, z), e: !inF(x + 1, z) };
}

// 'interior' | 'corner' | 'wallX' (runs along x, faces n/s) | 'wallZ' (runs along z, faces e/w)
function kind(x, z) {
  if (!inF(x, z)) return "none";
  const ex = exterior(x, z);
  const anyEx = ex.n || ex.s || ex.w || ex.e;
  if (!anyEx) return "interior";
  if ((ex.n || ex.s) && (ex.w || ex.e)) return "corner";
  if (ex.n || ex.s) return "wallX";
  return "wallZ";
}

function outwardFacing(x, z) {
  const ex = exterior(x, z);
  if (ex.n) return "north";
  if (ex.s) return "south";
  if (ex.w) return "west";
  return "east";
}

const g = new Voxels([W, H, D]);

// ---- main massing, foundations, facade ----
for (const [k, v] of G) {
  const [x, z] = k.split(",").map(Number);
  const base = v;
  const kd = kind(x, z);
  const ex = exterior(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  // body up to the roof
  for (let y = base; y < ROOF; y++) {
    const s = Math.floor(y / 5);
    const r = y % 5;

    // storey floor slabs / band courses (all cells)
    if (r === 0) {
      if (kd !== "interior" && y === base) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (kd === "interior" || kd === "none") continue; // air gap, no interiors

    if (kd === "corner") { g.set(x, y, z, "light_gray_concrete"); continue; }

    const t = kd === "wallX" ? x : z;
    if (r === 4) { g.set(x, y, z, "white_concrete"); continue; } // spandrel

    // r = 1..3: window zone
    if (s === 0) {
      // shopfront
      g.set(x, y, z, t % 3 === 0 ? "light_gray_concrete" : "glass");
      continue;
    }
    if (t % 3 === 0) {
      g.set(x, y, z, "light_gray_concrete"); // mullion
      continue;
    }
    if (kd === "wallX") {
      g.set(x, y, z, "gray_stained_glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    } else {
      g.set(x, y, z, "gray_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    }
  }

  // roof: cornice on the edge, roof deck inside, parapet on the edge
  if (base <= ROOF) {
    const perim = kd !== "interior";
    g.set(x, ROOF, z, perim ? "light_gray_concrete" : "gray_concrete");
    if (perim) {
      g.set(x, PARAPET, z, "white_concrete");
      g.set(x, PARAPET + 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// ---- entrance: door, lintel canopy, shopfront ----
{
  const cx = (Math.min(...[...G.keys()].map(k => +k.split(",")[0])) + Math.max(...[...G.keys()].map(k => +k.split(",")[0]))) / 2;
  let best = null;
  for (const k of G.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (kind(x, z) !== "wallX") continue;
    const ex = exterior(x, z);
    if (!ex.n) continue;
    const d = Math.abs(x - cx);
    if (!best || d < best.d) best = { x, z, d };
  }
  if (!best) {
    for (const k of G.keys()) {
      const [x, z] = k.split(",").map(Number);
      if (kind(x, z) === "wallX") { best = { x, z, d: 0 }; break; }
    }
  }
  if (best) {
    const { x, z } = best;
    const b = gr(x, z);
    const facing = outwardFacing(x, z);
    g.set(x, b, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, b + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    // canopy-like lintel over the entrance, spanning neighbouring wall cells
    for (const dx of [-1, 0, 1]) {
      const nx = x + dx;
      if (inF(nx, z) && kind(nx, z) === "wallX") g.set(nx, b + 2, z, "light_gray_concrete");
    }
  }
}

// ---- warm light behind some windows (glowstone inside, on the inner side) ----
for (const [k, v] of G) {
  const [x, z] = k.split(",").map(Number);
  const kd = kind(x, z);
  if (kd !== "wallX" && kd !== "wallZ") continue;
  const ex = exterior(x, z);
  let ix = x, iz = z;
  if (kd === "wallX") iz = ex.n ? z + 1 : z - 1;
  else ix = ex.w ? x + 1 : x - 1;
  if (!inF(ix, iz) || kind(ix, iz) !== "interior") continue;
  const t = kd === "wallX" ? x : z;
  for (let s = 1; s <= 3; s++) {
    if ((t + s) % 4 !== 0) continue;
    const y = s * 5 + 2;
    if (y < gr(ix, iz) || y >= ROOF) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// ---- rooftop penthouse and mast ----
{
  const cells = [...G.keys()].map(k => k.split(",").map(Number));
  const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
  const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
  const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
  const interior = cells.filter(([x, z]) => kind(x, z) === "interior");
  const pen = interior.filter(([x, z]) => Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 4);
  for (const [x, z] of pen) {
    g.set(x, 22, z, "smooth_stone");
    g.set(x, 23, z, "smooth_stone");
    g.set(x, 24, z, "gray_concrete");
  }
  if (interior.length) {
    let mast = interior[0], md = Infinity;
    for (const [x, z] of interior) {
      const d = Math.abs(x - cx) + Math.abs(z - cz);
      if (d < md) { md = d; mast = [x, z]; }
    }
    const [mx, mz] = mast;
    for (let y = 25; y <= 31; y++) {
      g.set(mx, y, mz, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    }
    g.set(mx, 32, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
