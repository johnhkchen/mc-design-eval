// DC79324: 1430 Rhode Island Ave NW, a 1920s-style brick hotel on a stone base. Walls are brick with smooth-stone
// storey bands and a calcite cornice; windows are glass panes in brick piers; the lobby sits on the north face.
// Massing follows the lidar roof per cell: the 14-block core is the tower, the 12-block ring the podium, the 1-4 cells
// are lower wings and a light court. Solid everywhere except one air cell behind each window (some with glowstone).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79324.nbt";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79324.cells.json", "utf8"));

const W = 17, D = 22, H = 26;
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, top: Math.max(r, g) });
const at = (x, z) => cell.get(`${x},${z}`);
// solid at y: foundation (y < ground) or building (ground <= y < top); the whole column is solid up to its top
const solid = (x, z, y) => { const c = at(x, z); return !!c && y < c.top; };
const NORMALS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
// a building cell is exterior at y when a side neighbour has no solid there (a facade face, setback or court edge)
const exterior = (x, z, y) => {
  const c = at(x, z); if (!c || y < c.g || y >= c.top) return false;
  return NORMALS.some(([dx, dz]) => !solid(x + dx, z + dz, y));
};
const outward = (x, z, y) => NORMALS.find(([dx, dz]) => !solid(x + dx, z + dz, y));

// entrance: the north face, lobby at (9,0), door on rows 1-2
const DOOR = { x: 9, z: 0 };
const isDoor = (x, z, y) => x === DOOR.x && z === DOOR.z && (y === 1 || y === 2);
const LOBBY = (x, z, y) => x === 9 && z === 1 && (y === 1 || y === 2);

// window rows are the even rows from 4 up (and the shopfront rows below 3); band rows are the odd rows from 3 up
const isWindowRow = (y) => y === 1 || y === 2 || (y >= 4 && y % 2 === 0);

// the air gap behind each exterior window glass, one cell in from the face (the fill is solid elsewhere)
const gap = new Set();
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  for (let y = c.g; y < c.top - 1; y++) {
    if (!exterior(x, z, y) || !isWindowRow(y) || isDoor(x, z, y)) continue;
    const along = outward(x, z, y)[0] !== 0 ? z : x;
    if (along % 3 === 0) continue; // a pier, not glass
    const [dx, dz] = outward(x, z, y);
    const ix = x - dx, iz = z - dz;
    if (!at(ix, iz) || y >= at(ix, iz).top || exterior(ix, iz, y)) continue;
    gap.add(`${ix},${iz},${y}`);
  }
}
for (let y = 1; y <= 2; y++) gap.add(`${LOBBY.x},${LOBBY.z},${y}`);

// the penthouse: the central cells of the tallest tier, two rows of accommodation and a cap (roof equipment)
const maxTop = Math.max(...[...cell.values()].map((c) => c.top));
const tallest = [...cell.entries()].filter(([, c]) => c.top === maxTop).map(([k]) => k.split(",").map(Number));
const cx = tallest.reduce((s, [x]) => s + x, 0) / tallest.length, cz = tallest.reduce((s, [, z]) => s + z, 0) / tallest.length;
const pent = new Set(tallest.filter(([x, z]) => Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2).map(([x, z]) => `${x},${z}`));

const v = new Voxels([W, H, D]);
const DOOR_STATE = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
let counts = { foundation: 0, wall: 0, glass: 0, band: 0, cornice: 0, roof: 0, gap: 0, penthouse: 0 };

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = at(x, z); if (!c) continue;
  for (let y = 0; y < c.top; y++) {
    // position along the face that the bay rhythm counts (x on the north and south faces, z on the east and west)
    const along = exterior(x, z, y) && outward(x, z, y)[0] !== 0 ? z : x;
    if (y < c.g) { v.set(x, y, z, "stone_bricks"); counts.foundation++; continue; }
    if (gap.has(`${x},${z},${y}`)) {
      // warm light behind some windows, air in the rest
      if ((x * 5 + z * 3 + y) % 6 === 0) { v.set(x, y, z, "glowstone"); counts.gap++; }
      continue;
    }
    if (!exterior(x, z, y)) {
      // the roof covering is light stone, not the dark slate that read as pits from above
      v.set(x, y, z, y === c.top - 1 ? "stone_bricks" : "bricks"); counts.roof += y === c.top - 1 ? 1 : 0; counts.wall += y === c.top - 1 ? 0 : 1;
      continue;
    }
    if (isDoor(x, z, y)) { v.set(x, y, z, "dark_oak_door", DOOR_STATE(y === 1 ? "lower" : "upper")); continue; }
    if (y === c.top - 1) { v.set(x, y, z, "calcite"); counts.cornice++; continue; }
    if (y === c.g) { v.set(x, y, z, "polished_granite"); counts.band++; continue; }
    const side = along % 3 === 0;
    if (y < 3) { // shopfront: granite piers, glass between
      if (side) v.set(x, y, z, "polished_granite"); else { v.set(x, y, z, "glass_pane"); counts.glass++; }
      continue;
    }
    if (y % 2 === 1) { v.set(x, y, z, "smooth_stone"); counts.band++; continue; } // storey band
    if (side) v.set(x, y, z, "bricks"); else { v.set(x, y, z, "glass_pane"); counts.glass++; }
  }
}

// penthouse: two rows of accommodation on the tallest core, a cap on top (the tier below is solid, so it stands)
for (const key of pent) {
  const [x, z] = key.split(",").map(Number);
  const edge = NORMALS.some(([dx, dz]) => !pent.has(`${x + dx},${z + dz}`));
  for (let y = maxTop; y < maxTop + 2; y++) {
    if (edge && (x + z + y) % 2 === 0) { v.set(x, y, z, "glass_pane"); counts.penthouse++; }
    else v.set(x, y, z, "bricks");
  }
  v.set(x, maxTop + 2, z, edge ? "calcite" : "deepslate_tiles");
}

// the lobby door's upper half sits under the cornice; the cell beside it is the shopfront glass
v.set(DOOR.x, 1, DOOR.z, "dark_oak_door", DOOR_STATE("lower"));
v.set(DOOR.x, 2, DOOR.z, "dark_oak_door", DOOR_STATE("upper"));

const res = v.save(OUT);
console.log("saved", OUT, res, counts, { maxTop, penthouse: [...pent].length, gaps: gap.size });
