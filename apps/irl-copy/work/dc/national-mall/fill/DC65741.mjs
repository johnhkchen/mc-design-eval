import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s stripped-classical office block of the Federal Triangle type: granite plinth, limestone walls in piers and
// window bays, smooth-stone string courses every 3 blocks (storeys at y 1..3, 4..6, 7..9), a cornice at y 10, and a
// one-course attic pavilion over the lidar's 12-block centre (x 5..7, z 1..3). The main front is the z = 5 face (the
// street side), with a central door, lintel and lanterns. Interior is air except the floor slabs at y 4, 7, 10.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65741.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const g = new Voxels([11, 24, 6]);

const PLINTH = "polished_granite", BASE = "stone_bricks", LIMESTONE = "calcite", STRING = "smooth_stone";
const GLASS = "glass_pane", LAMP = "glowstone";
const LANTERN = { hanging: "false", waterlogged: "false" };
const FLOORS = [4, 7, 10]; // floor slab / string course rows, the air between is each storey's gap behind the glass
const TOP = 10; // body top (the cornice); the pavilion adds one attic course at 11

const inside = new Set(cells.map(([x, z]) => `${x},${z}`));
const isIn = (x, z) => inside.has(`${x},${z}`);
const ring = (x, z) => !isIn(x - 1, z) || !isIn(x + 1, z) || !isIn(x, z - 1) || !isIn(x, z + 1);

// the faces a perimeter cell exposes, and the index along the face (x on a z face, z on an x face)
function faces(x, z) {
  return { N: !isIn(x, z - 1), S: !isIn(x, z + 1), W: !isIn(x - 1, z), E: !isIn(x + 1, z) };
}

// the pane's join: east-west on a z face, north-south on an x face
const pane = (onZ) => (onZ ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });

// the storey string rows: a floor slab in the interior, the cornice ring at the edge
const isFloor = (y) => FLOORS.includes(y);

for (const [x, z, ground, roof] of cells) {
  // foundation: solid from y 0 up to the cell's ground, the plinth at y 0 wherever the ground is level
  for (let y = 0; y < Math.max(1, ground); y++) g.set(x, y, z, PLINTH);

  const pav = roof >= 12;
  const top = pav ? 11 : TOP;
  const f = faces(x, z);
  const perimeter = ring(x, z);
  const onZ = f.N || f.S;
  const corner = (f.N || f.S) && (f.E || f.W);
  const i = onZ ? x : z; // index along the exposed face
  const pier = corner || i % 2 === 0; // limestone piers, glass bays between

  for (let y = 1; y <= top; y++) {
    if (!perimeter) {
      if (isFloor(y) || (pav && y === 11)) g.set(x, y, z, STRING); // floor slabs and the pavilion deck; air otherwise
      continue;
    }
    if (pav && y === 11) { g.set(x, y, z, pier ? LIMESTONE : GLASS, pier ? undefined : { ...pane(onZ) }); continue; }
    if (isFloor(y) || y === TOP) { g.set(x, y, z, STRING); continue; }
    if (y === 1) { g.set(x, y, z, BASE); continue; }
    // window band: y 2..3, 5..6, 8..9
    if (pier) g.set(x, y, z, LIMESTONE);
    else g.set(x, y, z, GLASS, pane(onZ));
  }
}

// the entrance on the z = 5 street face: iron doors at x 5, a stone lintel over, lanterns on the piers either side
const door = (y) => ({ facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
g.set(5, 1, 5, "iron_door", door(1));
g.set(5, 2, 5, "iron_door", door(2));
for (let x = 4; x <= 6; x++) g.set(x, 3, 5, STRING);
g.set(4, 2, 5, "lantern", LANTERN);
g.set(6, 2, 5, "lantern", LANTERN);

// warm light in some storey-2 and storey-3 windows: glowstone just inside the glass, in the air gap behind it
const inward = (x, z) => {
  const f = faces(x, z);
  if (f.S) return [x, z - 1];
  if (f.N) return [x, z + 1];
  if (f.E) return [x - 1, z];
  return [x + 1, z];
};
for (const [x, z] of cells) {
  if (!ring(x, z)) continue;
  const f = faces(x, z);
  const onZ = f.N || f.S;
  const corner = (f.N || f.S) && (f.E || f.W);
  const i = onZ ? x : z;
  if (corner || i % 2 === 0 || (x === 5 && z === 5)) continue; // glass bays only, not the door
  if ((i + Math.floor(z / 2)) % 3 !== 0) continue;
  const [ix, iz] = inward(x, z);
  if (!isIn(ix, iz) || ring(ix, iz)) continue;
  for (const y of [5, 6]) if (!g.get(ix, y, iz)) g.set(ix, y, iz, LAMP);
}

// roof plant on the cornice of the body (not the pavilion), two small iron units clear of the parapet edge
for (const [x, z] of [[2, 3], [3, 3], [8, 3], [9, 3]]) g.set(x, 11, z, "polished_andesite");

const saved = g.save(`${DIR}/DC65741.nbt`);
console.log(JSON.stringify(saved));
