// 1568A Broadway (NYC1085493): Double Tree Guest Suites, a 1989 commercial and office tower (NYC interior landmark record).
// Massing from the lidar, read as clean tiers: a 10 x 16 tower on the west (124 blocks, with a 132 core in its middle),
// a 14-storey east podium (43), a 10-storey north wing (31) and a two-storey lobby pavilion at the NE corner (7). The
// south-west ground is a block lower, so its storeys start a block lower. Broadway is the west face: a shopfront and a
// recessed hotel entrance under a dark soffit. Blue-tinted glass in grey mullions on light spandrels, polished granite
// base courses, glass one block out from a solid core with air behind (floor slabs at each spandrel), warm glowstone in
// some windows, cornices and parapets, and a mechanical box with a lightning rod on the tower's crown.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1085493.cells.json`, "utf8"));
const X = 14, Y = 144, Z = 24;

const NEI = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N (low z), S, W (low x, Broadway), E
const NS_PANE = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW_PANE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const k3 = (x, y, z) => `${x},${y},${z}`;
const key2 = (x, z) => `${x},${z}`;

// 1. Roof per cell: a missing lidar return (0) takes the median of its built neighbours.
const lidar = new Map(cells.map(([x, z, ground, roof]) => [key2(x, z), { x, z, ground, roof }]));
const roofOf = (x, z) => {
  const c = lidar.get(key2(x, z));
  if (c.roof > 0) return c.roof;
  const nb = NEI.map(([dx, dz]) => lidar.get(key2(x + dx, z + dz))).filter((n) => n && n.roof > 0).map((n) => n.roof).sort((a, b) => a - b);
  return nb.length ? nb[nb.length >> 1] : 0;
};

// 2. Tiers (block tops): tower 124 with a 132 core, podium 43, north wing 31, NE lobby 7.
const info = new Map();
for (const c of lidar.values()) {
  const { x, z, ground } = c, rf = roofOf(x, z);
  if (rf === 0) continue;
  let T;
  if (rf >= 100) T = x >= 2 && x <= 7 && z >= 11 && z <= 20 ? 132 : 124;
  else if (z >= 9 && x >= 9) T = 43;
  else if (rf < 12 && x >= 12 && z <= 1) T = 7;
  else T = 31;
  info.set(key2(x, z), { x, z, G: ground, T });
}
const topOf = (x, z) => info.get(key2(x, z))?.T ?? -1;
const solid = (x, y, z) => y < topOf(x, z);   // footprint cells below their top; outside the footprint is -1, so open

// 3. Depth from the outside at each height: 1 = skin, 2 = the air gap behind glass, 3+ = solid core.
const depth = new Map();
for (let y = 0; y < 133; y++) {
  const dist = new Map(), q = [];
  for (const c of info.values()) {
    if (!solid(c.x, y, c.z)) continue;
    if (NEI.some(([dx, dz]) => !solid(c.x + dx, y, c.z + dz))) { dist.set(key2(c.x, c.z), 1); q.push(c); }
  }
  for (let i = 0; i < q.length; i++) {
    const c = q[i], dc = dist.get(key2(c.x, c.z));
    for (const [dx, dz] of NEI) {
      const n = info.get(key2(c.x + dx, c.z + dz));
      if (!n || dist.has(key2(n.x, n.z)) || !solid(n.x, y, n.z)) continue;
      dist.set(key2(n.x, n.z), dc + 1); q.push(n);
    }
  }
  for (const c of info.values()) if (dist.has(key2(c.x, c.z))) depth.set(k3(c.x, y, c.z), dist.get(key2(c.x, c.z)));
}

