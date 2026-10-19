// 3550 West Pacific Ave: a three-storey Edwardian brick mixed-use block (c. 1910, flat tar roof, cream terracotta
// bands and a cornice, shopfronts on the two street faces, punched window grids above). Footprint = the lidar cells;
// the ground is 0 on the north-east corner, 1 on most of the lot and 2 in one patch, so each cell gets a foundation
// from y 0 up to its ground. Storey lines are absolute, so the roof is one flat plane at y 7 (about 7 blocks above the
// lowest ground): plinth y 0, shop glass and fascia y 1-2, belt y 2, upper windows y 3, belt y 4, windows y 5, cornice y 6.
// Only the shell is built: the exterior walls, the floor slabs, and the air behind the glass. No interiors.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0003232.cells.json`, "utf8"));   // [x, z, ground]
const g = new Voxels([20, 19, 23]);

const ground = new Map(cells.map(([x, z, h]) => [`${x},${z}`, h]));
const inside = (x, z) => ground.has(`${x},${z}`);
const STEP = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };   // from the face into the building
const faceOf = (x, z) => Object.keys(STEP).filter((f) => !inside(x + STEP[f][0], z + STEP[f][1]));
const alongFace = (face) => (face === "north" || face === "south" ? [1, 0] : [0, 1]);
const onSameFace = (x, z, face) => inside(x, z) && faceOf(x, z).includes(face);
const STREET = ["north", "east"];   // the shopfronts face these; the west and south faces are the quieter rear
const isStreet = (x, z) => faceOf(x, z).some((f) => STREET.includes(f));

// One entrance per street face, on the lowest cell nearest the chosen spot (a door sits on the plinth, not a foundation).
const pickDoor = (face, [tx, tz]) => cells
  .filter(([x, z, h]) => h <= 1 && faceOf(x, z).length === 1 && faceOf(x, z)[0] === face)
  .sort((a, b) => (Math.abs(a[0] - tx) + Math.abs(a[1] - tz)) - (Math.abs(b[0] - tx) + Math.abs(b[1] - tz)))[0];
const doors = [[pickDoor("north", [13, 0]), "north"], [pickDoor("east", [19, 6]), "east"]];
const doorKey = new Map(doors.map(([[x, z], face]) => [`${x},${z}`, face]));

const DOOR = (face, half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
const pane = (x, z, face) => {   // a glass pane joins the neighbouring pane or pier along its face
  const [ax, az] = alongFace(face);
  const a = onSameFace(x - ax, z - az, face), b = onSameFace(x + ax, z + az, face);
  const conn = { north: "false", south: "false", east: "false", west: "false" };
  if (ax) { conn.west = String(a); conn.east = String(b); } else { conn.north = String(a); conn.south = String(b); }
  return { ...conn, waterlogged: "false" };
};

// Walls and bands, cell by cell. Piers every third bay carry the window grid; the glass sits in the rest.
for (const [x, z] of cells) {
  const faces = faceOf(x, z), outside = faces.length > 0, h = ground.get(`${x},${z}`);
  const door = doorKey.get(`${x},${z}`), street = isStreet(x, z);
  const face = faces[0], bay = face ? (alongFace(face)[0] ? x : z) : 0;

  // Foundation from y 0 up to this cell's ground, then the plinth (or the interior floor) at y 0.
  for (let y = 0; y < h; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, 0, z, outside ? "polished_granite" : "smooth_stone");

  // Storey lines: the shopfront fascia on the street, cream terracotta belts elsewhere, and the cornice on the top.
  g.set(x, 2, z, !outside ? "smooth_stone" : street ? "dark_oak_planks" : "white_terracotta");
  g.set(x, 4, z, outside ? "white_terracotta" : "smooth_stone");
  g.set(x, 6, z, outside ? "white_terracotta" : "stone");   // roof deck inside, cornice on the edge

  if (door) g.set(x, 2, z, "dark_oak_door", DOOR(door, "upper"));   // the entrance's upper half is in the fascia
  if (!outside) continue;   // interior air gap behind the glass from here up

  for (const y of [1, 3, 5]) {
    if (y === 1 && h >= 2) continue;                       // foundation shows where the ground is high
    if (door && y === 1) { g.set(x, 1, z, "dark_oak_door", DOOR(door, "lower")); continue; }
    if (bay % 3 === 0) { g.set(x, y, z, y === 1 && street ? "dark_oak_log" : "bricks"); continue; }   // piers
    g.set(x, y, z, "glass_pane", pane(x, z, face));
  }
}

// Canopies over the entrances: a dark-oak slab lintel across the door, and a hanging lantern either side.
for (const [[dx, dz], face] of doors) {
  const [ax, az] = alongFace(face);
  for (const k of [-1, 0, 1]) {
    const x = dx + ax * k, z = dz + az * k;
    if (!onSameFace(x, z, face)) continue;
    g.set(x, 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
    if (k !== 0) g.set(x, 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
  const [ix, iz] = [dx + INWARD[face][0], dz + INWARD[face][1]];
  if (inside(ix, iz)) g.set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Warm light in the air gap behind the glass: shroomlights in some shop windows, glowstone upstairs in every other window.
for (const [x, z] of cells) {
  const faces = faceOf(x, z);
  if (faces.length !== 1 || doorKey.has(`${x},${z}`)) continue;
  const face = faces[0], bay = alongFace(face)[0] ? x : z, [ix, iz] = [x + INWARD[face][0], z + INWARD[face][1]];
  if (!inside(ix, iz) || faceOf(ix, iz).length || bay % 3 === 0) continue;   // not a pier, and the cell behind is interior
  if (STREET.includes(face) && ground.get(`${x},${z}`) < 2 && bay % 6 === 1) g.set(ix, 1, iz, "shroomlight");
  if ((x + z) % 2 === 0) g.set(ix, 3, iz, "glowstone");
  if ((x + z) % 3 === 0) g.set(ix, 5, iz, "glowstone");
}

// Roof, from the air: a skylight over the light well, a water tank on the deck, and one plant box, on the deck near the middle.
const [cx, cz] = [9, 11];
const interior2 = (x, z) => [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => inside(a, b) && faceOf(a, b).length === 0);
const sky = [[cx, cz], [cx + 1, cz], [cx, cz + 1], [cx + 1, cz + 1]];
if (interior2(cx, cz)) for (const [x, z] of sky) g.set(x, 6, z, "glass");
if (interior2(cx - 4, cz - 3)) for (const [x, z] of [[cx - 4, cz - 3], [cx - 3, cz - 3], [cx - 4, cz - 2], [cx - 3, cz - 2]]) g.set(x, 7, z, "dark_oak_planks");
if (interior2(cx + 2, cz + 3)) for (const [x, z] of [[cx + 2, cz + 3], [cx + 3, cz + 3], [cx + 2, cz + 4], [cx + 3, cz + 4]]) g.set(x, 7, z, "stone_bricks");

const out = `${DIR}/201006.0003232.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
