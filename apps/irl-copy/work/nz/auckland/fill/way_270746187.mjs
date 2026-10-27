// A 1930s brick-and-plaster walk-up block on the Mt Eden slope: four storeys of cream plaster with red-brick piers,
// the top storey set back from a 2-deep podium terrace, the downhill side showing its extra floors. The massing is
// solid (no rooms); each window is a glass pane with an air pocket behind it, and every storey line is a solid course.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_270746187.cells.json`, "utf8"));   // [x, z, ground, roof]

const g = new Voxels([35, 31, 33]);

const BODY = "smooth_quartz", PLINTH = "stone_bricks", BRICK = "bricks", ROOF = "smooth_stone";
const NB = [[0, -1], [1, 0], [0, 1], [-1, 0]];        // outward directions: N, E, S, W (z grows south)

// footprint cells, and d = steps in from the outline (1 = outer wall)
const F = new Map();
for (const [x, z, ground] of cells) F.set(`${x},${z}`, { x, z, ground, d: 0 });
const at = (x, z) => F.get(`${x},${z}`);
for (const c of F.values()) if (NB.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) c.d = 1;
for (let d = 2; d <= 20; d++)
  for (const c of F.values())
    if (!c.d && NB.some(([dx, dz]) => at(c.x + dx, c.z + dz)?.d === d - 1)) c.d = d;

// podium (2 cells in) to 13; the setback tower to 17; a parapet ring (3 in) to 18. Lidar roof ~17 is levelled to this.
const topOf = (d) => (d <= 2 ? 13 : d === 3 ? 18 : 17);
const solid = (x, z, y) => { const c = at(x, z); return !!c && y >= 0 && (y < c.ground || y < topOf(c.d)); };
const exposed = (x, z, y, [dx, dz]) => solid(x, z, y) && !solid(x + dx, z + dz, y);
const inTower = (x, z) => at(x, z)?.d >= 4;

// 1. the solid massing: plinth fill below each cell's ground, body to its top
for (const c of F.values()) {
  for (let y = 0; y < topOf(c.d); y++) g.set(c.x, y, c.z, y < c.ground ? PLINTH : BODY);
  if (c.d === 2) g.set(c.x, 12, c.z, ROOF);                  // podium terrace paving
  if (c.d === 3) g.set(c.x, 17, c.z, BRICK);                 // parapet cap
  if (c.d >= 4) g.set(c.x, 16, c.z, ROOF);                   // flat roof membrane
}

// 2. facades: storey lines (y % 4 == 0) in brick, piers every third cell and at the corners in brick, two-high glass
//    panes, lintels in plaster. Windows are remembered so their air pockets and lights go in after.
const windows = [];
const paneState = ([dx, dz]) => (dz !== 0
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
for (const c of F.values()) {
  for (let y = c.ground; y < topOf(c.d); y++) {
    for (const dir of NB) {
      if (!exposed(c.x, c.z, y, dir)) continue;
      if (c.d === 3 && y === 17) continue;                   // parapet cap, set above
      const [dx, dz] = dir;
      const along = dz !== 0 ? c.x : c.z;
      const r = y % 4;
      if (r === 0) g.set(c.x, y, c.z, y === c.ground ? PLINTH : BRICK);
      else if (along % 3 === 0) g.set(c.x, y, c.z, BRICK);
      else if (r === 3) g.set(c.x, y, c.z, BODY);
      else {
        g.set(c.x, y, c.z, "glass_pane", paneState(dir));
        windows.push({ x: c.x, y, z: c.z, dir, r });
      }
    }
  }
}

// 3. air behind each window (no rooms), and a few warm lights: glowstone panels and lanterns on the sill
for (const w of windows) {
  const px = w.x - w.dir[0], pz = w.z - w.dir[1];
  g.set(px, w.y, pz, "air");
  if (w.r === 1) {
    const h = (w.x * 7 + w.z * 3 + w.y) % 6;
    if (h === 0) g.set(px, w.y, pz, "glowstone");
    else if (h === 1 || h === 2) g.set(px, w.y, pz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 4. podium railing on the outer terrace edge, at the storey-3 floor line
for (const c of F.values()) {
  if (c.d !== 1) continue;
  const st = { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" };
  for (const dir of NB) if (exposed(c.x, c.z, 12, dir)) {
    if (dir[1] !== 0) { st.east = "true"; st.west = "true"; } else { st.north = "true"; st.south = "true"; }
  }
  g.set(c.x, 13, c.z, "iron_bars", st);
}

// 5. entrance on the high north side: a two-cell porch open to the street, the door set back in it, a hanging lantern
for (const y of [9, 10, 11]) for (const x of [19, 20]) g.set(x, y, 0, "air");
for (const y of [9, 10, 11]) g.set(20, y, 1, BRICK);
g.set(19, 11, 1, BODY);
g.set(19, 9, 1, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(19, 10, 1, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(20, 11, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 6. roof: a lift overrun on the tower (3x3, nearest the middle of the roof) and two plant boxes beside it
const tower = [...F.values()].filter((c) => c.d >= 4);
const mx = tower.reduce((s, c) => s + c.x, 0) / tower.length, mz = tower.reduce((s, c) => s + c.z, 0) / tower.length;
let best = null;
for (const c of tower) {
  let ok = true;
  for (let i = -1; i <= 1 && ok; i++) for (let j = -1; j <= 1 && ok; j++) ok = inTower(c.x + i, c.z + j);
  if (!ok) continue;
  const dd = (c.x - mx) ** 2 + (c.z - mz) ** 2;
  if (!best || dd < best.dd) best = { x: c.x, z: c.z, dd };
}
if (best) {
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const x = best.x + i, z = best.z + j;
    g.set(x, 17, z, BODY); g.set(x, 18, z, BODY);
    g.set(x, 19, z, BRICK);
  }
  for (const [ox, oz] of [[-3, 0], [3, 0]]) {
    const x = best.x + ox, z = best.z + oz;
    if (inTower(x, z) && inTower(x + 1, z)) { g.set(x, 17, z, "light_gray_concrete"); g.set(x + 1, 17, z, "light_gray_concrete"); }
  }
}

g.save(`${dir}/way_270746187.nbt`);
