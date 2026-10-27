// Way 326340912, "Allcard": a two-storey interwar commercial block (rendered masonry, stone plinth, dark timber
// shopfront on the low side), 11 blocks to the parapet from the lidar roof. Storey lines sit on absolute heights
// (4 and 8) so the low side shows the extra storey under the shopfront; the body is a solid core with a one-cell air
// gap behind each window, so nothing floats and no interior is modelled.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340912.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340912.nbt";

const FOUND = "stone_bricks", WALL = "white_concrete", STONE = "smooth_stone", TRIM = "dark_oak_planks", CORE = "stone";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Lidar roof heights snap to two flat tiers: the main roof (11 blocks, 10 is noise) and the 8-block NW notch.
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, h: roof >= 10 ? 11 : 8 });
const cell = (x, z) => foot.get(`${x},${z}`);
const solid = (x, y, z) => { const c = cell(x, z); return !!c && y >= 0 && y < c.h; };
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const bayU = (x, z, [dx]) => (dx !== 0 ? z : x);            // position along the facade
const isWindowBay = (x, z, d) => bayU(x, z, d) % 3 !== 0;   // piers every third cell
const glassState = ([dx]) => (dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const facing = ([dx, dz]) => (dz === 1 ? "south" : dz === -1 ? "north" : dx === 1 ? "east" : "west");

// Entrance: the lowest street-level facade cell with a walkable hall behind it (two air cells deep at y 0-1).
const minGround = Math.min(...cells.map((c) => c[2]));
let entrance = null;
for (const [x, z, ground] of cells) {
  if (ground !== minGround || entrance) continue;
  for (const d of DIRS) {
    const [dx, dz] = d;
    if (!solid(x + dx, 0, z + dz) && solid(x - dx, 0, z - dz) && solid(x - dx, 1, z - dz)) { entrance = { x, z, d }; break; }
  }
}

// Which facade cells get glass, and the air gap behind each (interior cell one step inward, same height).
const isGlassRow = (y, c) => y === 5 || y === 6 || (c.ground <= 2 && y > c.ground && y <= 2);
const glass = new Map(), behind = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const c = cell(x, z);
  for (let y = c.ground; y < c.h - 1; y++) {
    const ex = exposed(x, y, z);
    if (ex.length !== 1) continue;                            // corners and the entrance stay solid
    const [d] = ex;
    if (!isWindowBay(x, z, d) || !isGlassRow(y, c)) continue;
    const ix = x - d[0], iz = z - d[1];
    if (!solid(ix, y, iz) || exposed(ix, y, iz).length) continue;   // no room behind the glass: keep it wall
    if (entrance && x === entrance.x && z === entrance.z) continue;
    glass.set(`${x},${y},${z}`, d);
    behind.set(`${ix},${y},${iz}`, (x * 3 + z * 5 + y) % 4);   // 0 glowstone, 1 shroomlight, else plain air
  }
}

const g = new Voxels([15, 23, 22]);

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const c = cell(x, z), T = c.h - 1;
  for (let y = 0; y <= T; y++) {
    const key = `${x},${y},${z}`;
    if (y < c.ground) { g.set(x, y, z, FOUND); continue; }     // foundation up to the lidar ground
    if (y === T) { g.set(x, y, z, STONE); continue; }          // coping / roof deck
    if (behind.has(key)) {                                     // air gap behind glass, lit in some bays
      const k = behind.get(key);
      if (k === 0) g.set(x, y, z, "glowstone");
      else if (k === 1) g.set(x, y, z, "shroomlight");
      continue;
    }
    const ex = exposed(x, y, z);
    if (!ex.length) { g.set(x, y, z, CORE); continue; }
    if (entrance && x === entrance.x && z === entrance.z && y <= 3) {
      if (y === 0 || y === 1) { g.set(x, y, z, "dark_oak_door", { facing: facing(entrance.d), half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === 2) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      g.set(x, y, z, TRIM); continue;                          // canopy fascia over the door
    }
    if (y === 4 || y === 8) { g.set(x, y, z, STONE); continue; }   // string course and cornice
    if (glass.has(key)) { g.set(x, y, z, "glass_pane", glassState(glass.get(key))); continue; }
    if (c.ground <= 2 && y < 4) {                              // shopfront: plinth, glazing, timber piers, fascia
      g.set(x, y, z, y === c.ground ? FOUND : y === 3 ? TRIM : TRIM); continue;
    }
    if (y < 4) { g.set(x, y, z, y === c.ground ? FOUND : WALL); continue; }
    if (y === 7 && ex.length === 1 && isWindowBay(x, z, ex[0])) { g.set(x, y, z, TRIM); continue; }   // window head
    g.set(x, y, z, WALL);
  }
}

// Roof plant: a 3 x 3 box on the roof deck (concrete walls, stone cap), standing on the coping.
for (let x = 8; x <= 10; x++) for (let z = 12; z <= 14; z++) {
  const edge = x === 8 || x === 10 || z === 12 || z === 14;
  g.set(x, 11, z, edge ? WALL : CORE);
  g.set(x, 12, z, STONE);
}

const res = g.save(OUT);
console.log(JSON.stringify({ entrance, glass: glass.size, behind: behind.size, ...res }));
