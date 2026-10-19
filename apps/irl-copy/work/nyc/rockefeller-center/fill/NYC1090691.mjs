// 12 East 48th Street, 2017 commercial and office building: a 14 x 52 footprint (an L: a wide north block over the full
// width, a narrower south wing on the east half). Lidar roof tops are median-smoothed over the 3 x 3 around each cell and
// snapped to 3-block storeys, so the massing is clean tiers (podium 3, low wings 6-9, the mid-block 15-21 and the
// stepped core at 27). Street side is the north edge (low z, the 48th Street frontage): a granite plinth, a limestone
// band and shopfronts on the ground floor, with an entrance and a flush canopy. Above that, a glass curtain wall in
// light-blue glass on grey spandrels and light-grey mullions, with a cornice on each roof edge. Glass sits one block out
// from a solid core, with air one block behind it and a floor slab at each storey line (no interiors). Warm glowstone
// sits behind some panes. A plant box stands on the highest tier. Cells with lidar roof 0 are open ground (a court).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1090691.cells.json`, "utf8"));
const X = 14, Y = 33, Z = 52;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
const ground = (x, z) => cell.get(`${x},${z}`).ground;

// Roof tops: the median of the built lidar cells around each cell, snapped to whole storeys (3 blocks), at least 3.
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const topMap = new Map();
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (lidar(x, z) === 0) continue;
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = lidar(x + dx, z + dz); if (r > 0) near.push(r); }
  topMap.set(key, Math.max(3, Math.round(median(near) / 3) * 3));
}
const roofAt = (x, z) => topMap.get(`${x},${z}`) ?? 0;

// Outward faces: N = low z (the 48th Street frontage), S = rear, W/E = the side walls. [dx, dz] points out of the building.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, y, z, [dx, dz]) => { const nx = x + dx, nz = z + dz; return !inFoot(nx, nz) || roofAt(nx, nz) <= y; };
const faceOf = (x, y, z) => Object.keys(DIRS).find((d) => exposed(x, y, z, DIRS[d])) ?? null;

const g = new Voxels([X, Y, Z]);
const glass = [];   // [x, y, z, dx, dz] of every glass pane, so its air gap and lamp can be set after the walls

// 1. Solid mass. Foundation from y 0 up to each cell's ground, the core to the roof, a roof covering on each top, paving
// on the open court. Every cell stands on the one below it.
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  const G = ground(x, z), T = roofAt(x, z);
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  if (!T) { g.set(x, G, z, "smooth_stone"); continue; }
  for (let y = G; y < T; y++) g.set(x, y, z, y === T - 1 ? "smooth_stone" : "light_gray_concrete");
}

// 2. Faces. Row by row on the outer ring: a cornice on each roof edge, a granite plinth at the ground, a limestone band
// at y 3, shopfront glass at y 1-2 on the ground floor, then curtain wall: light-grey spandrels on each storey line, glass in
// the bays between, dark-grey mullions every third block along the face.
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  const G = ground(x, z), T = roofAt(x, z);
  for (let y = G; y < T; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;               // position along the face
    const bay = u % 3 !== 0;
    if (y === T - 1) { g.set(x, y, z, "calcite"); continue; }
    if (y === G) { g.set(x, y, z, "polished_granite"); continue; }
    if (y === 3) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (!bay) { g.set(x, y, z, "gray_concrete"); continue; }
    g.set(x, y, z, "light_blue_stained_glass");
    glass.push([x, y, z, dx, dz]);
  }
}

// 3. Air one block behind each pane (no interiors), then a warm lamp in some of those gaps. Floor slabs at each storey
// line are never touched, so every storey is a slab with air above it.
for (const [x, y, z, dx, dz] of glass) {
  const ix = x - dx, iz = z - dz;
  if (!inFoot(ix, iz) || roofAt(ix, iz) <= y || faceOf(ix, y, iz)) continue;
  g.set(ix, y, iz, "air");
  if ((x * 5 + y * 7 + z * 3) % 11 === 0) g.set(ix, y, iz, "glowstone");
}

// 4. Entrance: the lowest built north-edge cell nearest the middle of the frontage, a two-block iron door (facing out:
// south, into the north wall from outside) and a flush canopy over it on the storey line at y 3.
const north = [...cell.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => z === 0 && roofAt(x, z) > 0);
const lowest = Math.min(...north.map(([x]) => roofAt(x, 0)));
const ex = north.filter(([x]) => roofAt(x, 0) === lowest).reduce((best, [x]) => (Math.abs(x - 6) < Math.abs(best - 6) ? x : best), 99);
const eG = ground(ex, 0);
g.set(ex, eG, 0, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, eG + 1, 0, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [ex - 1, ex, ex + 1]) if (inFoot(x, 0) && roofAt(x, 0) > 3) g.set(x, 3, 0, "black_concrete");

// 5. Plant on the highest tier: a 3 x 3 box of light-grey concrete two blocks tall, centred on the top tier's interior.
const top = Math.max(...topMap.values());
const topCells = [...topMap.entries()].filter(([, t]) => t === top).map(([k]) => k.split(",").map(Number));
const cx = Math.round(topCells.reduce((s, [x]) => s + x, 0) / topCells.length);
const cz = Math.round(topCells.reduce((s, [, z]) => s + z, 0) / topCells.length);
for (const [x, z] of topCells) {
  if (Math.abs(x - cx) > 1 || Math.abs(z - cz) > 1) continue;
  g.set(x, top, z, "light_gray_concrete");
  g.set(x, top + 1, z, "light_gray_concrete");
}

g.save(`${DIR}/NYC1090691.nbt`);
