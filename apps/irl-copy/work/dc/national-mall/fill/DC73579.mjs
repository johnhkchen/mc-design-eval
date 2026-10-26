import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1112 M St NW, Residential-Apartment-Elevator: a brick apartment block of the 1920s-30s (red common brick, pale stone
// trim) on a stone plinth. The lidar roof record reads as a 12-block mass with a 14-block core on it (a tower on a
// podium), so the massing is two flat tiers. Storeys are 2-block modules: a spandrel row (brick, with calcite sills
// and lintels under and over each window) and a glass row between brick piers. The street front is the z = 1 face,
// with a double-door entrance under a calcite lintel and lit lantern in the lobby. Mechanical boxes sit on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73579.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 9, D = 21, Y = 16;
const g = new Voxels([W, Y, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(), lidar = new Map();
for (const [x, z, gr, roof] of cells) { ground.set(key(x, z), gr); lidar.set(key(x, z), roof); }

// The lidar roof is noisy at the tier edges: the median of each cell and its footprint neighbours gives flat tiers.
const roof = new Map();
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const k = key(x + dx, z + dz); if (lidar.has(k)) v.push(lidar.get(k)); }
  v.sort((a, b) => a - b);
  roof.set(key(x, z), v[(v.length - 1) >> 1]);
}
const inFp = (x, z) => roof.has(key(x, z));
const top = (x, z) => roof.get(key(x, z));
// a block at y is there when the cell is in the footprint and y is under its roof; the foundation rows (y < ground) are always there
const solid = (x, y, z) => inFp(x, z) && y < top(x, z);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

// row roles: 0 = base course, odd rows = spandrels (the storey line), even rows = glass, the top row = parapet or roof deck
const role = (y, t) => (y === 0 ? "base" : y === t - 1 ? "top" : (y - 1) % 2 === 0 ? "span" : "glass");

const STONE = "stone_bricks", BRICK = "bricks", TRIM = "calcite", FLOOR = "smooth_stone";
const pane = (alongZ) => (alongZ ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });
const lit = (x, y, z) => (x * 7 + y * 13 + z * 31) % 5 === 0;     // about one window in five has a lamp behind the glass

// the entrance: a double door at the back of the street notch (x = 1, z 11..12: the notch the lidar leaves open to the
// west front), between glass sidelights (z 10, 13), under a calcite lintel at y 3; the lobby is the notch's air behind it
const ENTRY_X = 1, DOOR_Z = [11, 12], SIDE_Z = [10, 13];
const door = (z, y) => ({ id: "dark_oak_door", state: { facing: "east", half: y === 1 ? "lower" : "upper", hinge: z === 11 ? "left" : "right", open: "false", powered: "false" } });

for (const [x, z] of cells) {
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const r = role(y, t), out = exposed(x, y, z);
    // the lobby: a hall cut into the floor behind the entrance, lit by a lantern
    if (x === 2 && DOOR_Z.includes(z) && (y === 1 || y === 2)) {
      if (z === 11 && y === 2) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      continue;
    }
    if (out.length === 0) {
      // interior: the storey slabs and the roof deck; the glass rows are air, with a lamp behind some windows
      if (r === "top") g.set(x, y, z, FLOOR);
      else if (r === "span") g.set(x, y, z, FLOOR);
      continue;
    }
    if (r === "base") { g.set(x, y, z, STONE); continue; }
    if (r === "top") { g.set(x, y, z, TRIM); continue; }     // parapet coping
    const [dx, dz] = out[0];
    const alongZ = dx !== 0;                                 // an x face runs along z, a z face along x
    const along = alongZ ? z : x;
    const isWindow = along % 3 !== 0;
    const corner = out.length > 1;
    // the entrance front
    if (x === ENTRY_X && dx === -1 && DOOR_Z.includes(z) && (y === 1 || y === 2)) { const d = door(z, y); g.set(x, y, z, d.id, d.state); continue; }
    if (x === ENTRY_X && dx === -1 && SIDE_Z.includes(z) && (y === 1 || y === 2)) { g.set(x, y, z, "glass_pane", pane(false)); continue; }
    if (x === ENTRY_X && dx === -1 && z >= 10 && z <= 13 && y === 3) { g.set(x, y, z, TRIM); continue; }
    if (corner) { g.set(x, y, z, TRIM); continue; }
    if (r === "span") { g.set(x, y, z, isWindow ? TRIM : BRICK); continue; }   // sills and lintels frame each window
    if (isWindow) { g.set(x, y, z, "glass_pane", pane(!alongZ)); continue; }
    g.set(x, y, z, BRICK);
  }
}

// lamps: a lit window has its glowstone in the air cell just inside the glass
for (const [x, z] of cells) {
  const t = top(x, z);
  for (let y = 1; y < t - 1; y++) {
    if (role(y, t) !== "glass") continue;
    const out = exposed(x, y, z);
    if (out.length !== 1 || x === ENTRY_X || !lit(x, y, z)) continue;
    const [dx, dz] = out[0];
    const ix = x - dx, iz = z - dz;
    if (inFp(ix, iz) && exposed(ix, y, iz).length === 0 && role(y, top(ix, iz)) === "glass") g.set(ix, y, iz, "glowstone");
  }
}

// roof plant: two mechanical boxes on the 12-block tier, away from the tower
for (const [x, z] of [[1, 11], [2, 11], [1, 12], [2, 12]]) {
  if (top(x, z) !== 12) continue;
  g.set(x, 12, z, "light_gray_concrete");
  g.set(x, 13, z, "light_gray_concrete");
}

const stats = g.save(`${DIR}/DC73579.nbt`);
console.log(JSON.stringify(stats));
