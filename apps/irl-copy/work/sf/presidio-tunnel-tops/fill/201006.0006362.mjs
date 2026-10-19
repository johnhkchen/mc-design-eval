// 3550 West Pacific Ave: a two-storey brick mixed-use block (1920s, Army-era brick with sandstone string courses and a
// cornice, flat roof). Footprint = the lidar cells; the lot falls from ground 0 to 2 across the footprint, so every cell
// gets a foundation up to its ground and the building's floor line sits on each cell's own ground. The roof cap is
// absolute (y 5) and the storeys are two blocks: floor slabs at y 0 (or the cell's ground) and 2, window rows at y 1 and
// 3 with an air gap behind the glass, the string course at y 2 and the cornice at y 4. Only the shell is built: exterior
// walls, the floor slabs and the air between them. Ground floor is commercial along the street (south) face: a
// continuous shopfront under a dark-oak canopy, with a door at the middle of the front and one on the west side. Some
// windows have a light set in the air gap behind them; two roof units sit on the flat roof.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0006362.cells.json`, "utf8"));   // [x, z, ground]
const g = new Voxels([14, 17, 15]);

const ground = new Map(cells.map(([x, z, h]) => [`${x},${z}`, h]));
const inside = (x, z) => ground.has(`${x},${z}`);
const STEP = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };   // from the face into the building
const faceOf = (x, z) => Object.keys(STEP).filter((f) => !inside(x + STEP[f][0], z + STEP[f][1]));
const alongFace = (face) => (face === "north" || face === "south" ? [1, 0] : [0, 1]);
const onSameFace = (x, z, face) => inside(x, z) && faceOf(x, z).includes(face);

// Entrances sit on the lowest cell nearest the chosen spot, so each door has a step-free threshold.
const pickDoor = (face, [tx, tz]) => {
  const on = cells.filter(([x, z]) => faceOf(x, z).length === 1 && faceOf(x, z)[0] === face);
  const lowest = Math.min(...on.map(([, , h]) => h));
  return on.filter(([, , h]) => h === lowest)
    .sort((a, b) => (Math.abs(a[0] - tx) + Math.abs(a[1] - tz)) - (Math.abs(b[0] - tx) + Math.abs(b[1] - tz)))[0];
};
const doors = [[pickDoor("south", [9, 13]), "south"], [pickDoor("west", [0, 10]), "west"]];
const doorKey = new Map(doors.map(([[x, z], face]) => [`${x},${z}`, face]));

const DOOR = (face, half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
const pane = (x, z, face) => {   // a glass pane joins the neighbouring pane or pier along its face
  const [ax, az] = alongFace(face);
  const a = onSameFace(x - ax, z - az, face), b = onSameFace(x + ax, z + az, face);
  const conn = { north: "false", south: "false", east: "false", west: "false" };
  if (ax) { conn.west = String(a); conn.east = String(b); } else { conn.north = String(a); conn.south = String(b); }
  return { ...conn, waterlogged: "false" };
};

// Bays run along the primary face in pairs of panes between brick piers that are two cells wide.
const bayOf = (x, z, face) => { const [ax] = alongFace(face); return ((ax ? x : z) % 4 + 4) % 4; };
const isPier = (x, z, face) => { const b = bayOf(x, z, face); return b === 0 || b === 3; };

for (const [x, z, h] of cells) {
  const faces = faceOf(x, z), outside = faces.length > 0;
  const face = faces[0];
  const door = doorKey.get(`${x},${z}`);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < h; y++) g.set(x, y, z, "stone_bricks");

  if (!outside) {
    // Interior: a floor slab per storey and a flat roof deck; the air gaps between are left open.
    for (const y of new Set([h, 2, 4])) g.set(x, y, z, y === 4 ? "gray_concrete" : "smooth_stone");
    continue;
  }

  // Walls, from the cell's ground to the cornice.
  for (let y = h; y <= 4; y++) {
    if (y === h) g.set(x, y, z, "stone_bricks");                     // plinth course
    else if (y === 4) g.set(x, y, z, "smooth_sandstone");           // cornice
    else if (y === 2) g.set(x, y, z, "smooth_sandstone");           // string course between the storeys
    else if (y === 1 || y === 3) {                                  // window rows: glass between piers
      if (isPier(x, z, face)) g.set(x, y, z, "bricks");
      else g.set(x, y, z, "glass_pane", pane(x, z, face));
    }
    else g.set(x, y, z, "bricks");
  }

  // Shopfront along the street: mullions in dark oak, a canopy at y 2 over the glass.
  if (face === "south" && h === 0) {
    if (door) {
      g.set(x, 0, z, "dark_oak_door", DOOR(door, "lower"));
      g.set(x, 1, z, "dark_oak_door", DOOR(door, "upper"));
    } else if (isPier(x, z, face)) {
      g.set(x, 1, z, "dark_oak_planks");
    } else {
      g.set(x, 1, z, "glass_pane", pane(x, z, face));
    }
    g.set(x, 2, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
  // The west door on its cell: a lower and upper half in the plinth and the first window row.
  if (door && face === "west") {
    g.set(x, h, z, "dark_oak_door", DOOR(door, "lower"));
    g.set(x, h + 1, z, "dark_oak_door", DOOR(door, "upper"));
  }
  if (door && face === "west" && h === 0) g.set(x, 2, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// Lanterns on the shopfront, one either side of the street door, hung under the canopy line.
for (const [[dx, dz], face] of doors.filter(([, f]) => f === "south")) {
  const [ax] = alongFace(face);
  for (const k of [-1, 1]) {
    const x = dx + (ax ? k : 0), z = dz + (ax ? 0 : k);
    if (onSameFace(x, z, face) && !isPier(x, z, face)) g.set(x, 1, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}
// A lantern just inside each door.
for (const [[dx, dz], face] of doors) {
  const [ix, iz] = [dx + INWARD[face][0], dz + INWARD[face][1]];
  if (inside(ix, iz)) g.set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Warm light in the air gap behind some windows: glowstone on the shopfront storey, shroomlight upstairs.
for (const [x, z, h] of cells) {
  const faces = faceOf(x, z);
  if (faces.length !== 1 || doorKey.has(`${x},${z}`)) continue;
  const face = faces[0], [ix, iz] = [x + INWARD[face][0], z + INWARD[face][1]];
  if (!inside(ix, iz) || faceOf(ix, iz).length) continue;
  for (const y of [1, 3]) {
    const pane_ = g.get(x, y, z);
    if (!pane_ || pane_.block !== "minecraft:glass_pane") continue;
    if ((x * 31 + z * 17 + y * 7) % 3 !== 0) continue;
    if (g.get(ix, y, iz)) continue;
    g.set(ix, y, iz, y === 1 ? "glowstone" : "shroomlight");
  }
}

// Roof plant: two air-handler units on the flat roof, one block above the cornice.
for (const [x, z] of [[4, 10], [5, 10], [4, 11], [5, 11], [9, 6], [10, 6]]) {
  if (inside(x, z) && !faceOf(x, z).length) g.set(x, 5, z, "iron_block");
}

const { blocks, palette } = g.save(`${DIR}/201006.0006362.nbt`);
console.log(`saved 201006.0006362.nbt: ${blocks} blocks, palette ${palette}`);
