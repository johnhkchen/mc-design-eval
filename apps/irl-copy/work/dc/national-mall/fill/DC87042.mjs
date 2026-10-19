// DC87042: 122 C St NW, Washington DC 20001, Commercial-Office-Large, as a 1.21.1 module.
// Read as a 1930s-50s stripped-classical office block: a long limestone-clad bar (calcite walls, smooth quartz storey
// lines and cornice, stone-brick base) with a rusticated-looking ground floor of shopfront glass and three street doors
// on the north (z 0) face, a 4-block storey module (3 of window + 1 band), and a two-storey setback penthouse on the
// middle of the roof. The lidar roofs are 3x3-median smoothed and snapped to four tiers: 4 (one storey, the west wing),
// 8 (two), 12 (three, the body) and 14 (the penthouse drum). The lightwell notch cut into the south face (lidar 2) is a
// garden court at height 2. Every storey has a solid floor slab under it and a solid ceiling over it; the interior is
// air behind the glass. Nothing is built outside the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87042.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87042.nbt";

const key = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const ALL = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const court = (c) => c.r <= 3;                                   // lidar 2 in the south notch: the light court
const BODY = [...ALL.values()].filter((c) => !court(c));

// Storey tiers from the lidar: 3x3 median of the body's roofs, snapped to 4, 8, 12 or 14 blocks.
const tier = (h) => (h <= 5 ? 4 : h <= 9 ? 8 : h <= 12 ? 12 : 14);
const TIER = new Map();
for (const c of BODY) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = ALL.get(key(c.x + dx, c.z + dz)); if (n && !court(n)) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  TIER.set(key(c.x, c.z), tier(vals[vals.length >> 1]));
}
const T = (x, z) => TIER.get(key(x, z));                          // undefined outside the body

// Walls: a face is walled from the ground when its neighbour is outside the body or the court, and from the
// neighbour's roof up when the neighbour is a lower tier (the step of a setback).
const faces = (c) => DIRS.flatMap(([dx, dz]) => {
  const nT = T(c.x + dx, c.z + dz);
  if (nT === undefined) return [{ d: [dx, dz], from: 0 }];
  return nT < T(c.x, c.z) ? [{ d: [dx, dz], from: nT }] : [];
});

const DOORS = new Set([8, 20, 29]);                                // street doors on the north (z 0) face
const isStreet = (c, d) => c.z === 0 && d[1] === -1;
const isDoor = (c, d) => isStreet(c, d) && DOORS.has(c.x);
const isPortal = (c, d) => isStreet(c, d) && (DOORS.has(c.x - 1) || DOORS.has(c.x + 1));

// Window bays run along the face (x on north/south faces, z on east/west): a pilaster every 3rd cell, glass between.
const along = (c, d) => (d[0] !== 0 ? c.z : c.x);
const isPilaster = (c, d) => along(c, d) % 3 === 0;
const pane = (d) => (d[0] !== 0 ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// The walled face at row y that decides the block (the first active one), or null for interior.
const faceAt = (c, y) => faces(c).find((f) => f.from <= y) ?? null;
const isWindowRow = (y) => y === 1 || y === 2 || y === 5 || y === 6 || y === 9 || y === 10;

function shellBlock(c, y, d) {
  if (y === 0) return ["stone_bricks"];                            // base course
  if (y <= 2) {                                                    // shopfront / ground storey
    if (isDoor(c, d)) return ["iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    if (isPortal(c, d) || isPilaster(c, d)) return ["calcite"];
    return ["glass_pane", pane(d)];
  }
  if (y === 3) return isDoor(c, d) ? ["lantern", { hanging: "true", waterlogged: "false" }] : ["smooth_quartz"];  // transom band; lamp over each door
  if (y === 4 || y === 7 || y === 8 || y === 11) return ["smooth_quartz"];                                      // storey lines and cornice
  if (y === 5 || y === 6 || y === 9 || y === 10) return isPilaster(c, d) ? ["calcite"] : ["glass_pane", pane(d)];
  return ["calcite"];                                              // 12-13: penthouse wall and parapet
}

const FLOOR = (t, y) => y === 0 || (y === 4 && t >= 8) || (y === 8 && t >= 12) || (y === 12 && t === 14);
const CEIL = (t, y) => (y === 3 && t === 4) || (y === 7 && t === 8) || (y === 11 && t >= 12);

const g = new Voxels([43, 16, 15]);
for (const c of ALL.values()) {
  if (court(c)) { g.set(c.x, 0, c.z, "stone_bricks"); g.set(c.x, 1, c.z, "moss_block"); continue; }
  const t = T(c.x, c.z);
  for (let y = 0; y < t; y++) {
    const f = faceAt(c, y);
    if (f) { const [block, state] = shellBlock(c, y, f.d); g.set(c.x, y, c.z, block, state); }
    else if (FLOOR(t, y)) g.set(c.x, y, c.z, "smooth_stone");
    else if (CEIL(t, y)) g.set(c.x, y, c.z, "gray_concrete");
  }
}

// Roof plant on the body roof and the penthouse terrace (each stands on the roof below it).
for (const c of BODY) {
  if (faces(c).length) continue;
  const t = T(c.x, c.z);
  if (t === 12 && (c.x * 5 + c.z * 7) % 31 === 0) g.set(c.x, 12, c.z, "iron_block");
  if (t === 14 && (c.x * 3 + c.z * 5) % 11 === 0) g.set(c.x, 13, c.z, "iron_block");
}

// Warm light in some windows: a lantern on the ground storey, glowstone above, standing on each storey floor behind the glass.
for (const c of BODY) for (const y of [1, 5, 9]) {
  const f = faceAt(c, y);
  if (!f || !isWindowRow(y) || isPilaster(c, f.d) || isDoor(c, f.d) || isPortal(c, f.d)) continue;
  if ((c.x * 5 + c.z * 11 + y * 7) % 13 !== 0) continue;
  const ix = c.x - f.d[0], iz = c.z - f.d[1];
  if (T(ix, iz) === undefined || g.get(ix, y, iz)) continue;
  g.set(ix, y, iz, y <= 2 ? "lantern" : "glowstone", y <= 2 ? { hanging: "false", waterlogged: "false" } : undefined);
}

// Self-check: a wall or door block must stand on something (horizontal slabs may span the air of a room).
const SPANNING = new Set(["smooth_quartz", "smooth_stone", "gray_concrete", "moss_block", "stone_bricks", "iron_block", "lantern", "glowstone"]);
let floating = 0;
for (let x = 0; x < 43; x++) for (let y = 1; y < 16; y++) for (let z = 0; z < 15; z++) {
  const b = g.get(x, y, z); if (!b || SPANNING.has(b.block.replace("minecraft:", ""))) continue;
  if (!g.get(x, y - 1, z) && !(b.block.endsWith("door") && b.state?.half === "upper")) floating++;
}
if (floating) console.warn(`${floating} wall/door blocks with air below`);

console.log(g.save(OUT));
