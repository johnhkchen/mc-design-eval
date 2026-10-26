// 1600 16th St NW: a 1920s Colonial-Revival brick apartment house. A flat-roofed block on a stone base, with a
// taller centre bay (the lidar's 13) stepping up from the 11-high wings. Storeys are 2 blocks (a window row between
// belt courses), so the 11-high wings read as five storeys and the tower as six. Shell walls are one block thick
// with air behind the glass; a floor slab sits on every belt course. Nothing is built outside the footprint.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80684.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..12, z 0..7

const W = 13, D = 8, H = 25;
const g = new Voxels([W, H, D]);

const C = new Map();                                    // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) C.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => C.has(`${x},${z}`);

// the exterior faces of a footprint cell: N is z-1 (the street front, the door face), S z+1, W x-1, E x+1
function facesOf(x, z) {
  const f = [];
  if (!inF(x, z - 1)) f.push("N");
  if (!inF(x, z + 1)) f.push("S");
  if (!inF(x - 1, z)) f.push("W");
  if (!inF(x + 1, z)) f.push("E");
  return f;
}

const BRICK = "bricks", BASE = "stone_bricks", TRIM = "smooth_quartz", FLOOR = "smooth_stone", ROOF = "stone";
const GLASS = "glass_pane";
const DOOR_FACING = "north";

// the door: the middle bay of the street front (x 6, z 0), two blocks high, with a lintel course above
function doorAt(x, y, z, half) {
  g.set(x, y, z, "dark_oak_door", { facing: DOOR_FACING, half, hinge: "left", open: "false", powered: "false" });
}

for (const [key, { ground, roof }] of C) {
  const [x, z] = key.split(",").map(Number);
  const faces = facesOf(x, z), shell = faces.length > 0, top = roof - 1;
  const along = faces.length === 1 && (faces[0] === "N" || faces[0] === "S") ? x
    : faces.length === 1 ? z : -1;

  for (let y = 0; y <= top; y++) {
    if (y === 0) { g.set(x, y, z, BASE); continue; }                     // foundation, base course, ground floor
    if (y < ground) { g.set(x, y, z, BASE); continue; }
    if (y === top) { g.set(x, y, z, shell ? TRIM : ROOF); continue; }    // coping on the shell, flat tar roof inside
    if (x === 6 && z === 0 && (y === 1 || y === 2)) { doorAt(x, y, z, y === 1 ? "lower" : "upper"); continue; }
    const belt = y % 2 === 0;
    if (!shell) { if (belt) g.set(x, y, z, FLOOR); continue; }            // floor slab per storey, air between
    if (belt) { g.set(x, y, z, TRIM); continue; }                         // string course at every storey line
    const window = along >= 0 && along % 2 === 1 && y < top;             // odd bays on the plain faces
    g.set(x, y, z, window ? GLASS : BRICK);
  }
}

// the porch: the low notch in the street front (x 5) keeps its coping as a stoop wall, with a lantern on it
g.set(5, 2, 0, "lantern", { hanging: "false", waterlogged: "false" });

// penthouse and roof plant: a small box on the tower, and light boxes on the wings
for (const [x, z] of [[8, 2], [9, 2], [8, 3], [9, 3]]) if (inF(x, z)) g.set(x, 13, z, "smooth_stone");
g.set(8, 14, 2, "smooth_stone");
g.set(2, 11, 4, "light_gray_concrete");
g.set(10, 11, 5, "light_gray_concrete");

// warm light: glowstone on the room side of some upper windows (inside the air gap), one shroomlight on the ground floor
for (const [key, { roof }] of C) {
  const [x, z] = key.split(",").map(Number);
  const faces = facesOf(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0], along = face === "N" || face === "S" ? x : z;
  if (along % 2 !== 1) continue;
  for (let y = 3; y < roof - 1; y += 2) {
    if ((x + y + z) % 4 !== 0) continue;
    const [ix, iz] = face === "N" ? [x, z + 1] : face === "S" ? [x, z - 1] : face === "W" ? [x + 1, z] : [x - 1, z];
    if (inF(ix, iz) && !facesOf(ix, iz).length) g.set(ix, y, iz, "glowstone");
  }
}
{
  // one ground-floor room behind the centre-left window of the street front
  const [ix, iz] = [7, 1];
  if (inF(ix, iz) && !facesOf(ix, iz).length) g.set(ix, 1, iz, "shroomlight");
}

// glass panes connect to their neighbours as the game does: to a pane or a solid block on that side
const SOLID = new Set(["bricks", "stone_bricks", "smooth_quartz", "smooth_stone", "stone", "light_gray_concrete", "glowstone", "shroomlight"]);
const bare = (b) => b.replace("minecraft:", "");
for (const [key] of C) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < roofOf(x, z); y++) {
    const here = g.get(x, y, z);
    if (!here || bare(here.block) !== GLASS) continue;
    const side = (dx, dz) => {
      const n = g.get(x + dx, y, z + dz);
      return !!n && (bare(n.block) === GLASS || SOLID.has(bare(n.block)));
    };
    g.set(x, y, z, GLASS, {
      north: String(side(0, -1)), south: String(side(0, 1)), east: String(side(1, 0)), west: String(side(-1, 0)), waterlogged: "false",
    });
  }
}
function roofOf(x, z) { return C.get(`${x},${z}`).roof; }

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80684.nbt";
console.log(g.save(out));
