// A 1920s two-storey plaster-and-brick shop block on a rising site: a cream stucco mass, a brick string course,
// timber shopfront fascia on the ground storey, sash-style windows above, a stone cornice and parapet. The lidar's
// roof heights are snapped to two tiers (a single-storey wing at 5, the two-storey main at 8). Every column is solid
// from y 0 up to its top (foundation below its ground), so nothing floats; only the air behind each window is open.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1321770868.cells.json", "utf8"));
const [X, Y, Z] = [25, 21, 20];

// one record per footprint column: g = ground (foundation below it), t = top (walls occupy y < t)
const col = new Map();
for (const [x, z, g, r] of cells) col.set(`${x},${z}`, { x, z, g, t: r <= 6 ? 5 : 8 });
const at = (x, z) => col.get(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
// a face is exposed at height y when the cell beside it is outside the footprint or stands lower than y
const exposedAt = (c, y) => Object.keys(DIRS).filter((d) => { const n = at(c.x + DIRS[d][0], c.z + DIRS[d][1]); return !n || y >= n.t; });
// the cell behind a face (one block in, toward the middle of the building)
const behind = (c, d) => at(c.x - DIRS[d][0], c.z - DIRS[d][1]);
const along = (c, d) => (d === "N" || d === "S" ? c.x : c.z);   // position along the face, for the bays

const spec = new Map();                       // "x,y,z" -> [block, state] or null (air)
const put = (x, y, z, b, s) => spec.set(`${x},${y},${z}`, s ? [b, s] : [b]);
const air = (x, y, z) => spec.set(`${x},${y},${z}`, null);

// 1. the mass: foundation, walls, a plain roof surface on the top row
for (const c of col.values()) {
  for (let y = 0; y < c.t; y++) {
    if (y < c.g) put(c.x, y, c.z, "stone_bricks");
    else put(c.x, y, c.z, y === c.t - 1 ? "smooth_stone" : "smooth_quartz");
  }
}

// 2. the facades: fascia, string course, cornice, pilaster bays, shop glass and windows
const windows = [];
for (const c of col.values()) {
  for (let y = c.g; y < c.t; y++) {
    const ex = exposedAt(c, y);
    if (!ex.length) continue;
    if (y === c.t - 1) { put(c.x, y, c.z, "stone_bricks"); continue; }          // cornice
    if (ex.length > 1) { put(c.x, y, c.z, "quartz_pillar"); continue; }         // corner quoin
    const d = ex[0], u = along(c, d);
    const pillar = u % 4 === 0;
    if (y === 3) { put(c.x, y, c.z, "dark_oak_planks"); continue; }             // shopfront fascia
    if (y === 4) { put(c.x, y, c.z, "bricks"); continue; }                      // brick string course
    if (y === 0 && c.g === 0) { put(c.x, y, c.z, "stone_bricks"); continue; }   // street-level plinth
    if (pillar) { put(c.x, y, c.z, "quartz_pillar"); continue; }
    if (y >= 5 && u % 4 === 3) continue;                                        // wall between windows (stays stucco)
    const inn = behind(c, d);
    if (!inn || y < inn.g) continue;                                            // no room behind: keep the wall
    const s = d === "N" || d === "S"
      ? { east: "true", west: "true", north: "false", south: "false" }
      : { north: "true", south: "true", east: "false", west: "false" };
    put(c.x, y, c.z, "glass_pane", s);
    windows.push({ c, y, d, u, inn, shop: y < 4 });
  }
}

// 3. the entrance: a door in a ground-storey bay near the middle of the frontage, with a timber canopy over it
const doorCands = windows.filter((w) => w.shop && w.y === 1 && w.c.g <= 1 && w.u % 4 === 1 && w.inn.g <= 1);
const door = doorCands.sort((a, b) => Math.abs(a.u - 12) - Math.abs(b.u - 12))[0];
if (door) {
  const { c, d, inn } = door;
  put(c.x, 1, c.z, "dark_oak_door", { facing: FACING[d], half: "lower", hinge: "left", open: "false", powered: "false" });
  put(c.x, 2, c.z, "dark_oak_door", { facing: FACING[d], half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const w of windows) if (w.c === c) w.door = true;
  air(inn.x, 1, inn.z); air(inn.x, 2, inn.z);
  for (const c3 of col.values()) {                                              // canopy: the fascia over the door bay
    if (!exposedAt(c3, 3).includes(d) || Math.abs(along(c3, d) - door.u) > 1 || exposedAt(c3, 3).length > 1) continue;
    put(c3.x, 3, c3.z, "dark_oak_stairs", { facing: FACING[d], half: "top", shape: "straight", waterlogged: "false" });
  }
  windows.splice(windows.indexOf(door), 1);
}

// 4. sash windows: air behind each pane, with a glowstone behind some of them for the warm light at dusk
for (const w of windows) {
  if (w.door) continue;
  air(w.inn.x, w.y, w.inn.z);
  const bay = Math.floor(w.u / 4);
  if ((bay + w.y) % 3 === 0) put(w.inn.x, w.y, w.inn.z, "glowstone");
}

// 5. parapet on the outer edge of each roof: a solid coping course standing on the cornice
for (const c of col.values()) {
  const outer = Object.keys(DIRS).some((d) => { const n = at(c.x + DIRS[d][0], c.z + DIRS[d][1]); return !n || n.t < c.t; });
  if (outer) put(c.x, c.t, c.z, "stone_bricks");
}

// 6. roof plant: a small enclosed box on the main roof, and two iron vents, all standing on the roof surface
const mainRoof = [...col.values()].filter((c) => c.t === 8 && !exposedAt(c, 7).length);
const box = mainRoof.filter((c) => c.x >= 12 && c.x <= 15 && c.z >= 6 && c.z <= 9);
for (const c of box) { put(c.x, 8, c.z, "smooth_quartz"); put(c.x, 9, c.z, "stone_bricks"); }
for (const [x, z] of [[18, 7], [18, 11]]) if (mainRoof.some((c) => c.x === x && c.z === z)) put(x, 8, z, "iron_block");

// 7. write the volume
const g = new Voxels([X, Y, Z]);
for (const [k, v] of spec) {
  const [x, y, z] = k.split(",").map(Number);
  if (v) g.set(x, y, z, v[0], v[1]);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1321770868.nbt");
