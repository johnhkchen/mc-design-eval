// 3550 West Pacific Av (Miscellaneous / Mixed-Use), Presidio Tunnel Tops.
// Read from the record: a 1910s Classical Revival brick block with stone trim, two storeys over a commercial ground
// floor (a 3-block storey with the shopfront, door-high entrance under a red awning), a stone belt course, a 2-block
// upper storey of sash windows, a smooth cornice on a flat roof at 7 blocks, and two rooftop HVAC units.
// Walls stand solid from y 0 on every footprint cell; the foundation fill below each cell's ground is stone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0001312.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [33, 19, 33];
// Rows: y0 foundation/floor, y1-2 ground storey (door 2 high), y3 belt course and awning line, y4-5 upper storey,
// y6 cornice = roof line at 7 blocks. Interiors are air between the floors, so nothing is solid inside but the slabs.
const FOUNDATION = 0, GROUND_LO = 1, GROUND_HI = 2, BELT = 3, UPPER_LO = 4, UPPER_HI = 5, CORNICE = 6;
const ROOF_EQUIP = 7;

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inside = (x, z) => ground.has(key(x, z));
const NORMALS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const INWARD = { "-1,0": "east", "1,0": "west", "0,-1": "south", "0,1": "north" };   // a door faces in, from the outside
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const shell = (x, z) => inside(x, z) && faces(x, z).length > 0;

// Street side: the south-west edge (faces to -x or +z), commercial at ground; the rest is residential sash.
function facade(x, z) {
  const fs = faces(x, z);
  const street = fs.find(([nx, nz]) => nx === -1 || nz === 1);
  const n = street ?? fs[0];
  return { n, street: !!street, corner: fs.length > 1, along: n[0] !== 0 ? z : x, faces: fs };
}

// One entrance per street face, at the median along-coordinate of that face's street cells.
const streetAlong = new Map();
for (const [x, z] of cells) {
  if (!shell(x, z)) continue;
  const f = facade(x, z);
  if (!f.street) continue;
  const k = `${f.n}`;
  streetAlong.set(k, [...(streetAlong.get(k) ?? []), f.along]);
}
const doorAt = new Map([...streetAlong].map(([k, as]) => [k, as.sort((a, b) => a - b)[Math.floor(as.length / 2)]]));

// Centre of the footprint: the roof equipment sits here, away from the walls.
const cx = Math.round(cells.reduce((s, [x]) => s + x, 0) / cells.length);
const cz = Math.round(cells.reduce((s, [, z]) => s + z, 0) / cells.length);

const pane = (n) => ({ north: String(n[0] === 0), south: String(n[0] === 0), east: String(n[0] !== 0), west: String(n[0] !== 0), waterlogged: "false" });
const door = (n, half) => ({ facing: INWARD[`${n}`], half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels(SIZE);
const counts = { walls: 0, panes: 0, doors: 0, lights: 0, floors: 0 };

for (const [x, z, gr] of cells) {
  // Foundation fill from y 0 up to this cell's ground: nothing floats on a slope.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!shell(x, z)) {
    // Interior: floor slabs at the foundation, the belt and the roof deck; air between.
    g.set(x, FOUNDATION, z, "stone_bricks");
    g.set(x, BELT, z, "smooth_stone");
    g.set(x, CORNICE, z, "light_gray_concrete");
    counts.floors += 2;
    if (x === cx && z === cz) g.set(x, CORNICE, z, "glass");                       // skylight over the stair well
    if ((x === cx - 4 && z === cz + 3) || (x === cx + 5 && z === cz - 3)) g.set(x, ROOF_EQUIP, z, "iron_block");
    continue;
  }

  const f = facade(x, z);
  const along = f.along;
  const m = doorAt.get(`${f.n}`);
  const isDoor = f.street && along === m;
  const awning = f.street && Math.abs(along - m) <= 1;

  // Walls, storey by storey, full height from y 0 (a corner gets a quoin column; the street gets shopfronts).
  g.set(x, FOUNDATION, z, "stone_bricks"); counts.walls++;
  if (isDoor) {
    g.set(x, GROUND_LO, z, "dark_oak_door", door(f.n, "lower"));
    g.set(x, GROUND_HI, z, "dark_oak_door", door(f.n, "upper"));
    counts.doors++;
  } else if (f.corner) {
    g.set(x, GROUND_LO, z, "stone_bricks"); g.set(x, GROUND_HI, z, "stone_bricks");
  } else if (f.street) {
    g.set(x, GROUND_LO, z, "dark_oak_planks");                                  // shopfront bulkhead
    if (along % 3 === 0) g.set(x, GROUND_HI, z, "dark_oak_planks");            // shopfront mullion
    else { g.set(x, GROUND_HI, z, "glass_pane", pane(f.n)); counts.panes++; }
  } else {
    g.set(x, GROUND_LO, z, "stone_bricks");                                     // plinth course
    if (along % 3 === 0) g.set(x, GROUND_HI, z, "bricks");
    else { g.set(x, GROUND_HI, z, "glass_pane", pane(f.n)); counts.panes++; }
  }

  g.set(x, BELT, z, awning ? "red_terracotta" : "smooth_stone");                // string course, awning over the door

  if (f.corner) {
    g.set(x, UPPER_LO, z, "stone_bricks"); g.set(x, UPPER_HI, z, "stone_bricks");
  } else if (along % 3 === 0) {
    g.set(x, UPPER_LO, z, "bricks"); g.set(x, UPPER_HI, z, "bricks");
  } else {
    g.set(x, UPPER_LO, z, "glass_pane", pane(f.n));
    g.set(x, UPPER_HI, z, "glass_pane", pane(f.n));
    counts.panes += 2;
  }
  g.set(x, CORNICE, z, "smooth_stone");

  // Warm light behind some panes: the room inside the glass gets a glowstone on the sill row.
  const inX = x - f.n[0], inZ = z - f.n[1];
  if (!f.corner && !isDoor && along % 3 !== 0 && inside(inX, inZ) && !shell(inX, inZ)) {
    if (along % 9 === 1) { g.set(inX, UPPER_LO, inZ, "glowstone"); counts.lights++; }
    if (f.street && along % 9 === 4) { g.set(inX, GROUND_HI, inZ, "glowstone"); counts.lights++; }
  }
}

const out = `${DIR}/201006.0001312.nbt`;
const info = g.save(out);
console.log(JSON.stringify({ ...counts, ...info, doors: [...doorAt] }));
