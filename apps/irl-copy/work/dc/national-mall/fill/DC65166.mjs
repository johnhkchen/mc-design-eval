// DC65166: a 1960s-80s Commercial-Office-Large on North Capitol Street, NW, read from the lidar record. A three-storey
// buff-stone office block: quartz spandrels, glass bays in each storey, a stone base course and shopfront band on the
// ground floor, one dark-oak entrance on the north face with a stone step, and roof plant on a flat deck with a
// central penthouse pavilion.
//
// The lidar roof in the cells record equals the ground under every cell (roof 2 or 3 above y 0, ground 0 to 3), so it
// gives no storey height to follow. The massing is therefore a set three-storey envelope with its roof at y 13 (flat
// everywhere, so the downhill side shows its extra foundation), on absolute storey lines so neighbouring cells line up.
// Each cell fills from y 0 up, so nothing floats. Interior cells one step behind a glass bay are air at the window rows,
// with floor slabs and a ceiling per storey; a warm light stands in some of those rooms.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65166.cells.json`, "utf8"));
const W = 25, D = 18, H = 18;
const ROOF = 13;                                      // body rows 0..12 solid; parapet crenels at row 13 on facades

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const FACES = [[0, -1], [0, 1], [-1, 0], [1, 0]];

const faces = (x, z) => FACES.filter(([dx, dz]) => !inside.has(key(x + dx, z + dz)));
// Mullions every third cell along each face (by x on the north and south faces, by z on the east and west).
const isPier = (x, z, fs) => fs.some(([dx]) => ((dx === 0) ? x : z) % 3 === 0);

const ENTRY = { x: 12, z: 0 };
const info = new Map();
for (const [x, z, g] of cells) {
  const fs = faces(x, z);
  const facade = fs.length > 0;
  const door = x === ENTRY.x && z === ENTRY.z;
  info.set(key(x, z), { x, z, g, facade, door, pier: facade && isPier(x, z, fs) });
}
const at = (x, z) => info.get(key(x, z));
// A window is a glass facade cell (not a mullion, not the entrance); a room is an interior cell one step behind one.
const isWindow = (c) => c.facade && !c.pier && !c.door;
const windowsBehind = (x, z) => FACES.map(([dx, dz]) => at(x + dx, z + dz)).filter((c) => c && isWindow(c));
for (const c of info.values()) c.windows = c.facade ? [] : windowsBehind(c.x, c.z);

// Storey rows: foundation below the cell's ground, base course at its ground, ground-floor glass to row 3, lintel and
// floor line at 4 and 5, windows at 6 and 7, spandrels at 8 and 9, windows at 10 and 11, cornice at 12, parapet at 13.
const WINDOW_ROWS = new Set([6, 7, 10, 11]);
const WALL = "smooth_quartz", MULL = "quartz_pillar", BASE = "stone_bricks", GLASS = "glass_pane";
const ROOFS = "gray_concrete", PLANT = "light_gray_concrete";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

const g = new Voxels([W, H, D]);

// 1. Body: each footprint cell fills from y 0 to the flat roof, with the walls, glass and rooms behind the glass.
for (const c of info.values()) {
  const { x, z } = c;
  for (let y = 0; y < ROOF; y++) {
    if (c.door && y >= c.g && y <= c.g + 1 && y <= 3) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === c.g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y <= c.g) { g.set(x, y, z, BASE); continue; }
    if (c.door) { g.set(x, y, z, WALL); continue; }

    if (c.facade) {
      const glazed = y <= 3 || WINDOW_ROWS.has(y);
      if (glazed && !c.pier) g.set(x, y, z, GLASS);
      else if (glazed) g.set(x, y, z, MULL);
      else g.set(x, y, z, WALL);
      continue;
    }

    // Interior: air at the window rows of a room behind a window, floor slabs and ceilings solid.
    const roomRow = c.windows.length > 0 && (WINDOW_ROWS.has(y) || (y > c.g && y <= 3 && c.windows.some((w) => y > w.g)));
    if (roomRow) continue;
    g.set(x, y, z, y === ROOF - 1 ? ROOFS : WALL);
  }
}

// 2. Stone step from the street to the entrance (on the foundation, inside the footprint).
g.set(ENTRY.x, 1, ENTRY.z, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });

// 3. Solid parapet course on the facades (a cornice, not battlements), then roof plant on a sparse grid.
for (const c of info.values()) {
  if (c.facade) g.set(c.x, ROOF, c.z, WALL);
}
for (const c of info.values()) {
  if (c.facade) continue;
  if (c.x % 3 === 1 && c.z % 3 === 1 && hash(c.x, 0, c.z) % 17 === 0) {
    g.set(c.x, ROOF, c.z, PLANT); g.set(c.x, ROOF + 1, c.z, PLANT);
  }
}

// 4. Central penthouse pavilion: a solid quartz box two storeys up with a cap, glass bands, and lanterns on the cap.
const PAV = { x0: 9, x1: 15, z0: 5, z1: 12 };
for (let x = PAV.x0; x <= PAV.x1; x++) for (let z = PAV.z0; z <= PAV.z1; z++) {
  if (!inside.has(key(x, z))) continue;
  const edge = x === PAV.x0 || x === PAV.x1 || z === PAV.z0 || z === PAV.z1;
  for (let y = ROOF; y <= ROOF + 2; y++) {
    const band = y === ROOF + 1 && edge && (x + z) % 2 === 0;
    g.set(x, y, z, band ? GLASS : WALL);
  }
  g.set(x, ROOF + 3, z, WALL);
}
for (const [x, z] of [[PAV.x0, PAV.z0], [PAV.x1, PAV.z0], [PAV.x0, PAV.z1], [PAV.x1, PAV.z1]]) {
  if (inside.has(key(x, z))) g.set(x, ROOF + 4, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// 5. Warm lights in some rooms behind the glass: a lantern, glowstone or shroomlight on the second-floor slab.
for (const c of info.values()) {
  if (c.facade || c.windows.length === 0) continue;
  const h = hash(c.x, 1, c.z);
  if (h % 7 !== 0) continue;
  const y = 6;
  const pick = (h >> 3) % 3;
  if (pick === 0) g.set(c.x, y, c.z, "lantern", { hanging: "false", waterlogged: "false" });
  else g.set(c.x, y, c.z, pick === 1 ? "glowstone" : "shroomlight");
}

const stats = g.save(`${DIR}/DC65166.nbt`);
console.log(JSON.stringify({ size: g.size, ...stats }));
