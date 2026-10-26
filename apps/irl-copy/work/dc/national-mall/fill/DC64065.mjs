// The Phillips Collection, 1600 21st Street NW: a Georgian Revival brick house (1897, with the 1920s additions and the
// Goh wing) read as a stepped brick block: the main house at 9 blocks, the east wing at 7, a low single-storey wing at 3,
// and a central pavilion at 10. Three-block storeys, red brick piers, pale stone string courses and quoins, glass panes
// in pairs between the piers, a door bay with a hood on the north front, glowstone lamps behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64065.cells.json", "utf8"));

const W = 14, H = 22, D = 9;
const at = new Map();                                    // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) at.set(`${x},${z}`, { ground, roof });
const has = (x, z) => at.has(`${x},${z}`);
// a shell block has a face open to the outside at that height: the edge of the footprint, or a side where the neighbour
// stops lower (a tier's step, the low wings); its face shows piers, panes and string courses, and the rest is air
const open = (x, z, y, dx, dz) => { const n = at.get(`${x + dx},${z + dz}`); return !n || n.roof <= y; };
const exposed = (x, z, y) => open(x, z, y, 1, 0) || open(x, z, y, -1, 0) || open(x, z, y, 0, 1) || open(x, z, y, 0, -1);
// the face's own bay rhythm: a north or south face is read along x, an east or west face along z
const faceAlongX = (x, z, y) => open(x, z, y, 0, 1) || open(x, z, y, 0, -1);

const DOOR_X = 7, DOOR_Z = 0;                            // the entrance on the north front
const BRICK = "bricks", STONE = "smooth_quartz", ROOF = "smooth_stone", FLOOR = "oak_planks", BASE = "stone_bricks";

const isDoor = (x, y, z) => z === DOOR_Z && x === DOOR_X && (y === 2 || y === 3);
const isHood = (x, y, z) => z === DOOR_Z && Math.abs(x - DOOR_X) <= 1 && y === 4;
const isPier = (x, z, y) => faceAlongX(x, z, y) ? x % 3 === 0 || (z === DOOR_Z && Math.abs(x - DOOR_X) === 1) : z % 3 === 0;   // brick piers in threes; the door bay gets its own


const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [key, { ground, roof }] of at) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < ground; y++) put(x, y, z, BASE);                  // foundation, down to the lowest ground under it
  for (let y = ground; y < roof; y++) {
    const k = (y - ground) % 3;                            // storey lines every 3 blocks from the ground
    const outer = exposed(x, z, y);
    if (y === roof - 1) { put(x, y, z, outer ? STONE : ROOF); continue; }      // cornice on the facade, roof cap inside
    if (outer && isHood(x, y, z)) { put(x, y, z, "smooth_quartz_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" }); continue; }
    if (k === 0) { put(x, y, z, outer ? STONE : FLOOR); continue; }       // string course, or a floor slab inside
    if (!outer) continue;                                  // an air gap behind the facade inside
    if (isDoor(x, y, z)) { put(x, y, z, "dark_oak_door", { facing: "north", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (!isPier(x, z, y)) {
      // a pane joins the panes beside it along its own face
      const joins = (dx, dz) => { const nx = x + dx, nz = z + dz; return has(nx, nz) && exposed(nx, nz, y) && !isPier(nx, nz, y) && !isDoor(nx, y, nz) ? "true" : "false"; };
      const along = faceAlongX(x, z, y);
      put(x, y, z, "glass_pane", { north: along ? "false" : joins(0, -1), south: along ? "false" : joins(0, 1), east: along ? joins(1, 0) : "false", west: along ? joins(-1, 0) : "false", waterlogged: "false" });
    } else put(x, y, z, BRICK);
  }
}

// lamps: glowstone on the floor just inside a few windows of the north front (the room behind the glass)
for (const [x, y] of [[4, 2], [10, 2], [4, 5], [10, 5]]) put(x, y, 1, "glowstone");

// roof equipment: two brick flues on the central pavilion
for (const [cx, cz] of [[6, 5], [4, 6]]) {
  const c = at.get(`${cx},${cz}`);
  if (c && c.roof === 10) { put(cx, 10, cz, BRICK); put(cx, 11, cz, BRICK); put(cx, 12, cz, STONE); }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64065.nbt");
console.log("DC64065", g.count(), "blocks");
