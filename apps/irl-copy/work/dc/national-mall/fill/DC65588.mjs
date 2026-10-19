// DC65588: United States Holocaust Memorial Museum, 100 Raoul Wallenberg Place (201 14th St SW), as a 1.21.1 module.
// A Washington museum of the 1990s: a brick body with stone trim, a stone base and a flat roof behind a parapet, three
// storeys high at the core and stepping down to two and one toward the edges, as the lidar roof heights say. Roof heights
// are 3x3 median-smoothed and snapped to storey tiers of 4 blocks (1, 2 or 3 storeys, +1 parapet where lidar reads 13).
// Each column is solid from y 0 up to its ground, so nothing floats on the slope. Exterior faces are where the footprint
// ends or a neighbour's roof is lower than this layer, so setbacks get their own walls. Interiors are air with a floor
// slab per storey and a roof cover; windows are glass panes with air behind and a few glowstone lamps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65588.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65588.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Smoothed roof (median of the 3x3 footprint neighbourhood), snapped to storey tiers, plus a parapet where lidar reads 13.
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  c.sm = vals[vals.length >> 1];
  const tier = c.sm >= 10 ? 12 : c.sm >= 7 ? 8 : 4;
  c.H = tier + (tier === 12 && c.sm >= 13 ? 1 : 0);
}

// Layer y of cell c faces outward on these sides: off the footprint, or over a neighbour whose roof is below y.
const exposed = (c, y) => DIRS.filter(([dx, dz]) => { const n = F.get(key(c.x + dx, c.z + dz)); return !n || y >= n.H; });

// Main entrance: the outward face with the most tall cells; two adjacent cells mid-run.
const faces = new Map();
for (const c of F.values()) {
  const ex = exposed(c, c.H - 1);
  if (ex.length !== 1 || c.H < 8) continue;
  const k = FACING[ex[0].join(",")];
  if (!faces.has(k)) faces.set(k, []);
  faces.get(k).push({ c, dir: ex[0] });
}
const [faceKey, faceCells] = [...faces.entries()].sort((a, b) => b[1].length - a[1].length)[0];
const along = (c, dir) => (dir[0] !== 0 ? c.z : c.x);
const run = faceCells.sort((a, b) => along(a.c, a.dir) - along(b.c, b.dir));
const mid = Math.floor(run.length / 2);
const doorPair = [run[mid], run[mid + 1] ?? run[mid - 1]].sort((a, b) => along(a.c, a.dir) - along(b.c, b.dir));
const doorDir = doorPair[0].dir;
const doorKey = (c) => `${c.x},${c.z}`;
const doorSet = new Set(doorPair.map((d) => doorKey(d.c)));
const doorAlong = along(doorPair[0].c, doorDir);

const g = new Voxels([43, 25, 23]);
const TRIM = "smooth_sandstone";                                 // limestone-coloured trim: string courses, piers, quoins, cornice, lintels
const glass = { east: "false", west: "false", north: "false", south: "false" };

for (const c of F.values()) {
  for (let y = 0; y < c.H; y++) {
    if (y < c.g) { g.set(c.x, y, c.z, "stone_bricks"); continue; }                       // foundation under the slope
    const ex = exposed(c, y);
    const outside = ex.length > 0;
    const top = y === c.H - 1;

    if (doorSet.has(doorKey(c)) && y - c.g <= 2 && (y - c.g) >= 0 && ex.length && ex[0].join() === doorDir.join()) {
      const k = y - c.g;
      if (k === 0) g.set(c.x, y, c.z, "dark_oak_door", { facing: FACING[doorDir.join()], half: "lower", hinge: doorPair[0].c === c ? "left" : "right", open: "false", powered: "false" });
      else if (k === 1) g.set(c.x, y, c.z, "dark_oak_door", { facing: FACING[doorDir.join()], half: "upper", hinge: doorPair[0].c === c ? "left" : "right", open: "false", powered: "false" });
      else g.set(c.x, y, c.z, TRIM);                                              // lintel over the doors
      continue;
    }
    // Stone lintel across the doorway and one cell beyond each side.
    if (ex.length && ex[0].join() === doorDir.join() && Math.abs(along(c, doorDir) - doorAlong) <= 1.5 && y - c.g === 2) {
      g.set(c.x, y, c.z, TRIM); continue;
    }

    if (top) { g.set(c.x, y, c.z, outside ? TRIM : "smooth_stone"); continue; } // cornice / roof cover
    if (y % 4 === 0) { g.set(c.x, y, c.z, outside ? TRIM : "smooth_stone"); continue; } // string course / floor slab
    if (!outside) continue;                                                                   // interior air

    if (ex.length >= 2) { g.set(c.x, y, c.z, TRIM); continue; }                     // corner quoin
    const [dx, dz] = ex[0];
    const a = along(c, ex[0]);
    const r = y % 4;
    if (r === 3) { g.set(c.x, y, c.z, "bricks"); continue; }                                  // spandrel
    if (a % 3 === 0) { g.set(c.x, y, c.z, TRIM); continue; }                        // stone pier
    if (a % 3 === 2) { g.set(c.x, y, c.z, "bricks"); continue; }                              // brick wall
    const pane = dz !== 0 ? { ...glass, east: "true", west: "true" } : { ...glass, north: "true", south: "true" };
    g.set(c.x, y, c.z, "light_blue_stained_glass_pane", pane);
    // A warm lamp behind some windows: the interior cell inward of the pane, if it is open air here.
    const inward = F.get(key(c.x - dx, c.z - dz));
    if (r === 2 && (a + Math.floor(y / 4)) % 6 === 1 && inward && y >= inward.g && y < inward.H && exposed(inward, y).length === 0) {
      g.set(inward.x, y, inward.z, "glowstone");
    }
  }
}

// Glowstone in the lobby, behind the doors.
for (const d of doorPair) {
  const inward = F.get(key(d.c.x - doorDir[0], d.c.z - doorDir[1]));
  if (inward) g.set(inward.x, d.c.g + 1, inward.z, "glowstone");
}

// Roof plant: 2x2 air-handling units on a roof whose four cells share one height and are all interior.
const units = [];
const roofCells = [...F.values()].filter((c) => c.H >= 12 && exposed(c, c.H - 1).length === 0);
const roofKey = (x, z) => F.get(key(x, z));
for (const c of roofCells.sort((a, b) => (b.x - 21) ** 2 + (b.z - 11) ** 2 - ((a.x - 21) ** 2 + (a.z - 11) ** 2))) {
  if (units.length >= 3) break;
  const sq = [roofKey(c.x, c.z), roofKey(c.x + 1, c.z), roofKey(c.x, c.z + 1), roofKey(c.x + 1, c.z + 1)];
  if (sq.some((n) => !n || n.H !== c.H || exposed(n, c.H - 1).length)) continue;
  if (units.some((u) => Math.abs(u.x - c.x) < 4 && Math.abs(u.z - c.z) < 4)) continue;
  units.push(c);
  for (const n of sq) for (let y = c.H; y < c.H + 2; y++) g.set(n.x, y, n.z, "iron_block");
}

const info = g.save(OUT);
console.log(`saved ${OUT}: ${info.blocks} blocks, palette ${info.palette}; door face ${faceKey} at along ${doorAlong}; ${units.length} roof units`);
