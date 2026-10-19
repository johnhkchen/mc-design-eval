// 17 West 52nd Street, a 1930 mixed residential and commercial block: a 7-storey buff-masonry block (about 23 blocks, 25 m)
// on the lidar footprint, with a one-storey shop wing along the 52nd Street frontage (the low z edge, north) and a
// recessed entrance with a dark canopy in the tall part. The lidar roof is smoothed (3x3 median) and cut into whole
// 3-block storeys, so the massing steps down in clean tiers. Each cell stands on y 0, a base course; every storey has a
// floor slab and a 2-block window band, with an air gap behind the glass; nothing is left floating. Piers every 3
// blocks, storey bands, a cornice and a parapet. Shopfronts on the ground floor of the street face, warm glowstone
// behind some windows, roof units on the tallest tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034519.cells.json`, "utf8"));
const X = 21, Y = 35, Z = 28;
const STOREY = 3;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Storeys per cell: the 3x3 median of the lidar roof over the footprint, cut into whole storeys (at least one).
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const lidarMed = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) v.push(cell.get(`${x + dx},${z + dz}`).roof);
  return median(v);
};
const cut = new Map();
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  cut.set(key, Math.max(1, Math.floor(lidarMed(x, z) / STOREY)));
}
// A second median over the storey counts drops single-cell spikes (lidar hits on a rooftop unit read as a pillar).
const storeys = new Map();
for (const key of cut.keys()) {
  const [x, z] = key.split(",").map(Number);
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (cut.has(`${x + dx},${z + dz}`)) v.push(cut.get(`${x + dx},${z + dz}`));
  storeys.set(key, median(v));
}

// h = the roof slab row (solid 0..h); -1 outside the footprint.
const h = (x, z) => (inFoot(x, z) ? STOREY * storeys.get(`${x},${z}`) : -1);
// Outward faces, street (N, low z) first; faces that look out of the footprint come before those that look at a neighbour.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ORDER = ["N", "S", "W", "E"];
const outside = (x, z, d) => { const [dx, dz] = DIRS[d]; return !inFoot(x + dx, z + dz); };
const exposedAt = (x, z, d, y) => { const [dx, dz] = DIRS[d]; return y > h(x + dx, z + dz); };
const wall = (x, z) => inFoot(x, z) && ORDER.some((d) => {
  const [dx, dz] = DIRS[d];
  return h(x + dx, z + dz) < h(x, z);
});
const facade = (x, z, y) => {
  const dirs = ORDER.filter((d) => exposedAt(x, z, d, y));
  return dirs.find((d) => outside(x, z, d)) ?? dirs[0] ?? null;
};
const paneState = (d) => (d === "N" || d === "S"
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" });

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => { if (inFoot(x, z) && y >= 0 && y < Y) g.set(x, y, z, block, state); };

// 1) Walls: the outer ring and every cell that steps down beside a taller one.
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!wall(x, z)) continue;
  const top = h(x, z);
  for (let y = 0; y <= top; y++) {
    const r = y % STOREY;
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y === top) { g.set(x, y, z, "chiseled_sandstone"); continue; }
    if (r === 0) { g.set(x, y, z, "chiseled_sandstone"); continue; }
    const d = facade(x, z, y);
    if (!d) { g.set(x, y, z, "smooth_sandstone"); continue; }
    const idx = d === "N" || d === "S" ? x : z;
    const pier = idx % 3 === 0;
    if (y < STOREY) {                                  // ground floor: shopfront on the street, piers in polished granite
      if (pier || d !== "N") g.set(x, y, z, pier ? "polished_granite" : "smooth_sandstone");
      else g.set(x, y, z, "light_blue_stained_glass");
      continue;
    }
    if (pier) g.set(x, y, z, "smooth_sandstone");
    else g.set(x, y, z, "light_blue_stained_glass_pane", paneState(d));
  }
  if (outside(x, z, "N") || outside(x, z, "S") || outside(x, z, "W") || outside(x, z, "E")) {
    put(x, top + 1, z, "smooth_sandstone");           // parapet on the outer edge
  }
}

// 2) Interiors: floor slabs per storey, the roof deck, and air in between (no rooms).
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (wall(x, z)) continue;
  const top = h(x, z);
  for (let y = 0; y <= top; y++) {
    if (y === top) g.set(x, y, z, "stone");
    else if (y % STOREY === 0) g.set(x, y, z, "smooth_stone");
  }
}

// 3) Warm light: glowstone in the air behind some lower-row windows (on the slab, so it stands).
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!wall(x, z)) continue;
  for (let y = STOREY; y < h(x, z); y++) {
    if (y % STOREY !== 1) continue;
    const d = facade(x, z, y);
    if (!d || (d === "N" && y < STOREY)) continue;
    const idx = d === "N" || d === "S" ? x : z;
    if (idx % 3 === 0 || (idx + 2 * y) % 7 !== 1) continue;
    const [dx, dz] = DIRS[d];
    const ix = x - dx, iz = z - dz;
    if (inFoot(ix, iz) && !wall(ix, iz)) g.set(ix, y, iz, "glowstone");
  }
}

// 4) Entrance: a recessed bay in the tall part of the street front (x 2..4), a steel-and-glass door, dark canopy.
const cx = 3;
for (const x of [cx - 1, cx, cx + 1]) for (const y of [1, 2]) g.set(x, y, 0, "air");
g.set(cx, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(cx, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(cx - 1, 1, 0, "glowstone");
g.set(cx + 1, 1, 0, "glowstone");
for (const x of [cx - 1, cx, cx + 1]) for (const z of [0, 1]) put(x, STOREY, z, "black_concrete");

// 5) Roof units on the tallest interior tier, scattered so they read as plant rather than a wall.
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (wall(x, z) || storeys.get(key) < 7) continue;
  if ((x * 3 + z * 5) % 11 === 0) put(x, h(x, z) + 1, z, "iron_block");
}

const { blocks, palette } = g.save(`${DIR}/NYC1034519.nbt`);
console.log(`NYC1034519.nbt: ${blocks} blocks, ${palette} palette entries`);
