// Way 162153891, Mt Eden / Eden Terrace side street: a 1920s-30s stuccoed brick commercial block, three storeys over
// a shopfront, with a stepped Deco parapet. Massing follows the lidar roof: each cell's roof is median-smoothed over its
// 3x3 neighbourhood and snapped to one of three flat tiers above its ground (a 2-storey wing, the 3-storey main block,
// and a 3-storey block with a parapet pavilion). Walls are one block thick; the rest is air with a floor slab per
// storey and a roof deck, so there are no interiors; warm light sits just behind some glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162153891.cells.json`, "utf8"));

const g = new Voxels([34, 27, 22]);

// ---- footprint and massing -------------------------------------------------------------------------------------------
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { x, z, ground, roof, top: 0 });
const cellAt = (x, z) => fp.get(`${x},${z}`);
const inFp = (x, z) => fp.has(`${x},${z}`);

const TIERS = [10, 12, 14];                  // wing, main, pavilion: blocks above each cell's ground
const median = (a) => [...a].sort((p, q) => p - q)[a.length >> 1];
const near = (c) => { const out = []; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cellAt(c.x + dx, c.z + dz); if (n) out.push(n); } return out; };
for (const c of fp.values()) {
  const h = median(near(c).map((n) => n.roof)) - c.ground;
  c.tier = TIERS.reduce((best, t) => (Math.abs(t - h) < Math.abs(best - h) ? t : best));
}
// one tier per tier-step: a cell takes the most common tier in its 3x3 (a lone lidar spike becomes its neighbours' tier)
for (const c of fp.values()) {
  const count = new Map();
  for (const n of near(c)) count.set(n.tier, (count.get(n.tier) ?? 0) + 1);
  const [best, n] = [...count].sort((a, b) => b[1] - a[1])[0];
  c.top = c.ground + (n * 2 > near(c).length ? best : c.tier);
}

// the outward faces of a footprint cell: E/W faces run along z, N/S faces along x
const faces = (x, z) => {
  const f = [];
  if (!inFp(x + 1, z)) f.push("E");
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x, z + 1)) f.push("S");
  if (!inFp(x, z - 1)) f.push("N");
  return f;
};
const alongU = (c, face) => (face === "E" || face === "W" ? c.z : c.x);
const inward = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
const paneState = (face) => (face === "N" || face === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

// ---- the entrance: a window bay on the north face, lowest ground, nearest the middle of that run -------------------------
const northRun = [...fp.values()].filter((c) => { const f = faces(c.x, c.z); return f.length === 1 && f[0] === "N" && alongU(c, "N") % 3 === 2; });
const uMid = median(northRun.map((c) => alongU(c, "N")));
const byMid = (a, b) => Math.abs(alongU(a, "N") - uMid) - Math.abs(alongU(b, "N") - uMid);
const doorCell = [...northRun].filter((c) => c.ground === 0).sort(byMid)[0] ?? [...northRun].sort(byMid)[0];

// ---- the block in each cell at each height ---------------------------------------------------------------------------
const floors = (c) => [c.ground + 4, c.ground + 8];          // storey floor rows (ground storey is 0..3)

// a perimeter cell: facade pattern from the bay index (piers every third block along the face)
function facadeAt(c, face, y) {
  const T = c.top, G = c.ground;
  if (y === G) return { id: "polished_andesite" };                       // plinth course
  if (y === T) return { id: "quartz_slab", state: { type: "bottom", waterlogged: "false" } };   // cap on the parapet
  if (y === T - 1) return { id: "red_terracotta" };                       // parapet band
  if (y > T) return null;
  const u = alongU(c, face);
  const pier = faces(c.x, c.z).length > 1 || u % 3 === 0;
  if (y <= G + 3) {                                                     // shopfront storey
    const door = doorCell && c === doorCell;
    if (y === G + 3) return { id: "dark_oak_planks" };                    // timber fascia
    if (door) return { id: "dark_oak_door", state: { facing: "north", half: y === G + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
    if (pier) return { id: "dark_oak_planks" };
    return { id: "glass" };
  }
  for (const f of floors(c)) {
    if (y === f) return { id: "smooth_quartz" };                        // floor line
    if (y === f + 1 || y === f + 2) return pier ? { id: "quartz_pillar" } : { id: "glass_pane", state: paneState(face) };
    if (y === f + 3) return { id: "red_terracotta" };                    // lintel band
  }
  return { id: "smooth_quartz" };
}

for (const c of fp.values()) {
  const G = c.ground, T = c.top, fs = faces(c.x, c.z);
  // foundation under the cell, up to its ground
  for (let y = 0; y < G; y++) g.set(c.x, y, c.z, "polished_andesite");
  if (fs.length) {
    // perimeter: the facade, column by column from the plinth to the cap
    for (let y = G; y <= T; y++) {
      const b = facadeAt(c, fs[0], y);
      if (b) g.set(c.x, y, c.z, b.id, b.state);
    }
  } else {
    // interior: a floor slab per storey and the roof deck, air between (no rooms)
    for (const y of [G, ...floors(c), T - 1]) if (y < T) g.set(c.x, y, c.z, "stone_bricks");
  }
}

// ---- warm light behind some glass (the cell inside a window, on the floor below it) -------------------------------
for (const c of fp.values()) {
  const fs = faces(c.x, c.z);
  if (fs.length !== 1) continue;                                       // straight walls only
  const face = fs[0], u = alongU(c, face), [dx, dz] = inward[face];
  const inner = cellAt(c.x + dx, c.z + dz);
  if (!inner || faces(inner.x, inner.z).length) continue;               // the cell behind must be open floor
  if (c === doorCell) continue;
  const G = c.ground;
  if (u % 3 === 0) continue;                                            // piers are not glazed
  if (u % 2 === 0 && c.top > G + 2) {                                     // shopfront: shroomlight behind the glass
    g.set(inner.x, G + 1, inner.z, "shroomlight");
  }
  for (const f of floors(c)) {
    if (c.top - 2 >= f + 2 && (u + f) % 4 === 1) g.set(inner.x, f + 1, inner.z, "glowstone");   // upper windows: glowstone
  }
}

// ---- roof plant: a 3x3 stone box on the roof deck, nearest the middle of the highest tier -------------------------
{
  const cx = [...fp.values()].reduce((s, c) => s + c.x, 0) / fp.size;
  const cz = [...fp.values()].reduce((s, c) => s + c.z, 0) / fp.size;
  let best = null;
  for (const c of fp.values()) {
    let ok = true;
    for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) {
      const n = cellAt(c.x + dx, c.z + dz);
      ok = !!n && n.top === c.top && faces(n.x, n.z).length === 0;
    }
    if (!ok) continue;
    const d = Math.hypot(c.x - cx, c.z - cz);
    if (!best || d < best.d) best = { c, d };
  }
  if (best) {
    const { c } = best;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const ring = dx !== 0 || dz !== 0;
      for (let y = c.top; y <= c.top + 1; y++) if (ring) g.set(c.x + dx, y, c.z + dz, "stone_bricks");
      g.set(c.x + dx, c.top + 2, c.z + dz, "stone_bricks");
    }
  }
}

const out = g.save(`${DIR}/way_162153891.nbt`);
console.log(`way_162153891: ${out.blocks} blocks, ${out.palette} palette entries, ${fp.size} footprint cells, tiers ${
  [...new Set([...fp.values()].map((c) => c.top - c.ground))].sort((a, b) => a - b).join("/")} blocks above ground`);