// 4. Skin: storeys of 3 blocks from each cell's ground (spandrel, then two window rows).
const skin = (c, y, out) => {
  const rel = y - c.G, k = Math.floor(rel / 3), r = rel % 3;
  const west = out.some(([dx]) => dx < 0), north = out.some(([, dz]) => dz < 0);
  const xFace = out.some(([dx]) => dx !== 0), zFace = out.some(([, dz]) => dz !== 0);
  const corner = xFace && zFace, street = west || north, u = xFace ? c.z : c.x;
  if (r === 0) {
    if (k === 0) return { b: "polished_andesite" };                                       // base course
    if (k === 1 && west && c.z >= 13 && c.z <= 15) return { b: "black_concrete" };       // dark soffit over the entrance
    return { b: "light_gray_concrete" };                                                 // spandrel and floor line
  }
  if (k === 0 && west && c.z === 14 && !corner)                                          // hotel entrance: iron door, two high
    return { b: "iron_door", s: { facing: "east", half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  if (k === 0 && !street) return { b: "polished_andesite" };
  if (corner || u % 3 === 0) return { b: k === 0 ? "polished_andesite" : "gray_concrete" };   // mullions, frames
  return {
    b: k === 0 ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane",
    s: zFace ? NS_PANE : EW_PANE, pane: true,
    lit: k > 0 && (u * 5 + k * 7 + r * 3) % 11 === 0,                                    // warm glow in some windows
  };
};

const specs = new Map();
const put = (x, y, z, spec) => specs.set(k3(x, y, z), spec);
for (const c of info.values()) for (let y = c.G; y < c.T; y++) {
  const d = depth.get(k3(c.x, y, c.z)) ?? Infinity;
  if (y === c.T - 1) { put(c.x, y, c.z, d === 1 ? { b: "smooth_stone" } : { b: "gray_concrete" }); continue; }   // cornice, roof
  if (d !== 1) continue;
  const out = NEI.filter(([dx, dz]) => !solid(c.x + dx, y, c.z + dz));
  put(c.x, y, c.z, skin(c, y, out));
}

// 5. The air gap behind each pane is air (or glowstone behind a lit pane); elsewhere the gap is solid (slabs, spandrels).
for (const c of info.values()) for (let y = c.G; y < c.T - 1; y++) {
  if (depth.get(k3(c.x, y, c.z)) !== 2) continue;
  const rel = y - c.G, r = rel % 3, k = Math.floor(rel / 3);
  if (c.x === 1 && c.z === 14 && k === 0 && r > 0) { put(c.x, y, c.z, { b: "air" }); continue; }   // entrance vestibule
  const pane = NEI.map(([dx, dz]) => specs.get(k3(c.x + dx, y, c.z + dz))).find((s) => s?.pane);
  put(c.x, y, c.z, r > 0 && pane ? (pane.lit ? { b: "glowstone" } : { b: "air" }) : { b: "light_gray_concrete" });
}

// 6. Parapets on the exposed roof edges, then rooftop equipment.
for (const c of info.values()) {
  if (NEI.some(([dx, dz]) => !solid(c.x + dx, c.T - 1, c.z + dz))) put(c.x, c.T, c.z, { b: "smooth_stone" });
}

// 7. Write it: foundation below each cell's ground, the specs above it, solid core where nothing else is specified.
const g = new Voxels([X, Y, Z]);
for (const c of info.values()) {
  for (let y = 0; y < c.G; y++) g.set(c.x, y, c.z, "stone_bricks");
  for (let y = c.G; y < c.T; y++) {
    const s = specs.get(k3(c.x, y, c.z)) ?? { b: "light_gray_concrete" };
    g.set(c.x, y, c.z, s.b, s.s);
  }
  if (specs.has(k3(c.x, c.T, c.z))) { const s = specs.get(k3(c.x, c.T, c.z)); g.set(c.x, c.T, c.z, s.b, s.s); }
}
// Mechanical box on the 132 core, a lightning rod on its roof, and two units on the podium terrace.
for (let x = 3; x <= 6; x++) for (let z = 13; z <= 18; z++) {
  g.set(x, 132, z, "light_gray_concrete"); g.set(x, 133, z, "light_gray_concrete"); g.set(x, 134, z, "gray_concrete");
}
g.set(4, 135, 15, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
for (const [x, z] of [[11, 12], [12, 19]]) g.set(x, 43, z, "iron_block");

const out = g.save(`${DIR}/NYC1085493.nbt`);
console.log(`NYC1085493.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
