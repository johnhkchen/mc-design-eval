import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Era: no record, so a 1980s Taipei commercial/office mid-rise (about four storeys
// on a 21-block roof). Light concrete frame with white spandrels, grey tinted glazing,
// stone plinth, a parapet, and a rooftop mechanical penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738256";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 33, D = 19;
const ROOF = 21;   // roof deck top level (absolute y)
const BAY = 5;     // storey height in blocks

const gmap = new Map();
for (const [x, z, gg] of cells) gmap.set(`${x},${z}`, gg);
const inF = (x, z) => gmap.has(`${x},${z}`);
const faces = (x, z) => ({
  n: !inF(x, z - 1),
  s: !inF(x, z + 1),
  w: !inF(x - 1, z),
  e: !inF(x + 1, z),
});
const isEdge = (x, z) => {
  const f = faces(x, z);
  return f.n || f.s || f.w || f.e;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Main body: foundation, walls, interior floors, roof.
for (const [x, z, gg] of cells) {
  if (gg >= ROOF) continue;

  // Foundation up to this cell's ground.
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  const f = faces(x, z);
  const edge = f.n || f.s || f.w || f.e;
  const corner = (f.n || f.s) && (f.e || f.w);
  const idx = (f.n || f.s) ? x : z;
  const pier = corner || idx % 3 === 0;

  for (let y = gg; y < ROOF; y++) {
    if (!edge) {
      // Interior: only floor slabs, otherwise air.
      if (y === gg) put(x, y, z, "smooth_stone");
      else if (y % BAY === 0) put(x, y, z, "gray_concrete");
      continue;
    }
    if (y === gg) {
      put(x, y, z, "stone_bricks");                 // plinth course
    } else if (y % BAY === 0) {
      put(x, y, z, "white_concrete");               // spandrel / storey line
    } else if (pier) {
      put(x, y, z, "light_gray_concrete");          // mullion / pier
    } else if (y - gg < BAY) {
      put(x, y, z, "light_blue_stained_glass_pane"); // shopfront glazing
    } else {
      put(x, y, z, "gray_stained_glass_pane");       // office glazing
    }
  }

  // Roof row: parapet on the edge, deck inside.
  put(x, ROOF, z, edge ? "white_concrete" : "gray_concrete");
}

// Warm lights: glowstone on the floor just behind selected windows.
for (const [x, z, gg] of cells) {
  if (gg >= ROOF || !isEdge(x, z)) continue;
  const f = faces(x, z);
  const corner = (f.n || f.s) && (f.e || f.w);
  const idx = (f.n || f.s) ? x : z;
  const pier = corner || idx % 3 === 0;
  if (pier) continue;

  // Inward direction from the first exposed face.
  let dx = 0, dz = 0;
  if (f.s) dz = -1;
  else if (f.n) dz = 1;
  else if (f.w) dx = 1;
  else if (f.e) dx = -1;

  for (let y = gg + 1; y < ROOF; y++) {
    if (y % BAY === 0) continue;
    const floorY = Math.max(gg, Math.floor(y / BAY) * BAY);
    if (y !== floorY + 1) continue;
    if (((x * 31 + z * 17 + y * 7) % 9) !== 0) continue;
    const ix = x + dx, iz = z + dz;
    if (inF(ix, iz) && !isEdge(ix, iz)) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// Entrance on the south (street) face, nearest the middle.
let door = null;
let best = Infinity;
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const f = faces(x, z);
  if (!f.s) continue;
  const d = Math.abs(x - 10);
  if (d < best) { best = d; door = { x, z }; }
}
if (!door) {
  best = Infinity;
  for (const [x, z] of cells.map(([a, b]) => [a, b])) {
    if (!isEdge(x, z)) continue;
    const d = Math.abs(x - 10);
    if (d < best) { best = d; door = { x, z }; }
  }
}
if (door && gmap.get(`${door.x},${door.z}`) < ROOF - 2) {
  const gd = gmap.get(`${door.x},${door.z}`);
  const doorProps = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(door.x, gd, door.z, "oak_door", { ...doorProps, half: "lower" });
  put(door.x, gd + 1, door.z, "oak_door", { ...doorProps, half: "upper" });
  // Lintel over the door.
  put(door.x, gd + 2, door.z, "white_concrete");
}

// Rooftop mechanical penthouse, centred.
let penthouseOk = true;
for (let x = 7; x <= 13; x++)
  for (let z = 6; z <= 12; z++)
    if (!inF(x, z)) penthouseOk = false;

if (penthouseOk) {
  for (let x = 7; x <= 13; x++) {
    for (let z = 6; z <= 12; z++) {
      const corner = (x === 7 || x === 13) && (z === 6 || z === 12);
      const side = x === 7 || x === 13 || z === 6 || z === 12;
      // Walls at y 22..25.
      if (side) {
        for (let y = 22; y <= 25; y++) {
          if (corner) put(x, y, z, "light_gray_concrete");
          else if (y === 22 || y === 25) put(x, y, z, "white_concrete");
          else put(x, y, z, "gray_stained_glass_pane");
        }
      }
      // Roof cap.
      put(x, 26, z, "smooth_stone");
    }
  }
  // Lightning rod on the penthouse.
  const rod = { facing: "up", powered: "false", waterlogged: "false" };
  put(10, 27, 9, "lightning_rod", rod);
  put(10, 28, 9, "lightning_rod", rod);
}

// Two rooftop AC units, only where the roof exists.
const units = [[2, 13], [16, 4]];
for (const [ux, uz] of units) {
  let ok = true;
  for (let x = ux; x <= ux + 1; x++)
    for (let z = uz; z <= uz + 1; z++)
      if (!inF(x, z)) ok = false;
  if (!ok) continue;
  for (let x = ux; x <= ux + 1; x++)
    for (let z = uz; z <= uz + 1; z++) {
      put(x, 22, z, "light_gray_concrete");
      put(x, 23, z, "iron_block");
    }
}

g.save(`${DIR}/${ID}.nbt`);
