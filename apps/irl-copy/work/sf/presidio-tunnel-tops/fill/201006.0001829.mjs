// 3550 West Pacific Ave: a three-storey mixed-use block (1920s stucco with a cornice and a flat roof). Footprint = the
// lidar cells; the lot is flat (every cell's ground is 0), so the building's floor sits on y 0 and the roof cap on y 6.
// Storeys are two blocks: a floor slab (y 0, 2, 4), then the window band (y 1, 3, 5) with an air gap behind the glass;
// the belt courses (y 2, 4) and the cornice (y 6) carry the storey lines. Only the shell is built: exterior walls, the
// slabs, and the air between them. Ground floor is commercial: a continuous shopfront, two entrances with dark-oak doors,
// canopies over them and hanging lanterns. Some windows have a light set in the air gap behind them.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0001829.cells.json`, "utf8"));   // [x, z, ground]
const g = new Voxels([26, 19, 29]);

const ground = new Map(cells.map(([x, z, h]) => [`${x},${z}`, h]));
const inside = (x, z) => ground.has(`${x},${z}`);
const STEP = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };   // from the face into the building
const faceOf = (x, z) => Object.keys(STEP).filter((f) => !inside(x + STEP[f][0], z + STEP[f][1]));
const alongFace = (face) => (face === "north" || face === "south" ? [1, 0] : [0, 1]);
const onSameFace = (x, z, face) => inside(x, z) && faceOf(x, z).includes(face);

// One entrance per street face, on the cell nearest the chosen spot.
const pickDoor = (face, [tx, tz]) => cells
  .filter(([x, z]) => faceOf(x, z).length === 1 && faceOf(x, z)[0] === face)
  .sort((a, b) => (Math.abs(a[0] - tx) + Math.abs(a[1] - tz)) - (Math.abs(b[0] - tx) + Math.abs(b[1] - tz)))[0];
const doors = [[pickDoor("north", [14, 0]), "north"], [pickDoor("east", [25, 9]), "east"]];
const doorKey = new Map(doors.map(([[x, z], face]) => [`${x},${z}`, face]));

const DOOR = (face, half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
const pane = (x, z, face) => {   // a glass pane joins the neighbouring pane or pier along its face
  const [ax, az] = alongFace(face);
  const a = onSameFace(x - ax, z - az, face), b = onSameFace(x + ax, z + az, face);
  const conn = { north: "false", south: "false", east: "false", west: "false" };
  if (ax) { conn.west = String(a); conn.east = String(b); } else { conn.north = String(a); conn.south = String(b); }
  return { ...conn, waterlogged: "false" };
};

for (const [x, z] of cells) {
  const faces = faceOf(x, z), outside = faces.length > 0;
  const door = doorKey.get(`${x},${z}`);
  // Foundation: solid from y 0 up to this cell's ground (none on this lot).
  for (let y = 0; y < ground.get(`${x},${z}`); y++) g.set(x, y, z, "stone_bricks");

  // Floors and belt courses: solid across the footprint, so the interior is closed off storey by storey.
  g.set(x, 0, z, outside ? "stone_bricks" : "smooth_stone");
  for (const y of [2, 4]) g.set(x, y, z, outside ? "smooth_quartz" : "smooth_stone");
  // The cornice cap is the roof edge on the walls; the roof itself is the stone under it.
  g.set(x, 6, z, outside ? "smooth_quartz_slab" : "stone", outside ? { type: "top", waterlogged: "false" } : undefined);
  if (door) g.set(x, 2, z, "dark_oak_door", DOOR(door, "upper"));   // the entrance's upper half sits in the belt course

  for (const y of [1, 3, 5]) {
    if (!outside) continue;   // interior air gap, the glass sits on the face
    if (door && y === 1) { g.set(x, 1, z, "dark_oak_door", DOOR(door, "lower")); continue; }
    // Bays run along the primary face; a stepped outline makes most cells two-faced, so those still take windows.
    const face = faces[0];
    const [ax, az] = alongFace(face);
    const bay = ax ? x : z;
    if (bay % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }   // piers
    g.set(x, y, z, "glass_pane", pane(x, z, face));
  }
}

// Canopies over the entrances, with a hanging lantern beside each door, and a lantern just inside.
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

// Warm light in the air gap behind some windows: shroomlight on the shopfront, glowstone upstairs.
for (const [x, z] of cells) {
  const faces = faceOf(x, z);
  if (faces.length !== 1 || doorKey.has(`${x},${z}`)) continue;
  const face = faces[0], [ix, iz] = [x + INWARD[face][0], z + INWARD[face][1]];
  if (!inside(ix, iz) || faceOf(ix, iz).length) continue;
  for (const y of [1, 3, 5]) {
    const pick = (x * 31 + z * 17 + y * 7) % 6 === 0;
    if (!pick || !g.get(x, y, z) || g.get(x, y, z).block !== "minecraft:glass_pane") continue;
    if (g.get(ix, y, iz)) continue;
    g.set(ix, y, iz, y === 1 ? "shroomlight" : "glowstone");
  }
}

// Roof plant: an iron air-handler unit on the flat roof, two blocks tall with the parapet below.
for (const [x, z] of [[18, 11], [19, 11], [18, 12], [19, 12]]) {
  if (inside(x, z) && !faceOf(x, z).length) g.set(x, 7, z, "iron_block");
}

const { blocks, palette } = g.save(`${DIR}/201006.0001829.nbt`);
console.log(`saved 201006.0001829.nbt: ${blocks} blocks, palette ${palette}`);
