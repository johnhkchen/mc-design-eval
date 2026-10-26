// 1129 20th St NW: a five-storey mid-century office block in brick between white concrete spandrels, on a stone base,
// with a glazed penthouse set back on the central core (lidar 17) and a stone parapet on the ring roof (lidar 15-16).
// Storeys are 3 blocks: a floor slab, two rows of window bay (one under the spandrel course), then the next floor line.
// Every layer is a slab or a wall on the layer below; the ground layer is solid under the whole footprint.
// The entrance is on the north face (z = 0), the notch in the north-east corner is the lidar's cut-out.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57550.cells.json`, "utf8"));

const W = 17, H = 29, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr, roof] of cells) foot.set(key(x, z), { gr, roof });
const FOOT = new Set(foot.keys());

// The penthouse: the 17-block core of the lidar, one cell in from the ring so it steps back from the parapet.
const PEN = new Set();
for (let x = 6; x <= 11; x++) for (let z = 3; z <= 15; z++) PEN.add(key(x, z));
for (const k of PEN) if (!(foot.get(k).roof >= 16)) throw new Error(`penthouse cell ${k} sits below the core`);

// Which outer faces a cell of set S shows: N = -z (front), S = +z, W = -x, E = +x. Empty = interior.
const faces = (x, z, S) => {
  const f = [];
  if (!S.has(key(x, z - 1))) f.push("N");
  if (!S.has(key(x, z + 1))) f.push("S");
  if (!S.has(key(x - 1, z))) f.push("W");
  if (!S.has(key(x + 1, z))) f.push("E");
  return f;
};
// A window bay on a single face: piers (brick) every third cell along the face, corners stay solid.
const bayOf = (x, z, S) => {
  const f = faces(x, z, S);
  if (f.length !== 1) return null;
  const k = f[0] === "N" || f[0] === "S" ? x : z;
  return k % 3 === 0 ? null : f[0];
};
// the glass pane's connections run along its wall
const paneState = (f) => (f === "N" || f === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
// one step from the wall into the air gap behind the glass
const inward = (f) => ({ N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] })[f];

const BRICK = "bricks", SPANDREL = "white_concrete", BASE = "stone_bricks", FLOOR = "smooth_stone";
const DECK = "stone", GLASS = "light_blue_stained_glass_pane", PARAPET = "stone_bricks";
const WINDOW_ROWS = [1, 2, 4, 5, 7, 8, 10, 11, 13];
const FLOOR_ROWS = [0, 3, 6, 9, 12];

// 1. Floor slabs over the whole footprint, and the roof deck at y 14 (the top of storey five)
for (const k of FOOT) {
  const [x, z] = k.split(",").map(Number);
  for (const y of FLOOR_ROWS) g.set(x, y, z, FLOOR);
  g.set(x, 14, z, DECK);
}

// 2. Outer walls on the footprint's edge: stone base, brick between white spandrels, glazed bays, white cornice at 14
for (const k of FOOT) {
  const [x, z] = k.split(",").map(Number);
  if (!faces(x, z, FOOT).length) continue;
  const bay = bayOf(x, z, FOOT);
  g.set(x, 0, z, BASE);
  for (const y of [3, 6, 9, 12, 14]) g.set(x, y, z, SPANDREL);
  for (const y of WINDOW_ROWS) {
    if (bay) g.set(x, y, z, GLASS, paneState(bay));
    else g.set(x, y, z, BRICK);
  }
}

// 3. Entrance on the north face: door at x 8 in a stone surround, stone entablature over it
g.set(8, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(8, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [7, 9]) for (const y of [1, 2]) g.set(x, y, 0, BASE);
for (let x = 6; x <= 10; x++) g.set(x, 3, 0, BASE);
g.set(8, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Penthouse: glazed walls at 15 on the stepped-back core, stone cap at 16 over the whole core
for (const k of PEN) {
  const [x, z] = k.split(",").map(Number);
  g.set(x, 16, z, PARAPET);
  if (!faces(x, z, PEN).length) continue;
  const bay = bayOf(x, z, PEN);
  if (bay) g.set(x, 15, z, GLASS, paneState(bay));
  else g.set(x, 15, z, BRICK);
}

// 5. Parapet on the ring roof, 1 block above the storey-five deck
for (const k of FOOT) {
  const [x, z] = k.split(",").map(Number);
  if (faces(x, z, FOOT).length) g.set(x, 15, z, PARAPET);
}

// 6. Roof plant on the ring roof, inside the parapet and clear of the penthouse
for (const [x, z] of [[2, 9], [3, 9], [2, 10], [3, 10], [13, 13], [14, 13]]) {
  if (!PEN.has(key(x, z)) && !faces(x, z, FOOT).length) g.set(x, 15, z, "light_gray_concrete");
}

// 7. Warm light: a glowstone in the air gap behind some windows, shroomlight behind some penthouse glass
for (const k of FOOT) {
  const [x, z] = k.split(",").map(Number);
  const bay = bayOf(x, z, FOOT);
  if (!bay) continue;
  const [dx, dz] = inward(bay);
  const ix = x + dx, iz = z + dz;
  if (!FOOT.has(key(ix, iz)) || faces(ix, iz, FOOT).length) continue;
  for (const y of WINDOW_ROWS) if ((x * 5 + z * 3 + y) % 13 === 0) g.set(ix, y, iz, "glowstone");
}
for (const k of PEN) {
  const [x, z] = k.split(",").map(Number);
  const bay = bayOf(x, z, PEN);
  if (!bay || (x + z) % 3 !== 0) continue;
  const [dx, dz] = inward(bay);
  const ix = x + dx, iz = z + dz;
  if (PEN.has(key(ix, iz)) && !faces(ix, iz, PEN).length) g.set(ix, 15, iz, "shroomlight");
}

const stats = g.save(`${DIR}/DC57550.nbt`);
console.log(`DC57550.nbt: ${stats.blocks} blocks, palette ${stats.palette}`);
