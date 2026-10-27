import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s brick-and-plaster commercial block (stripped Classical, the inner-suburb shop-and-flat type of Eden Terrace and
// Mt Eden): a stone plinth, timber-fascia shopfronts on the street floor, a recessed shop door, two cream string courses,
// brick-piered windows with timber transoms, a plaster cornice and parapet. The lidar roof is smoothed and snapped to
// three flat tiers: a two-storey wing (10), the three-storey block (12), and a three-storey block with a roof plant room (13).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332237111.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const g = new Voxels([37, 26, 42]);

const key = (x, z) => `${x},${z}`;
const C = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, g: ground, raw: roof }]));

// Tiers: 3x3 mean of the lidar roof over the footprint, snapped (noise out, setbacks kept)
for (const c of C.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const o = C.get(key(c.x + dx, c.z + dz)); if (o) { sum += o.raw; n++; } }
  const m = sum / n;
  c.T = m < 11 ? 10 : m < 12.5 ? 12 : 13;
}

// A cell's wall faces: the sides onto open air first (kind 0), then the sides onto a lower neighbour, a setback (kind 1)
const SIDES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const faces = (c) => SIDES.flatMap(([side, dx, dz]) => {
  const o = C.get(key(c.x + dx, c.z + dz));
  return !o ? [[side, dx, dz, 0]] : o.T < c.T ? [[side, dx, dz, 1]] : [];
}).sort((a, b) => a[3] - b[3]);
const isWall = (x, z) => { const c = C.get(key(x, z)); return !c || faces(c).length > 0; };

const out = new Map();                       // "x,y,z" -> placement, written at the end so panes can take their connections
const axis = new Map();                      // window pane -> the axis its wall runs along ("x" on N/S walls, "z" on E/W)
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, { x, y, z, block, state });

for (const c of C.values()) {
  const { x, z, g: gr, T } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                  // foundation: solid from y 0 up to this cell's ground

  const fs = faces(c);
  if (!fs.length) {                                                          // interior: floor decks and roof only, no rooms
    put(x, 4, z, "smooth_stone");                                            // storey-2 deck
    if (T >= 12) put(x, 8, z, "smooth_stone");                               // storey-3 deck
    put(x, T - 1, z, "smooth_stone");                                        // flat roof membrane
    if (T === 13 && x % 4 === 1 && z % 4 === 1) {                            // roof plant on the membrane
      put(x, 13, z, "light_gray_concrete"); put(x, 14, z, "light_gray_concrete");
    }
    continue;
  }

  const [side] = fs[0];
  const along = side === "N" || side === "S" ? x : z;                        // position along the wall
  const pier = along % 3 === 0;                                              // a brick pier every third block; windows between
  for (let y = gr; y < T; y++) {
    if (y === gr) put(x, y, z, "stone_bricks");                              // base course
    else if (y < 4) put(x, y, z, pier ? "stone_bricks" : y === 3 ? "dark_oak_planks" : "glass");   // shopfront, timber fascia
    else if (y === 4 || y === 8) put(x, y, z, "quartz_block");               // string courses
    else if (y === T - 1) put(x, y, z, "smooth_quartz");                     // cornice and parapet cap
    else if (pier) put(x, y, z, "bricks");
    else if (y === 6 || (T === 13 && y === 10)) put(x, y, z, "dark_oak_planks");   // timber transom
    else { put(x, y, z, "glass_pane"); axis.set(`${x},${y},${z}`, side === "N" || side === "S" ? "x" : "z"); }
  }
}

// Warm light behind some storey-2 and storey-3 windows: glowstone in the room just inside the glass
for (const c of C.values()) {
  const fs = faces(c);
  if (!fs.length) continue;
  const [side, dx, dz] = fs[0];
  const along = side === "N" || side === "S" ? c.x : c.z;
  if (along % 3 === 0) continue;
  const ix = c.x - dx, iz = c.z - dz;
  if (!C.has(key(ix, iz)) || isWall(ix, iz)) continue;
  if (along % 6 === 1) put(ix, 5, iz, "glowstone");                          // storey 2, row 5
  if (along % 6 === 4 && C.get(key(ix, iz)).T >= 12) put(ix, 9, iz, "glowstone");   // storey 3, row 9
}

// The shop door: on the south front, a ground-level shop bay near the middle of the street face
const doors = [...C.values()].filter((c) => {
  const fs = faces(c);
  return fs.length && fs[0][0] === "S" && c.g === 0 && (c.x % 3) !== 0;
}).sort((a, b) => a.x - b.x);
const door = doors[Math.floor(doors.length / 2)];
if (!door) throw new Error("no south ground-level shop bay for the door");
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
put(door.x, 1, door.z, "dark_oak_door", doorState("lower"));
put(door.x, 2, door.z, "dark_oak_door", doorState("upper"));

// Panes take their connections from the panes beside them on the same wall
for (const p of out.values()) {
  if (p.block !== "glass_pane") continue;
  const a = axis.get(`${p.x},${p.y},${p.z}`);
  const has = (dx, dz) => out.get(`${p.x + dx},${p.y},${p.z + dz}`)?.block === "glass_pane";
  p.state = a === "x"
    ? { north: "false", south: "false", east: String(has(1, 0)), west: String(has(-1, 0)), waterlogged: "false" }
    : { north: String(has(0, -1)), south: String(has(0, 1)), east: "false", west: "false", waterlogged: "false" };
}

for (const p of out.values()) g.set(p.x, p.y, p.z, p.block, p.state);
const res = g.save(`${DIR}/way_332237111.nbt`);
console.log(JSON.stringify({ ...res, cells: C.size, door: [door.x, door.z] }));
