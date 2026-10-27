// A three-tier 1930s brick and plaster commercial block on the Eden Terrace side of Mt Eden: a 2-storey shopfront
// podium (stone plinth, glazed ground floor, dark-oak doors) under 3-storey, 2-storey and 1-storey setback tiers.
// Walls are one block thick with glass set in brick piers and smooth-quartz bands; interiors are air with floor
// slabs at each storey line, so the glass has an air gap behind it. Warm glowstone sits behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241834.cells.json", "utf8"));
const [W, H_MAX, D] = [53, 25, 30];
const g = new Voxels([W, H_MAX, D]);

const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, lidarRoof: roof }]));
const get = (x, z) => at.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];      // +x, -x, +z, -z (the -z face is north)
const TIERS = [6, 8, 10, 12];

// 1. smooth the lidar roof: median of the 3x3 footprint neighbourhood, then nearest clean tier (ties go up)
for (const c of at.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = get(c.x + dx, c.z + dz); if (n) vals.push(n.lidarRoof); }
  vals.sort((a, b) => a - b);
  const m = vals[Math.floor(vals.length / 2)];
  c.H = TIERS.reduce((best, t) => (Math.abs(t - m) <= Math.abs(best - m) ? t : best), TIERS[0]);
}

// 2. a cell is facade when a side is open or drops to a lower tier; interior cells are hollow above their floor
for (const c of at.values()) {
  c.exposed = DIRS.filter(([dx, dz]) => { const n = get(c.x + dx, c.z + dz); return !n || n.H < c.H; });
  c.perim = c.exposed.length > 0;
}

// 3. entrances: two doors on the north (-z) face, single-sided cells on the tall-enough part, at 30% and 70% along it
const northFace = [...at.values()].filter((c) => c.perim && c.exposed.length === 1 && c.exposed[0][1] === -1 && c.H >= 8)
  .sort((a, b) => a.x - b.x);
const doors = new Set(northFace.length ? [northFace[Math.floor(northFace.length * 0.3)], northFace[Math.floor(northFace.length * 0.7)]]
  .map((c) => `${c.x},${c.z}`) : []);

const window_ = (y, H) => (y < 4 ? y === 2 || y === 3 : y === 5 || y === 6 || y === 9 || y === 10) && y < H - 1;
const quartzRow = (y, H) => y === 4 || y === 8 || (y === H - 1) || ((y === 7 || y === 11) && y < H - 1);

// 4. foundations, facade columns, interior floors and roofs
for (const c of at.values()) {
  const { x, z, ground, H } = c;
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");                 // foundation under the lidar ground
  for (let y = ground; y < H; y++) {
    if (!c.perim) {                                                                 // interior: floor slabs, roof, air
      if (y === ground || y === 4 || y === 8 || y === H - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === ground) { g.set(x, y, z, "stone_bricks"); continue; }                // plinth
    if (quartzRow(y, H)) { g.set(x, y, z, "smooth_quartz"); continue; }             // bands, sills, cornice
    g.set(x, y, z, "bricks");
  }
  if (c.perim) g.set(x, H, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // parapet
}

// 5. windows: glass in the bays between brick piers, only where the room behind is air; doors on the north face
for (const c of at.values()) {
  if (!c.perim) continue;
  const { x, z, ground, H } = c;
  const isDoor = doors.has(`${x},${z}`);
  if (isDoor) {
    g.set(x, ground + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, ground + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    continue;
  }
  if (c.exposed.length !== 1) continue;                                             // corners stay piers
  const [dx, dz] = c.exposed[0];
  const along = dx !== 0 ? z : x;
  if (along % 3 === 0) continue;                                                    // pier
  const inner = get(x - dx, z - dz);
  if (!inner || inner.perim) continue;                                              // need air behind the glass
  for (let y = ground + 1; y < H - 1; y++) {
    if (!window_(y, H) || quartzRow(y, H)) continue;
    g.set(x, y, z, "glass_pane");
    if (y === 5 || y === 2) if ((along + y) % 5 === 0) g.set(inner.x, y, inner.z, y === 2 ? "shroomlight" : "glowstone");
  }
}

// 6. roof plant: a 3x3 plant pad and a lift overrun on the 12 tier, a small plant box on a 10 tier roof
const roofCells = (H) => [...at.values()].filter((c) => !c.perim && c.H === H);
const padFits = (c, H) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => { const n = get(c.x + dx, c.z + dz); return n && !n.perim && n.H === H; }));
const pick = (list, H, near) => list.filter((c) => padFits(c, H)).sort((a, b) => Math.hypot(a.x - near[0], a.z - near[1]) - Math.hypot(b.x - near[0], b.z - near[1]))[0];
const tall = roofCells(12);
if (tall.length) {
  const cx = tall.reduce((s, c) => s + c.x, 0) / tall.length, cz = tall.reduce((s, c) => s + c.z, 0) / tall.length;
  const pad = pick(tall, 12, [cx - 3, cz]);
  if (pad) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 12; y <= 13; y++) g.set(pad.x + dx, y, pad.z + dz, "stone_bricks");
  const lift = pick(tall, 12, [cx + 6, cz + 2]);
  if (lift && lift !== pad) for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) {
    for (let y = 12; y <= 14; y++) g.set(lift.x + dx, y, lift.z + dz, "bricks");
    g.set(lift.x + dx, 15, lift.z + dz, "smooth_quartz");
  }
}
const mid = pick(roofCells(10), 10, [26, 15]);
if (mid) for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) g.set(mid.x + dx, 10, mid.z + dz, "light_gray_concrete");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241834.nbt");
