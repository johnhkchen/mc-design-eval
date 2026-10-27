import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1920s-30s interwar commercial block on Mt Eden / Eden Terrace: three storeys of red brick on a stone base,
// a shopfront at street level on the low (west) side, stone string courses at each floor, a stone cornice and a
// brick parapet, and a plant room on the roof. The lidar roof is flat at 13 everywhere except one low corner (5)
// and one nodata cell (0, which takes the building's roof). Walls are one block thick with an air interior, so
// every window looks onto air and a floor slab sits at each storey.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658680.cells.json", "utf8"));

const ROOF = 13;                                   // the building's lidar roof (nodata cells take it)
const FLOORS = [4, 8];                             // storey floor slabs above the ground storey
const DOOR = [0, 5];                               // the street entrance, on the low west face
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // east, west, south, north

const at = new Map();
for (const [x, z, gr, rf] of cells) at.set(`${x},${z}`, { g: gr, r: rf || ROOF });
const cell = (x, z) => at.get(`${x},${z}`);
const exterior = (x, z) => DIRS.filter(([dx, dz]) => !cell(x + dx, z + dz));
const perimeter = (x, z) => exterior(x, z).length > 0;

// window rows [lo, hi] and the lintel row of each storey; the ground storey's window sits between its base and 3
const winRows = (s, gr) => (s === 0 ? (gr + 1 <= 2 ? [gr + 1, 2] : null) : [[5, 6], [9, 10]][s - 1]);
const LINTEL = [3, 7, 11];

const g = new Voxels([9, 26, 9]);
const keys = [...at.keys()].map((k) => k.split(",").map(Number));

for (const [x, z] of keys) {
  const { g: gr, r } = cell(x, z);
  const ext = exterior(x, z);
  const per = ext.length > 0;
  const door = x === DOOR[0] && z === DOOR[1];

  // a window needs one exterior face, an alternating bay, and an interior cell behind it on no higher ground
  const [dx = 0, dz = 0] = ext.length === 1 ? ext[0] : [];
  const inward = per ? cell(x - dx, z - dz) : null;
  const inwardOK = !!inward && !perimeter(x - dx, z - dz) && inward.g <= gr;
  const win = per && ext.length === 1 && (x + z) % 2 === 1 && !door && inwardOK;
  const pier = ext.length >= 2;                                       // stone quoins at the corners only
  // glass pane connects along the wall it sits in
  const pane = dx !== 0 ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
                        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  for (let y = 0; y < r; y++) {
    let b = null, st;
    if (!per) {
      if (y < gr) b = "stone_bricks";                                   // foundation
      else if (y === gr || FLOORS.includes(y) || y === r - 1) b = "smooth_stone";   // floor slabs and roof deck
    } else if (y <= gr) {
      b = "stone_bricks";                                               // foundation, then the base course
    } else if (y === r - 1) {
      b = "smooth_stone";                                               // cornice
    } else if (door && (y === 1 || y === 2)) {
      b = "dark_oak_door";
      st = { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    } else if (door) {
      b = y === 3 ? "smooth_stone" : "bricks";                          // stone hood over the entrance
    } else if (y === 4 || y === 8) {
      b = "smooth_stone";                                               // string courses at the floors
    } else {
      b = pier ? "stone_bricks" : "bricks";
      for (let s = 0; s < 3; s++) {
        const rows = winRows(s, gr);
        if (y === LINTEL[s]) { b = "smooth_stone"; break; }
        if (win && rows && y >= rows[0] && y <= rows[1]) { b = "glass_pane"; st = pane; break; }
      }
    }
    if (b) g.set(x, y, z, b, st);
  }

  // the roof: a brick parapet on the perimeter (stone at the corners)
  if (per && r === ROOF) g.set(x, ROOF, z, ext.length >= 2 ? "stone_bricks" : "bricks");
}

// the roof plant room: a 2x2 stone block sitting on the roof deck
for (const [x, z] of [[3, 4], [4, 4], [3, 5], [4, 5]]) g.set(x, ROOF, z, "stone_bricks");

// warm light: a lantern standing on the floor just inside some windows (one storey per bay)
for (const [x, z] of keys) {
  const ext = exterior(x, z);
  if (ext.length !== 1 || (x + z) % 2 !== 1 || (x === DOOR[0] && z === DOOR[1])) continue;
  if ((x * 5 + z * 3) % 4 !== 0) continue;
  const [dx, dz] = ext[0];
  const n = cell(x - dx, z - dz);
  if (!n || perimeter(x - dx, z - dz) || n.g > cell(x, z).g) continue;
  const s = (x * 2 + z) % 3;
  const lightY = s === 0 ? n.g + 1 : FLOORS[s - 1] + 1;
  const rows = winRows(s, cell(x, z).g);
  if (!rows || lightY > rows[1]) continue;
  g.set(x - dx, lightY, z - dz, "lantern", { hanging: "false", waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658680.nbt";
console.log(g.save(out));
