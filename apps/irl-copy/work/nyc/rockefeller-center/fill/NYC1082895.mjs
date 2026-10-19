// 546 Fifth Avenue, 1989 Commercial & Office building: a 24-storey glass-and-stone office tower of the late-1980s
// Midtown type (granite base, tinted blue glass in grey spandrels and stone piers, a stepped crown). Footprint 43 x 27
// (x across the Fifth Avenue frontage at x = 0, low x = west). The lidar roof is quantized into clean setback tiers,
// each on a storey line (y = 0, then 4 + 3k): a 7-block lobby wing, 22, 34, 55, 70 and the 76-block tower with a
// 2-block parapet to 78. Every built cell is a column from y 0 up to its tier, with a floor slab each storey, so every
// tier stands on the one below. Facade cells (exposed to the outside or to a lower roof) carry the skin: a granite
// base, a lobby of storefront glass, spandrels, piers every third cell and glass panes; interior cells are air with
// the slabs, and warm glowstone sits behind some panes. The open court (lidar roof 1-2) is paved at grade.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1082895.cells.json`, "utf8"));
const X = 43, Y = 78, Z = 27;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Lidar roof (block heights above y 0) → clean tiers on storey lines. Under 3 is open court.
const TIERS = [[12, 7], [31, 22], [49, 34], [69, 55], [74, 70]];
const tierOf = (r) => {
  if (r <= 2) return 0;
  const t = TIERS.find(([max]) => r <= max);
  return t ? t[1] : 76;
};
// The north edge (z 0) carries a one-cell-thick lidar fin at 22 for 15 cells; it reads as a stray wall, so it steps
// down to the 7-block lobby wing it is part of. Outside the footprint counts as open ground (top 0), so every outer
// face is exposed from y 0 up.
const topAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  const t = tierOf(cell.get(`${x},${z}`).roof);
  return t === 22 && z === 0 ? 7 : t;
};

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const exposed = (x, y, z) => DIRS.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y).map(([d]) => d);
const isSlab = (y) => y === 0 || (y >= 4 && (y - 4) % 3 === 0);   // floor lines: base, then every third row from 4
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;      // sparse, deterministic warm windows

// A pane runs along the wall: along x on a north or south face, along z on an east or west face.
const pane = (d, u, y) => {
  const glass = (u * 7 + y * 3) % 9 === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
  return d === "N" || d === "S"
    ? [glass, { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }]
    : [glass, { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
};

const g = new Voxels([X, Y, Z]);
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));

// 1. Columns: base course and floors, the glazed skin on exposed faces, and a roof cap on each tier.
for (const [x, z] of cols) {
  const T = topAt(x, z);
  if (!T) { g.set(x, 0, z, "smooth_stone"); continue; }                  // open court: paved at grade
  for (let y = 0; y < T; y++) {
    const f = exposed(x, y, z);
    if (y === T - 1) { g.set(x, y, z, "gray_concrete"); continue; }        // roof covering
    if (y === 0) { g.set(x, y, z, f.length ? "polished_granite" : "stone_bricks"); continue; }   // base course, foundation
    if (isSlab(y)) { g.set(x, y, z, f.length ? "light_gray_concrete" : "smooth_stone"); continue; }   // spandrel or floor slab
    if (!f.length) continue;                                                // interior air behind the skin
    const lobby = y < 4;
    if (f.length >= 2) { g.set(x, y, z, lobby ? "polished_granite" : "smooth_stone"); continue; }   // corner pier
    const d = f[0], u = d === "N" || d === "S" ? x : z;
    if (u % 3 === 0) { g.set(x, y, z, lobby ? "polished_granite" : "smooth_stone"); continue; }    // mullion
    const [block, state] = lobby ? ["light_blue_stained_glass", null] : pane(d, u, y);
    if (lobby) g.set(x, y, z, block);                                       // shopfront glass, full block
    else g.set(x, y, z, block, state);
    // Warm light behind some panes, in the air cell just inside.
    const [, dx, dz] = DIRS.find(([n]) => n === d);
    const ix = x - dx, iz = z - dz, k = DIRS.findIndex(([n]) => n === d);
    if (inFoot(ix, iz) && topAt(ix, iz) > y && !exposed(ix, y, iz).length && lit(u, y, k)) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

// 2. Parapet on the tower's outer edge (to 78), and a stone coping on the other setback edges.
for (const [x, z] of cols) {
  const T = topAt(x, z);
  if (!T) continue;
  const edge = DIRS.some(([, dx, dz]) => topAt(x + dx, z + dz) < T);
  if (!edge) continue;
  if (T === 76) { g.set(x, 76, z, "smooth_stone"); g.set(x, 77, z, "smooth_stone"); }
  else g.set(x, T, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 3. Roof plant on the tower crown: two rooftop units standing on the cap.
for (const [x, z] of [[5, 13], [6, 13], [5, 14], [6, 14], [10, 12]]) g.set(x, 76, z, "iron_block");

// 4. Main entrance on the Fifth Avenue face (x = 0), a recessed bay at z 9..13: storefront glass either side, a
// double door at z 11, a granite fascia over the bay and a hanging lantern in the lobby.
for (let z = 9; z <= 13; z++) g.set(0, 4, z, "polished_granite");
g.set(0, 1, 10, "light_blue_stained_glass"); g.set(0, 2, 10, "light_blue_stained_glass"); g.set(0, 3, 10, "light_blue_stained_glass");
g.set(0, 1, 12, "light_blue_stained_glass"); g.set(0, 2, 12, "light_blue_stained_glass"); g.set(0, 3, 12, "light_blue_stained_glass");
g.set(0, 3, 11, "light_blue_stained_glass");
g.set(0, 1, 11, "iron_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(0, 2, 11, "iron_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(1, 3, 11, "lantern", { hanging: "true", waterlogged: "false" });

const counts = g.save(`${DIR}/NYC1082895.nbt`);
console.log(JSON.stringify(counts));
