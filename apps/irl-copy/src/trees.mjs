// TREES FROM A CANOPY HEIGHT MAP: real trees where a raster says there is canopy (e.g. Meta & WRI's 1 m global canopy
// height maps, or a LiDAR CHM), at the heights it says. Treetops are the local maxima of the canopy; every canopy cell
// belongs to its nearest treetop; each crown is voxelised from the map itself (the cell's canopy height is the top of
// the leaves there, a crown depth below it is their bottom), and a trunk runs from the ground up into the crown under
// each treetop. So a row of tall cypresses and a spreading oak come out the shapes the data says.
//
//   canopyTrees(g, { chm, n, ground, open, minHeight, species, scale })
//     chm      Float32Array n*n, canopy height above the ground in blocks (row = z)
//     ground   (x, z) -> y of the ground's top block there
//     open     (x, z) -> may a tree stand / a crown hang here (not a road, a building, water)        (default: all)
//     species  (heightOfTree in metres) -> { log, leaves }   (default: oak; spruce for trees over 18 m)
//     scale    blocks per metre (default 1): minHeight is in metres, crown limits scale with it
//   -> { trees: [{ at:[x,z], height, crown }], leaves, logs }
const DEF = (h) => (h >= 18 ? { log: "spruce_log", leaves: "spruce_leaves" } : { log: "oak_log", leaves: "oak_leaves" });

export function canopyTrees(g, { chm, n, ground, open = () => true, minHeight = 3, species = DEF, scale = 1 } = {}) {
  const H = (x, z) => (x < 0 || z < 0 || x >= n || z >= n ? 0 : chm[z * n + x]), minH = minHeight * scale;
  const b = (m) => Math.max(1, Math.round(m * scale));   // metres -> whole blocks (scale may be fractional)
  const canopy = (x, z) => H(x, z) >= minH && open(x, z);
  // treetops: the highest cell within a radius that grows with the tree (ties go to the first in scan order)
  const tops = [];
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    const h = H(x, z); if (h < minH + b(1) || !canopy(x, z)) continue;
    const r = Math.max(b(2), Math.min(b(5), Math.round(h * 0.15))); let peak = true;
    for (let dz = -r; dz <= r && peak; dz++) for (let dx = -r; dx <= r; dx++) {
      if ((dx || dz) && dx * dx + dz * dz <= r * r) { const o = H(x + dx, z + dz); if (o > h || (o === h && (dz < 0 || (dz === 0 && dx < 0)))) { peak = false; break; } } }
    if (peak) tops.push({ at: [x, z], height: Math.round(h), crown: 0 });
  }
  // every canopy cell to its nearest treetop within reach (a crown no wider than the tree is tall)
  const owner = new Int32Array(n * n).fill(-1), best = new Float32Array(n * n).fill(Infinity);
  tops.forEach((t, k) => { const reach = Math.max(b(3), Math.min(b(9), Math.round(t.height * 0.45)));
    for (let dz = -reach; dz <= reach; dz++) for (let dx = -reach; dx <= reach; dx++) {
      const x = t.at[0] + dx, z = t.at[1] + dz, d = dx * dx + dz * dz; if (d > reach * reach || !canopy(x, z)) continue;
      if (d < best[z * n + x]) { best[z * n + x] = d; owner[z * n + x] = k; } } });
  let leaves = 0, logs = 0;
  const put = (x, y, z, block, state) => { if (y < 0 || y >= g.size[1]) return false; const c = g.get(x, y, z); if (c && !/air$/.test(c.block)) return false; g.set(x, y, z, block, state); return true; };
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    const k = owner[z * n + x]; if (k < 0) continue;
    const t = tops[k], sp = species(t.height / scale), h = Math.round(H(x, z)), depth = Math.max(b(2), Math.round(h * 0.45)), y0 = ground(x, z);
    for (let y = y0 + Math.max(b(2), h - depth) + 1; y <= y0 + h; y++) if (put(x, y, z, sp.leaves, { persistent: "true", distance: "1", waterlogged: "false" })) leaves++;
    t.crown++;
  }
  for (const t of tops) { const [x, z] = t.at, sp = species(t.height / scale), y0 = ground(x, z), top = y0 + Math.max(b(2), t.height - b(1));
    for (let y = y0 + 1; y <= top; y++) { const c = g.get(x, y, z); if (c && /leaves$/.test(c.block)) g.set(x, y, z, sp.log, { axis: "y" }), logs++; else if (put(x, y, z, sp.log, { axis: "y" })) logs++; } }
  return { trees: tops, leaves, logs };
}
