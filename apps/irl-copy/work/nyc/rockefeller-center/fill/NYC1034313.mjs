// 1180 Sixth Avenue, a 1963 commercial and office building: a stepped mid-century office slab. Footprint 56 x 28 (x across
// the streets, low z = north). Lidar roofs are snapped to clean tiers (6, 23, 29, 35, 41, 48, 60, 66, 73 blocks) and smoothed
// by a 3 x 3 majority so each tier is a flat slab. The 73-block tower stands north-east on a 66 wing and a 60 podium; the
// lower wings step down south and east to 48, 41 and 35, with a 23 and a 6 along the north edge. The 6th Avenue frontage is the
// west end (x 0): a recessed entrance with a door, a canopy and a hanging lantern. Facade: a polished-granite base with a
// glazed shopfront storey, then three-block storeys of light-grey piers, dark spandrels and blue glass panes (the low wings use
// stone and punched windows). Glass sits in the outer skin with air behind it and a floor slab in each storey; the rest is
// solid core. Every exposed top edge gets a cornice; roofs are gravel with mechanical penthouses and shrub terraces. Warm
// glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034313.cells.json`, "utf8"));
const X = 56, Y = 85, Z = 28;

// Lidar roof -> tier, then a 3 x 3 majority over the footprint (the centre counts 1.5 so ties keep the lidar).
const TIERS = [[8, 6], [26, 23], [33, 29], [38, 35], [45, 41], [54, 48], [63, 60], [70, 66], [Infinity, 73]];
const tierOf = (r) => (r <= 0 ? 0 : TIERS.find(([max]) => r <= max)[1]);
const raw = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, tierOf(roof)]));
const topMap = new Map();
for (const k of raw.keys()) {
  const [x, z] = k.split(",").map(Number);
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = `${x + dx},${z + dz}`;
    if (!raw.has(n)) continue;
    const t = raw.get(n);
    votes.set(t, (votes.get(t) ?? 0) + (dx === 0 && dz === 0 ? 1.5 : 1));
  }
  topMap.set(k, [...votes].sort((a, b) => b[1] - a[1])[0][0]);
}
const top = (x, z) => topMap.get(`${x},${z}`) ?? 0;     // 0 = open court, or outside the footprint
const built = (x, z) => top(x, z) > 0;
const open = (x, y, z) => top(x, z) <= y;               // outside, open court, or below this column's roof

// Outward faces. W is the 6th Avenue frontage; faces are checked in this order at corners.
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const ORDER = ["W", "E", "N", "S"];
const exposedFace = (x, y, z) => ORDER.find((d) => open(x + DIRS[d][0], y, z + DIRS[d][1])) ?? null;
// Along x (a face on W or E) the pane connects north and south; along z (N or S) it connects east and west.
const paneState = (d) => (d === "W" || d === "E"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 6 === 0;    // deterministic warm windows, about one in six

// Skin layout on a face at position u (along the face) and height y. Piers on even u; windows on odd u between spandrels.
const isPier = (u) => u % 2 === 0;
const isWindow = (u, y) => (y < 3 ? y >= 1 && u % 4 !== 0 && u % 4 !== 3 : y % 3 !== 0 && !isPier(u));
const skinBlock = (u, y, T) => {
  const tower = T >= 60;
  const pier = tower ? "light_gray_concrete" : "smooth_quartz";
  if (y === T - 1) return { id: "smooth_quartz" };                              // cornice
  if (y === 0) return { id: "polished_diorite" };                                // base course
  if (y < 3) return isWindow(u, y) ? { id: "glass_pane", pane: true, shop: true } : { id: "polished_diorite" };
  if (y % 3 === 0) return { id: isPier(u) ? pier : (tower ? "gray_concrete" : "smooth_quartz") };   // storey line
  return isPier(u) ? { id: pier } : { id: "light_blue_stained_glass_pane", pane: true };
};

const g = new Voxels([X, Y, Z]);
const cols = [...topMap.keys()].map((k) => k.split(",").map(Number));

// 1. Solid core to each column's roof, a roof of gravel on top, and paving on the open courts.
for (const [x, z] of cols) {
  const T = top(x, z);
  if (!T) { g.set(x, 0, z, "smooth_stone"); continue; }
  for (let y = 0; y < T; y++) g.set(x, y, z, "stone");
  g.set(x, T - 1, z, "gravel");
}

// 2. Behind each window: air (or a glowstone) inside the skin, so the glass has a room behind it, and a slab per storey.
for (const [x, z] of cols) {
  const T = top(x, z);
  if (!T) continue;
  for (let y = 0; y < T - 1; y++) {
    const d = exposedFace(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx !== 0 ? z : x;
    if (!isWindow(u, y)) continue;
    const ix = x - dx, iz = z - dz;                          // one cell inside the skin
    if (!built(ix, iz)) continue;
    g.set(ix, y, iz, lit(u, y, ORDER.indexOf(d)) ? "glowstone" : "air");
  }
}

// 3. The skin: the outermost cell of every exposed column at every height.
for (const [x, z] of cols) {
  const T = top(x, z);
  if (!T) continue;
  for (let y = 0; y < T; y++) {
    const d = exposedFace(x, y, z);
    if (!d) continue;
    const [dx] = DIRS[d];
    const b = skinBlock(dx !== 0 ? z : x, y, T);
    g.set(x, y, z, b.id, b.pane ? paneState(d) : undefined);
  }
}

// 4. The 6th Avenue entrance: a recess in the west face at z 12-15 (open at y 1-2, paved at y 0), a door at z 13 set in
// glass, a canopy over the recess, and a hanging lantern under the canopy.
const door = { facing: "west", hinge: "left", open: "false", powered: "false" };
for (let z = 12; z <= 15; z++) {
  if (!built(0, z)) continue;
  g.set(0, 0, z, "smooth_stone");                            // recess floor; the recess itself is open above
  g.set(0, 1, z, "air");
  g.set(0, 2, z, "air");
  g.set(1, 0, z, "polished_diorite");
  g.set(1, 1, z, "glass_pane", paneState("W"));              // transom and glazing, the door at z 13
  g.set(1, 2, z, "glass_pane", paneState("W"));
}
g.set(1, 0, 13, "dark_oak_door", { ...door, half: "lower" });
g.set(1, 1, 13, "dark_oak_door", { ...door, half: "upper" });
for (let z = 11; z <= 16; z++) if (built(0, z)) g.set(0, 3, z, "smooth_quartz");   // canopy over the recess
g.set(0, 2, 13, "lantern", { hanging: "true", waterlogged: "false" });

// 5. Roof: mechanical penthouses on the tower and the 66 wing, and shrub terraces on an interior part of the 41 roof.
for (const [x, z] of cols) {
  const T = top(x, z);
  if (T === 73 && x >= 35 && x <= 38 && z >= 5 && z <= 6) for (let y = T; y < T + 3; y++) g.set(x, y, z, "light_gray_concrete");
  if (T === 66 && x >= 12 && x <= 15 && z >= 9 && z <= 10) for (let y = T; y < T + 2; y++) g.set(x, y, z, "stone");
  if (T === 41 && !exposedFace(x, T - 1, z) && x % 4 === 1 && z % 3 === 1) g.set(x, T, z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
}

const info = g.save(`${DIR}/NYC1034313.nbt`);
console.log(`NYC1034313.nbt: ${info.blocks} blocks, ${info.palette} palette entries, tallest ${Math.max(...cols.map(([x, z]) => top(x, z)))} blocks`);
