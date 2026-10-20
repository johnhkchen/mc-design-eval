import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3398406";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 50, H = 34, D = 44;
const g = new Voxels([W, H, D]);

const K = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, gr0, rf0] of cells) {
  info.set(K(x, z), { x, z, gr: Math.round(gr0), rfRaw: Math.round(rf0) });
}

const nbrs = (x, z) => [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];

// smooth lidar roof heights: local mean over a radius, then snap to 2-block storey tiers
for (const c of info.values()) {
  let sum = 0, n = 0;
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    const o = info.get(K(c.x + dx, c.z + dz));
    if (o) { sum += o.rfRaw; n++; }
  }
  const mean = sum / n;
  const rel = mean - c.gr;
  const storeys = Math.max(2, Math.round(rel / 2));
  c.top = Math.min(c.gr + 2 * storeys, H - 3);
  c.top = Math.max(c.top, c.gr + 3);
}

for (const c of info.values()) {
  const ns = nbrs(c.x, c.z);
  const nm = ns.filter(([a, b]) => !info.has(K(a, b))).length;
  c.nm = nm;
  c.per = nm > 0;
  c.corner = nm >= 2;
}
for (const c of info.values()) {
  c.ring = !c.per && nbrs(c.x, c.z).some(([a, b]) => info.get(K(a, b))?.per);
}

function outward(c) {
  if (!info.has(K(c.x, c.z - 1))) return { f: "north", dx: 0, dz: -1 };
  if (!info.has(K(c.x, c.z + 1))) return { f: "south", dx: 0, dz: 1 };
  if (!info.has(K(c.x - 1, c.z))) return { f: "west", dx: -1, dz: 0 };
  if (!info.has(K(c.x + 1, c.z))) return { f: "east", dx: 1, dz: 0 };
  return null;
}

// 1. foundation, walls, slabs, windows, piers, cornice, roof
for (const c of info.values()) {
  const { x, z, gr, top } = c;
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // pier columns every 6 cells along the facade, broken by bay rhythm
  const pier = c.per && (x % 6 === 0 || z % 6 === 0);

  for (let y = gr; y < top; y++) {
    const k = y - gr;
    const last = y === top - 1;
    if (!c.per) {
      if (last || k % 2 === 0) g.set(x, y, z, "smooth_stone");
      else if (c.ring) { /* air gap behind glass */ }
      else g.set(x, y, z, "stone");
    } else {
      if (last) g.set(x, y, z, "stone_bricks");                      // cornice
      else if (c.corner) g.set(x, y, z, "stone_bricks");             // corner piers
      else if (k === 0) g.set(x, y, z, "polished_andesite");         // base course
      else if (pier) g.set(x, y, z, k % 2 === 1 ? "stone_bricks" : "polished_andesite"); // pilasters
      else if (k % 2 === 1) {
        // window band: frame column and glass pane
        const mullion = (x + z) % 4 === 0;
        g.set(x, y, z, mullion ? "white_concrete" : "light_blue_stained_glass");
      } else {
        // brick spandrel with a stone belt course every third storey
        g.set(x, y, z, k % 6 === 2 ? "stone_bricks" : "bricks");
      }
    }
  }
}

// 2. entrances at ground level on the street-facing perimeter, with stone surrounds
for (const c of info.values()) {
  if (!c.per || c.corner) continue;
  if (c.x % 10 !== 5) continue;
  const out = outward(c);
  if (!out) continue;
  const { gr, top, x, z } = c;
  if (gr + 2 >= top) continue;
  // door surround: stone jambs and a lintel above the opening
  for (const [ax, az] of [[x - 1, z], [x + 1, z]]) {
    const side = info.get(K(ax, az));
    if (side && side.per && !side.corner) {
      g.set(ax, gr, az, "stone_bricks");
      g.set(ax, gr + 1, az, "stone_bricks");
    }
  }
  g.set(x, gr + 2, z, "stone_bricks");
  const props = { facing: out.f, hinge: "left", open: "false", powered: "false" };
  g.set(x, gr, z, "dark_oak_door", { ...props, half: "lower" });
  g.set(x, gr + 1, z, "dark_oak_door", { ...props, half: "upper" });
}

// 3. warm lights behind some perimeter windows
for (const c of info.values()) {
  if (!c.per || c.corner) continue;
  const out = outward(c);
  if (!out) continue;
  const { x, z, gr, top } = c;
  for (let y = gr + 1; y < top - 1; y += 2) {
    const k = y - gr;
    if ((x * 5 + z * 3 + k) % 9 !== 0) continue;
    const ix = x - out.dx, iz = z - out.dz;
    const inner = info.get(K(ix, iz));
    if (!inner || inner.per) continue;
    if (y >= inner.top - 1) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// 4. sparse roof plant on the smoothed roof, one stack every 13 cells
for (const c of info.values()) {
  if (c.per) continue;
  if (c.x % 13 !== 6 || c.z % 13 !== 6) continue;
  if (c.top + 2 > H - 1) continue;
  g.set(c.x, c.top, c.z, "light_gray_concrete");
  g.set(c.x, c.top + 1, c.z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
